const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs/promises");

let mainWindow;

/**
 * Creates the main application window
 * Sets up window properties, loads the app, and handles window events
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1500,
        height: 800,
        minWidth: 1500,
        minHeight: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        },
        title: "GVW Office"
    });

    mainWindow.maximize();
    mainWindow.setMenuBarVisibility(false);

    if (process.env.NODE_ENV !== "production") {
        mainWindow.loadURL("http://localhost:5173");
    } else {
        mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
    }

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
    if (mainWindow === null) createWindow();
});

ipcMain.handle("open-file-dialog", async (_, options) => {
    const result = await dialog.showOpenDialog({
       title: options?.title ?? "Datei auswählen",
       properties: ["openFile"],
       filters: options?.filters ?? []
    });

    if (result.canceled) {
        return [];
    }

    return result.filePaths;
});

ipcMain.handle("read-file", async (_, filePath) => {
    try {
        return await fs.readFile(filePath);
    } catch (err) {
        throw new Error(`Failed to read file: ${err.message}`);
    }
});