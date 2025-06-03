import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * 在應用程式啟動前處理來自其他平台的 token
 * 這樣可以確保任何 component 都能立即取得 token
 */
function handleAuthTokenFromUrl(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    try {
      // 存儲 token 到 sessionStorage
      sessionStorage.setItem('authToken', token);
      
      // 清除 URL 中的 token 參數，保持 URL 乾淨
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
      
      console.log('✅ Token extracted and stored:', token.substring(0, 20) + '...');
    } catch (error) {
      console.error('❌ Error handling auth token:', error);
    }
  } else {
    // 檢查是否已有存儲的 token
    const existingToken = sessionStorage.getItem('authToken');
    if (existingToken) {
      console.log('✅ Using existing token from sessionStorage');
    } else {
      console.log('⚠️ No auth token found in URL or storage');
    }
  }
}

// 在啟動 Angular 應用程式之前處理 token
handleAuthTokenFromUrl();

// 啟動應用程式
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error('❌ Error starting application:', err));
