import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';
import { authInterceptor } from './guards/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideToastr({
      timeOut: 3500,
      positionClass: 'toast-top-right',
      progressBar: true,
      closeButton: true,
      preventDuplicates: true,
      newestOnTop: true,
      easeTime: 260,
      toastClass: 'ngx-toastr audit-toast',
      titleClass: 'audit-toast-title',
      messageClass: 'audit-toast-message',
      iconClasses: {
        error: 'audit-toast-error',
        info: 'audit-toast-info',
        success: 'audit-toast-success',
        warning: 'audit-toast-warning',
      },
    }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
