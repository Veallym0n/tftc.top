import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import NiceModal from '@ebay/nice-modal-react';
import { openMap } from './utils/geo';
import './app.css';

// Expose openMap as a global utility for console / deeplink use
// Usage: window.openMap('gaode' | 'baidu' | 'google' | 'googlestreet', 'GC1FB')
(window as any).openMap = openMap;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // StrictMode removed to prevent double-render effects on Leaflet initialization in dev
  <NiceModal.Provider>
    <App />
  </NiceModal.Provider>
);
