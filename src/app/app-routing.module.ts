import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LandingComponent } from '@app/shared/landing/landing.component';
import { LoginComponent } from '@app/shared/login/login.component';
import { AuthCallbackComponent } from '@app/shared/auth-callback/auth-callback.component';
import { Dashboard } from '@app/shared/dashboard/dashboard';
import { ApplicationFormComponent } from '@app/features/application-form/application-form.component';

import {
    LANDING_TITLE,
    LOGIN_TITLE,
    PATH_ADMIN_APP,
    PATH_ADMIN_CONSOLE,
    PATH_DASHBOARD,
    PATH_DEFAULT,
    PATH_HELP,
    PATH_HOME,
    PATH_HOME_GENSC,
    PATH_HOME_PAL,
    PATH_HOME_SRP,
    PATH_LANDING,
    PATH_LOGIN,
    PATH_LOGIN_FAILURE,
    PATH_LOGOUT_SUCCESS,
    PATH_MANAGE_ACC,
    PATH_PAL,
    PATH_REC,
    PATH_SCI,
    PATH_UNSPECIFIED,
    UNAUTHORIZED,
    UNAUTHORIZED_TITLE
} from '@app/shared/model';

import { DefaultPathGuard } from '@app/shared/helpers';
import { authGuard } from '@app/shared/guards/auth.guard';

export const routes: Routes = [

  { path: PATH_LANDING, title: LANDING_TITLE, component: LandingComponent, canActivate: [DefaultPathGuard] },
  { path: PATH_HOME, title: LANDING_TITLE, component: LandingComponent, canActivate: [DefaultPathGuard] },
  { path: PATH_LOGIN, title: LOGIN_TITLE, component: LoginComponent, canActivate: [DefaultPathGuard] },
  { path: 'auth-callback', title: 'Authenticating...', component: AuthCallbackComponent },
  //{ path: PATH_LOGOUT_SUCCESS, title: LOGOUT_TITLE, component: LogoutSuccessComponent },
  //{ path: PATH_LOGIN_FAILURE, title: LOGIN_FAILURE_TITLE, component: LoginFailureComponent },
  //{ path: UNAUTHORIZED, title: UNAUTHORIZED_TITLE, component: UnauthorizedComponent },

  // Protected routes
  { path: PATH_DASHBOARD, title: 'Dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'application-form', title: 'Application Form', component: ApplicationFormComponent, canActivate: [authGuard] },

  { path: PATH_DEFAULT, redirectTo: PATH_LANDING, pathMatch: 'full' },
  //{ path: PATH_UNSPECIFIED, component: PageNotFoundComponent }

];

@NgModule({
  imports: [RouterModule.forRoot(routes,{preloadingStrategy: PreloadAllModules})],
  exports: [RouterModule]
})
export class AppRoutingModule {}
