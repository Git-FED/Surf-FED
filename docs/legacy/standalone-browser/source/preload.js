const { contextBridge, ipcRenderer } = require('electron');

// Safe bridge between the main process and the browser UI.
contextBridge.exposeInMainWorld('electronAPI', {
  // Window chrome
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // Extension manager
  extensions: {
    list:   ()         => ipcRenderer.invoke('extensions:list'),
    enable: (id)       => ipcRenderer.invoke('extensions:enable', id),
    disable:(id)       => ipcRenderer.invoke('extensions:disable', id),
    add:    ()         => ipcRenderer.invoke('extensions:add'),
    remove: (id)       => ipcRenderer.invoke('extensions:remove', id),
    openFolder: ()     => ipcRenderer.invoke('extensions:openFolder'),
    reload: ()         => ipcRenderer.invoke('extensions:reload'),
  },
});
