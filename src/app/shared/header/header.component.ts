import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from '@app/shared/model/admin';
import { ApplicationService, AppConfigService } from '@app/global-services';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { MODULE_PAL, MODULE_REC, MODULE_SCI, PATH_LOGIN } from '@app/shared/model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss', '../../app.scss'],
  standalone: true,
    imports: [
        NgClass,
        RouterLink,
        RouterLinkActive,
    NgbCollapseModule
    ]
})
export class HeaderComponent implements OnInit, OnDestroy {
    private applicationService = inject(ApplicationService);
    private appConfigService = inject(AppConfigService);
    currentUser: User | null;
    dirty: boolean;
    moduleSubscription!: Subscription;
    module!: string;
    module_rec!: string;
    module_pal!: string;
    module_sci!: string;
    module_generic!: string;
    envName: string;
    appVersion: string;
    path_login: string = PATH_LOGIN;
    navbarCollapsed: boolean = true;

    constructor() {
        this.dirty = false;
        // Will be hydrated from AppConfigService (runtime-config.json); fallback to 'Local'
        this.envName = 'Local';
        this.appVersion = '0.0.1-SNAPSHOT';
        this.currentUser = null;
    }

    ngOnInit() {
        this.module_pal = MODULE_PAL;
        this.module_sci = MODULE_SCI;
        this.module_rec = MODULE_REC;
    this.moduleSubscription = this.applicationService.currentModule.subscribe((module: string) => this.module = module);
        // Load runtime config and set envName
        this.appConfigService.loadEnvProperties().subscribe((props: any) => {
            if (props?.appEnvName) {
                this.envName = props.appEnvName;
            }
            if (props?.buildVersion) {
                this.appVersion = props.buildVersion;
            }
        });
    }

    ngOnDestroy() {
        // unsubscribe to ensure no memory leaks.
        //this.currentUserSubscription.unsubscribe();
        //this.envPropsSubscription.unsubscribe();
        this.moduleSubscription.unsubscribe();
    }

}
