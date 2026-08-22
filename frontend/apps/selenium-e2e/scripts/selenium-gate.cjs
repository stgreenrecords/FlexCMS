#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const appRoot = path.resolve(__dirname, '..');
const reportsDir = path.join(appRoot, 'reports');
const junitDir = path.join(reportsDir, 'junit');
const screenshotsDir = path.join(reportsDir, 'screenshots');
const retainedRoot = path.join(reportsDir, 'retained');
const traceabilityConfigPath = path.join(appRoot, 'config', 'traceability-priority.json');

function parseMode() {
  const modeArg = process.argv.find((arg) => arg.startsWith('--mode='));
  const modeValue = modeArg ? modeArg.split('=')[1] : process.argv[process.argv.indexOf('--mode') + 1];
  if (!modeValue || !['smoke', 'full'].includes(modeValue)) {
    console.error('Usage: node scripts/selenium-gate.cjs --mode <smoke|full>');
    process.exit(2);
  }
  return modeValue;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

// Gate suites run through a shell. On Windows the package manager resolves to
// `pnpm.cmd`, which `spawnSync` cannot launch directly: the extensionless name
// fails with ENOENT, and naming the `.cmd` fails with EINVAL because modern Node
// refuses to spawn batch files unshelled (batch-argument-injection hardening).
// Using a shell is safe here because the command is built only from the
// whitelisted script names in MODE_SCRIPTS — no caller input reaches the shell.

const MODE_SCRIPTS = {
  smoke: ['test:smoke:ci'],
  full: ['test:templates:ci', 'test:admin:ci', 'test:reb18:ci', 'test:reb19:ci', 'test:reb20:ci', 'test:reb26:ci'],
};

function runScript(scriptName, logPath) {
  if (!Object.values(MODE_SCRIPTS).some((scripts) => scripts.includes(scriptName))) {
    throw new Error(`Refusing to run unknown gate script: ${scriptName}`);
  }

  // Passed as one command string rather than command + args: with `shell: true`
  // Node deprecates the args form (DEP0190) because it concatenates without
  // escaping. The string is built only from the whitelisted script name above.
  const result = cp.spawnSync(`pnpm run ${scriptName}`, {
    cwd: appRoot,
    encoding: 'utf8',
    env: { ...process.env, CI: 'true' },
    maxBuffer: 1024 * 1024 * 20,
    shell: true,
  });

  const content = [
    `$ pnpm run ${scriptName}`,
    '',
    result.stdout || '',
    result.stderr || '',
    result.error ? `spawn error: ${result.error.message}` : '',
  ].join('\n');
  fs.writeFileSync(logPath, content, 'utf8');

  if (result.error) {
    throw new Error(`Script could not be started: ${scriptName} (${result.error.message}). Log: ${logPath}`);
  }

  if (result.status !== 0) {
    throw new Error(
      `Script failed: ${scriptName} (exit ${result.status ?? 'signal ' + result.signal}). Log: ${logPath}`,
    );
  }
}

function listFilesRecursive(rootPath) {
  if (!fs.existsSync(rootPath)) {
    return [];
  }
  const stack = [rootPath];
  const files = [];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function copyIfExists(sourcePath, targetPath) {
  if (!fs.existsSync(sourcePath)) {
    return;
  }
  ensureDir(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
}

function retainArtifacts(mode, logsDir) {
  const targetRoot = path.join(retainedRoot, mode);
  const targetJunit = path.join(targetRoot, 'junit');
  const targetScreenshots = path.join(targetRoot, 'screenshots');
  const targetLogs = path.join(targetRoot, 'logs');

  ensureDir(targetJunit);
  ensureDir(targetScreenshots);
  ensureDir(targetLogs);

  const junitFiles = listFilesRecursive(junitDir).filter((file) => file.endsWith('.xml'));
  for (const filePath of junitFiles) {
    copyIfExists(filePath, path.join(targetJunit, path.basename(filePath)));
  }

  const screenshotFiles = listFilesRecursive(screenshotsDir);
  for (const filePath of screenshotFiles) {
    const relativePath = path.relative(screenshotsDir, filePath);
    copyIfExists(filePath, path.join(targetScreenshots, relativePath));
  }

  const logFiles = listFilesRecursive(logsDir);
  for (const filePath of logFiles) {
    copyIfExists(filePath, path.join(targetLogs, path.basename(filePath)));
  }

  return {
    artifactRoot: targetRoot,
    junitCount: junitFiles.length,
    screenshotCount: screenshotFiles.length,
    logCount: logFiles.length,
  };
}

function loadTraceabilityRows(mode) {
  const rows = JSON.parse(fs.readFileSync(traceabilityConfigPath, 'utf8'));
  if (mode === 'smoke') {
    return [];
  }
  return rows.filter((row) => row.priority === 'critical' || row.priority === 'high');
}

function parseJUnitTestNames(junitPath) {
  if (!fs.existsSync(junitPath)) {
    return [];
  }
  const xml = fs.readFileSync(junitPath, 'utf8');
  const names = [];
  const testcaseRegex = /<testcase[^>]*(?:\s|<)name="([^"]+)"/g;
  let match;
  while ((match = testcaseRegex.exec(xml)) !== null) {
    names.push(match[1]);
  }
  return names;
}

function assertTraceabilityCoverage(mode) {
  const rows = loadTraceabilityRows(mode);
  const missing = [];

  for (const row of rows) {
    const junitPath = path.join(junitDir, row.junitFile);
    const testNames = parseJUnitTestNames(junitPath);
    const matched = testNames.some((name) => name.includes(row.nameIncludes));
    if (!matched) {
      missing.push(`${row.traceabilityId} (${row.priority}) -> ${row.junitFile}`);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Uncovered critical/high traceability rows:\n- ${missing.join('\n- ')}`,
    );
  }
}

function writeSummary(mode, logsDir, artifactResult) {
  const summaryPath = path.join(retainedRoot, mode, 'summary.json');
  const summary = {
    mode,
    timestamp: new Date().toISOString(),
    reportsDir,
    logsDir,
    artifactRoot: artifactResult.artifactRoot,
    junitCount: artifactResult.junitCount,
    screenshotCount: artifactResult.screenshotCount,
    logCount: artifactResult.logCount,
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n', 'utf8');
}

function main() {
  const mode = parseMode();
  const modeScripts = MODE_SCRIPTS[mode];

  const logsDir = path.join(reportsDir, 'logs', mode);
  ensureDir(logsDir);

  try {
    for (const scriptName of modeScripts) {
      const safeName = scriptName.replace(/[:/]/g, '_');
      runScript(scriptName, path.join(logsDir, `${safeName}.log`));
    }

    assertTraceabilityCoverage(mode);

    const artifactResult = retainArtifacts(mode, logsDir);
    writeSummary(mode, logsDir, artifactResult);

    console.log(`Selenium ${mode} gate passed. Artifacts: ${artifactResult.artifactRoot}`);
  } catch (error) {
    const artifactResult = retainArtifacts(mode, logsDir);
    writeSummary(mode, logsDir, artifactResult);
    console.error(String(error instanceof Error ? error.message : error));
    process.exit(1);
  }
}

main();

