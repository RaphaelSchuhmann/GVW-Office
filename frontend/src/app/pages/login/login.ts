import { Component } from '@angular/core';
import { Form } from '../../components/form/form';
import { InputField } from '../../components/input-field/input-field';
import { PwInput } from '../../components/pw-input/pw-input';
import { Button } from '../../components/button/button';

@Component({
  selector: 'app-login',
  imports: [Form, InputField, PwInput, Button],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

}
