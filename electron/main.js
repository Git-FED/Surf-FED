const { app, BrowserWindow, dialog, ipcMain, session, shell } = require('electron');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');

const PARTITION = 'persist:surf-fed';
const BUILTIN_NAMES = ['ad-blocker', 'dark-reader', 'fed-gram', 'page-info'];
const loadedExtensions = new Map();

function browserSession() { return session.fromPartition(PARTITION); }
function userExtensionsPath() { return path.join(app.getPath('userData'), 'extensions'); }
function extensionStatePath() { return path.join(app.getPath('userData'), 'extension-state.json'); }

function builtinRoot() {
  const relative = path.join('extensions', 'builtin');
  const candidates = [];
  if (app.isPackaged && process.resourcesPath) {
    candidates.push(path.join(process.resourcesPath, 'app.asar.unpacked', relative));
    candidates.push(path.join(process.resourcesPath, 'app', relative));
  }
  candidates.push(path.join(__dirname, relative));
  candidates.push(path.join(process.cwd(), relative));
  return candidates.find((candidate) => fsSync.existsSync(candidate)) || candidates[0];
}

function builtinPath(name) { return path.join(builtinRoot(), name); }
async function readExtensionState() {
  try { return JSON.parse(await fs.readFile(extensionStatePath(), 'utf8')); } catch { return { disabled: [] }; }
}
async function writeExtensionState(state) {
  await fs.writeFile(extensionStatePath(), JSON.stringify({ disabled: [...new Set(state.disabled || [])] }, null, 2));
}
async function readManifest(directory) {
  const manifestPath = path.join(directory, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  if (manifest.manifest_version !== 3) throw new Error(`${directory} is not a Manifest V3 extension`);
  return manifest;
}

async function loadExtensionDirectory(directory, { builtin = false, key = null } = {}) {
  const manifest = await readManifest(directory);
  const extensionKey = key || manifest.name || path.basename(directory);
  if (loadedExtensions.has(extensionKey)) {
    const previous = loadedExtensions.get(extensionKey);
    if (previous.loadedId) await browserSession().removeExtension(previous.loadedId);
    loadedExtensions.delete(extensionKey);
  }
  const extension = await browserSession().loadExtension(directory, { allowFileAccess: true });
  loadedExtensions.set(extensionKey, {
    id: extensionKey,
    loadedId: extension.id,
    name: manifest.name || extensionKey,
    version: manifest.version || '0.0.0',
    description: manifest.description || '',
    path: directory,
    builtin,
    enabled: true,
    loadError: null,
  });
  return loadedExtensions.get(extensionKey);
}

async function discoverUserExtensions() {
  await fs.mkdir(userExtensionsPath(), { recursive: true });
  const entries = await fs.readdir(userExtensionsPath(), { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => ({
    key: entry.name,
    path: path.join(userExtensionsPath(), entry.name),
  }));
}

async function loadBuiltins() {
  const state = await readExtensionState();
  for (const name of BUILTIN_NAMES) {
    const key = `builtin:${name}`;
    if (state.disabled.includes(key)) {
      const manifest = await readManifest(builtinPath(name));
      loadedExtensions.set(key, { id: key, name: manifest.name || name, version: manifest.version || '0.0.0', description: manifest.description || '', path: builtinPath(name), builtin: true, enabled: false, loadedId: null, loadError: null });
      continue;
    }
    try {
      await loadExtensionDirectory(builtinPath(name), { builtin: true, key });
    } catch (error) {
      throw new Error(`Failed to load built-in extension ${name}: ${error.message}`);
    }
  }
  for (const user of await discoverUserExtensions()) {
    if (state.disabled.includes(user.key)) {
      try {
        const manifest = await readManifest(user.path);
        loadedExtensions.set(user.key, { id: user.key, name: manifest.name || user.key, version: manifest.version || '0.0.0', description: manifest.description || '', path: user.path, builtin: false, enabled: false, loadedId: null, loadError: null });
      } catch (error) {
        loadedExtensions.set(user.key, { id: user.key, name: user.key, version: 'unknown', description: '', path: user.path, builtin: false, enabled: false, loadedId: null, loadError: error.message });
      }
      continue;
    }
    try { await loadExtensionDirectory(user.path, { key: user.key }); } catch (error) {
      loadedExtensions.set(user.key, { id: user.key, name: user.key, version: 'unknown', description: '', path: user.path, builtin: false, enabled: false, loadError: error.message });
    }
  }
}

function extensionSummary(extension) {
  return {
    id: extension.id,
    name: extension.name,
    version: extension.version,
    description: extension.description,
    builtin: extension.builtin,
    enabled: Boolean(extension.enabled),
    loadError: extension.loadError || null,
  };
}

async function copyDirectory(source, destination) {
  await fs.mkdir(destination, { recursive: true });
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) await copyDirectory(from, to);
    else if (entry.isFile()) await fs.copyFile(from, to);
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440, height: 900, minWidth: 960, minHeight: 620,
    backgroundColor: '#101318',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, webviewTag: true, session: browserSession() },
  });
  window.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('extensions:list', () => [...loadedExtensions.values()].map(extensionSummary));
ipcMain.handle('extensions:enable', async (_event, id) => {
  const extension = loadedExtensions.get(id);
  if (!extension) return { ok: false, error: 'Extension not found' };
  try {
    const loaded = await loadExtensionDirectory(extension.path, { builtin: extension.builtin, key: id });
    const state = await readExtensionState(); state.disabled = state.disabled.filter((item) => item !== id); await writeExtensionState(state);
    return { ok: true, extension: extensionSummary(loaded) };
  } catch (error) { return { ok: false, error: error.message }; }
});
ipcMain.handle('extensions:disable', async (_event, id) => {
  const extension = loadedExtensions.get(id);
  if (!extension) return { ok: false, error: 'Extension not found' };
  if (extension.loadedId) await browserSession().removeExtension(extension.loadedId);
  extension.enabled = false; extension.loadedId = null;
  const state = await readExtensionState(); if (!state.disabled.includes(id)) state.disabled.push(id); await writeExtensionState(state);
  return { ok: true };
});
ipcMain.handle('extensions:add', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (result.canceled || !result.filePaths.length) return { canceled: true };
  const source = result.filePaths[0];
  try {
    const manifest = await readManifest(source);
    const id = path.basename(source);
    const destination = path.join(userExtensionsPath(), id);
    await fs.rm(destination, { recursive: true, force: true });
    await copyDirectory(source, destination);
    const extension = await loadExtensionDirectory(destination, { key: id });
    return { canceled: false, extension: extensionSummary(extension) };
  } catch (error) { return { canceled: false, error: error.message }; }
});
ipcMain.handle('extensions:remove', async (_event, id) => {
  const extension = loadedExtensions.get(id);
  if (!extension) return { ok: false, error: 'Extension not found' };
  if (extension.builtin) return { ok: false, error: 'Built-in extensions cannot be removed' };
  if (extension.loadedId) await browserSession().removeExtension(extension.loadedId);
  await fs.rm(extension.path, { recursive: true, force: true });
  loadedExtensions.delete(id);
  return { ok: true };
});
ipcMain.handle('extensions:reload', async () => {
  try { await loadBuiltins(); return { ok: true, extensions: [...loadedExtensions.values()].map(extensionSummary) }; }
  catch (error) { return { ok: false, error: error.message }; }
});
ipcMain.handle('extensions:open-folder', async () => { await fs.mkdir(userExtensionsPath(), { recursive: true }); return shell.openPath(userExtensionsPath()); });

app.whenReady().then(async () => {
  try { await fs.mkdir(userExtensionsPath(), { recursive: true }); await loadBuiltins(); createWindow(); }
  catch (error) { dialog.showErrorBox('Surf FED could not start', error.stack || error.message); app.quit(); }
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

module.exports = { BUILTIN_NAMES, builtinRoot, loadExtensionDirectory };
