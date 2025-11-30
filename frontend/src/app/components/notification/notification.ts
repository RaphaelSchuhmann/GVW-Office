import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-notification',
    imports: [],
    templateUrl: './notification.html',
    styleUrl: './notification.css',
})
export class Notification {
    @Input() message: string = '';
    @Input() display: string = 'false';
    @Input() type: string = 'info';

    get notificationClasses(): string {
        if (this.display == 'true') {
            return 'z-50 absolute top-1/20 right-1/40 p-5 pl-10 pr-10 bg-white text-dt-6 flex items-center justify-around rounded-1 border-2 border-border opacity-100';
        } else {
            return 'z-50 absolute top-1/20 right-1/40 p-5 pl-10 pr-10 bg-white text-dt-6 flex items-center justify-around rounded-1 border-2 border-border opacity-0';
        }
    }

    get notificationType(): string {
        if (this.type == 'warning') {
            return 'warning';
        } else if (this.type == 'error') {
            return 'error';
        } else {
            return 'info';
        }
    }
}
