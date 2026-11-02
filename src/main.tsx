import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AppDialogProvider } from './components/ui/AppDialogProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <AppDialogProvider>
    <App />
  </AppDialogProvider>
);
