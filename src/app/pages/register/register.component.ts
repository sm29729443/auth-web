import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { RegistrationStateService } from '../../services/registration-state.service';

/**
 * 註冊流程容器組件
 * 包含步驟指示器和子路由出口
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  
  public registrationState = inject(RegistrationStateService);

  /**
   * 根據當前步驟獲取步驟狀態
   */
  getStepStatus(step: number): 'active' | 'completed' | 'pending' {
    const currentStep = this.registrationState.currentStep();
    
    if (currentStep > step) {
      return 'completed';
    } else if (currentStep === step) {
      return 'active';
    } else {
      return 'pending';
    }
  }

  /**
   * 獲取步驟的CSS類別
   */
  getStepClass(step: number): string {
    const status = this.getStepStatus(step);
    
    const baseClasses = 'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg transition-all duration-300';
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-500 text-white`;
      case 'active':
        return `${baseClasses} bg-blue-500 text-white`;
      case 'pending':
        return `${baseClasses} bg-gray-200 text-gray-500`;
      default:
        return baseClasses;
    }
  }

  /**
   * 獲取步驟文字的CSS類別
   */
  getStepTextClass(step: number): string {
    const status = this.getStepStatus(step);
    
    const baseClasses = 'text-sm font-medium transition-colors duration-300';
    
    switch (status) {
      case 'completed':
        return `${baseClasses} text-green-500`;
      case 'active':
        return `${baseClasses} text-blue-500`;
      case 'pending':
        return `${baseClasses} text-gray-500`;
      default:
        return baseClasses;
    }
  }
}
