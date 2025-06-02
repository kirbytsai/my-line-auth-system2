// 檢查環境變數載入
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 嘗試載入 .env.local
const result = config({ path: join(__dirname, '.env.local') });

console.log('=== 環境變數檢查 ===\n');

if (result.error) {
  console.error('❌ 載入 .env.local 失敗:', result.error);
} else {
  console.log('✅ 成功載入 .env.local');
}

console.log('\n目前的環境變數:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已設定' : '未設定');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '已設定' : '未設定');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '未設定');

console.log('\n工作目錄:', __dirname);
console.log('.env.local 路徑:', join(__dirname, '.env.local'));