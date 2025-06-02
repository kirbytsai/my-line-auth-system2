/**
 * MongoDB 連線測試
 * 執行: node test-mongodb.js
 */

// 載入環境變數（ES6 模組的特殊載入方式）
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { getDatabase, getCollection } from './lib/mongodb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 載入 .env.local
config({ path: join(__dirname, '.env.local') });


async function testConnection() {
  console.log('開始測試 MongoDB 連線...');
  
  try {
    // 測試資料庫連線
    const db = await getDatabase();
    console.log('✅ 資料庫連線成功');
    
    // 測試寫入
    const testCollection = await getCollection('test');
    const testDoc = {
      message: '測試文件',
      timestamp: new Date(),
      random: Math.random()
    };
    
    const result = await testCollection.insertOne(testDoc);
    console.log('✅ 寫入測試成功:', result.insertedId);
    
    // 測試讀取
    const doc = await testCollection.findOne({ _id: result.insertedId });
    console.log('✅ 讀取測試成功:', doc);
    
    // 清理測試資料
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('✅ 清理測試資料成功');
    
    // 列出所有集合
    const collections = await db.listCollections().toArray();
    console.log('📁 現有集合:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
  
  // 結束程式
  process.exit(0);
}

testConnection();