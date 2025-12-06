import { Component, Input } from '@angular/core';
import { Button } from '../button/button';
import { getValue } from '../../services/general-store';

@Component({
  selector: 'app-header',
  imports: [Button],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
	public name: string = getValue("name");
	public email: string = getValue("email");
}
