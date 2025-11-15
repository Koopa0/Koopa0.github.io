import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { Buffer } from 'buffer/';

// Polyfill Buffer for browser environment (needed by gray-matter)
(window as any).Buffer = Buffer;

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
