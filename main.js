const { BrowserWindow, app, ipcMain, Menu, dialog, shell} = require('electron');
const fs = require("fs");
const path = require('path');
const homedir = require('os').homedir();
// const { v4: uuid } = require('uuid');
const { autoUpdater, AppUpdater} = require('electron-updater');
const isDev = require('electron-is-dev');
const ua = require('universal-analytics');
const os = require('os');

const Store = require('electron-store');
const store = new Store();
const {machineId, machineIdSync} = require('node-machine-id');


// IMPORTANT: CHANGE BETWEEN DEV AND PROD
const serverURL = 'http://localhost:8080';
// const serverURL = 'https://www.denote.app';

let userID = null;

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

const createWindow = async () => {

    // console.log('home directory:', homedir);

    let window = new BrowserWindow({
        width: 1200, 
        height: 800,
        backgroundColor: '#ffffff',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            worldSafeExecuteJavaScript: true,
            enableRemoteModule: true
        }
    });

    window.loadURL(path.join('file://', __dirname, 'index.html'));

    window.setTitle('Denote ' + app.getVersion());

    window.setMinimumSize(400, 300);
    
    // window.webContents.openDevTools();/

    //set icon
    if (process.platform === 'darwin') {
        app.dock.show();
        app.dock.setIcon(path.join(__dirname, 'assets', 'Denote-Icon-Rounded-1024.png'));
    } else {
        window.setIcon(path.join(__dirname, 'assets', 'Denote-Icon-Rounded-1024.png'));
    }

    if(isDev)
        window.webContents.openDevTools();

    // adding menu with File and Edit options to the window
    const menu = Menu.buildFromTemplate([
        {
            label: 'Denote',
            submenu: [
                {role: 'quit', label: 'Quit Denote', accelerator: 'CmdOrCtrl+Q', click: () => {}},
                {role: 'close', label: 'Close Window', accelerator: 'CmdOrCtrl+W', click: () => {}},
                // send to url https://www.denote.app
                {role: 'about', label: 'About Denote', click: () => {shell.openExternal('https://www.denote.app/about')}},
            ]
        },
        {
            label: 'File',
            submenu: [
                {role: 'new', label: 'New File', accelerator: 'CmdOrCtrl+N', click: () => {window.webContents.send('new-file-shortcut')}},
                {role: 'open', label: 'Open Folder', accelerator: 'CmdOrCtrl+O', click: () => {window.webContents.send('open-folder')}},
                {role: 'save', label: 'Save File', accelerator: 'CmdOrCtrl+S', click: () => {window.webContents.send('file-saved-shortcut')}},
                // {type: 'separator'},
                // {role: 'export', label: 'Export File', accelerator: 'CmdOrCtrl+E', click: () => {console.log('export clicked')}},
                // {type: 'separator'},
                // {role: 'print', label: 'Print File', accelerator: 'CmdOrCtrl+P', click: () => {console.log('print clicked')}},
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {role: 'undo', label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => {}},
                {role: 'redo', label: 'Redo', accelerator: 'CmdOrCtrl+Y', click: () => {}},
                {type: 'separator'},
                {role: 'cut', label: 'Cut', accelerator: 'CmdOrCtrl+X'},
                {role: 'copy', label: 'Copy', accelerator: 'CmdOrCtrl+C'},
                {role: 'paste', label: 'Paste', accelerator: 'CmdOrCtrl+V'},
                {role: 'delete', label: 'Delete', accelerator: 'CmdOrCtrl+Backspace'},
                {type: 'separator'},
                {role: 'selectAll', label: 'Select All', accelerator: 'CmdOrCtrl+A'},
                {role: 'deselectAll', label: 'Deselect All', accelerator: 'CmdOrCtrl+D'},
            ]

        },
        {
            label: 'View',
            submenu: [
                // {role: 'toggleDevTools', label: 'Toggle Developer Tools', accelerator: 'CmdOrCtrl+Shift+I', click: () => {console.log('toggle dev tools clicked')}},
                {role: 'reload', label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => {}},
            ]
        },
        {
            label: 'Help',
            submenu: [
                {role: 'help', label: 'Help', click: () => {shell.openExternal('https://www.denote.app/guide')}},
                {type: 'separator'},
                {label: 'Contact Us', click: () => {shell.openExternal('https://www.denote.app/contact')}},
            ]
        },
        {
            label: 'Window',
            submenu: [
                // {role: 'minimize', label: 'Minimize', accelerator: 'CmdOrCtrl+M', click: () => {console.log('minimize clicked')}},
                {role: 'zoom', label: 'Zoom', accelerator: 'CmdOrCtrl+Shift+M', click: () => {console.log('zoom clicked')}},
                {role: 'toggleFullScreen', label: 'Toggle Full Screen', accelerator: 'CmdOrCtrl+Shift+F', click: () => {console.log('toggle full screen clicked')}},
            ]

        }
    ]);

    Menu.setApplicationMenu(menu);

    // window.once('ready-to-show', () => {
    //     autoUpdater.checkForUpdatesAndNotify();
    // });
}

if (isDev) {
    require('electron-reload')(__dirname, {
        electron: require(path.join(__dirname, 'node_modules', 'electron'))
    });    
}


const showUpdateDialog = () => {
    console.log('showUpdateDialog:', store.has('isUpToDate'), store.get('isUpToDate'));

    if(store.has('isUpToDate') && store.get('isUpToDate'))
        return;

    console.log('showing update dialog')

    let updateLogs = new BrowserWindow({
        width: 400,
        height: 400,
        backgroundColor: '#ffffff',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            worldSafeExecuteJavaScript: true,
            enableRemoteModule: true,
            // preload: path.join(__dirname, 'src', 'preload.js'),
        }
    });

    fetch(serverURL + '/event', {
        method: 'POST',
        body: JSON.stringify({
            userID: userID,
            type: 'update_installed',
            aditionalData: `${app.getVersion()}`
        }),
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors'
    })

    updateLogs.loadURL(path.join('file://', __dirname, 'update_logs.html'));

    updateLogs.setTitle('Denote Update');

    updateLogs.setMinimumSize(300, 300);

    updateLogs.setIcon(path.join(__dirname, 'assets', 'Denote-Icon-Rounded-1024.png'));

    store.set('isUpToDate', true);
}

app.whenReady().then(async () => {
    if(!store.has('userID') || store.get('userID') == null){

        console.log('registering new user')

        const computerID = await machineIdSync({original: true});

        userID = await fetch(serverURL + '/register', {
            method: 'POST',
            body: JSON.stringify({
                platform: os.platform(),
                computerID: computerID,
                homedir: homedir,
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        }).then(response => response.json()).then(data => {
            const userID = data.userID;
            return userID;
        }).catch(error => {
            console.error('Error:', error);
            return null;
        });

        store.set('userID', userID);

        if(!userID)
            return app.quit();

    } else {
        userID = store.get('userID');

        console.log('returning user');
    }

    console.log('userID = ' + userID);

    fetch(serverURL + '/event', {
        method: 'POST',
        body: JSON.stringify({
            userID: userID,
            type: 'app_opened',
            aditionalData: `${app.getVersion()}`
        }),
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors'
    })

    if(!isDev){
        autoUpdater.checkForUpdates();
    }

    createWindow();

    showUpdateDialog();
});

autoUpdater.on('checking-for-update', () => {
    console.log('checking for update');
});

autoUpdater.on('update-available', (info) => {
    console.log('update available');
    store.set('isUpToDate', false);
    let updateAvailableWindow = new BrowserWindow({
        width: 400,
        height: 400,
        backgroundColor: '#ffffff',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            worldSafeExecuteJavaScript: true,
            enableRemoteModule: true,
            // preload: path.join(__dirname, 'src', 'preload.js'),
        }
    });

    if(os.platform() === 'darwin'){
        updateAvailableWindow.loadURL(path.join('file://', __dirname, 'update_available_auto.html'));
    } else {
        updateAvailableWindow.loadURL(path.join('file://', __dirname, 'update_available_manual.html'));
    }

    // load icon
    updateAvailableWindow.setIcon(path.join(__dirname, 'assets', 'Denote-Icon-Rounded-1024.png'));

    updateAvailableWindow.setMinimumSize(300, 300);

    console.log(info)
});

autoUpdater.on('update-not-available', (info) => {
    console.log('update not available');
});

autoUpdater.on('download-progress', (progressObj) => {
    console.log('download progress ' + progressObj.percent);
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('update downloaded');
    fetch(serverURL + '/event', {
        method: 'POST',
        body: JSON.stringify({
            userID: userID,
            type: 'update_downloaded',
            aditionalData: `${info.version}`
        }),
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors'
    })
    store.set('isUpToDate', false);
    autoUpdater.quitAndInstall();
});

autoUpdater.on('error', (err) => {
    console.error(err);
    fetch(serverURL + '/event', {
        method: 'POST',
        body: JSON.stringify({
            userID: userID,
            type: 'update_error',
            aditionalData: `${err.message}`
        }),
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors'
    })
});

ipcMain.on('app_info', (event) => {
    version = app.getVersion();
    event.sender.send('app_info', {version: version, isDev: isDev, platform: os.platform(), userID: userID, serverURL: serverURL});
});

const openFolder = async (event) => {
    const folderpath = homedir;

    dialog.showOpenDialog({
        title: 'Select the Directory to be opened',
        defaultPath: folderpath,
        buttonLabel: 'Open',
        properties: process.platform === 'darwin' ? ['openDirectory', 'createDirectory'] : ['openDirectory', 'createDirectory']
    }).then(dir => {
        // Stating whether dialog operation was
        // cancelled or not.
        if (!dir.canceled) {
            const dirPath = dir.filePaths[0].toString();
            store.set('lastOpenedFolder', dirPath);
            console.log(dirPath);
            event.reply('open-folder-reply', dirPath);
        }  
    }).catch(err => {
        console.log(err)

        fetch(serverURL + '/event', {
            method: 'POST',
            body: JSON.stringify({
                userID: userID,
                type: 'folder_open_error',
                aditionalData: `${err.message}`
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        })
    });
}

ipcMain.on('clear_all_cache_and_quit', (event) => {
    store.clear();
    store.set('userID', null);
    store.delete('userID');
    app.quit();
});

ipcMain.on('clear_update_cache_and_quit', (event) => {
    // store.set('isUpToDate', false);
    console.log('poop')
    store.delete('isUpToDate');
    app.quit();
});

ipcMain.on('open-folder', (event) => {  
    // If the platform is 'win32' or 'Linux'
    // Resolves to a Promise<Object>
    openFolder(event);
});

ipcMain.on('open-image', (event) => {
    // If the platform is 'win32' or 'Linux'

    const folderpath = store.get('lastOpenedFolder');
    if(!folderpath) folderpath = homedir;

    dialog.showOpenDialog({
        title: 'Select the Image to be opened',
        defaultPath: folderpath,
        buttonLabel: 'Open',
        // Restricting the user to only Image Files.
        filters: [
        {
            name: 'Images',
            extensions: ['jpg', 'png', 'gif', 'jpeg']
        }, ],
        // Specifying the File Selector Property
        properties: ['openFile']
    }).then(file => {
        // Stating whether dialog operation was
        // cancelled or not.
        if (!file.canceled) {
            const filePath = file.filePaths[0].toString();
            // store.set('lastOpenedFolder', filePath);
            console.log(filePath);
            event.reply('open-image-reply', filePath);
        }
    }).catch(err => {
        console.log(err)

        fetch(serverURL + '/event', {
            method: 'POST',
            body: JSON.stringify({
                userID: userID,
                type: 'image_open_error',
                aditionalData: `${err.message}`
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        })
    });
});


ipcMain.on('open-saved-folder', (event) => {
    const dirPath = store.get('lastOpenedFolder');

    if (dirPath)
        return event.reply('open-folder-reply', dirPath);

    openFolder(event);
});


ipcMain.on('file-saved', (event) => {
    // dialog to save file
    // If the platform is 'win32' or 'Linux'

    const folderpath = store.get('lastOpenedFolder');
    if(!folderpath) folderpath = homedir;

    dialog.showSaveDialog ({
        title: 'Select where to save the file',
        defaultPath: folderpath,
        buttonLabel: 'Save',
        // Restricting the user to only Text Files.
        filters: [
        {
            name: 'Denote Files',
            extensions: ['dnt']
        }, ],
        // Specifying the File Selector Property
        properties: process.platform === 'darwin' ? ['createDirectory'] : []

    }).then(file => {

        if (!file.canceled) {
            const filepath = file.filePath.toString();

            fs.writeFile(filepath, "", (err) => {
                if (err) {
                    console.log("An error ocurred creating the file " + err.message)
                }
            });

            return event.reply('file-saved-reply', filepath);
        }

    }).catch(err => {
        console.log(err)

        fetch(serverURL + '/event', {
            method: 'POST',
            body: JSON.stringify({
                userID: userID,
                type: 'file_save_error',
                aditionalData: `${err.message}`
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        })
    });
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the 
    // app when the dock icon is clicked and there are no 
    // other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});