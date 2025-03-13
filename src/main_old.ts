// import { app, BrowserWindow } from 'electron';
// import path from 'node:path';
// import started from 'electron-squirrel-startup';

// // Import express app after electron app is defined
// let expressApp;
// let database;

// if (started) {
//   app.quit();
// }

// const createWindow = async () => {
//   console.log(process.versions.electron);
//   try {
//     // Import and initialize database using dynamic import
//     const dbModule = await import('./db');
//     database = dbModule.initDatabase();
    
//     // Then import Express app
//     expressApp = (await import('./server')).default;
//     const port = process.env.PORT || 3000;
//     const server = expressApp.listen(port, () => console.log(`Server running at port ${port}`));
    
//     // Make sure server closes and database closes when app quits
//     app.on('before-quit', () => {
//       console.log('Closing server and database before exit...');
//       server.close();
//       dbModule.closeDatabase();
//     });

//     // Create the browser window.
//     const mainWindow = new BrowserWindow({
//       width: 1280,
//       height: 800,
//       webPreferences: {
//         preload: path.join(__dirname, 'preload.js'),
//         nodeIntegration: false,
//         contextIsolation: true,
//       },
//     });

//     mainWindow.loadURL('http://localhost:3000');
//     mainWindow.webContents.openDevTools();
//   } catch (error) {
//     console.error('Error during app initialization:', error);
//   }
// };

// app.whenReady().then(createWindow);

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') app.quit();
// });

// app.on('activate', () => {
//   if (BrowserWindow.getAllWindows().length === 0) createWindow();
// });

// // app.on('ready', createWindow);


