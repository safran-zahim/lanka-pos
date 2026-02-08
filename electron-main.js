const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

const isDev = process.env.ELECTRON_DEV === '1';

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        const frontendPath = path.join(__dirname, 'client', 'dist', 'index.html');
        mainWindow.loadFile(frontendPath);
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startBackend() {
    const backendPath = path.join(__dirname, 'dist', 'app.js');
    const env = {
        ...process.env,
        PORT: process.env.PORT || '3000',
        DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
        JWT_SECRET: process.env.JWT_SECRET || 'change_me'
    };

    backendProcess = spawn('node', [backendPath], { env });

    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });
}

app.on('ready', () => {
    startBackend();
    setTimeout(() => {
        createWindow();
    }, 2000);
});

app.on('window-all-closed', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
    app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
