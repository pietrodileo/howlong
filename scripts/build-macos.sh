#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir/.."

export PATH="$HOME/.cargo/bin:$PATH"

command -v npm >/dev/null || { echo "Error: npm is not installed." >&2; exit 1; }
command -v cargo >/dev/null || {
  echo "Error: Rust is not installed. Install it from https://rustup.rs, then rerun this script." >&2
  exit 1
}

npm run tauri build
