import { app, BrowserWindow, dialog } from 'electron';
import { join, resolve } from 'node:path';
import started from 'electron-squirrel-startup';
import { updateElectronApp } from 'update-electron-app';
import { Worker } from 'worker_threads';
import { dbPath, extractDBtoUserDir, logDebug, logDir, logError, logInfo } from './utils';

updateElectronApp();

let serverProcess : Worker | null = null;

let mainWindow : BrowserWindow | null = null;

let progressWindow : BrowserWindow | null = null;

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

async function launchServerProcess(){
  return new Promise<void>((res, reject) => {
    try {
      const serverPath = app.isPackaged ? resolve(join(process.resourcesPath, 'backend', 'app.js')) : resolve(app.getAppPath(), 'backend', 'app.js');
      logDebug('serverPath', serverPath);
      const FRONTEND_OUT_DIR = app.isPackaged ? join(process.resourcesPath, 'frontend') : join(__dirname, '../..', 'frontend');
      logDebug('FRONTEND_OUT_DIR', FRONTEND_OUT_DIR);
      
      logDebug('DB_PATH', dbPath);
      //TODO: move `UPLOADS_DIR` to `{appDir/uploads}`
      const UPLOADS_DIR = app.isPackaged ? join(app.getPath('userData'), 'uploads/') :  resolve(app.getAppPath(), 'backend', 'public/uploads/');
      logDebug('UPLOADS_DIR', UPLOADS_DIR);
      const SQLITE_DB_BACKUPS_DIR = __dirname //TODO: change this later
      const config = { PORT: '3000', NODE_ENV: 'production', SQLITE_DB_PATH: dbPath, SQLITE_DB_BACKUPS_DIR, LOGS_DIR: logDir, UPLOADS_DIR, FRONTEND_OUT_DIR};
      serverProcess = new Worker(serverPath, { env: config});
  
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

function createProgressWindow() {
  progressWindow = new BrowserWindow({
    width: 400,
    height: 200,
    modal: true,
    parent: mainWindow, // your main window
    show: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  const progressFile = app.isPackaged  ? join(process.resourcesPath, 'progress.html') : join(app.getAppPath(), 'progress.html');
  progressWindow.loadFile(progressFile);
  progressWindow.once('ready-to-show', () => {
    progressWindow.show();
  });
}


function updateProgress(percentage : number, message?: string) {
  mainWindow.setProgressBar(percentage/100);
  if (percentage >= 100) setTimeout(() => mainWindow.setProgressBar(-1), 500);
  if (progressWindow) {
    progressWindow.webContents.send('update-progress', { percentage, message });
  }
}


if (started) app.quit();

const createWindow = async () => {
  await logDebug('electron version', process.versions.electron);
  try {

    // Create the browser window.
    mainWindow = new BrowserWindow({
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
    createProgressWindow();
    
    // await mainWindow.loadURL('https://google.com');
    // mainWindow.webContents.openDevTools();
    updateProgress(10, "extracting database");
    await extractDBtoUserDir();
    // await wait(500); 
    updateProgress(50, "launching server process");
    // await wait(1000); 
    await launchServerProcess();
    updateProgress(75, "Launching Remed")
    await mainWindow.loadURL('http://localhost:3000');
    // await wait(500); 
    updateProgress(100)
    // await wait(1000); 
    // updateProgress(100);
    progressWindow.close();
    progressWindow = null;
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

