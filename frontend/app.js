const { app, BrowserWindow } = require('electron');
const url = require('url');
const path = require('path');

// `__dirname` is undefined in some ESM / bundled contexts. Use a safe
// fallback so the same file works when executed as CommonJS or when
// `__dirname` is unavailable (e.g. certain bundlers or ESM runtimes).
const appDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

// ! DEVELOPMENT ONLY
if (process.env.NODE_ENV !== 'production') {
  require('electron-reload')(appDir, {
    electron: path.join(appDir, 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit',
  });
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.maximize();

  // If using ng serve in dev:
  if (process.env.NODE_ENV !== 'production') {
    mainWindow.loadURL('http://localhost:4200');
  } else {
    // Production: load built Angular files
    mainWindow.loadFile(path.join(appDir, 'dist/index.html'));
  }
  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});
