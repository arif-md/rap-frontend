import { inject, Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthenticationService } from '@app/global-services';
import { CONFIRM_PARENT_ORG_IMG, CONFIRM_ERROR_ICON } from '@app/shared/model';
import { MatDialog } from '@angular/material/dialog';
import { DialogConfirmComponent } from '@app/shared/dialog-confirm/dialog-confirm.component';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    private authenticationService = inject(AuthenticationService);
    private dialog = inject(MatDialog);

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            if (err.status === 401) {
                // Auto logout if 401 status is returned by API call.
                // 401 will be returned if session is expired or invalid session id passed or if there is no session.
                /*this.authenticationService.logout().finally(() => {
                    this.getSwal().then(() => {
                        let errorMessage = err.error?.message || 'This action is unauthorized';
                        this.swal.fire({
                            iconHtml         : CONFIRM_PARENT_ORG_IMG,
                            customClass      : {icon: 'no-icon-border'},
                            title: 'Unauthorized Account',
                            text: errorMessage});
                    });
                });*/
                this.authenticationService.clearUserDetails().finally(() => {
                    this.dialog.closeAll();
                    let errorMessage = err.error?.message || 'Invalid Session/Session timed out.';
                    this.dialog.open(DialogConfirmComponent, {data: {icon: CONFIRM_PARENT_ORG_IMG, title: 'Access Not Authorized', text: errorMessage}});
                });
                return throwError(() => err);
            } else if (err.status === 403) {
                this.dialog.closeAll();
                this.dialog.open(DialogConfirmComponent, {data: {icon: CONFIRM_ERROR_ICON, title: 'Unauthorized Action', text: 'You are not authorized to perform this action.', hideCancelButton: true}});
                return throwError(() => err);
            } else {
                let errorMessage = err.error ? err.error : err.message ? err.message : err.statusText ? err.statusText : err;
                return throwError(() => errorMessage);
            }
        }));
    }
}
