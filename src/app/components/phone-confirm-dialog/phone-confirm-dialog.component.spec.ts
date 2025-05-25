import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhoneConfirmDialogComponent } from './phone-confirm-dialog.component';

describe('PhoneConfirmDialogComponent', () => {
  let component: PhoneConfirmDialogComponent;
  let fixture: ComponentFixture<PhoneConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhoneConfirmDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhoneConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
