/**
 * 認證中介服務
 * 處理從 LINE Bot 來的認證請求
 */

import { verifyShortToken } from '../../lib/jwt.js';
import { createSession } from '../../lib/session.js';
import { getCollection } from '../../lib/mongodb.js';
import { ERROR_MESSAGES, HTTP_STATUS, SERVICES } from '../../lib/constants.js';

export default async function handler(req, res) {
  // 只接受 GET 請求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 從 Query 參數取得 token
    const { tk } = req.query;
    
    if (!tk) {
      console.log('缺少 token 參數');
      return res.redirect(302, `${process.env.FRONTEND_URL}/error?msg=missing_token`);
    }

    // 驗證短期 Token
    const payload = verifyShortToken(tk);
    
    if (!payload) {
      console.log('Token 驗證失敗');
      return res.redirect(302, `${process.env.FRONTEND_URL}/error?msg=invalid_token`);
    }

    // 解構 payload
    const { u: userId, s: service, t: timestamp, n: nonce } = payload;
    
    console.log('Token 驗證成功:', { userId, service, timestamp });

    // 驗證服務名稱
    const validServices = Object.values(SERVICES);
    if (!validServices.includes(service)) {
      return res.redirect(302, `${process.env.FRONTEND_URL}/error?msg=invalid_service`);
    }

    // 查詢或建立用戶
    const users = await getCollection('users');
    let user = await users.findOne({ lineUserId: userId });
    
    if (!user) {
      // 新用戶，建立資料
      console.log('建立新用戶:', userId);
      user = {
        lineUserId: userId,
        profile: {
          name: `用戶_${userId.substring(0, 6)}`,
          avatar: null,
          language: 'zh-TW',
        },
        services: {
          [service]: {
            firstLoginAt: new Date(),
            lastLoginAt: new Date(),
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await users.insertOne(user);
    } else {
      // 更新用戶最後登入時間
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            [`services.${service}.lastLoginAt`]: new Date(),
            updatedAt: new Date(),
          },
          $setOnInsert: {
            [`services.${service}.firstLoginAt`]: new Date(),
          }
        }
      );
    }

    // 建立 Session
    const metadata = {
      ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    
    const session = await createSession(
      userId,
      service,
      user.profile,
      metadata
    );
    
    console.log('Session 建立成功:', session.sessionToken);

    // 記錄認證日誌
    const authLogs = await getCollection('authLogs');
    await authLogs.insertOne({
      userId,
      service,
      sessionToken: session.sessionToken,
      method: 'line_bot_link',
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      timestamp: new Date(),
    });

    // 跳轉到前端，帶上 Session Token
    const redirectUrl = `${process.env.FRONTEND_URL}/${service}?auth=${session.sessionToken}`;
    console.log('跳轉至:', redirectUrl);
    
    res.redirect(302, redirectUrl);

  } catch (error) {
    console.error('認證中介服務錯誤:', error);
    
    // 錯誤時跳轉到錯誤頁面
    res.redirect(302, `${process.env.FRONTEND_URL}/error?msg=server_error`);
  }
}

/**
 * Vercel 設定
 */
export const config = {
  api: {
    bodyParser: false, // 不需要 body parser
  },
};