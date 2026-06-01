const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');

ipcMain.handle('spellcircle:save', async (_event, program) => {
  const win = BrowserWindow.getFocusedWindow();
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Save Spellcircle',
    defaultPath: 'script.spellcircle',
    filters: [{ name: 'Spellcircle', extensions: ['spellcircle'] }],
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  const json = JSON.stringify(program, null, 2);
  await fs.writeFile(filePath, json, 'utf8');
  return { canceled: false, filePath };
});

ipcMain.handle('spellcircle:load', async () => {
  const win = BrowserWindow.getFocusedWindow();
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Load Spellcircle',
    properties: ['openFile'],
    filters: [{ name: 'Spellcircle', extensions: ['spellcircle'] }],
  });

  if (canceled || !filePaths || filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = filePaths[0];
  const json = await fs.readFile(filePath, 'utf8');
  const program = JSON.parse(json);
  return { canceled: false, filePath, program };
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
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

app.whenReady().then(() => {
  createWindow();

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
