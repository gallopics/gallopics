import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './theme.css';
import './index.css';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

async function prepareApp() {
  const { startWorker } = await import('./data/browser.ts');
  await startWorker();
}
prepareApp().then(() => {
  console.log('Mock Service Worker started');

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      {clerkPublishableKey ? (
        <ClerkProvider publishableKey={clerkPublishableKey}>
          <App />
        </ClerkProvider>
      ) : (
        <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
          Missing `VITE_CLERK_PUBLISHABLE_KEY`.
        </div>
      )}
    </React.StrictMode>,
  );
});
