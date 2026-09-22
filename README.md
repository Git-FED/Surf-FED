# Surf FED

Surf FED is a focused browser workspace for people who want a real **three-way tab split** instead of a single active page. The desktop prototype keeps live Chromium webviews in a parking layer, maps them to persistent pane slots, and lets the focused pane drive navigation controls.

## What is implemented in this repository

- Electron desktop shell with 1-, 2-, and 3-pane layouts.
- Parked tabs and exact pane assignment restoration across 3→1→3 layout changes.
- Draggable divider controls and focused-pane navigation.
- Four desktop MV3 built-ins: ad-blocker, dark-reader, fed-gram, and page-info.
- Global mute-by-default controller with per-origin whitelist storage.
- Tauri mobile scaffold with an explicit WebKit/native-feature boundary.
- GitHub Actions build matrix and a 27-assertion Electron smoke suite.

## Run the desktop prototype

```bash
cd electron
npm ci
npm test
npm start
```

The test must report `TESTS:PASS 27/27`. If it does not, the three-pane requirement is not met.

## Repository map

- `electron/`: desktop application, extensions, audio controller, and tests.
- `tauri/`: mobile renderer and Rust/Tauri configuration.
- `docs/`: build, deployment, extension, and migration notes.
- `.github/`: issue templates, contribution template, and CI workflow.
- `NON_NEGOTIABLES.md`: acceptance criteria that take priority over convenience.

## Support

<a href="https://ko-fi.com/W3T61ZU5FS" target="_blank"><img height="36" style="border:0px;height:36px;" src="https://ko-fi.com/img/githubbutton_sm.svg" border="0" alt="Buy Me a Coffee at ko-fi.com" /></a>

Contact: careers@fedpromptly.com · support@fedpromptly.com · business@fedpromptly.com · contact@fedpromptly.com

## Funding and support

Surf FED is supported through [GitHub Sponsors](https://github.com/sponsors/FED-OS), [Ko-fi](https://ko-fi.com/fedpromptly), [Patreon](https://patreon.com/fedpromptly), and [Buy Me a Coffee](https://www.buymeacoffee.com/fedpromptly).

Visit [fedpromptly.com](https://fedpromptly.com) or join the [Discord community](https://discord.gg) to follow the project.
