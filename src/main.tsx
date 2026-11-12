import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppDialogProvider } from './components/ui/AppDialogProvider';
import './index.css';

// Register PWA Service Worker for Mobile Install & Offline Capabilities
if (
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  (window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('Versi baru NasDem Digital Sulut tersedia.');
              }
            };
          }
        };
      })
      .catch((err) => {
        console.warn('PWA ServiceWorker registration notice:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <AppDialogProvider>
    <App />
  </AppDialogProvider>
);
