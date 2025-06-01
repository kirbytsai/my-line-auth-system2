const http = require('http');

const server = http.createServer((req, res) => {
  // 設定 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/api/test' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      message: 'API 測試成功！',
      timestamp: new Date().toISOString()
    }));
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`API 伺服器運行在 http://localhost:${PORT}`);
  console.log(`測試網址: http://localhost:${PORT}/api/test`);
});