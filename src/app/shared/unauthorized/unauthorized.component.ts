import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '@app/global-services';
import { PATH_DASHBOARD } from '@app/shared/model';

@Component({
    selector: 'app-unauthorized',
    standalone: true,
    template: `
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-8 text-center">
                    <div class="card shadow-sm">
                        <div class="card-body p-5">
                            <i class="bi bi-shield-lock text-danger" style="font-size: 4rem;"></i>
                            <h2 class="mt-3">Access Denied</h2>
                            <p class="text-muted mt-2">
                                You do not have the required role to access this page.
                            </p>
                            <button class="btn btn-primary mt-3" (click)="goToDashboard()">
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class UnauthorizedComponent {
    constructor(
        private router: Router,
        private authService: AuthenticationService
    ) {}

    goToDashboard(): void {
        this.router.navigate(['/' + PATH_DASHBOARD]);
    }
}
