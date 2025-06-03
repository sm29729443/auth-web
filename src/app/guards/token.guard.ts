import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

/**
 * Token 驗證守衛 - 增強版本
 * 🔧 新增：完整的 token 過期檢查
 */
@Injectable({
  providedIn: 'root'
})
export class TokenGuard implements CanActivate {

  constructor(
    private tokenService: TokenService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    
    console.log('🛡️ TokenGuard checking access to:', state.url);
    
    // 1. 首先嘗試從 URL 中提取 token（防止 main.ts 遺漏的情況）
    const tokenFromUrl = route.queryParams['token'];
    
    if (tokenFromUrl) {
      console.log('🔍 Token found in URL, extracting...');
      
      // 先驗證 URL 中的 token 是否有效
      if (this.tokenService.isTokenExpired(tokenFromUrl)) {
        console.warn('❌ Token from URL is expired');
        this.redirectToAccessDenied('Token 已過期，請重新授權', 'TOKEN_EXPIRED');
        return false;
      }
      
      // 提取並存儲 token
      this.tokenService.setToken(tokenFromUrl);
      console.log('✅ Token extracted from URL by Guard');
      
      // 清除 URL 中的 token 參數，重定向到乾淨的 URL
      const cleanUrl = state.url.split('?')[0];
      this.router.navigateByUrl(cleanUrl, { replaceUrl: true });
      return true;
    }
    
    // 2. 🔧 新增：自動清理過期的 token
    const wasExpiredTokenCleaned = this.tokenService.cleanupExpiredToken();
    if (wasExpiredTokenCleaned) {
      console.log('🧹 Expired token was automatically cleaned up');
    }
    
    // 3. 🔧 修改：使用增強的 token 驗證
    const validationResult = this.tokenService.validateToken();
    
    if (!validationResult.isValid) {
      console.warn('❌ Token validation failed:', validationResult.error);
      
      // 根據不同的錯誤類型給出不同的處理
      this.handleTokenValidationError(validationResult.error || 'Token 驗證失敗');
      return false;
    }
    
    // 4. 🔧 新增：檢查 token 即將過期的警告（可選功能）
    const remainingTime = this.tokenService.getTokenRemainingTime();
    if (remainingTime > 0 && remainingTime < 300) { // 5分鐘內過期
      const expirationDate = this.tokenService.getTokenExpirationDate();
      console.warn('⚠️ Token will expire soon:', {
        remainingSeconds: remainingTime,
        expiresAt: expirationDate?.toISOString()
      });
    }
    
    console.log('✅ Token validation passed - access granted to:', state.url);
    return true;
  }

  /**
   * 🔧 新增：處理不同類型的 token 驗證錯誤
   */
  private handleTokenValidationError(error: string): void {
    let errorCode = 'TOKEN_INVALID';
    let message = error;

    // 根據錯誤類型確定錯誤代碼
    if (error.includes('過期')) {
      errorCode = 'TOKEN_EXPIRED';
    } else if (error.includes('缺少')) {
      errorCode = 'NO_TOKEN';
    } else if (error.includes('格式')) {
      errorCode = 'TOKEN_FORMAT_ERROR';
    } else if (error.includes('權限')) {
      errorCode = 'INSUFFICIENT_SCOPE';
    }

    this.redirectToAccessDenied(message, errorCode);
  }

  /**
   * 重定向到拒絕訪問頁面
   */
  private redirectToAccessDenied(message: string, code: string = 'ACCESS_DENIED'): void {
    // 清除可能存在的無效 token
    if (code === 'TOKEN_EXPIRED' || code === 'TOKEN_FORMAT_ERROR') {
      this.tokenService.clearToken();
    }

    this.router.navigate(['/error'], {
      queryParams: { 
        type: 'access_denied',
        message: message,
        code: code,
        timestamp: Date.now() // 添加時間戳避免快取問題
      }
    });
  }
}
