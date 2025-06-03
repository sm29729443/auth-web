import { Injectable } from '@angular/core';

/**
 * Token 服務 - 增強版本
 * 🔧 新增：token 過期檢查功能
 */
@Injectable({
  providedIn: 'root'
})
export class TokenService {
  
  private readonly TOKEN_KEY = 'authToken';

  /**
   * 獲取當前 token
   * @returns token 字符串或 null
   */
  getToken(): string | null {
    try {
      return sessionStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error accessing sessionStorage:', error);
      return null;
    }
  }

  /**
   * 設置 token (通常不需要手動調用，main.ts 已處理)
   * @param token JWT token
   */
  setToken(token: string): void {
    try {
      sessionStorage.setItem(this.TOKEN_KEY, token);
      console.log('✅ Token stored successfully');
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  /**
   * 清除 token
   */
  clearToken(): void {
    try {
      sessionStorage.removeItem(this.TOKEN_KEY);
      console.log('🗑️ Token cleared');
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  /**
   * 檢查是否有 token
   * @returns 是否有 token
   */
  hasToken(): boolean {
    return !!this.getToken();
  }



  /**
   * 🔧 新增：檢查 token 是否過期
   * @param token JWT token
   * @returns 是否過期
   */
  isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.getToken();
    
    if (!tokenToCheck) {
      return true; // 沒有 token 視為過期
    }

    try {
      const payload = this.parseTokenPayload(tokenToCheck);
      
      if (!payload || !payload.exp) {
        console.warn('⚠️ Token does not contain expiration time');
        return false; // 如果沒有過期時間，暫時視為未過期
      }

      const currentTime = Math.floor(Date.now() / 1000); // 當前時間戳（秒）
      const isExpired = currentTime >= payload.exp;

      if (isExpired) {
        console.warn('⏰ Token expired:', {
          current: new Date(currentTime * 1000).toISOString(),
          expires: new Date(payload.exp * 1000).toISOString()
        });
      }

      return isExpired;
    } catch (error) {
      console.error('❌ Error checking token expiration:', error);
      return true; // 檢查失敗時視為過期，安全優先
    }
  }

  /**
   * 🔧 新增：檢查 token 基本格式
   * @param token JWT token
   * @returns 是否為有效格式
   */
  private isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  /**
   * 🔧 新增：獲取 token 剩餘有效時間（秒）
   * @returns 剩餘秒數，過期或錯誤時返回 0
   */
  getTokenRemainingTime(): number {
    const token = this.getToken();
    
    if (!token) return 0;

    try {
      const payload = this.parseTokenPayload(token);
      
      if (!payload || !payload.exp) {
        return 0;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const remainingTime = payload.exp - currentTime;

      return Math.max(0, remainingTime);
    } catch (error) {
      console.error('Error calculating remaining time:', error);
      return 0;
    }
  }

  /**
   * 🔧 新增：獲取 token 過期時間
   * @returns 過期時間的 Date 物件，無效時返回 null
   */
  getTokenExpirationDate(): Date | null {
    const token = this.getToken();
    
    if (!token) return null;

    try {
      const payload = this.parseTokenPayload(token);
      
      if (!payload || !payload.exp) {
        return null;
      }

      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error('Error getting expiration date:', error);
      return null;
    }
  }

  /**
   * 解析 token 內容
   * @param token JWT token
   * @returns 解析後的 payload
   */
  parseTokenPayload(token: string): any {
    try {
      const base64Payload = token.split('.')[1];
      const payload = atob(base64Payload);
      return JSON.parse(payload);
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }

  /**
   * 從 token 中獲取 redirectUrl
   * @returns redirectUrl 或 null
   */
  getRedirectUrlFromToken(): string | null {
    const token = this.getToken();
    if (!token) return null;
    
    const payload = this.parseTokenPayload(token);
    return payload?.redirectUrl || null;
  }

  /**
   * 從 token 中獲取 scope
   * @returns scope 或 null
   */
  getScopeFromToken(): string | null {
    const token = this.getToken();
    if (!token) return null;
    
    const payload = this.parseTokenPayload(token);
    return payload?.scope || null;
  }

  /**
   * 驗證 token 的 scope 是否為 AUTH
   * @returns 是否有效
   */
  isValidAuthScope(): boolean {
    const scope = this.getScopeFromToken();
    return scope === 'auth';
  }

  /**
   * 🔧 新增：完整的 token 驗證（格式 + 過期 + scope）
   * @returns 驗證結果和錯誤訊息
   */
  validateToken(): { isValid: boolean; error?: string } {
    const token = this.getToken();
    
    if (!token) {
      return { isValid: false, error: '缺少驗證 token' };
    }

    if (!this.isValidTokenFormat(token)) {
      return { isValid: false, error: 'Token 格式不正確' };
    }

    if (this.isTokenExpired(token)) {
      return { isValid: false, error: 'Token 已過期，請重新授權' };
    }

    if (!this.isValidAuthScope()) {
      return { isValid: false, error: 'Token 權限不足' };
    }

    return { isValid: true };
  }

  /**
   * 🔧 新增：清理過期 token
   * 檢查 token 是否過期，如果過期則自動清除
   */
  cleanupExpiredToken(): boolean {
    const token = this.getToken();
    
    if (token && this.isTokenExpired(token)) {
      console.log('🧹 Cleaning up expired token');
      this.clearToken();
      return true; // 已清理過期 token
    }

    return false; // 沒有過期 token 需要清理
  }
}
