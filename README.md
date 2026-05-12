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
