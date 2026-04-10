import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AwsService {
  private apiUrl = 'http://localhost:3000/api/aws';

  constructor(private http: HttpClient, private auth: AuthService) {}

  // NEW: Check if the user already has a role connected
  checkConnection(): Observable<any> {
    return this.auth.idTokenClaims$.pipe(
      switchMap((claims: any) => {
        const rawIdToken = claims?.__raw; 
        const headers = new HttpHeaders().set('Authorization', `Bearer ${rawIdToken || ''}`);
        return this.http.get(`${this.apiUrl}/check-connection`, { headers: headers, withCredentials: true });
      })
    );
  }

  getAwsSetupInfo(): Observable<any> {
    return this.auth.idTokenClaims$.pipe(
      switchMap((claims: any) => {
        const rawIdToken = claims?.__raw; 
        const headers = new HttpHeaders().set('Authorization', `Bearer ${rawIdToken || ''}`);
        return this.http.get(`${this.apiUrl}/setup`, { headers: headers, withCredentials: true });
      })
    );
  }

  saveRoleArn(roleArn: string): Observable<any> {
    return this.auth.idTokenClaims$.pipe(
      switchMap((claims: any) => {
        const rawIdToken = claims?.__raw; 
        const headers = new HttpHeaders().set('Authorization', `Bearer ${rawIdToken || ''}`);
        return this.http.post(`${this.apiUrl}/role`, { roleArn }, { headers: headers, withCredentials: true });
      })
    );
  }

  getInfrastructure(region?: string): Observable<any> {
    let params = new HttpParams();
    if (region) {
      params = params.set('region', region);
    }

    return this.auth.idTokenClaims$.pipe(
      switchMap((claims: any) => {
        const rawIdToken = claims?.__raw; 
        const headers = new HttpHeaders()
          .set('Authorization', `Bearer ${rawIdToken || ''}`)
          .set('X-Amz-Id-Token', rawIdToken || ''); // STS needs this specific header

        return this.http.get(`${this.apiUrl}/infrastructure`, { 
          params: params, 
          headers: headers, 
          withCredentials: true 
        });
      })
    );
  }
}