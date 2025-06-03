/**
 * LINE Bot Webhook 處理
 * 接收並處理 LINE 平台的事件
 */

const crypto = require('crypto');

// LINE Bot 設定
const channelSecret = process.env.LINE_CHANNEL_SECRET;
const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// 驗證 LINE 簽名
function validateSignature(body, signature) {
  if (!signature) {
    return false;
  }
  
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
}

// 回覆訊息
async function replyMessage(replyToken, messages) {
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: Array.isArray(messages) ? messages : [messages],
    }),
  });
  
  if (!response.ok) {
    console.error('回覆失敗:', await response.text());
  }
}

// 生成安全連結（與 simple-test-link.js 相同邏輯）
function generateSecureLink(userId, service) {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(8).toString('hex');
  
  const data = {
    userId,
    service,
    t: timestamp,
    n: nonce,
  };
  
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(JSON.stringify(data))
    .digest('hex');
  
  const token = Buffer.from(
    JSON.stringify({ ...data, sig: signature })
  ).toString('base64url');
  
  const baseUrl = process.env.FRONTEND_URL || 'https://my-line-auth-system2.vercel.app';
  return `${baseUrl}/api/auth/redirect?tk=${token}`;
}

// 處理文字訊息
async function handleTextMessage(event) {
  const text = event.message.text.toLowerCase();
  
  if (text === 'mypage' || text === 'my page') {
    const link = generateSecureLink(event.source.userId, 'mypage');
    await replyMessage(event.replyToken, {
      type: 'text',
      text: `請點擊以下連結進入 MyPage：\n${link}\n\n連結有效期限：5分鐘`,
    });
  } else if (text === 'mymile' || text === 'my mile') {
    const link = generateSecureLink(event.source.userId, 'mymile');
    await replyMessage(event.replyToken, {
      type: 'text',
      text: `請點擊以下連結進入 MyMile：\n${link}\n\n連結有效期限：5分鐘`,
    });
  } else {
    await replyMessage(event.replyToken, {
      type: 'text',
      text: '請輸入 "MyPage" 或 "MyMile" 來取得登入連結。',
    });
  }
}

// 處理 Postback（Rich Menu 點擊）
async function handlePostback(event) {
  const data = event.postback.data;
  const params = new URLSearchParams(data);
  const action = params.get('action');
  
  if (action === 'mypage' || action === 'mymile') {
    const link = generateSecureLink(event.source.userId, action);
    const serviceName = action === 'mypage' ? 'MyPage' : 'MyMile';
    
    await replyMessage(event.replyToken, {
      type: 'text',
      text: `請點擊以下連結進入 ${serviceName}：\n${link}\n\n連結有效期限：5分鐘`,
    });
  }
}

// 主要處理函數
module.exports = async function handler(req, res) {
  // 只接受 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 檢查是否有必要的環境變數
  if (!channelSecret || !channelAccessToken) {
    console.error('缺少 LINE 環境變數設定');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // 取得請求內容
  const body = JSON.stringify(req.body);
  const signature = req.headers['x-line-signature'];

  // 驗證簽名
  if (!validateSignature(body, signature)) {
    console.error('簽名驗證失敗');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // 處理事件
  try {
    const { events } = req.body;
    
    // LINE Verify 會發送空的 events 陣列
    if (!events || events.length === 0) {
      console.log('收到驗證請求或空事件');
      return res.status(200).json({ success: true });
    }
    
    for (const event of events) {
      console.log('收到事件:', event.type);
      
      // 如果是 Webhook 驗證事件，直接回應 200
      if (event.replyToken === '00000000000000000000000000000000' || 
          event.replyToken === 'ffffffffffffffffffffffffffffffff') {
        continue;
      }
      
      switch (event.type) {
        case 'message':
          if (event.message.type === 'text') {
            await handleTextMessage(event);
          }
          break;
          
        case 'postback':
          await handlePostback(event);
          break;
          
        case 'follow':
          // 新用戶加入
          await replyMessage(event.replyToken, {
            type: 'text',
            text: '歡迎使用 LINE Auth System！\n\n請使用選單或輸入 "MyPage" / "MyMile" 來登入。',
          });
          break;
      }
    }
    
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('處理事件錯誤:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};