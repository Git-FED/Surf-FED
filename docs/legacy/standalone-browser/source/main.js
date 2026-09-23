const { app, BrowserWindow, ipcMain, session, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// The session partition that every <webview> uses. Extensions are loaded into
// THIS partition so that they actually run inside the web pages you browse.
const WEBVIEW_PARTITION = 'persist:surf-fed';

// Folder that ships with the app and holds built-in extensions.
//
// IMPORTANT – asar packaging:
//   electron-builder is configured with `asarUnpack: ["extensions/builtin/**/*"]`.
//   That means when the app is packaged, the extension files are NOT stored
//   inside `app.asar` (Electron's virtual archive) but are extracted to a real
//   folder on disk called `app.asar.unpacked`.  Electron's
//   `session.loadExtension()` requires real files on disk, so we MUST point at
//   the `.unpacked` location in a packaged build.
//
//   In development (unpackaged) `__dirname` already points at the real folder,
//   so we use it directly.
//
// This function is deliberately defensive: it tries several candidate paths
// and returns the first one that actually exists on disk.  This avoids the
// "Extension directory not found" error on Windows portable builds where
// path separators, drive letters, or app.isPackaged detection can be tricky.
function builtinExtDir() {
  const rel = path.join('extensions', 'builtin');
  const candidates = [];

  if (app.isPackaged) {
    // Candidate 1: app.asar.unpacked (the asarUnpack destination)
    const appPath = app.getAppPath();                 // .../resources/app.asar
    const unpacked = appPath.replace(
      /[\\/]app\.asar([\\/]|$)/i,
      (m, sep) => path.sep + 'app.asar.unpacked' + (sep || '')
    );
    candidates.push(path.join(unpacked, rel));

    // Candidate 2: process.resourcesPath/app.asar.unpacked
    if (process.resourcesPath) {
      candidates.push(path.join(process.resourcesPath, 'app.asar.unpacked', rel));
    }

    // Candidate 3: process.resourcesPath/app/extensions  (non-asar fallback)
    if (process.resourcesPath) {
      candidates.push(path.join(process.resourcesPath, 'app', rel));
    }
  }

  // Candidate 4 (dev): __dirname/extensions/builtin
  candidates.push(path.join(__dirname, rel));

  // Candidate 5 (dev with cwd): ./extensions/builtin
  candidates.push(path.join(process.cwd(), rel));

  // Return the first candidate that actually exists.
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  // Nothing found – return the best guess (the unpacked path when packaged,
  // otherwise the dev path) so error messages are still informative.
  if (app.isPackaged && process.resourcesPath) {
    return path.join(process.resourcesPath, 'app.asar.unpacked', rel);
  }
  return path.join(__dirname, rel);
}

// Kept for backwards-compatibility with any code that referenced the old const.
const BUILTIN_EXT_DIR = builtinExtDir();

// Folder where the user can drop their OWN unpacked extensions.
// We keep it inside the user-data directory so it survives app updates and
// works no matter where the app is installed.
function userExtDir() {
  return path.join(app.getPath('userData'), 'extensions');
}

// Folder that stores the list of which extensions are enabled/disabled.
function extStateDir() {
  return path.join(app.getPath('userData'), 'extension-state');
}

const ICON_PATH = path.join(__dirname, 'assets', 'icons', 'icon.png');

let mainWindow;

// ---------------------------------------------------------------------------
// Extension registry (in-memory mirror of what is loaded)
// ---------------------------------------------------------------------------
// Each entry: { id, name, version, description, path, enabled, builtin, manifest }

const loadedExtensions = new Map();

function loadExtState() {
  try {
    const file = path.join(extStateDir(), 'state.json');
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {
    console.error('[extensions] Failed to read state file:', e);
  }
  return { disabled: [] };
}

function saveExtState(state) {
  try {
    const dir = extStateDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('[extensions] Failed to save state file:', e);
  }
}

// Read the bare minimum we need from a manifest.json for display purposes.
function readManifest(extPath) {
  const manifestPath = path.join(extPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  try {
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return m;
  } catch (e) {
    console.error('[extensions] Bad manifest.json in', extPath, e);
    return null;
  }
}

// Discover every sub-folder in a directory that contains a manifest.json.
function discoverExtensions(dir, { builtin }) {
  const found = [];
  if (!fs.existsSync(dir)) return found;
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return found; }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const extPath = path.join(dir, entry.name);
    const manifest = readManifest(extPath);
    if (!manifest) continue;
    found.push({
      id: entry.name,
      name: manifest.name || entry.name,
      version: manifest.version || '1.0.0',
      description: manifest.description || '',
      path: extPath,
      builtin,
      manifest,
    });
  }
  return found;
}

// Actually load an unpacked extension into the webview session via Electron.
async function loadExtensionIntoSession(ext) {
  const targetSession = session.fromPartition(WEBVIEW_PARTITION);
  try {
    const loaded = await targetSession.loadExtension(ext.path, { allowUncheckedErrors: true });
    // Electron returns the loaded extension object; use its real id if available.
    ext.loadedId = loaded.id;
    ext.enabled = true;
    return true;
  } catch (e) {
    console.error('[extensions] Failed to load', ext.name, '->', e.message);
    ext.enabled = false;
    ext.loadError = e.message;
    return false;
  }
}

async function removeExtensionFromSession(ext) {
  if (!ext.loadedId) return;
  const targetSession = session.fromPartition(WEBVIEW_PARTITION);
  try {
    targetSession.removeExtension(ext.loadedId);
  } catch (e) {
    console.error('[extensions] Failed to remove', ext.name, e);
  }
  ext.enabled = false;
  ext.loadedId = null;
}

// Discover + load all extensions at startup (respecting the disabled list).
async function initExtensions() {
  const state = loadExtState();
  const disabled = new Set(state.disabled || []);

  // Make sure the user extension directory exists so the user can drop things in.
  if (!fs.existsSync(userExtDir())) fs.mkdirSync(userExtDir(), { recursive: true });

  const builtinDir = builtinExtDir();
  console.log('[extensions] Built-in extension dir resolved to:', builtinDir);
  console.log('[extensions]   exists?', fs.existsSync(builtinDir));
  console.log('[extensions]   app.isPackaged =', app.isPackaged);
  if (process.resourcesPath) {
    const unpackedGuess = path.join(process.resourcesPath, 'app.asar.unpacked', 'extensions', 'builtin');
    console.log('[extensions]   resourcesPath/app.asar.unpacked exists?', fs.existsSync(unpackedGuess), '->', unpackedGuess);
  }

  const all = [
    ...discoverExtensions(builtinDir, { builtin: true }),
    ...discoverExtensions(userExtDir(), { builtin: false }),
  ];

  for (const ext of all) {
    loadedExtensions.set(ext.id, ext);
    if (disabled.has(ext.id)) {
      ext.enabled = false;
      continue;
    }
    await loadExtensionIntoSession(ext);
  }

  console.log(`[extensions] ${loadedExtensions.size} discovered, ${
    [...loadedExtensions.values()].filter(e => e.enabled).length
  } enabled.`);
}

// ---------------------------------------------------------------------------
// Window creation
// ---------------------------------------------------------------------------

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    icon: ICON_PATH,
    title: 'Surf FED',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true, // REQUIRED for <webview> tags to work at all
    },
  });

  mainWindow.loadFile('index.html');
  Menu.setApplicationMenu(null);
  mainWindow.on('closed', () => { mainWindow = null; });
}

// Make sure every <webview> created in the renderer uses our extension partition.
// This is the magic that ties extensions to the pages you actually browse.
app.on('web-contents-created', (event, contents) => {
  if (contents.getType() === 'webview') {
    // The partition is set on the <webview> tag itself (see renderer.js),
    // so nothing extra to do here - kept as a hook for future use.
  }
});

// ---------------------------------------------------------------------------
// IPC: window chrome (minimise / maximise / close)
// ---------------------------------------------------------------------------

ipcMain.on('window:minimize', () => mainWindow && mainWindow.minimize());
ipcMain.on('window:maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window:close', () => mainWindow && mainWindow.close());

// ---------------------------------------------------------------------------
// IPC: extension management
// ---------------------------------------------------------------------------

// Return a list of every known extension (with enabled state) for the manager UI.
ipcMain.handle('extensions:list', () => {
  return [...loadedExtensions.values()].map(e => ({
    id: e.id,
    name: e.name,
    version: e.version,
    description: e.description,
    enabled: !!e.enabled,
    builtin: e.builtin,
    loadError: e.loadError || null,
  }));
});

// Enable an extension (load it into the session) and persist the choice.
ipcMain.handle('extensions:enable', async (event, id) => {
  const ext = loadedExtensions.get(id);
  if (!ext) return { ok: false, error: 'Extension not found' };
  const ok = await loadExtensionIntoSession(ext);
  if (ok) {
    const state = loadExtState();
    state.disabled = (state.disabled || []).filter(d => d !== id);
    saveExtState(state);
  }
  return { ok };
});

// Disable an extension (remove from session) and persist the choice.
ipcMain.handle('extensions:disable', async (event, id) => {
  const ext = loadedExtensions.get(id);
  if (!ext) return { ok: false, error: 'Extension not found' };
  await removeExtensionFromSession(ext);
  const state = loadExtState();
  if (!state.disabled) state.disabled = [];
  if (!state.disabled.includes(id)) state.disabled.push(id);
  saveExtState(state);
  return { ok: true };
});

// Open a folder picker, copy the chosen unpacked extension into the user
// extensions folder, then load it. Returns the new extension info.
ipcMain.handle('extensions:add', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select an unpacked extension folder',
    properties: ['openDirectory'],
  });
  if (result.canceled || !result.filePaths.length) {
    return { ok: false, error: 'No folder selected' };
  }
  const src = result.filePaths[0];
  const manifest = readManifest(src);
  if (!manifest) {
    return { ok: false, error: 'The selected folder does not contain a valid manifest.json' };
  }
  const name = path.basename(src);
  const dest = path.join(userExtDir(), name);
  try {
    // Remove a previous copy if it exists, then copy fresh.
    if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
    fs.mkdirSync(dest, { recursive: true });
    copyDirSync(src, dest);
  } catch (e) {
    return { ok: false, error: 'Could not copy extension: ' + e.message };
  }

  const ext = {
    id: name,
    name: manifest.name || name,
    version: manifest.version || '1.0.0',
    description: manifest.description || '',
    path: dest,
    builtin: false,
    manifest,
  };
  loadedExtensions.set(ext.id, ext);
  const ok = await loadExtensionIntoSession(ext);
  return { ok, extension: ext };
});

// Remove a user-added extension entirely (built-in ones cannot be removed).
ipcMain.handle('extensions:remove', async (event, id) => {
  const ext = loadedExtensions.get(id);
  if (!ext) return { ok: false, error: 'Extension not found' };
  if (ext.builtin) return { ok: false, error: 'Built-in extensions cannot be removed' };
  await removeExtensionFromSession(ext);
  try { fs.rmSync(ext.path, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  loadedExtensions.delete(id);
  const state = loadExtState();
  state.disabled = (state.disabled || []).filter(d => d !== id);
  saveExtState(state);
  return { ok: true };
});

// Open the user extensions folder in the OS file manager.
ipcMain.handle('extensions:openFolder', () => {
  if (!fs.existsSync(userExtDir())) fs.mkdirSync(userExtDir(), { recursive: true });
  shellOpenPath(userExtDir());
  return { ok: true };
});

// Re-scan the user folder and load anything new (useful after manually
// dropping a folder in there).
ipcMain.handle('extensions:reload', async () => {
  if (!fs.existsSync(userExtDir())) fs.mkdirSync(userExtDir(), { recursive: true });
  const state = loadExtState();
  const disabled = new Set(state.disabled || []);
  const discovered = discoverExtensions(userExtDir(), { builtin: false });
  for (const ext of discovered) {
    if (loadedExtensions.has(ext.id)) continue; // already known
    loadedExtensions.set(ext.id, ext);
    if (!disabled.has(ext.id)) await loadExtensionIntoSession(ext);
  }
  return { ok: true, added: discovered.length };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function copyDirSync(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirSync(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      // Skip symlinks for safety.
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function shellOpenPath(target) {
  // Use Electron's shell module lazily to avoid hoisting issues.
  const { shell } = require('electron');
  shell.openPath(target);
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(async () => {
  await initExtensions();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
