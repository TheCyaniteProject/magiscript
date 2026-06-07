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

// Bridge for forwarding renderer message-log lines to the main process console
contextBridge.exposeInMainWorld('SpellcircleConsole', {
  log: (message) => {
    try {
      ipcRenderer.send('spellcircle:console-log', String(message));
    } catch (_) {
      // noop: best-effort only
    }
  },
});

contextBridge.exposeInMainWorld('SpellcircleTest', {
  getConfig: async () => ipcRenderer.invoke('spellcircle:test:get-config'),
  loadProgram: async () => ipcRenderer.invoke('spellcircle:test:load-program'),
  report: async (payload) => ipcRenderer.invoke('spellcircle:test:report', payload),
});
