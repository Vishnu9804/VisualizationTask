import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms'; 

import { AuthModule, AuthHttpInterceptor } from '@auth0/auth0-angular';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { AwsSetupComponent } from './components/aws-setup/aws-setup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

@NgModule({
  declarations: [
    App,
    RegisterComponent,
    LoginComponent,
    AwsSetupComponent,   
    DashboardComponent   
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule, 
    ReactiveFormsModule, 
    FormsModule,
    AuthModule.forRoot({
      domain: 'dev-rjpc2w10pgu3fftq.us.auth0.com', 
      clientId: 'BIwK8dnae5qbm9m3Zui3xWrBlf9Yo1Xt',
      authorizationParams: {
        redirect_uri: window.location.origin + '/login',
        // USE THE CUSTOM API IDENTIFIER HERE
        audience: 'https://fortress-api' 
      },
      httpInterceptor: {
        allowedList: [
          {
            uri: 'http://localhost:3000/api/*',
            tokenOptions: {
              authorizationParams: {
                // USE THE CUSTOM API IDENTIFIER HERE
                audience: 'https://fortress-api'
              }
            }
          }
        ]
      }
    })          
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true }
  ],
  bootstrap: [App]
})
export class AppModule { }