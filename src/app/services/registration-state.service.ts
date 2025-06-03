import { Injectable, signal, computed, effect } from '@angular/core';
import { RegisterFormData } from '../models/register.model';

/**
 * 註冊流程狀態管理服務
 * 使用 Angular 19 Signal + Session Storage 混合方案
 * 🔧 修復：解決 F5 刷新時的狀態同步問題
 */
@Injectable({
  providedIn: 'root'
})
export class RegistrationStateService {
  private readonly STORAGE_KEY = 'registrationData';
  private readonly STEP_KEY = 'registrationStep';
  private readonly INIT_FLAG_KEY = 'registrationStateInitialized';
  
  private isSyncing = false; // 防重入鎖
  private isInitialized = false; // 初始化標記

  // 🔄 Signal 狀態管理
  private _formData = signal<RegisterFormData | null>(null);
  private _currentStep = signal<number>(1);
  private _isLoading = signal<boolean>(false);
  private _errors = signal<string[]>([]);
  private _otpSent = signal<boolean>(false);
  private _otpCountdown = signal<number>(0);

  // 📖 只讀的公開 Signal
  readonly formData = this._formData.asReadonly();
  readonly currentStep = this._currentStep.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly errors = this._errors.asReadonly();
  readonly otpSent = this._otpSent.asReadonly();
  readonly otpCountdown = this._otpCountdown.asReadonly();

  // 🧮 計算屬性
  readonly isStep1Valid = computed(() => {
    const data = this._formData();
    if (!data) return false;

    return !!(
      data.idNumber && 
      data.name && 
      data.birthDate?.year && 
      data.birthDate?.month && 
      data.birthDate?.day &&
      data.address?.city && 
      data.address?.district && 
      data.address?.detail &&
      data.phoneNumber && 
      data.email
    );
  });

  readonly isStep2Ready = computed(() => {
    return this.isStep1Valid() && this._otpSent();
  });

  readonly canProceedToVerify = computed(() => {
    return this.isStep1Valid() && this._currentStep() === 1;
  });

  readonly isRegistrationComplete = computed(() => {
    const data = this._formData();
    return data?.step2Completed === true;
  });

  constructor() {
    // 🔧 關鍵修復：確保服務初始化時的狀態一致性
    this.initializeFromStorage();
    
    // 監聽 storage 事件，處理多標籤頁同步
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Signal effect：監聽狀態變化並同步到 storage
    effect(() => {
      if (this.isInitialized) {
        const currentStep = this._currentStep();
        this.saveStepToStorage(currentStep);
      }
    });
  }

  // 📤 數據操作方法

  /**
   * 🔧 關鍵修復：從 sessionStorage 初始化所有狀態
   * 確保在任何操作前都有正確的狀態
   */
  private initializeFromStorage(): void {
    try {
      // 1. 讀取表單數據
      const storedData = this.loadDataFromStorage();
      if (storedData) {
        this._formData.set(storedData);
      }

      // 2. 讀取並驗證步驟
      const storedStep = this.loadStepFromStorage();
      let validatedStep = storedStep;

      // 🔧 關鍵：基於數據存在性驗證步驟
      if (storedStep === 2) {
        if (!storedData || !this.isFormDataComplete(storedData)) {
          console.warn('⚠️ Step 2 in storage but form data incomplete, resetting to step 1');
          validatedStep = 1;
          this.saveStepToStorage(1);
        } else {
          // 步驟2且數據完整，恢復 OTP 發送狀態
          this._otpSent.set(true);
          console.log('✅ Step 2 validated with complete form data');
        }
      }

      this._currentStep.set(validatedStep);
      
      // 3. 標記初始化完成
      this.isInitialized = true;
      sessionStorage.setItem(this.INIT_FLAG_KEY, 'true');
      
      console.log('🚀 RegistrationStateService initialized:', {
        hasFormData: !!storedData,
        currentStep: validatedStep,
        otpSent: this._otpSent()
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize from storage:', error);
      this.resetToDefaults();
    }
  }

  /**
   * 重置到預設狀態
   */
  private resetToDefaults(): void {
    this._formData.set(null);
    this._currentStep.set(1);
    this._isLoading.set(false);
    this._errors.set([]);
    this._otpSent.set(false);
    this._otpCountdown.set(0);
    this.isInitialized = true;
    this.clearStorage();
  }

  /**
   * 🔧 新增：處理 storage 變化事件（多標籤頁同步）
   */
  private handleStorageChange(event: StorageEvent): void {
    if (event.key === this.STORAGE_KEY || event.key === this.STEP_KEY) {
      console.log('🔄 Storage changed, re-initializing...');
      this.initializeFromStorage();
    }
  }

  /**
   * 🔧 新增：強制從 storage 同步狀態（供守衛使用）
   */
  public syncFromStorage(): void {
    if (!this.isSyncing) {
      this.initializeFromStorage();
    }
  }

  /**
   * 🔧 新增：檢查當前狀態是否已正確初始化
   */
  public isStateValid(): boolean {
    const currentStep = this._currentStep();
    const formData = this._formData();
    
    if (currentStep === 2) {
      return formData !== null && this.isFormDataComplete(formData);
    }
    
    return true; // 步驟1總是有效的
  }

  /**
   * 更新表單數據
   */
  updateFormData(updates: Partial<RegisterFormData>): void {
    if (this.isSyncing) return;

    try {
      this.isSyncing = true;

      const current = this._formData() || {} as RegisterFormData;
      const updated = { ...current, ...updates };

      this._formData.set(updated);
      this.saveDataToStorage(updated);

      console.log('✅ Form data updated:', updates);
    } catch (error) {
      console.error('❌ Failed to update form data:', error);
      this.addError('數據更新失敗');
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 完成步驟1 - 基本資料
   */
  completeStep1(formData: RegisterFormData): void {
    this.updateFormData({
      ...formData,
      step1Completed: true,
      step1CompletedAt: new Date().toISOString()
    });
    this.setCurrentStep(2);
  }

  /**
   * 完成步驟2 - OTP驗證
   */
  completeStep2(otpCode: string): void {
    this.updateFormData({
      otpCode,
      step2Completed: true,
      step2CompletedAt: new Date().toISOString()
    });
  }

  /**
   * 設置當前步驟
   */
  setCurrentStep(step: number): void {
    if (step !== this._currentStep()) {
      this._currentStep.set(step);
      this.saveStepToStorage(step);
      console.log('✅ Step updated to:', step);
    }
  }

  /**
   * 設置 OTP 已發送狀態
   */
  setOtpSent(sent: boolean, countdown: number = 300): void {
    this._otpSent.set(sent);
    this._otpCountdown.set(countdown);
    
    if (sent) {
      this.startCountdown(countdown);
    }
  }

  /**
   * 設置載入狀態
   */
  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  /**
   * 添加錯誤訊息
   */
  addError(error: string): void {
    const currentErrors = this._errors();
    this._errors.set([...currentErrors, error]);
  }

  /**
   * 清除錯誤訊息
   */
  clearErrors(): void {
    this._errors.set([]);
  }

  /**
   * 清除所有數據
   */
  clearAll(): void {
    this._formData.set(null);
    this._currentStep.set(1);
    this._isLoading.set(false);
    this._errors.set([]);
    this._otpSent.set(false);
    this._otpCountdown.set(0);
    
    this.clearStorage();
    console.log('✅ All data cleared');
  }

  /**
   * 重置到步驟1
   */
  resetToStep1(): void {
    this._currentStep.set(1);
    this._otpSent.set(false);
    this._otpCountdown.set(0);
    this.clearErrors();
    this.saveStepToStorage(1);
  }

  // 🔄 Session Storage 操作

  private loadDataFromStorage(): RegisterFormData | null {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('❌ Failed to load data from storage:', error);
      return null;
    }
  }

  private saveDataToStorage(data: RegisterFormData): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('❌ Failed to save data to storage:', error);
    }
  }

  private loadStepFromStorage(): number {
    try {
      const stored = sessionStorage.getItem(this.STEP_KEY);
      const step = stored ? parseInt(stored) : 1;
      return Math.max(1, Math.min(2, step)); // 確保步驟在有效範圍內
    } catch (error) {
      console.error('❌ Failed to load step from storage:', error);
      return 1;
    }
  }

  private saveStepToStorage(step: number): void {
    try {
      sessionStorage.setItem(this.STEP_KEY, step.toString());
    } catch (error) {
      console.error('❌ Failed to save step to storage:', error);
    }
  }

  private clearStorage(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
      sessionStorage.removeItem(this.STEP_KEY);
      sessionStorage.removeItem(this.INIT_FLAG_KEY);
    } catch (error) {
      console.error('❌ Failed to clear storage:', error);
    }
  }

  // ⏰ 倒數計時功能

  private countdownTimer?: number;

  private startCountdown(seconds: number): void {
    this.clearCountdown();
    
    this.countdownTimer = window.setInterval(() => {
      const current = this._otpCountdown();
      if (current > 0) {
        this._otpCountdown.set(current - 1);
      } else {
        this.clearCountdown();
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
    }
  }

  /**
   * 檢查表單數據是否完整（用於步驟驗證）
   */
  private isFormDataComplete(formData: any): boolean {
    if (!formData) return false;

    // 檢查必要欄位
    const requiredFields = ['idNumber', 'name', 'phoneNumber', 'email'];
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        return false;
      }
    }

    // 檢查巢狀物件
    if (!formData.birthDate?.year || !formData.birthDate?.month || !formData.birthDate?.day) {
      return false;
    }

    if (!formData.address?.city || !formData.address?.district || !formData.address?.detail) {
      return false;
    }

    return true;
  }

  /**
   * 檢查是否可以重新發送 OTP
   */
  canResendOtp(): boolean {
    return this._otpCountdown() === 0 && this._otpSent();
  }

  /**
   * 格式化倒數計時顯示
   */
  formatCountdown(): string {
    const seconds = this._otpCountdown();
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // 🧹 清理資源
  destroy(): void {
    this.clearCountdown();
    window.removeEventListener('storage', this.handleStorageChange.bind(this));
  }
}
