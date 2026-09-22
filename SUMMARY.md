# Project summary

Surf FED is a browser workspace whose defining feature is three live tabs side by side. Electron is the primary desktop runtime because it provides Chromium webviews and MV3 extension loading. Tauri provides a mobile path, but its WebKit runtime requires native implementations of built-in features rather than Chrome extension claims.

The critical correctness property is identity preservation: changing layout changes visibility and geometry, not the tab objects or their page state.
