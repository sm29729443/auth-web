import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  RegisterFormData,
  OtpVerifyData,
  ApiResponse,
  SendOtpResponse,
  VerifyOtpResponse
} from '../models/register.model';

/**
 * 註冊相關的 API 服務
 */
@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  /** API 基礎 URL */
  private readonly apiUrl = 'http://localhost:8080/b2c-auth-api/api';

  constructor(private http: HttpClient) { }

  /**
   * 發送註冊資料並取得 OTP
   * @param formData 註冊表單資料
   * @returns Observable<ApiResponse<SendOtpResponse>>
   */
  sendRegistrationData(formData: RegisterFormData): Observable<ApiResponse<SendOtpResponse>> {
    // 模擬 API 呼叫，實際應該呼叫後端的 /send-otp 端點
    const mockResponse: ApiResponse<SendOtpResponse> = {
      success: true,
      message: '驗證碼已發送至您的手機',
      data: {
        otpSent: true,
        countdown: 300 // 300 秒倒數
      }
    };

    // 模擬網路延遲
    return of(mockResponse).pipe(delay(1000));

    // 實際的 HTTP 呼叫應該是：
    // return this.http.post<ApiResponse<SendOtpResponse>>(`${this.apiUrl}/send-otp`, {
    //   idNumber: formData.idNumber,
    //   phoneNumber: formData.phoneNumber,
    //   name: formData.name,
    //   email: formData.email
    // });
  }

  /**
   * 驗證 OTP 並完成註冊
   * @param otpData OTP 驗證資料
   * @param formData 註冊表單資料
   * @returns Observable<ApiResponse<VerifyOtpResponse>>
   */
  verifyOtpAndRegister(
    otpData: OtpVerifyData,
    formData: RegisterFormData
  ): Observable<ApiResponse<VerifyOtpResponse>> {

    // 模擬 OTP 驗證邏輯
    const isValidOtp = otpData.otpCode === '123456'; // 模擬驗證碼
    console.log('確認驗證資訊:', formData, otpData);
    if (!isValidOtp) {
      const errorResponse: ApiResponse<VerifyOtpResponse> = {
        success: false,
        message: '驗證碼錯誤，請重新輸入',
        errorCode: 'INVALID_OTP'
      };
      return throwError(() => errorResponse).pipe(delay(500));
    }

    const successResponse: ApiResponse<VerifyOtpResponse> = {
      success: true,
      message: '註冊成功！',
      data: {
        verified: true,
        userId: 'user_' + Date.now(),
        redirectUrl: '/success'
      }
    };

    return of(successResponse).pipe(delay(1000));

    // 實際的 HTTP 呼叫應該是：
    // return this.http.post<ApiResponse<VerifyOtpResponse>>(`${this.apiUrl}/register`, {
    //   ...formData,
    //   otpCode: otpData.otpCode
    // });
  }

  /**
   * 重新發送 OTP
   * @param phoneNumber 手機號碼
   * @returns Observable<ApiResponse<SendOtpResponse>>
   */
  resendOtp(phoneNumber: string): Observable<ApiResponse<SendOtpResponse>> {
    const mockResponse: ApiResponse<SendOtpResponse> = {
      success: true,
      message: '驗證碼已重新發送',
      data: {
        otpSent: true,
        countdown: 60
      }
    };

    return of(mockResponse).pipe(delay(800));

    // 實際的 HTTP 呼叫應該是：
    // return this.http.post<ApiResponse<SendOtpResponse>>(`${this.apiUrl}/resend-otp`, {
    //   phoneNumber
    // });
  }

  /**
   * 驗證台灣身分證字號
   * @param idNumber 身分證字號
   * @returns 是否有效
   */
  validateTaiwanId(idNumber: string): boolean {
    if (!idNumber || !/^[A-Z][12][0-9]{8}$/.test(idNumber)) {
      return false;
    }

    const cityMapping: { [key: string]: number } = {
      'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15,
      'G': 16, 'H': 17, 'I': 34, 'J': 18, 'K': 19, 'L': 20,
      'M': 21, 'N': 22, 'O': 35, 'P': 23, 'Q': 24, 'R': 25,
      'S': 26, 'T': 27, 'U': 28, 'V': 29, 'W': 32, 'X': 30,
      'Y': 31, 'Z': 33
    };

    const cityCode = cityMapping[idNumber[0]];
    if (!cityCode) return false;

    const cityTens = Math.floor(cityCode / 10);
    const cityOnes = cityCode % 10;

    let sum = cityTens * 1 + cityOnes * 9;

    for (let i = 1; i < 9; i++) {
      sum += parseInt(idNumber[i]) * (9 - i);
    }

    const remainder = sum % 10;
    const expectedCheckDigit = remainder === 0 ? 0 : 10 - remainder;

    return expectedCheckDigit === parseInt(idNumber[9]);
  }

  /**
   * 驗證台灣手機號碼
   * @param phoneNumber 手機號碼
   * @returns 是否有效
   */
  validateTaiwanPhone(phoneNumber: string): boolean {
    return /^09[0-9]{8}$/.test(phoneNumber);
  }
  /**
 * 取得所有縣市列表
 * @returns Observable<ApiResponse<string[]>>
 */
  getCities(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/cities`);

    // 模擬回應格式：
    // {
    //   success: true,
    //   message: "縣市列表取得成功",
    //   data: ['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市', ...]
    // }
  }

  /**
   * 根據縣市取得區域列表
   * @param cityName 縣市名稱
   * @returns Observable<ApiResponse<string[]>>
   */
  getDistricts(cityName: string): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/public/address/districts`, {
      params: { city: cityName }
    });

    // 模擬回應格式：
    // {
    //   success: true,
    //   message: "區域列表取得成功",
    //   data: ['中正區', '大同區', '中山區', '松山區', ...]
    // }
  }
}
