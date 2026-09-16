#!/usr/bin/env bash
set -euo pipefail

script_path="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/scripts/install/unix.sh"
test_root="$(mktemp -d)"
trap 'rm -rf -- "$test_root"' EXIT

run_case() {
  local system="$1"
  local architecture="$2"
  local expected_asset="$3"
  local requested_version="${4:-}"
  local home="$test_root/$architecture${requested_version:+-$requested_version}"
  local output

  mkdir -p "$home"
  if ! output="$(
    HOME="$home" \
      HOWLONG_TEST_SYSTEM="$system" \
      HOWLONG_TEST_ARCHITECTURE="$architecture" \
      HOWLONG_EXPECTED_ASSET="$expected_asset" \
      HOWLONG_TEST_VERSION="$requested_version" \
      bash -c '
        uname() {
          case "$1" in
            -s) printf "%s\n" "$HOWLONG_TEST_SYSTEM" ;;
            -m) printf "%s\n" "$HOWLONG_TEST_ARCHITECTURE" ;;
            *) return 1 ;;
          esac
        }

        curl() {
          if [[ "$*" != *"/releases/download/"* ]]; then
            if [[ -n "$HOWLONG_TEST_VERSION" ]]; then
              [[ "$*" == *"/releases/tags/v9.9.9" ]] || return 1
            else
              [[ "$*" == *"/releases/latest" ]] || return 1
            fi
            printf '%s\n' "{\"tag_name\":\"v9.9.9\"}"
            return 0
          fi

          local destination=""
          local url=""
          while (($# > 0)); do
            if [[ "$1" == "-o" ]]; then
              destination="$2"
              shift 2
            else
              url="$1"
              shift
            fi
          done

          [[ "$url" == "https://github.com/pietrodileo/howlong/releases/download/v9.9.9/$HOWLONG_EXPECTED_ASSET" ]] || return 1
          printf "%s\n" "fake installer" > "$destination"
        }

        export -f uname curl
        bash "$1" "$HOWLONG_TEST_VERSION"
      ' bash "$script_path"
  )"; then
    printf '%s\n' "$output" >&2
    return 1
  fi

  [[ -x "$home/.local/bin/howlong" ]] || {
    printf 'installer was not installed for %s %s\n%s\n' "$system" "$architecture" "$output" >&2
    return 1
  }
}

run_case Linux x86_64 HowLong_9.9.9_amd64.AppImage
run_case Linux aarch64 HowLong_9.9.9_aarch64.AppImage
run_case Linux arm64 HowLong_9.9.9_aarch64.AppImage
run_case Linux x86_64 HowLong_9.9.9_amd64.AppImage 9.9.9

printf '%s\n' 'installer smoke tests passed'
