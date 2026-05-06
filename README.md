# 限時錦標賽記帳工具

這是一個 Vite + React 的純前端專案，適合先部署成網址給朋友試用。

## 功能

- 新增限時錦標賽紀錄
- 賽事名稱模板自動帶入買入與服務費
- 買入、服務費、重買買入總額、重買服務費總額都可手動修改
- 自動計算總投入、總服務費、淨利、ROI
- 統計頁支援全部、本週、本月、近 30 天、自訂日期區間
- 累積淨利圖
- 每日盈虧圖
- 依賽事名稱統計
- 依場館統計
- CSV 匯出

## 注意

目前資料存在使用者自己的瀏覽器 localStorage。

也就是：

- 不需要登入
- 不需要資料庫
- 每位使用者資料互相獨立
- 清除瀏覽器資料或換裝置，資料會消失

## 本機執行

```bash
npm install
npm run dev
```

## 打包

```bash
npm run build
npm run preview
```

## 部署建議

推薦使用 Vercel：

1. 建立 GitHub repository
2. 上傳本專案
3. 到 Vercel 新增 Project
4. Import GitHub repository
5. Vercel 會自動偵測 Vite
6. Deploy 後取得網址

