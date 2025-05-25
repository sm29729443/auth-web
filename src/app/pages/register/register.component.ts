import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { RegisterService } from '../../services/register.service';
import { RegisterFormData, OtpVerifyData } from '../../models/register.model';
import { CustomValidators } from '../../validators/custom-validators';

/**
 * 註冊主組件 - 包含兩個步驟：基本資料輸入和 OTP 驗證
 * 使用 Angular 19 新語法
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit, OnDestroy {

  /** 目前步驟 (1: 基本資料, 2: OTP驗證) */
  currentStep: number = 1;

  /** 基本資料表單 */
  registerForm!: FormGroup;

  /** OTP 驗證表單 */
  otpForm!: FormGroup;

  /** 載入狀態 */
  isLoading = false;

  /** 錯誤訊息 */
  errorMessage = '';

  /** 成功訊息 */
  successMessage = '';

  /** OTP 倒數計時 */
  otpCountdown = 1;

  /** 倒數計時器 */
  private countdownTimer?: number;

  /** 是否可以重新發送 OTP */
  canResendOtp = false;

  /** 是否已嘗試提交表單 */
  isFormSubmitted = false;

  /** 年份選項 */
  years: string[] = [];

  /** 月份選項 */
  months: string[] = [];

  /** 日期選項 */
  days: string[] = [];

  /** 縣市載入狀態 */
  isLoadingCities = false;

  /** 區域載入狀態 */
  isLoadingDistricts = false;

  /** 縣市選項 */
  // 到時候改成 call 後端動態載入
  cities = [
    '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
    '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣',
    '屏東縣', '宜蘭縣', '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣',
    '基隆市', '新竹市', '嘉義市'
  ];

  /** 區域選項 */
  // 到時候改成 call 後端動態載入
    /** 區域選項 - 改為動態載入 */
  currentDistricts: string[] = [];
  districts: { [key: string]: string[] } = {
    '台北市': ['中正區', '大同區', '中山區', '松山區', '大安區', '萬華區', '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'],
    '新北市': ['板橋區', '三重區', '中和區', '永和區', '新莊區', '新店區', '樹林區', '鶯歌區', '三峽區', '淡水區', '汐止區', '瑞芳區', '土城區', '蘆洲區', '五股區', '泰山區', '林口區', '深坑區', '石碇區', '坪林區', '三芝區', '石門區', '八里區', '平溪區', '雙溪區', '貢寮區', '金山區', '萬里區', '烏來區'],
    '桃園市': ['桃園區', '中壢區', '大溪區', '楊梅區', '蘆竹區', '大園區', '龜山區', '八德區', '龍潭區', '平鎮區', '新屋區', '觀音區', '復興區'],
    '台中市': ['中區', '東區', '南區', '西區', '北區', '西屯區', '南屯區', '北屯區', '豐原區', '東勢區', '大甲區', '清水區', '沙鹿區', '梧棲區', '后里區', '神岡區', '潭子區', '大雅區', '新社區', '石岡區', '外埔區', '大安區', '烏日區', '大肚區', '龍井區', '霧峰區', '太平區', '大里區', '和平區']
  };

  /** 銷毀訂閱 */
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    public router: Router, // 加上 public 讓模板可以訪問
    private route: ActivatedRoute
  ) {
    this.initializeDateOptions();
  }

  ngOnInit(): void {
    this.initializeForms();
    this.loadCities(); // 載入縣市列表
    this.checkTokenFromUrl();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearCountdownTimer();
  }

  /**
   * 初始化表單
   */
  private initializeForms(): void {
    // 基本資料表單
    this.registerForm = this.fb.group({
      idNumber: ['', [
        Validators.required,
        CustomValidators.taiwanId()
      ]],
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(20)
      ]],
      birthDate: this.fb.group({
        year: ['', Validators.required],
        month: ['', Validators.required],
        day: ['', Validators.required]
      }, { validators: CustomValidators.minimumAge(18) }),
      address: this.fb.group({
        city: ['', Validators.required],
        district: ['', Validators.required],
        detail: ['', [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(20)
        ]]
      }),
      phoneNumber: ['', [
        Validators.required,
        CustomValidators.taiwanPhone()
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]]
    });

    // OTP 驗證表單
    this.otpForm = this.fb.group({
      otpCode: ['', [
        Validators.required,
        CustomValidators.otpCode(6)
      ]]
    });
  }

  /**
   * 初始化日期選項
   */
  private initializeDateOptions(): void {
    const currentYear = new Date().getFullYear();

    // 生成年份選項 (目前年份往前100年)
    for (let year = currentYear; year >= currentYear - 100; year--) {
      this.years.push(year.toString());
    }

    // 生成月份選項
    for (let month = 1; month <= 12; month++) {
      this.months.push(month.toString().padStart(2, '0'));
    }

    // 生成日期選項 (預設31天，後續根據年月動態調整)
    for (let day = 1; day <= 31; day++) {
      this.days.push(day.toString().padStart(2, '0'));
    }
  }

  /**
   * 檢查 URL 中的 token 參數
   */
  private checkTokenFromUrl(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        // 將 token 儲存到 sessionStorage
        sessionStorage.setItem('authToken', token);
        console.log('Token saved from URL:', token);

        // 清除 URL 中的 token 參數
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });
  }

  /**
   * 當年份或月份改變時，動態調整日期選項
   */
  onDateChange(): void {
    const birthDateGroup = this.registerForm.get('birthDate');
    const year = birthDateGroup?.get('year')?.value;
    const month = birthDateGroup?.get('month')?.value;

    if (year && month) {
      const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
      this.days = [];
      for (let day = 1; day <= daysInMonth; day++) {
        this.days.push(day.toString().padStart(2, '0'));
      }

      // 如果當前選擇的日期超過該月的天數，重置日期
      const currentDay = birthDateGroup?.get('day')?.value;
      if (currentDay && parseInt(currentDay) > daysInMonth) {
        birthDateGroup?.get('day')?.setValue('');
      }
    }
  }

  /**
   * 當城市改變時，更新區域選項
   */
  // onCityChange(): void {
  //   const city = this.registerForm.get('address.city')?.value;
  //   if (city) {
  //     // 重置區域選擇
  //     this.registerForm.get('address.district')?.setValue('');
  //   }
  // }

  /**
   * 取得目前選擇城市的區域列表
   */
  // getCurrentDistricts(): string[] {
  //   const city = this.registerForm.get('address.city')?.value;
  //   return this.districts[city] || [];
  // }

  /**
   * 進入下一步驟 - 發送 OTP
   */
  nextStep(): void {
    this.isFormSubmitted = true; // 標記表單已提交

    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData: RegisterFormData = this.registerForm.value;

      this.registerService.sendRegistrationData(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.success && response.data) {
              this.currentStep = 2;
              this.successMessage = response.message;
              this.startOtpCountdown(response.data.countdown);
            }
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || '發送驗證碼失敗，請稍後再試';
          }
        });
    } else {
      this.markFormGroupTouched(this.registerForm);
    }
  }

  /**
   * 回到上一步驟
   */
  previousStep(): void {
    this.currentStep = 1;
    this.clearMessages();
    this.clearCountdownTimer();
  }

  /**
   * 完成註冊 - 驗證 OTP
   */
  completeRegistration(): void {
    if (this.otpForm.valid && this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const otpData: OtpVerifyData = {
        otpCode: this.otpForm.get('otpCode')?.value,
        phoneNumber: this.registerForm.get('phoneNumber')?.value
      };

      const formData: RegisterFormData = this.registerForm.value;

      this.registerService.verifyOtpAndRegister(otpData, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.success && response.data) {
              this.successMessage = response.message;

              // 註冊成功後跳轉
              setTimeout(() => {
                if (response.data?.redirectUrl) {
                  this.router.navigate([response.data.redirectUrl]);
                } else {
                  this.router.navigate(['/success']);
                }
              }, 2000);
            }
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || '驗證失敗，請重新輸入驗證碼';
          }
        });
    } else {
      this.markFormGroupTouched(this.otpForm);
    }
  }

  /**
   * 重新發送 OTP
   */
  resendOtp(): void {
    if (!this.canResendOtp) return;

    this.isLoading = true;
    const phoneNumber = this.registerForm.get('phoneNumber')?.value;

    this.registerService.resendOtp(phoneNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.data) {
            this.successMessage = response.message;
            this.startOtpCountdown(response.data.countdown);
            this.otpForm.get('otpCode')?.setValue('');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || '重新發送失敗，請稍後再試';
        }
      });
  }

  /**
   * 開始 OTP 倒數計時
   */
  private startOtpCountdown(seconds: number): void {
    this.otpCountdown = seconds;
    this.canResendOtp = false;
    this.clearCountdownTimer();

    this.countdownTimer = window.setInterval(() => {
      this.otpCountdown--;

      if (this.otpCountdown <= 0) {
        this.canResendOtp = true;
        this.clearCountdownTimer();
      }
    }, 1000);
  }

  /**
   * 清除倒數計時器
   */
  private clearCountdownTimer(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
    }
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
   * 清除訊息
   */
  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * 取得表單控制項的錯誤訊息
   */
  getErrorMessage(controlName: string, formGroup: FormGroup = this.registerForm): string {
    const control = formGroup.get(controlName);

    if (control && control.invalid && control.touched) {
      const errors = control.errors;

      if (errors?.['required']) {
        return this.getRequiredMessage(controlName);
      }

      if (errors?.['email']) {
        return '電子信箱格式不正確';
      }

      if (errors?.['minlength']) {
        return `最少需要 ${errors['minlength'].requiredLength} 個字元`;
      }

      if (errors?.['maxlength']) {
        return `最多只能 ${errors['maxlength'].requiredLength} 個字元`;
      }

      if (errors?.['taiwanId']) {
        return errors['taiwanId'].message;
      }

      if (errors?.['taiwanPhone']) {
        return errors['taiwanPhone'].message;
      }

      if (errors?.['minimumAge']) {
        return errors['minimumAge'].message;
      }

      if (errors?.['otpCode']) {
        return errors['otpCode'].message;
      }
    }

    return '';
  }

  /**
   * 取得必填欄位的錯誤訊息
   */
  private getRequiredMessage(controlName: string): string {
    const messages: { [key: string]: string } = {
      'idNumber': '身分證字號為必填項目',
      'name': '姓名為必填項目',
      'birthDate.year': '出生年份為必填項目',
      'birthDate.month': '出生月份為必填項目',
      'birthDate.day': '出生日期為必填項目',
      'address.city': '縣市為必填項目',
      'address.district': '鄉鎮市區為必填項目',
      'address.detail': '詳細地址為必填項目',
      'phoneNumber': '手機號碼為必填項目',
      'email': '電子信箱為必填項目',
      'otpCode': '驗證碼為必填項目'
    };

    return messages[controlName] || '此欄位為必填項目';
  }

  /**
   * 檢查表單控制項是否有錯誤且已被觸碰
   */
  hasError(controlName: string, formGroup: FormGroup = this.registerForm): boolean {
    const control = formGroup.get(controlName);

    // 如果表單已提交或欄位被觸碰，且欄位無效，就顯示錯誤
    return !!(control && control.invalid && (control.touched || this.isFormSubmitted));
  }

  /**
   * 格式化倒數計時顯示
   */
  formatCountdown(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  /**
 * 回到上一頁 - 使用瀏覽器歷史記錄
 */
  goBack(): void {
    // 檢查是否有上一頁歷史記錄
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // 如果沒有歷史記錄，導向首頁
      this.router.navigate(['/']);
    }
  }

  /**
     * 載入縣市列表
     */
  private loadCities(): void {
    this.isLoadingCities = true;

    this.registerService.getCities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingCities = false;
          if (response.success && response.data) {
            this.cities = response.data;
          } else {
            console.error('載入縣市失敗:', response.message);
            // 可以顯示錯誤訊息或使用預設值
            this.cities = ['台北市', '新北市']; // 備用選項
          }
        },
        error: (error) => {
          this.isLoadingCities = false;
          console.error('載入縣市發生錯誤:', error);
          // 使用預設縣市列表作為備用
          this.cities = ['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市'];
        }
      });
  }

  /**
   * 當城市改變時，載入對應的區域選項
   */
  onCityChange(): void {
    const city = this.registerForm.get('address.city')?.value;

    if (city) {
      // 重置區域選擇
      this.registerForm.get('address.district')?.setValue('');
      this.currentDistricts = [];

      // 載入新的區域列表
      this.loadDistricts(city);
    } else {
      // 如果沒有選擇縣市，清空區域選項
      this.currentDistricts = [];
      this.registerForm.get('address.district')?.setValue('');
    }
  }

  /**
   * 載入指定縣市的區域列表
   * @param cityName 縣市名稱
   */
  private loadDistricts(cityName: string): void {
    this.isLoadingDistricts = true;
    // 正式用這個
    this.registerService.getDistricts(cityName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingDistricts = false;
          if (response.success && response.data) {
            this.currentDistricts = response.data;
          } else {
            console.error('載入區域失敗:', response.message);
            this.currentDistricts = [];
          }
        },
        error: (error) => {
          this.isLoadingDistricts = false;
          console.error('載入區域發生錯誤:', error);
          this.currentDistricts = [];
        }
      });

  }

  /**
   * 取得目前選擇城市的區域列表 - 修改為使用動態載入的資料
   */
  getCurrentDistricts(): string[] {
    return this.currentDistricts;
  }
}