import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const [apiStatus, setApiStatus] = useState('檢查中...');

  useEffect(() => {
    // 測試 API 連線
    const apiUrl = process.env.REACT_APP_API_URL || '';
    fetch(`${apiUrl}/api/test`)
      .then(res => res.json())
      .then(data => {
        setApiStatus('✅ API 連線成功！');
      })
      .catch(err => {
        setApiStatus('❌ API 連線失敗');
        console.error(err);
      });
  }, []);

  return (
    <header className="App-header">
      <h1>🔐 LINE Auth System</h1>
      <p>歡迎使用 LINE 認證系統</p>
      
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #61dafb', borderRadius: '8px' }}>
        <h3>系統狀態</h3>
        <p>前端：✅ 運行中 (Port 3000)</p>
        <p>API：{apiStatus}</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>測試連結</h3>
        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
          請使用 generate-test-link.js 生成認證連結
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Link to="/mypage" style={{ color: '#61dafb' }}>MyPage →</Link>
          <Link to="/mymile" style={{ color: '#61dafb' }}>MyMile →</Link>
        </div>
      </div>

      <div style={{ marginTop: '3rem', fontSize: '0.8rem', opacity: 0.5 }}>
        <p>認證流程：LINE Bot → 認證連結 → 自動登入 → 服務頁面</p>
      </div>
    </header>
  );
}

export default Home;