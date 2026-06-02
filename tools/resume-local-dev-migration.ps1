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

function Stop-IfDirtyWorkingTree([string]$RepoRoot) {
  $porcelain = git -C $RepoRoot status --porcelain
  if (-not $porcelain) {
    return
  }

  Write-Host ""
  Write-Host "========================================" -ForegroundColor Red
  Write-Host "STOP: Uncommitted changes in $RepoRoot" -ForegroundColor Red
  Write-Host "停止: 未保存の変更があります（$RepoRoot）" -ForegroundColor Red
  Write-Host "========================================" -ForegroundColor Red
  Write-Host ""
  Write-Host "This script would run 'git restore .' and can erase Cursor work."
  Write-Host "このスクリプトは 'git restore .' を実行するため、Cursor の作業内容が消える可能性があります。"
  Write-Host ""
  Write-Host "Changed / untracked files (git status --porcelain):"
  Write-Host "変更・未追跡ファイル:"
  @($porcelain) | ForEach-Object { Write-Host "  $_" }
  Write-Host ""
  Write-Host "Before running this script again:"
  Write-Host "次のいずれかを済ませてから、もう一度実行してください:"
  Write-Host "  - Commit your work (git add + git commit), or"
  Write-Host "    作業をコミットする（git add → git commit）"
  Write-Host "  - Stash your work (git stash push -m ""resume migration""), or"
  Write-Host "    一時退避する（git stash push -m ""resume migration""）"
  Write-Host "  - Ask Codex or Cursor to help you save or move the changes."
  Write-Host "    Codex または Cursor に保存・整理を依頼する"
  Write-Host ""
  Write-Host "No files were restored. Exiting."
  Write-Host "ファイルは変更されていません。終了します。"
  exit 1
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

Write-Step "Check for uncommitted work (safety stop)"
Stop-IfDirtyWorkingTree -RepoRoot $DevRoot

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
