import { Component } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false
})
export class LoginComponent {
  // Inject the Auth0 service instead of your custom one
  constructor(public auth: AuthService) {}

  login() {
    // Triggers the redirect to Auth0
    this.auth.loginWithRedirect({
      appState: { target: '/aws-setup' }
    });
  }
}