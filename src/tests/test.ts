import { spawn } from "node:child_process";
import { logDebug, logError, logInfo, logWarning } from './utils';
import { pathExistsSync } from "fs-extra";
import { join } from "node:path";

const databaseDir = join(__dirname, "..", "./extracted")

function extractFile(archivePath: string, destination: string) {
  return new Promise((resolve, reject) => {
    const sevenZip = spawn("7zz", ["x", archivePath, `-o${destination}`]);
    
    sevenZip.stdout.on("data", (chunk) => logDebug(chunk))
    sevenZip.stderr.on("data", (chunk) => logError(chunk))

    sevenZip.on("close", (code) => {
      if (code === 0) {
        logInfo("Extraction successful!");
        resolve(code);
      } else {
        reject(new Error(`sevenZip exited with code ${code}`));
      }
    });
  });
}

export async function extractDBtoUserDir() {
  if (!pathExistsSync(databaseDir)) {
    // const dbArchivePath = join(process.resourcesPath, 'db.7z');
    const dbArchivePath = join(__dirname, `..`, 'db/db.7z');

    if (pathExistsSync(dbArchivePath)) {
      logInfo('Extracting base db to', databaseDir);
      const start = performance.now();
      await extractFile(dbArchivePath, databaseDir);
      logDebug("Extracted in", (performance.now() - start).toFixed(2), "ms");
    } else {
      logWarning('Database Archive not found at', dbArchivePath);
    }
  }
}

// await extractDBtoUserDir();