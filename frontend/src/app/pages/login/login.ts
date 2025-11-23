import { Component } from '@angular/core';
import { Form } from '../../components/form/form';
import { InputField } from '../../components/input-field/input-field';
import { PwInput } from '../../components/pw-input/pw-input';
import { Button } from '../../components/button/button';
import { Auth } from '../../services/auth';
import { setAuthToken, getAuthToken } from '../../services/auth-store';

@Component({
  selector: 'app-login',
  imports: [Form, InputField, PwInput, Button],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email: string = '';
  password: string = '';

  constructor(private auth: Auth) {}

  public submit() {
    this.auth.login(this.email, this.password).subscribe({
      next: (resp) => setAuthToken(resp.authToken),
      error: (err) => console.error("Login failed: ", err), // Pass err.status to notifications
    });
  }
}
