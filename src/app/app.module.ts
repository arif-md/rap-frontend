import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app';
import { SharedModule } from './shared/shared.module';



@NgModule({
  declarations: [
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    AppComponent,
  ],
  providers: [],
  //bootstrap: [AppComponent]. This is not needed with bootstrapApplication in main.ts and also since AppComponent is a standalone component.
})
export class AppModule {}
