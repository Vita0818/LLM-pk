import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { VercelAestheticPreview } from './VercelAestheticPreview';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <VercelAestheticPreview />
  </StrictMode>
);
