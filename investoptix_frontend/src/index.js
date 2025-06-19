import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Ensure the root element exists
const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  // If #root is missing, create it dynamically and append to body
  const createdRoot = document.createElement('div');
  createdRoot.id = 'root';
  document.body.appendChild(createdRoot);
  const root = ReactDOM.createRoot(createdRoot);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
