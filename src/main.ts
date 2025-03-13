import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';
import started from 'electron-squirrel-startup';
import { spawn } from 'node:child_process';
import { log, logInfo } from './utils';


let server : ReturnType<typeof spawn>;


function runBundledExecutable() {
  const isDev = process.env.NODE_ENV === 'development';

  // Build the path to the executable accordingly
  const binaryPath = join(isDev ? process.cwd() : process.resourcesPath , 'bin/webserver');

  // Spawn the executable process
  server = spawn(binaryPath, [], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '3000' }
  });

  server.stdout.on('data', (data) => {
    logInfo(`[SERVER]: ${data}`);
  });
  server.stderr.on('data', (data) => {
    logInfo(`[SERVER]: ${data}`);
  });

  server.on('error', (err) => {
    console.error('Failed to start binary:', err);
  });

  server.on('close', (code) => {
    log(`Bundled executable exited with code ${code}`);
  });
}


// const serverExecutable = platform() === 'win32' ? 'webserver.exe' : 'webserver';

// const serverPath = join(app.isPackaged ? process.resourcesPath :  process.cwd(), 'bin/', serverExecutable); 
// log('Server Path:', serverPath);


if (started) {
  app.quit();
}

const createWindow = async () => {
  // log(process.versions);
  runBundledExecutable();
  try {
    
    app.on('before-quit', () => {
      log('Closing server and database before exit...');
      // server.send("bye!");
      const message = { event: 'kill', payload: {  } };
      process.stdin.write(JSON.stringify(message) + '\n');
      server.kill("SIGABRT");
    });

    // Create the browser window.
    const mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      webPreferences: {
        preload: join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
    // server.send("Window Loaded");
    // server.stdin.write(JSON.stringify({ command: 'message', payload: { content : "Window Loaded" } }) + '\n');
    const message = { event: 'init', payload: {  } };
    server.stdin.write(JSON.stringify(message) + '\n');
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

// app.on('ready', createWindow);


