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


## v10 Email + 密碼登入版
- 移除 OTP 驗證碼登入，避免 Supabase 內建寄信限制
- 改成 Email + 密碼登入 / 建立帳號
- 建議在 Supabase 關閉 Confirm email，讓註冊不需要驗證信
- 忘記密碼功能仍會寄信，未設定 Custom SMTP 時可能受限制


## v11 Flow Optimization
- 新增頁移除上方大型 hero，買入與獎金優先顯示
- 常用級別快捷按鈕：3400 / 6600 / 11000
- 服務費折扣快捷按鈕：50% / 0
- 支援先記買入、後續於紀錄頁編輯補獎金
- 統計卡片固定兩欄，不需左右拉動
- 數字欄位點擊時 0 會清空，空白離開時回到 0


## v12 Add Flow Refinement
- 移除「本場預估淨利」區塊
- 新增頁第一區改成單一主要輸入區
- 順序改為：日期 / 錦標賽快捷鍵 / 下拉選單 / 買入 / 服務費快捷鍵 / 服務費 / 獎金
- 快捷鍵不再孤立顯示，避免誤以為只能記 3400/6600/11000


## v13 Loading Fix
- Supabase session 讀取加入 7 秒 timeout
- 不再讓使用者永久卡在「載入中」
- 新增清除本機登入狀態並重新整理按鈕


## v14 Password Reset
- 補完整忘記密碼流程
- 點擊 Supabase recovery email 回到 App 後，會顯示「設定新密碼」頁
- 使用 supabase.auth.updateUser({ password }) 更新密碼
- 更新完成後會登出，讓使用者用新密碼重新登入


## v15 Mobile Chart Refinement
- 手機版累積淨利圖取消橫向滑動
- 加入「目前累積 / 區間最高 / 區間最低」摘要
- 圖上僅保留起點 / 中段 / 終點日期
- 避免最低點標籤與日期重疊
- 每日盈虧圖同步改為手機友善寬度


## v16 Fixes
- 修正「本月」區間在台灣時區可能顯示為前一日（例如 6/30）問題
- 改為使用本地時區計算 today / 本週 / 本月 / 近30天
- 修正電腦版累積淨利圖最低點標籤與日期重疊問題


## v17 Stats Polish
- 重新整理統計卡片排序：淨利 / 總買入 / 總獎金 / 服務費 / 平均每場 / 總場次
- 強化電腦版統計卡片高度與層級
- 圖表卡片加入區間資訊與更完整說明
- 累積淨利圖加入淡色 area fill，提升走勢辨識度
- 日期軸首尾對齊，減少標籤碰撞
- 圖表標籤增加淺色描邊，提高閱讀性


## v18 Mobile Chart Label Fix
- 手機版累積淨利圖移除圖內「最高 / 最低 / 目前」重疊文字
- 保留上方摘要卡顯示目前累積、區間最高、區間最低
- 圖內只保留走勢線、關鍵圓點與日期，避免手機畫面擁擠


## v19 Share Stats
- 統計頁加入「分享」按鈕
- 使用 html2canvas 將統計頁主要內容截成 PNG
- 支援 Web Share API，可在 iPhone 分享面板中選 LINE
- 若瀏覽器不支援直接分享圖片，會下載 PNG 供使用者手動分享


## v20 Share Hotfix
- 修正 V19 統計頁全白問題
- 補上 React useRef import
- 分享截圖功能保留


## v21 Share Card Fix
- 移除 html2canvas，避免 iPhone / PWA 出現 The operation is insecure
- 分享功能改成用 canvas 直接產生統計分享卡 PNG
- 分享圖包含統計數字與累積淨利曲線
- 可用 iPhone 原生分享面板分享到 LINE


## v22 Share Preview
- 修正 iPhone / PWA 分享時 The operation is insecure
- 不再直接呼叫 Web Share API 分享圖片
- 改為產生統計圖片並在 App 內顯示預覽
- 支援長按圖片儲存、開啟圖片、下載圖片


## v23 Share Page Demo
- 新增 /share-demo 公開分享頁 Demo
- 可先預覽 LINE 分享連結點開後的統計頁樣式
- Demo 頁包含統計卡片、累積淨利圖、LINE 分享 Demo 連結
- 這版先不連真實使用者資料，下一版可做正式分享資料落庫


## v24 Official Share Link
- 統計頁「分享」改為建立公開分享快照
- 產生 /share/{token} 公開頁，朋友不需登入可查看
- 自動開啟 LINE share URL 分享文字與連結
- 新增 Supabase SQL：supabase/share_snapshots.sql
- 分享頁只公開統計快照，不公開完整紀錄


## v25 White Screen Hotfix
- 修正 V24 打開白屏問題
- 補回 LoadingFallback 元件
- 保留正式分享連結功能與 /share/{token} 公開頁


## v26 Share Session Hotfix
- 修正統計頁按分享時 Can't find variable: session
- 將 session 從 App 傳入 StatsPage
- 保留 V25 正式分享連結功能


## v27 Share Route Hotfix
- 新增 vercel.json
- 修正 /share/{token} 直接開啟時 Vercel 404: NOT_FOUND
- 所有路徑會回到 index.html，再由 React App 處理分享頁路由


## v28 Mobile Share + Contact
- 手機版公開分享頁壓縮高度，讓圖表更快出現在首屏附近
- 分享頁手機版統計卡片改兩欄小卡
- 資料頁在 CSV 下方新增「聯繫作者」IG 連結：@riskreve1


## v29 Chart Axis
- 累積淨利圖加入左側 Y 軸數字刻度
- 每日盈虧圖加入左側 Y 軸數字刻度
- 刻度依當前資料範圍自動產生，採用 1/2/5/10 友善級距
- 加入淡色水平格線，提高數據辨識度
- 公開分享頁圖表同步加入左側刻度


## v30 Chart Axis Hotfix
- 修正 V29 手機版 Y 軸刻度與線圖 / 圓點重疊
- 手機版左側刻度區加寬
- 手機版累積淨利圖只保留最後點位，避免最高/最低圓點壓到刻度
- Y 軸刻度統一顯示成 k 格式，例如 10k / 5k / -5k


## v31 Chart Summary Fix
- 修正區間最高 / 區間最低誤抓 Y 軸刻度邊界的問題
- 摘要卡改為顯示真實資料最高與最低
- Y 軸刻度仍維持漂亮級距
- 公開分享頁圖表的最高 / 最低點判斷同步修正


## v32 Daily Summary + Fee Buttons
- 修正每日盈虧圖的單日最高 / 單日最低誤抓 Y 軸刻度邊界
- 每日盈虧摘要改為抓真實單日盈虧最高與最低
- 服務費快捷鍵新增固定折扣：折 100 / 折 200
- 固定折扣以該級別原始服務費為基準，最低不低於 0
