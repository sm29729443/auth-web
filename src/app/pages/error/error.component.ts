import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-error',
  imports: [CommonModule],
  templateUrl: './error.component.html',
  styleUrl: './error.component.css'
})
export class ErrorComponent implements OnInit {
  errorMessage = '發生未知錯誤';
  errorType = 'general';
  errorCode = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.errorMessage = params['message'] || '發生未知錯誤';
      this.errorType = params['type'] || 'general';
      this.errorCode = params['code'] || '';
    });
  }

  getErrorTitle(): string {
    switch (this.errorType) {
      case 'access_denied':
        return '訪問被拒絕';
      default:
        return '系統錯誤';
    }
  }

  getErrorIcon(): string {
    switch (this.errorType) {
      case 'access_denied':
        return '🚫';
      default:
        return '⚠️';
    }
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  }

  getCurrentPath(): string {
    return window.location.pathname;
  }

  getCurrentTimestamp(): string {
    return new Date().toISOString();
  }
}
