import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular'; // <-- NEW IMPORT
import { switchMap } from 'rxjs/operators';         // <-- NEW IMPORT

@Injectable({
  providedIn: 'root'
})
export class AwsService {
  private apiUrl = 'http://localhost:3000/api/aws';

  // INJECT Auth0 AuthService HERE
  constructor(private http: HttpClient, private auth: AuthService) {}

  getAwsSetupInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/setup`, { withCredentials: true });
  }

  saveRoleArn(roleArn: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/role`, { roleArn }, { withCredentials: true });
  }

  getInfrastructure(region?: string): Observable<any> {
    let params = new HttpParams();
    if (region) {
      params = params.set('region', region);
    }

    // MAGIC TRICK: We wait for the ID token, grab the raw JWT string, and attach it to a custom header
    return this.auth.idTokenClaims$.pipe(
      switchMap((claims: any) => {
        const rawIdToken = claims?.__raw; 
        
        // We create a custom header specifically for AWS STS
        const headers = new HttpHeaders().set('X-Amz-Id-Token', rawIdToken || '');

        return this.http.get(`${this.apiUrl}/infrastructure`, { 
          params: params, 
          headers: headers, 
          withCredentials: true 
        });
      })
    );
  }
}