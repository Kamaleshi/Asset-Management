param(
  [string]$Source = "backend/database/asset_management.db",
  [string]$DestinationDir = "backups"
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$destinationRoot = Join-Path (Get-Location) $DestinationDir
New-Item -ItemType Directory -Path $destinationRoot -Force | Out-Null

$sourcePath = Join-Path (Get-Location) $Source
if (-not (Test-Path $sourcePath)) {
  Write-Error "Database file not found at $sourcePath"
  exit 1
}

$destinationPath = Join-Path $destinationRoot "asset_management-$timestamp.db"
Copy-Item -Path $sourcePath -Destination $destinationPath -Force
Write-Output "Backup created at $destinationPath"
