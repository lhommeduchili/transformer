# Offline Distribution

Transformer is distributed as an installable PWA and an Electron desktop application. Both process audio entirely on the user's device and bundle the FFmpeg runtime locally.

For a zero-knowledge walkthrough of GitHub secrets, Pages, and the first prerelease, see `docs/operations/github-release-setup.md`.

## PWA

The production PWA is deployed to GitHub Pages by `.github/workflows/pages.yml`.

- Build locally with `npm run build:web`.
- Preview with `npm run preview`.
- The service worker precaches the renderer, workers, FFmpeg core JavaScript, and FFmpeg WebAssembly.
- The first visit requires an internet connection and HTTPS. Once installation and caching complete, conversion works offline.
- Updates are installed in the background but activate only after the user chooses `reload update`.
- Chrome and Edge can normally write directly to a selected directory. Other browsers use download fallback.

Run `npm run test:e2e` to verify a real WAV-to-AIFF conversion after Chromium is taken offline.

## Desktop Development

Use Node.js 22 for packaging. Newer Node versions may be incompatible with Electron Packager's ZIP extraction dependencies.

- `npm run desktop`: build and launch the Electron app.
- `npm run package:desktop`: create an unpacked app for the host platform.
- `npm run make:mac:arm64`: create arm64 macOS DMG and ZIP artifacts.
- `npm run make:mac:x64`: create x64 macOS DMG and ZIP artifacts.
- `npm run make:windows:x64`: create a Windows x64 Squirrel installer.

The desktop app uses `transformer://app` rather than `file://`. Node integration is disabled, context isolation and sandboxing are enabled, and desktop output uses a narrow preload bridge.

## macOS Beta Signing

Local macOS packages default to the Keychain code-signing identity `transformer self-sign`. Override it with `MAC_SIGNING_IDENTITY` if needed.

Verify an app with:

```sh
codesign --verify --deep --strict --verbose=2 out/Transformer-darwin-arm64/Transformer.app
codesign -dv --verbose=4 out/Transformer-darwin-arm64/Transformer.app
```

This self-signed identity ensures package integrity but is not Apple-trusted and cannot be notarized. On another Mac, Gatekeeper will reject the first launch. A beta user who trusts the downloaded checksum must attempt to open the app, then use **System Settings > Privacy & Security > Open Anyway**. The exception allows later double-click launches.

Do not instruct users to install the self-signed root certificate into their trust store. Production releases require an Apple Developer ID Application certificate and notarization.

The current certificate fingerprint is:

```text
SHA-256 54:72:12:34:44:0F:FC:29:35:06:28:2C:3E:65:D0:31:48:E4:87:05:D8:1D:34:77:DE:F4:F0:88:89:9D:47:5C
```

For GitHub Actions, export the identity with its private key as a password-protected PKCS#12 file. Store only Base64-encoded PKCS#12 data and passwords in `MAC_CERTIFICATE_P12`, `MAC_CERTIFICATE_PASSWORD`, and `MAC_KEYCHAIN_PASSWORD` repository secrets. Never commit the private key.

## Windows Beta Signing

The macOS Keychain identity cannot sign Windows applications. Windows beta installers are currently unsigned and will show an unknown-publisher SmartScreen warning. Trusted Authenticode or Azure Trusted Signing must be configured before a production release.

## Release Flow

1. Set the same release version in `package.json` and the Git tag, for example `v0.1.0-beta.1`.
2. Run all CI gates and the relevant local desktop package smoke test.
3. Push the tag.
4. `.github/workflows/release.yml` builds macOS arm64, macOS x64, and Windows x64 artifacts.
5. The workflow verifies macOS signatures, runs the packaged Electron smoke test, generates SHA-256 files, and creates a GitHub prerelease.

Release artifacts are not automatically updated in-app. Users install a later release manually.

## FFmpeg Distribution

`@ffmpeg/core` 0.12.9 is declared GPL-2.0-or-later. Public artifacts must include applicable notices and provide the exact corresponding source and build information required by the license. The upstream source is available from the `ffmpegwasm/ffmpeg.wasm` project. License and codec/patent compliance must be reviewed before publishing a public release.
