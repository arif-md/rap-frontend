import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { LoginComponent } from './login/login.component';
import { AuthCallbackComponent } from './auth-callback/auth-callback.component';
// import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [],
  imports: [
    CommonModule, 
    MatDialogModule,
    HeaderComponent, 
    FooterComponent, 
    LoginComponent,
    AuthCallbackComponent,
    MatButtonModule],
  exports: [
    MatDialogModule,    
    HeaderComponent, 
    FooterComponent,  
    LoginComponent,
    AuthCallbackComponent,
    MatButtonModule],
  providers   : [
    {
        provide : MAT_DIALOG_DEFAULT_OPTIONS,
        useValue: {
            ...new MatDialogConfig(),
            minWidth: '30vw'
        }
    },
  // provideHttpClient(withInterceptorsFromDi()),
  ]

})
export class SharedModule {}
