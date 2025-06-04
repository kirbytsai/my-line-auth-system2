/**
 * LIFF 認證 API
 * 處理從 LIFF 來的認證請求
 */

const { createSession } = require('../../lib/session.js');
const { getCollection } = require('../../lib/mongodb.js');
const https = require('https');

// 驗證 LINE ID Token
async function verifyIdToken(idToken) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams({
      id_token: idToken,
      client_id: process.env.LINE_CHANNEL_ID,
    }).toString();

    const options = {
      hostname: 'api.line.me',
      port: 443,
      path: '/oauth2/v2.1/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`驗證失敗: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  // 設定 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 處理 OPTIONS 請求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 只接受 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 檢查環境變數
  if (!process.env.LINE_CHANNEL_ID) {
    console.error('缺少 LINE_CHANNEL_ID 環境變數');
    return res.status(500).json({ error: '伺服器設定錯誤' });
  }

  try {
    const { idToken, profile, service } = req.body;
    
    console.log('收到 LIFF 認證請求:', { 
      hasIdToken: !!idToken, 
      profile: profile?.displayName,
      service 
    });

    // 驗證 ID Token
    const tokenData = await verifyIdToken(idToken);
    
    // 確認 Token 有效
    if (!tokenData.sub) {
      return res.status(401).json({ error: '無效的 ID Token' });
    }

    const userId = tokenData.sub; // LINE User ID

    // 查詢或建立用戶
    const users = await getCollection('users');
    let user = await users.findOne({ lineUserId: userId });
    
    if (!user) {
      // 新用戶，使用 LIFF 提供的資料
      console.log('建立新用戶:', userId);
      user = {
        lineUserId: userId,
        profile: {
          name: profile.displayName,
          avatar: profile.pictureUrl,
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
      // 更新用戶資料
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            'profile.name': profile.displayName,
            'profile.avatar': profile.pictureUrl,
            [`services.${service}.lastLoginAt`]: new Date(),
            updatedAt: new Date(),
          },
          $setOnInsert: {
            [`services.${service}.firstLoginAt`]: new Date(),
          }
        }
      );
    }

    // 建立 Session（已經設定為給所有服務權限）
    const metadata = {
      ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      authMethod: 'liff',
    };
    
    const session = await createSession(
      userId,
      service,
      user.profile,
      metadata
    );

    // 回傳 Session 資訊
    res.status(200).json({
      success: true,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      services: ['mypage', 'mymile'],
    });

  } catch (error) {
    console.error('LIFF 認證錯誤:', error);
    console.error('錯誤詳情:', error.message);
    console.error('錯誤堆疊:', error.stack);
    
    res.status(500).json({ 
      error: '認證失敗',
      message: error.message,
      // 開發環境顯示詳細錯誤
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};