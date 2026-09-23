# Surf FED

Surf FED is a focused browser workspace for people who want a real **three-way tab split** instead of a single active page. The desktop application keeps live Chromium webviews alive in a parking layer, maps them to persistent pane slots, and lets the focused pane drive navigation controls.

## What is included

- Electron desktop shell with 1-, 2-, and 3-pane layouts, draggable dividers, parked tabs, exact 3→1→3 restoration, and persistent local state.
- Four built-in Manifest V3 extensions: **ad-blocker**, **dark-reader**, **fed-gram**, and **page-info**.
- Extension manager with built-in and unpacked extension discovery, enable/disable state, removal of user extensions, reload, and packaged-build path handling.
- Global mute-by-default controller with per-origin whitelist storage.
- Tauri mobile renderer with the same three-pane model, draggable dividers, persistent tab IDs, and a WebKit-compatible audio-policy boundary.
- GitHub Actions build matrix for Electron desktop artifacts and the Tauri frontend.
- GitHub Pages landing page, support page, campaign artwork, browser themes, icon sets, and the historical extension/source material supplied with earlier project revisions.

## Run the desktop prototype

```bash
cd electron
npm ci
npm test
npm start
```

The smoke test must report `TESTS:PASS 27/27`.

## Run the Tauri frontend

```bash
cd tauri
npm ci
npm run build
```

Native iOS and Android packages require the platform toolchains and signing configuration described in `docs/BUILD.md` and `docs/SURF_FED_TAURI_FEASIBILITY_STUDY.md`.

## Extension management

The four built-ins live in `electron/extensions/builtin/` and run in the persistent `persist:surf-fed` Chromium session. Open **Extensions** in the desktop toolbar to reload built-ins, load an unpacked third-party extension, enable or disable an extension, remove a user extension, or open the user extension folder. Built-in extension load failures remain fatal at startup; unchecked extension errors are not suppressed.

Tauri uses WebKit and therefore does not claim arbitrary Chrome extension compatibility. Its equivalent capabilities are implemented as renderer/native features instead.

## Repository map

- `electron/`: desktop application, extension runtime, audio controller, icons, and tests.
- `tauri/`: mobile renderer and Rust/Tauri configuration.
- `docs/`: build, deployment, extension, migration, and feasibility notes.
- `docs/legacy/`: source notes and snapshots from supplied earlier project variants.
- `electron/assets/`: merged application icon set and UI icons.
- `assets/themes/`: browser theme artwork from the supplied project revisions.
- `tools/legacy/`: preserved archive-generation and support-verification utilities.
- `.github/`: issue templates, contribution guidance, funding, and CI workflow.
- `NON_NEGOTIABLES.md`: acceptance criteria that take priority over convenience.

## Verification

```bash
cd electron && npm test
cd ../tauri && npm run build
```

## Support

Surf FED is supported through [GitHub Sponsors](https://github.com/sponsors/FED-OS), [Ko-fi](https://ko-fi.com/fedpromptly), [Patreon](https://patreon.com/fedpromptly), and [Buy Me a Coffee](https://www.buymeacoffee.com/fedpromptly).

Contact: careers@fedpromptly.com · support@fedpromptly.com · business@fedpromptly.com · contact@fedpromptly.com
