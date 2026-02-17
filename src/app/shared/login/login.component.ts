import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '@app/global-services';

@Component({
    selector   : 'app-login',
    templateUrl: './login.component.html',
    styleUrls  : ['./login.component.scss', '../../app.scss']
})
export class LoginComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private authService = inject(AuthenticationService);

    returnUrl: string;
    sessionExpired: boolean = false;
    isLoading: boolean = false;
    loadingProvider: 'oidc' | 'sso' | '' = '';
    errorMessage: string = '';

    ngOnInit() {
        // Get return URL from route parameters or default to home
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.sessionExpired = this.route.snapshot.queryParams['sessionExpired'] === 'true';

        // Check for OAuth2 login failure redirected from backend
        const authError = this.route.snapshot.queryParams['error'];
        if (authError) {
            this.errorMessage = this.mapAuthError(authError);
        }
        
        // Check if user is already authenticated
        if (this.authService.isAuthenticated()) {
            this.router.navigate([this.returnUrl]);
        }
    }

    /**
     * Map backend error codes to user-friendly messages.
     */
    private mapAuthError(code: string): string {
        const messages: Record<string, string> = {
            'unauthorized_email':  'Your email address is not authorized for internal login. Only @nexgeninc.com accounts are allowed.',
            'user_not_found':      'Your account has not been provisioned. Please contact your administrator to request access.',
            'user_deactivated':    'Your account has been deactivated. Please contact your administrator.',
            'invalid_token':       'Authentication failed due to an invalid token. Please try again.',
            'server_error':        'An unexpected error occurred during authentication. Please try again later.',
        };
        return messages[code] || `Authentication failed (${code}). Please try again or contact your administrator.`;
    }

    /**
     * Initiate OIDC login flow (external users)
     */
    async login(): Promise<void> {
        this.isLoading = true;
        this.loadingProvider = 'oidc';
        this.errorMessage = '';
        
        try {
            await this.authService.redirectToLogin();
        } catch (error: any) {
            this.errorMessage = error.message || 'Failed to initiate login. Please try again.';
            this.isLoading = false;
            this.loadingProvider = '';
        }
    }

    /**
     * Initiate Azure Entra ID SSO login flow (internal users)
     */
    async ssoLogin(): Promise<void> {
        this.isLoading = true;
        this.loadingProvider = 'sso';
        this.errorMessage = '';
        
        try {
            // Clear any existing session before SSO login
            await this.authService.clearUserDetails();
            await this.authService.redirectToSsoLogin();
        } catch (error: any) {
            this.errorMessage = error.message || 'Failed to initiate SSO login. Please try again.';
            this.isLoading = false;
            this.loadingProvider = '';
        }
    }
}
