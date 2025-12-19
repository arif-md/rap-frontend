import { Injectable, inject, Injector } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, firstValueFrom } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User, UserAdapter } from '@app/shared/model/admin';
import { PATH_LOGIN } from '@app/shared/model';
import { LocationStrategy } from '@angular/common';
import { Router } from '@angular/router';
import { AppConfigService } from './app-config.service';
import { SessionTimerService } from './session-timer.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  withCredentials: true // Important for cookies
};

interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  roles: string[];
  oidcSubject: string;
  isActive: boolean;
  isExternalUser: boolean;
  lastLoginAt: string;
  createdAt: string;
}

interface LoginResponse {
  authorizationUrl: string;
}

interface SessionCheckResponse {
  authenticated: boolean;
  requiresReauth: boolean;
  user?: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
    private injector = inject(Injector);
    
    // Lazy-loaded services to avoid circular dependency with HttpClient → Interceptors
    private _router?: Router;
    private _http?: HttpClient;
    private _locationStrategy?: LocationStrategy;
    private _adapter?: UserAdapter;
    private _appConfigService?: AppConfigService;
    private _sessionTimerService?: SessionTimerService;

    private get router(): Router {
        if (!this._router) {
            this._router = this.injector.get(Router);
        }
        return this._router;
    }

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

    private get adapter(): UserAdapter {
        if (!this._adapter) {
            this._adapter = this.injector.get(UserAdapter);
        }
        return this._adapter;
    }

    private get appConfigService(): AppConfigService {
        if (!this._appConfigService) {
            this._appConfigService = this.injector.get(AppConfigService);
        }
        return this._appConfigService;
    }

    private get sessionTimerService(): SessionTimerService {
        if (!this._sessionTimerService) {
            this._sessionTimerService = this.injector.get(SessionTimerService);
        }
        return this._sessionTimerService;
    }

    private currentUserSubject: BehaviorSubject<User | null>;
    public currentUser: Observable<User | null>;
    private sessionCheckInterval: any;

    constructor() {
        const storedUser = localStorage.getItem('currentUser');
        this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null);
        this.currentUser = this.currentUserSubject.asObservable();
        
        // Only check session if we have a stored user (avoid unnecessary 401 on login page)
        if (storedUser) {
            this.checkSession().subscribe({
                error: (err) => {
                    // Silently fail on initialization - user is just not authenticated
                    console.debug('Session check failed on initialization:', err);
                }
            });
        }
        
        // Set up periodic session check (every 5 minutes)
        this.setupSessionCheck();
    }

    public get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    public set currentUserValue(user: User | null) {
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(this.adapter.restToForm(user)));
        } else {
            localStorage.removeItem('currentUser');
        }
        this.currentUserSubject.next(user);
    }

    /**
     * Get OIDC login URL from backend
     */
    getLoginUrl(): Observable<LoginResponse> {
        const apiBaseUrl = this.appConfigService.envProperties?.apiBaseUrl || 'http://localhost:8080';
        const url = `${apiBaseUrl}/auth/login`;
        return this.http.get<LoginResponse>(url, httpOptions)
            .pipe(catchError(this.errorHandler));
    }

    /**
     * Redirect to OIDC provider for authentication
     */
    async redirectToLogin(): Promise<void> {
        try {
            const apiBaseUrl = this.appConfigService.envProperties?.apiBaseUrl || 'http://localhost:8080';
            const response = await firstValueFrom(
                this.http.get<{ authorizationUrl: string; message: string }>(`${apiBaseUrl}/auth/login`)
            );
            // Construct full URL - backend returns relative path
            const backendBaseUrl = apiBaseUrl;
            const authUrl = response.authorizationUrl.startsWith('http') 
                ? response.authorizationUrl 
                : backendBaseUrl + response.authorizationUrl;
            window.location.href = authUrl;
        } catch (error) {
            console.error('Failed to get login URL:', error);
            throw error;
        }
    }

    /**
     * Get current authenticated user from backend
     */
    getCurrentUser(): Observable<AuthUser> {
        const apiBaseUrl = this.appConfigService.envProperties?.apiBaseUrl || 'http://localhost:8080';
        const url = `${apiBaseUrl}/auth/user`;
        return this.http.get<AuthUser>(url, httpOptions)
            .pipe(
                tap(user => {
                    if (user) {
                        // Convert backend user to frontend User model
                        const frontendUser = this.convertToFrontendUser(user);
                        this.currentUserValue = frontendUser;
                        // Start session timer
                        this.sessionTimerService.startSession();
                    }
                }),
                catchError(this.errorHandler)
            );
    }

    /**
     * Check session status (proactive check)
     */
    checkSession(): Observable<SessionCheckResponse> {
        const apiBaseUrl = this.appConfigService.envProperties?.apiBaseUrl || 'http://localhost:8080';
        const url = `${apiBaseUrl}/auth/check`;
        return this.http.get<SessionCheckResponse>(url, httpOptions)
            .pipe(
                tap(response => {
                    if (response.requiresReauth) {
                        // Token expired, need to re-authenticate
                        this.handleSessionExpiry();
                    } else if (response.authenticated && response.user) {
                        const frontendUser = this.convertToFrontendUser(response.user);
                        this.currentUserValue = frontendUser;
                        // Ensure session timer is running
                        if (!this.sessionTimerService.isTimerActive()) {
                            this.sessionTimerService.startSession();
                        }
                    } else if (!response.authenticated) {
                        this.clearUserDetails();
                    }
                }),
                catchError(error => {
                    if (error.status === 401) {
                        this.clearUserDetails();
                    }
                    return throwError(() => error);
                })
            );
    }

    /**
     * Setup periodic session check
     */
    private setupSessionCheck(): void {
        // Check every 5 minutes
        this.sessionCheckInterval = setInterval(() => {
            this.checkSession().subscribe({
                error: (err) => console.warn('Session check failed:', err)
            });
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Handle session expiry - redirect to login
     */
    private handleSessionExpiry(): void {
        this.clearUserDetails();
        this.router.navigate(['/' + PATH_LOGIN], { 
            queryParams: { 
                returnUrl: this.router.url,
                sessionExpired: true 
            } 
        });
    }

    /**
     * Logout - revoke tokens, clear session, and end OIDC session
     */
    async logout(): Promise<void> {
        console.log('[AUTH] Logout initiated');
        const apiBaseUrl = this.appConfigService.envProperties?.apiBaseUrl || 'http://localhost:8080';
        const url = `${apiBaseUrl}/auth/logout`;
        console.log('[AUTH] Calling logout endpoint:', url);
        
        try {
            console.log('[AUTH] Making HTTP POST request to backend (cookies will be sent)...');
            const response = await firstValueFrom(
                this.http.post<{ success: boolean; message: string; oidcLogoutUrl?: string }>(url, {}, httpOptions)
            );
            console.log('[AUTH] Logout response received:', response);
            
            // Clear local session AFTER successful backend logout
            await this.clearUserDetails();
            
            // If OIDC logout URL is provided, redirect to OIDC provider to end session
            if (response && response.oidcLogoutUrl) {
                console.log('[AUTH] Redirecting to OIDC provider logout:', response.oidcLogoutUrl);
                window.location.href = response.oidcLogoutUrl;
            } else {
                console.log('[AUTH] No OIDC logout URL, navigating to login page');
                this.router.navigate(['/' + PATH_LOGIN]);
            }
        } catch (error) {
            console.error('[AUTH] Logout error:', error);
            // Even if logout API fails, clear local session
            await this.clearUserDetails();
            console.log('[AUTH] Navigating to login page after error');
            this.router.navigate(['/' + PATH_LOGIN]);
        }
    }

    /**
     * Clear user details from local storage and state
     */
    async clearUserDetails(): Promise<void> {
        console.log('[AUTH] Clearing user details');
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
        console.log('[AUTH] User cleared. isAuthenticated:', this.isAuthenticated());
        // Stop session timer
        this.sessionTimerService.stopSession();
    }

    /**
     * Convert backend AuthUser to frontend User model
     */
    private convertToFrontendUser(authUser: AuthUser): User {
        return {
            id: authUser.id,
            email: authUser.email,
            fullName: authUser.fullName,
            firstName: authUser.fullName.split(' ')[0] || '',
            lastName: authUser.fullName.split(' ').slice(1).join(' ') || '',
            phone: '', // Not provided by OIDC
            roles: authUser.roles,
            rapAdmin: authUser.roles?.includes('ADMIN') || false,
            isActive: authUser.isActive,
            isExternalUser: authUser.isExternalUser, // Set from backend based on role
            lastLoginAt: authUser.lastLoginAt,
            createdAt: authUser.createdAt
        } as User;
    }

    /**
     * Check if user has specific role
     */
    hasRole(role: string): boolean {
        const user = this.currentUserValue;
        return user?.roles?.includes(role) ?? false;
    }

    /**
     * Check if user is admin
     */
    isAdmin(): boolean {
        return this.hasRole('ADMIN');
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.currentUserValue !== null;
    }

    /**
     * Refresh access token (handled by backend via refresh token cookie)
     */
    refreshToken(): Observable<any> {
        const apiBaseUrl = this.appConfigService.envProperties?.apiBaseUrl || 'http://localhost:8080';
        const url = `${apiBaseUrl}/auth/refresh`;
        return this.http.post<any>(url, {}, httpOptions)
            .pipe(
                tap(response => {
                    if (response.requiresReauth) {
                        // Backend requires OIDC re-authentication
                        this.handleSessionExpiry();
                    }
                }),
                catchError(error => {
                    if (error.status === 401) {
                        this.handleSessionExpiry();
                    }
                    return throwError(() => error);
                })
            );
    }

    /**
     * Error handler
     */
    private errorHandler(error: any): Observable<never> {
        const errorMessage = error.error?.message || error.message || 'Server Error';
        return throwError(() => errorMessage);
    }

    /**
     * Cleanup on service destroy
     */
    ngOnDestroy(): void {
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
        }
    }

    verifyUserDetails(): void {
        const user = this.currentUserValue;
        if (user && user.isExternalUser && (!user.firstName || !user.lastName || !user.phone)) {
            this.router.navigate(['/manage-account']);
        }
    }
}
