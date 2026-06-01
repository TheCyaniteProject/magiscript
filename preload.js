const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('SpellcircleFile', {
  save: (program) => ipcRenderer.invoke('spellcircle:save', program),
  load: () => ipcRenderer.invoke('spellcircle:load'),
});
