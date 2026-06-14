import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

try {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Missing root element.');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('GetChurnShield failed to start:', error);
  document.body.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;background:#0c0614;color:#f4f0ff;font-family:system-ui,sans-serif;padding:24px;text-align:center;">
      <section style="max-width:520px;">
        <h1 style="font-size:28px;margin:0 0 12px;">GetChurnShield is temporarily unavailable</h1>
        <p style="color:#a89bc4;margin:0;">The page could not initialize. Please refresh in a moment.</p>
      </section>
    </main>
  `;
}
