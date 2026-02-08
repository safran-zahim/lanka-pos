# Converting Lanka POS to Windows Desktop Application (.exe)

This guide explains how to package the POS system as a standalone Windows desktop application.

## 🎯 Approach: Electron Desktop App

We'll use **Electron** to wrap your web application into a native Windows .exe file that users can double-click to run.

## 📦 Step 1: Install Electron Dependencies

```bash
# In the project root
npm install --save-dev electron electron-builder concurrently wait-on
```

## 📝 Step 2: Create Electron Main Process

Create `electron-main.js` in the project root:

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'assets/icon.png'), // Optional: Add your icon
        autoHideMenuBar: true, // Hide menu bar for cleaner look
    });

    // Load the frontend
    mainWindow.loadURL('http://localhost:5173');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startBackend() {
    // Start the Express backend
    backendProcess = spawn('node', ['dist/app.js'], {
        cwd: __dirname,
        env: { ...process.env, PORT: 3000 },
    });

    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });
}

app.on('ready', () => {
    startBackend();
    
    // Wait for backend to start, then open window
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
```

## 📝 Step 3: Update package.json

Add these scripts to your root `package.json`:

```json
{
  "name": "lanka-pos-desktop",
  "version": "1.0.0",
  "main": "electron-main.js",
  "scripts": {
    "start": "node dist/app.js",
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "electron": "electron .",
    "electron-dev": "concurrently \"npm run dev\" \"cd client && npm run dev\" \"wait-on http://localhost:3000 http://localhost:5173 && electron .\"",
    "pack": "electron-builder --dir",
    "dist": "electron-builder"
  },
  "build": {
    "appId": "com.lankapos.app",
    "productName": "Lanka POS",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "client/dist/**/*",
      "prisma/**/*",
      "dev.db",
      ".env",
      "electron-main.js",
      "node_modules/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

## 📝 Step 4: Build Production Files

Before creating the .exe, build both frontend and backend:

```bash
# Build backend
npm run build

# Build frontend
cd client
npm run build
cd ..
```

## 📝 Step 5: Update Electron Main for Production

Create `electron-main-prod.js`:

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const express = require('express');

let mainWindow;
let backendProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'assets/icon.png'),
        autoHideMenuBar: true,
    });

    // In production, serve the built frontend
    const frontendPath = path.join(__dirname, 'client', 'dist', 'index.html');
    mainWindow.loadFile(frontendPath);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startBackend() {
    const backendPath = path.join(__dirname, 'dist', 'app.js');
    backendProcess = spawn('node', [backendPath], {
        env: { 
            ...process.env, 
            PORT: 3000,
            DATABASE_URL: 'file:./dev.db',
            JWT_SECRET: 'production_secret_key'
        },
    });

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
```

## 🏗️ Step 6: Build the .exe

```bash
# Create installer
npm run dist
```

This will create:
- `release/Lanka POS Setup 1.0.0.exe` - Installer
- `release/win-unpacked/` - Portable version

## 📦 Alternative: Simpler Batch File Approach

If Electron is too complex, create a simple launcher:

### Create `start-pos.bat`:

```batch
@echo off
title Lanka POS System
echo Starting Lanka POS...
echo.

REM Start Backend
start /B cmd /c "npm start"
timeout /t 3 /nobreak > nul

REM Start Frontend
cd client
start /B cmd /c "npm run preview"
timeout /t 3 /nobreak > nul

REM Open Browser
start http://localhost:4173

echo.
echo Lanka POS is running!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:4173
echo.
echo Press any key to stop the system...
pause > nul

REM Kill processes
taskkill /F /IM node.exe
```

### Create Desktop Shortcut:

1. Right-click `start-pos.bat`
2. Create Shortcut
3. Right-click shortcut → Properties
4. Change icon (optional)
5. Move to Desktop

## 🎨 Optional: Add Application Icon

1. Create/download a `.ico` file (256x256 recommended)
2. Save as `assets/icon.ico`
3. Update `electron-main.js` icon path

## 📊 Comparison

| Method | Pros | Cons |
|--------|------|------|
| **Electron** | Professional .exe, Auto-updates, Offline installer | Large file size (~150MB) |
| **Batch File** | Simple, Small, Quick | Requires Node.js installed |

## 🚀 Recommended: Electron for Distribution

For a professional desktop app that you can distribute to users who don't have Node.js:

```bash
# Full build process
npm run build
cd client && npm run build && cd ..
npm run dist
```

The installer will be in `release/Lanka POS Setup 1.0.0.exe`

## 📝 Distribution

Users can:
1. Download the installer
2. Double-click to install
3. Launch from Start Menu or Desktop
4. No Node.js or technical knowledge required!

---

**Next Steps:**
1. Choose your approach (Electron recommended)
2. Follow the steps above
3. Test the .exe on a clean Windows machine
4. Distribute to users!
