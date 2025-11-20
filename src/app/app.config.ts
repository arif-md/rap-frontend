import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app-routing.module';
import { AuthInterceptor } from '@app/interceptors/auth-interceptor';
import { ErrorInterceptor } from '@app/interceptors/error-interceptor';
import { AppConfigService } from '@app/global-services/app-config.service';

// Load runtime configuration before app starts
export function initializeApp(appConfigService: AppConfigService) {
  return () => appConfigService.loadEnvProperties().toPromise();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    // Load runtime config before app initialization
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppConfigService],
      multi: true
    },
    // Interceptors (AuthInterceptor must run BEFORE ErrorInterceptor)
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ]
};
