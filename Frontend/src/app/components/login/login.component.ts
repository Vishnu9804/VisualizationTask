import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  login() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Adjust this payload based on exactly what your backend expects
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        // Assuming your service or component handles the JWT token storage
        if(res.token) localStorage.setItem('token', res.token);
        this.isLoading = false;
        this.router.navigate(['/aws-setup']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Invalid credentials. Please verify your email and password.';
        this.isLoading = false;
      }
    });
  }
}