import { inject, Injectable, Injector } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap, mergeMap } from 'rxjs/operators';
import { AuthenticationService } from '@app/global-services';
import { SessionTimerService } from '@app/global-services/session-timer.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private injector = inject(Injector);
    private isRefreshing = false;
    private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

    // Lazy-loaded services to avoid circular dependency
    private _authService?: AuthenticationService;
    private _sessionTimerService?: SessionTimerService;

    private get authService(): AuthenticationService {
        if (!this._authService) {
            this._authService = this.injector.get(AuthenticationService);
        }
        return this._authService;
    }

    private get sessionTimerService(): SessionTimerService {
        if (!this._sessionTimerService) {
            this._sessionTimerService = this.injector.get(SessionTimerService);
        }
        return this._sessionTimerService;
    }

    // Sliding expiration: Refresh token on every API request when less than this percentage of lifetime remains
    // This mimics HTTP session behavior where every request extends the session
    private readonly SLIDING_EXPIRATION_THRESHOLD_PERCENT = 50; // Refresh when < 50% time remaining (2 min for 4 min token)

    constructor() {
        console.log('[AuthInterceptor] ✅ AuthInterceptor constructor called - interceptor is LOADED');
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // FIRST LINE DEBUG - This should ALWAYS log for ANY HTTP request
        console.log('[AuthInterceptor] ========== INTERCEPTED REQUEST ==========', request.url);
        
        // Clone request to include credentials (cookies)
        const authReq = request.clone({
            withCredentials: true
        });

        // Skip sliding expiration for auth endpoints
        if (request.url.includes('/auth/')) {
            return next.handle(authReq).pipe(
                catchError((error: HttpErrorResponse) => {
                    if (error.status === 401) {
                        return this.handle401Error(authReq, next);
                    }
                    return throwError(() => error);
                })
            );
        }

        // Implement sliding expiration (like HTTP sessions)
        // Refresh token on every API request when user is active and token is past threshold
        const sessionState = this.sessionTimerService.getCurrentState();
        const jwtLifetimeMinutes = this.sessionTimerService.getTokenLifetimeMinutes();
        
        // Debug logging
        console.log('[AuthInterceptor] Request to:', request.url);
        console.log('[AuthInterceptor] Session state:', {
            tokenExpiresAt: sessionState.tokenExpiresAt,
            remainingSeconds: sessionState.remainingSeconds,
            jwtLifetimeMinutes: jwtLifetimeMinutes,
            isRefreshing: this.isRefreshing
        });
        
        if (sessionState.tokenExpiresAt !== null && jwtLifetimeMinutes !== null) {
            const totalLifetimeSeconds = jwtLifetimeMinutes * 60;
            const thresholdSeconds = totalLifetimeSeconds * (this.SLIDING_EXPIRATION_THRESHOLD_PERCENT / 100);
            
            console.log('[AuthInterceptor] Threshold check:', {
                totalLifetimeSeconds,
                thresholdSeconds,
                remainingSeconds: sessionState.remainingSeconds,
                shouldRefresh: sessionState.remainingSeconds <= thresholdSeconds
            });
            
            const shouldSlidingRefresh = 
                sessionState.remainingSeconds > 0 &&
                sessionState.remainingSeconds <= thresholdSeconds &&
                !this.isRefreshing;

            if (shouldSlidingRefresh) {
                const percentRemaining = (sessionState.remainingSeconds / totalLifetimeSeconds * 100).toFixed(0);
                console.log(`[AuthInterceptor] Sliding expiration refresh triggered (${sessionState.remainingSeconds}s = ${percentRemaining}% remaining)`);
                return this.slidingExpirationRefresh(authReq, next);
            }
        }

        // Normal request flow with 401 handling
        return next.handle(authReq).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    return this.handle401Error(authReq, next);
                }
                return throwError(() => error);
            })
        );
    }

    /**
     * Sliding expiration refresh: Extend session on every API request (like HTTP sessions)
     * This ensures users stay logged in as long as they're actively using the application
     */
    private slidingExpirationRefresh(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            return this.authService.refreshToken().pipe(
                mergeMap((response: any) => {
                    this.isRefreshing = false;

                    if (response && response.requiresReauth) {
                        this.refreshTokenSubject.next(null);
                        return throwError(() => new HttpErrorResponse({ status: 401 }));
                    }

                    this.refreshTokenSubject.next(response);
                    console.log('[AuthInterceptor] Sliding expiration refresh successful - session extended');
                    
                    // Reset the session timer to extend the session (like HTTP sessions do)
                    this.sessionTimerService.resetTimer();

                    // Proceed with original request
                    return next.handle(request.clone({ withCredentials: true }));
                }),
                catchError((err) => {
                    this.isRefreshing = false;
                    console.error('[AuthInterceptor] Sliding expiration refresh failed:', err);
                    // If sliding refresh fails, still try the original request
                    // It might succeed or trigger 401 handling
                    return next.handle(request.clone({ withCredentials: true })).pipe(
                        catchError((error: HttpErrorResponse) => {
                            if (error.status === 401) {
                                return this.handle401Error(request, next);
                            }
                            return throwError(() => error);
                        })
                    );
                })
            );
        } else {
            // Another request is already refreshing, wait for it
            return this.refreshTokenSubject.pipe(
                filter(result => result !== null),
                take(1),
                mergeMap(() => next.handle(request.clone({ withCredentials: true })))
            );
        }
    }

    /**
     * Handle 401 errors by attempting token refresh
     */
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
                    console.log('[AuthInterceptor] Reactive refresh successful (after 401)');
                    
                    // Reset the session timer to extend the session
                    this.sessionTimerService.resetTimer();
                    
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
