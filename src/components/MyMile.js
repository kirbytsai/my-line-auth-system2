import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { apiUtils } from '../services/api';

function MyMile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // 狀態管理
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [mileData, setMileData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    handleAuthentication();
  }, []);

  // 處理認證流程
  const handleAuthentication = async () => {
    try {
      // 1. 檢查 URL 中的 auth token
      const authToken = searchParams.get('auth');
      
      if (authToken) {
        console.log('發現認證 Token，儲存中...');
        
        // 儲存 Session Token
        apiUtils.saveSessionToken(authToken, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
        
        // 清理 URL（移除 token）
        window.history.replaceState({}, '', '/mymile');
      }

      // 2. 檢查是否有有效的 Session
      const sessionToken = localStorage.getItem('sessionToken');
      
      if (!sessionToken) {
        setError('未登入');
        setLoading(false);
        return;
      }

      // 3. 檢查 Session 是否過期
      if (apiUtils.isSessionExpired()) {
        setError('Session 已過期');
        setLoading(false);
        return;
      }

      // 4. 設定已認證（暫時使用假資料）
      setAuthenticated(true);
      
      // 模擬 MyMile 資料
      setMileData({
        userId: 'U123456789',
        currentMiles: 12500,
        level: 'Gold',
        expireDate: '2025-12-31',
        recentActivity: [
          { date: '2024-06-01', miles: 500, description: '飛行里程' },
          { date: '2024-05-15', miles: 200, description: '信用卡消費' },
          { date: '2024-05-01', miles: -1000, description: '兌換商品' },
        ]
      });

    } catch (err) {
      console.error('認證錯誤:', err);
      setError('系統錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 登出功能
  const handleLogout = async () => {
    try {
      await api.auth.logout();
      navigate('/');
    } catch (err) {
      console.error('登出錯誤:', err);
    }
  };

  // 載入中畫面
  if (loading) {
    return (
      <div className="App-header">
        <h1>⏳ 載入中...</h1>
        <p>正在驗證身份</p>
      </div>
    );
  }

  // 錯誤畫面
  if (error) {
    return (
      <div className="App-header">
        <h1>❌ {error}</h1>
        <p>請從 LINE Bot 重新進入</p>
        <button 
          onClick={() => navigate('/')}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            backgroundColor: '#61dafb',
            color: '#282c34',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          返回首頁
        </button>
      </div>
    );
  }

  // 已認證畫面
  return (
    <div className="App-header">
      <h1>✈️ MyMile</h1>
      
      {mileData && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '2rem', 
          border: '1px solid #61dafb', 
          borderRadius: '8px',
          maxWidth: '500px',
          width: '100%',
        }}>
          <h2>里程總覽</h2>
          
          <div style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: '#61dafb',
            margin: '1rem 0'
          }}>
            {mileData.currentMiles.toLocaleString()} 里
          </div>
          
          <div style={{ textAlign: 'left', marginTop: '1rem' }}>
            <p><strong>會員等級：</strong>{mileData.level}</p>
            <p><strong>里程有效期限：</strong>{mileData.expireDate}</p>
            
            <hr style={{ margin: '1rem 0', opacity: 0.3 }} />
            
            <h3>最近活動</h3>
            <div style={{ fontSize: '0.9rem' }}>
              {mileData.recentActivity.map((activity, index) => (
                <div key={index} style={{ 
                  marginBottom: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: 'rgba(97, 218, 251, 0.1)',
                  borderRadius: '4px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{activity.date}</span>
                    <span style={{ 
                      color: activity.miles > 0 ? '#4CAF50' : '#ff6b6b',
                      fontWeight: 'bold'
                    }}>
                      {activity.miles > 0 ? '+' : ''}{activity.miles}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                    {activity.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <button 
          onClick={handleLogout}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          登出
        </button>
        
        <button 
          onClick={() => navigate('/mypage')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            backgroundColor: '#61dafb',
            color: '#282c34',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          前往 MyPage →
        </button>
      </div>
    </div>
  );
}

export default MyMile;