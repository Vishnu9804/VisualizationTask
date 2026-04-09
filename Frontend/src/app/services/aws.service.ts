import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AwsService {
  private apiUrl = 'http://localhost:3000/api/aws';

  constructor(private http: HttpClient) { }

  // 1. Fetch the App ID and External ID for the instructions
  getSetupInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/setup`, { withCredentials: true });
  }

  // 2. Send the Role ARN to the backend to save in the database
  saveRoleArn(roleArn: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/role`, { roleArn }, { withCredentials: true });
  }

  // 3. Fetch the massive JSON block of cloud architecture
  getInfrastructure(): Observable<any> {
    return this.http.get(`${this.apiUrl}/infrastructure`, { withCredentials: true });
  }
}