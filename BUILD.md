# Build Instructions for Lanka POS

This guide focuses on building the application for distribution, specifically as a desktop application using Electron.

## Prerequisites

Ensure you have the following installed on your development machine:

- **Node.js**: v16.14.0 or higher is recommended.
- **npm**: Comes with Node.js.
- **Git**: For version control.
- **Visual Studio Build Tools** (Windows only): Required for compiling native modules if any are added in the future.

## 1. Initial Setup

If you haven't already, clone the repository and install dependencies.

### Install Root Dependencies (Backend & Electron)
```bash
npm install
```

### Install Client Dependencies (Frontend)
```bash
cd client
npm install
cd ..
```

## 2. Database Setup

The desktop application uses a local SQLite database file. You need to ensure the Prisma schema is set up correctly.

1.  **Generate Prisma Client**:
    ```bash
    npx prisma generate
    ```

2.  **Create/Migrate Database**:
    This creates the `dev.db` file which will be bundled with the application (based on current configuration).
    ```bash
    npx prisma migrate dev --name init_build
    ```

3.  **(Optional) Seed Initial Data**:
    If you want the distributed app to come pre-loaded with a Super Admin account:
    ```bash
    npm run seed
    ```

## 3. Building for Production (Windows .exe)

To create a distributable installer for Windows (NSIS), follow these steps:

1.  **Build Both Backend and Frontend**:
    This command compiles the TypeScript backend to `dist/` and builds the React frontend to `client/dist/`.
    ```bash
    npm run build:all
    ```

2.  **Package the Application**:
    This uses `electron-builder` to package the application into an installer.
    ```bash
    npm run dist
    ```

### Output
The build artifacts (installer exe, unpacked folder) will be located in the `release/` directory.

- `Lanka POS Setup <version>.exe`: The installer file.
- `win-unpacked/`: The unpacked executable for quick testing.

## 4. Development Build

To run the application in "development" mode but mimicking the production structure (electron loading built files):

1.  **Build Backend**:
    ```bash
    npm run build
    ```

2.  **Build Frontend**:
    ```bash
    cd client && npm run build && cd ..
    ```

3.  **Run Electron**:
    ```bash
    npm run electron
    ```

## 5. Troubleshooting Common Build Issues

### "Sqlite3" or Native Module Errors
If you encounter errors related to `better-sqlite3` or `prisma` during the build or runtime:
- Ensure you run `npx prisma generate` *before* building.
- You may need to rebuild native dependencies for Electron:
  ```bash
  npm install --save-dev electron-rebuild
  ./node_modules/.bin/electron-rebuild
  ```

### White Screen / "Not Allowed to Load Local Resource"
- Check `electron-main.js`. In production, it loads `mainWindow.loadFile(...)`. Ensure `client/dist/index.html` exists and the path is correct.
- Ensure `homepage` in `client/package.json` is set to `./` or configured correctly for Electron (file protocol).

### Database in Production
- The application is now configured to copy `dev.db` from the installer's `extraResources` footprint into the user's `userData` directory (typically `AppData/Roaming/Lanka POS/database` on Windows).
- This approach prevents read-only errors since `Program Files` is restricted, and ensures the database persists across app updates.
- If you need to ship a new pre-filled database, just rebuild the app with the updated `dev.db` file. The app will only copy the template if one doesn't already exist in the user data folder.
## Configuration Reference (`package.json`)

The build configuration is located in the `build` section of `package.json`:

```json
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
    "target": "nsis"
  }
}
```
