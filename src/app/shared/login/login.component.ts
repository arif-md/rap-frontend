import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppConfigService, ApplicationService } from '@app/global-services';
import { ENV_DEV, ENV_LOCAL, ENV_TEST, ENV_TRAIN } from '@app/shared/model';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { SharedModule } from '@app/shared/shared.module';


@Component({
    selector   : 'app-login',
    templateUrl: './login.component.html',
    styleUrls  : ['./login.component.scss', '../../app.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private applicationService = inject(ApplicationService);
    private appConfigService = inject(AppConfigService);

    envProperties: Subscription
    envName: string;
    showInternalLogin: boolean;
    internalLoginUrl: string;
    extUserLoginUrl: string;
    returnUrl: string;
    // Use window directly in template or methods; no need to assign as a property.

    openUrl(url: string, target: string = '_self') {
        window.open(url, target);
    }

    ngOnInit() {
        this.envProperties = this.appConfigService.envPropObs.subscribe(props => {
            if (props && typeof props.appEnvName === 'string') {
                this.setInternalLoginDisplay(props.appEnvName);
            } else {
                this.setInternalLoginDisplay('');
            }
            this.buildLoginUrls();
        });

        this.applicationService.updateModule('');

        // get return url from route parameters otherwise redirect to dashboard
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    }
    private setInternalLoginDisplay(envName: string): void {
        // only show the internal login button in lower envs
        this.showInternalLogin = [ENV_LOCAL, ENV_DEV, ENV_TEST, ENV_TRAIN].includes(envName);
        this.envName = envName;
    }
    private buildLoginUrls(): void {
        switch (this.envName) {
            case ENV_LOCAL:
                // developers, change to your login
                this.internalLoginUrl = '/preauth?user=ArifMohammed@nexgeninc.com';
                this.extUserLoginUrl = '/preauth?user=amohammed.raptor@gmail.com';
                // this.extUserLoginUrl = '/oidc/authenticate';
                break;
            case ENV_DEV:
            case ENV_TEST:
            case ENV_TRAIN:
                this.internalLoginUrl = '/raptor/saml2/authenticate/adfs';
                this.extUserLoginUrl = '/raptor/login?remote=true';
                break;
            default:
                // prod env
                this.extUserLoginUrl = '/raptor/login';
                // don't build an internal url for prod
                this.internalLoginUrl = '';
                break;
        }
    }

    ngOnDestroy() {
        // unsubscribe to ensure no memory leaks.
        this.envProperties.unsubscribe();
    }

}
