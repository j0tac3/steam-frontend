import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
// Fíjate en el withInterceptors que hemos añadido
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'; 
import { authInterceptor } from './interceptors/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor]) // <-- ¡AQUÍ ESTÁ LA MAGIA!
    )
  ]
};