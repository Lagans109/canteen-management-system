import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles.css';

// The single entry point that mounts the React app into the page's #root
// element. ErrorBoundary wraps everything so an unexpected rendering error
// anywhere in the app shows a friendly fallback screen instead of a blank,
// crashed page.
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
