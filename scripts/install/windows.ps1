$ErrorActionPreference = 'Stop'

$repository = 'pietrodileo/howlong'
$headers = @{
  Accept = 'application/vnd.github+json'
  'User-Agent' = 'HowLong-installer'
}

$release = Invoke-RestMethod `
  -Uri "https://api.github.com/repos/$repository/releases/latest" `
  -Headers $headers

if ($release.draft -or $release.prerelease -or $release.tag_name -notmatch '^v[0-9]+\.[0-9]+\.[0-9]+$') {
  throw 'The latest GitHub release is not a stable release.'
}

if ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString() -ne 'X64') {
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
  Write-Host 'Starting the installer...'
  Start-Process -FilePath $temporaryInstaller -Wait
}
finally {
  Remove-Item -LiteralPath $temporaryInstaller -Force -ErrorAction SilentlyContinue
}
