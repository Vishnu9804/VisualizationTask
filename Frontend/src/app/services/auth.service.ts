import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) { }

  register(userData: any): Observable<any> {
    console.log("here...")
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    // SECURITY: withCredentials allows the browser to receive and store the HttpOnly cookie
    return this.http.post(`${this.apiUrl}/login`, credentials, { withCredentials: true });
  }
}