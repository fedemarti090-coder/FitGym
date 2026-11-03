import { app, BrowserWindow, ipcMain } from 'electron';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { get_All_Row, get_Ultima_Settimana } from '../Backend/lib/sql.js';

import { main } from '../Backend/backend-main.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.maximize();

    win.loadFile(path.join(__dirname, 'public', 'index.html'));
}

app.whenReady().then(async () => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    await main(false);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('sync-server', async (event) => {
    return await main(true, (step) => {
        event.sender.send('sync-progress', step);
    });
});

ipcMain.handle('get-week-data', () => {
    return get_Ultima_Settimana();
})


ipcMain.handle("get-db-data", () => {
    return get_All_Row('SELECT * FROM meals_day');
})

ipcMain.handle('get-week-history', () => {
    const weeks = get_All_Row(`
        SELECT year, week_number, calories, protein, carbs, fat, parere_coach
        FROM meals_week
        ORDER BY year DESC, week_number DESC
    `);
    const profilePath = path.join(__dirname, '..', 'Backend', 'info', 'user_data.json');
    const profile = JSON.parse(readFileSync(profilePath, 'utf8'));

    return { weeks, profile };
});