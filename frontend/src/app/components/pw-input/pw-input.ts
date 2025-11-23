import { Component, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-pw-input',
  imports: [],
  templateUrl: './pw-input.html',
  styleUrl: './pw-input.css',
})
export class PwInput {
  @Input() fieldName: string = 'Input';
  @Input() placeholder: string = 'Enter something...';

  @Output() valueChange = new EventEmitter<string>();

  public viewPw: string = 'visibility';
  public inputType: string = 'password';
  private IsPasswordVisible: boolean = false;

  public togglePassword() {
    this.IsPasswordVisible = !this.IsPasswordVisible;

    this.viewPw = this.IsPasswordVisible ? 'visibility_off' : 'visibility';
    this.inputType = this.IsPasswordVisible ? 'text' : 'password';
  }

  onInput(event: any) {
    this.valueChange.emit(event.target.value);
  }
}
