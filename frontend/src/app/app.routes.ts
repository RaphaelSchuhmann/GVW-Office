import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { ChangePassword } from './pages/change-password/change-password';
import { Dashboard } from './pages/dashboard/dashboard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'change-password', component: ChangePassword },
    { path: 'dashboard', component: Dashboard },
    // optional: wildcard route for 404
    { path: '**', redirectTo: '/login' },
];
