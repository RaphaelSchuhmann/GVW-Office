import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Form } from '../../components/form/form';
import { InputField } from '../../components/input-field/input-field';
import { PwInput } from '../../components/pw-input/pw-input';
import { Button } from '../../components/button/button';
import { Notification } from '../../components/notification/notification';
import { Auth } from '../../services/auth';
import { setAuthToken, getAuthToken } from '../../services/auth-store';
import { setValue } from '../../services/general-store';
import { Router } from '@angular/router';
import { FEErrorCode, ErrorService } from '../../services/error-codes';

@Component({
    selector: 'app-login',
    imports: [Form, InputField, PwInput, Button, Notification],
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

    // Notifications
    displayNotification: string = 'false';
    notificationMessage: string = '';

    ngOnInit() {
        if (this.route.snapshot.queryParamMap.get('error') != null) {
            this.notificationMessage = this.errService.getMessage(
                this.errService.parseErrorCode(this.route.snapshot.queryParamMap.get('error'))!
            );
            this.displayNotification = 'true';
        }

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
        this.displayNotification = 'false';
        this.auth.login(this.email, this.password).subscribe({
            next: (resp) => {
                setAuthToken(resp.authToken);
                setValue('email', this.email);
                if (resp.changePassword)
                    this.router.navigate(['/change-password'], {
                        queryParams: { firstLogin: resp.firstLogin },
                    });
                else this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.notificationMessage = this.errService.getMessage(
                    this.errService.parseErrorCode(err.error.errorMessage)!
                );
                this.displayNotification = 'true';
            }, // Pass err.status to notifications
        });
    }
}
