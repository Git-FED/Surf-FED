# Installation

## Desktop development

Install Node.js 22 or newer. Then run:

```bash
cd electron
npm ci
npm test
npm start
```

The browser requires a desktop environment. In headless Linux CI, the test runner disables GPU acceleration and uses a hidden Electron window.

## Mobile frontend

```bash
cd tauri
npm install
npm run build
```

Packaging the Tauri app requires the platform SDKs and signing tools. Do not commit generated `dist/` or `target/` output.
