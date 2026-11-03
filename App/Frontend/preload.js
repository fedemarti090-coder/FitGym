const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  sync_server: () => ipcRenderer.invoke('sync-server'),
  ottieni_week_data: () => ipcRenderer.invoke('get-week-data'),
  on_sync_progress: (callback) => {
    const listener = (_event, step) => callback(step);
    ipcRenderer.on('sync-progress', listener);
    return () => ipcRenderer.removeListener('sync-progress', listener);
  },

  ottiene_db_data: () => ipcRenderer.invoke('get-db-data'),
  get_week_history: () => ipcRenderer.invoke('get-week-history')
});