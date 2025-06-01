import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apiStatus, setApiStatus] = useState('檢查中...');
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    // 測試 API 連線
    fetch('http://localhost:3001/api/test')
      .then(res => res.json())
      .then(data => {
        setApiStatus('API 連線成功！');
        setApiData(data);
      })
      .catch(err => {
        setApiStatus('API 連線失敗，請確認 api-server.js 是否運行中');
        console.error(err);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>LINE Auth System</h1>
        <p>歡迎使用 LINE 認證系統</p>
        
        <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #61dafb' }}>
          <h3>系統狀態</h3>
          <p>前端：✅ 運行中 (Port 3000)</p>
          <p>API：{apiStatus}</p>
          
          {apiData && (
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', textAlign: 'left' }}>
              <pre>{JSON.stringify(apiData, null, 2)}</pre>
            </div>
          )}
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h3>下一步</h3>
          <ul style={{ textAlign: 'left' }}>
            <li>✅ React 應用程式運行中</li>
            <li>✅ API 測試端點建立完成</li>
            <li>⏳ 等待實作 MongoDB 連線</li>
            <li>⏳ 等待實作認證功能</li>
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App;