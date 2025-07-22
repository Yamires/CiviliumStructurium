import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {registerSW} from 'virtual:pwa-register';


const root = ReactDOM.createRoot(document.getElementById('root'));
registerSW({
  onNeedRefresh() {
    console.log("Nouvelle version prête, actualisé la page.");
  },
  onOfflineReady() {
    console.log("L'application est hors ligne.");
  },
});

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
