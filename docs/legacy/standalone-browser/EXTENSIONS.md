# Extensions Guide — Surf FED Browser

Surf FED now has **built-in support for Chrome-style extensions**. This guide
explains how to use the Extensions Manager and how to add your own extensions
(the ones you have already created).

---

## 1. The Extensions Manager

Click the **🧩 puzzle-piece button** in the toolbar to open the Extensions
Manager panel. From there you can:

| Button | What it does |
|--------|--------------|
| **＋ Load unpacked extension…** | Pick an unpacked extension folder on your computer. It is copied into your extensions folder and loaded immediately. |
| **📂 Open extensions folder** | Opens the folder where your personal extensions live, so you can drop folders in by hand. |
| **⟳ Reload list** | Re-scans your extensions folder and loads anything new you added by hand. |
| **Toggle switch** | Enable / disable an extension without removing it. The choice is remembered. |
| **Remove** | Deletes a user-added extension (built-in ones can only be disabled). |

---

## 2. How to add an extension you have created

You have two ways.

### Option A — Use the dialog (easiest)

1. Click **🧩 → ＋ Load unpacked extension…**
2. Select the folder that **contains your `manifest.json`**.
3. Done. It is loaded and shows up in the list.

### Option B — Drop it into the extensions folder

1. Click **🧩 → 📂 Open extensions folder**.
   (On Windows this is something like
   `%APPDATA%\Surf FED\extensions\`.)
2. Copy your extension folder (the one containing `manifest.json`) into it.
3. Click **🧩 → ⟳ Reload list**.

> The extension folder you provide must **directly contain `manifest.json`**.
> For example, if your extension is `MyExtension/manifest.json`, select or copy
> the `MyExtension` folder.

---

## 3. What your extension needs (manifest)

Surf FED loads extensions the same way Electron/Chromium does, so your
existing Chrome extensions work with minimal changes. A minimal
`manifest.json` looks like this:

```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0.0",
  "description": "What it does.",
  "icons": { "48": "icon.png" },
  "permissions": ["activeTab", "scripting"],
  "content_scripts": [
    { "matches": ["<all_urls>"], "js": ["content.js"] }
  ]
}
```

### Supported features

These Chromium extension features are supported by Electron's extension
loader and therefore by Surf FED:

- **Content scripts** (`content_scripts`) — injected into web pages.
- **Background service workers** (`background.service_worker`) — MV3.
- **Background pages** (`background.page`) — MV2 (still supported).
- **Browser/page actions** (`action`, `browser_action`) with popups.
- **`declarativeNetRequest`** static rule sets — great for ad/tracker blocking.
- **`webRequest`** (non-blocking observers).
- **`storage`**, **`tabs`**, **`scripting`**, **`activeTab`** and most other
  content-script-friendly APIs.
- **Options pages** (`options_ui` / `options_page`).

### A note on blocking web requests

For Manifest V3, prefer `declarative_net_request` rule sets (see the built-in
**Ad Blocker** for a working example in `extensions/builtin/ad-blocker/`).
Blocking `chrome.webRequest` listeners require the `webRequestBlocking`
permission, which Chromium reserves for enterprise/installed-by-admin
contexts and is unreliable inside Electron.

---

## 4. Built-in example extensions

These ship with the browser and are enabled by default. Read their source to
learn the patterns, or copy them as a starting point for your own.

| Extension | Location | What it does |
|-----------|----------|--------------|
| **Surf FED Ad Blocker** | `extensions/builtin/ad-blocker/` | Blocks common ad & tracking domains using a `declarativeNetRequest` ruleset (`rules.json`). |
| **Surf FED Dark Reader** | `extensions/builtin/dark-reader/` | Injects a CSS filter via a content script to darken every page. |
| **FED-GRAM** | `extensions/builtin/fed-gram/` | Toolbar popup that downloads images from public Instagram posts. Paste a post URL, preview the image(s) (including carousels) and save them. Originally a Streamlit/Python app, converted into a Manifest V3 extension. |
| **Surf FED Page Info** | `extensions/builtin/page-info/` | Toolbar popup that shows the active page's title, URL, description, link and image counts. |

### Folder layout of a built-in extension

```
extensions/builtin/ad-blocker/
├── manifest.json      # extension metadata + permissions
├── rules.json         # declarativeNetRequest rules
└── icon.png           # 48x48 toolbar/icon
```

### A note on the FED-GRAM extension

FED-GRAM was originally a **Python + Streamlit** web app (`app.py`) for
downloading images from public Instagram posts. It has been re-implemented as a
Manifest V3 browser extension so it runs as a toolbar popup inside Surf FED,
preserving the same workflow:

1. Paste a public Instagram post URL (the one containing `/p/`), or click
   **Use current tab** while viewing an Instagram post.
2. Click **Extract Image**.
3. The image(s) are previewed (carousels show every image) and each has a
   **💾 Download** button.

The original `app.py`, `requirements.txt`, `README.md` and `LICENSE` from the
FED-GRAM project are preserved inside the extension folder under `original/`
for reference.

---

## 5. How loading works under the hood

Surf FED uses Electron's `session.loadExtension()` to load each unpacked
extension into the **same session partition that every `<webview>` uses**
(`persist:surf-fed`). That is the key piece — because the webviews and the
extensions share a session, your content scripts and rules actually run on
the pages you browse.

The relevant code lives in `main.js`:

- `initExtensions()` — runs at startup, scans `extensions/builtin/` and your
  personal `extensions/` folder, then loads each one (unless you disabled it).
- `extensions:list / enable / disable / add / remove / reload / openFolder`
  — IPC handlers that the Extensions Manager UI calls.

Your personal extensions folder is stored in the OS user-data directory
(`app.getPath('userData') + '/extensions'`) so it survives app updates, and
the enabled/disabled state is saved in `extension-state/state.json`.

---

## 6. Quick troubleshooting

- **Extension does not appear** → Make sure the folder you selected
  *directly* contains a valid `manifest.json`. Click **⟳ Reload list**.
- **Extension appears but says "⚠ ..."** → The load error is shown inline.
  Common causes: an unsupported permission, or a `manifest.json` typo.
- **Extension loaded but content script not running** → Reload the page
  (or open a new tab). Content scripts attach on page load, not retroactively.
- **Changes to a built-in extension not reflected** → Restart the browser;
  built-in extensions are loaded at startup.
