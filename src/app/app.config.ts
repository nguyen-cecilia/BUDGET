import {ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode, LOCALE_ID} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideServiceWorker} from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
    providers: [
        {provide: LOCALE_ID, useValue: 'fr-FR'},
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
        })
    ]
};
