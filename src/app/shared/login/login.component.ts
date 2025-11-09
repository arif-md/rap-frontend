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
    errorMessage: string = '';

    ngOnInit() {
        // Get return URL from route parameters or default to home
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.sessionExpired = this.route.snapshot.queryParams['sessionExpired'] === 'true';
        
        // Check if user is already authenticated
        if (this.authService.isAuthenticated()) {
            this.router.navigate([this.returnUrl]);
        }
    }

    /**
     * Initiate OIDC login flow
     */
    async login(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';
        
        try {
            await this.authService.redirectToLogin();
        } catch (error: any) {
            this.errorMessage = error.message || 'Failed to initiate login. Please try again.';
            this.isLoading = false;
        }
    }

    ngOnDestroy() {
        // Unsubscribe to ensure no memory leaks
        if (this.envProperties) {
            this.envProperties.unsubscribe();
        }
    }
}
