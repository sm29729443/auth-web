import { Routes } from '@angular/router';
import { RegisterComponent } from './pages/register/register.component';
import { RegisterInfoComponent } from './pages/register/register-info/register-info.component';
import { RegisterVerifyComponent } from './pages/register/register-verify/register-verify.component';
import { LoginComponent } from './pages/login/login.component';
import { ErrorComponent } from './pages/error/error.component';
import { SuccessComponent } from './pages/success/success.component';
import { TokenGuard } from './guards/token.guard';
import { StepGuard } from './guards/step.guard';

export const routes: Routes = [
    // 預設路由到註冊頁面
    {
        path: '',
        redirectTo: 'register',
        pathMatch: 'full'
    },
    // 🆕 註冊流程 - 使用容器組件 + 子路由結構
    {
        path: 'register',
        component: RegisterComponent,
        canActivate: [TokenGuard], // 🛡️ Token 守衛保護
        children: [
            {
                path: '',
                redirectTo: 'info',
                pathMatch: 'full'
            },
            {
                path: 'info',
                component: RegisterInfoComponent,
                canActivate: [StepGuard, TokenGuard],
                data: {
                    title: '填寫資料',
                    step: 1
                }
            },
            {
                path: 'verify',
                component: RegisterVerifyComponent,
                canActivate: [StepGuard, TokenGuard],
                data: {
                    title: 'OTP驗證',
                    step: 2
                }
            }
        ]
    },
    // 登入頁面 - 必須有有效 token 才能進入
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [TokenGuard], // 🛡️ Token 守衛保護
        data: {
            title: '登入'
        }
    },
    // 註冊成功頁面
    {
        path: 'success',
        component: SuccessComponent,
        data: {
            title: '註冊成功'
        }
    },
    // 錯誤頁面
    {
        path: 'error',
        component: ErrorComponent,
        data: {
            title: '錯誤'
        }
    },
    // 404 頁面
    {
        path: '**',
        redirectTo: 'error'
    }
];
