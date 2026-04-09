import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AwsService {
  private apiUrl = 'http://localhost:5000/api/aws';

  constructor(private http: HttpClient) {}

  getAwsSetupInfo(): Observable<any> {
    // 1. Fixed URL from '/setup-info' to '/setup'
    // 2. Added withCredentials so the browser sends the auth cookie
    return this.http.get(`${this.apiUrl}/setup`, { withCredentials: true });
  }

  saveRoleArn(roleArn: string): Observable<any> {
    // 1. Fixed URL from '/save-role' to '/role'
    // 2. Added withCredentials
    return this.http.post(`${this.apiUrl}/role`, { roleArn }, { withCredentials: true });
  }

  getInfrastructure(region?: string): Observable<any> {
    let params = new HttpParams();
    if (region) {
      params = params.set('region', region);
    }
    // Added withCredentials here too so the dashboard graph doesn't fail!
    return this.http.get(`${this.apiUrl}/infrastructure`, { 
      params: params, 
      withCredentials: true 
    });
  }
}