import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import NiceModal from '@ebay/nice-modal-react';

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
