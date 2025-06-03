// 生產環境測試連結生成器
const crypto = require('crypto');

// 生產環境設定
const JWT_SECRET = 'your-secret-key-please-change-this'; // 要和 Vercel 環境變數一致！
const PROD_URL = 'https://my-line-auth-system2.vercel.app'; // 改成你的 Vercel URL

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

console.log('=== 生產環境測試連結 ===\n');

// MyPage 連結
const mypageToken = generateShortToken({
  userId: TEST_USER_ID,
  service: 'mypage',
});
console.log('MyPage 連結:');
console.log(`${PROD_URL}/api/auth/redirect?tk=${mypageToken}`);
console.log('');

// MyMile 連結  
const mymileToken = generateShortToken({
  userId: TEST_USER_ID,
  service: 'mymile',
});
console.log('MyMile 連結:');
console.log(`${PROD_URL}/api/auth/redirect?tk=${mymileToken}`);
console.log('');

console.log('提示: 連結有效期為 5 分鐘');
console.log('確保 JWT_SECRET 和 Vercel 環境變數中的一致！');
