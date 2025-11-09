import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app';
import { SharedModule } from './shared/shared.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from '@app/interceptors/auth-interceptor';
import { ErrorInterceptor } from '@app/interceptors';


@NgModule({
  declarations: [
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    AppComponent,
  ],
  providers: [
    // AuthInterceptor must run BEFORE ErrorInterceptor
    // It handles 401 errors with token refresh
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  //bootstrap: [AppComponent]. This is not needed with bootstrapApplication in main.ts and also since AppComponent is a standalone component.
})
export class AppModule {}
