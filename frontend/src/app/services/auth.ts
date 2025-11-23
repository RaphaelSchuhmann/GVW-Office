import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Auth {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    login(email: string, password: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/login`, {
            email,
            password,
        });
    }

    changePw(oldPw: string, newPw: string, email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/changePW`, {
            email,
            oldPw,
            newPw,
        });
    }

    authenticate(token: string): Observable<any> {
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
        });

        return this.http.get(`${this.apiUrl}/auth/auto`, { headers });
    }
}
