/**
 * 測試用連結生成器
 * 模擬 LINE Bot 生成認證連結
 * 執行: node generate-test-link.js
 */

// 載入環境變數（ES6 模組的特殊載入方式）
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateShortToken } from './lib/jwt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 載入 .env.local
config({ path: join(__dirname, '.env.local') });



// 測試參數
const TEST_USER_ID = 'U123456789abcdef'; // 模擬的 LINE User ID
const TEST_SERVICE = 'mypage'; // 或 'mymile'

// 生成連結
function generateTestLink(userId, service) {
  const token = generateShortToken({
    userId,
    service,
  });
  
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const link = `${baseUrl}/api/auth/redirect?tk=${token}`;
  
  return link;
}

// 執行測試
console.log('=== LINE Bot 認證連結生成器 ===\n');

// 生成 MyPage 連結
const mypageLink = generateTestLink(TEST_USER_ID, 'mypage');
console.log('MyPage 連結:');
console.log(mypageLink);
console.log('');

// 生成 MyMile 連結
const mymileLink = generateTestLink(TEST_USER_ID, 'mymile');
console.log('MyMile 連結:');
console.log(mymileLink);
console.log('');

console.log('提示:');
console.log('1. 確保前端 (npm start) 和 API (node api-server.js) 都在運行');
console.log('2. 在瀏覽器中開啟上述連結進行測試');
console.log('3. 連結有效期為 5 分鐘');
console.log('\n=================================');