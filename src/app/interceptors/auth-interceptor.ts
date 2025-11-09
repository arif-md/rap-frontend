import { inject, Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthenticationService } from '@app/global-services';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private authService = inject(AuthenticationService);
    private isRefreshing = false;
    private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Clone request to include credentials (cookies)
        const authReq = request.clone({
            withCredentials: true
        });

        return next.handle(authReq).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    return this.handle401Error(authReq, next);
                }
                return throwError(() => error);
            })
        );
    }

    private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Don't try to refresh token for auth endpoints
        if (request.url.includes('/auth/')) {
            return throwError(() => new HttpErrorResponse({ status: 401 }));
        }

        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            return this.authService.refreshToken().pipe(
                switchMap((response: any) => {
                    this.isRefreshing = false;
                    
                    // Check if backend requires re-authentication
                    if (response && response.requiresReauth) {
                        this.refreshTokenSubject.next(null);
                        // Redirect to login handled by authService.refreshToken()
                        return throwError(() => new HttpErrorResponse({ status: 401 }));
                    }
                    
                    this.refreshTokenSubject.next(response);
                    
                    // Retry original request
                    return next.handle(request.clone({ withCredentials: true }));
                }),
                catchError((err) => {
                    this.isRefreshing = false;
                    return throwError(() => err);
                })
            );
        } else {
            // Wait for token refresh to complete
            return this.refreshTokenSubject.pipe(
                filter(result => result !== null),
                take(1),
                switchMap(() => {
                    return next.handle(request.clone({ withCredentials: true }));
                })
            );
        }
    }
}
