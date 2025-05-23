import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

// Angular Material 組件
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-otp-verify',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './otp-verify.component.html',
  styleUrls: ['./otp-verify.component.css']
})
export class OTPVerifyComponent implements OnInit, OnDestroy {
  // 服務注入
  protected authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // OTP 表單
  protected otpForm: FormGroup;

  // 倒數計時器的 signal
  protected countdown = signal<number>(0);
  private countdownInterval?: any;

  constructor() {
    // 初始化 OTP 表單
    this.otpForm = this.fb.group({
      otp: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{6}$/) // 6位數字
      ]]
    });
  }

  ngOnInit(): void {
    // 開始倒數計時（60秒）
    this.startCountdown(60);
  }

  ngOnDestroy(): void {
    // 清除計時器
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  /**
   * 取得遮罩後的手機號碼
   */
  protected getMaskedPhone(): string {
    const phone = this.authService.registerForm().phone;
    if (!phone) return '***';
    
    // 顯示前3位和後2位，中間用星號遮蔽
    return `${phone.substring(0, 3)}****${phone.substring(8)}`;
  }



  /**
   * 重新發送 OTP
   */
  protected resendOtp(): void {
    this.authService.sendOtp().subscribe({
      next: (response) => {
        if (response.success) {
          // 重新開始倒數計時
          this.startCountdown(60);
          // 清空 OTP 輸入
          this.otpForm.get('otp')?.setValue('');
        }
      },
      error: (error) => {
        console.error('重新發送 OTP 失敗:', error);
      }
    });
  }

  /**
   * 開始倒數計時
   */
  private startCountdown(seconds: number): void {
    this.countdown.set(seconds);
    
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    
    this.countdownInterval = setInterval(() => {
      const current = this.countdown();
      if (current > 0) {
        this.countdown.set(current - 1);
      } else {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  /**
   * 取得註冊資料
   */
  protected getRegistrationData() {
    return this.authService.registerForm();
  }

  /**
   * 取得遮罩後的身份證字號
   */
  protected getMaskedIdNumber(): string {
    const idNumber = this.authService.registerForm().idNumber;
    if (!idNumber) return '***';
    
    // 顯示前2位和後2位，中間用星號遮蔽
    return `${idNumber.substring(0, 2)}******${idNumber.substring(8)}`;
  }


  /**
   * 取得格式化後的地址
   */
  protected getFormattedAddress(): string {
    const data = this.authService.registerForm();
    if (!data.city || !data.district) return '---';
    
    // 這裡需要將 city 和 district 的 value 轉換為中文显示
    // 可以從 TAIWAN_CITIES 中找到對應的中文名稱
    return this.getCityDistrictName(data.city, data.district);
  }

  /**
   * 取得縣市區域的中文名稱
   */
  private getCityDistrictName(cityValue: string, districtValue: string): string {
    // 這裡應該從 TAIWAN_CITIES 中查找，但為了簡化先用假資料
    const cityMap: { [key: string]: string } = {
      'taipei': '台北市',
      'newtaipei': '新北市',
      'taoyuan': '桃園市',
      'taichung': '台中市',
      'tainan': '台南市',
      'kaohsiung': '高雄市'
    };
    
    const districtMap: { [key: string]: string } = {
      // 台北市
      'zhongzheng': '中正區',
      'datong': '大同區',
      'zhongshan': '中山區',
      'songshan': '松山區',
      'daan': '大安區',
      'wanhua': '萬華區',
      'xinyi': '信義區',
      'shilin': '士林區',
      'beitou': '北投區',
      'neihu': '內湖區',
      'nangang': '南港區',
      'wenshan': '文山區',
      // 新北市
      'banqiao': '板橋區',
      'sanchong': '三重區',
      'xinzhuang': '新莊區',
      'yonghe': '永和區',
      'zhonghe': '中和區',
      'tucheng': '土城區',
      'luzhou': '蘆洲區',
      'wugu': '五股區',
      'taishan': '泰山區',
      'linkou': '林口區',
      // 其他縣市的區域...
    };
    
    const cityName = cityMap[cityValue] || cityValue;
    const districtName = districtMap[districtValue] || districtValue;
    
    return `${cityName} ${districtName}`;
  }

  /**
   * 取得遮罩後的電子郵件
   */
  protected getMaskedEmail(): string {
    const email = this.authService.registerForm().email;
    if (!email) return '***';
    
    const [username, domain] = email.split('@');
    if (!username || !domain) return '***';
    
    // 顯示前2位和域名，中間用星號遮蔽
    const maskedUsername = username.length > 2 
      ? `${username.substring(0, 2)}***`
      : '***';
    
    return `${maskedUsername}@${domain}`;
  }
}

/*
===== OtpVerificationComponent 說明 =====

1. **Signal 使用**:
   - countdown signal 管理倒數計時狀態
   - 自動更新 UI 顯示

2. **用戶體驗**:
   - 顯示遮罩後的聯絡方式
   - 倒數計時器防止濫發
   - 重新發送功能
   - 返回上一步功能

3. **OTP 處理**:
   - 6位數字驗證
   - 自動完成屬性
   - 大字體輸入框
   - 字母間距增加可讀性

4. **流程整合**:
   - 驗證成功後自動完成註冊
   - 與 AuthService 狀態同步
   - 錯誤處理

5. **記憶體管理**:
   - ngOnDestroy 清除計時器
   - 避免記憶體洩漏
*/
