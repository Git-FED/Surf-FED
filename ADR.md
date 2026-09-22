# Architecture decisions

## ADR-001: Keep live webviews in a parking layer

Pane layout changes must not destroy or recreate a tab's webview. Electron webviews remain children of `#webviewParking` and are positioned over their pane rectangle. The pane array stores assignment independently from DOM position. This preserves page state during 3→1→3 transitions.

## ADR-002: Separate desktop and mobile extension semantics

Electron uses Chromium MV3. Tauri mobile uses WebKit and exposes equivalent built-in features through renderer/native code. The repository never claims that arbitrary Chrome extensions run on iOS or Android.
