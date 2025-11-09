import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthenticationService } from '@app/global-services';
import { PATH_DASHBOARD, PATH_LOGIN } from '@app/shared/model';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';


@Injectable({providedIn: 'root'})
export class AuthGuard  {
    private router = inject(Router);
    private authenticationService = inject(AuthenticationService);


    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | boolean {
        // First see if the user is already authenticated, if so return true.
        const currentUser = this.authenticationService.currentUserValue;
        if (currentUser) {
            // authorised so return true
            return true;
        }
        
        // Check if user is authenticated on the backend (OIDC session)
        return this.authenticationService.checkSession().pipe(
            map(response => {
                if (response.authenticated && response.user) {
                    // User is authenticated via OIDC
                    return true;
                } else {
                    // Not authenticated, redirect to login
                    this.router.navigate([PATH_LOGIN], {queryParams: {returnUrl: state.url}});
                    return false;
                }
            }),
            catchError(err => {
                console.error('Auth check failed:', err);
                this.router.navigate([PATH_LOGIN], {queryParams: {returnUrl: state.url}});
                return of(false);
            })
        );
    }
}
