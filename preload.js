const { contextBridge, ipcRenderer } = require('electron');

const DEBUG_ENABLED = process.argv.includes('--debug');

contextBridge.exposeInMainWorld('SpellcircleFile', {
  save: async (program) => {
    if (DEBUG_ENABLED) {
      console.log('[Spellcircle Debug]', {
        source: 'preload',
        step: 'save:invoke',
        timestamp: new Date().toISOString(),
      });
    }
    return ipcRenderer.invoke('spellcircle:save', program);
  },
  load: async () => {
    if (DEBUG_ENABLED) {
      console.log('[Spellcircle Debug]', {
        source: 'preload',
        step: 'load:invoke',
        timestamp: new Date().toISOString(),
      });
    }
    return ipcRenderer.invoke('spellcircle:load');
  },
  isDebugEnabled: () => DEBUG_ENABLED,
  onDebug: (callback) => {
    if (typeof callback !== 'function') {
      return () => {};
    }

    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('spellcircle:debug', handler);
    return () => {
      ipcRenderer.removeListener('spellcircle:debug', handler);
    };
  },
});
