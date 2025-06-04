import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import liff from '@line/liff';

function LiffEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeLiff();
  }, []);

  const initializeLiff = async () => {
    try {
      console.log('開始初始化 LIFF...');
      console.log('LIFF ID:', process.env.REACT_APP_LIFF_ID);
      
      // 檢查 LIFF SDK 是否載入
      if (!liff) {
        throw new Error('LIFF SDK 未載入');
      }
      
      // 初始化 LIFF
      await liff.init({ 
        liffId: process.env.REACT_APP_LIFF_ID,
        withLoginOnExternalBrowser: true, // 允許外部瀏覽器登入
      });
      
      console.log('LIFF 初始化成功');
      console.log('是否在 LINE 內:', liff.isInClient());
      console.log('是否已登入:', liff.isLoggedIn());

      // 檢查是否已登入 LINE
      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      // 取得用戶資料
      const profile = await liff.getProfile();
      const idToken = liff.getIDToken();
      
      // 取得要前往的服務（從 URL 參數）
      const service = searchParams.get('service') || 'mypage';

      // 呼叫後端 API 建立 Session
      const response = await fetch('/api/auth/liff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          profile,
          service,
        }),
      });

      if (!response.ok) {
        throw new Error('認證失敗');
      }

      const data = await response.json();
      
      // 儲存 Session Token
      localStorage.setItem('sessionToken', data.sessionToken);
      localStorage.setItem('sessionExpiresAt', data.expiresAt);
      
      // 關閉 LIFF 並跳轉到目標服務
      if (liff.isInClient()) {
        // 在 LINE 內開啟外部瀏覽器
        liff.openWindow({
          url: `${window.location.origin}/${service}?auth=${data.sessionToken}`,
          external: true,
        });
        
        // 關閉 LIFF
        liff.closeWindow();
      } else {
        // 直接跳轉
        navigate(`/${service}?auth=${data.sessionToken}`);
      }

    } catch (err) {
      console.error('LIFF 初始化錯誤:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="App-header">
        <h1>⏳ 登入中...</h1>
        <p>正在透過 LINE 進行身份驗證</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App-header">
        <h1>❌ 錯誤</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          重試
        </button>
      </div>
    );
  }

  return null;
}

export default LiffEntry;