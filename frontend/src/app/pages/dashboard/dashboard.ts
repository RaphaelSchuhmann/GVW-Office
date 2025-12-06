import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Notification } from '../../components/notification/notification';
import { Button } from '../../components/button/button';
import { Header } from '../../components/header/header';
import { User } from '../../services/user';
import { setValue, getValue, clearValue } from '../../services/general-store';
import { FEErrorCode, ErrorService } from '../../services/error-codes';
import { getAuthToken } from '../../services/auth-store';

@Component({
    selector: 'app-dashboard',
    imports: [RouterLink, Notification, Button, Header],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css',
})
export class Dashboard {
    constructor(private user: User, private errService: ErrorService) {}

    // Notifications
    displayNotification: string = 'false';
    notificationMessage: string = '';

    ngOnInit() {
        this.user.getData(getValue('email'), getAuthToken()!).subscribe({
            next: (resp) => {
                setValue('email', resp.email);
                setValue('role', resp.role);
                setValue('name', resp.name);
            },
            error: (err) => {
                this.notificationMessage = this.errService.getMessage(
                    this.errService.parseErrorCode(err.error.errorMessage)!
                );
                this.displayNotification = 'true';
            },
        });
    }
}
