import chalk from "chalk";
import { existsSync, mkdirSync } from "fs";
import { appendFile } from "fs/promises";
import { join } from "path";
import { app, dialog, Notification } from "electron";
import { move, pathExistsSync } from "fs-extra";
import { spawn } from "child_process";

let appDir : string;

try {
  const userDataOverride = app.commandLine.getSwitchValue('user-data-dir');
  if (userDataOverride) {
    mkdirSync(userDataOverride, { recursive: true });
    app.setPath('userData', userDataOverride);
  }
  // appDir = join(__dirname, '../..');
  appDir = app.isPackaged ? app.getPath('userData') : join(__dirname, '../..');
} catch (error) {
  dialog.showErrorBox('Error getting app directory:', error instanceof Error ? error.message : 'Unknown error');
}
// logDebug('appDir', appDir);

export { appDir };
export const logDir = join(appDir, 'logs');
export const databaseDir = join(appDir,  'data');
export const dbPath = join(databaseDir, 'remed.db');
// export const resourcesPath = app.isPackaged ? process.resourcesPath : join(__dirname, '../..', 'resources');
export const resourcesPath = process.env.NODE_ENV === "development" ? join(app.getAppPath()) : process.resourcesPath

if (!existsSync(logDir)) mkdirSync(logDir);


console.log('PROD Log Dir:', appDir);
console.log('Log Dir:', logDir);

const logLine = async (logPath : string, ...args : unknown[]) => {
  const timestamp = new Date().toISOString().replace(/\..+/, '');
  await appendFile(logPath,`[${timestamp}] ${args.join(" ")}\n`);
}

export const log = async (...args : unknown[]) => {
  console.log(chalk.whiteBright(args));
  const logPath = join(logDir, 'app.log');
  await logLine(logPath, ...args);
}

export const logServer = async (...args : unknown[]) => {
  const prefixedArgs = ['[SERVER]', ...args];
  console.log(chalk.whiteBright(...prefixedArgs));
  const logPath = join(logDir, 'server.log');
  logLine(logPath, ...prefixedArgs);
}

export const logDebug = async (...args : unknown[]) => {
  const prefixedArgs = ['[DEBUG]', ...args];
  console.log(chalk.blueBright(...prefixedArgs));
  await logLine(join(logDir, 'app.log'), ...prefixedArgs);
};

export const logError = async (...args : unknown[]) => {
  const prefixedArgs = ['[ERROR]', ...args];
  console.log(chalk.redBright(...prefixedArgs));
  await logLine(join(logDir, 'app.log'), ...prefixedArgs);
};

export const logSuccess = async (...args : unknown[]) => {
  const prefixedArgs = ['[SUCCESS]', ...args];
  console.log(chalk.greenBright(...prefixedArgs));
  await logLine(join(logDir, 'app.log'), ...prefixedArgs);
};

export const logWarning = async (...args : unknown[]) => {
  const prefixedArgs = ['[WARNING]', ...args];
  console.log(chalk.yellowBright(...prefixedArgs));
  await logLine(join(logDir, 'app.log'), ...prefixedArgs);
};

export const logInfo = async (...args : unknown[]) => {
  const prefixedArgs = ['[INFO]', ...args];
  console.log(chalk.cyanBright(...prefixedArgs));
  await logLine(join(logDir, 'app.log'), ...prefixedArgs);
};

function extractFile(archivePath: string, destination: string) {
  return new Promise<number>((resolve, reject) => {
    //TODO: bundle 7z binary with app
    const platformExecutable = process.platform === "darwin" ? "darwin/7zz" : "win32/7za.exe"
    const binaryPath = join(resourcesPath, "bin", platformExecutable);
    const sevenZip = spawn(binaryPath, ["x", archivePath, `-o${destination}`]);
    sevenZip.on('error', reject);

    sevenZip.stdout.on("data", logDebug);
    sevenZip.stderr.on("data", logError);

    sevenZip.on("close", (code) => {
      if (code === 0) {
        logInfo("Extraction successful!");
        resolve(code);
      } else {
        reject(new Error(`7z exited with code ${code}`));
      }
    });
  });
}

export async function extractDBtoUserDir() {
  logInfo(dbPath,pathExistsSync(dbPath) ? "exists" : "does not exist");
  if (!pathExistsSync(dbPath)) {
    const dbArchivePath = join(resourcesPath, "data", 'db.7z');

    if (pathExistsSync(dbArchivePath)) {
      logInfo('Extracting base db to', databaseDir);
      const start = performance.now();
      await extractFile(dbArchivePath, databaseDir);
      logDebug("Extracted in", (performance.now() - start).toFixed(2), "ms");
    } else {
      throw new Error(`Database archive not found at ${dbArchivePath}`);
    }
    if (!pathExistsSync(dbPath)) throw new Error(`Database archive did not contain remed.db`);
  }else logInfo('Database path:', dbPath, "exists. Skipping extraction.");
}

export function showNotification(title : string, body: string) {
  if (Notification.isSupported()) {
    new Notification({
      title,
      body,
      silent: true
    }).show();
  }
}
