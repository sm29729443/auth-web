import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TokenService } from '../services/token.service';

/**
 * HTTP 攔截器 - 增強版本
 * 🔧 新增：自動檢查 token 過期並處理
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private tokenService: TokenService,
    private router: Router
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    
    // 🔧 新增：在發送請求前檢查是否需要 token
    if (this.shouldAddToken(request)) {
      
      // 🔧 新增：主動檢查並清理過期 token
      const wasExpiredTokenCleaned = this.tokenService.cleanupExpiredToken();
      if (wasExpiredTokenCleaned) {
        console.warn('🧹 Expired token cleaned during HTTP request');
        return this.handleExpiredToken();
      }

      // 🔧 新增：完整的 token 驗證
      const validationResult = this.tokenService.validateToken();
      
      if (!validationResult.isValid) {
        console.warn('❌ Token validation failed during HTTP request:', validationResult.error);
        
        // 根據錯誤類型決定處理方式
        if (validationResult.error?.includes('過期')) {
          return this.handleExpiredToken();
        } else {
          return this.handleInvalidToken(validationResult.error || 'Token 無效');
        }
      }

      // Token 有效，獲取並加入到請求中
      const token = this.tokenService.getToken();
      
      if (token) {
        // 🔧 新增：記錄 token 剩餘時間（用於監控）
        const remainingTime = this.tokenService.getTokenRemainingTime();
        if (remainingTime < 300) { // 5分鐘內過期
          console.warn('⚠️ Token will expire soon during API call:', {
            remainingSeconds: remainingTime,
            requestUrl: request.url
          });
        }

        // 克隆請求並加入 Authorization header
        const authRequest = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('🔐 Added token to request:', authRequest.url);
        
        return next.handle(authRequest).pipe(
          catchError((error: HttpErrorResponse) => this.handleError(error))
        );
      }
    }
    
    // 如果不需要 token，直接發送原始請求
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  /**
   * 判斷請求是否需要加入 token
   * @param request HTTP 請求
   * @returns 是否需要加入 token
   */
  private shouldAddToken(request: HttpRequest<any>): boolean {
    // 排除不需要 token 的請求
    const excludeUrls = [
      '/assets/',
      '/public/',
      'googleapis.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ];
    
    const shouldExclude = excludeUrls.some(url => 
      request.url.includes(url)
    );
    
    if (shouldExclude) {
      return false;
    }
    
    // 只對您的後端 API 加入 token
    const apiUrls = [
      '/b2c-auth-api/',
      '/api/',
      'localhost:8080'
    ];
    
    const shouldInclude = apiUrls.some(url => 
      request.url.includes(url)
    );
    
    return shouldInclude;
  }

  /**
   * 🔧 新增：處理過期的 token
   */
  private handleExpiredToken(): Observable<never> {
    console.error('🚨 Token expired during HTTP request');
    
    // 清除過期的 token
    this.tokenService.clearToken();
    
    // 重定向到錯誤頁面
    this.router.navigate(['/error'], {
      queryParams: { 
        type: 'access_denied',
        message: 'Token 已過期，請重新授權',
        code: 'TOKEN_EXPIRED_HTTP',
        timestamp: Date.now()
      }
    });
    
    // 返回錯誤
    return throwError(() => new Error('Token 已過期'));
  }

  /**
   * 🔧 新增：處理無效的 token
   */
  private handleInvalidToken(errorMessage: string): Observable<never> {
    console.error('🚨 Invalid token during HTTP request:', errorMessage);
    
    // 清除無效的 token
    this.tokenService.clearToken();
    
    // 重定向到錯誤頁面
    this.router.navigate(['/error'], {
      queryParams: { 
        type: 'access_denied',
        message: errorMessage,
        code: 'TOKEN_INVALID_HTTP',
        timestamp: Date.now()
      }
    });
    
    // 返回錯誤
    return throwError(() => new Error(errorMessage));
  }

  /**
   * 處理 HTTP 錯誤
   * @param error HTTP 錯誤響應
   * @returns 錯誤 Observable
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('🚨 HTTP Error:', error);
    
    // 處理 401 未授權錯誤 - token 可能無效或過期
    if (error.status === 401) {
      console.warn('⚠️ 401 Unauthorized - server rejected token');
      this.tokenService.clearToken();
      
      // 重定向到錯誤頁面
      this.router.navigate(['/error'], {
        queryParams: { 
          type: 'access_denied',
          message: '伺服器拒絕了您的驗證，請重新授權',
          code: 'SERVER_UNAUTHORIZED',
          timestamp: Date.now()
        }
      });
    }
    
    // 處理 403 禁止訪問錯誤
    if (error.status === 403) {
      console.warn('⚠️ 403 Forbidden - insufficient permissions');
      
      this.router.navigate(['/error'], {
        queryParams: { 
          type: 'access_denied',
          message: '權限不足，無法執行此操作',
          code: 'INSUFFICIENT_PERMISSIONS',
          timestamp: Date.now()
        }
      });
    }

    // 🔧 新增：處理其他可能與認證相關的錯誤
    if (error.status === 422 && error.error?.message?.includes('token')) {
      console.warn('⚠️ 422 Unprocessable Entity - token format issue');
      this.tokenService.clearToken();
      
      this.router.navigate(['/error'], {
        queryParams: { 
          type: 'access_denied',
          message: 'Token 格式錯誤，請重新授權',
          code: 'TOKEN_FORMAT_ERROR_SERVER',
          timestamp: Date.now()
        }
      });
    }
    
    return throwError(() => error);
  }
}
