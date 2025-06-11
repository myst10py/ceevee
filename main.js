const { app, BrowserWindow, globalShortcut, clipboard, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Global variables
let mainWindow;
let clipboardItems = [];
let lastClipboardText = '';
let clipboardMonitorInterval;
let dbPath;
let isWindowCached = false;
let currentSourceApp = null;

// Database setup - JSON file-based storage
function initializeDatabase() {
  try {
    // Get user data directory
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'clipboard-history.json');
    
    console.log('Database path:', dbPath);
    
    // Load existing data if file exists
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      clipboardItems = JSON.parse(data);
      console.log('Loaded', clipboardItems.length, 'clipboard items from storage');
    } else {
      clipboardItems = [];
      console.log('No existing clipboard history found, starting fresh');
    }
    
    // Add test data if no items exist (for development and testing)
    if (clipboardItems.length === 0) {
      console.log('Adding test clipboard data for development...');
      const testItems = [
        'https://github.com/example/project',
        'Hello, this is a test clipboard item with some longer text to see how it displays',
        'npm install @types/node',
        'function calculateTotal(items) { return items.reduce((sum, item) => sum + item.price, 0); }',
        'john.doe@example.com',
        'Meeting notes: Discuss Q4 roadmap, review performance metrics, plan team restructuring',
        '{"name": "John Doe", "email": "john@example.com", "phone": "+1-555-0123"}',
        'SELECT * FROM users WHERE active = true ORDER BY created_at DESC LIMIT 10;',
        'CeeVee is a minimal clipboard manager for macOS',
        'The quick brown fox jumps over the lazy dog'
      ];
      
      const now = Math.floor(Date.now() / 1000);
      clipboardItems = testItems.map((content, index) => ({
        id: now + index,
        content: content,
        timestamp: now - (index * 60), // Each item 1 minute older
        source_app: ['Terminal', 'VS Code', 'Chrome', 'Notes', 'Mail'][index % 5]
      }));
      
      saveToFile();
      console.log('Added', clipboardItems.length, 'test items');
    }
    
    // Clean up old items on startup
    cleanupOldItems();
    
  } catch (error) {
    console.error('Error initializing database:', error);
    clipboardItems = [];
  }
}

// Save data to JSON file
function saveToFile() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(clipboardItems, null, 2));
  } catch (error) {
    console.error('Error saving to file:', error);
  }
}

// Source app detection
async function detectSourceApp() {
  try {
    if (process.platform === 'darwin') {
      // Use AppleScript to get the frontmost application
      const { stdout } = await execAsync('osascript -e "tell application \"System Events\" to return name of first application process whose frontmost is true"');
      return stdout.trim();
    } else if (process.platform === 'win32') {
      // Windows implementation would go here
      return null;
    } else {
      // Linux implementation would go here
      return null;
    }
  } catch (error) {
    console.error('Error detecting source app:', error);
    return null;
  }
}

// Clipboard monitoring with source app detection
function startClipboardMonitoring() {
  clipboardMonitorInterval = setInterval(async () => {
    try {
      const currentText = clipboard.readText();
      
      // Check if clipboard content has changed and is not empty
      if (currentText !== lastClipboardText && currentText.trim()) {
        // Detect source app when clipboard changes
        const sourceApp = await detectSourceApp();
        saveClipboardItem(currentText, sourceApp);
        lastClipboardText = currentText;
        
        // Send update to renderer if window exists
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('clipboard-updated');
        }
      }
    } catch (error) {
      console.error('Error in clipboard monitoring:', error);
    }
  }, 250); // Check every 250ms for better responsiveness
  
  console.log('Clipboard monitoring started');
}

function stopClipboardMonitoring() {
  if (clipboardMonitorInterval) {
    clearInterval(clipboardMonitorInterval);
    console.log('Clipboard monitoring stopped');
  }
}

// Database operations - JSON file-based storage with source app support
function saveClipboardItem(content, sourceApp = null) {
  try {
    // Don't save if content is empty, too long, or same as last item
    if (!content || content.trim() === '' || content.length > 10000) {
      return;
    }
    
    if (clipboardItems.length > 0 && clipboardItems[0].content === content) {
      return;
    }
    
    const item = {
      id: Date.now(),
      content: content,
      timestamp: Math.floor(Date.now() / 1000),
      source_app: sourceApp
    };
    
    clipboardItems.unshift(item); // Add to beginning
    console.log('Saved clipboard item:', { 
      id: item.id, 
      content: content.substring(0, 50) + '...', 
      sourceApp: sourceApp 
    });
    
    // Keep only last 100 items
    if (clipboardItems.length > 100) {
      clipboardItems = clipboardItems.slice(0, 100);
    }
    
    // Save to file
    saveToFile();
    
  } catch (error) {
    console.error('Error saving clipboard item:', error);
  }
}

function getClipboardItems() {
  try {
    return clipboardItems || [];
  } catch (error) {
    console.error('Error fetching clipboard items:', error);
    return [];
  }
}

function deleteClipboardItem(id) {
  try {
    const index = clipboardItems.findIndex(item => item.id == id);
    if (index !== -1) {
      clipboardItems.splice(index, 1);
      console.log('Deleted clipboard item:', id);
      saveToFile(); // Save after deletion
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting clipboard item:', error);
    return false;
  }
}

function cleanupOldItems() {
  try {
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
    const before = clipboardItems.length;
    clipboardItems = clipboardItems.filter(item => item.timestamp > sevenDaysAgo);
    const after = clipboardItems.length;
    
    if (before > after) {
      console.log('Cleaned up', before - after, 'items older than 7 days');
      saveToFile(); // Save after cleanup
    }
  } catch (error) {
    console.error('Error cleaning up old items:', error);
  }
}

// Optimized paste functionality
async function performPaste(content) {
  try {
    // Set clipboard content
    clipboard.writeText(content);
    
    // Wait a small amount for clipboard to be set
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (process.platform === 'darwin') {
      // Use AppleScript to simulate Cmd+V on macOS
      await execAsync('osascript -e "tell application \\"System Events\\" to keystroke \\"v\\" using command down"');
    } else if (process.platform === 'win32') {
      // Windows implementation
      await execAsync('powershell.exe -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\\"+v\\\")"');
    } else {
      // Linux implementation (requires xdotool)
      await execAsync('xdotool key ctrl+v');
    }
    
    return true;
  } catch (error) {
    console.error('Error performing paste:', error);
    return false;
  }
}

// Window management
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    show: false, // Don't show until ready
    frame: false, // Frameless window
    transparent: false, // Disable transparency for debugging
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: false, // Show in dock so users can click to open
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false, // Prevent throttling when hidden
      enableRemoteModule: false,
      nodeIntegrationInWorker: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // Add debugging for renderer process
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Renderer finished loading');
  });
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Renderer failed to load:', errorCode, errorDescription);
  });
  
  // Open DevTools in development to see errors
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Center window on screen and prepare for fast showing
  mainWindow.once('ready-to-show', () => {
    centerWindow();
    isWindowCached = true;
    // Pre-warm the window for faster display
    console.log('Window ready and pre-warmed for fast display');
    
    // Show window briefly on first start so users know it's working
    setTimeout(() => {
      if (isWindowCached && mainWindow && !mainWindow.isDestroyed()) {
        showWindow();
        console.log('Window shown for testing - will stay open');
        // Don't auto-hide for now so we can debug
      }
    }, 1000);
  });

  // Hide window when it loses focus (disabled for debugging)
  // mainWindow.on('blur', () => {
  //   if (mainWindow && !mainWindow.isDestroyed()) {
  //     mainWindow.hide();
  //   }
  // });

  // Don't show in dock when hidden
  mainWindow.on('hide', () => {
    if (process.platform === 'darwin') {
      app.dock.hide();
    }
  });
  
  mainWindow.on('show', () => {
    if (process.platform === 'darwin') {
      app.dock.show();
    }
  });
}

function centerWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  
  const { screen } = require('electron');
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  
  const windowWidth = 400;
  const windowHeight = 300;
  
  const x = Math.round((width - windowWidth) / 2);
  const y = Math.round((height - windowHeight) / 2);
  
  mainWindow.setBounds({ x, y, width: windowWidth, height: windowHeight });
}

function showWindow() {
  const startTime = Date.now();
  
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
  }
  
  centerWindow();
  mainWindow.show();
  mainWindow.focus();
  
  // Measure window appearance time
  const appearanceTime = Date.now() - startTime;
  console.log(`Window appearance time: ${appearanceTime}ms`);
  
  if (appearanceTime > 100) {
    console.warn('Warning: Window appearance time exceeds 100ms target');
  }
}

function hideWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
}

// Global shortcut handling
function registerGlobalShortcuts() {
  // Register Shift+Cmd+V (Shift+Ctrl+V on non-Mac)
  const shortcut = process.platform === 'darwin' ? 'Shift+Cmd+V' : 'Shift+Ctrl+V';
  
  const registered = globalShortcut.register(shortcut, () => {
    if (mainWindow && mainWindow.isVisible()) {
      hideWindow();
    } else {
      showWindow();
    }
  });

  if (!registered) {
    console.error('Global shortcut registration failed for:', shortcut);
  } else {
    console.log('Global shortcut registered:', shortcut);
  }
}

// IPC handlers
function setupIpcHandlers() {
  // Get clipboard items
  ipcMain.handle('get-clipboard-items', () => {
    return getClipboardItems();
  });

  // Paste item with actual keyboard simulation
  ipcMain.handle('paste-item', async (event, itemId) => {
    try {
      const item = clipboardItems.find(item => item.id == itemId);
      
      if (item) {
        // Hide window first to avoid pasting into CeeVee itself
        hideWindow();
        
        // Wait for window to hide and focus to return to previous app
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const success = await performPaste(item.content);
        
        if (success) {
          console.log('Successfully pasted item:', itemId);
          return { success: true, itemId };
        } else {
          console.error('Failed to paste item:', itemId);
          return { success: false, itemId, error: 'Paste operation failed' };
        }
      } else {
        console.error('Item not found:', itemId);
        return { success: false, itemId, error: 'Item not found' };
      }
    } catch (error) {
      console.error('Error pasting item:', error);
      return { success: false, itemId, error: error.message };
    }
  });

  // Delete item with better error handling
  ipcMain.handle('delete-item', async (event, itemId) => {
    try {
      const success = deleteClipboardItem(itemId);
      return { success, itemId };
    } catch (error) {
      console.error('Error deleting item:', error);
      return { success: false, itemId, error: error.message };
    }
  });

  // Hide window
  ipcMain.on('hide-window', () => {
    hideWindow();
  });
}

// App event handlers
app.whenReady().then(() => {
  console.log('App ready, initializing...');
  
  // Initialize database
  initializeDatabase();
  
  // Setup IPC handlers
  setupIpcHandlers();
  
  // Create window (but don't show it yet)
  createWindow();
  
  // Register global shortcuts
  registerGlobalShortcuts();
  
  // Start clipboard monitoring
  startClipboardMonitoring();
  
  // Initialize with current clipboard content
  const currentClipboard = clipboard.readText();
  if (currentClipboard && currentClipboard.trim()) {
    lastClipboardText = currentClipboard;
    saveClipboardItem(currentClipboard);
  }
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    // Show the window when dock icon is clicked
    showWindow();
  }
});

app.on('will-quit', () => {
  // Clean up before quitting
  stopClipboardMonitoring();
  globalShortcut.unregisterAll();
  
  console.log('App shutting down');
});

// Handle second instance (prevent multiple instances)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      showWindow();
    }
  });
}