import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import MyPage from './components/MyPage';
import MyMile from './components/MyMile';
import LiffEntry from './components/LiffEntry';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/liff" element={<LiffEntry />} />  
          <Route path="/" element={<Home />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mymile" element={<MyMile />} />
          <Route path="/error" element={<ErrorPage />} />
        </Routes>
      </div>
    </Router>
  );
}

// 簡單的錯誤頁面元件
function ErrorPage() {
  const params = new URLSearchParams(window.location.search);
  const errorMsg = params.get('msg') || 'unknown_error';
  
  const errorMessages = {
    missing_token: '缺少認證資訊',
    invalid_token: '認證連結無效或已過期',
    invalid_service: '無效的服務',
    server_error: '伺服器錯誤',
    session_expired: 'Session 已過期，請重新登入',
  };
  
  return (
    <div className="App-header">
      <h1>❌ 錯誤</h1>
      <p>{errorMessages[errorMsg] || '發生未知錯誤'}</p>
      <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>錯誤代碼: {errorMsg}</p>
    </div>
  );
}

export default App;