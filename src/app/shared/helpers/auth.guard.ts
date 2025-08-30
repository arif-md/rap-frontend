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
    // See if the user is authenticated through SSO on server side.
    return this.authenticationService.getAuthToken(0, 0, true).pipe(
            map(res => {
                if (res) {
                    this.router.navigate([PATH_DASHBOARD]);
                    return true;
                } else {
                    this.router.navigate([PATH_LOGIN], {queryParams: {returnUrl: state.url}});
                    return false;
                }
            }),
            catchError(err => {
                console.error(err);
                return of(false);
            }));
    }
}
