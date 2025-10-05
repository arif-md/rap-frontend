import { inject, Injectable } from '@angular/core';
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
    private http = inject(HttpClient);
    private locationStrategy = inject(LocationStrategy);
    private envPropsAdapter = inject(EnvironmentPropsAdapter);

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
        // Prefer runtime configuration served as a static JSON, fallback to API endpoint if not present
        const base = this.locationStrategy.getBaseHref();
        const runtimeUrl = `${base}assets/runtime-config.json`;
        const apiUrl = `${base}${URL_CONFIG_ENV_PROPS}`;

        return this.http.get<EnvironmentProps>(runtimeUrl, httpOptions)
            .pipe(
                catchError(() => this.http.get<EnvironmentProps>(apiUrl, httpOptions)),
                tap(recvdProps => {
                    this.props = this.envPropsAdapter.restToForm(recvdProps);
                    this.envPropsSubject.next(this.props);
                }),
                catchError(this.errorHandler)
            );
    }

    //TODO: this getter should be removed, use envPropObs instead of this getter.
    public get envProperties(): EnvironmentProps {
        return this.props;
    }

    errorHandler(error: ErrorResponse) {
        return throwError(error.message || 'Server Error');
    }

}
