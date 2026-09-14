#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir/../.."

export PATH="$HOME/.cargo/bin:$PATH"

command -v npm >/dev/null || { echo "Error: npm is not installed." >&2; exit 1; }
command -v cargo >/dev/null || {
  echo "Error: Rust is not installed. Install it from https://rustup.rs, then rerun this script." >&2
  exit 1
}

if [[ -z "${TAURI_SIGNING_PRIVATE_KEY:-}" ]]; then
  signing_key="$HOME/.tauri/howlong.key"
  if [[ ! -f "$signing_key" ]]; then
    echo "Error: Tauri signing key not found at $signing_key." >&2
    echo "Set TAURI_SIGNING_PRIVATE_KEY to a key path or key contents, then rerun this script." >&2
    exit 1
  fi
  export TAURI_SIGNING_PRIVATE_KEY="$signing_key"
fi

if [[ -z "${TAURI_SIGNING_PRIVATE_KEY_PASSWORD:-}" ]]; then
  echo "Error: TAURI_SIGNING_PRIVATE_KEY_PASSWORD must contain the non-empty key passphrase." >&2
  exit 1
fi

npm run tauri build -- --config src-tauri/tauri.release.conf.json
