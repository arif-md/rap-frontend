import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppConfigService, AuthenticationService } from '@app/global-services';
import { Subscription } from 'rxjs';

@Component({
    selector   : 'app-login',
    templateUrl: './login.component.html',
    styleUrls  : ['./login.component.scss', '../../app.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private authService = inject(AuthenticationService);
    private appConfigService = inject(AppConfigService);

    envProperties: Subscription;
    returnUrl: string;
    sessionExpired: boolean = false;
    isLoading: boolean = false;
    loadingProvider: 'oidc' | 'sso' | 'internal' | '' = '';
    errorMessage: string = '';
    enableKeycloakInternal: boolean = false;

    ngOnInit() {
        // Get return URL from route parameters or default to home
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.sessionExpired = this.route.snapshot.queryParams['sessionExpired'] === 'true';
        
        // Check feature flag for Keycloak Internal login
        this.enableKeycloakInternal = this.appConfigService.envProperties?.enableKeycloakInternal || false;
        
        // Check if user is already authenticated
        if (this.authService.isAuthenticated()) {
            this.router.navigate([this.returnUrl]);
        }
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

    /**
     * Initiate Keycloak internal user login (offline local development)
     */
    async internalLogin(): Promise<void> {
        this.isLoading = true;
        this.loadingProvider = 'internal';
        this.errorMessage = '';
        
        try {
            await this.authService.clearUserDetails();
            await this.authService.redirectToInternalLogin();
        } catch (error: any) {
            this.errorMessage = error.message || 'Failed to initiate internal login. Please try again.';
            this.isLoading = false;
            this.loadingProvider = '';
        }
    }

    ngOnDestroy() {
        // Unsubscribe to ensure no memory leaks
        if (this.envProperties) {
            this.envProperties.unsubscribe();
        }
    }
}
