import { Injectable, inject, Injector } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SessionTimeoutDialogComponent } from '@app/shared/components/session-timeout-dialog/session-timeout-dialog.component';
import { AppConfigService } from './app-config.service';

export interface SessionTimerState {
  tokenExpiresAt: number | null;
  remainingSeconds: number;
  isExpiringSoon: boolean; // Less than 1 minute remaining
  isExpired: boolean;
}

@Injectable({ providedIn: 'root' })
export class SessionTimerService {
  private injector = inject(Injector);
  
  // Lazy-loaded services to avoid circular dependency
  private _dialog?: MatDialog;
  private _appConfigService?: AppConfigService;

  private get dialog(): MatDialog {
    if (!this._dialog) {
      this._dialog = this.injector.get(MatDialog);
    }
    return this._dialog;
  }

  private get appConfigService(): AppConfigService {
    if (!this._appConfigService) {
      this._appConfigService = this.injector.get(AppConfigService);
    }
    return this._appConfigService;
  }

  // JWT Token Expiration (loaded dynamically from backend configuration)
  // No default value - must be fetched from backend at /api/config/environmentProperties
  private tokenLifetimeMinutes: number | null = null;
  private readonly WARNING_THRESHOLD_SECONDS = 60; // Show warning 1 minute before expiry
  
  // Session state
  private sessionStateSubject = new BehaviorSubject<SessionTimerState>({
    tokenExpiresAt: null,
    remainingSeconds: 0,
    isExpiringSoon: false,
    isExpired: false
  });
  
  public sessionState$: Observable<SessionTimerState> = this.sessionStateSubject.asObservable();
  
  private timerSubscription: Subscription | null = null;
  private dialogRef: MatDialogRef<SessionTimeoutDialogComponent> | null = null;
  private lastActivityTime: number = Date.now();
  private activityCheckInterval: any = null;

  constructor() {
    this.setupActivityTracking();
    this.loadJwtConfiguration();
  }

  /**
   * Load JWT timeout configuration from AppConfigService
   */
  private loadJwtConfiguration(): void {
    // Subscribe to config updates
    this.appConfigService.envPropObs.subscribe(props => {
      if (props?.jwtAccessTokenExpirationMinutes) {
        this.tokenLifetimeMinutes = props.jwtAccessTokenExpirationMinutes;
        console.log(`[SessionTimer] JWT timeout configured: ${this.tokenLifetimeMinutes} minutes`);
      }
    });

    // Also check if config is already loaded
    const currentProps = this.appConfigService.envProperties;
    if (currentProps?.jwtAccessTokenExpirationMinutes) {
      this.tokenLifetimeMinutes = currentProps.jwtAccessTokenExpirationMinutes;
      console.log(`[SessionTimer] JWT timeout loaded from existing config: ${this.tokenLifetimeMinutes} minutes`);
    }
  }

  /**
   * Initialize session timer when user logs in
   */
  startSession(): void {
    this.lastActivityTime = Date.now();
    this.resetTimer();
  }
  
  /**
   * Check if session timer is currently active
   */
  isTimerActive(): boolean {
    return this.sessionStateSubject.value.tokenExpiresAt !== null;
  }

  /**
   * Reset the session timer (called after successful token refresh)
   */
  resetTimer(): void {
    // Don't start timer if JWT timeout hasn't been loaded from backend yet
    if (this.tokenLifetimeMinutes === null) {
      console.warn('[SessionTimer] Cannot start timer - JWT timeout not yet loaded from backend');
      return;
    }

    const now = Date.now();
    const expiresAt = now + (this.tokenLifetimeMinutes * 60 * 1000);
    
    this.sessionStateSubject.next({
      tokenExpiresAt: expiresAt,
      remainingSeconds: this.tokenLifetimeMinutes * 60,
      isExpiringSoon: false,
      isExpired: false
    });

    // Restart the countdown
    this.startCountdown();
  }

  /**
   * Stop the session timer (called on logout)
   */
  stopSession(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
    
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
      this.activityCheckInterval = null;
    }

    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
    }

    this.sessionStateSubject.next({
      tokenExpiresAt: null,
      remainingSeconds: 0,
      isExpiringSoon: false,
      isExpired: false
    });
  }

  /**
   * Start countdown timer that updates every second
   */
  private startCountdown(): void {
    // Clear existing timer if any
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    // Update every second
    this.timerSubscription = interval(1000).subscribe(() => {
      const state = this.sessionStateSubject.value;
      
      if (!state.tokenExpiresAt) {
        return;
      }

      const now = Date.now();
      const remainingMs = state.tokenExpiresAt - now;
      const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

      const isExpiringSoon = remainingSeconds <= this.WARNING_THRESHOLD_SECONDS && remainingSeconds > 0;
      const isExpired = remainingSeconds === 0;

      // Update state
      this.sessionStateSubject.next({
        tokenExpiresAt: state.tokenExpiresAt,
        remainingSeconds,
        isExpiringSoon,
        isExpired
      });

      // Show warning dialog when 1 minute remaining
      if (isExpiringSoon && !this.dialogRef) {
        this.showTimeoutWarningDialog();
      }

      // Handle expiry
      if (isExpired) {
        this.handleSessionExpiry();
      }
    });
  }

  /**
   * Show session timeout warning dialog
   */
  private showTimeoutWarningDialog(): void {
    if (this.dialogRef) {
      return; // Dialog already open
    }

    this.dialogRef = this.dialog.open(SessionTimeoutDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        countdownSeconds: this.WARNING_THRESHOLD_SECONDS
      }
    });

    this.dialogRef.afterClosed().subscribe(async (result: boolean | string) => {
      this.dialogRef = null;
      
      if (result === true) {
        // User chose to extend session
        this.extendSession();
      } else if (result === 'logout') {
        // User chose to logout
        console.log('User clicked logout in timeout dialog');
        const { AuthenticationService } = await import('./authentication.service');
        const authService = this.injector.get(AuthenticationService);
        await authService.logout();
      } else {
        // User declined or dialog timed out - let it expire naturally
        console.log('User declined to extend session');
      }
    });
  }

  /**
   * Extend session by refreshing the JWT token
   */
  async extendSession(): Promise<void> {
    try {
      // Lazy inject AuthenticationService to avoid circular dependency
      const { AuthenticationService } = await import('./authentication.service');
      const authService = this.injector.get(AuthenticationService);
      
      // Call backend to refresh token
      await authService.refreshToken().toPromise();
      
      // Reset the timer
      this.resetTimer();
      
      console.log('Session extended successfully');
    } catch (error: any) {
      console.error('Failed to extend session:', error);
      
      // Only logout on authentication errors (401)
      // For other errors (network, server error), just log and keep session active
      if (error?.status === 401 || error?.error?.requiresReauth) {
        console.log('Authentication failed - redirecting to login');
        this.handleSessionExpiry();
      } else {
        // For transient errors, just log - don't logout
        console.warn('Token refresh failed but session still active. User can try again.');
        // Optionally show a notification to the user
      }
    }
  }

  /**
   * Handle session expiry - logout and redirect
   */
  private async handleSessionExpiry(): Promise<void> {
    this.stopSession();
    
    // Close dialog if open
    if (this.dialogRef) {
      this.dialogRef.close(false);
    }

    // Lazy inject AuthenticationService to avoid circular dependency
    const { AuthenticationService } = await import('./authentication.service');
    const authService = this.injector.get(AuthenticationService);
    
    // Logout user
    authService.logout();
  }

  /**
   * Get formatted time remaining (MM:SS)
   */
  getFormattedTimeRemaining(): string {
    const state = this.sessionStateSubject.value;
    const seconds = state.remainingSeconds;
    
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Setup activity tracking for inactivity timeout
   * User is considered inactive if no mouse/keyboard events for 15 minutes
   */
  private setupActivityTracking(): void {
    // Track user activity events
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    activityEvents.forEach(eventName => {
      document.addEventListener(eventName, () => {
        this.lastActivityTime = Date.now();
      }, true);
    });

    // Check for inactivity every 30 seconds
    this.activityCheckInterval = setInterval(() => {
      // Skip check if JWT timeout not loaded yet
      if (this.tokenLifetimeMinutes === null) {
        return;
      }

      const now = Date.now();
      const inactiveTime = now - this.lastActivityTime;
      const inactiveMinutes = inactiveTime / (60 * 1000);
      
      // If user has been inactive for tokenLifetimeMinutes, show warning
      // This aligns with the JWT expiry time
      if (inactiveMinutes >= this.tokenLifetimeMinutes && !this.dialogRef) {
        const state = this.sessionStateSubject.value;
        if (state.tokenExpiresAt && state.remainingSeconds <= this.WARNING_THRESHOLD_SECONDS) {
          this.showTimeoutWarningDialog();
        }
      }
    }, 30 * 1000); // Check every 30 seconds
  }

  /**
   * Get current session state
   */
  getCurrentState(): SessionTimerState {
    return this.sessionStateSubject.value;
  }

  /**
   * Get the configured JWT token lifetime in minutes
   */
  getTokenLifetimeMinutes(): number | null {
    return this.tokenLifetimeMinutes;
  }
}
