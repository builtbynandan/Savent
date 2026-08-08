import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { NotificationProvider } from './components/Notifications.tsx';
import { ThemeProvider } from './components/ThemeProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </ThemeProvider>
  </StrictMode>,
);
