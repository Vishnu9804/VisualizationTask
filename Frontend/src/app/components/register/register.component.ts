import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: false
})
export class RegisterComponent {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  showPassword = false;
  
  // Track strength requirements
  strength = {
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
    isValid: false
  };

  constructor(private authService: AuthService, private router: Router) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Called on (input) in the HTML template
  onPasswordChange() {
    const p = this.password;
    this.strength.length = p.length >= 8;
    this.strength.upper = /[A-Z]/.test(p);
    this.strength.lower = /[a-z]/.test(p);
    this.strength.number = /[0-9]/.test(p);
    this.strength.special = /[!@#$%^&*(),.?":{}|<>]/.test(p);

    this.strength.isValid = this.strength.length && this.strength.upper && 
                            this.strength.lower && this.strength.number && 
                            this.strength.special;
  }

  register() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    if (!this.strength.isValid) {
      this.errorMessage = 'Please ensure your password meets all strength requirements.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Optionally auto-login or just redirect to login
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Registration failed. The email might already be in use.';
        this.isLoading = false;
      }
    });
  }
}