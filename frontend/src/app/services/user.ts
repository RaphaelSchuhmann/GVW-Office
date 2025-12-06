import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class User {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    getData(email: string, token: string): Observable<any> {
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
        });

        return this.http.post(
            `${this.apiUrl}/user/data`,
            { email },
            { headers }
        );
    }
}
