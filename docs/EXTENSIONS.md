# Extensions

Surf FED has two different extension stories.

## Electron

Electron uses Chromium's real Manifest V3 runtime. Built-ins are under `electron/extensions/builtin/` and are loaded into the `persist:surf-fed` session by `electron/main.js`. The built-ins are:

| Name | MV3 mechanism |
| --- | --- |
| ad-blocker | `declarativeNetRequest` rules |
| dark-reader | `document_start` content script |
| fed-gram | service worker and action popup |
| page-info | content script and action popup |

The extension manager can load an unpacked directory with a valid `manifest.json`. Load errors are returned to the UI; the application does not use `allowUncheckedErrors`.

## Tauri mobile

iOS and Android use WebKit. WebKit has no Chrome extension runtime, so the mobile renderer and Rust layer must implement equivalent built-in capabilities as first-class features. Arbitrary Chrome extensions are not supported on mobile and must not be represented as enabled extensions.
