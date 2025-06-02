/**
 * Session 管理模組
 * 處理 Session 的建立、驗證和清理
 */

import crypto from 'crypto';
import { getCollection } from './mongodb.js';
import { TIME_CONSTANTS, SERVICES } from './constants.js';

/**
 * 建立新的 Session
 * @param {string} userId - LINE 用戶 ID
 * @param {string} service - 初始服務
 * @param {Object} userInfo - 用戶基本資訊
 * @param {Object} metadata - 額外的 metadata（IP、User Agent 等）
 * @returns {Promise<Object>} Session 物件
 */
export async function createSession(userId, service, userInfo = {}, metadata = {}) {
  const sessions = await getCollection('sessions');
  
  // 生成唯一的 Session Token
  const sessionToken = crypto.randomUUID();
  
  // 建立 Session 物件
  const session = {
    sessionToken,
    userId,
    services: [service], // 初始可存取的服務
    userCache: {
      name: userInfo.name || 'LINE 用戶',
      avatar: userInfo.avatar || null,
      language: userInfo.language || 'zh-TW',
    },
    ipAddress: metadata.ipAddress || null,
    userAgent: metadata.userAgent || null,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + TIME_CONSTANTS.SESSION_EXPIRY),
    lastAccessAt: new Date(),
  };
  
  // 儲存到資料庫
  await sessions.insertOne(session);
  
  return session;
}

/**
 * 驗證 Session Token
 * @param {string} sessionToken - Session Token
 * @returns {Promise<Object|null>} Session 物件或 null
 */
export async function verifySession(sessionToken) {
  if (!sessionToken) return null;
  
  const sessions = await getCollection('sessions');
  
  // 查詢 Session
  const session = await sessions.findOne({
    sessionToken,
    expiresAt: { $gt: new Date() }, // 未過期
  });
  
  if (!session) return null;
  
  // 更新最後存取時間
  await sessions.updateOne(
    { _id: session._id },
    { 
      $set: { lastAccessAt: new Date() },
      $addToSet: { accessLog: { timestamp: new Date() } }
    }
  );
  
  return session;
}

/**
 * 為 Session 新增服務存取權限
 * @param {string} sessionToken - Session Token
 * @param {string} service - 要新增的服務
 * @returns {Promise<boolean>} 是否成功
 */
export async function addServiceToSession(sessionToken, service) {
  const sessions = await getCollection('sessions');
  
  // 驗證服務名稱
  const validServices = Object.values(SERVICES);
  if (!validServices.includes(service)) {
    throw new Error(`無效的服務名稱: ${service}`);
  }
  
  const result = await sessions.updateOne(
    { 
      sessionToken,
      expiresAt: { $gt: new Date() }
    },
    { 
      $addToSet: { services: service },
      $set: { lastAccessAt: new Date() }
    }
  );
  
  return result.modifiedCount > 0;
}

/**
 * 檢查 Session 是否可存取特定服務
 * @param {Object} session - Session 物件
 * @param {string} service - 服務名稱
 * @returns {boolean} 是否可存取
 */
export function canAccessService(session, service) {
  if (!session || !session.services) return false;
  return session.services.includes(service);
}

/**
 * 刪除 Session
 * @param {string} sessionToken - Session Token
 * @returns {Promise<boolean>} 是否成功
 */
export async function deleteSession(sessionToken) {
  const sessions = await getCollection('sessions');
  
  const result = await sessions.deleteOne({ sessionToken });
  
  return result.deletedCount > 0;
}

/**
 * 清理過期的 Sessions
 * @returns {Promise<number>} 清理的數量
 */
export async function cleanExpiredSessions() {
  const sessions = await getCollection('sessions');
  
  const result = await sessions.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  
  console.log(`清理了 ${result.deletedCount} 個過期的 Sessions`);
  return result.deletedCount;
}

/**
 * 取得用戶的所有有效 Sessions
 * @param {string} userId - 用戶 ID
 * @returns {Promise<Array>} Session 列表
 */
export async function getUserSessions(userId) {
  const sessions = await getCollection('sessions');
  
  const userSessions = await sessions
    .find({
      userId,
      expiresAt: { $gt: new Date() }
    })
    .sort({ lastAccessAt: -1 })
    .toArray();
  
  return userSessions;
}

/**
 * Session 中間件
 * @param {Request} req - 請求物件
 * @param {Response} res - 回應物件
 * @returns {Promise<Object|null>} Session 物件或 null
 */
export async function sessionMiddleware(req, res) {
  // 從 Header 或 Cookie 取得 Session Token
  const sessionToken = 
    req.headers['x-session-token'] || 
    req.cookies?.sessionToken ||
    req.query?.sessionToken;
  
  if (!sessionToken) {
    return null;
  }
  
  const session = await verifySession(sessionToken);
  
  if (!session) {
    // 清除無效的 Cookie
    if (res && res.clearCookie) {
      res.clearCookie('sessionToken');
    }
    return null;
  }
  
  // 將 Session 附加到請求物件
  req.session = session;
  
  return session;
}