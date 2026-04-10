import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false
})
export class LoginComponent implements OnInit {

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // If the user is already logged in, skip this page and go straight to dashboard
    this.auth.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  // Triggers the secure Auth0 Universal Login page
  login(): void {
    this.auth.loginWithRedirect();
  }
}