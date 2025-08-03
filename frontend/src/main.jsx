import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {registerSW} from 'virtual:pwa-register';
import { Auth0Provider } from '@auth0/auth0-react';

const domain ="dev-20ay5shrj23453un.us.auth0.com";
const clientId = "iXsx6PPahkjWIAXfjO0KBBRgj3yaX8TU";
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
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: "https://civilium-api",
      scope: "openid profile email",
    }}
    cacheLocation="localstorage">
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Auth0Provider>
);
