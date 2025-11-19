import { inject, Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EnvironmentProps, EnvironmentPropsAdapter, ErrorResponse, URL_CONFIG_ENV_PROPS } from '@app/shared/model';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LocationStrategy } from '@angular/common';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};


@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
    private injector = inject(Injector);
    
    // Lazy-loaded services to avoid circular dependency
    private _http?: HttpClient;
    private _locationStrategy?: LocationStrategy;
    private _envPropsAdapter?: EnvironmentPropsAdapter;

    private get http(): HttpClient {
        if (!this._http) {
            this._http = this.injector.get(HttpClient);
        }
        return this._http;
    }

    private get locationStrategy(): LocationStrategy {
        if (!this._locationStrategy) {
            this._locationStrategy = this.injector.get(LocationStrategy);
        }
        return this._locationStrategy;
    }

    private get envPropsAdapter(): EnvironmentPropsAdapter {
        if (!this._envPropsAdapter) {
            this._envPropsAdapter = this.injector.get(EnvironmentPropsAdapter);
        }
        return this._envPropsAdapter;
    }

    //TODO: Instead of props variable, envPropObs should be used. remove props variable.
    private props: EnvironmentProps;
    private envPropsSubject: BehaviorSubject<EnvironmentProps | null>;
    public envPropObs: Observable<EnvironmentProps | null>;

    constructor () {
        this.envPropsSubject = new BehaviorSubject<EnvironmentProps | null>(null);
        this.envPropObs = this.envPropsSubject.asObservable();
    }

    /*generateAPIKey(): Observable<any> {
        const url = `${this.locationStrategy.getBaseHref()}${URL_GENERATE_API_KEY}`;
        return this.http.get(url, {responseType: 'text'});
    }*/

    /* loadAppConfig() {
        const http = this.injector.get(HttpClient);

        return http.get(URL_CONFIG_ENV_PROPS)
        .toPromise()
        .then(data => {
            this.appConfig = data;
        }).catch(error => {
          console.error('Error loading app-config.json, using envrionment file instead');
        });
    }*/

    loadEnvProperties(): Observable<EnvironmentProps> {
        // Load runtime configuration first
        // In Azure: runtime-config.json is pre-merged with backend config via merge-runtime-config.js
        // In local dev: runtime-config.json may not have JWT timeout, so we fetch from backend API
        const base = this.locationStrategy.getBaseHref();
        const runtimeUrl = `${base}assets/runtime-config.json`;

        return this.http.get<EnvironmentProps>(runtimeUrl, httpOptions)
            .pipe(
                catchError(() => {
                    // If runtime-config.json doesn't exist, construct backend API URL
                    const backendApiUrl = this.getBackendApiUrl(null);
                    return this.http.get<EnvironmentProps>(backendApiUrl, httpOptions);
                }),
                tap(runtimeProps => {
                    // Check if JWT timeout is missing (local dev scenario)
                    if (!runtimeProps.jwtAccessTokenExpirationMinutes) {
                        console.log('[AppConfig] JWT timeout missing from runtime config, fetching from backend API');
                        // Construct backend API URL using apiBaseUrl from runtime config
                        const backendApiUrl = this.getBackendApiUrl(runtimeProps.apiBaseUrl);
                        
                        // Fetch backend config to get JWT timeouts
                        this.http.get<EnvironmentProps>(backendApiUrl, httpOptions).subscribe({
                            next: (backendProps) => {
                                // Merge: runtime config + backend JWT settings
                                const mergedProps = {
                                    ...runtimeProps,
                                    jwtAccessTokenExpirationMinutes: backendProps.jwtAccessTokenExpirationMinutes,
                                    jwtRefreshTokenExpirationDays: backendProps.jwtRefreshTokenExpirationDays
                                };
                                this.props = this.envPropsAdapter.restToForm(mergedProps);
                                this.envPropsSubject.next(this.props);
                            },
                            error: (err) => {
                                console.error('[AppConfig] Failed to load JWT config from backend', err);
                                // Use runtime config as fallback (will cause timer to not work)
                                this.props = this.envPropsAdapter.restToForm(runtimeProps);
                                this.envPropsSubject.next(this.props);
                            }
                        });
                    } else {
                        // JWT timeout exists (Azure scenario - already merged)
                        this.props = this.envPropsAdapter.restToForm(runtimeProps);
                        this.envPropsSubject.next(this.props);
                    }
                }),
                catchError(this.errorHandler)
            );
    }

    /**
     * Construct backend API URL for config endpoint
     * Uses apiBaseUrl from runtime config, or defaults to localhost:8080
     */
    private getBackendApiUrl(apiBaseUrl: string | undefined | null): string {
        const backendBase = apiBaseUrl || 'http://localhost:8080';
        return `${backendBase}/${URL_CONFIG_ENV_PROPS}`;
    }

    //TODO: this getter should be removed, use envPropObs instead of this getter.
    public get envProperties(): EnvironmentProps {
        return this.props;
    }

    errorHandler(error: ErrorResponse) {
        return throwError(error.message || 'Server Error');
    }

}
