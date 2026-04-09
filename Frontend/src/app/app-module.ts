import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms'; 

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
    FormsModule          
  ],
  providers: [],
  bootstrap: [App]
})
export class AppModule { }