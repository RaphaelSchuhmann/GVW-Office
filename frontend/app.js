const { app, BrowserWindow } = require('electron');
const url = require('url');
const path = require('path');

// ! DEVELOPMENT ONLY
if (process.env.NODE_ENV !== 'production') {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
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
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
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
