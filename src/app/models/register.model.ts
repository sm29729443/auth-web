/**
 * 註冊相關的資料模型
 */

/** 註冊表單資料 */
export interface RegisterFormData {
  /** 身分證字號 */
  idNumber: string;
  /** 姓名 */
  name: string;
  /** 生日 */
  birthDate: {
    year: string;
    month: string;
    day: string;
  };
  /** 地址 */
  address: {
    city: string;
    district: string;
    detail: string;
  };
  /** 手機號碼 */
  phoneNumber: string;
  /** 電子信箱 */
  email: string;
  
  // 🆕 新增步驟控制相關屬性
  /** 步驟1是否完成 */
  step1Completed?: boolean;
  /** 步驟1完成時間 */
  step1CompletedAt?: string;
  /** 步驟2是否完成 */
  step2Completed?: boolean;
  /** 步驟2完成時間 */
  step2CompletedAt?: string;
  /** OTP驗證碼 */
  otpCode?: string;
}

/** OTP 驗證資料 */
export interface OtpVerifyData {
  /** 驗證碼 */
  otpCode: string;
  /** 手機號碼 */
  phoneNumber: string;
}

/** API 回應格式 */
export interface ApiResponse<T = any> {
  /** 是否成功 */
  success: boolean;
  /** 回應訊息 */
  message: string;
  /** 回應資料 */
  data?: T;
  /** 錯誤代碼 */
  errorCode?: string;
}

/** 發送 OTP 回應 */
export interface SendOtpResponse {
  /** 是否成功發送 */
  otpSent: boolean;
  /** 倒數時間（秒） */
  countdown: number;
}

/** 驗證 OTP 回應 */
export interface VerifyOtpResponse {
  /** 是否驗證成功 */
  verified: boolean;
  /** 註冊成功後的用戶 ID */
  userId?: string;
  /** 重導向 URL */
  redirectUrl?: string;
}
