# 註冊頁面功能說明

## 🎯 功能特色

### 1. 兩階段註冊流程
- **步驟一**：填寫基本資料（身分證、姓名、生日、地址、手機、Email）
- **步驟二**：手機簡訊 OTP 驗證

### 2. 完整的表單驗證
- **台灣身分證字號驗證**：包含格式檢查和檢查碼驗證
- **手機號碼驗證**：台灣手機格式 (09xxxxxxxx)
- **年齡驗證**：必須滿18歲
- **Email 格式驗證**
- **地址選擇**：縣市和區域聯動

### 3. OTP 倒數計時功能
- 60秒倒數動畫
- 倒數結束後可重新發送
- 視覺化的倒數顯示

### 4. 使用者體驗優化
- 進度指示器
- 載入動畫
- 錯誤訊息提示
- 響應式設計
- 無障礙設計

## 🎨 技術架構

### 樣式框架
- **Tailwind CSS v4** - 完全使用 utility-first CSS 框架
- **自訂擴展** - 針對中文字體和動畫效果的優化
- **響應式設計** - 支援所有裝置尺寸
- **無障礙設計** - 符合 WCAG 標準

### 前端技術
- **Angular 19** - 最新版本
- **Reactive Forms** - 表單管理
- **RxJS** - 非同步處理
- **TypeScript** - 型別安全
- **自定義驗證器** - 台灣特有格式驗證

## 🚀 啟動方式

```bash
# 進入專案目錄
cd C:\Users\USER\vscode-work-space\auth-web

# 安裝依賴
npm install

# 啟動開發伺服器
ng serve

# 開啟瀏覽器
http://localhost:4200
```

## 🧪 測試資料

### 有效的身分證字號（用於測試）
- A123456789 (台北市男性)
- A223456788 (台北市女性)
- B123456780 (台中市男性)
- F131232066 (嘉義縣男性)

### 測試用 OTP 驗證碼
- 在模擬環境中，使用驗證碼：**123456**

### 測試流程
1. 輸入有效的身分證字號和其他必填資料
2. 點擊「下一步」
3. 系統會模擬發送 OTP 並開始倒數
4. 輸入驗證碼 `123456`
5. 點擊「完成註冊」
6. 跳轉到成功頁面

## 🎨 Tailwind CSS 特色

### 使用的主要 Utility Classes
- **佈局**: `flex`, `grid`, `max-w-4xl`, `mx-auto`
- **間距**: `p-5`, `mb-8`, `gap-5`
- **顏色**: `bg-blue-500`, `text-white`, `border-gray-200`
- **效果**: `shadow-sm`, `rounded-lg`, `transition-all`
- **響應式**: `md:grid-cols-2`, `lg:px-8`
- **狀態**: `hover:bg-blue-600`, `focus:ring-4`, `disabled:opacity-60`

### 自訂擴展
```javascript
// tailwind.config.js
theme: {
  extend: {
    fontFamily: {
      'chinese': ['Microsoft JhengHei', 'ui-sans-serif'],
    },
    animation: {
      'bounce-in': 'bounceIn 0.6s ease-out',
      'check-mark': 'checkMark 0.5s ease-out',
    }
  }
}
```

### 條件式樣式
```html
<!-- 動態 class 綁定 -->
[class.bg-blue-500]="currentStep === 1"
[class.text-white]="currentStep === 1"
[class.border-red-500]="hasError('name')"

<!-- 響應式設計 -->
class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

## 📱 響應式設計

### 斷點說明
- **sm (640px+)**: 小型平板
- **md (768px+)**: 平板
- **lg (1024px+)**: 桌面
- **xl (1280px+)**: 大桌面

### 響應式實作
```html
<!-- 步驟指示器 -->
<div class="flex flex-col md:flex-row items-center">

<!-- 表單佈局 -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-2">

<!-- 按鈕群組 -->
<div class="flex flex-col md:flex-row gap-4">
```

## 🔧 Tailwind 配置文件

### postcss 配置 (`.postcssrc.json`)
```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

### Tailwind 配置 (`tailwind.config.js`)
- 內容路徑設定
- 自訂主題擴展
- 動畫關鍵幀
- 字體配置

## 🎯 設計亮點

### 1. 視覺一致性
- 統一的色彩系統 (blue-500, gray-200, red-500)
- 一致的圓角和陰影
- 標準的間距系統 (4, 8, 16, 32 的倍數)

### 2. 互動體驗
- Hover 效果：`hover:-translate-y-0.5 hover:shadow-lg`
- Focus 狀態：`focus:ring-4 focus:ring-blue-300`
- 載入動畫：`animate-spin`
- 倒數動畫：`animate-pulse`

### 3. 無障礙設計
- 高對比支援：`@media (prefers-contrast: high)`
- 減少動畫：`@media (prefers-reduced-motion: reduce)`
- 鍵盤導航：`focus:outline-none focus:ring-4`

## 🛠️ 維護建議

### 1. 樣式維護
- 使用 Tailwind 的 utility classes
- 避免自訂 CSS，優先使用配置擴展
- 保持 class 名稱的語意化

### 2. 響應式維護
- 行動優先設計原則
- 測試各種螢幕尺寸
- 使用 Chrome DevTools 的裝置模擬

### 3. 效能優化
- Tailwind 會自動 purge 未使用的樣式
- 使用 JIT 模式確保最小檔案大小

## 🐛 常見問題

### 1. Tailwind 樣式不生效
```bash
# 檢查配置
npm run build
# 確認 postcss 配置正確
```

### 2. 自訂樣式
```css
/* 在 styles.css 中使用 @layer */
@layer utilities {
  .custom-class {
    /* 自訂樣式 */
  }
}
```

### 3. JIT 模式問題
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{html,ts}"], // 確保路徑正確
}
```

---

**所有樣式已完全遷移至 Tailwind CSS！🎉**

特色：
- ✅ 完全使用 Tailwind utility classes
- ✅ 自訂擴展配置
- ✅ 響應式設計
- ✅ 動畫效果
- ✅ 無障礙支援
- ✅ 效能優化
- ✅ 易於維護

現在可以享受 Tailwind CSS 帶來的開發效率和一致性！
