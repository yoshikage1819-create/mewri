# Fast resume for moving Mewri work to C:\dev\mewri\ph-cursor.
# Avoids robocopy (slow on OneDrive). Run from any PowerShell:
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\resume-local-dev-migration.ps1

$ErrorActionPreference = "Stop"
$OneDriveRoot = Join-Path $env:USERPROFILE "OneDrive\ドキュメント\ph-cursor"
$DevRoot = "C:\dev\mewri\ph-cursor"

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message"
}

if (-not (Test-Path $DevRoot)) {
  throw "Missing $DevRoot. Create it first (see docs/mewri_owner_local_dev_disk_setup.md)."
}

Write-Step "Compare commits"
$odCommit = (git -C $OneDriveRoot rev-parse HEAD 2>$null)
$devCommit = (git -C $DevRoot rev-parse HEAD)
Write-Host "OneDrive: $odCommit"
Write-Host "C:\dev  : $devCommit"

if ($odCommit -and $odCommit -ne $devCommit) {
  Write-Warning "Commits differ. Prefer: git -C '$DevRoot' fetch && git checkout $odCommit"
}

Write-Step "Reset C:\dev working tree to HEAD (fast; no robocopy)"
git -C $DevRoot restore .
git -C $DevRoot status --short --branch

Write-Step "Install dependencies only under C:\dev (optional but recommended)"
if (-not (Test-Path (Join-Path $DevRoot "node_modules"))) {
  Push-Location $DevRoot
  try {
    npm.cmd install
  } finally {
    Pop-Location
  }
} else {
  Write-Host "node_modules already exists; skipped npm install."
}

Write-Step "Done"
Write-Host @"

Next in Cursor:
  File -> Open Folder -> $DevRoot

If OneDrive asks to delete many cloud files, cancel unless only node_modules/.next are listed.

"@
