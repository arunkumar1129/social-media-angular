import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Material from '@primeuix/themes/material';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { TokenInterceptor } from './interceptors/token-interceptor';
import { ErrorInterceptor } from './interceptors/error-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: Aura,
        // preset: Material,
        options: {
          darkModeSelector: '.app-dark-mode-class',
          sematic: {
            primary: {
              50: '{indigo.50}',
              100: '{indigo.100}',
              200: '{indigo.200}',
              300: '{indigo.300}',
              400: '{indigo.400}',
              500: '{indigo.500}',
              600: '{indigo.600}',
              700: '{indigo.700}',
              800: '{indigo.800}',
              900: '{indigo.900}',
              950: '{indigo.950}'
            }
          }
        },
      }
    }),
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi()
    ),
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    MessageService
  ]
};
