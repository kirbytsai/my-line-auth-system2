// 簡單的測試連結生成器（不依賴其他模組）
const crypto = require('crypto');

// 從環境變數讀取（或使用預設值）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-please-change-this';
const API_URL = process.env.API_URL || 'http://localhost:3001';  // API 伺服器 URL
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function generateShortToken(payload) {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(8).toString('hex');
  
  const data = {
    ...payload,
    t: timestamp,
    n: nonce,
  };
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(JSON.stringify(data))
    .digest('hex');
  
  const token = Buffer.from(
    JSON.stringify({ ...data, sig: signature })
  ).toString('base64url');
  
  return token;
}

// 測試參數
const TEST_USER_ID = 'U123456789abcdef';

console.log('=== LINE Bot 認證連結生成器 (簡化版) ===\n');

// MyPage 連結
const mypageToken = generateShortToken({
  userId: TEST_USER_ID,
  service: 'mypage',
});
console.log('MyPage 連結:');
console.log(`${API_URL}/api/auth/redirect?tk=${mypageToken}`);
console.log('');

// MyMile 連結
const mymileToken = generateShortToken({
  userId: TEST_USER_ID,
  service: 'mymile',
});
console.log('MyMile 連結:');
console.log(`${API_URL}/api/auth/redirect?tk=${mymileToken}`);
console.log('');

console.log('提示: 連結有效期為 5 分鐘');