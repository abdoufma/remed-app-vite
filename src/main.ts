import { app, BrowserWindow } from 'electron';
import path, { join, resolve } from 'node:path';
import started from 'electron-squirrel-startup';
import { updateElectronApp } from 'update-electron-app';
import { Worker } from 'worker_threads';

updateElectronApp();

// let server : ReturnType<typeof expressApp.listen>;
const PUBLIC_DIR = app.isPackaged ? join(process.resourcesPath, '..', 'dist') : join(__dirname, '../..', 'dist');
const serverProcess = new Worker(resolve(__dirname, 'server.js'), { env: { PORT: '3000', PUBLIC_DIR } });


serverProcess.postMessage("ping");
serverProcess.postMessage({ action: 'start' });

if (started) app.quit();

const createWindow = async () => {
  console.log(process.versions.electron);
  try {
  

    // Create the browser window.
    const mainWindow = new BrowserWindow({
      title: app.name + ' ' + app.getVersion(),
      width: 1280,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        nodeIntegrationInWorker: true,
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
  // console.log('Closing server and database before exit...');
  // server.close();
  // closeDatabase();
});

// app.on('ready', createWindow);


