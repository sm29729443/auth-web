import { Injectable, signal } from '@angular/core';
import { ApiResponse, RegisterRequest, RegisterStep } from '../models/auth.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentStepSignal = signal<RegisterStep>(RegisterStep.FORM);
  // 註冊表單數據
  private registerFormSignal = signal<RegisterRequest>({
    idNumber: '',
    name: '',
    birthDate: '',
    city: '',
    district: '',
    phone: '',
    email: ''
  });
  private errorSignal = signal<string | null>(null);
  private loadingSignal = signal<boolean>(false);

  // ===== 公開的只讀 computed signals =====
  public readonly currentStep = this.currentStepSignal.asReadonly();
  public readonly registerForm = this.registerFormSignal.asReadonly();
  public readonly isLoading = this.loadingSignal.asReadonly();
    public readonly error = this.errorSignal.asReadonly();
  constructor() { }

  /**
 * 設置註冊表單數據
 */
  setRegisterForm(form: RegisterRequest): void {
    this.registerFormSignal.set(form);
  }

  /**
   * 重置註冊流程
   */
  resetRegistrationFlow(): void {
    this.currentStepSignal.set(RegisterStep.FORM);
    this.registerFormSignal.set({
      idNumber: '',
      name: '',
      birthDate: '',
      city: '',
      district: '',
      phone: '',
      email: ''
    });
    this.clearError();
  }

  /**
 * 清除錯誤訊息
 */
  private clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * 發送 OTP
   * 對應 POST /sendOTP
   */
  sendOtp(): Observable<ApiResponse> {
    // 自時測試版本：直接模擬成功的回應
    console.log('模擬發送 OTP...');

    this.setLoading(true);
    this.clearError();

    // 模擬 API 呼叫的延遲
    return new Observable<ApiResponse>(observer => {
      setTimeout(() => {
        this.setLoading(false);
        // 模擬成功的回應
        const mockResponse: ApiResponse = {
          success: true,
          message: 'OTP 已發送成功'
        };

        // 切換到 OTP 驗證步驟
        this.currentStepSignal.set(RegisterStep.OTP_VERIFICATION);

        observer.next(mockResponse);
        observer.complete();
      }, 1000); // 1秒延遲模擬
    });
    


  }

    /**
   * 設置載入狀態
   */
  private setLoading(loading: boolean): void {
    this.loadingSignal.set(loading);
  }
}
