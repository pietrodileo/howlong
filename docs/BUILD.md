# Build and release workflow

This guide explains how to develop, package, sign, and release *HowLong?*. Local and pre-release builds do not depend on the private key used by the official updater channel. For user-facing features, see [What's new](WHATS_NEW.md), the [English manual](guides/GUIDE.en.md), or the [Italian manual](guides/GUIDE.it.md).

> **Release automation:** Official stable releases are created automatically by GitHub Actions when a stable `vX.Y.Z` tag is pushed to GitHub. The [`release.yml`](../.github/workflows/release.yml) workflow builds the supported installers, signs the updater artifacts, generates release notes, and publishes the GitHub Release. Tags with a hyphen, such as `v0.7.2-beta.1`, are ignored by the stable release workflow.

## Build from source

Build from source to use the latest features, contribute to the project, or run *HowLong?* on a platform or configuration not covered by the pre-built releases. This gives you access to the source code and development tools for testing, debugging, and customization.

To run *HowLong?* from a local clone, follow the steps below. If Node.js 20+ and Rust are already installed, setup takes about two minutes. Otherwise, install [Rust](https://www.rust-lang.org/tools/install) and meet the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) first.

## Prerequisites

- **Node.js:** Version 20 or higher
- **Rust:** Stable toolchain
- **Platform tools:**
  - **Windows:** [VS Build Tools 2022](https://visualstudio.microsoft.com/visual-cpp-build-tools/), Windows SDK, WebView2
  - **macOS:** Xcode Command Line Tools
  - **Linux:** WebKitGTK, plus all [Tauri Linux dependencies](https://v2.tauri.app/start/prerequisites/)

## Steps to run locally

1. Run `npm install` to install the dependencies.
2. Choose one development mode:
   - `npm run tauri:dev` launches the full desktop app with filesystem access, dialogs, and native export.
   - `npm run dev` launches the browser-only UI for frontend development and testing; native file integration is unavailable.

   Run only one of these commands at a time.

## Verify changes

After changes to code or dependencies, run the build and the smoke tests that cover the affected areas:

- `npm run build` — type-checks the project and bundles the frontend.
- `npm run smoke` — checks core estimate and contingency workflows.
- `npm run smoke:gantt` — checks planning boards and Gantt scheduling.
- `npm run smoke:analytics` — checks analytics and projection calculations.

Running the full set is recommended before a release.

## Release builds

This section is for maintainers preparing installers or a public release. Installer outputs are written to `src-tauri/target/release/bundle/`. Build on the target operating system to ensure compatibility; for example, build Windows installers on Windows.

Use this sequence:

1. Verify the change with the frontend build and the affected smoke tests.
2. Use a pre-release build to test installers locally.
3. Configure the protected signing key before creating an official release; see [Signing key handling](#signing-key-handling).
4. Merge the version commit into `main` and push `main`.
5. Create and push a stable `vX.Y.Z` tag; see [Stable release tagging](#stable-release-tagging).

The following scripts build pre-release and official release installers for each supported platform:

| Platform | Pre-release script | Official release script |
| --- | --- | --- |
| Windows | `scripts\windows\build-prerelease.bat` | `scripts\windows\build-release.bat` |
| macOS | `scripts/osx/build-prerelease.sh` | `scripts/osx/build-release.sh` |
| Linux | `scripts/linux/build-prerelease.sh` | `scripts/linux/build-release.sh` |
| Any | `npm run tauri build` (default config) | Use the platform release script |

Pre-release scripts create unsigned installers for local testing. Release scripts create signed installers for distribution.

### Pre-release builds

Use the pre-release scripts for local installer testing. They retain the application name **HowLong**, use a distinct application identifier, and neither require signing keys nor generate updater artifacts.

### Official releases

Use the release scripts for signed local installers. They require a valid key and a non-empty `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`; see [Signing key handling](#signing-key-handling) for key locations, environment variables, and GitHub Actions secrets. If the signing setup is incomplete, the scripts stop instead of producing an unsigned official build.

### Stable tags and the release workflow

To publish an official updater release, push a stable tag such as `v1.2.3`. The workflow ignores tags containing a hyphen, such as `v1.2.3-beta`. For a stable tag, GitHub Actions:

- Builds release artifacts for Windows x64, Linux x64, Linux ARM64, macOS Intel, and macOS Apple Silicon.
- Automatically generates release notes by comparing the tag to the previous release.
- Uploads the signed installers, updater bundles, signature files, and `latest.json` to the new GitHub Release.
- *HowLong?*'s updater detects the new official release.

The required GitHub Actions secrets are documented in [Signing key handling](#signing-key-handling).

## Installer publishing

After the workflow completes, new users download the installer from the GitHub Release and existing installations update through the signed artifact referenced by `latest.json`.

New users download the normal installer from the GitHub Release:

- Windows: `.exe` or `.msi`
- macOS: `.dmg`
- Linux: `.AppImage` or another published package

The Updates panel downloads only the artifact matching the current operating system and architecture, then installs it and relaunches the app when required.

Local builds do not publish anything. Their packages remain under `src-tauri/target/release/bundle/`.

## First-install bootstrapper

The repository includes one-line bootstrapper commands for first installation from the latest stable GitHub Release:

```powershell
irm https://raw.githubusercontent.com/pietrodileo/howlong/main/scripts/install/windows.ps1 | iex
```

```bash
curl -fsSL https://raw.githubusercontent.com/pietrodileo/howlong/main/scripts/install/unix.sh | bash
```

The PowerShell script downloads and starts the Windows x64 NSIS installer. The Bash script downloads the matching macOS Intel/Apple Silicon DMG or Linux x64/ARM64 AppImage; macOS installs per-user under `~/Applications`, while Linux installs the AppImage as `~/.local/bin/howlong`. The scripts query GitHub Releases for the latest release or requested tag, reject prereleases, and never use the updater feed or private signing key.

To install a specific stable version, pass `0.7.2` or `v0.7.2` to the Unix script:

```bash
curl -fsSL https://raw.githubusercontent.com/pietrodileo/howlong/main/scripts/install/unix.sh | bash -s -- 0.7.2
```

On Windows, download and invoke the PowerShell script with its `-Version` parameter:

```powershell
$script = irm https://raw.githubusercontent.com/pietrodileo/howlong/main/scripts/install/windows.ps1
& ([scriptblock]::Create($script)) -Version '0.7.2'
```

Leave the version out to install the latest stable release. The requested release must contain an installer for the current operating system and architecture.

These commands execute a remote script, so review it before piping it to a shell. For reproducible automation, replace `main` in the raw URL with a reviewed commit or release tag. The bootstrapper is for first installation; after installation, use the signed Tauri updater from **Settings → Updates**.

The bootstrapper downloads the release installer over HTTPS but does not itself verify a Tauri updater `.sig` file. For public distribution, add platform-native signing and notarization (especially on macOS) and keep the release account and repository protected.

## Versioning

*HowLong?* follows semantic versioning in the form `x.y.z`:

| Part | Name | Increment when |
| --- | --- | --- |
| `x` | Major | The release introduces incompatible or fundamental product changes. |
| `y` | Minor | The release adds backward-compatible functionality. |
| `z` | Patch | The release contains backward-compatible fixes or small improvements. |

Examples:

- `0.5.1` → `0.5.2` for a bug fix
- `0.5.1` → `0.6.0` for a new feature
- `0.7.1` → `0.7.2` for a patch release
- `0.5.1` → `1.0.0` for the first stable major release

Stable release tags use a `v` prefix, for example `v0.7.2`. Pre-release versions may use a suffix such as `0.7.2-beta.1`.

Keep the application version synchronized in:

- `package.json` and `package-lock.json`
- `src-tauri/Cargo.toml` and `src-tauri/Cargo.lock`
- `src-tauri/tauri.conf.json`

The About dialog and Updates panel read the frontend version through `src/shared/version.ts`, which imports the version from `package.json`.

## Signing key handling

The public key belongs in `src-tauri/tauri.conf.json`. It is safe to commit because installed copies use it to verify updates. Never commit or publish the private key.

Generate one protected key and keep using it for every official release. On Windows PowerShell:

```powershell
npm.cmd run tauri -- signer generate -w "$env:USERPROFILE\.tauri\howlong.key"
```

On macOS/Linux:

```bash
npm run tauri -- signer generate -w "$HOME/.tauri/howlong.key"
```

The command asks for a non-empty passphrase. If the key file already exists, do not use `--force` unless you intend to replace the publisher key and have a key-rotation plan. Losing the key or its passphrase prevents existing installations from accepting future updates.

For local official builds, the platform scripts use:

- Windows: `%USERPROFILE%/.tauri/howlong.key`
- macOS/Linux: `~/.tauri/howlong.key`

An explicitly set `TAURI_SIGNING_PRIVATE_KEY` takes precedence over the default path. `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` must contain the non-empty passphrase used to generate the key. The passphrase protects against theft of the key file alone.

If an earlier key has no passphrase, generate a new protected key before the first official release. Replacing the public key is safe until an update signed with the old key has been published; after that, replacement requires a planned rotation strategy.

On Windows, set the passphrase only for the current PowerShell session and run the release script:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = Read-Host "Tauri signing passphrase"
.\scripts\windows\build-release.bat
Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD
```

`Read-Host` keeps the passphrase out of PowerShell history. Do not commit it, put it in a script, or share it in chat. For GitHub Actions, use the repository secrets below.

For GitHub Actions, configure these repository secrets before pushing the first stable tag:

- `TAURI_SIGNING_PRIVATE_KEY`: complete private-key contents
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: the non-empty passphrase used to generate the protected key

Add them under **Settings → Secrets and variables → Actions → Secrets → New repository secret**. Use repository **Secrets**, not plain-text Variables. Contributors and forks can build pre-releases without them.

Keep this key for all releases. Changing the public key after publication requires a deliberate rotation strategy.

## Stable release tagging

Create stable releases deliberately rather than on every merge. Tagging is manual; pushing the tag activates the automated release workflow.

1. Choose the next stable version, for example `0.7.2`.
2. Update and commit the synchronized version files listed in [Versioning](#versioning).
3. Run `npm run build` and the smoke tests affected by the change.
4. Merge the version commit into `main` and push `main`.
5. Pull the latest `main`, create an annotated stable tag, and push it:

   ```powershell
   git switch main
   git pull --ff-only origin main
   git tag -a v0.7.2 -m "HowLong 0.7.2"
   git push origin v0.7.2
   ```
6. Pushing the tag triggers `.github/workflows/release.yml`, which builds all five targets, signs the updater artifacts, generates release notes, creates the GitHub Release, and uploads `latest.json`.

The release description is generated automatically from the new tag and the previous release tag through the Tauri release action. GitHub groups merged Pull Requests, lists contributors, and adds a full-changelog comparison link. Commits made directly without a Pull Request are included in that comparison link.

Keep the short, user-facing feature list for each stable release in [What's new](WHATS_NEW.md). The GitHub release description remains the generated history of commits and Pull Requests.

Before publishing, optionally run the manual `Smoke test release notes` workflow from **GitHub → Actions**. Leave `tag_name` empty to use an isolated smoke-test name, or provide an existing tag to inspect that release context. Open the completed run and its `Summary` to inspect the generated title and release-note body. It generates notes only; it does not create a tag, GitHub Release, installer, or upload.

The private signing key is not needed to create or push a tag; GitHub Actions uses it only after the tag exists. The repository's `GITHUB_TOKEN` creates the GitHub Release and uploads its assets.

## Updates and skipped versions

The updater points to the newest stable `latest.json`. An installation goes directly from its current version to the newest available stable version; intermediate releases are not installed or executed. Each release must therefore preserve or migrate existing workspace data when its schema changes.

## Open-source forks

Forks remain free to build and distribute *HowLong?*. The official updater signature is a publisher trust mechanism, not a restriction on the source code.

The default build trusts the official GitHub Releases endpoint and public key. Configure a fork that publishes its own binaries as follows:

1. The Tauri `identifier`, to avoid installation and data-directory collisions.
2. The updater `endpoints`, or disable the updater.
3. The updater public key, using a new key pair.
4. The GitHub Actions signing secrets.

If a fork keeps the official endpoint and public key, it may follow upstream releases and will not accept releases signed by the fork's own key.

## Current status

The `main` branch uses the stable release workflow described above. For the user-facing feature history, see [What's new](WHATS_NEW.md). Future stable releases reuse the same pipeline: update the version, push the version commit to `main`, then push a stable `vX.Y.Z` tag.
