# Rebuild verification

This archive was rebuilt around the persistent three-pane state machine. The Electron source passes Node syntax checks, all four MV3 manifests parse as JSON, the prohibited remote browser-chrome script is absent, and the Electron smoke suite reports `TESTS:PASS 27/27` with GPU acceleration disabled for the sandbox.

The Tauri frontend passes `npm run build`. Rust `cargo check` was not run because Cargo is not installed in the build environment; the native iOS/Android packages still require a platform toolchain and signing configuration.

Generated `node_modules/`, `dist/`, and Rust `target/` directories are intentionally excluded from the GitHub archive.
