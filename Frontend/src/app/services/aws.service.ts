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
    return this.http.get(`${this.apiUrl}/setup-info`);
  }

  saveRoleArn(roleArn: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/save-role`, { roleArn });
  }

  // --- NEW: Accept region as optional param ---
  getInfrastructure(region?: string): Observable<any> {
    let params = new HttpParams();
    if (region) {
      params = params.set('region', region);
    }
    return this.http.get(`${this.apiUrl}/infrastructure`, { params });
  }
}