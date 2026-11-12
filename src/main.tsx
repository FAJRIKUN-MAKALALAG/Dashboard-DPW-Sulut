import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppDialogProvider } from './components/ui/AppDialogProvider';
import './index.css';

// Kelola Service Worker: Unregister di localhost agar perubahan kode langsung tampil seketika
if (
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      reg.unregister();
    }
  });
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    });
  }
} else if (
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  window.location.protocol === 'https:'
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('PWA ServiceWorker notice:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <AppDialogProvider>
    <App />
  </AppDialogProvider>
);
