import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class Button {
  @Input() type: 'primary' | 'secondary' = 'primary';

  get buttonClasses(): string {
    if (this.type === 'primary') {
      return 'w-full h-full bg-primary text-primary-text text-dt-5 rounded-1 flex items-center justify-center cursor-pointer hover:bg-primary-hover text-white duration-500';
    } else {
      return 'w-full h-full border-2 border-border text-dt-5 text-black rounded-1 flex items-center justify-center cursor-pointer hover:bg-secondary-btn-hover duration-500';
    }
  }
}
