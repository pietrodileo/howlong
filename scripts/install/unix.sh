#!/usr/bin/env bash
set -euo pipefail

repository="pietrodileo/howlong"
api_url="https://api.github.com/repos/${repository}/releases/latest"

command -v curl >/dev/null || {
  echo "Error: curl is required." >&2
  exit 1
}

release_json="$(curl -fsSL -H 'Accept: application/vnd.github+json' -A 'HowLong-installer' "$api_url")"
tag_name="$(printf '%s\n' "$release_json" | sed -n 's/.*"tag_name":[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)"

if [[ ! "$tag_name" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: the latest GitHub release is not a stable release." >&2
  exit 1
fi

version="${tag_name#v}"
system="$(uname -s)"
architecture="$(uname -m)"

case "$system:$architecture" in
  Darwin:x86_64)
    asset="HowLong_${version}_x64.dmg"
    ;;
  Darwin:arm64)
    asset="HowLong_${version}_aarch64.dmg"
    ;;
  Linux:x86_64)
    asset="HowLong_${version}_amd64.AppImage"
    ;;
  *)
    echo "Error: no published HowLong installer for ${system} ${architecture}." >&2
    exit 1
    ;;
esac

destination=''
existing_installation=''
case "$system" in
  Darwin)
    destination="$HOME/Applications/HowLong.app"
    if [[ -e "$destination" ]]; then
      existing_installation="$destination"
    elif [[ -e "/Applications/HowLong.app" ]]; then
      existing_installation="/Applications/HowLong.app"
    fi
    ;;
  Linux)
    destination="$HOME/.local/bin/howlong"
    if [[ -e "$destination" ]]; then
      existing_installation="$destination"
    fi
    ;;
esac

if [[ -n "$existing_installation" ]]; then
  echo "Warning: an existing HowLong installation was found at $existing_installation."
  if [[ "$system" == 'Darwin' && "$existing_installation" != "$destination" ]]; then
    echo "This installer uses $destination, so it will install a separate user copy. Both apps may remain."
  else
    echo 'It will be updated. Your estimates and settings will be kept.'
  fi
fi

download_url="https://github.com/${repository}/releases/download/${tag_name}/${asset}"
temporary_directory="$(mktemp -d)"

cleanup() {
  rm -rf "$temporary_directory"
}
trap cleanup EXIT

echo "Downloading HowLong ${tag_name} for ${system} ${architecture}..."
curl -fL --retry 3 -o "$temporary_directory/$asset" "$download_url"

case "$system" in
  Darwin)
    mount_point="$temporary_directory/mount"
    mkdir -p "$mount_point" "$HOME/Applications"
    hdiutil attach "$temporary_directory/$asset" -readonly -nobrowse -mountpoint "$mount_point" >/dev/null
    app_path=''
    for candidate in "$mount_point"/*.app; do
      if [[ -d "$candidate" ]]; then
        app_path="$candidate"
        break
      fi
    done
    if [[ -z "$app_path" ]]; then
      hdiutil detach "$mount_point" -quiet || true
      echo 'Error: no application bundle was found in the DMG.' >&2
      exit 1
    fi
    ditto "$app_path" "$destination"
    hdiutil detach "$mount_point" -quiet
    echo "HowLong installed at $destination"
    open "$destination"
    ;;
  Linux)
    mkdir -p "$(dirname "$destination")"
    install -m 755 "$temporary_directory/$asset" "$destination"
    echo "HowLong installed at $destination"
    ;;
esac
