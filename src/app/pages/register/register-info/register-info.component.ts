import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { RegisterService } from '../../../services/register.service';
import { RegistrationStateService } from '../../../services/registration-state.service';
import { TokenService } from '../../../services/token.service';
import { RegisterFormData } from '../../../models/register.model';
import { CustomValidators } from '../../../validators/custom-validators';
import { PhoneConfirmDialogComponent } from '../../../components/phone-confirm-dialog/phone-confirm-dialog.component';

/**
 * 註冊步驟1：基本資料輸入組件
 */
@Component({
  selector: 'app-register-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-info.component.html',
  styleUrl: './register-info.component.css'
})
export class RegisterInfoComponent implements OnInit, OnDestroy {

  /** 基本資料表單 */
  registerForm!: FormGroup;

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
  cities = [
    '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
    '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣',
    '屏東縣', '宜蘭縣', '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣',
    '基隆市', '新竹市', '嘉義市'
  ];

  /** 區域選項 */
  currentDistricts: string[] = [];

  /** 銷毀訂閱 */
  private destroy$ = new Subject<void>();

  // 🔄 注入服務
  private fb = inject(FormBuilder);
  private registerService = inject(RegisterService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private tokenService = inject(TokenService);
  public registrationState = inject(RegistrationStateService);

  constructor() {
    this.initializeDateOptions();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCities();
    this.restoreFormData();
    this.checkTokenAvailability();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 初始化表單
   */
  private initializeForm(): void {
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
  }

  /**
   * 恢復已保存的表單數據
   */
  private restoreFormData(): void {
    const savedData = this.registrationState.formData();
    if (savedData) {
      this.registerForm.patchValue(savedData);
      console.log('✅ Form data restored:', savedData);
      
      // 如果有城市，載入對應的區域
      if (savedData.address?.city) {
        this.loadDistricts(savedData.address.city);
      }
    }
  }

  /**
   * 檢查 token 可用性
   */
  private checkTokenAvailability(): void {
    const hasToken = this.tokenService.hasToken();
    
    if (hasToken) {
      console.log('✅ Token available in RegisterInfoComponent');
      
      if (this.tokenService.isValidAuthScope()) {
        console.log('✅ Token scope is valid for AUTH');
      } else {
        console.warn('⚠️ Token scope is not AUTH');
      }
    } else {
      console.warn('⚠️ No token found - registration may fail');
    }
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

      const currentDay = birthDateGroup?.get('day')?.value;
      if (currentDay && parseInt(currentDay) > daysInMonth) {
        birthDateGroup?.get('day')?.setValue('');
      }
    }
  }

  /**
   * 當城市改變時，載入對應的區域選項
   */
  onCityChange(): void {
    const city = this.registerForm.get('address.city')?.value;

    if (city) {
      this.registerForm.get('address.district')?.setValue('');
      this.currentDistricts = [];
      this.loadDistricts(city);
    } else {
      this.currentDistricts = [];
      this.registerForm.get('address.district')?.setValue('');
    }
  }

  /**
   * 提交表單 - 進入下一步驟
   */
  onSubmit(): void {
    this.isFormSubmitted = true;
    this.registrationState.clearErrors();

    if (this.registerForm.valid) {
      this.openPhoneConfirmDialog();
    } else {
      this.markFormGroupTouched(this.registerForm);
      this.registrationState.addError('請檢查表單中的錯誤訊息');
    }
  }



  /**
   * 開啟手機號碼確認對話框
   */
  private openPhoneConfirmDialog(): void {
    const phoneNumber = this.registerForm.get('phoneNumber')?.value;

    const dialogRef = this.dialog.open(PhoneConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: { phoneNumber }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.proceedToNextStep();
      }
    });
  }

  /**
   * 進入下一步驟
   */
  private proceedToNextStep(): void {
    this.registrationState.setLoading(true);

    const formData: RegisterFormData = this.registerForm.value;

    // 發送註冊數據並取得 OTP
    this.registerService.sendRegistrationData(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.registrationState.setLoading(false);
          
          if (response.success && response.data) {
            // 完成步驟1並保存數據
            this.registrationState.completeStep1(formData);
            
            // 設置 OTP 已發送狀態
            this.registrationState.setOtpSent(true, response.data.countdown);
            
            // 導航到步驟2
            this.router.navigate(['/register/verify']);
          }
        },
        error: (error) => {
          this.registrationState.setLoading(false);
          this.registrationState.addError(error.message || '發送驗證碼失敗，請稍後再試');
        }
      });
  }

  /**
   * 載入縣市列表
   */
  private loadCities(): void {
    this.isLoadingCities = true;
    
    if (this.isLoadingCities) {
      this.registerForm.get('address.city')?.disable();
    }

    this.registerService.getCities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingCities = false;
          this.registerForm.get('address.city')?.enable();
          
          if (response.success && response.data) {
            this.cities = response.data;
          } else {
            console.error('載入縣市失敗:', response.message);
          }
        },
        error: (error) => {
          this.isLoadingCities = false;
          this.registerForm.get('address.city')?.enable();
          console.error('載入縣市發生錯誤:', error);
        }
      });
  }

  /**
   * 載入指定縣市的區域列表
   */
  private loadDistricts(cityName: string): void {
    this.isLoadingDistricts = true;
    
    if (this.isLoadingDistricts) {
      this.registerForm.get('address.district')?.disable();
    }

    this.registerService.getDistricts(cityName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingDistricts = false;
          this.registerForm.get('address.district')?.enable();
          
          if (response.success && response.data) {
            this.currentDistricts = response.data;
          } else {
            console.error('載入區域失敗:', response.message);
            this.currentDistricts = [];
          }
        },
        error: (error) => {
          this.isLoadingDistricts = false;
          this.registerForm.get('address.district')?.enable();
          console.error('載入區域發生錯誤:', error);
          this.currentDistricts = [];
        }
      });
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
    const control = this.registerForm.get(controlName);

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
      'email': '電子信箱為必填項目'
    };

    return messages[controlName] || '此欄位為必填項目';
  }

  /**
   * 檢查表單控制項是否有錯誤且已被觸碰
   */
  hasError(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!(control && control.invalid && (control.touched || this.isFormSubmitted));
  }

  /**
   * 取得目前選擇城市的區域列表
   */
  getCurrentDistricts(): string[] {
    return this.currentDistricts.length > 0 ? this.currentDistricts : ['測試區1', '測試區2', '測試區3'];
  }

  /**
   * 回到上一頁
   */
  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/']);
    }
  }
}
