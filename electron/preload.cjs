const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // We will expose hardware fingerprinting here later
    getMachineId: () => 'mock-machine-id',
});
