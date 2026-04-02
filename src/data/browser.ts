import { setupWorker } from 'msw/browser';
import { handlers } from './handler.ts';

export const worker = setupWorker(...handlers);

export async function startWorker() {
  return worker.start({
    serviceWorker: {
      url: '/mockServiceWorker.js', // works for localhost and gallopics.com
    },
    onUnhandledRequest: 'bypass',
  });
}
