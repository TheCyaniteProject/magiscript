const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');

const DEBUG_ENABLED = process.argv.includes('--debug');
const GUI_TEST_ENABLED = process.argv.includes('--test-demo');
const GUI_TEST_TIMEOUT_MS = 30000;
const GUI_TEST_EXPECTED_OUTPUT_LINES = [
  '1',
  '2',
  '4',
  '8',
  '16',
  '32',
  '64',
  '128',
  '256',
  '512',
  '1024',
];

const guiTestState = {
  enabled: GUI_TEST_ENABLED,
  programPath: path.join(__dirname, 'demo', 'ten-factor.spellcircle'),
  expectedOutputLines: GUI_TEST_EXPECTED_OUTPUT_LINES,
  completed: false,
  timeoutHandle: null,
};

function emitSpellcircleDebug(win, step, details = {}) {
  if (!DEBUG_ENABLED) {
    return;
  }

  const payload = {
    source: 'main',
    step,
    details,
    timestamp: new Date().toISOString(),
  };

  console.log('[Spellcircle Debug]', payload);
  win?.webContents?.send?.('spellcircle:debug', payload);
}

ipcMain.handle('spellcircle:save', async (event, program) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
    emitSpellcircleDebug(win, 'save:invoke', {
      hasProgram: Boolean(program),
      rootCount: Array.isArray(program?.rootNodeGuids) ? program.rootNodeGuids.length : null,
    });

    const filePath = dialog.showSaveDialogSync(win, {
      title: 'Save Spellcircle',
      defaultPath: path.join(app.getPath('documents'), 'script.spellcircle'),
      filters: [{ name: 'Spellcircle', extensions: ['spellcircle'] }],
    });
    const canceled = !filePath;

    emitSpellcircleDebug(win, 'save:dialog-result', {
      canceled,
      filePath: filePath || null,
    });

    if (canceled || !filePath) {
      return { canceled: true };
    }

    const json = JSON.stringify(program, null, 2);
    emitSpellcircleDebug(win, 'save:json-created', {
      length: json.length,
    });

    await fs.writeFile(filePath, json, 'utf8');
    emitSpellcircleDebug(win, 'save:write-success', {
      filePath,
    });

    return { canceled: false, filePath };
  } catch (error) {
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
    emitSpellcircleDebug(win, 'save:error', {
      message: error instanceof Error ? error.message : String(error),
    });

    return {
      canceled: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle('spellcircle:load', async (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
    emitSpellcircleDebug(win, 'load:invoke');

    const filePaths = dialog.showOpenDialogSync(win, {
      title: 'Load Spellcircle',
      properties: ['openFile'],
      filters: [{ name: 'Spellcircle', extensions: ['spellcircle'] }],
    });
    const canceled = !filePaths || filePaths.length === 0;

    emitSpellcircleDebug(win, 'load:dialog-result', {
      canceled,
      filePaths: Array.isArray(filePaths) ? filePaths : null,
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return { canceled: true };
    }

    const filePath = filePaths[0];
    emitSpellcircleDebug(win, 'load:file-selected', { filePath });

    const json = await fs.readFile(filePath, 'utf8');
    emitSpellcircleDebug(win, 'load:file-read', {
      filePath,
      length: json.length,
    });

    const program = JSON.parse(json);
    emitSpellcircleDebug(win, 'load:json-parsed', {
      rootCount: Array.isArray(program?.rootNodeGuids) ? program.rootNodeGuids.length : null,
      nodeCount: program?.nodes ? Object.keys(program.nodes).length : null,
      glyphCount: program?.glyphs ? Object.keys(program.glyphs).length : null,
    });

    return { canceled: false, filePath, program };
  } catch (error) {
    const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
    emitSpellcircleDebug(win, 'load:error', {
      message: error instanceof Error ? error.message : String(error),
    });

    return {
      canceled: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: !guiTestState.enabled,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#d8c59a',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

ipcMain.handle('spellcircle:test:get-config', async () => {
  return {
    enabled: guiTestState.enabled,
    programPath: guiTestState.programPath,
    expectedOutputLines: guiTestState.expectedOutputLines,
  };
});

ipcMain.handle('spellcircle:test:load-program', async () => {
  if (!guiTestState.enabled) {
    return { ok: false, error: 'GUI test mode is not enabled.' };
  }

  try {
    const json = await fs.readFile(guiTestState.programPath, 'utf8');
    const program = JSON.parse(json);
    return {
      ok: true,
      filePath: guiTestState.programPath,
      program,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle('spellcircle:test:report', async (_event, payload) => {
  if (!guiTestState.enabled || guiTestState.completed) {
    return { accepted: false };
  }

  guiTestState.completed = true;
  if (guiTestState.timeoutHandle) {
    clearTimeout(guiTestState.timeoutHandle);
    guiTestState.timeoutHandle = null;
  }

  const ok = Boolean(payload?.ok);
  const actualOutputLines = Array.isArray(payload?.actualOutputLines)
    ? payload.actualOutputLines.map((line) => String(line))
    : [];

  if (ok) {
    console.log('[GUI TEST] PASS');
    process.exitCode = 0;
  } else {
    console.error('[GUI TEST] FAIL');
    if (payload?.error) {
      console.error('[GUI TEST] Error:', String(payload.error));
    }
    console.error('[GUI TEST] Expected output:');
    console.error(guiTestState.expectedOutputLines.join('\n'));
    console.error('[GUI TEST] Actual output:');
    console.error(actualOutputLines.join('\n'));
    process.exitCode = 1;
  }

  app.quit();
  return { accepted: true };
});

// Mirror renderer message log lines to the main process stdout
ipcMain.on('spellcircle:console-log', (_event, message) => {
  try {
    console.log(String(message));
  } catch (_) {
    console.log('[Log forwarding failed]');
  }
});

app.whenReady().then(() => {
  createWindow();

  if (guiTestState.enabled) {
    guiTestState.timeoutHandle = setTimeout(() => {
      if (guiTestState.completed) {
        return;
      }

      guiTestState.completed = true;
      console.error(`[GUI TEST] FAIL: timed out after ${GUI_TEST_TIMEOUT_MS}ms`);
      process.exitCode = 1;
      app.quit();
    }, GUI_TEST_TIMEOUT_MS);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
