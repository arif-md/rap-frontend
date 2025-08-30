import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app';
import { SharedModule } from './shared/shared.module';

const routes: Routes = [
  // Add your routes here, e.g. { path: 'home', component: HomeComponent }
];

@NgModule({
  declarations: [
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    SharedModule,
    AppComponent,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
