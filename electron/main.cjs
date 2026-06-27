const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    titleBarStyle: 'hiddenInset', // Giống Notion: nút đóng thu phóng liền mạch
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true // An toàn tuyệt đối, tắt các hành vi XSS
    }
  });

  // Trong môi trường dev -> trỏ tới Vite. Production -> trỏ tới file html đã build
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); // Mở F12 để check lỗi
  } else {
    // Thin Client: Load directly from Firebase Hosting!
    mainWindow.loadURL('https://tt-daily-task.web.app');
  }
  
  // Bắt các link web (vd: calendar link) bật ra trình duyệt gốc của Mac
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // Trên macOS, click vào icon dock sẽ mở lại window nếu chưa có
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
