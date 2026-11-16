import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Detect low-end devices or Data Saver preference for lightweight glass/motion mode
if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
  const nav = navigator as unknown as {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };
  const isSaveData = Boolean(nav.connection?.saveData);
  const isSlowNet = nav.connection?.effectiveType === '2g' || nav.connection?.effectiveType === 'slow-2g';
  const isLowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2;
  const isLowCpu = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 2;
  if (isSaveData || isSlowNet || isLowMemory || isLowCpu) {
    document.documentElement.classList.add('perf-lite');
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
