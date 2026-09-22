# Build and release

## Electron desktop

From `electron/`, install dependencies with `npm ci`. Run `npm start` for the local browser, `npm test` for the split-view smoke test, and `npm run dist` to invoke electron-builder.

The Electron configuration targets Windows portable and NSIS installers, macOS DMG, and Linux AppImage plus Debian package. macOS signing and notarization require repository secrets and are intentionally not claimed by the local scaffold.

## Tauri mobile

From `tauri/`, run `npm install` and `npm run build`. Native iOS and Android packaging requires the platform SDKs, signing identities, and Tauri CLI on the build runner. WebKit mobile does not execute Chrome MV3 extensions; the mobile feature ports live under `tauri/src-tauri/src` and the Tauri renderer.

## Release gate

A release is not complete until the 27-assertion Electron test passes, all four desktop extension manifests load, and each workflow upload uses `if-no-files-found: error`. The seventh matrix target remains an explicit project decision rather than a silently invented artifact.
