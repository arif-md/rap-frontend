import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '@app/global-services';

@Component({
    selector: 'app-auth-callback',
    template: `
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-6 text-center">
                    @if (isProcessing) {
                        <div class="spinner-border text-primary mb-3" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <h4>Processing authentication...</h4>
                        <p class="text-muted">Please wait while we complete your login.</p>
                    }
                    
                    @if (errorMessage) {
                        <div class="alert alert-danger" role="alert">
                            <i class="bi bi-x-circle-fill me-2"></i>
                            <strong>Authentication Failed</strong>
                            <p class="mb-0 mt-2">{{ errorMessage }}</p>
                        </div>
                        <button 
                            mat-raised-button 
                            color="primary" 
                            (click)="returnToLogin()"
                            class="mt-3">
                            Return to Login
                        </button>
                    }
                </div>
            </div>
        </div>
    `,
    styles: [`
        .spinner-border {
            width: 3rem;
            height: 3rem;
        }
    `]
})
export class AuthCallbackComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private authService = inject(AuthenticationService);

    isProcessing = true;
    errorMessage = '';

    ngOnInit(): void {
        // The backend handles the OIDC callback and sets cookies
        // We just need to fetch the current user and redirect
        this.processCallback();
    }

    private async processCallback(): Promise<void> {
        try {
            // Wait a moment for cookies to be set
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Fetch current user details
            this.authService.getCurrentUser().subscribe({
                next: (user) => {
                    if (user) {
                        // Get return URL or default to dashboard
                        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
                        this.router.navigate([returnUrl]);
                    } else {
                        this.showError('Failed to retrieve user information.');
                    }
                },
                error: (error) => {
                    console.error('Auth callback error:', error);
                    this.showError(error.message || 'Authentication failed. Please try again.');
                }
            });
        } catch (error: any) {
            console.error('Callback processing error:', error);
            this.showError(error.message || 'An unexpected error occurred.');
        }
    }

    private showError(message: string): void {
        this.isProcessing = false;
        this.errorMessage = message;
    }

    returnToLogin(): void {
        this.router.navigate(['/login']);
    }
}
