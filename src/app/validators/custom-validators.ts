import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * 自定義表單驗證器
 */
export class CustomValidators {

  /**
   * 台灣身分證字號驗證器
   * @returns ValidatorFn
   */
  static taiwanId(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const idNumber = control.value;

      if (!idNumber) {
        return null; // 讓 required validator 處理空值
      }

      if (!CustomValidators.isValidTaiwanId(idNumber)) {
        return {
          taiwanId: {
            message: '身分證字號格式不正確或檢查碼錯誤'
          }
        };
      }

      return null;
    };
  }

  /**
   * 台灣手機號碼驗證器
   * @returns ValidatorFn
   */
  static taiwanPhone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const phoneNumber = control.value;

      if (!phoneNumber) {
        return null;
      }

      if (!/^09[0-9]{8}$/.test(phoneNumber)) {
        return {
          taiwanPhone: {
            message: '手機號碼格式不正確，請輸入09開頭的10位數字'
          }
        };
      }

      return null;
    };
  }

  /**
   * 年齡驗證器（必須滿18歲）
   * @returns ValidatorFn
   */
  static minimumAge(minAge: number = 18): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const birthDate = control.value;

      // 檢查個別欄位是否為空，並返回對應錯誤
      if (!birthDate?.year) {
        return { missingYear: { message: '請選擇出生年份' } };
      }
      if (!birthDate?.month) {
        return { missingMonth: { message: '請選擇出生月份' } };
      }
      if (!birthDate?.day) {
        return { missingDay: { message: '請選擇出生日期' } };
      }

      const birth = new Date(
        parseInt(birthDate.year),
        parseInt(birthDate.month) - 1,
        parseInt(birthDate.day)
      );

      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        const actualAge = age - 1;
        if (actualAge < minAge) {
          return {
            minimumAge: {
              message: `年齡必須滿${minAge}歲才可註冊會員`,
              requiredAge: minAge,
              actualAge: actualAge
            }
          };
        }
      } else if (age < minAge) {
        return {
          minimumAge: {
            message: `年齡必須滿${minAge}歲才可註冊會員`,
            requiredAge: minAge,
            actualAge: age
          }
        };
      }

      return null;
    };
  }

  /**
   * OTP 驗證碼格式驗證器
   * @param length 驗證碼長度，預設6位數
   * @returns ValidatorFn
   */
  static otpCode(length: number = 6): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const code = control.value;

      if (!code) {
        return null;
      }

      const pattern = new RegExp(`^[0-9]{${length}}$`);
      if (!pattern.test(code)) {
        return {
          otpCode: {
            message: `請輸入${length}位數字驗證碼`
          }
        };
      }

      return null;
    };
  }

  /**
   * 驗證台灣身分證字號的內部方法
   * @param idNumber 身分證字號
   * @returns 是否有效
   */
  private static isValidTaiwanId(idNumber: string): boolean {
    // 基本格式檢查
    if (!/^[A-Z][12][0-9]{8}$/.test(idNumber)) {
      return false;
    }

    // 縣市代碼對應表
    const cityMapping: { [key: string]: number } = {
      'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15,
      'G': 16, 'H': 17, 'I': 34, 'J': 18, 'K': 19, 'L': 20,
      'M': 21, 'N': 22, 'O': 35, 'P': 23, 'Q': 24, 'R': 25,
      'S': 26, 'T': 27, 'U': 28, 'V': 29, 'W': 32, 'X': 30,
      'Y': 31, 'Z': 33
    };

    const cityCode = cityMapping[idNumber[0]];
    if (!cityCode) return false;

    // 計算檢查碼
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
}
