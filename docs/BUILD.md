# Build and release workflow

This document defines how HowLong? is developed, packaged, signed, and released. It keeps ordinary open-source builds independent from the private key used by the official updater channel. For the user-facing feature list, see the [English manual](guides/GUIDE.en.md) or [Italian manual](guides/GUIDE.it.md).

## Build types

| Build | Purpose | Signing key |
| --- | --- | --- |
| Development | Run and change the app locally | Not required |
| Pre-release | Test an installer before a stable release | Not required; updater artifacts disabled |
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

Use a version such as `0.7.1-beta.1` for a pre-release. Pre-release tags are not part of the stable updater channel and must not replace a stable release.

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

The release overlay enables `bundle.createUpdaterArtifacts`. The platform scripts and GitHub Actions use it for official builds. Tauri then creates the normal distribution packages and the signed updater artifacts for the target platform:

| Platform | First installation | In-app updater artifact |
| --- | --- | --- |
| Windows x64 | NSIS `.exe` and MSI | Signed NSIS `.exe` |
| macOS Intel | `.dmg` | Signed `.app.tar.gz` |
| macOS Apple Silicon | `.dmg` | Signed `.app.tar.gz` |
| Linux x64 | AppImage and other packages | Signed AppImage |

The updater feed contains one entry per supported operating system and architecture. An installation downloads only the artifact matching its own platform.

### Installer publishing

Do not upload installers manually. When a stable tag is pushed, GitHub Actions builds the platform packages, signs the updater artifacts, generates release notes from the tag and previous release, creates the GitHub Release, and uploads the installers, signatures, and `latest.json`.

New users download the normal installer from the GitHub Release:

- Windows: `.exe` or `.msi`
- macOS: `.dmg`
- Linux: `.AppImage` or another published package

Existing installations use the signed updater artifact referenced by `latest.json`. The Updates panel downloads only the artifact matching the current operating system and architecture, then installs it and relaunches the app when required.

Local builds do not publish anything. Their packages remain under `src-tauri/target/release/bundle/`.

### First-install bootstrapper

The repository includes one-line bootstrapper commands for first installation from the latest stable GitHub Release:

```powershell
irm https://raw.githubusercontent.com/pietrodileo/howlong/main/scripts/install/windows.ps1 | iex
```

```bash
curl -fsSL https://raw.githubusercontent.com/pietrodileo/howlong/main/scripts/install/unix.sh | sh
```

The PowerShell script downloads and starts the Windows x64 NSIS installer. The Bash script downloads the matching macOS Intel/Apple Silicon DMG or Linux x64 AppImage; macOS installs per-user under `~/Applications`, while Linux installs the AppImage as `~/.local/bin/howlong`. The scripts query `/releases/latest`, reject prereleases, and never use the updater feed or private signing key.

These commands execute a remote script, so review it before piping it to a shell. For reproducible automation, replace `main` in the raw URL with a reviewed commit or release tag. The bootstrapper is for first installation; after installation, use the signed Tauri updater from **Settings → Updates**.

The bootstrapper downloads the release installer over HTTPS but does not itself verify a Tauri updater `.sig` file. For public distribution, add platform-native signing and notarization (especially on macOS) and keep the release account and repository protected.

## Versioning

HowLong? follows semantic versioning in the form `x.y.z`:

| Part | Name | Increment when |
| --- | --- | --- |
| `x` | Major | The release introduces incompatible or fundamental product changes. |
| `y` | Minor | The release adds backward-compatible functionality. |
| `z` | Patch | The release contains backward-compatible fixes or small improvements. |

Examples:

- `0.5.1` → `0.5.2` for a bug fix
- `0.5.1` → `0.6.0` for a new feature
- `0.7.0` → `0.7.1` for a patch release
- `0.5.1` → `1.0.0` for the first stable major release

Stable release tags use a `v` prefix, for example `v0.7.1`. Pre-release versions may use a suffix such as `0.7.1-beta.1`; tags containing a hyphen are excluded from the stable release workflow.

Keep the application version synchronized in:

- `package.json` and `package-lock.json`
- `src-tauri/Cargo.toml` and `src-tauri/Cargo.lock`
- `src-tauri/tauri.conf.json`

The About dialog and Updates panel read the frontend version through `src/shared/version.ts`, which imports the version from `package.json`.

## Signing key handling

The public key belongs in `src-tauri/tauri.conf.json`; it is not secret and is needed by installed copies to verify updates. The private key must never be committed or placed in public documentation.

Generate the protected key once, and keep using the same key for every official release. On Windows PowerShell:

```powershell
npm.cmd run tauri -- signer generate -w "$env:USERPROFILE\.tauri\howlong.key"
```

On macOS/Linux:

```bash
npm run tauri -- signer generate -w "$HOME/.tauri/howlong.key"
```

The command asks for a non-empty passphrase. If the key file already exists, do not use `--force` unless you deliberately intend to replace the publisher key and have a key-rotation plan. Losing either the private key or its passphrase prevents future official update packages from being accepted by existing installations.

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

Add them under the repository's **Settings → Secrets and variables → Actions → Secrets → New repository secret**. Use repository **Secrets**, not plain-text Variables. The passphrase is needed only by the release workflow; contributors and forks can build prereleases without either secret.

Keep the same key for all releases. Changing the public key after publishing requires a deliberate key-rotation strategy.

## Stable release tagging

Stable releases should be created deliberately, not on every merge. Tag creation is currently a manual Git operation; pushing the tag is what activates the automatic release workflow.

1. Choose the next stable version, for example `0.7.1`.
2. Update and commit the synchronized version files listed in [Versioning](#versioning).
3. Run the frontend, smoke, and platform checks.
4. Merge the version commit into `main` and push `main`.
5. Pull the latest `main`, create an annotated stable tag, and push it:

   ```powershell
   git switch main
   git pull --ff-only origin main
   git tag -a v0.7.1 -m "HowLong 0.7.1"
   git push origin v0.7.1
   ```

6. The tag triggers `.github/workflows/release.yml`.
7. GitHub Actions builds all four targets, signs updater artifacts, generates the release description, creates the stable GitHub Release, and uploads `latest.json`.

The release description is generated automatically from the new tag and the previous release tag through the Tauri release action. GitHub groups merged Pull Requests, lists contributors, and adds a full-changelog comparison link. Commits made directly without a Pull Request are included in that comparison link.

Before publishing, optionally run the manual `Smoke test release notes` workflow from **GitHub → Actions**. Leave `tag_name` empty to use an isolated smoke-test name, or provide an existing tag to inspect that release context. Open the completed run and its `Summary` to inspect the generated title and release-note body. It generates notes only; it does not create a tag, GitHub Release, installer, or upload.

Tags containing a hyphen, such as `v0.7.1-beta.1`, are excluded from the stable release job.

There is no separate tag-creation workflow. The private signing key is not needed to create or push a tag; it is used only by the release build after the tag exists. The repository's `GITHUB_TOKEN` is used by the release workflow to create the GitHub Release and upload its assets.

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

For v0.7.1, the stable release pipeline, base/release configuration split, platform signing-key handling, manual release-notes smoke test, desktop Updates panel, and redesigned settings experience are present on `main`. Future stable releases reuse the same pipeline: update the version, push the version commit to `main`, then push a stable `vX.Y.Z` tag.
