import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from '@app/global-services';
import { PATH_LOGIN } from '@app/shared/model';

export const authGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const authService = inject(AuthenticationService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    // Not authenticated, redirect to login with return URL
    router.navigate(['/' + PATH_LOGIN], { 
        queryParams: { returnUrl: state.url } 
    });
    return false;
};

export const adminGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const authService = inject(AuthenticationService);
    const router = inject(Router);

    if (authService.isAuthenticated() && authService.isAdmin()) {
        return true;
    }

    if (!authService.isAuthenticated()) {
        // Not authenticated, redirect to login
        router.navigate(['/' + PATH_LOGIN], { 
            queryParams: { returnUrl: state.url } 
        });
    } else {
        // Authenticated but not admin
        router.navigate(['/unauthorized']);
    }
    
    return false;
};
