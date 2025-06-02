/**
 * MongoDB 連線管理
 * 使用連線池模式，避免重複連線
 */

import { MongoClient } from 'mongodb';

// 延遲檢查環境變數
function getMongoUri() {
  if (!process.env.MONGODB_URI) {
    throw new Error('請在環境變數中設定 MONGODB_URI');
  }
  return process.env.MONGODB_URI;
}

const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 10000,
};

let client;
let clientPromise;

// 延遲初始化連線
function initializeClient() {
  if (!clientPromise) {
    const uri = getMongoUri();
    
    if (process.env.NODE_ENV === 'development') {
      // 開發環境：使用全域變數避免熱重載時重複連線
      if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
      }
      clientPromise = global._mongoClientPromise;
    } else {
      // 生產環境：正常連線
      client = new MongoClient(uri, options);
      clientPromise = client.connect();
    }
    
    // 連線成功後的日誌
    clientPromise
      .then(() => console.log('✅ MongoDB 連線成功'))
      .catch((err) => console.error('❌ MongoDB 連線失敗:', err));
  }
  
  return clientPromise;
}

/**
 * 取得資料庫實例
 * @param {string} dbName - 資料庫名稱，預設為 'line-auth-system'
 * @returns {Promise<Db>} MongoDB 資料庫實例
 */
export async function getDatabase(dbName = 'line-auth-system') {
  const clientPromise = initializeClient();
  const client = await clientPromise;
  return client.db(dbName);
}

/**
 * 取得集合實例
 * @param {string} collectionName - 集合名稱
 * @param {string} dbName - 資料庫名稱
 * @returns {Promise<Collection>} MongoDB 集合實例
 */
export async function getCollection(collectionName, dbName = 'line-auth-system') {
  const db = await getDatabase(dbName);
  return db.collection(collectionName);
}

// 匯出初始化函數供其他模組使用
export default initializeClient;