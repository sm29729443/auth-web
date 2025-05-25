import { Routes } from '@angular/router';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';
import { ErrorComponent } from './pages/error/error.component';
import { SuccessComponent } from './pages/success/success.component';

export const routes: Routes = [
    // 預設路由到註冊頁面
    {
        path: '',
        redirectTo: 'register',
        pathMatch: 'full'
    },
    // 註冊頁面
    {
        path: 'register',
        component: RegisterComponent,
        data: {
            title: '註冊'
        }
    },
    // 登入頁面
    {
        path: 'login',
        component: LoginComponent,
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
