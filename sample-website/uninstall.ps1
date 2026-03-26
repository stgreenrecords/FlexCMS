# =============================================================================
# WKND Adventures — FlexCMS Sample Website Uninstaller (PowerShell)
# =============================================================================
param(
    [string]$DbHost     = $env:FLEXCMS_DB_HOST     ?? "localhost",
    [string]$DbPort     = $env:FLEXCMS_DB_PORT     ?? "5432",
    [string]$DbName     = $env:FLEXCMS_DB_NAME     ?? "flexcms",
    [string]$DbUser     = $env:FLEXCMS_DB_USER     ?? "postgres",
    [string]$DbPassword = $env:FLEXCMS_DB_PASSWORD ?? ""
)

$ErrorActionPreference = "Stop"
$env:PGPASSWORD = $DbPassword

Write-Host "======================================================"
Write-Host " WKND Sample Website — Uninstall"
Write-Host " Target: ${DbUser}@${DbHost}:${DbPort}/${DbName}"
Write-Host "======================================================"
Write-Host ""
Write-Host "⚠️  This will permanently delete all WKND data from the database."
$confirm = Read-Host "Type 'YES' to confirm"
if ($confirm -ne "YES") {
    Write-Host "Aborted."
    exit 0
}

$sql = @"
DELETE FROM experience_fragment_metadata WHERE site_id = 'wknd';
DELETE FROM content_nodes WHERE path LIKE 'wknd%' OR path LIKE 'experience-fragments.wknd%';
DELETE FROM component_definitions WHERE resource_type LIKE 'wknd/components/%';
DELETE FROM template_definitions WHERE name LIKE 'wknd/templates/%';
DELETE FROM sites WHERE site_id = 'wknd';
DELETE FROM content_nodes WHERE path = 'experience-fragments'
  AND NOT EXISTS (SELECT 1 FROM content_nodes c2 WHERE c2.parent_path = 'experience-fragments');
"@

& psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $sql
if ($LASTEXITCODE -ne 0) { throw "psql failed during uninstall" }

Write-Host ""
Write-Host "✅  WKND sample website uninstalled successfully."
