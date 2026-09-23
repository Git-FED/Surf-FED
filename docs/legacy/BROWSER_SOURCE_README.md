# Surf FED browser source

This is the full desktop/mobile browser source package. The Electron application is in `electron/`, and its four built-in Manifest V3 extensions are in `electron/extensions/builtin/`:

- `ad-blocker`
- `dark-reader`
- `fed-gram`
- `page-info`

The desktop main process loads these directories with `session.loadExtension()` before creating the browser window. Run `npm ci`, `npm run validate:extensions`, `npm test`, and `npm start` from `electron/`.

The separate `surf-fed-one-page.zip` is only a GitHub Pages landing-page package. It is not the browser application and intentionally does not contain Electron, Tauri, or extension source.

The built-in extension files were merged from the supplied `Surf-FED-Internet-Browser-With-Extensions-main.zip`. They live under `electron/extensions/builtin/` because that is the directory resolved by the Electron main process at runtime.
