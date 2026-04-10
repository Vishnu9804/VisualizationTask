import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AwsService {
  private apiUrl = 'http://localhost:3000/api/aws';

  constructor(private http: HttpClient) {}

  getAwsSetupInfo(): Observable<any> {
    // Removed withCredentials
    return this.http.get(`${this.apiUrl}/setup`);
  }

  saveRoleArn(roleArn: string): Observable<any> {
    // Removed withCredentials
    return this.http.post(`${this.apiUrl}/role`, { roleArn });
  }

  getInfrastructure(region?: string): Observable<any> {
    let params = new HttpParams();
    if (region) {
      params = params.set('region', region);
    }
    // Removed withCredentials
    return this.http.get(`${this.apiUrl}/infrastructure`, { 
      params: params 
    });
  }
}