import React from 'react';
import ReactDOM from 'react-dom/client';
import { VercelAestheticPreview } from '../src/VercelAestheticPreview';
import '../src/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <VercelAestheticPreview />
  </React.StrictMode>
);
