/**
 * 測試 API 端點
 * 用於驗證 Vercel Functions 是否正常運作
 */

export default function handler(req, res) {
    // 設定 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    // 處理 OPTIONS 請求
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  
    // 回傳測試資料
    return res.status(200).json({
      success: true,
      message: 'API 測試成功！',
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: {
        'user-agent': req.headers['user-agent'],
        'host': req.headers.host,
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL ? 'true' : 'false',
      },
    });
  }