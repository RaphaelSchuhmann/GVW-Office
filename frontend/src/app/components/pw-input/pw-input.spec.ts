import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PwInput } from './pw-input';

describe('PwInput', () => {
  let component: PwInput;
  let fixture: ComponentFixture<PwInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PwInput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PwInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
