import { inject, Injectable, Injector } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthenticationService } from '@app/global-services';
import { MatDialog } from '@angular/material/dialog';
import { DialogConfirmComponent } from '@app/shared/dialog-confirm/dialog-confirm.component';

const CONFIRM_ERROR_ICON = 'error'; // Adjust based on your actual icon constants

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    private injector = inject(Injector);

    // Lazy-loaded services to avoid circular dependency
    private _authenticationService?: AuthenticationService;
    private _dialog?: MatDialog;

    private get authenticationService(): AuthenticationService {
        if (!this._authenticationService) {
            this._authenticationService = this.injector.get(AuthenticationService);
        }
        return this._authenticationService;
    }

    private get dialog(): MatDialog {
        if (!this._dialog) {
            this._dialog = this.injector.get(MatDialog);
        }
        return this._dialog;
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            if (err.status === 401) {
                // 401 handled by AuthInterceptor - just pass through
                // The AuthInterceptor will attempt token refresh
                return throwError(() => err);
            } else if (err.status === 403) {
                this.dialog.closeAll();
                this.dialog.open(DialogConfirmComponent, {
                    data: {
                        icon: CONFIRM_ERROR_ICON,
                        title: 'Unauthorized Action',
                        text: 'You are not authorized to perform this action.',
                        hideCancelButton: true
                    }
                });
                return throwError(() => err);
            } else {
                let errorMessage = err.error ? err.error : err.message ? err.message : err.statusText ? err.statusText : err;
                return throwError(() => errorMessage);
            }
        }));
    }
}
