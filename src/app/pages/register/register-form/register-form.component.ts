import { Component, computed, inject } from '@angular/core';

// Angular Material 組件
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeZhTw from '@angular/common/locales/zh-Hant';

// 註冊繁體中文 locale
registerLocaleData(localeZhTw);

// 自定義日期格式
export const TW_DATE_FORMATS = {
  parse: {
    dateInput: 'YYYY-MM-DD',
  },
  display: {
    dateInput: 'YYYY-MM-DD',
    monthYearLabel: 'YYYY年 MMM',
    dateA11yLabel: 'YYYY-MM-DD',
    monthYearA11yLabel: 'YYYY年 MMMM',
  },
};

@Component({
  selector: 'app-register-form',
  imports: [CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule],
    providers: [
      { provide: MAT_DATE_LOCALE, useValue: 'zh-Hant-TW' },
      { provide: MAT_DATE_FORMATS, useValue: TW_DATE_FORMATS }
  ],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.css'
})
export class RegisterFormComponent {
  private formBuilder = inject(FormBuilder);
  protected authService = inject(AuthService);
  private dateAdapter = inject(DateAdapter);



  protected maxDate: Date = new Date();;
  protected minDate: Date = new Date();;



  // 表單實例
  protected registerForm: FormGroup;

  constructor() {
    // 設定日期配置器的語言
    this.dateAdapter.setLocale('zh-Hant-TW');
    // 設定日期範圍
    this.setDateRange();
    // 初始化表單
    this.registerForm = this.formBuilder.group({
      idNumber: ['', [
        Validators.required,
        Validators.pattern(/^[A-Z][12][0-9]{8}$/) // 台灣身份證格式
      ]],
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(10)
      ]],
      birthDate: ['', Validators.required], 
      // city: [''], // 移除 Validators.required，變成非必填
      // district: [''], // 移除 Validators.required，變成非必填
      phone: ['', [
        Validators.required,
        Validators.pattern(/^09[0-9]{8}$/) // 台灣手機號碼格式
      ]]
      // ,
      // email: ['', [
      //   Validators.email
      // ]]
    });



    // 監聽表單變化，實時更新 AuthService 中的狀態
    this.registerForm.valueChanges.subscribe(value => {
      if (this.registerForm.valid) {
        this.authService.setRegisterForm(value);
      }
    });

    // 從 AuthService 載入已存在的數據（如果有的話）
    const existingData = this.authService.registerForm();
    if (this.hasExistingData(existingData)) {
      this.registerForm.patchValue(existingData);
    }
  }


  /**
 * 檢查是否有已存在的數據
 */
  private hasExistingData(data: any): boolean {
    return data && (data.idNumber || data.name || data.email || data.phone);
  }
  /**
   * 取得欄位的錯誤訊息
   */
  protected getFieldErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return this.getFieldLabel(fieldName) + '為必填項目';
      }
      if (field.errors['pattern']) {
        return '請輸入正確的' + this.getFieldLabel(fieldName) + '格式';
      }
      if (field.errors['email']) {
        return '請輸入有效的電子信箱格式';
      }
      if (field.errors['minlength']) {
        return this.getFieldLabel(fieldName) + '至少需要 ' + field.errors['minlength'].requiredLength + ' 個字符';
      }
      if (field.errors['maxlength']) {
        return this.getFieldLabel(fieldName) + '最多 ' + field.errors['maxlength'].requiredLength + ' 個字符';
      }
    }
    return '';
  }

  /**
   * 取得欄位標籤
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'idNumber': '身份證字號',
      'name': '姓名',
      'birthDate': '出生日期',
      'city': '縣市',
      'district': '鄉鎮地區',
      'phone': '手機號碼',
      'email': '電子信箱'
    };
    return labels[fieldName] || fieldName;
  }

  /**
  * 設定日期範圍：近100年且滿18歲
  */
  private setDateRange(): void {
    const currentDate = new Date();
    
    // 最大日期：18年前的今天（滿18歲）
    this.maxDate.setFullYear(currentDate.getFullYear() - 18);
    
    // 最小日期：100年前的1月1日
    this.minDate.setFullYear(currentDate.getFullYear() - 100);
    this.minDate.setMonth(0); // 1月
    this.minDate.setDate(1);  // 1號
  }
    /**
   * 重設表單
   */
  protected resetForm(): void {
    this.registerForm.reset();
    this.authService.resetRegistrationFlow();
  }

  /**
   * 提交表單
   */
  protected onSubmit(): void {
    console.log('提交表單:', this.registerForm.value);
    console.log('表單狀態 valid:', this.registerForm.valid);
    console.log('表單 errors:', this.getFormErrors());
    
    if (this.registerForm.valid) {
      // 更新 AuthService 中的表單數據
      this.authService.setRegisterForm(this.registerForm.value);
      
      // 發送 OTP
      this.authService.sendOtp().subscribe({
        next: (response) => {
          if (response.success) {
            console.log('OTP 發送成功');
            // AuthService 會自動切換到下一步
          }
        },
        error: (error) => {
          console.error('OTP 發送失敗:', error);
          // 錯誤已經在 AuthService 中處理
        }
      });
    } else {
      // 標記所有欄位為 touched，以顯示驗證錯誤
      this.markFormGroupTouched(this.registerForm);
      console.log('表單驗證失敗，錯誤資訊:', this.getFormErrors());
    }
  }

    /**
   * 取得表單錯誤訊息（用於 debug）
   */
  private getFormErrors(): any {
    const errors: any = {};
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (control && !control.valid) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

    /**
   * 標記表單的所有欄位為 touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

}





