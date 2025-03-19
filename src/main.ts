import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { updateElectronApp } from 'update-electron-app';

import expressApp from "./server"
import { initDatabase, closeDatabase } from "./db"

updateElectronApp();

let server : ReturnType<typeof expressApp.listen>;

if (started) app.quit();

const createWindow = async () => {
  console.log(process.versions.electron);
  try {
    // Initialize database
    initDatabase();
    
    // Then import Express app
    const port = process.env.PORT || 3000;
    server = expressApp.listen(port, () => console.log(`Server running at port ${port}`));
  

    // Create the browser window.
    const mainWindow = new BrowserWindow({
      title: app.name + ' ' + app.getVersion(),
      width: 1280,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    mainWindow.on('page-title-updated', (e) => e.preventDefault());

    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
};

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Make sure server closes and database closes when app quits
app.on('before-quit', () => {
  console.log('Closing server and database before exit...');
  server.close();
  closeDatabase();
});

// app.on('ready', createWindow);


