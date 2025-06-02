/**
 * MyPage Profile API
 * 取得用戶個人資料
 */

import { verifySession, canAccessService } from '../../lib/session.js';
import { getCollection } from '../../lib/mongodb.js';
import { ERROR_MESSAGES, HTTP_STATUS, SERVICES } from '../../lib/constants.js';

export default async function handler(req, res) {
  // 設定 CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Token');
  
  // 處理 OPTIONS 請求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 只接受 GET 請求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 從 Header 取得 Session Token
    const sessionToken = req.headers['x-session-token'];
    
    if (!sessionToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.UNAUTHORIZED,
        code: 'NO_SESSION',
      });
    }

    // 驗證 Session
    const session = await verifySession(sessionToken);
    
    if (!session) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.INVALID_SESSION,
        code: 'INVALID_SESSION',
      });
    }

    // 檢查是否有 MyPage 存取權限
    if (!canAccessService(session, SERVICES.MYPAGE)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: '無權存取 MyPage 服務',
        code: 'SERVICE_NOT_ALLOWED',
      });
    }

    // 取得用戶資料
    const users = await getCollection('users');
    const user = await users.findOne({ lineUserId: session.userId });
    
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: '找不到用戶資料',
        code: 'USER_NOT_FOUND',
      });
    }

    // 準備回傳資料
    const profileData = {
      userId: user.lineUserId,
      profile: {
        name: user.profile.name,
        avatar: user.profile.avatar,
        language: user.profile.language,
      },
      mypage: {
        firstLoginAt: user.services?.mypage?.firstLoginAt,
        lastLoginAt: user.services?.mypage?.lastLoginAt,
        preferences: user.services?.mypage?.preferences || {},
      },
      session: {
        services: session.services,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      },
    };

    // 回傳成功
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: profileData,
    });

  } catch (error) {
    console.error('MyPage Profile API 錯誤:', error);
    
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      error: ERROR_MESSAGES.DB_ERROR,
      code: 'INTERNAL_ERROR',
    });
  }
}