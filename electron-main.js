const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

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

function setupDatabase() {
    if (app.isPackaged) {
        const userDataPath = app.getPath('userData');
        const dbDir = path.join(userDataPath, 'database');
        const dbFile = path.join(dbDir, 'dev.db');

        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        if (!fs.existsSync(dbFile)) {
            const templateDbPath = path.join(process.resourcesPath, 'dev.db');
            if (fs.existsSync(templateDbPath)) {
                fs.copyFileSync(templateDbPath, dbFile);
                console.log('Database initialized from template');
            } else {
                console.warn('Template database not found at:', templateDbPath);
            }
        }

        return dbFile;
    }

    return path.join(__dirname, 'dev.db');
}

function startBackend() {
    const backendPath = path.join(__dirname, 'dist', 'app.js');
    const dbPath = setupDatabase();

    const env = {
        ...process.env,
        PORT: process.env.PORT || '3000',
        DATABASE_URL: `file:${dbPath}`,
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
