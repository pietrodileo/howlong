# Build and release workflow

This document defines how HowLong? is developed, packaged, signed, and released. It keeps ordinary open-source builds independent from the private key used by the official updater channel.

## Build types

| Build | Purpose | Signing key |
| --- | --- | --- |
| Development | Run and change the app locally | Not required |
| Pre-release | Test an installer before a stable release | Not required for updater artifacts |
| Official stable release | Publish installers and updater artifacts | Required |

### Development

Install dependencies and run the frontend or desktop app:

```text
npm install
npm run build
npm run tauri:dev
```

`npm run build` checks and bundles the frontend. `npm run tauri:dev` runs the desktop app with native capabilities. Neither command needs the official updater private key.

### Pre-release builds

Pre-release builds are for local or contributor testing. They must remain independent from the official stable update channel:

```text
# Windows
scripts\windows\build-prerelease.bat
# macOS
./scripts/osx/build-prerelease.sh
# Linux
./scripts/linux/build-prerelease.sh
```

The base Tauri configuration does not create updater artifacts. The prerelease overlay uses a separate application identifier so it cannot collide with the official installation. Do not use the official stable updater channel for prerelease testing.

Use a version such as `0.7.0-beta.1` for a pre-release. Pre-release tags are not part of the stable updater channel and must not replace a stable release.

### Official stable releases

The signed release build uses a separate configuration overlay:

```text
npm run tauri build -- --config src-tauri/tauri.release.conf.json
```

Use the platform-specific release script for local signing:

```text
# Windows
scripts\windows\build-release.bat
# macOS
./scripts/osx/build-release.sh
# Linux
./scripts/linux/build-release.sh
```

The release overlay enables `bundle.createUpdaterArtifacts`. The platform scripts and GitHub Actions will use it for official builds. Tauri then creates the normal distribution packages and the signed updater artifacts for the target platform:

| Platform | First installation | In-app updater artifact |
| --- | --- | --- |
| Windows x64 | NSIS `.exe` and MSI | Signed NSIS `.exe` |
| macOS Intel | `.dmg` | Signed `.app.tar.gz` |
| macOS Apple Silicon | `.dmg` | Signed `.app.tar.gz` |
| Linux x64 | AppImage and other packages | Signed AppImage |

The updater feed contains one entry per supported operating system and architecture. An installation downloads only the artifact matching its own platform.

### Installer publishing

Do not upload installers manually. When the stable tag is pushed, GitHub Actions builds the platform packages, signs the updater artifacts, creates the GitHub Release, and uploads the installers, signatures, and `latest.json`.

New users download the normal installer from the GitHub Release:

- Windows: `.exe` or `.msi`
- macOS: `.dmg`
- Linux: `.AppImage` or another published package

Existing installations use the signed updater artifact referenced by `latest.json`. The Updates panel downloads only the artifact matching the current operating system and architecture, then installs it and relaunches the app when required.

Local builds do not publish anything. Their packages remain under `src-tauri/target/release/bundle/`.

## Signing key handling

The public key belongs in `src-tauri/tauri.conf.json`; it is not secret and is needed by installed copies to verify updates. The private key must never be committed or placed in public documentation.

For local official builds, the platform scripts use:

- Windows: `%USERPROFILE%/.tauri/howlong.key`
- macOS/Linux: `~/.tauri/howlong.key`

An explicitly set `TAURI_SIGNING_PRIVATE_KEY` takes precedence. `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` must contain the non-empty passphrase used to generate the protected release key. A passphrase protects against theft of the key file alone.

If a key was generated earlier without a passphrase, generate a new protected key before the first official release. Replacing the public key is safe until an update signed with the old key has been published; after publication, key replacement requires a planned rotation strategy.

On Windows, set the passphrase only for the current PowerShell session and run the release script:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = Read-Host "Tauri signing passphrase"
.\scripts\windows\build-release.bat
Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD
```

`Read-Host` keeps the passphrase out of the PowerShell command history. Do not commit it, put it in a script, or send it in chat. For GitHub Actions, use the repository secret described below instead.

For GitHub Actions, configure these repository secrets:

- `TAURI_SIGNING_PRIVATE_KEY`: complete private-key contents
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: the non-empty passphrase used to generate the protected key

Keep the same key for all releases. Changing the public key after publishing requires a deliberate key-rotation strategy.

## Stable release tagging

Stable releases should be created deliberately, not on every merge:

1. Update and commit the version in `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, and `src-tauri/tauri.conf.json`.
2. Run the frontend, smoke, and platform checks.
3. Start the manual release-tag workflow with a stable version such as `0.7.0`.
4. The workflow verifies that the version is consistent, creates the annotated tag `v0.7.0`, and pushes it.
5. The tag triggers `.github/workflows/release.yml`.
6. GitHub Actions builds all four targets, signs updater artifacts, creates the stable GitHub Release, and uploads `latest.json`.

The release description is generated automatically from the new tag and the previous release tag through the Tauri release action. GitHub groups merged Pull Requests, lists contributors, and adds a full-changelog comparison link. Commits made directly without a Pull Request are included in that comparison link.

Before publishing, run the manual `Smoke test release notes` workflow to verify the GitHub API. Open the completed run and its `Summary` to inspect the generated title and release-note body. It generates notes only; it does not create a tag, GitHub Release, installer, or upload.

Tags containing a hyphen, such as `v0.7.0-beta.1`, are excluded from the stable release job.

The tag-creation workflow is intentionally a separate, explicit action. It should have `contents: write` permission and accept only stable semantic versions (`x.y.z`). The private signing key is not needed to create a tag; it is used only by the release build after the tag exists.

## Updates and skipped versions

The updater points to the newest stable `latest.json`. An installation goes directly from its current version to the newest available stable version; intermediate releases are not installed or executed. Each release must therefore preserve or migrate existing workspace data when its schema changes.

## Open-source forks

Forks remain free to build and distribute HowLong?. The official updater signature is a publisher trust mechanism, not a restriction on the source code.

An independent fork that publishes its own binaries should change:

1. The Tauri `identifier`, to avoid installation and data-directory collisions.
2. The updater `endpoints`, or disable the updater.
3. The updater public key, using a new key pair.
4. The GitHub Actions signing secrets.

If a fork keeps the official endpoint and public key, it may follow upstream releases and will not accept releases signed by the fork's own key.

## Current status

The stable release pipeline, base/release configuration split, and platform signing-key handling are present on the `codex/0.7.0` branch. The manual tag-creation workflow is the next implementation step described by this document.
