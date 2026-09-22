const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  extensions: {
    list: () => ipcRenderer.invoke('extensions:list'),
    add: () => ipcRenderer.invoke('extensions:add'),
    reload: () => ipcRenderer.invoke('extensions:reload'),
    openFolder: () => ipcRenderer.invoke('extensions:open-folder'),
  },
});
