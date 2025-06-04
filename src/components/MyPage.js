import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { apiUtils } from '../services/api';

function MyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // 狀態管理
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [profile, setProfile] = useState(null);
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
        window.history.replaceState({}, '', '/mypage');
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

      // 4. 嘗試從快取取得用戶資料
      const cachedProfile = apiUtils.getCachedProfile();
      
      if (cachedProfile) {
        console.log('使用快取的用戶資料');
        setProfile(cachedProfile);
        setAuthenticated(true);
      }

      // 5. 從 API 取得最新資料
      console.log('從 API 取得用戶資料...');
      const response = await api.mypage.getProfile();
      
      if (response.success) {
        setProfile(response.data);
        setAuthenticated(true);
        
        // 快取用戶資料
        apiUtils.cacheUserProfile(response.data);
      } else {
        setError('無法取得用戶資料');
      }

    } catch (err) {
      console.error('認證錯誤:', err);
      
      if (err.response?.status === 401) {
        setError('認證失敗，請重新登入');
        // 清除無效的 Session
        apiUtils.saveSessionToken(null, null);
      } else {
        setError('系統錯誤，請稍後再試');
      }
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
      <h1>📄 MyPage</h1>
      
      {profile && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '2rem', 
          border: '1px solid #61dafb', 
          borderRadius: '8px',
          maxWidth: '500px',
          width: '100%',
        }}>
          <h2>👤 個人資料</h2>
          
          {/* 顯示用戶頭像 */}
          {profile.profile.avatar && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              marginBottom: '1rem' 
            }}>
              <img 
                src={profile.profile.avatar} 
                alt="用戶頭像"
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  border: '3px solid #61dafb',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <div style={{ textAlign: 'left', marginTop: '1rem' }}>
            <p><strong>用戶 ID：</strong>{profile.userId}</p>
            <p><strong>名稱：</strong>{profile.profile.name}</p>
            <p><strong>語言：</strong>{profile.profile.language}</p>
            
            <hr style={{ margin: '1rem 0', opacity: 0.3 }} />
            
            <h3>MyPage 資訊</h3>
            <p><strong>首次登入：</strong>
              {profile.mypage.firstLoginAt ? 
                new Date(profile.mypage.firstLoginAt).toLocaleString('zh-TW') : 
                '無'
              }
            </p>
            <p><strong>最後登入：</strong>
              {profile.mypage.lastLoginAt ? 
                new Date(profile.mypage.lastLoginAt).toLocaleString('zh-TW') : 
                '無'
              }
            </p>
            
            <hr style={{ margin: '1rem 0', opacity: 0.3 }} />
            
            <h3>Session 資訊</h3>
            <p><strong>可存取服務：</strong>{profile.session.services.join(', ')}</p>
            <p><strong>Session 建立：</strong>
              {new Date(profile.session.createdAt).toLocaleString('zh-TW')}
            </p>
            <p><strong>過期時間：</strong>
              {new Date(profile.session.expiresAt).toLocaleString('zh-TW')}
            </p>
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
          onClick={() => navigate('/mymile')}
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
          前往 MyMile →
        </button>
      </div>
    </div>
  );
}

export default MyPage;