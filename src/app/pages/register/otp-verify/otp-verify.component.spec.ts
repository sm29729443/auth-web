import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OTPVerifyComponent } from './otp-verify.component';

describe('OTPVerifyComponent', () => {
  let component: OTPVerifyComponent;
  let fixture: ComponentFixture<OTPVerifyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OTPVerifyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OTPVerifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
