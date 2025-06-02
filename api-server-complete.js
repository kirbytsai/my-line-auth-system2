const http = require('http');
const url = require('url');
const crypto = require('crypto');

// 簡單的 JWT 驗證（與 simple-test-link.js 對應）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-please-change-this';

function verifyShortToken(token) {
  try {
    const decoded = JSON.parse(
      Buffer.from(token, 'base64url').toString('utf8')
    );
    
    const { sig, ...payload } = decoded;
    
    // 檢查時效性（5分鐘）
    const now = Date.now();
    if (now - payload.t > 5 * 60 * 1000) {
      console.log('Token 已過期');
      return null;
    }
    
    // 驗證簽名
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    if (sig !== expectedSig) {
      console.log('Token 簽名無效');
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Token 驗證錯誤:', error);
    return null;
  }
}

// 模擬 Session 儲存（實際應該用 MongoDB）
const sessions = new Map();

function createSession(userId, service) {
  const sessionToken = crypto.randomUUID();
  const session = {
    sessionToken,
    userId,
    services: [service],
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
  
  sessions.set(sessionToken, session);
  return session;
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // 設定 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Token');
  res.setHeader('Content-Type', 'application/json');

  // OPTIONS 請求
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // API 測試端點
  if (parsedUrl.pathname === '/api/test' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      message: 'API 測試成功！',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // 認證中介端點
  if (parsedUrl.pathname === '/api/auth/redirect' && req.method === 'GET') {
    const { tk } = parsedUrl.query;
    
    if (!tk) {
      // 跳轉到錯誤頁
      res.statusCode = 302;
      res.setHeader('Location', 'http://localhost:3000/error?msg=missing_token');
      res.end();
      return;
    }

    // 驗證 Token
    const payload = verifyShortToken(tk);
    
    if (!payload) {
      res.statusCode = 302;
      res.setHeader('Location', 'http://localhost:3000/error?msg=invalid_token');
      res.end();
      return;
    }

    console.log('Token 驗證成功:', payload);

    // 建立 Session
    const session = createSession(payload.userId, payload.service);
    console.log('Session 建立成功:', session.sessionToken);

    // 跳轉到對應服務頁面
    const redirectUrl = `http://localhost:3000/${payload.service}?auth=${session.sessionToken}`;
    res.statusCode = 302;
    res.setHeader('Location', redirectUrl);
    res.end();
    return;
  }

  // MyPage Profile API
  if (parsedUrl.pathname === '/api/mypage/profile' && req.method === 'GET') {
    const sessionToken = req.headers['x-session-token'];
    
    if (!sessionToken || !sessions.has(sessionToken)) {
      res.statusCode = 401;
      res.end(JSON.stringify({
        error: '未授權的請求',
        code: 'UNAUTHORIZED'
      }));
      return;
    }

    const session = sessions.get(sessionToken);
    
    // 回傳模擬的用戶資料
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      data: {
        userId: session.userId,
        profile: {
          name: `用戶_${session.userId.substring(0, 6)}`,
          avatar: null,
          language: 'zh-TW',
        },
        mypage: {
          firstLoginAt: session.createdAt,
          lastLoginAt: new Date(),
        },
        session: {
          services: session.services,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        }
      }
    }));
    return;
  }

  // 404
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not Found' }));
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`完整 API 伺服器運行在 http://localhost:${PORT}`);
  console.log(`測試端點:`);
  console.log(`- GET  http://localhost:${PORT}/api/test`);
  console.log(`- GET  http://localhost:${PORT}/api/auth/redirect?tk=...`);
  console.log(`- GET  http://localhost:${PORT}/api/mypage/profile`);
});