import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { AppConfig } from './src/app/app.config';



let clientPid;
let win, serve;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

try {
  require('dotenv').config();
} catch {
  console.error('unable to load config');
}

function createWindow() {
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: 800,
    height: 800,
    minWidth: 800,
    minHeight: 800,
    backgroundColor: '#cb2027',
    titleBarStyle: 'hiddenInset',
  });
  win.setMenu(null);

  ipcMain.on('console', (evt, msg) => {
    win.webContents.openDevTools();
    console.log(`console`);
  });

  ipcMain.on('min', (evt, msg) => {
    win.minimize();
    console.log(`minimize`);
  });

  ipcMain.on('max', (evt, msg) => {
    win.maximize();
    console.log(`maximize`);
  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`),
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true,
    }));
  }

  if (AppConfig.production === false) {
    win.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  // Listen on event, sent when angular is officially listening
  // see splash-page.component.ts
  ipcMain.on('client:start', (event, arg) => {
    if (!clientPid) {
      clientPid = arg;
    }
  });
}

try {

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', () => {
    createWindow();
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
    process.kill(clientPid);
  });

  // Emitted when all windows have been closed and the application will quit.
  // Calling event.preventDefault() will prevent the default behaviour, which is terminating the application.
  app.on('will-quit', () => {
    process.kill(clientPid);
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}
