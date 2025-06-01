# 架構設計文件

## 目錄

1. [專案目標](#專案目標)
2. [技術選型](#技術選型)
3. [系統架構](#系統架構)
4. [認證流程設計](#認證流程設計)
5. [設計決策記錄](#設計決策記錄)
6. [資料庫設計](#資料庫設計)
7. [安全性設計](#安全性設計)
8. [效能優化](#效能優化)

## 專案目標

### 核心學習目標
- 掌握 **JWT Token + Session** 混合認證方案
- 實作 **LINE Bot** 與 Web 服務整合
- 學習現代 **Serverless 架構**
- 優化**網路品質差**環境的使用體驗

### 功能需求
1. LINE Bot Rich Menu 作為服務入口
2. 支援多服務（MyPage、MyMile）認證
3. 實現無縫登入體驗（點擊即登入）
4. 跨服務共享登入狀態

## 技術選型

### 前端：Create React App (CRA)
**選擇原因：**
- 快速啟動，適合學習專案
- 豐富的社群資源
- 未來可平滑升級至 Next.js

**限制：**
- 不支援 SSR/SSG
- 需要額外配置 API 代理

### 後端：Vercel Serverless Functions
**選擇原因：**
- 前後端一體化部署
- 自動擴展，無需管理伺服器
- 免費額度足夠學習使用
- 原生支援 TypeScript

**限制：**
- 函數執行時間限制（10秒）
- 無狀態設計要求

### 資料庫：MongoDB Atlas
**選擇原因：**
- 免費 M0 叢集
- 原生 JSON 支援
- 靈活的 Schema
- 內建索引優化

### 認證：JWT + MongoDB Session
**選擇原因：**
- JWT 用於短期身份傳遞（跨服務）
- Session 用於長期狀態維持（單服務內）
- 混合方案兼顧安全性與效能

## 系統架構

### 整體架構圖
```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  LINE Bot   │────▶│ Vercel Functions │────▶│  MongoDB    │
│  (Rich Menu)│     │  (Serverless)    │     │  (Atlas)    │
└─────────────┘     └──────────────────┘     └─────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   React App      │
                    │   (CRA + SPA)    │
                    └──────────────────┘
```

### 請求流程
1. 用戶在 LINE 點擊 Rich Menu
2. Bot 發送包含簽名的個人化連結
3. Vercel Functions 驗證並建立 Session
4. 302 跳轉至 React App
5. React App 使用 Session Token 存取 API

## 認證流程設計

### 決策：Bot 個人化連結方式

**選擇原因：**
- 相比 LIFF，減少 SDK 載入（網路優化）
- 完全掌控認證流程
- 實作相對簡單

**實作方式：**
```javascript
// LINE Bot 處理 Postback
async function handlePostback(event) {
  const userId = event.source.userId;
  const service = event.postback.data.split('=')[1];
  
  // 生成安全連結
  const link = generateSecureLink(userId, service);
  
  // 回傳給用戶
  await replyMessage(event.replyToken, {
    type: 'text',
    text: `請點擊以下連結進入 ${service}：\n${link}`
  });
}
```

### 決策：時間戳記簽名驗證

**選擇原因：**
- 一次請求完成驗證（網路優化）
- 不依賴外部 API
- 自動過期管理

**簽名生成：**
```javascript
function generateSecureLink(userId, service) {
  const payload = {
    u: userId,
    s: service,
    t: Date.now(),
    n: crypto.randomBytes(8).toString('hex')
  };
  
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  const token = Buffer.from(
    JSON.stringify({ ...payload, sig: signature })
  ).toString('base64url');
  
  return `${process.env.FRONTEND_URL}/api/auth/redirect?tk=${token}`;
}
```

### 決策：共用 Session 架構

**選擇原因：**
- 減少資料庫查詢次數
- 支援跨服務狀態共享
- 簡化實作複雜度

**Session 結構：**
```javascript
{
  _id: ObjectId,
  sessionToken: "uuid-v4",
  userId: "LINE-USER-ID",
  services: ["mypage", "mymile"],
  userCache: {
    name: "用戶名稱",
    avatar: "頭像URL"
  },
  createdAt: Date,
  expiresAt: Date,
  lastAccessAt: Date
}
```

## 設計決策記錄

### ADR-001: 為何不使用 LIFF
- **狀態**：已決定
- **日期**：2024-06-01
- **背景**：需要在 LINE Bot 中實作認證流程
- **考量選項**：
  1. LIFF（LINE Front-end Framework）
  2. Bot 個人化連結
- **決策**：採用 Bot 個人化連結
- **理由**：
  - 網路品質差時，避免載入額外 SDK
  - 更靈活的流程控制
  - 降低對 LINE 平台的依賴
- **結果**：簡化實作，提升差網路環境體驗

### ADR-002: 為何使用混合認證（JWT + Session）
- **狀態**：已決定
- **日期**：2024-06-01
- **背景**：純 JWT 或純 Session 各有限制
- **決策**：JWT 用於短期傳遞，Session 用於長期維持
- **理由**：
  - JWT 適合無狀態的跨服務傳遞
  - Session 提供更好的撤銷控制
  - 混合方案兼顧安全性與效能
- **結果**：靈活的認證架構

### ADR-003: 為何前後端分離部署在同一平台
- **狀態**：已決定
- **日期**：2024-06-01
- **背景**：需要決定部署架構
- **決策**：使用 Vercel 同時部署前後端
- **理由**：
  - 簡化 CORS 設定
  - 統一的環境變數管理
  - 降低網路延遲
- **結果**：開發和維護更簡單

## 資料庫設計

### Users Collection
```javascript
{
  _id: ObjectId,
  lineUserId: String,    // LINE 用戶 ID
  profile: {
    name: String,        // 顯示名稱
    avatar: String,      // 頭像 URL
    language: String     // 偏好語言
  },
  services: {
    mypage: {
      lastLoginAt: Date,
      preferences: Object
    },
    mymile: {
      lastLoginAt: Date,
      mileBalance: Number
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Sessions Collection
```javascript
{
  _id: ObjectId,
  sessionToken: String,  // UUID v4
  userId: ObjectId,      // 關聯 Users
  services: [String],    // 可存取的服務
  userCache: Object,     // 快取用戶基本資料
  ipAddress: String,     // 建立時的 IP
  userAgent: String,     // 建立時的 User Agent
  createdAt: Date,
  expiresAt: Date,       // TTL 索引
  lastAccessAt: Date
}
```

### 索引設計
```javascript
// Sessions 索引
db.sessions.createIndex({ sessionToken: 1 }, { unique: true })
db.sessions.createIndex({ userId: 1 })
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Users 索引
db.users.createIndex({ lineUserId: 1 }, { unique: true })
```

## 安全性設計

### 簽名驗證
- HMAC-SHA256 簽名
- 5 分鐘時效限制
- Nonce 防重放攻擊

### Session 安全
- 隨機 UUID v4 Token
- 24 小時自動過期
- IP 和 User Agent 記錄

### API 安全
- CORS 限制來源
- Rate Limiting（每 IP 每分鐘 60 次）
- 請求大小限制

### 資料保護
- 敏感資料加密存儲
- HTTPS 強制使用
- MongoDB 連線加密

## 效能優化

### 網路優化（針對差網路環境）

1. **減少請求大小**
   - 使用短 URL
   - 壓縮 JSON 回應
   - 只傳必要欄位

2. **快取策略**
   ```javascript
   // Session Token 本地快取
   const sessionCache = {
     token: localStorage.getItem('sessionToken'),
     expiresAt: localStorage.getItem('sessionExpiresAt')
   };
   
   // 用戶資料快取
   const userCache = {
     profile: localStorage.getItem('userProfile'),
     timestamp: localStorage.getItem('profileTimestamp')
   };
   ```

3. **漸進式載入**
   ```javascript
   // 優先載入核心功能
   const loadPriority = async () => {
     // 1. 基本認證狀態
     await checkAuth();
     
     // 2. 關鍵資料
     await loadEssentialData();
     
     // 3. 次要功能（延遲載入）
     setTimeout(loadSecondaryFeatures, 1000);
   };
   ```

4. **失敗重試機制**
   ```javascript
   const apiCall = async (url, options, retries = 3) => {
     try {
       return await fetch(url, options);
     } catch (error) {
       if (retries > 0) {
         await new Promise(r => setTimeout(r, 1000));
         return apiCall(url, options, retries - 1);
       }
       throw error;
     }
   };
   ```

### 資料庫優化

1. **查詢優化**
   - 使用投影減少資料傳輸
   - 適當的索引設計
   - 避免 N+1 查詢

2. **連線池管理**
   ```javascript
   // lib/mongodb.js
   let cached = global.mongoose;
   
   if (!cached) {
     cached = global.mongoose = { conn: null, promise: null };
   }
   
   async function dbConnect() {
     if (cached.conn) return cached.conn;
     // ... 連線邏輯
   }
   ```

3. **資料快取**
   - Session 內嵌用戶基本資料
   - 減少 JOIN 查詢需求

## 未來擴展

1. **升級至 Next.js**
   - 支援 SSR/SSG
   - 更好的 SEO
   - 內建 API Routes

2. **加入 Redis**
   - Session 快取層
   - Rate Limiting 實作

3. **監控與日誌**
   - 錯誤追蹤（Sentry）
   - 效能監控（Vercel Analytics）

4. **多語言支援**
   - i18n 實作
   - 根據 LINE 語言設定