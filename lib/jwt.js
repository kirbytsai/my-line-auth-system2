/**
 * JWT Token 工具函數
 * 用於生成和驗證 Token
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { TIME_CONSTANTS } from './constants.js';

// 延遲取得 JWT_SECRET，讓環境變數有時間載入
function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('請在環境變數中設定 JWT_SECRET');
  }
  return process.env.JWT_SECRET;
}

/**
 * 生成短期 Token（用於 LINE Bot 連結）
 * @param {Object} payload - Token 內容
 * @param {string} payload.userId - LINE 用戶 ID
 * @param {string} payload.service - 目標服務
 * @returns {string} 簽名後的 Token
 */
export function generateShortToken(payload) {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(8).toString('hex');
  
  const data = {
    ...payload,
    t: timestamp,
    n: nonce,
  };
  
  // 使用 HMAC-SHA256 簽名
  const signature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(JSON.stringify(data))
    .digest('hex');
  
  // 組合 payload 和簽名
  const token = Buffer.from(
    JSON.stringify({ ...data, sig: signature })
  ).toString('base64url');
  
  return token;
}

/**
 * 驗證短期 Token
 * @param {string} token - 要驗證的 Token
 * @returns {Object|null} 驗證成功返回 payload，失敗返回 null
 */
export function verifyShortToken(token) {
  try {
    // 解碼 Token
    const decoded = JSON.parse(
      Buffer.from(token, 'base64url').toString('utf8')
    );
    
    const { sig, ...payload } = decoded;
    
    // 檢查時效性（5分鐘）
    const now = Date.now();
    if (now - payload.t > TIME_CONSTANTS.LINK_EXPIRY) {
      console.log('Token 已過期');
      return null;
    }
    
    // 驗證簽名
    const expectedSig = crypto
      .createHmac('sha256', getJwtSecret())
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

/**
 * 生成標準 JWT Token（用於 API 認證）
 * @param {Object} payload - Token 內容
 * @param {string} expiresIn - 過期時間，預設 '10m'
 * @returns {string} JWT Token
 */
export function generateJWT(payload, expiresIn = '10m') {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn,
    issuer: 'line-auth-system',
  });
}

/**
 * 驗證標準 JWT Token
 * @param {string} token - JWT Token
 * @returns {Object|null} 驗證成功返回 payload，失敗返回 null
 */
export function verifyJWT(token) {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      issuer: 'line-auth-system',
    });
    return decoded;
  } catch (error) {
    console.error('JWT 驗證錯誤:', error.message);
    return null;
  }
}

/**
 * 從請求中提取 Token
 * @param {Request} req - HTTP 請求物件
 * @returns {string|null} Token 或 null
 */
export function extractToken(req) {
  // 從 Authorization header 提取
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 從 Cookie 提取
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  // 從 Query 參數提取（僅用於特殊情況）
  if (req.query && req.query.token) {
    return req.query.token;
  }
  
  return null;
}