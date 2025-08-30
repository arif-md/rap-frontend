import { inject, Injectable } from '@angular/core';
import { Router, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateFn } from '@angular/router';
import { AuthenticationService } from '@app/global-services';

@Injectable({ providedIn: 'root' })
class DefaultPathGuardService  {
    private router = inject(Router);


  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    let currentPath = route.url;
    let defaultPath = route.queryParams['defaultPath'];
    if (defaultPath && defaultPath != currentPath) {
      this.router.navigate([defaultPath]);
      return false;
    } else {
      return true;
    }

  }
}

export const DefaultPathGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
    return inject(DefaultPathGuardService).canActivate(next, state);
}
