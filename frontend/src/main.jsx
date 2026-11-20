import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/outfit';
import './index.css';
import App from './App.jsx';
import { PrivacyProvider } from './privacy/PrivacyContext.jsx';
import './motion.css';

// Start each page load at the hero instead of restoring a previous section.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}
if (window.location.hash) {
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
}
const startAtTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
startAtTop();
window.addEventListener('pageshow', startAtTop);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrivacyProvider><App /></PrivacyProvider>
  </React.StrictMode>,
);
