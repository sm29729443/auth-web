import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface PhoneConfirmData {
  phoneNumber: string;
}

@Component({
  selector: 'app-phone-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './phone-confirm-dialog.component.html',
  styleUrl: './phone-confirm-dialog.component.css'
})
export class PhoneConfirmDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<PhoneConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PhoneConfirmData
  ) { }

  getPhonePrefix(): string {
    const phone = this.data.phoneNumber;
    return phone.substring(0, phone.length - 3).replace(/\d/g, '*');  // 把數字替換成 *
  }

  getPhoneSuffix(): string {
    const phone = this.data.phoneNumber;
    return phone.substring(phone.length - 3);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}