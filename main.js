const { app, BrowserWindow } = require('electron');
const path = require('path');

// Inicia o servidor Express em segundo plano
require('./server.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: true, // Modo tela cheia nativo (feeling de console/Steam Deck)
    autoHideMenuBar: true, // Oculta barra de menus do topo
    backgroundColor: '#0e121a', // Evita flash branco antes do load
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Aguarda 1 segundo para o Express subir e carrega a URL
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 1000);

  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
