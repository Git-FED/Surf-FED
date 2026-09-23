# Extensions

Surf FED has two extension stories.

## Electron desktop

Electron uses Chromium's real Manifest V3 runtime. Built-ins are under `electron/extensions/builtin/` and are loaded into the persistent `persist:surf-fed` session by `electron/main.js`:

| Name | MV3 mechanism |
| --- | --- |
| `ad-blocker` | `declarativeNetRequest` rules |
| `dark-reader` | `document_start` content script |
| `fed-gram` | service worker and action popup |
| `page-info` | content script and action popup |

The extension manager supports the following operations:

- list built-in and user-installed extensions;
- enable and disable extensions with a persisted state file;
- load an unpacked extension by copying it into the user extension directory;
- remove user extensions while protecting built-ins;
- reload the built-ins and rescan the user extension directory; and
- open the user extension directory in the operating-system file manager.

Packaged Electron builds unpack extension files because Chromium's `session.loadExtension()` requires a real filesystem directory. Startup fails visibly when a built-in extension cannot be loaded. The application does not use `allowUncheckedErrors` to hide extension failures.

## Automatic audio muting

Electron tabs are muted automatically when their origin is not in the local audio whitelist. Surf FED re-applies this rule when a tab starts loading, performs a normal navigation, or changes URL in-page. A whitelisted origin remains audible across its pages. The setting and whitelist are stored in the persistent browser profile.

## Tauri mobile

iOS and Android use WebKit. WebKit has no Chrome extension runtime, so the mobile renderer and Rust layer implement equivalent built-in capabilities as first-class features. Arbitrary Chrome extensions are not supported on mobile and are not represented as enabled extensions.

## Historical source material

Earlier extension-manager and Fed-Gram source variants supplied with the project are preserved under `docs/legacy/` and `electron/extensions/builtin/fed-gram/original/`. They are retained for reference; the active Electron runtime uses the validated MV3 files in `electron/extensions/builtin/`.
