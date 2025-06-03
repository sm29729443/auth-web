import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RegistrationStateService } from '../../services/registration-state.service';

/**
 * 註冊成功頁面組件
 */
@Component({
  selector: 'app-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-600 p-5">
      <div class="bg-white p-16 rounded-2xl text-center shadow-2xl max-w-lg w-full animate-bounce-in">
        <!-- 成功圖示 -->
        <div class="mb-8">
          <div class="w-20 h-20 mx-auto mb-5 rounded-full bg-green-100 flex items-center justify-center animate-check-circle">
            <!-- 勾勾符號 -->
            <svg class="w-10 h-10 text-green-500 animate-check-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20,6 9,17 4,12" class="animate-draw-check"></polyline>
            </svg>
          </div>
        </div>
        
        <h1 class="text-green-500 text-4xl font-bold mb-5 drop-shadow-sm">註冊成功！</h1>
        <p class="text-gray-500 text-xl leading-relaxed mb-10">
          恭喜您已成功完成會員註冊，歡迎加入我們的會員大家庭！
        </p>
        
        <div class="flex gap-4 justify-center flex-wrap">
          <button 
            type="button" 
            class="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 min-w-36"
            (click)="goToLogin()">
            前往登入
          </button>
          <button 
            type="button" 
            class="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:from-gray-600 hover:to-gray-700 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-gray-300 min-w-36"
            (click)="goToHome()">
            回到首頁
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes checkCircle {
      0% {
        transform: scale(0);
        background-color: rgb(34 197 94);
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
        background-color: rgb(34 197 94);
      }
    }

    @keyframes drawCheck {
      0% {
        stroke-dasharray: 0 100;
      }
      100% {
        stroke-dasharray: 100 0;
      }
    }

    .animate-bounce-in {
      animation: slideInUp 0.6s ease-out;
    }

    .animate-check-circle {
      animation: checkCircle 0.6s ease-out 0.3s both;
    }

    .animate-check-mark {
      animation-delay: 0.6s;
    }

    .animate-draw-check {
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
      animation: drawCheck 0.5s ease-out 0.8s forwards;
    }

    /* 響應式設計 */
    @media (max-width: 480px) {
      .min-w-36 {
        width: 100%;
      }
    }

    /* 減少動畫偏好 */
    @media (prefers-reduced-motion: reduce) {
      .animate-bounce-in,
      .animate-check-circle,
      .animate-check-mark,
      .animate-draw-check {
        animation: none;
      }
    }
  `]
})
export class SuccessComponent implements OnInit {

  private registrationState = inject(RegistrationStateService);

  constructor(private router: Router) {}

  ngOnInit(): void {
    // 清理註冊狀態，避免數據殘留
    this.registrationState.clearAll();
    console.log('✅ Registration state cleared on success page');
  }

  /**
   * 前往登入頁面
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * 回到首頁
   */
  goToHome(): void {
    this.router.navigate(['/']);
  }
}
