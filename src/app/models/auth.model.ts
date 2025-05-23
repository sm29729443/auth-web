// 註冊步驟枚舉
export enum RegisterStep {
  FORM = 'form',           // 填寫表單
  OTP_VERIFICATION = 'otp', // OTP 驗證
  SUCCESS = 'success'       // 註冊完成
}

// 更新註冊相關模型
export interface RegisterRequest {
  idNumber: string;       // 身份證字號
  name: string;           // 姓名
  birthDate: string;       // 出生日期
  city: string;           // 縣市
  district: string;       // 鄉鎮地區
  phone: string;          // 手機號碼
  email: string;          // 電子信箱
}

// API 回應
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}