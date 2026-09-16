param(
  [string]$Version
)

$ErrorActionPreference = 'Stop'

$repository = 'pietrodileo/howlong'
$headers = @{
  Accept = 'application/vnd.github+json'
  'User-Agent' = 'HowLong-installer'
}

$requestedTag = $null
if (-not [string]::IsNullOrWhiteSpace($Version)) {
  if ($Version -notmatch '^v?[0-9]+\.[0-9]+\.[0-9]+$') {
    throw 'Version must be a stable release in the form X.Y.Z or vX.Y.Z.'
  }
  $requestedTag = "v$($Version -replace '^v', '')"
}

$releaseUri = if ($requestedTag) {
  "https://api.github.com/repos/$repository/releases/tags/$requestedTag"
} else {
  "https://api.github.com/repos/$repository/releases/latest"
}

$release = Invoke-RestMethod `
  -Uri $releaseUri `
  -Headers $headers

if ($release.draft -or $release.prerelease -or $release.tag_name -notmatch '^v[0-9]+\.[0-9]+\.[0-9]+$') {
  if ($requestedTag) {
    throw "Requested release $requestedTag is not a stable release."
  }
  throw 'The latest GitHub release is not a stable release.'
}

$architecture = if ($env:PROCESSOR_ARCHITEW6432) {
  $env:PROCESSOR_ARCHITEW6432
} else {
  $env:PROCESSOR_ARCHITECTURE
}

if ([string]::IsNullOrWhiteSpace($architecture) -or $architecture -notmatch '^(AMD64|X64)$') {
  throw 'The Windows installer currently supports x64 only.'
}

$asset = @($release.assets | Where-Object {
  $_.name -match '^HowLong_[0-9]+\.[0-9]+\.[0-9]+_x64-setup\.exe$'
} | Select-Object -First 1)

if ($asset.Count -eq 0) {
  throw "No Windows x64 installer was found in release $($release.tag_name)."
}

$temporaryInstaller = Join-Path ([System.IO.Path]::GetTempPath()) "HowLong-$([guid]::NewGuid()).exe"

try {
  Write-Host "Downloading HowLong $($release.tag_name) for Windows x64..."
  Invoke-WebRequest -Uri $asset[0].browser_download_url -Headers $headers -OutFile $temporaryInstaller
  Write-Host 'If HowLong is already installed, the installer will update that copy. Your estimates and settings stay on disk.'
  Write-Host 'Starting the installer...'
  Start-Process -FilePath $temporaryInstaller -Wait
}
finally {
  Remove-Item -LiteralPath $temporaryInstaller -Force -ErrorAction SilentlyContinue
}
