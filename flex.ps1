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
    "pim"        = "author"
    "dam"        = "author"
    "cms"        = "author"
    "frontend"   = "admin"
    "ui"         = "admin"
    "site-react" = "site"
    "site-nextjs"= "site"
}

$ValidServices = @("infra", "author", "publish", "admin", "site")

function Resolve-Services([string[]]$raw) {
    if ($raw.Count -eq 0 -or ($raw.Count -eq 1 -and $raw[0] -eq "all")) {
        return $ValidServices
    }
    $resolved = @("infra")  # always include infra
    foreach ($s in $raw) {
        $mapped = if ($AliasMap.ContainsKey($s)) { $AliasMap[$s] } else { $s }
        if ($mapped -notin $ValidServices) {
            Write-Host "  Unknown service: '$s'" -ForegroundColor Red
            Write-Host "  Valid: all, infra, author, publish, admin, site, pim, dam, cms, ui" -ForegroundColor DarkGray
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
    Write-Banner "Infrastructure  (PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch, pgAdmin)"
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

function Stop-AllServices {
    # Close all FlexCMS terminal windows
    Get-Process powershell -ErrorAction SilentlyContinue |
        Where-Object { try { $_.MainWindowTitle -match "FlexCMS" } catch { $false } } |
        ForEach-Object {
            Write-Host "    Closing: $($_.MainWindowTitle)" -ForegroundColor DarkGray
            Stop-Process $_ -Force -ErrorAction SilentlyContinue
        }

    # Kill all Java processes (Spring Boot instances)
    $javaProcs = Get-Process java -ErrorAction SilentlyContinue
    if ($javaProcs) {
        $javaProcs | ForEach-Object {
            Write-Host "    Stopping Java PID $($_.Id)" -ForegroundColor DarkGray
            Stop-Process $_ -Force -ErrorAction SilentlyContinue
        }
    }

    # Kill Node/Next.js dev server
    Get-Process node -ErrorAction SilentlyContinue |
        Where-Object { try { $_.CommandLine -match "next|flexcms|apps.admin" } catch { $false } } |
        ForEach-Object {
            Write-Host "    Stopping Node PID $($_.Id)" -ForegroundColor DarkGray
            Stop-Process $_ -Force -ErrorAction SilentlyContinue
        }

    # Wait for log file locks to release (up to 3 s)
    Ensure-LogDir
    foreach ($name in @("author", "publish", "admin", "site")) {
        $logFile = Join-Path $LogDir "$name.log"
        if (-not (Test-Path $logFile)) { continue }
        for ($i = 0; $i -lt 10; $i++) {
            try {
                $s = [System.IO.File]::Open($logFile, 'Open', 'ReadWrite', 'None')
                $s.Close(); break
            } catch { Start-Sleep -Milliseconds 300 }
        }
    }
}

function Launch-InWindow([string]$title, [string]$workDir, [string]$cmd, [string]$logName) {
    Ensure-LogDir
    $logFile = Join-Path $LogDir "$logName.log"

    if ($IsWindows -or [System.Environment]::OSVersion.Platform -eq 'Win32NT') {
        # Windows: open a new PowerShell window
        $script = @"
# Set UTF-8 encoding so Next.js / Node.js Unicode symbols render correctly
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
`$OutputEncoding = [System.Text.Encoding]::UTF8
`$env:PYTHONIOENCODING = 'utf-8'
`$env:CHCP = '65001'
chcp 65001 | Out-Null
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
        "mvn spring-boot:run -pl flexcms-app -am ``-Dspring-boot.run.profiles=author,local" `
        "author"
    Write-Host "    Launched in new window" -ForegroundColor DarkGray
}

function Start-Publish {
    Write-Banner "Publish  (Content + DAM read-only)  :8081"
    Launch-InWindow "FlexCMS Publish :8081" $FlexcmsDir `
        "mvn spring-boot:run -pl flexcms-app -am ``-Dspring-boot.run.profiles=publish,local" `
        "publish"
    Write-Host "    Launched in new window" -ForegroundColor DarkGray
}

function Start-Admin {
    Write-Banner "Admin UI  (Next.js)  :3000"
    $adminDir = Join-Path (Join-Path $FrontendDir "apps") "admin"
    Launch-InWindow "FlexCMS Admin :3000" $FrontendDir `
        "pnpm install --silent 2>&1 | Out-Null; Set-Location '$adminDir'; pnpm dev" `
        "admin"
    Write-Host "    Launched in new window" -ForegroundColor DarkGray
}

function Start-Site {
    Write-Banner "Sample Site  (Next.js)  :3001"
    $siteDir = Join-Path (Join-Path $FrontendDir "apps") "site-nextjs"
    Launch-InWindow "FlexCMS Site :3001" $FrontendDir `
        "pnpm install --silent 2>&1 | Out-Null; Set-Location '$siteDir'; pnpm dev" `
        "site"
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

        # 0) Kill any previous runs so log files are not locked
        Write-Host "    Stopping previous runs..." -ForegroundColor DarkGray
        Stop-AllServices
        Write-Host "    Previous runs stopped." -ForegroundColor DarkGray

        # 1) Infra
        if ("infra" -in $services) { Start-Infra }

        # 2) Compile backend once if any backend service requested
        $needsBuild = ("author" -in $services) -or ("publish" -in $services)
        $backendOk = $true
        if ($needsBuild) {
            Write-Host "    Compiling backend..." -ForegroundColor Yellow
            Push-Location $FlexcmsDir
            $oldPref = $ErrorActionPreference; $ErrorActionPreference = "SilentlyContinue"
            mvn clean compile -B 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
            $mvnExit = $LASTEXITCODE
            $ErrorActionPreference = $oldPref
            Pop-Location
            if ($mvnExit -ne 0) {
                $backendOk = $false
                Write-Host ""
                Write-Host "    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
                Write-Host "    ERROR: Maven compile failed (exit code $mvnExit)" -ForegroundColor Red
                Write-Host "    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
                Write-Host "    Fix the compilation errors above, then run:" -ForegroundColor Yellow
                Write-Host "      flex start local author" -ForegroundColor White -NoNewline
                Write-Host "   (or whichever services you need)" -ForegroundColor DarkGray
                Write-Host ""
                Write-Host "    Infrastructure is still running. Non-backend services will still start." -ForegroundColor DarkGray
                Write-Host ""
            } else {
                Write-Host "    Build OK" -ForegroundColor Green
            }
        }

        # 3) Author (skip if compile failed)
        if ("author" -in $services) {
            if ($backendOk) { Start-Author }
            else { Write-Host "    Skipping Author — backend compile failed" -ForegroundColor Yellow }
        }

        # 4) Publish (short delay so author grabs :8080 first; skip if compile failed)
        if ("publish" -in $services) {
            if ($backendOk) {
                if ("author" -in $services) { Start-Sleep 5 }
                Start-Publish
            } else {
                Write-Host "    Skipping Publish — backend compile failed" -ForegroundColor Yellow
            }
        }

        # 5) Admin UI (always starts — no backend dependency)
        if ("admin" -in $services) { Start-Admin }

        # 6) Sample Site (always starts — no backend dependency)
        if ("site" -in $services) { Start-Site }

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
            Write-Svc "pgAdmin 4 (DB)" "localhost:5050"      "no login · DB pwd: flexcms"
        }
        if ($backendOk) {
            if ("author"  -in $services) { Write-Svc "Author (CMS+DAM+PIM)" "localhost:8080" ".dev-logs/author.log" }
            if ("publish" -in $services) { Write-Svc "Publish (read-only)"  "localhost:8081" ".dev-logs/publish.log" }
        } else {
            if ("author"  -in $services) { Write-Host "    Author (CMS+DAM+PIM)       SKIPPED  (compile error)" -ForegroundColor Red }
            if ("publish" -in $services) { Write-Host "    Publish (read-only)        SKIPPED  (compile error)" -ForegroundColor Red }
        }
        if ("admin"   -in $services) { Write-Svc "Admin UI"             "localhost:3000" ".dev-logs/admin.log" }
        if ("site"    -in $services) { Write-Svc "Sample Site"           "localhost:3001" ".dev-logs/site.log" }
        Write-Host ""
        Write-Host "    flex status      check health" -ForegroundColor DarkGray
        Write-Host "    flex stop local  stop everything" -ForegroundColor DarkGray
        Write-Host "    flex logs author tail logs" -ForegroundColor DarkGray
        Write-Host ""
        if (-not $backendOk) {
            Write-Host "    ⚠  Backend was not started due to compile errors." -ForegroundColor Yellow
            Write-Host "       Fix the errors and run: flex start local author" -ForegroundColor Yellow
            Write-Host ""
        }
    }

    "stop" {
        Write-Banner "Stopping all FlexCMS services"

        Stop-AllServices

        # macOS/Linux: also clean up background PowerShell jobs
        if (-not ($IsWindows -or [System.Environment]::OSVersion.Platform -eq 'Win32NT')) {
            $jobFile = Join-Path $LogDir ".jobs"
            if (Test-Path $jobFile) {
                Get-Content $jobFile | ForEach-Object {
                    $parts = $_ -split ':'
                    if ($parts.Count -ge 2) {
                        $jid = [int]$parts[1]
                        Stop-Job -Id $jid -ErrorAction SilentlyContinue
                        Remove-Job -Id $jid -Force -ErrorAction SilentlyContinue
                    }
                }
                Remove-Item $jobFile -Force -ErrorAction SilentlyContinue
            }
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
            @{ Name = "pgAdmin 4      :5050"; Url = "http://localhost:5050" },
            @{ Name = "Author API     :8080"; Url = "http://localhost:8080/actuator/health" },
            @{ Name = "Publish API    :8081"; Url = "http://localhost:8081/actuator/health" },
            @{ Name = "Admin UI       :3000"; Url = "http://localhost:3000" },
            @{ Name = "Sample Site    :3001"; Url = "http://localhost:3001" }
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

    "seed" {
        Write-Banner "Seeding DAM assets for TUT sample site"

        # 1) Health-check author backend
        Write-Host "    Checking Author API at http://localhost:8080 ..." -ForegroundColor Yellow
        $apiUp = $false
        for ($i = 0; $i -lt 30; $i++) {
            try {
                $null = Invoke-WebRequest "http://localhost:8080/actuator/health" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
                $apiUp = $true; break
            } catch { Start-Sleep 2 }
        }
        if (-not $apiUp) {
            Write-Host "    Author API not reachable. Start it first: flex start local author" -ForegroundColor Red
            exit 1
        }
        Write-Host "    Author API is UP" -ForegroundColor Green

        # 2) Upload DAM assets
        $assetsRoot = Join-Path $RootDir "Design" "assets"
        $assetMap = @(
            @{Folder="/dam/tut/shared/brand";     File="z-image-turbo_00001_.png";    Sub="1024x1024"; Name="tut-logo.png"},
            @{Folder="/dam/tut/shared/banners";   File="Flux2-Klein_00001_.png";      Sub="banner";    Name="hero-home.png"},
            @{Folder="/dam/tut/shared/banners";   File="Flux2-Klein_00002_.png";      Sub="banner";    Name="hero-models.png"},
            @{Folder="/dam/tut/shared/banners";   File="Flux2-Klein_00005_.png";      Sub="banner";    Name="hero-innovation.png"},
            @{Folder="/dam/tut/shared/banners";   File="openart-image_1774524665435_8ee570b7_1774524666604_bccc0b4c.png"; Sub="banner"; Name="hero-safety.png"},
            @{Folder="/dam/tut/shared/banners";   File="openart-image_1774524670799_60639cbb_1774524671922_18d47bfd.png"; Sub="banner"; Name="hero-about.png"},
            @{Folder="/dam/tut/shared/banners";   File="openart-image_1774524671714_bb094f70_1774524672752_2a5d0d5e.png"; Sub="banner"; Name="hero-heritage.png"},
            @{Folder="/dam/tut/shared/banners";   File="openart-image_1774524675992_c9e45a26_1774524677335_26fd5455.png"; Sub="banner"; Name="cta-test-drive.png"},
            @{Folder="/dam/tut/shared/models";    File="z-image-turbo1_00001_.png";   Sub="1024x1024"; Name="tut-sovereign.png"},
            @{Folder="/dam/tut/shared/models";    File="z-image-turbo1_00002_.png";   Sub="1024x1024"; Name="tut-sovereign-2.png"},
            @{Folder="/dam/tut/shared/models";    File="z-image-turbo1_00003_.png";   Sub="1024x1024"; Name="tut-sovereign-3.png"},
            @{Folder="/dam/tut/shared/models";    File="z-image-turbo2_00001_.png";   Sub="1024x1024"; Name="tut-vanguard.png"},
            @{Folder="/dam/tut/shared/models";    File="z-image-turbo2_00002_.png";   Sub="1024x1024"; Name="tut-vanguard-2.png"},
            @{Folder="/dam/tut/shared/models";    File="z-image-turbo2_00003_.png";   Sub="1024x1024"; Name="tut-vanguard-3.png"},
            @{Folder="/dam/tut/shared/models";    File="z-image-turbo3_00001_.png";   Sub="1024x1024"; Name="tut-eclipse.png"},
            @{Folder="/dam/tut/shared/models";    File="z-image-turbo3_00002_.png";   Sub="1024x1024"; Name="tut-eclipse-2.png"},
            @{Folder="/dam/tut/shared/models";    File="z-image-turbo3_00003_.png";   Sub="1024x1024"; Name="tut-eclipse-3.png"},
            @{Folder="/dam/tut/shared/models";    File="z-image-turbo4_00001_.png";   Sub="1024x1024"; Name="tut-apex.png"},
            @{Folder="/dam/tut/shared/models";    File="z-image-turbo4_00002_.png";   Sub="1024x1024"; Name="tut-apex-2.png"},
            @{Folder="/dam/tut/shared/models";    File="z-image-turbo4_00003_.png";   Sub="1024x1024"; Name="tut-apex-3.png"},
            @{Folder="/dam/tut/shared/features";  File="Flux2-Klein_00002_.png";      Sub="1024x1024"; Name="innovation-engine.png"},
            @{Folder="/dam/tut/shared/features";  File="Flux2-Klein_00003_.png";      Sub="1024x1024"; Name="innovation-aero.png"},
            @{Folder="/dam/tut/shared/features";  File="Flux2-Klein_00004_.png";      Sub="1024x1024"; Name="innovation-ai.png"},
            @{Folder="/dam/tut/shared/features";  File="Flux2-Klein_00005_.png";      Sub="1024x1024"; Name="safety-shield.png"},
            @{Folder="/dam/tut/shared/features";  File="Flux2-Klein_00006_.png";      Sub="1024x1024"; Name="safety-night.png"},
            @{Folder="/dam/tut/shared/features";  File="Flux2-Klein_00007_.png";      Sub="1024x1024"; Name="safety-assist.png"},
            @{Folder="/dam/tut/shared/features";  File="Flux2-Klein_00008_.png";      Sub="1024x1024"; Name="interior-cockpit.png"},
            @{Folder="/dam/tut/shared/features";  File="Flux2-Klein_203003_.png";     Sub="1024x1024"; Name="interior-materials.png"},
            @{Folder="/dam/tut/shared/features";  File="Flux2-Klein_203004_.png";     Sub="1024x1024"; Name="sustainability.png"},
            @{Folder="/dam/tut/shared/lifestyle"; File="z-image-turbo_00003_.png";    Sub="1024x1024"; Name="driving-experience.png"},
            @{Folder="/dam/tut/shared/lifestyle"; File="z-image-turbo_00004_.png";    Sub="1024x1024"; Name="concierge.png"},
            @{Folder="/dam/tut/shared/lifestyle"; File="z-image-turbo_00005_.png";    Sub="1024x1024"; Name="heritage-1.png"},
            @{Folder="/dam/tut/shared/lifestyle"; File="z-image-turbo_00006_.png";    Sub="1024x1024"; Name="heritage-2.png"},
            @{Folder="/dam/tut/shared/lifestyle"; File="z-image-turbo_00007_.png";    Sub="1024x1024"; Name="craftsmanship.png"}
        )

        $uploaded = 0; $skipped = 0; $errors = 0
        foreach ($a in $assetMap) {
            $srcPath = Join-Path $assetsRoot $a.Sub $a.File
            $damPath = "$($a.Folder)/$($a.Name)"

            if (-not (Test-Path $srcPath)) {
                Write-Host "    SKIP (missing source): $srcPath" -ForegroundColor Yellow
                $skipped++; continue
            }

            # Check if already uploaded
            try {
                $check = Invoke-WebRequest "http://localhost:8080/api/author/assets/by-path?path=$([Uri]::EscapeDataString($damPath))" `
                    -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
                if ($check.StatusCode -eq 200) {
                    Write-Host "    SKIP (exists): $damPath" -ForegroundColor DarkGray
                    $skipped++; continue
                }
            } catch {}

            # Upload via multipart form
            try {
                $boundary = [System.Guid]::NewGuid().ToString()
                $fileBytes = [System.IO.File]::ReadAllBytes($srcPath)
                $fileName  = $a.Name
                $enc       = [System.Text.Encoding]::UTF8

                $bodyLines = @(
                    "--$boundary",
                    "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
                    "Content-Type: image/png",
                    "",
                    ""
                )
                $bodyEnd = @(
                    "",
                    "--$boundary",
                    "Content-Disposition: form-data; name=`"path`"",
                    "",
                    $damPath,
                    "--$boundary",
                    "Content-Disposition: form-data; name=`"siteId`"",
                    "",
                    "tut-gb",
                    "--$boundary",
                    "Content-Disposition: form-data; name=`"userId`"",
                    "",
                    "admin",
                    "--$boundary--",
                    ""
                )

                $headerBytes = $enc.GetBytes(($bodyLines -join "`r`n"))
                $footerBytes = $enc.GetBytes(($bodyEnd   -join "`r`n"))
                $bodyBytes   = New-Object byte[] ($headerBytes.Length + $fileBytes.Length + $footerBytes.Length)
                [System.Buffer]::BlockCopy($headerBytes, 0, $bodyBytes, 0, $headerBytes.Length)
                [System.Buffer]::BlockCopy($fileBytes,   0, $bodyBytes, $headerBytes.Length, $fileBytes.Length)
                [System.Buffer]::BlockCopy($footerBytes, 0, $bodyBytes, $headerBytes.Length + $fileBytes.Length, $footerBytes.Length)

                $resp = Invoke-WebRequest "http://localhost:8080/api/author/assets" `
                    -Method POST -Body $bodyBytes `
                    -ContentType "multipart/form-data; boundary=$boundary" `
                    -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop

                Write-Host "    OK: $damPath" -ForegroundColor Green
                $uploaded++
            } catch {
                Write-Host "    ERROR: $damPath — $($_.Exception.Message)" -ForegroundColor Red
                $errors++
            }
        }

        Write-Host ""
        Write-Host "    Done: $uploaded uploaded, $skipped skipped, $errors errors" -ForegroundColor Cyan
        Write-Host ""
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
    flex seed                          Upload DAM assets for TUT sample site
    flex reset                         Wipe all data & volumes

  SERVICES (pick any combination)
    all        Everything (infra + author + publish + admin + site)
    infra      PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch
    author     Author backend -- CMS + DAM + PIM (read-write)  :8080
    publish    Publish backend -- CMS + DAM (read-only)         :8081
    admin      Admin UI -- Next.js                              :3000
    site       Sample Site -- Next.js reference site            :3001

  ALIASES (map to the service that contains them)
    pim        -> author   (PIM is part of the Author instance)
    dam        -> author   (DAM is part of the Author instance)
    cms        -> author
    ui         -> admin
    frontend   -> admin
    site-nextjs -> site
    site-react  -> site

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

