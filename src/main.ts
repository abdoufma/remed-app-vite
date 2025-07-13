import { app, BrowserWindow, dialog } from 'electron';
import { appendFile } from 'fs/promises';
import { join, resolve } from 'node:path';
import started from 'electron-squirrel-startup';
import { updateElectronApp } from 'update-electron-app';
import { Worker } from 'worker_threads';
import { databaseDir, extractDBtoUserDir, logDebug, logError, logInfo } from './utils';

updateElectronApp();

let serverProcess : Worker | null = null;

async function launchServerProcess(){
  return new Promise<void>((res, reject) => {
    try {
      const serverPath = app.isPackaged ? resolve(join(process.resourcesPath, 'backend', 'app.js')) : resolve(__dirname, '..', '..', 'backend', 'app.js');
      logDebug('serverPath', serverPath);
      const FRONTEND_OUT_DIR = app.isPackaged ? join(process.resourcesPath, 'frontend') : join(__dirname, '../..', 'frontend');
      logDebug('FRONTEND_OUT_DIR', FRONTEND_OUT_DIR);
      const dbPath = app.isPackaged ? join(databaseDir, 'remed2.db') : join(__dirname, '../..', 'db/remed2.db');
      logDebug('dbPath', dbPath);
      serverProcess = new Worker(serverPath, { env: { PORT: '3000', NODE_ENV: 'production', FRONTEND_OUT_DIR, DB_PATH: dbPath } });
  
      serverProcess?.on('error', (error) => {
        logError('Server Process:', error);
      });
  
      serverProcess?.on('exit', (code : number, signal : string) => {
        logInfo('Server process exited with code:', code, 'and signal:', signal);
      });
  
      serverProcess?.on('message', async (message) => {
        if (message &&message.type === 'server-started') {
          await logInfo("Server process started successfully");
          res()
        }
      });
  
    } catch (error) {
      logError('Error loading server process:', error);
      dialog.showErrorBox('Error loading server process', error instanceof Error ? error.message : 'Unknown error');
      reject();
    }
  });
}


// serverProcess.postMessage("ping");
// serverProcess.postMessage({ action: 'start' });


if (started) app.quit();

const createWindow = async () => {
  await logDebug('electron version', process.versions.electron);
  try {

    // Create the browser window.
    const mainWindow = new BrowserWindow({
      title: app.name + ' ' + app.getVersion(),
      width: 1280,
      height: 800,
      webPreferences: {
        // preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        nodeIntegrationInWorker: true,
        contextIsolation: true,
      },
    });

    
    
    mainWindow.on('page-title-updated', (e) => e.preventDefault());
  
    
    await mainWindow.loadURL('https://google.com');
    mainWindow.webContents.openDevTools();
    mainWindow.setProgressBar(0.25);
    await extractDBtoUserDir();
    mainWindow.setProgressBar(0.75);
    await launchServerProcess();
    mainWindow.setProgressBar(1);
    await mainWindow.loadURL('http://localhost:3000');
    mainWindow.setProgressBar(-1);
  } catch (error) {
    await logError('Error during app initialization:', error);
    dialog.showErrorBox(`App Initialisation Error`, (error as Error).message);
  }
};

app.whenReady().then(async () => {
  // await copyDBtoUserDir();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Make sure server closes and database closes when app quits
app.on('before-quit', async () => {
  await logInfo('Closing server process before exit...');
  // serverProcess.postMessage({ action: 'stop' });
  await serverProcess?.terminate();
  logInfo('Server process terminated successfully');
});

// app.on('ready', createWindow);

process.on('uncaughtException', async (err) => {
  await logError('Uncaught Exception:', err);
});
process.on('unhandledRejection', async (reason, promise) => {
  await logError('Unhandled Rejection at:', promise, 'reason:', reason);
});

