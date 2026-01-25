const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
   openFileDialog: (options) => ipcRenderer.invoke("open-file-dialog", options),
   readFile: (path) => ipcRenderer.invoke("read-file", path)
});