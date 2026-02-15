import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from '@app/global-services';
import { PATH_LOGIN, UNAUTHORIZED } from '@app/shared/model';

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
        router.navigate(['/' + UNAUTHORIZED]);
    }
    
    return false;
};

/**
 * Guard that only allows users with EXTERNAL_USER role.
 * Internal users attempting to access external-only routes are redirected to unauthorized.
 */
export const externalGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const authService = inject(AuthenticationService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        router.navigate(['/' + PATH_LOGIN], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }

    if (authService.isExternalUser()) {
        return true;
    }

    // Authenticated but not an external user
    router.navigate(['/' + UNAUTHORIZED]);
    return false;
};

/**
 * Guard that only allows users with INTERNAL_USER role.
 * External users attempting to access internal-only routes are redirected to unauthorized.
 */
export const internalGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const authService = inject(AuthenticationService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        router.navigate(['/' + PATH_LOGIN], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }

    if (authService.isInternalUser()) {
        return true;
    }

    // Authenticated but not an internal user
    router.navigate(['/' + UNAUTHORIZED]);
    return false;
};
