import { APP_INITIALIZER, ApplicationConfig, inject, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTransloco } from '@jsverse/transloco';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { demoInterceptor } from './core/api/demo.interceptor';
import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './features/account/theme.service';
import { TranslocoHttpLoader } from './i18n/transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // Demo interceptor MUST run first: it short-circuits /api/v1/* requests
    // with canned data so the SPA works without a backend on Vercel.
    provideHttpClient(withInterceptors([demoInterceptor, authInterceptor])),
    provideAnimationsAsync(),
    provideTransloco({
      config: {
        availableLangs: ['ca', 'es', 'en'],
        defaultLang: 'ca',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    {
      /**
       * Apply the persisted theme synchronously, before any rendering, so dark
       * users never see a light flash. Runs ahead of the auth bootstrap.
       */
      provide: APP_INITIALIZER,
      useFactory: () => {
        const theme = inject(ThemeService);
        return () => {
          theme.initFromStorage();
          return Promise.resolve();
        };
      },
      multi: true,
    },
    {
      /**
       * Bootstraps the auth session before the router first evaluates guards.
       * Without this, a page-reload lands with user=null and the guard redirects to login.
       * Uses inject() directly inside useFactory (Angular 18 standalone pattern) to avoid NG0203.
       */
      provide: APP_INITIALIZER,
      useFactory: () => {
        const auth = inject(AuthService);
        return () =>
          new Promise<void>((resolve) => {
            auth.loadCurrentUser().subscribe({ next: () => resolve(), error: () => resolve() });
          });
      },
      multi: true,
    },
  ],
};
