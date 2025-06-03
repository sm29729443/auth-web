import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { RegisterService } from '../../../services/register.service';
import { RegistrationStateService } from '../../../services/registration-state.service';
import { TokenService } from '../../../services/token.service';
import { OtpVerifyData } from '../../../models/register.model';
import { CustomValidators } from '../../../validators/custom-validators';

/**
 * 註冊步驟2：OTP驗證組件
 * 🔧 修復：改善 F5 刷新時的狀態處理
 */
@Component({
  selector: 'app-register-verify',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-verify.component.html',
  styleUrl: './register-verify.component.css'
})
export class RegisterVerifyComponent implements OnInit, OnDestroy {

  /** OTP 驗證表單 */
  otpForm!: FormGroup;

  /** 是否已嘗試提交表單 */
  isFormSubmitted = false;

  /** 銷毀訂閱 */
  private destroy$ = new Subject<void>();

  // 🔄 注入服務
  private fb = inject(FormBuilder);
  private registerService = inject(RegisterService);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  public registrationState = inject(RegistrationStateService);

  ngOnInit(): void {
    this.initializeForm();
    this.checkPrerequisites();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 初始化表單
   */
  private initializeForm(): void {
    this.otpForm = this.fb.group({
      otpCode: ['', [
        Validators.required,
        CustomValidators.otpCode(6)
      ]]
    });
  }

  /**
   * 檢查前置條件
   * 🔧 修復：適應新的狀態管理邏輯
   */
  private checkPrerequisites(): void {
    // 🔧 確保狀態已從 storage 同步
    this.registrationState.syncFromStorage();

    // 檢查狀態是否有效
    if (!this.registrationState.isStateValid()) {
      console.warn('❌ Invalid state for step 2, redirecting to info');
      this.router.navigate(['/register/info']);
      return;
    }

    // 檢查是否有步驟1的數據
    if (!this.registrationState.isStep1Valid()) {
      console.warn('❌ Step 1 data not found, redirecting to info');
      this.router.navigate(['/register/info']);
      return;
    }

    // 設置當前步驟（如果還不是步驟2）
    const currentStep = this.registrationState.currentStep();
    if (currentStep !== 2) {
      this.registrationState.setCurrentStep(2);
    }

    // 🔧 修復：如果 OTP 狀態不正確，設置為已發送
    // 這對於 F5 刷新的情況很重要
    if (!this.registrationState.otpSent()) {
      console.log('🔄 Setting OTP sent status for verify component');
      this.registrationState.setOtpSent(true);
    }

    console.log('✅ RegisterVerifyComponent prerequisites met');
  }

  /**
   * 提交 OTP 驗證
   */
  onSubmit(): void {
    this.isFormSubmitted = true;
    this.registrationState.clearErrors();

    if (this.otpForm.valid) {
      this.verifyOtp();
    } else {
      this.markFormGroupTouched(this.otpForm);
      this.registrationState.addError('請輸入正確的驗證碼');
    }
  }

  /**
   * 驗證 OTP 並完成註冊
   */
  private verifyOtp(): void {
    this.registrationState.setLoading(true);

    const formData = this.registrationState.formData();
    if (!formData) {
      this.registrationState.setLoading(false);
      this.registrationState.addError('表單數據遺失，請重新填寫');
      this.router.navigate(['/register/info']);
      return;
    }

    const otpData: OtpVerifyData = {
      otpCode: this.otpForm.get('otpCode')?.value,
      phoneNumber: formData.phoneNumber
    };

    this.registerService.verifyOtpAndRegister(otpData, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.registrationState.setLoading(false);
          
          if (response.success && response.data) {
            // 完成步驟2
            this.registrationState.completeStep2(otpData.otpCode);
            
            // 獲取重定向 URL
            const redirectUrl = this.tokenService.getRedirectUrlFromToken() 
                               || response.data?.redirectUrl 
                               || '/success';
            
            console.log('🔄 Registration completed, redirecting to:', redirectUrl);
            
            // 清除註冊數據（避免重複使用）
            setTimeout(() => {
              this.registrationState.clearAll();
              this.router.navigate([redirectUrl]);
            }, 1500);
          }
        },
        error: (error) => {
          this.registrationState.setLoading(false);
          this.registrationState.addError(error.message || '驗證失敗，請重新輸入驗證碼');
          
          // 清空 OTP 輸入框
          this.otpForm.get('otpCode')?.setValue('');
        }
      });
  }

  /**
   * 重新發送 OTP
   */
  resendOtp(): void {
    if (!this.registrationState.canResendOtp()) {
      return;
    }

    const formData = this.registrationState.formData();
    if (!formData) {
      this.registrationState.addError('表單數據遺失，請重新填寫');
      this.router.navigate(['/register/info']);
      return;
    }

    this.registrationState.setLoading(true);

    this.registerService.resendOtp(formData.phoneNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.registrationState.setLoading(false);
          
          if (response.success && response.data) {
            this.registrationState.setOtpSent(true, response.data.countdown);
            this.otpForm.get('otpCode')?.setValue('');
            console.log('✅ OTP resent successfully');
          }
        },
        error: (error) => {
          this.registrationState.setLoading(false);
          this.registrationState.addError(error.message || '重新發送失敗，請稍後再試');
        }
      });
  }

  /**
   * 回到上一步驟
   */
  goToPreviousStep(): void {
    this.registrationState.resetToStep1();
    this.router.navigate(['/register/info']);
  }

  /**
   * 標記表單群組為已觸碰，以顯示驗證錯誤
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * 取得表單控制項的錯誤訊息
   */
  getErrorMessage(controlName: string): string {
    const control = this.otpForm.get(controlName);

    if (control && control.invalid && control.touched) {
      const errors = control.errors;

      if (errors?.['required']) {
        return '驗證碼為必填項目';
      }

      if (errors?.['otpCode']) {
        return errors['otpCode'].message;
      }
    }

    return '';
  }

  /**
   * 檢查表單控制項是否有錯誤且已被觸碰
   */
  hasError(controlName: string): boolean {
    const control = this.otpForm.get(controlName);
    return !!(control && control.invalid && (control.touched || this.isFormSubmitted));
  }

  /**
   * 取得格式化的用戶數據用於顯示
   */
  getFormattedUserData() {
    const data = this.registrationState.formData();
    if (!data) return null;

    return {
      idNumber: data.idNumber || '',
      name: data.name || '',
      birthDate: data.birthDate ? 
        `${data.birthDate.year}/${data.birthDate.month}/${data.birthDate.day}` : '',
      address: data.address ? 
        `${data.address.city}${data.address.district}${data.address.detail}` : '',
      phoneNumber: data.phoneNumber || '',
      email: data.email || ''
    };
  }

  /**
   * 取得遮罩的手機號碼
   */
  getMaskedPhoneNumber(): string {
    const data = this.registrationState.formData();
    if (!data?.phoneNumber) return '';

    const phone = data.phoneNumber;
    return phone.substring(0, phone.length - 3).replace(/\d/g, '*') + 
           phone.substring(phone.length - 3);
  }
}
