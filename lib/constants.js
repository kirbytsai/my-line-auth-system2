// 時間常數
export const TIME_CONSTANTS = {
    LINK_EXPIRY: 5 * 60 * 1000,        // 連結有效期：5分鐘
    SESSION_EXPIRY: 24 * 60 * 60 * 1000, // Session有效期：24小時
    TOKEN_EXPIRY: 10 * 60 * 1000,       // JWT Token有效期：10分鐘
  };
  
  // 服務名稱
  export const SERVICES = {
    MYPAGE: 'mypage',
    MYMILE: 'mymile',
  };
  
  // 錯誤訊息
  export const ERROR_MESSAGES = {
    INVALID_TOKEN: '無效的認證連結',
    EXPIRED_TOKEN: '認證連結已過期',
    INVALID_SESSION: '無效的 Session',
    EXPIRED_SESSION: 'Session 已過期',
    UNAUTHORIZED: '未授權的請求',
    DB_ERROR: '資料庫錯誤',
    INVALID_SERVICE: '無效的服務',
  };
  
  // HTTP 狀態碼
  export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
  };
  
  // 快取鍵值
  export const CACHE_KEYS = {
    SESSION_TOKEN: 'sessionToken',
    SESSION_EXPIRES: 'sessionExpiresAt',
    USER_PROFILE: 'userProfile',
    PROFILE_TIMESTAMP: 'profileTimestamp',
  };