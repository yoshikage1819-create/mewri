# Fast resume for moving Mewri work to C:\dev\mewri\ph-cursor.
# Run in Windows PowerShell (outside Cursor agent):
#   cd C:\dev\mewri\ph-cursor
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\resume-local-dev-migration.ps1

$ErrorActionPreference = "Stop"
$DevRoot = "C:\dev\mewri\ph-cursor"

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message"
}

function Resolve-LegacyOneDriveRepo {
  $candidates = @(
    (Join-Path ([Environment]::GetFolderPath("MyDocuments")) "ph-cursor"),
    (Join-Path $env:USERPROFILE "OneDrive\Documents\ph-cursor")
  )

  if ($env:OneDrive) {
    $candidates += (Join-Path $env:OneDrive "Documents\ph-cursor")
  }

  foreach ($path in $candidates) {
    if (Test-Path (Join-Path $path ".git")) {
      return $path
    }
  }

  return $null
}

if (-not (Test-Path $DevRoot)) {
  throw "Missing $DevRoot. Create it first (see docs/mewri_owner_local_dev_disk_setup.md)."
}

$OneDriveRoot = Resolve-LegacyOneDriveRepo

Write-Step "Compare commits (optional)"
$devCommit = (git -C $DevRoot rev-parse HEAD)
Write-Host "C:\dev  : $devCommit"

if ($OneDriveRoot) {
  Write-Host "Legacy copy: $OneDriveRoot"
  $odCommit = (git -C $OneDriveRoot rev-parse HEAD 2>$null)
  Write-Host "OneDrive: $odCommit"
  if ($odCommit -and $odCommit -ne $devCommit) {
    Write-Warning "Commits differ. After backup, align C:\dev with Git or copy only what you need."
  }
} else {
  Write-Host "Legacy OneDrive ph-cursor not found; skipped compare (C:\dev only is OK)."
}

Write-Step "Reset C:\dev working tree to HEAD (fast; no robocopy)"
git -C $DevRoot restore .
git -C $DevRoot status --short --branch

Write-Step "Install dependencies only under C:\dev"
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
