import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Mount the React app in the #root element.
// If #root div not present, create and append it to body.
let rootEl = document.getElementById('root');
if (!rootEl) {
  rootEl = document.createElement('div');
  rootEl.id = 'root';
  document.body.appendChild(rootEl);
}

// React 18+ correct mounting
const root = ReactDOM.createRoot(rootEl);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
