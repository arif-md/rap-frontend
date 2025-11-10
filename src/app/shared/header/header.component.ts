import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from '@app/shared/model/admin';
import { ApplicationService, AppConfigService, AuthenticationService } from '@app/global-services';
import { SessionTimerService } from '@app/global-services/session-timer.service';
import { NgClass, NgIf } from '@angular/common';
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
        NgIf,
        RouterLink,
        RouterLinkActive,
        NgbCollapseModule
    ]
})
export class HeaderComponent implements OnInit, OnDestroy {
    private applicationService = inject(ApplicationService);
    private appConfigService = inject(AppConfigService);
    private authService = inject(AuthenticationService);
    private sessionTimerService = inject(SessionTimerService);
    
    currentUser: User | null;
    currentUserSubscription!: Subscription;
    moduleSubscription!: Subscription;
    sessionTimerSubscription!: Subscription;
    module!: string;
    module_rec!: string;
    module_pal!: string;
    module_sci!: string;
    module_generic!: string;
    envName: string;
    appVersion: string;
    isDirtyBuild: boolean = false;
    path_login: string = PATH_LOGIN;
    navbarCollapsed: boolean = true;
    
    // Session timer state
    sessionTimeRemaining: string = '';
    isSessionExpiringSoon: boolean = false;

    constructor() {
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
        
        // Subscribe to current user
        this.currentUserSubscription = this.authService.currentUser.subscribe(
            user => this.currentUser = user
        );
        
        // Subscribe to session timer state
        this.sessionTimerSubscription = this.sessionTimerService.sessionState$.subscribe(state => {
            this.sessionTimeRemaining = this.sessionTimerService.getFormattedTimeRemaining();
            this.isSessionExpiringSoon = state.isExpiringSoon;
        });
        
        // Load runtime config and set envName
        this.appConfigService.loadEnvProperties().subscribe((props: any) => {
            if (props?.appEnvName) {
                this.envName = props.appEnvName;
            }
            if (props?.buildVersion) {
                this.appVersion = props.buildVersion;
            }
            // Update dirty status from build info
            this.isDirtyBuild = props?.isDirty || props?.dirty || this.appVersion.includes('-dirty');
        });
    }

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        this.sessionTimerService.stopSession();
        await this.authService.logout();
    }
    
    /**
     * Extend session by refreshing token
     */
    async extendSession(): Promise<void> {
        try {
            console.log('Extending session from header button click...');
            await this.sessionTimerService.extendSession();
            console.log('Session extended successfully from header');
        } catch (error) {
            console.error('Error extending session from header:', error);
            // Error is already handled in SessionTimerService
            // Only logout happens on 401 errors, other errors are non-fatal
        }
    }

    /**
     * Check if user is admin
     */
    get isAdmin(): boolean {
        return this.authService.isAdmin();
    }

    /**
     * Get user display name
     */
    get userDisplayName(): string {
        if (this.currentUser) {
            return this.currentUser.firstName && this.currentUser.lastName
                ? `${this.currentUser.firstName} ${this.currentUser.lastName}`
                : this.currentUser.email || 'User';
        }
        return '';
    }

    getEnvBadgeClass(): string {
        const env = this.envName.toLowerCase();
        if (env.includes('prod')) return 'env-prod';
        if (env.includes('staging') || env.includes('stage')) return 'env-staging';
        if (env.includes('dev')) return 'env-dev';
        if (env.includes('local')) return 'env-local';
        return 'env-unknown';
    }

    // Check if this is a dirty local build
    get isLocalDirtyBuild(): boolean {
        return this.isDirtyBuild;
    }

    get versionTooltip(): string {
        return `Version: ${this.appVersion}\nEnvironment: ${this.envName}${this.isLocalDirtyBuild ? '\n⚠️ Uncommitted changes' : ''}`;
    }

    ngOnDestroy() {
        // unsubscribe to ensure no memory leaks.
        if (this.currentUserSubscription) {
            this.currentUserSubscription.unsubscribe();
        }
        if (this.moduleSubscription) {
            this.moduleSubscription.unsubscribe();
        }
        if (this.sessionTimerSubscription) {
            this.sessionTimerSubscription.unsubscribe();
        }
    }

}
