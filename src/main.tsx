// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 🔧 Import migration script (فقط در development)
if (import.meta.env.DEV) {
  import('./scripts/migrateToSupabase');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);