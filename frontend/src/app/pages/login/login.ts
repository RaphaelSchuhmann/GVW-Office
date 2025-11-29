import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Form } from '../../components/form/form';
import { InputField } from '../../components/input-field/input-field';
import { PwInput } from '../../components/pw-input/pw-input';
import { Button } from '../../components/button/button';
import { Auth } from '../../services/auth';
import { setAuthToken, getAuthToken } from '../../services/auth-store';
import { setValue } from '../../services/general-store';
import { Router } from '@angular/router';
import { FEErrorCode, ErrorService } from '../../services/error-codes';

@Component({
    selector: 'app-login',
    imports: [Form, InputField, PwInput, Button],
    templateUrl: './login.html',
    styleUrl: './login.css',
})
export class Login {
    constructor(
        private auth: Auth,
        private router: Router,
        private route: ActivatedRoute,
        private errService: ErrorService
    ) {}

    email: string = '';
    password: string = '';

    isError: boolean = false;
    error: FEErrorCode | null = null;

    ngOnInit() {
        this.isError = this.route.snapshot.queryParamMap.get('error') != null;
        if (this.isError)
            this.error = this.errService.parseErrorCode(
                this.route.snapshot.queryParamMap.get('error')
            ); // TODO call notification / error msg here

        const authToken = getAuthToken();
        if (authToken) {
            // Try auto authentication
            this.auth.authenticate(authToken!).subscribe({
                next: (resp) => {
                    setValue('email', resp.email);
                    setValue('role', resp.role);
                    if (resp.changePassword)
                        this.router.navigate([
                            '/change-password',
                            { queryParams: { firstLogin: false } },
                        ]);
                    else this.router.navigate(['/dashboard']);
                },
                error: (err) => console.error('Auto authentication failed: ', err), // Pass err.status to notifications / err handler
            });
        }
    }

    public submit() {
        this.auth.login(this.email, this.password).subscribe({
            next: (resp) => {
                setAuthToken(resp.authToken);
                setValue('email', this.email);
                if (resp.changePassword)
                    this.router.navigate(['/change-password'], {
                        queryParams: { firstLogin: resp.firstLogin },
                    });
                else
                    this.router.navigate(['/dashboard']);
            },
            error: (err) => console.error('Login failed: ', err), // Pass err.status to notifications
        });
    }
}
