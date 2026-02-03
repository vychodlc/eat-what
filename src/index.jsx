import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import "./theme.js";
import { HashRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
      <Toaster position="top-center" />
    </HashRouter>
  </React.StrictMode>
);