import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-input-field',
  imports: [],
  templateUrl: './input-field.html',
  styleUrl: './input-field.css',
})
export class InputField {
  @Input() fieldName: string = "Input";
  @Input() placeholder: string = "Enter something...";
}
