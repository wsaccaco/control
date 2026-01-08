const { app, BrowserWindow } = require('electron');
const path = require('path');

// Determine if we are in development mode
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    if (isDev) {
        // In dev, load the Vite dev server
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // In prod, load the built html
        const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
        mainWindow.loadFile(indexPath);
    }
}

app.whenReady().then(() => {
    // In production, start the Express server
    if (!isDev) {
        process.env.IS_ELECTRON = 'true'; // Disable socket auth for local
        // Adjust path to where the server file will optionally be located or bundled
        // For simplicity in this setup, we assume server code is bundled or copy-pasted.
        // A common pattern is to just require it if it's in the resource path.
        try {
            require('../server/index.js');
        } catch (e) {
            console.error('Failed to start internal server:', e);
        }
    } else {
        // In DEV, also set this so the running dev server (if we were spawning it) knows.
        // But currently user runs dev server separately. 
        // So this flag mainly matters for the production build behavior.
    }

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
