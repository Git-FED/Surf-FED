const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  extensions: {
    list: () => ipcRenderer.invoke('extensions:list'),
    enable: (id) => ipcRenderer.invoke('extensions:enable', id),
    disable: (id) => ipcRenderer.invoke('extensions:disable', id),
    add: () => ipcRenderer.invoke('extensions:add'),
    remove: (id) => ipcRenderer.invoke('extensions:remove', id),
    reload: () => ipcRenderer.invoke('extensions:reload'),
    openFolder: () => ipcRenderer.invoke('extensions:open-folder'),
  },
});
