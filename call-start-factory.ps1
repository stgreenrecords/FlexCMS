[CmdletBinding()]
param(
    [ValidateSet('manual', 'auto')]
    [string]$Adapter = 'auto',

    [switch]$DryRun,

    [string]$TaskId,

    [string]$Role,

    [int]$MaxIterations = 300,

    [string]$BashPath
)

$ErrorActionPreference = 'Stop'

function Resolve-BashExecutable {
    param([string]$PreferredPath)

    if ($PreferredPath) {
        return (Resolve-Path -LiteralPath $PreferredPath).Path
    }

    foreach ($candidate in @('bash.exe', 'bash')) {
        $command = Get-Command -Name $candidate -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($command) {
            return $command.Source
        }
    }

    foreach ($fallback in @(
        'C:\Program Files\Git\bin\bash.exe',
        'C:\Program Files\Git\usr\bin\bash.exe'
    )) {
        if (Test-Path -LiteralPath $fallback) {
            return $fallback
        }
    }

    throw 'Unable to locate bash.exe. Install Git Bash or pass -BashPath explicitly.'
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$bashExecutable = Resolve-BashExecutable -PreferredPath $BashPath

$routerScript = Join-Path $scriptDir 'df\agent-router\start-factory.bash'
if (-not (Test-Path -LiteralPath $routerScript)) {
    throw "Router start script not found under $scriptDir\df\agent-router"
}

# Translate the Windows path into the MSYS form that bash expects.
$routerScriptUnix = (& $bashExecutable -c "cygpath -u `"$routerScript`"" ).Trim()
if (-not $routerScriptUnix) {
    $routerScriptUnix = $routerScript -replace '\\', '/'
}

$bashArgs = @('-c')
$inner = @("'$routerScriptUnix'", "--adapter", $Adapter, "--max-iterations", $MaxIterations)
if ($TaskId)  { $inner += @('--task-id', $TaskId) }
if ($Role)    { $inner += @('--role', $Role) }
if ($DryRun)  { $inner += '--dry-run' }
$bashArgs += ($inner -join ' ')

# Set CWD to the repo root for the bash child. Do NOT use -l: a login shell
# sources ~/.bash_profile which on many Git-for-Windows installs cd's to $HOME
# and breaks every relative path the router resolves.
Push-Location -LiteralPath $scriptDir
try {
    & $bashExecutable @bashArgs
}
finally {
    Pop-Location
}
exit $LASTEXITCODE
