const { app, BrowserWindow } = require('electron');
const path = require('node:path');

app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

app.whenReady().then(() => {
  const window = new BrowserWindow({
    show: false,
    width: 1280,
    height: 800,
    webPreferences: { webviewTag: true },
  });

  const timeout = setTimeout(() => {
    console.error('TESTS:TIMEOUT');
    app.exit(2);
  }, 30000);

  window.webContents.on('did-finish-load', () => {
    const poll = setInterval(async () => {
      try {
        const result = await window.webContents.executeJavaScript('window.__splitTestResult || null');
        if (!result) return;
        clearInterval(poll);
        clearTimeout(timeout);
        console.log(result.summary);
        if (result.failures.length) console.error(result.failures.join('\n'));
        app.exit(result.failures.length === 0 ? 0 : 1);
      } catch (error) {
        clearInterval(poll);
        clearTimeout(timeout);
        console.error(error.stack || error.message);
        app.exit(1);
      }
    }, 100);
  });

  window.webContents.on('console-message', (_event, level, message, line, source) => {
    console.log(`[renderer:${level}] ${source}:${line} ${message}`);
  });
  window.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame) console.error(`MAIN_LOAD_FAILED ${errorCode} ${errorDescription} ${validatedURL}`);
  });

  window.loadFile(path.join(__dirname, 'test.html'));
});

app.on('window-all-closed', () => app.quit());
