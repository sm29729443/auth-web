import { Component, inject } from '@angular/core';
import { RegisterFormComponent } from "./register-form/register-form.component";
import { RegisterStep } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';
import { OTPVerifyComponent } from "./otp-verify/otp-verify.component";

@Component({
  selector: 'app-register',
  imports: [RegisterFormComponent, OTPVerifyComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  protected authService = inject(AuthService);
  // 步驟配置
  protected steps = [
    { key: RegisterStep.FORM, number: 1, title: '填寫資料' },
    { key: RegisterStep.OTP_VERIFICATION, number: 2, title: 'OTP 驗證' }, 
    { key: RegisterStep.SUCCESS, number: 3, title: '註冊完成' }
  ];


    /**
   * 取得步驟樣式類別
   */
  protected getStepClasses(stepKey: RegisterStep): string {
    const currentStep = this.authService.currentStep();
    const stepIndex = this.steps.findIndex(s => s.key === stepKey);
    const currentIndex = this.steps.findIndex(s => s.key === currentStep);

    if (stepIndex < currentIndex) {
      // 已完成的步驟
      return 'bg-blue-500 text-white';
    } else if (stepIndex === currentIndex) {
      // 當前步驟
      return 'bg-blue-600 text-white ring-2 ring-blue-300';
    } else {
      // 未來的步驟
      return 'bg-gray-300 text-gray-500';
    }
  }

    /**
   * 檢查步驟是否已完成
   */
  protected isStepCompleted(stepKey: RegisterStep): boolean {
    const currentStep = this.authService.currentStep();
    const stepIndex = this.steps.findIndex(s => s.key === stepKey);
    const currentIndex = this.steps.findIndex(s => s.key === currentStep);
    
    return stepIndex < currentIndex;
  }
}
