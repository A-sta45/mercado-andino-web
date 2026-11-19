import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'katex/dist/katex.min.css';
import './estilos.css';
import App from './App';
import { ProveedorEstado } from './estado';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProveedorEstado>
      <App />
    </ProveedorEstado>
  </StrictMode>,
);
