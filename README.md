# 限時錦標賽記帳工具 Cloud 版

雲端版本，使用：
- Vite + React
- Supabase Auth（Email Magic Link）
- Supabase Postgres

## 本機啟動
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Vercel 環境變數
請在 Vercel 專案中設定：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Supabase 設定步驟
1. 在 Supabase 專案中開啟 **Authentication > Sign In / Providers > Email**
2. 啟用 **Magic Link**
3. 到 **SQL Editor** 執行 `supabase/setup.sql`
4. 到 **Authentication > URL Configuration**
   - Site URL 設成你的正式網址
   - Additional Redirect URLs 加上：
     - `http://localhost:5173`
     - `https://你的-vercel-網址`

## 功能
- Email Magic Link 登入
- 雲端新增 / 刪除 / 讀取紀錄
- 手機優先 UI
- 本週 / 本月 / 近30天 / 自訂區間
- 累積淨利圖
- 每日盈虧圖
- 依賽事名稱 / 場館統計
- CSV / JSON 匯出
