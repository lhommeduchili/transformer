# GitHub PWA And Desktop Release Setup

This guide explains how to configure GitHub Pages, GitHub Actions secrets, and the first Transformer desktop prerelease. It assumes no prior knowledge of GitHub Actions or certificate export.

## Before Publishing

The PWA and Electron releases distribute `@ffmpeg/core`, which is declared GPL-2.0-or-later. Before enabling the public PWA or creating a public desktop release, complete the FFmpeg compliance work described in `docs/operations/offline-distribution.md`.

The required work includes:

1. Include the applicable FFmpeg and ffmpeg.wasm copyright and license notices.
2. Include the GPL license text.
3. Provide the exact corresponding source and build information for the distributed `@ffmpeg/core` 0.12.9 binary.
4. Make that source clearly accessible from the PWA and GitHub Release.
5. Review codec and patent implications separately.

Configuring GitHub secrets does not publish anything, so it is safe to complete the secret setup before the licensing review. Enabling Pages or pushing a release tag makes artifacts public.

## Required Secrets

The desktop release workflow expects three repository secrets:

| Secret                     | Purpose                                                           |
| -------------------------- | ----------------------------------------------------------------- |
| `MAC_CERTIFICATE_P12`      | Base64-encoded copy of the macOS certificate and private key      |
| `MAC_CERTIFICATE_PASSWORD` | Password chosen when exporting the `.p12` file                    |
| `MAC_KEYCHAIN_PASSWORD`    | Random password for the temporary Keychain used by GitHub Actions |

GitHub encrypts repository secrets and does not display their values again after they are saved.

Never commit the `.p12` file, private key, passwords, or Base64 certificate text to Git.

## Export The macOS Certificate

1. Open **Keychain Access** using Spotlight.
2. Select the `login` keychain in the sidebar.
3. Select **My Certificates**.
4. Find `transformer self-sign`.
5. Expand the disclosure arrow beside it.
6. Confirm that a private key appears below the certificate.
7. Select the `transformer self-sign` identity.
8. Choose **File > Export Items**.
9. Select **Personal Information Exchange (.p12)** as the format.
10. Save it outside this repository, for example:

```text
~/Documents/Private/transformer-self-sign.p12
```

11. Enter a strong, unique export password when Keychain Access asks.
12. Store that password in a password manager. It will become `MAC_CERTIFICATE_PASSWORD`.
13. Enter the macOS login password if Keychain Access asks for permission to export the private key.

Do not save the file anywhere under `/Users/lhommeduchili/dev/transformer`.

If `.p12` is not available as an export format, the private key was probably not included in the selection.

## Verify The Export

Open Terminal and run:

```sh
openssl pkcs12 \
  -in "$HOME/Documents/Private/transformer-self-sign.p12" \
  -info \
  -noout
```

Enter the export password selected in Keychain Access.

A valid export should mention both a certificate bag and a key bag, commonly shown as `Shrouded Keybag`. If the password is rejected or no private key appears, repeat the export.

The currently configured certificate has this SHA-256 fingerprint:

```text
54:72:12:34:44:0F:FC:29:35:06:28:2C:3E:65:D0:31:48:E4:87:05:D8:1D:34:77:DE:F4:F0:88:89:9D:47:5C
```

It expires on July 20, 2027. Replace the certificate and GitHub secret before that date.

## Add `MAC_CERTIFICATE_P12`

Convert the `.p12` file to Base64 text and copy it to the clipboard:

```sh
base64 -i "$HOME/Documents/Private/transformer-self-sign.p12" | pbcopy
```

This command displays nothing. The encoded certificate is now on the clipboard.

Then:

1. Open `https://github.com/lhommeduchili/transformer/settings/secrets/actions`.
2. Click **New repository secret**.
3. Enter this exact name:

```text
MAC_CERTIFICATE_P12
```

4. Click the **Secret** field.
5. Press `Command+V`.
6. Click **Add secret**.

Base64 is encoding, not encryption. Treat this secret as the private key itself.

## Add `MAC_CERTIFICATE_PASSWORD`

1. Click **New repository secret** again.
2. Enter this exact name:

```text
MAC_CERTIFICATE_PASSWORD
```

3. Enter the password selected while exporting the `.p12`.
4. Do not put quotes around the password.
5. Click **Add secret**.

## Add `MAC_KEYCHAIN_PASSWORD`

This is a separate password used only for a temporary Keychain on the GitHub macOS runner. It must not be the macOS login password or certificate password.

Generate one and copy it to the clipboard:

```sh
openssl rand -hex 32 | pbcopy
```

Then:

1. Click **New repository secret**.
2. Enter this exact name:

```text
MAC_KEYCHAIN_PASSWORD
```

3. Paste the generated value with `Command+V`.
4. Click **Add secret**.

This password does not need to be remembered. It can be replaced with another random value later.

## Confirm The Secrets

Confirm that the repository secrets page lists these names:

```text
MAC_CERTIFICATE_P12
MAC_CERTIFICATE_PASSWORD
MAC_KEYCHAIN_PASSWORD
```

GitHub shows only names and update dates, not secret values.

The names can also be checked from Terminal:

```sh
gh secret list --repo lhommeduchili/transformer
```

Do not attempt to print or retrieve the values.

## Configure GitHub Actions Permissions

1. Open `https://github.com/lhommeduchili/transformer/settings/actions`.
2. Under **Actions permissions**, select **Allow all actions and reusable workflows**.
3. Click **Save** if the section has its own save button.
4. Scroll to **Workflow permissions**.
5. Select **Read and write permissions**.
6. Leave **Allow GitHub Actions to create and approve pull requests** unchecked.
7. Click **Save**.

The workflows also declare their specific permissions in `.github/workflows/`. Secrets are not provided to workflows triggered from forked pull requests.

## Commit And Push The Implementation

The PWA, Electron wrapper, and workflows must be committed to GitHub before they can run.

Open Terminal:

```sh
cd /Users/lhommeduchili/dev/transformer
```

Review the pending changes:

```sh
git status
```

Stage the changes:

```sh
git add -A
```

Review the staged summary:

```sh
git diff --cached --stat
```

Commit:

```sh
git commit -m "Add offline PWA and desktop releases"
```

Push to GitHub:

```sh
git push origin main
```

This starts the `CI` and `Deploy PWA` workflows. Do not perform this publishing step until the FFmpeg release-compliance gate is complete.

## Enable GitHub Pages

After the workflow files have been pushed:

1. Open `https://github.com/lhommeduchili/transformer/settings/pages`.
2. Find **Build and deployment**.
3. Under **Source**, choose **GitHub Actions**.
4. Do not choose **Deploy from a branch**.
5. Open the repository **Actions** tab.
6. Select **Deploy PWA** in the left sidebar.
7. Click **Run workflow**.
8. Select the `main` branch.
9. Click the green **Run workflow** button.
10. Wait for the `build` and `deploy` jobs to become green.

The workflow also runs automatically on every push to `main`. If the automatic run succeeded, it does not need to be started manually.

The expected URL is:

```text
https://lhommeduchili.github.io/transformer/
```

## Test The PWA

Use Chrome or Edge first because they have the most complete filesystem support.

1. Open `https://lhommeduchili.github.io/transformer/`.
2. Wait for the service worker to finish caching.
3. Use the install icon in the browser address bar.
4. Confirm installation.
5. Import a small test audio file.
6. Run one conversion.
7. Close the installed app.
8. Disable Wi-Fi.
9. Reopen the installed app.
10. Perform another conversion.

On Safari, installation may appear under **File > Add to Dock**. Safari normally uses browser downloads instead of Chromium's direct-directory behavior.

## Confirm CI Is Green

Open `https://github.com/lhommeduchili/transformer/actions` and confirm that the latest `CI` workflow is green.

It checks:

- Formatting.
- TypeScript.
- ESLint.
- Unit and integration tests.
- Architecture rules.
- PWA build.
- Electron renderer and shell build.
- Browser E2E tests.
- Offline PWA conversion.

Do not create a release tag while CI is red.

## Create The First Desktop Prerelease

The current package version is `0.1.0-beta.1`. The tag must match it exactly with a leading `v`:

```text
v0.1.0-beta.1
```

Confirm the version:

```sh
cd /Users/lhommeduchili/dev/transformer
node -p "require('./package.json').version"
```

It should print:

```text
0.1.0-beta.1
```

Create the tag:

```sh
git tag -a v0.1.0-beta.1 -m "Transformer v0.1.0-beta.1"
```

Push the tag:

```sh
git push origin v0.1.0-beta.1
```

Pushing the tag immediately starts `Desktop Release` and creates a public GitHub prerelease if all jobs pass. Do not push the tag merely as a test.

## Monitor The Desktop Build

1. Open the repository **Actions** tab.
2. Select **Desktop Release**.
3. Open the run for `v0.1.0-beta.1`.
4. Watch the three platform jobs.

The workflow builds:

| Artifact                | Runner      |
| ----------------------- | ----------- |
| macOS Apple Silicon DMG | macOS arm64 |
| macOS Intel DMG         | macOS x64   |
| Windows x64 installer   | Windows     |

The macOS jobs:

1. Decode the certificate secret.
2. Create a temporary Keychain.
3. Import `transformer self-sign`.
4. Sign the app.
5. Verify the signature.
6. Run a real packaged WAV-to-AIFF conversion.
7. Create the DMG.
8. Generate a SHA-256 checksum.

After all platform jobs pass, the workflow creates a prerelease at:

```text
https://github.com/lhommeduchili/transformer/releases
```

## Test The macOS Download

Choose the correct file:

- Apple Silicon Macs use `arm64`.
- Intel Macs use `x64`.

The Mac type is shown under **Apple menu > About This Mac**.

Verify an Apple Silicon download:

```sh
shasum -a 256 "$HOME/Downloads/Transformer-v0.1.0-beta.1-macos-arm64.dmg"
```

Compare the result with the attached `SHA256-darwin-arm64.txt` file.

Then:

1. Double-click the DMG.
2. Move Transformer into Applications.
3. Try to open Transformer.
4. macOS will reject the first launch because the certificate is self-signed.
5. Open **System Settings > Privacy & Security**.
6. Scroll to the security section.
7. Find the Transformer warning.
8. Click **Open Anyway**.
9. Enter the macOS password if requested.
10. Confirm **Open**.

After this one-time exception, normal double-click launching should work.

Do not ask users to install the self-signed root certificate into their trusted Keychain.

## Test The Windows Download

The macOS certificate cannot sign Windows applications. The current Windows installer is unsigned.

Verify the download in PowerShell:

```powershell
Get-FileHash "$HOME\Downloads\Transformer-v0.1.0-beta.1-windows-x64-Setup.exe" -Algorithm SHA256
```

Compare the result with `SHA256-win32-x64.txt`.

Then:

1. Double-click the installer.
2. SmartScreen will show an unknown-publisher warning.
3. Click **More info**.
4. Click **Run anyway**.

Some managed or corporate Windows systems prohibit unsigned applications completely.

## Publishing A Later Version

For a later beta, change the version in `package.json`, for example:

```text
0.1.0-beta.2
```

Commit and push that version change, wait for CI, then create and push the matching tag:

```sh
git tag -a v0.1.0-beta.2 -m "Transformer v0.1.0-beta.2"
git push origin v0.1.0-beta.2
```

Every release tag must match `package.json` exactly after removing the leading `v`.

## Common Problems

### Certificate Import Fails

The `.p12` password may be wrong, the Base64 value may have been copied incorrectly, or the export may not include the private key. Repeat the export and verification steps.

### Workflow Cannot Find `transformer self-sign`

Confirm that the certificate's exact Common Name is `transformer self-sign` and that its `.p12` includes the private key.

### PWA Shows 404 Errors

Confirm that Pages uses **GitHub Actions**, not **Deploy from a branch**, and that the URL ends in `/transformer/`.

### Desktop Workflow Does Not Start

Only tags beginning with `v` trigger it. The tag must be pushed to GitHub, not just created locally.

### Version Check Fails

The tag without its leading `v` must exactly equal the version in `package.json`.

### A Secret Needs To Be Changed

Open the repository secret and click **Update**. GitHub does not reveal the previous value, so enter the complete replacement value.

### macOS Build Cannot Unlock The Keychain

Replace `MAC_KEYCHAIN_PASSWORD` with a newly generated random value and rerun the failed workflow.

### GitHub Pages Workflow Fails Before Deployment

Confirm Pages has been enabled with **GitHub Actions** as its source and that the workflow has `pages: write` and `id-token: write` permissions.
