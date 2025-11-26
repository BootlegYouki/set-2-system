const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

// Load .env from resources in production, or root in dev
const envPath = app.isPackaged
  ? path.join(process.resourcesPath, '.env')
  : path.join(__dirname, '../.env');
require('dotenv').config({ path: envPath });

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let serverProcess;

const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
const PORT = 3000; // Default port for production server

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720, // 16:9 aspect ratio
    minWidth: 1024, // Prevent phone-like resolutions
    minHeight: 576,
    resizable: true, // Allow resizing
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: true,
      contextIsolation: false, // For simple integration, though contextIsolation: true is more secure
    },
    autoHideMenuBar: true, // Hide the menu bar
    icon: path.join(__dirname, '../static/icon.ico') // Set the window icon
  });

  mainWindow.setMenu(null); // Completely remove the menu

  if (isDev) {
    // In development, load the Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the local server
    mainWindow.loadURL(`http://localhost:${PORT}`);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startServer() {
  if (isDev) return; // Don't spawn server in dev mode

  const serverPath = path.join(__dirname, '../build/index.js');

  if (fs.existsSync(serverPath)) {
    console.log('Starting local server at', serverPath);
    // Use fork instead of spawn to use the internal Electron Node.js runtime
    // This works even if the user doesn't have Node installed globally
    serverProcess = fork(serverPath, [], {
      env: { ...process.env, PORT: PORT.toString(), ORIGIN: `http://localhost:${PORT}` },
      stdio: ['ignore', 'pipe', 'pipe', 'ipc']
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err);
    });
  } else {
    console.error('Server build not found at:', serverPath);
    const { dialog } = require('electron');
    dialog.showErrorBox('Error', 'Server build not found. Please ensure the app was built correctly.\nMissing: ' + serverPath);
  }
}

app.whenReady().then(() => {
  startServer();
  // Give the server a moment to start before loading the window
  setTimeout(createWindow, 1000);

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

app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
