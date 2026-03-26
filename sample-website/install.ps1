# =============================================================================
# WKND Adventures — FlexCMS Sample Website Installer (PowerShell)
# Usage: .\install.ps1 [-Host localhost] [-Port 5432] [-Db flexcms] [-User postgres]
# =============================================================================
param(
    [string]$DbHost     = $env:FLEXCMS_DB_HOST     ?? "localhost",
    [string]$DbPort     = $env:FLEXCMS_DB_PORT     ?? "5432",
    [string]$DbName     = $env:FLEXCMS_DB_NAME     ?? "flexcms_author",
    [string]$DbUser     = $env:FLEXCMS_DB_USER     ?? "flexcms",
    [string]$DbPassword = $env:FLEXCMS_DB_PASSWORD ?? ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$env:PGPASSWORD = $DbPassword

function Invoke-Psql {
    param([string]$File)
    $args = @("-h", $DbHost, "-p", $DbPort, "-U", $DbUser, "-d", $DbName, "-f", $File)
    & psql @args
    if ($LASTEXITCODE -ne 0) { throw "psql failed on $File" }
}

Write-Host "======================================================"
Write-Host " WKND Sample Website — Install"
Write-Host " Target: ${DbUser}@${DbHost}:${DbPort}/${DbName}"
Write-Host "======================================================"

# Idempotency check
$check = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -tAc "SELECT COUNT(*) FROM sites WHERE site_id = 'wknd'" 2>$null
if ($check -gt 0) {
    Write-Host "ℹ  WKND site already installed. Running in update mode."
}

$DataDir = Join-Path $ScriptDir "data"
$Files = @(
    "01_site_components.sql",
    "02_templates.sql",
    "03_experience_fragments.sql",
    "04_home.sql",
    "05_adventures.sql",
    "06_magazine.sql",
    "07_faqs_about.sql"
)

foreach ($f in $Files) {
    Write-Host "  -> Applying $f ..."
    Invoke-Psql -File (Join-Path $DataDir $f)
}

Write-Host ""
Write-Host "✅  WKND sample website installed successfully."
Write-Host ""
Write-Host "Start the WKND frontend:"
Write-Host "  cd $ScriptDir\frontend"
Write-Host "  npm install; npm run dev"
Write-Host ""
Write-Host "Open: http://localhost:3100"
