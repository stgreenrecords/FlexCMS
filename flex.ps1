<#
.SYNOPSIS
  FlexCMS CLI — single command to manage local development services.

.DESCRIPTION
  Start/stop infrastructure + backend + frontend services with a clean CLI.
  Each backend/frontend service launches in its own terminal window.

.EXAMPLE
  flex start local all                    # Everything (infra + author + publish + admin)
  flex start local author                 # Infra + Author only
  flex start local author publish         # Infra + Author + Publish
  flex start local author admin           # Infra + Author + Admin UI
  flex start local author,publish,admin   # Comma-separated also works
  flex start local infra                  # Infrastructure containers only
  flex stop local                         # Stop everything
  flex status                             # Health-check all services
  flex logs author                        # Tail author log
  flex logs publish                       # Tail publish log
  flex logs admin                         # Tail admin UI log
#>

# ─── Parse arguments ──────────────────────────────────────────────────────────
$Command  = if ($args.Count -ge 1) { $args[0].ToLower() } else { "help" }
$SubCmd   = if ($args.Count -ge 2) { $args[1].ToLower() } else { "" }

# Collect service names from args[2..N], supporting both space-separated and comma-separated
$ServiceArgs = @()
for ($i = 2; $i -lt $args.Count; $i++) {
    $args[$i] -split "[,;\s]+" | ForEach-Object {
        $t = $_.Trim().ToLower()
        if ($t -ne "") { $ServiceArgs += $t }
    }
}

# ─── Paths ────────────────────────────────────────────────────────────────────
$ErrorActionPreference = "Continue"
$RootDir     = Split-Path -Parent $MyInvocation.MyCommand.Path
$FlexcmsDir  = Join-Path $RootDir "flexcms"
$FrontendDir = Join-Path $RootDir "frontend"
$ComposeFile = Join-Path (Join-Path (Join-Path $RootDir "infra") "local") "docker-compose.dev.yml"
$ComposeDir  = Join-Path (Join-Path $RootDir "infra") "local"
$LogDir      = Join-Path $RootDir ".dev-logs"

# ─── Service alias map (pim/dam/cms → author since they're in the same JAR) ──
$AliasMap = @{
    "pim"     = "author"
    "dam"     = "author"
    "cms"     = "author"
    "frontend"= "admin"
    "ui"      = "admin"
}

$ValidServices = @("infra", "author", "publish", "admin")

function Resolve-Services([string[]]$raw) {
    if ($raw.Count -eq 0 -or ($raw.Count -eq 1 -and $raw[0] -eq "all")) {
        return $ValidServices
    }
    $resolved = @("infra")  # always include infra
    foreach ($s in $raw) {
        $mapped = if ($AliasMap.ContainsKey($s)) { $AliasMap[$s] } else { $s }
        if ($mapped -notin $ValidServices) {
            Write-Host "  Unknown service: '$s'" -ForegroundColor Red
            Write-Host "  Valid: all, infra, author, publish, admin, pim, dam, cms, ui" -ForegroundColor DarkGray
            exit 1
        }
        if ($mapped -notin $resolved) { $resolved += $mapped }
    }
    return $resolved
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

function Ensure-Env {
    $envFile  = Join-Path $ComposeDir ".env"
    $envLocal = Join-Path $ComposeDir ".env.local"
    if (-not (Test-Path $envFile)) {
        if (Test-Path $envLocal) {
            Copy-Item $envLocal $envFile
        } else {
            Set-Content $envFile "POSTGRES_USER=flexcms`nPOSTGRES_PASSWORD=flexcms"
        }
    }
}

function Ensure-LogDir {
    if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }
}

function Write-Banner([string]$msg) {
    $line = "-" * 56
    Write-Host ""
    Write-Host "  $line" -ForegroundColor DarkCyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "  $line" -ForegroundColor DarkCyan
    Write-Host ""
}

function Write-Svc([string]$name, [string]$url, [string]$note) {
    $pad = $name.PadRight(26)
    Write-Host "    $pad $url" -ForegroundColor White -NoNewline
    if ($note) { Write-Host "  $note" -ForegroundColor DarkGray } else { Write-Host "" }
}

# ─── Service Launchers ────────────────────────────────────────────────────────

function Start-Infra {
    Write-Banner "Infrastructure  (PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch)"
    Ensure-Env
    $oldPref = $ErrorActionPreference; $ErrorActionPreference = "SilentlyContinue"
    docker compose -f $ComposeFile up -d 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
    $ErrorActionPreference = $oldPref

    Write-Host "    Waiting for healthy..." -ForegroundColor Yellow -NoNewline
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep 2
        $pg    = docker exec flexcms-postgres pg_isready -U flexcms 2>&1 | Out-String
        $redis = docker exec flexcms-redis redis-cli ping 2>&1 | Out-String
        if ($pg -match "accepting" -and $redis -match "PONG") {
            Write-Host " OK" -ForegroundColor Green
            return
        }
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
    Write-Host " still starting (check 'flex status')" -ForegroundColor Yellow
}

function Launch-InWindow([string]$title, [string]$workDir, [string]$cmd, [string]$logName) {
    Ensure-LogDir
    $logFile = Join-Path $LogDir "$logName.log"

    if ($IsWindows -or [System.Environment]::OSVersion.Platform -eq 'Win32NT') {
        # Windows: open a new PowerShell window
        $script = @"
`$Host.UI.RawUI.WindowTitle = '$title'
Set-Location '$workDir'
Write-Host '>>> $title' -ForegroundColor Cyan
Write-Host '    Log: $logFile' -ForegroundColor DarkGray
Write-Host ''
$cmd 2>&1 | Tee-Object -FilePath '$logFile'
Write-Host ''
Write-Host '>>> Stopped. Press any key.' -ForegroundColor Yellow
`$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
"@
        $enc = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($script))
        Start-Process powershell -ArgumentList "-NoExit", "-EncodedCommand", $enc
    }
    else {
        # macOS / Linux: run as background job, redirect output to log
        $job = Start-Job -ScriptBlock {
            param($wd, $c, $lf)
            Set-Location $wd
            Invoke-Expression "$c 2>&1" | Tee-Object -FilePath $lf
        } -ArgumentList $workDir, $cmd, $logFile
        # Record job ID for cleanup
        $jobIdFile = Join-Path $LogDir ".jobs"
        "$logName`:$($job.Id)" | Out-File -Append -FilePath $jobIdFile
    }
}

function Start-Author {
    Write-Banner "Author  (Content + DAM + PIM read-write)  :8080"
    Launch-InWindow "FlexCMS Author :8080" $FlexcmsDir `
        "mvn spring-boot:run -pl flexcms-app ``-Dspring-boot.run.profiles=author" `
        "author"
    Write-Host "    Launched in new window" -ForegroundColor DarkGray
}

function Start-Publish {
    Write-Banner "Publish  (Content + DAM read-only)  :8081"
    Launch-InWindow "FlexCMS Publish :8081" $FlexcmsDir `
        "mvn spring-boot:run -pl flexcms-app ``-Dspring-boot.run.profiles=publish" `
        "publish"
    Write-Host "    Launched in new window" -ForegroundColor DarkGray
}

function Start-Admin {
    Write-Banner "Admin UI  (Next.js)  :3000"
    $adminDir = Join-Path $FrontendDir "apps" "admin"
    Launch-InWindow "FlexCMS Admin :3000" $FrontendDir `
        "pnpm install --silent 2>&1 | Out-Null; Set-Location '$adminDir'; pnpm dev" `
        "admin"
    Write-Host "    Launched in new window" -ForegroundColor DarkGray
}

# ─── Commands ─────────────────────────────────────────────────────────────────

switch ($Command) {

    "start" {
        if ($SubCmd -ne "local") {
            Write-Host "  Usage: flex start local [services...]" -ForegroundColor Red
            Write-Host "  Example: flex start local all" -ForegroundColor DarkGray
            exit 1
        }

        $services = Resolve-Services $ServiceArgs

        Write-Banner "FlexCMS -- Starting: $($services -join ' + ')"

        # 1) Infra
        if ("infra" -in $services) { Start-Infra }

        # 2) Compile backend once if any backend service requested
        $needsBuild = ("author" -in $services) -or ("publish" -in $services)
        if ($needsBuild) {
            Write-Host "    Compiling backend..." -ForegroundColor Yellow
            Push-Location $FlexcmsDir
            $oldPref = $ErrorActionPreference; $ErrorActionPreference = "SilentlyContinue"
            mvn clean compile -B -q 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
            $mvnExit = $LASTEXITCODE
            $ErrorActionPreference = $oldPref
            if ($mvnExit -ne 0) {
                Write-Host "    ERROR: Maven compile failed" -ForegroundColor Red
                Pop-Location; exit 1
            }
            Write-Host "    Build OK" -ForegroundColor Green
            Pop-Location
        }

        # 3) Author
        if ("author" -in $services) { Start-Author }

        # 4) Publish (short delay so author grabs :8080 first)
        if ("publish" -in $services) {
            if ("author" -in $services) { Start-Sleep 5 }
            Start-Publish
        }

        # 5) Admin UI
        if ("admin" -in $services) { Start-Admin }

        # Summary
        Write-Host ""
        Write-Host "    SERVICE                    URL" -ForegroundColor White
        Write-Host "    $("-" * 48)" -ForegroundColor DarkGray
        if ("infra"   -in $services) {
            Write-Svc "PostgreSQL"    "localhost:5432"
            Write-Svc "Redis"         "localhost:6379"
            Write-Svc "RabbitMQ"      "localhost:5672"       "mgmt :15672"
            Write-Svc "MinIO (S3)"    "localhost:9000"       "console :9001"
            Write-Svc "Elasticsearch" "localhost:9200"
        }
        if ("author"  -in $services) { Write-Svc "Author (CMS+DAM+PIM)" "localhost:8080" ".dev-logs/author.log" }
        if ("publish" -in $services) { Write-Svc "Publish (read-only)"  "localhost:8081" ".dev-logs/publish.log" }
        if ("admin"   -in $services) { Write-Svc "Admin UI"             "localhost:3000" ".dev-logs/admin.log" }
        Write-Host ""
        Write-Host "    flex status      check health" -ForegroundColor DarkGray
        Write-Host "    flex stop local  stop everything" -ForegroundColor DarkGray
        Write-Host "    flex logs author tail logs" -ForegroundColor DarkGray
        Write-Host ""
    }

    "stop" {
        Write-Banner "Stopping all FlexCMS services"

        if ($IsWindows -or [System.Environment]::OSVersion.Platform -eq 'Win32NT') {
            # Windows: close spawned terminal windows
            Get-Process powershell -ErrorAction SilentlyContinue |
                Where-Object { try { $_.MainWindowTitle -match "FlexCMS" } catch { $false } } |
                ForEach-Object {
                    Write-Host "    Closing: $($_.MainWindowTitle)" -ForegroundColor DarkGray
                    Stop-Process $_ -Force -ErrorAction SilentlyContinue
                }
        }
        else {
            # macOS/Linux: stop background PowerShell jobs
            $jobFile = Join-Path $LogDir ".jobs"
            if (Test-Path $jobFile) {
                Get-Content $jobFile | ForEach-Object {
                    $parts = $_ -split ':'
                    if ($parts.Count -ge 2) {
                        $jid = [int]$parts[1]
                        Write-Host "    Stopping job $($parts[0]) (ID $jid)" -ForegroundColor DarkGray
                        Stop-Job -Id $jid -ErrorAction SilentlyContinue
                        Remove-Job -Id $jid -Force -ErrorAction SilentlyContinue
                    }
                }
                Remove-Item $jobFile -Force -ErrorAction SilentlyContinue
            }
        }

        # Kill Java processes
        Get-Process java -ErrorAction SilentlyContinue |
            Where-Object { try { $_.CommandLine -match "flexcms" } catch { $false } } |
            ForEach-Object {
                Write-Host "    Stopping Java PID $($_.Id)" -ForegroundColor DarkGray
                Stop-Process $_ -Force -ErrorAction SilentlyContinue
            }

        # Kill Node processes
        Get-Process node -ErrorAction SilentlyContinue |
            Where-Object { try { $_.CommandLine -match "flexcms|apps.admin" } catch { $false } } |
            ForEach-Object {
                Write-Host "    Stopping Node PID $($_.Id)" -ForegroundColor DarkGray
                Stop-Process $_ -Force -ErrorAction SilentlyContinue
            }

        # Stop containers
        Ensure-Env
        $oldPref = $ErrorActionPreference; $ErrorActionPreference = "SilentlyContinue"
        docker compose -f $ComposeFile --profile full down 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
        $ErrorActionPreference = $oldPref
        Write-Host ""
        Write-Host "    All stopped." -ForegroundColor Green
        Write-Host ""
    }

    "status" {
        Write-Banner "FlexCMS Service Status"

        $checks = @(
            @{ Name = "PostgreSQL     :5432"; Cmd = "docker exec flexcms-postgres pg_isready -U flexcms" ;  Ok = "accepting" },
            @{ Name = "Redis          :6379"; Cmd = "docker exec flexcms-redis redis-cli ping"           ;  Ok = "PONG" },
            @{ Name = "RabbitMQ       :5672"; Url = "http://localhost:15672" },
            @{ Name = "MinIO          :9000"; Url = "http://localhost:9001" },
            @{ Name = "Elasticsearch  :9200"; Url = "http://localhost:9200" },
            @{ Name = "Author API     :8080"; Url = "http://localhost:8080/actuator/health" },
            @{ Name = "Publish API    :8081"; Url = "http://localhost:8081/actuator/health" },
            @{ Name = "Admin UI       :3000"; Url = "http://localhost:3000" }
        )
        foreach ($c in $checks) {
            $ok = $false
            if ($c.Cmd) {
                try {
                    $out = Invoke-Expression "$($c.Cmd) 2>&1" | Out-String
                    $ok = $out -match $c.Ok
                } catch {}
            } elseif ($c.Url) {
                try { $null = Invoke-WebRequest $c.Url -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop; $ok = $true } catch {}
            }
            $icon  = if ($ok) { "UP" } else { "--" }
            $color = if ($ok) { "Green" } else { "DarkGray" }
            Write-Host "    $icon  $($c.Name)" -ForegroundColor $color
        }
        Write-Host ""
    }

    "logs" {
        $target = if ($SubCmd) { $SubCmd } else { "author" }
        $logFile = Join-Path $LogDir "$target.log"
        if (Test-Path $logFile) {
            Write-Host "  Tailing $logFile  (Ctrl+C to stop)" -ForegroundColor Cyan
            Get-Content $logFile -Wait -Tail 100
        } else {
            Write-Host "  Log not found: $logFile" -ForegroundColor Red
            $existing = Get-ChildItem $LogDir -Filter "*.log" -Name -ErrorAction SilentlyContinue
            if ($existing) { Write-Host "  Available: $($existing -join ', ')" -ForegroundColor DarkGray }
        }
    }

    "reset" {
        Write-Banner "Resetting all data (volumes will be deleted)"
        Ensure-Env
        $oldPref = $ErrorActionPreference; $ErrorActionPreference = "SilentlyContinue"
        docker compose -f $ComposeFile --profile full down -v 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
        $ErrorActionPreference = $oldPref
        if (Test-Path $LogDir) { Remove-Item $LogDir -Recurse -Force }
        Write-Host "    Done. Run 'flex start local all' to start fresh." -ForegroundColor Green
        Write-Host ""
    }

    default {
        Write-Host @"

  flex -- FlexCMS Development CLI
  --------------------------------------------

  USAGE
    flex start local <services...>     Start services
    flex stop  local                   Stop everything
    flex status                        Health-check all
    flex logs  <service>               Tail service log
    flex reset                         Wipe all data & volumes

  SERVICES (pick any combination)
    all        Everything (infra + author + publish + admin)
    infra      PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch
    author     Author backend -- CMS + DAM + PIM (read-write)  :8080
    publish    Publish backend -- CMS + DAM (read-only)         :8081
    admin      Admin UI -- Next.js                              :3000

  ALIASES (map to the service that contains them)
    pim        -> author   (PIM is part of the Author instance)
    dam        -> author   (DAM is part of the Author instance)
    cms        -> author
    ui         -> admin
    frontend   -> admin

  EXAMPLES
    flex start local all                 Start everything
    flex start local author              Infra + Author only
    flex start local author publish      Infra + Author + Publish
    flex start local author,publish,admin   Comma-separated works too
    flex start local pim                 Infra + Author (PIM lives in Author)
    flex stop local                      Stop all services
    flex logs author                     Tail Author backend log
    flex status                          Check what's running

  SETUP (make 'flex' available without .\)
    Windows PowerShell:  `$env:PATH = "`$(Get-Location);" + `$env:PATH
    Windows CMD:         set PATH=%CD%;%PATH%
    macOS / Linux:       export PATH="`$PWD:`$PATH"
    Permanent:           Add the project root to your system PATH

"@
    }
}

