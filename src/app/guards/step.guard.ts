import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { RegistrationStateService } from '../services/registration-state.service';

/**
 * 步驟守衛
 * 確保用戶按照正確的順序完成註冊步驟
 * 🔧 修復：解決與 Signal 初始化的競爭條件問題
 */
@Injectable({
  providedIn: 'root'
})
export class StepGuard implements CanActivate {

  private registrationState = inject(RegistrationStateService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredStep = route.data['step'] as number;
    
    console.log('🛡️ StepGuard checking:', { 
      requiredStep, 
      path: route.routeConfig?.path 
    });

    // 🔧 關鍵修復：確保狀態已從 storage 同步
    this.registrationState.syncFromStorage();

    // 檢查步驟 2：OTP 驗證頁面
    if (requiredStep === 2) {
      return this.validateStep2Access();
    }

    // 步驟 1：基本資料頁面，始終允許訪問
    if (requiredStep === 1) {
      console.log('✅ Step 1 access granted');
      return true;
    }

    // 未知步驟，重定向到步驟 1
    console.warn('❌ Unknown step, redirecting to info');
    this.router.navigate(['/register/info']);
    return false;
  }

  /**
   * 🔧 新方法：驗證步驟2的訪問權限
   */
  private validateStep2Access(): boolean {
    // 使用服務的狀態驗證方法
    if (!this.registrationState.isStateValid()) {
      console.warn('❌ Invalid state for step 2, redirecting to info');
      this.router.navigate(['/register/info']);
      return false;
    }

    // 檢查步驟1是否已完成
    if (!this.registrationState.isStep1Valid()) {
      console.warn('❌ Step 1 not completed, redirecting to info');
      this.router.navigate(['/register/info']);
      return false;
    }

    // 🔧 修復：如果當前步驟不是2，自動設置為2
    const currentStep = this.registrationState.currentStep();
    if (currentStep !== 2) {
      console.log('🔄 Setting current step to 2');
      this.registrationState.setCurrentStep(2);
    }

    // 🔧 修復：確保 OTP 發送狀態正確
    if (!this.registrationState.otpSent()) {
      console.log('🔄 Setting OTP sent status for step 2');
      this.registrationState.setOtpSent(true);
    }

    console.log('✅ Step 2 access granted - all validations passed');
    return true;
  }
}
