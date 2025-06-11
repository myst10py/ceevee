const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Get clipboard items from database with error handling
  getClipboardItems: async () => {
    try {
      return await ipcRenderer.invoke('get-clipboard-items');
    } catch (error) {
      console.error('Error getting clipboard items:', error);
      return [];
    }
  },
  
  // Paste a specific item to active app (now returns a promise)
  pasteItem: async (itemId) => {
    try {
      return await ipcRenderer.invoke('paste-item', itemId);
    } catch (error) {
      console.error('Error pasting item:', error);
      return { success: false, itemId, error: error.message };
    }
  },
  
  // Delete an item from database (now returns a promise)
  deleteItem: async (itemId) => {
    try {
      return await ipcRenderer.invoke('delete-item', itemId);
    } catch (error) {
      console.error('Error deleting item:', error);
      return { success: false, itemId, error: error.message };
    }
  },
  
  // Listen for clipboard updates
  onClipboardUpdated: (callback) => ipcRenderer.on('clipboard-updated', callback),
  
  // Hide the window
  hideWindow: () => ipcRenderer.send('hide-window'),
  
  // Remove all listeners for a specific channel
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Version information
contextBridge.exposeInMainWorld('versions', {
  node: process.versions.node,
  chrome: process.versions.chrome,
  electron: process.versions.electron
});

console.log('Preload script loaded successfully');