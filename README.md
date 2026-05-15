# 限時錦標賽記帳工具 Cloud UI 版

以手機優先與正式產品質感為目標的雲端版。

## 技術
- Vite + React
- Supabase Auth（Email Magic Link）
- Supabase Postgres

## 啟動
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Vercel
請設定：
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY


## v2 調整
- 移除場館輸入
- 統計改顯示服務費 / 總買入
- 取消依場館統計

## v3 修正
- 修正手機版日期欄位過大與重疊問題
- 手機版雙欄輸入改為單欄，避免 iPhone Safari 撐版
- 再次移除場館輸入與相關儲存
- 統計卡片改為服務費 / 總買入

## v5 精修
- 縮短新增頁 / 統計頁 hero 區塊高度
- 底部儲存列再瘦身，手機首屏更乾淨
- 日期與下拉欄位增加可操作感（圖示 / 邊框 / 狀態）
- 統計卡片更新為「總買入（含服務費）」
- 登入頁文案改為強調首次登入後通常會維持登入

## v6 OTP 登入
- 登入由 Email Magic Link 改為 Email OTP 驗證碼流程
- 前端使用 signInWithOtp + verifyOtp
- 若仍收到登入連結，需到 Supabase Email template 將 Magic Link 改成 Token 驗證碼模式


## v7 OTP 修正
- 驗證碼輸入不再限制 6 碼
- 支援 Supabase 寄出的 8 碼或其他長度 OTP
- 文案改為「驗證碼」，避免固定寫 6 位數


## v8 安裝提示
- 偵測 Instagram 內建瀏覽器並提醒用 Safari 開啟
- Safari 中提示加入主畫面
- 加入基本 PWA manifest / iOS web app metadata


## v9 Onboarding 修正
- IG 內建瀏覽器會在登入前先顯示 Safari 開啟教學
- Safari 非主畫面模式會先顯示加入主畫面教學
- 從主畫面開啟後才進入登入流程
- 保留「我先直接使用」給測試或例外情境
