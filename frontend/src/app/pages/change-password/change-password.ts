import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Auth } from '../../services/auth';
import { getValue } from '../../services/general-store';
import { FEErrorCode } from '../../services/error-codes';
import { Button } from '../../components/button/button';
import { Form } from '../../components/form/form';
import { PwInput } from '../../components/pw-input/pw-input';

@Component({
    selector: 'app-change-password',
    imports: [Button, Form, PwInput],
    templateUrl: './change-password.html',
    styleUrl: './change-password.css',
})
export class ChangePassword {
    constructor(private route: ActivatedRoute, private auth: Auth, private router: Router) {}

    firstLogin: boolean = false;
    oldPw: string = '';
    newPw: string = '';
    confirmNewPw: string = '';

    public cta_msg: string = '';

    ngOnInit() {
        this.firstLogin = this.route.snapshot.queryParamMap.get('firstLogin') === 'true';
        this.cta_msg = this.firstLogin
            ? 'Erstmaliger Login - Bitte ändern Sie Ihr Passwort'
            : 'Passwort vergessen - Bitte ändern Sie Ihr Passwort';
    }

    submit() {
        if (this.oldPw.length <= 0 || this.newPw.length <= 0 || this.confirmNewPw.length <= 0) {
            console.error('Input fields cannot be empty'); // TODO Add notification call
        }

        if (this.newPw != this.confirmNewPw) {
            console.error('New Password and Confirm Password are not the same'); // TODO Add notification call
        }

        if (!(this.newPw.length >= 8)) {
            console.error('New Password must be at least 8 characters long'); // TODO Add notification call
        }
        
        const email: string = getValue('email');
        if (email.length == 0) {
            this.router.navigate(['/login'], {
                queryParams: { errorCode: FEErrorCode.MISSING_EMAIL },
            });
        }

        this.auth.changePw(this.oldPw, this.newPw, email).subscribe({
            next: (resp) => {
                this.router.navigate(['/dashboard']);
            },
			error: (err) => console.error('ChangePW failed: ', err), // Pass err.status to notifications / error handler
        });
    }
}
