# Consolidation map

This repository consolidates the supplied Surf FED project revisions into one active application rather than silently discarding earlier work.

| Supplied material | Active destination or preservation path |
| --- | --- |
| Electron three-pane source | `electron/` |
| MV3 built-ins | `electron/extensions/builtin/` |
| Standalone extension-manager browser | Extension management was integrated into `electron/main.js`, `preload.js`, and the extension panel; the complete earlier source is preserved in `docs/legacy/standalone-browser/source/`. |
| Standalone icon set | `electron/assets/icons/` |
| Fed-Gram original source | `electron/extensions/builtin/fed-gram/original/` |
| Tauri renderer and native scaffold | `tauri/` |
| GitHub Pages landing/support material | `index.html`, `styles.css`, `subscribe.html`, and campaign images at the repository root |
| Browser theme artwork | `assets/themes/` |
| Archive generators and validation helpers | `tools/legacy/` |
| One-page project | `docs/legacy/one-page/` |
| Earlier build/source notes | `docs/legacy/` |

The active implementation deliberately keeps the stricter behavior from the non-negotiable requirements: MV3 extension load failures are visible, and `allowUncheckedErrors` is not used to conceal failures.
