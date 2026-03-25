# FlexCMS developer shell helpers
# Source this file in your PowerShell session:
#   . .\.flexrc.ps1
#
# Or add to your $PROFILE for auto-loading when the project is open.
$FlexCmsRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
function flex {
    <#
    .SYNOPSIS
      FlexCMS CLI - manage local development services.
    .EXAMPLE
      flex start local all
      flex status
      flex stop local
      flex logs author
    #>
    & "$FlexCmsRoot\flex.ps1" @args
}
Write-Host "  FlexCMS CLI loaded - type 'flex help' for usage." -ForegroundColor DarkCyan
