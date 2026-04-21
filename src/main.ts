import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Some legacy dependencies (ex: SockJS) expect a Node-like global object in browser.
if (typeof window !== 'undefined' && !(window as { global?: Window }).global) {
  (window as { global?: Window }).global = window;
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
