/**
 * API 服務模組
 * 處理所有 API 呼叫
 */

import axios from 'axios';

// 定義快取鍵值（因為前端無法直接引用後端的 constants）
const CACHE_KEYS = {
  SESSION_TOKEN: 'sessionToken',
  SESSION_EXPIRES: 'sessionExpiresAt',
  USER_PROFILE: 'userProfile',
  PROFILE_TIMESTAMP: 'profileTimestamp',
};

// API 基礎 URL
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// 建立 axios 實例
const apiClient = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  timeout: 30000, // 30 秒逾時
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器 - 自動附加 Session Token
apiClient.interceptors.request.use(
  (config) => {
    const sessionToken = localStorage.getItem(CACHE_KEYS.SESSION_TOKEN);
    if (sessionToken) {
      config.headers['X-Session-Token'] = sessionToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 回應攔截器 - 處理錯誤
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 處理 401 錯誤 - 清除 Session
      if (error.response.status === 401) {
        localStorage.removeItem(CACHE_KEYS.SESSION_TOKEN);
        localStorage.removeItem(CACHE_KEYS.SESSION_EXPIRES);
        localStorage.removeItem(CACHE_KEYS.USER_PROFILE);
        
        // 跳轉到錯誤頁面
        window.location.href = '/error?msg=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * API 服務物件
 */
export const api = {
  /**
   * 測試 API 連線
   */
  test: async () => {
    const response = await apiClient.get('/test');
    return response.data;
  },

  /**
   * MyPage 服務
   */
  mypage: {
    /**
     * 取得個人資料
     */
    getProfile: async () => {
      const response = await apiClient.get('/mypage/profile');
      return response.data;
    },

    /**
     * 更新個人資料
     */
    updateProfile: async (data) => {
      const response = await apiClient.put('/mypage/profile', data);
      return response.data;
    },
  },

  /**
   * MyMile 服務
   */
  mymile: {
    /**
     * 取得里程資料
     */
    getData: async () => {
      const response = await apiClient.get('/mymile/data');
      return response.data;
    },

    /**
     * 取得里程歷史
     */
    getHistory: async (params) => {
      const response = await apiClient.get('/mymile/history', { params });
      return response.data;
    },
  },

  /**
   * 認證相關
   */
  auth: {
    /**
     * 登出
     */
    logout: async () => {
      const sessionToken = localStorage.getItem(CACHE_KEYS.SESSION_TOKEN);
      if (sessionToken) {
        try {
          await apiClient.post('/auth/logout', { sessionToken });
        } catch (error) {
          console.error('登出錯誤:', error);
        }
      }
      
      // 清除本地儲存
      localStorage.removeItem(CACHE_KEYS.SESSION_TOKEN);
      localStorage.removeItem(CACHE_KEYS.SESSION_EXPIRES);
      localStorage.removeItem(CACHE_KEYS.USER_PROFILE);
      localStorage.removeItem(CACHE_KEYS.PROFILE_TIMESTAMP);
    },

    /**
     * 檢查 Session 狀態
     */
    checkSession: async () => {
      const response = await apiClient.get('/auth/session');
      return response.data;
    },
  },
};

/**
 * 工具函數
 */
export const apiUtils = {
  /**
   * 儲存 Session Token
   */
  saveSessionToken: (token, expiresAt) => {
    localStorage.setItem(CACHE_KEYS.SESSION_TOKEN, token);
    localStorage.setItem(CACHE_KEYS.SESSION_EXPIRES, expiresAt);
  },

  /**
   * 檢查 Session 是否過期
   */
  isSessionExpired: () => {
    const expiresAt = localStorage.getItem(CACHE_KEYS.SESSION_EXPIRES);
    if (!expiresAt) return true;
    
    return new Date(expiresAt) < new Date();
  },

  /**
   * 快取用戶資料
   */
  cacheUserProfile: (profile) => {
    localStorage.setItem(CACHE_KEYS.USER_PROFILE, JSON.stringify(profile));
    localStorage.setItem(CACHE_KEYS.PROFILE_TIMESTAMP, new Date().toISOString());
  },

  /**
   * 取得快取的用戶資料
   */
  getCachedProfile: () => {
    const profile = localStorage.getItem(CACHE_KEYS.USER_PROFILE);
    const timestamp = localStorage.getItem(CACHE_KEYS.PROFILE_TIMESTAMP);
    
    if (!profile || !timestamp) return null;
    
    // 檢查快取是否過期（1小時）
    const cacheAge = Date.now() - new Date(timestamp).getTime();
    if (cacheAge > 60 * 60 * 1000) {
      return null;
    }
    
    try {
      return JSON.parse(profile);
    } catch (error) {
      return null;
    }
  },
};

export default api;