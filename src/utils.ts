import chalk from "chalk";
import { existsSync, mkdirSync } from "fs";
import { appendFile } from "fs/promises";
import { join } from "path";
import { app } from 'electron';

const logDir = process.env.NODE_ENV === 'development' ? 'logs' : app.getPath("userData"); // join(process.resourcesPath, 'logs');
if (!existsSync(logDir)) mkdirSync(logDir);


// console.log('PROD Log Dir:', app.getPath("userData"));
console.log('Log Dir:', logDir);

export const log = async (...args : unknown[]) => {
    console.log(chalk.whiteBright(...args));
    const timestamp = new Date().toISOString().replace(/\..+/, '');
    const logPath = join(logDir, 'app.log');
    await appendFile(logPath,`[${timestamp}] ${args.join(" ")}\n`);
}

export const logDebug = (...args : unknown[]) => {
  console.log(chalk.blueBright(args));
};

export const logError = (...args : unknown[]) => {
  console.log(chalk.redBright(args));
};

export const logSuccess = (...args : unknown[]) => {
  console.log(chalk.greenBright(args));
};

export const logWarning = (...args : unknown[]) => {
  console.log(chalk.yellowBright(args));
};

export const logInfo = (...args : unknown[]) => {
  console.log(chalk.cyanBright(args));
};