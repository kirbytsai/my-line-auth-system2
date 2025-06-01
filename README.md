# LINE Auth System

一個整合 LINE Bot 與多服務認證的學習專案，實作 Token + Session 混合認證方案。

## 專案特色

- 🤖 LINE Bot 整合多服務（MyPage、MyMile）
- 🔐 JWT Token + MongoDB Session 混合認證
- ⚡ Serverless 架構（Vercel Functions）
- 📱 網路品質差環境優化
- 🔄 跨服務 Session 共享

## 快速開始

### 前置需求

- Node.js 16+
- MongoDB Atlas 帳號
- Vercel 帳號
- LINE Developers 帳號

### 安裝步驟

1. Clone 專案
```bash
git clone https://github.com/your-username/my-line-auth-system.git
cd my-line-auth-system
```

2. 安裝依賴
```bash
npm install
```

3. 環境變數設定
```bash
cp .env.example .env.local
```

編輯 `.env.local`：
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
FRONTEND_URL=http://localhost:3000
```

4. 本地開發
```bash
# 開發模式（前端 + Vercel Functions）
npm run dev

# 前端：http://localhost:3000
# API：http://localhost:3000/api
```

## 專案架構

```
my-line-auth-system/
├── src/                    # React 前端
│   ├── components/         # 頁面元件
│   ├── hooks/             # 自定義 Hooks
│   └── services/          # API 呼叫
├── api/                   # Vercel Functions
│   ├── auth/             # 認證相關
│   ├── mypage/           # MyPage 服務
│   └── mymile/           # MyMile 服務
├── lib/                  # 共用程式庫
│   ├── jwt.js           # Token 處理
│   ├── mongodb.js       # 資料庫連線
│   └── session.js       # Session 管理
└── docs/                # 詳細文件
    └── ARCHITECTURE.md  # 架構設計
```

## 認證流程

```
LINE Bot 選單點擊
    ↓
Bot 回傳個人化連結（含時間戳記簽名）
    ↓
/api/auth/redirect 驗證簽名
    ↓
建立 MongoDB Session
    ↓
跳轉至前端路由（帶 Session Token）
    ↓
前端使用 Token 存取 API
```

## 主要功能

- **LINE Bot Rich Menu**：提供服務入口
- **個人化安全連結**：時間戳記簽名防護
- **自動登入**：點擊連結直接登入
- **跨服務 Session**：MyPage 登入後，MyMile 也是登入狀態
- **網路優化**：支援離線快取、漸進式載入

## API 端點

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/auth/redirect` | GET | 認證中介服務 |
| `/api/mypage/profile` | GET | 取得 MyPage 個人資料 |
| `/api/mymile/data` | GET | 取得 MyMile 資料 |

## 部署

### Vercel 部署

1. 安裝 Vercel CLI
```bash
npm i -g vercel
```

2. 部署
```bash
vercel
```

3. 設定環境變數
在 Vercel Dashboard 中設定 Production 環境變數

### LINE Bot 設定

1. 在 LINE Developers Console 設定 Webhook URL
2. 建立 Rich Menu 並設定 Postback Action
3. 連結 Rich Menu 到 Bot

## 開發指南

- 遵循 [Conventional Commits](https://www.conventionalcommits.org/)
- 執行測試：`npm test`
- 程式碼檢查：`npm run lint`

## 相關文件

- [架構設計文件](./docs/ARCHITECTURE.md)
- [API 文件](./docs/API.md)
- [部署指南](./docs/DEPLOYMENT.md)

## 授權

MIT License