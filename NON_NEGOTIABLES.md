# Surf FED — Non-Negotiable Requirements

This repository is a scaffold for the Surf FED browser. The following are release gates.

## 1. Extensions must work

Electron desktop loads the four built-in MV3 extensions—ad-blocker, dark-reader, fed-gram, and page-info—into the `persist:surf-fed` partition using real `session.loadExtension()` calls. Users may load unpacked third-party extensions. `allowUncheckedErrors` must not hide failures.

Tauri iOS/Android uses WebKit and therefore has no Chrome extension runtime. Its four built-in capabilities must be implemented as native or renderer features; arbitrary Chrome extensions are not claimed to work on mobile.

## 2. Device builds

The release workflow must produce Windows portable + NSIS, macOS Electron DMGs, Linux AppImage + deb, optional Tauri macOS DMG, iOS IPA, Android APK/AAB, and one confirmed seventh target. Missing artifacts must fail the release upload.

## 3. Three-pane split

Both renderers must support 1-, 2-, and 3-pane layouts; draggable dividers; focused-pane toolbar actions; user-controlled pane/tab assignment; parked tabs; exact 3→1→3 restoration; and localStorage persistence. Webviews/iframes must remain alive during layout changes. The Electron smoke suite is the acceptance bar.

## Automatic global default mute

New tabs are muted automatically unless their origin is whitelisted. The policy is re-applied when a tab starts loading or navigates, so page navigation cannot bypass the default. The setting and whitelist persist locally, and users can toggle the policy from the toolbar/settings panel.
