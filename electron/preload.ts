import { contextBridge, ipcRenderer } from 'electron';

// Expose a minimal, safe API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,

  // App info
  getVersion: (): string => {
    return ipcRenderer.sendSync('get-app-version') || '1.0.0';
  },

  // Window controls
  minimize: (): void => {
    ipcRenderer.send('window-minimize');
  },
  maximize: (): void => {
    ipcRenderer.send('window-maximize');
  },
  close: (): void => {
    ipcRenderer.send('window-close');
  },

  // Notifications
  showNotification: (title: string, body: string): void => {
    ipcRenderer.send('show-notification', { title, body });
  },

  // Listen for events from main process
  onCallNotification: (callback: (data: { caller: string; message: string }) => void): void => {
    ipcRenderer.on('call-notification', (_, data) => callback(data));
  },
});

// Type declaration for the renderer
declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      isElectron: boolean;
      getVersion: () => string;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      showNotification: (title: string, body: string) => void;
      onCallNotification: (callback: (data: { caller: string; message: string }) => void) => void;
    };
  }
}
