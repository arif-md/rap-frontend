import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ErrorResponse, PATH_LOGIN, PATH_MANAGE_ACC, URL_AUTH_TOKEN, URL_AUTHENTICATE, URL_CSRF_TOKEN, URL_LOGOUT } from '@app/shared/model';
import { User, UserAdapter } from '@app/shared/model/admin';
import { LocationStrategy } from '@angular/common';
import { Router } from '@angular/router';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
    private router = inject(Router);
    private http = inject(HttpClient);
    private locationStrategy = inject(LocationStrategy);
    private adapter = inject(UserAdapter);

    private currentUserSubject: BehaviorSubject<User | null>;
    public currentUser: Observable<User | null>;

    constructor() {
        const storedUser = localStorage.getItem('currentUser');
        this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null);
        this.currentUser = this.currentUserSubject.asObservable();
    }

    public get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    public set currentUserValue(user: User | null) {
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(this.adapter.restToForm(user)));
        } else {
            localStorage.removeItem('currentUser');
        }
        this.currentUserSubject.next(user);
    }



    verifyUserDetails(): void {
        const user = this.currentUserValue;
        if (user && user.isExternalUser && (!user.firstName || !user.lastName || !user.phone)) {
            this.router.navigate([PATH_MANAGE_ACC]);
        }
    }

    /*login(loginReq: LoginRequest): Observable<User> {
        const url = `${this.locationStrategy.getBaseHref()}${URL_AUTHENTICATE}`;
        return this.http.post<User>(url, loginReq, httpOptions)
            .pipe(
                tap(user => {
                    // login successful
                    if (user) {
                      // store user details in local storage.
                      localStorage.setItem('currentUser', JSON.stringify(this.adapter.restToForm(user)));
                      this.currentUserSubject.next(user);
                      //return user;
                    }
                }),
                catchError(this.errorHandler)
                // catchError(this.handleError<any>('login'))
            );
    }*/

    async getCsrfToken(): Promise<any> {
      const url = `${this.locationStrategy.getBaseHref()}${URL_CSRF_TOKEN}`;
      let token:any = await this.http.get<any>(url, {}).toPromise();
      return token;
    }

    /*logout() {
        // remove user from local storage to logout the user.
        localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    }*/

    async logout(isExternalUser: boolean): Promise<Observable<any>> {
        //Send logout request to server inorder to invalidate the server side session and remove the session cookies(including csrf token).
        const url: string = `${this.locationStrategy.getBaseHref()}${URL_LOGOUT}`;
        return await this.http.post<any>(url, {withCredentials: true}).toPromise();
            /*.then(res => {
                console.debug('logout success')
                return res;
            }).catch(error => {
                console.error('error in logout');
                console.error(error);
                // return false;
            }).finally(() => {
                this.clearUserDetails();
            });*/
    }

    async clearUserDetails(): Promise<any> {
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
        //get a new csrf token from server so that the subsequent request doesn't fail.
        const token = await this.getCsrfToken();
        return token;
    }

    /*async verifyUser(loginReq: LoginRequest): Promise<boolean> {
        const url = `${this.locationStrategy.getBaseHref()}${URL_VERIFY_USER}`;
      try{
        let result: boolean = await this.http.post<boolean>(url, loginReq, httpOptions).toPromise();
        return result;
      }catch (error){
        await this.errorHandler(error);
      }
    }*/

    getAuthToken(officeId: number, roleId: number, loginInfoNotFound?: boolean): Observable<User> {
        const url = `${this.locationStrategy.getBaseHref()}${URL_AUTH_TOKEN}`;
        let queryParams = new HttpParams();
        if (officeId) {
            queryParams = queryParams.append('officeId', officeId);
        }
        if (roleId) {
            queryParams = queryParams.append('roleId', roleId);
        }
        if (loginInfoNotFound) {
            queryParams = queryParams = queryParams.append('loginInfoNotFound', loginInfoNotFound + '');
        }
        return this.http.get<User>(url, {params: queryParams})
            .pipe(
                tap(user => {
                    if (user) {
                        const result = this.adapter.restToForm(user);
                        if (result) {
                            localStorage.setItem('currentUser', JSON.stringify(result));
                            this.currentUserSubject.next(user);
                        }
                    } else {
                        this.currentUserSubject.next(null);
                    }
                }),
                catchError(this.errorHandler)
            );
    }

    errorHandler(error: ErrorResponse) {
        // This maybe should also call logout() and/or navigate to the login page
        return throwError(error.message || 'Server Error');
    }

    /*private handleError<T> (operation = 'operation', result?: T) {
       return (error: any): Observable<T> => {
         // TODO: send the error to remote logging infrastructure
         // Let the app keep running by returning an empty result.
         // return of(error.message);
         return Observable.throw(error.message || 'Server Error');
       };
    }*/

}
