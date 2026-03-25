<#
.SYNOPSIS
  FlexCMS local development orchestrator (legacy).
  RECOMMENDED: Use flex.ps1 (or flex.cmd) instead:
    flex start local all
    flex start local author publish
    flex stop local
    flex status

.DESCRIPTION
  Single script to spin up infrastructure + all backend/frontend services.
  Each backend/frontend service launches in its own terminal window so you
  can see logs independently.

.EXAMPLE
  .\dev.ps1 up                            # Start everything
  .\dev.ps1 up -Exclude publish           # Skip the Publish instance
  .\dev.ps1 up -Exclude publish,admin     # Skip Publish + Admin UI
  .\dev.ps1 up -Exclude author,publish    # Infra + Admin UI only (frontend dev)
  .\dev.ps1 down                          # Stop everything (infra + kill Java/Node)
  .\dev.ps1 infra                         # Infrastructure containers only
  .\dev.ps1 status                        # Health-check all services
  .\dev.ps1 logs author                   # Tail author log file
#>

param(
    [Parameter(Position = 0)]
    [string]$Command = "help",

    [Parameter(Position = 1)]
    [string]$Arg1 = "",

    [Alias("x")]
    [string]$Exclude = ""
)

$ErrorActionPreference = "Stop"
$RootDir     = Split-Path -Parent $MyInvocation.MyCommand.Path
$FlexcmsDir  = Join-Path $RootDir "flexcms"
$FrontendDir = Join-Path $RootDir "frontend"
$ComposeFile = Join-Path $RootDir "infra\local\docker-compose.dev.yml"
$ComposeDir  = Join-Path $RootDir "infra\local"
$LogDir      = Join-Path $RootDir ".dev-logs"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
function Ensure-Env {
    $envFile = Join-Path $ComposeDir ".env"
    $envLocal = Join-Path $ComposeDir ".env.local"
    if (-not (Test-Path $envFile)) {
        if (Test-Path $envLocal) {
            Write-Host ">>> Copying .env.local -> .env" -ForegroundColor Yellow
            Copy-Item $envLocal $envFile
        } else {
            Set-Content $envFile "# auto-generated defaults`nPOSTGRES_USER=flexcms`nPOSTGRES_PASSWORD=flexcms"
        }
    }
}

function Ensure-LogDir {
    if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }
}

function Write-Banner([string]$msg) {
    $line = "=" * 60
    Write-Host "`n$line" -ForegroundColor DarkCyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "$line`n" -ForegroundColor DarkCyan
}

function Parse-ExcludeList([string]$raw) {
    if ([string]::IsNullOrWhiteSpace($raw)) { return @() }
    return ($raw -split "[,;\s]+" | ForEach-Object { $_.Trim().ToLower() } | Where-Object { $_ -ne "" })
}

# ---------------------------------------------------------------------------
# Service launchers (each opens a new terminal window + writes log file)
# ---------------------------------------------------------------------------
function Start-Infra {
    Write-Banner "Starting infrastructure (PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch)"
    Ensure-Env
    docker compose -f $ComposeFile up -d 2>&1 | ForEach-Object { Write-Host "  $_" }

    Write-Host "`n>>> Waiting for containers to be healthy..." -ForegroundColor Yellow
    $healthy = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep 2
        $pgReady = docker exec flexcms-postgres pg_isready -U flexcms 2>$null
        $redisReady = docker exec flexcms-redis redis-cli ping 2>$null
        if ($pgReady -match "accepting" -and $redisReady -match "PONG") {
            $healthy = $true
            break
        }
    }
    if ($healthy) {
        Write-Host "  Infrastructure is healthy." -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Not all containers are healthy yet. Continuing..." -ForegroundColor Yellow
    }
    docker compose -f $ComposeFile ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>$null
    Write-Host ""
}

function Start-Author {
    Write-Banner "Starting Author backend (Content + DAM + PIM R/W) on :8080"
    Ensure-LogDir
    $logFile = Join-Path $LogDir "author.log"

    $script = @"
`$Host.UI.RawUI.WindowTitle = 'FlexCMS Author :8080'
Set-Location '$FlexcmsDir'
Write-Host '>>> FlexCMS Author starting on :8080 ...' -ForegroundColor Cyan
Write-Host '    Logs: $logFile' -ForegroundColor DarkGray
mvn spring-boot:run -pl flexcms-app ``-Dspring-boot.run.profiles=author 2>&1 | Tee-Object -FilePath '$logFile'
Write-Host '>>> Author stopped. Press any key.' -ForegroundColor Yellow
`$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
"@
    $encodedCmd = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($script))
    Start-Process powershell -ArgumentList "-NoExit", "-EncodedCommand", $encodedCmd
    Write-Host "  Launched in new window." -ForegroundColor DarkGray
}

function Start-Publish {
    Write-Banner "Starting Publish backend (Content + DAM read-only) on :8081"
    Ensure-LogDir
    $logFile = Join-Path $LogDir "publish.log"

    $script = @"
`$Host.UI.RawUI.WindowTitle = 'FlexCMS Publish :8081'
Set-Location '$FlexcmsDir'
Write-Host '>>> FlexCMS Publish starting on :8081 ...' -ForegroundColor Cyan
Write-Host '    Logs: $logFile' -ForegroundColor DarkGray
mvn spring-boot:run -pl flexcms-app ``-Dspring-boot.run.profiles=publish 2>&1 | Tee-Object -FilePath '$logFile'
Write-Host '>>> Publish stopped. Press any key.' -ForegroundColor Yellow
`$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
"@
    $encodedCmd = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($script))
    Start-Process powershell -ArgumentList "-NoExit", "-EncodedCommand", $encodedCmd
    Write-Host "  Launched in new window." -ForegroundColor DarkGray
}

function Start-Admin {
    Write-Banner "Starting Admin UI (Next.js) on :3000"
    Ensure-LogDir
    $logFile = Join-Path $LogDir "admin.log"
    $adminDir = Join-Path $FrontendDir "apps\admin"

    $script = @"
`$Host.UI.RawUI.WindowTitle = 'FlexCMS Admin UI :3000'
Set-Location '$FrontendDir'
Write-Host '>>> Installing frontend dependencies...' -ForegroundColor Cyan
pnpm install --silent 2>&1 | Out-Null
Set-Location '$adminDir'
Write-Host '>>> Admin UI starting on :3000 ...' -ForegroundColor Cyan
Write-Host '    Logs: $logFile' -ForegroundColor DarkGray
pnpm dev 2>&1 | Tee-Object -FilePath '$logFile'
Write-Host '>>> Admin UI stopped. Press any key.' -ForegroundColor Yellow
`$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
"@
    $encodedCmd = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($script))
    Start-Process powershell -ArgumentList "-NoExit", "-EncodedCommand", $encodedCmd
    Write-Host "  Launched in new window." -ForegroundColor DarkGray
}

# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------
switch ($Command) {

    # ===== UP — the main event =====
    "up" {
        $excluded = Parse-ExcludeList $Exclude
        $services = @("infra", "author", "publish", "admin")
        $starting = $services | Where-Object { $_ -notin $excluded }

        Write-Banner "FlexCMS  -  Starting: $($starting -join ', ')"
        if ($excluded.Count -gt 0) {
            Write-Host "  Excluded: $($excluded -join ', ')" -ForegroundColor DarkYellow
        }
        Write-Host ""

        # 1. Infrastructure (always first unless explicitly excluded)
        if ("infra" -notin $excluded) {
            Start-Infra
        } else {
            Write-Host "  Skipping infrastructure." -ForegroundColor DarkGray
        }

        # 2. Build backend once (shared by author + publish)
        $needsBackend = ("author" -in $starting) -or ("publish" -in $starting)
        if ($needsBackend) {
            Write-Banner "Compiling backend (mvn clean compile)"
            Push-Location $FlexcmsDir
            mvn clean compile -B -q 2>&1 | ForEach-Object { Write-Host "  $_" }
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  ERROR: Maven compile failed!" -ForegroundColor Red
                Pop-Location
                exit 1
            }
            Write-Host "  Build OK." -ForegroundColor Green
            Pop-Location
        }

        # 3. Author
        if ("author" -in $starting) {
            Start-Author
        } else {
            Write-Host "  Skipping Author backend." -ForegroundColor DarkGray
        }

        # 4. Publish (brief delay so author grabs :8080 first)
        if ("publish" -in $starting) {
            if ("author" -in $starting) { Start-Sleep 5 }
            Start-Publish
        } else {
            Write-Host "  Skipping Publish backend." -ForegroundColor DarkGray
        }

        # 5. Admin UI
        if ("admin" -in $starting) {
            Start-Admin
        } else {
            Write-Host "  Skipping Admin UI." -ForegroundColor DarkGray
        }

        # 6. Summary
        Write-Host ""
        Write-Banner "All services launched"
        Write-Host "  Service                  URL                           Log" -ForegroundColor White
        Write-Host "  -------                  ---                           ---" -ForegroundColor DarkGray
        if ("infra" -in $starting) {
            Write-Host "  PostgreSQL               localhost:5432                (docker)" -ForegroundColor Gray
            Write-Host "  Redis                    localhost:6379                (docker)" -ForegroundColor Gray
            Write-Host "  RabbitMQ                 localhost:5672  mgmt:15672   (docker)" -ForegroundColor Gray
            Write-Host "  MinIO (S3)               localhost:9000  console:9001 (docker)" -ForegroundColor Gray
            Write-Host "  Elasticsearch            localhost:9200                (docker)" -ForegroundColor Gray
        }
        if ("author" -in $starting) {
            Write-Host "  Author (CMS+DAM+PIM)     localhost:8080               .dev-logs/author.log" -ForegroundColor Cyan
        }
        if ("publish" -in $starting) {
            Write-Host "  Publish (read-only)      localhost:8081               .dev-logs/publish.log" -ForegroundColor Cyan
        }
        if ("admin" -in $starting) {
            Write-Host "  Admin UI                 localhost:3000               .dev-logs/admin.log" -ForegroundColor Cyan
        }
        Write-Host ""
        Write-Host "  Tip: .\dev.ps1 status   -> check health" -ForegroundColor DarkGray
        Write-Host "  Tip: .\dev.ps1 down     -> stop everything" -ForegroundColor DarkGray
        Write-Host "  Tip: .\dev.ps1 logs author -> tail author log" -ForegroundColor DarkGray
        Write-Host ""
    }

    # ===== DOWN — stop everything =====
    "down" {
        Write-Banner "Stopping all FlexCMS services"

        # Kill Java (Spring Boot) processes for this project
        Write-Host "  Stopping Java processes..." -ForegroundColor Yellow
        Get-Process java -ErrorAction SilentlyContinue |
            Where-Object {
                try { $_.CommandLine -match "flexcms" } catch { $false }
            } |
            ForEach-Object {
                Write-Host "    Killing PID $($_.Id)" -ForegroundColor DarkGray
                Stop-Process $_ -Force -ErrorAction SilentlyContinue
            }

        # Kill Node (Next.js dev) processes for this project
        Write-Host "  Stopping Node processes..." -ForegroundColor Yellow
        Get-Process node -ErrorAction SilentlyContinue |
            Where-Object {
                try { $_.CommandLine -match "flexcms|apps.admin" } catch { $false }
            } |
            ForEach-Object {
                Write-Host "    Killing PID $($_.Id)" -ForegroundColor DarkGray
                Stop-Process $_ -Force -ErrorAction SilentlyContinue
            }

        # Close any spawned PowerShell windows with our titles
        Get-Process powershell -ErrorAction SilentlyContinue |
            Where-Object {
                try { $_.MainWindowTitle -match "FlexCMS" } catch { $false }
            } |
            ForEach-Object {
                Write-Host "    Closing window: $($_.MainWindowTitle)" -ForegroundColor DarkGray
                Stop-Process $_ -Force -ErrorAction SilentlyContinue
            }

        # Stop docker infra
        Write-Host "  Stopping infrastructure containers..." -ForegroundColor Yellow
        Ensure-Env
        docker compose -f $ComposeFile --profile full down 2>&1 | ForEach-Object { Write-Host "  $_" }
        Write-Host "`n  All stopped." -ForegroundColor Green
    }

    # ===== Standalone commands (backwards-compatible) =====
    "infra" {
        Start-Infra
    }

    "infra:stop" {
        Ensure-Env
        docker compose -f $ComposeFile --profile full down
    }

    "infra:reset" {
        Ensure-Env
        docker compose -f $ComposeFile --profile full down -v
        Write-Host ">>> Volumes deleted. Run '.\dev.ps1 infra' to start fresh." -ForegroundColor Green
    }

    "backend" {
        Write-Host ">>> Building + starting Author (Content+DAM+PIM) on :8080" -ForegroundColor Cyan
        Push-Location $FlexcmsDir
        mvn clean compile -B -q
        mvn spring-boot:run -pl flexcms-app "-Dspring-boot.run.profiles=author"
        Pop-Location
    }

    "backend:publish" {
        Write-Host ">>> Starting Publish on :8081" -ForegroundColor Cyan
        Push-Location $FlexcmsDir
        mvn spring-boot:run -pl flexcms-app "-Dspring-boot.run.profiles=publish"
        Pop-Location
    }

    "frontend" {
        Push-Location $FrontendDir
        pnpm install
        Set-Location apps\admin
        pnpm dev
        Pop-Location
    }

    "full" {
        Ensure-Env
        docker compose -f $ComposeFile --profile full up -d --build
    }

    "status" {
        Write-Banner "FlexCMS Service Status"

        # Docker containers
        Write-Host "  Docker containers:" -ForegroundColor White
        docker compose -f $ComposeFile ps --format "table {{.Name}}\t{{.Status}}" 2>$null |
            ForEach-Object { Write-Host "    $_" }
        Write-Host ""

        # HTTP health checks
        $checks = @(
            @{ Label = "Author API   :8080"; Url = "http://localhost:8080/actuator/health" },
            @{ Label = "Publish API  :8081"; Url = "http://localhost:8081/actuator/health" },
            @{ Label = "Admin UI     :3000"; Url = "http://localhost:3000" },
            @{ Label = "RabbitMQ Mgmt:15672"; Url = "http://localhost:15672" },
            @{ Label = "Elasticsearch:9200"; Url = "http://localhost:9200" },
            @{ Label = "MinIO Console:9001"; Url = "http://localhost:9001" }
        )
        Write-Host "  HTTP health checks:" -ForegroundColor White
        foreach ($c in $checks) {
            try {
                $null = Invoke-WebRequest $c.Url -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
                Write-Host "    OK     $($c.Label)" -ForegroundColor Green
            } catch {
                Write-Host "    DOWN   $($c.Label)" -ForegroundColor Yellow
            }
        }
        Write-Host ""
    }

    "logs" {
        $target = if ($Arg1) { $Arg1 } else { "author" }
        $logFile = Join-Path $LogDir "$target.log"
        if (Test-Path $logFile) {
            Write-Host ">>> Tailing $logFile (Ctrl+C to stop)" -ForegroundColor Cyan
            Get-Content $logFile -Wait -Tail 100
        } else {
            Write-Host "Log file not found: $logFile" -ForegroundColor Red
            $existing = Get-ChildItem $LogDir -Name -ErrorAction SilentlyContinue
            if ($existing) {
                Write-Host "Available: $($existing -join ', ')" -ForegroundColor DarkGray
            }
        }
    }

    "test:api" {
        Write-Host "Health:" -ForegroundColor Cyan
        try { (Invoke-RestMethod "http://localhost:8080/actuator/health") | ConvertTo-Json } catch { "FAILED" }
    }

    default {
        Write-Host @"

FlexCMS Dev Helper
==================

  MAIN COMMAND:
    .\dev.ps1 up                            Start ALL (infra + author + publish + admin)
    .\dev.ps1 up -Exclude publish           Skip Publish backend
    .\dev.ps1 up -Exclude publish,admin     Skip Publish + Admin UI
    .\dev.ps1 up -Exclude author,publish    Infra + Admin UI only (frontend dev)
    .\dev.ps1 down                          Stop everything

  INDIVIDUAL SERVICES:
    .\dev.ps1 infra            Infrastructure only (PG, Redis, RabbitMQ, MinIO, ES)
    .\dev.ps1 infra:stop       Stop infrastructure
    .\dev.ps1 infra:reset      Stop + delete all data volumes
    .\dev.ps1 backend          Author backend in foreground on :8080
    .\dev.ps1 backend:publish  Publish backend in foreground on :8081
    .\dev.ps1 frontend         Admin UI dev server on :3000
    .\dev.ps1 full             Full stack via Docker Compose

  UTILITIES:
    .\dev.ps1 status           Health-check all services
    .\dev.ps1 logs author      Tail author log (.dev-logs/author.log)
    .\dev.ps1 logs publish     Tail publish log
    .\dev.ps1 logs admin       Tail admin UI log

  EXCLUDABLE SERVICES (for -Exclude / -x flag):
    infra     PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch
    author    Author backend (Content + DAM + PIM read-write) on :8080
    publish   Publish backend (Content + DAM read-only) on :8081
    admin     Admin UI (Next.js) on :3000

  EXAMPLES:
    .\dev.ps1 up                            # Everything
    .\dev.ps1 up -Exclude publish           # No publish tier
    .\dev.ps1 up -x publish,admin           # Backend author only + infra
    .\dev.ps1 down                          # Stop all

"@
    }
}
