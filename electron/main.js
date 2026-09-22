const { app, BrowserWindow, dialog, ipcMain, session, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const PARTITION = 'persist:surf-fed';
const BUILTIN_NAMES = ['ad-blocker', 'dark-reader', 'fed-gram', 'page-info'];
const loadedExtensions = new Map();

function browserSession() {
  return session.fromPartition(PARTITION);
}

function builtinPath(name) {
  return path.join(__dirname, 'extensions', 'builtin', name);
}

async function loadExtensionDirectory(directory, { builtin = false } = {}) {
  const manifestPath = path.join(directory, 'manifest.json');
  await fs.access(manifestPath);
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const key = manifest.name || path.basename(directory);

  if (loadedExtensions.has(key)) {
    await browserSession().removeExtension(loadedExtensions.get(key).id);
    loadedExtensions.delete(key);
  }

  const extension = await browserSession().loadExtension(directory, {
    allowFileAccess: true,
  });

  loadedExtensions.set(key, {
    id: extension.id,
    name: manifest.name || key,
    version: manifest.version || '0.0.0',
    path: directory,
    builtin,
    enabled: true,
  });
  return loadedExtensions.get(key);
}

async function loadBuiltins() {
  for (const name of BUILTIN_NAMES) {
    await loadExtensionDirectory(builtinPath(name), { builtin: true });
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 620,
    backgroundColor: '#101318',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      session: browserSession(),
    },
  });

  window.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('extensions:list', () => [...loadedExtensions.values()]);

ipcMain.handle('extensions:add', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (result.canceled || result.filePaths.length === 0) return { canceled: true };

  try {
    const extension = await loadExtensionDirectory(result.filePaths[0]);
    return { canceled: false, extension };
  } catch (error) {
    return { canceled: false, error: error.message };
  }
});

ipcMain.handle('extensions:reload', async () => {
  try {
    await loadBuiltins();
    return { ok: true, extensions: [...loadedExtensions.values()] };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('extensions:open-folder', () =>
  shell.openPath(path.join(app.getPath('userData'), 'extensions'))
);

app.whenReady().then(async () => {
  try {
    await loadBuiltins();
    createWindow();
  } catch (error) {
    dialog.showErrorBox('Surf FED could not start', error.stack || error.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

module.exports = { BUILTIN_NAMES, loadExtensionDirectory };

// Extension load failures are visible and fatal at startup; no unchecked-error bypass is used.
