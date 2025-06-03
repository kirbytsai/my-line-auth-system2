/**
 * 建立簡單的 LINE Bot Rich Menu（只有兩個按鈕）
 * 執行前請設定環境變數：LINE_CHANNEL_ACCESS_TOKEN
 */

const https = require('https');
const fs = require('fs');

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

if (!channelAccessToken) {
  console.error('請設定 LINE_CHANNEL_ACCESS_TOKEN 環境變數');
  process.exit(1);
}

// 簡單的 Rich Menu 物件（2 個按鈕）
const richMenuObject = {
  size: {
    width: 2500,
    height: 843  // 只有一排的高度
  },
  selected: true,
  name: 'LINE Auth System Simple Menu',
  chatBarText: '選單',
  areas: [
    {
      bounds: {
        x: 0,
        y: 0,
        width: 1250,
        height: 843
      },
      action: {
        type: 'postback',
        label: 'MyPage',
        data: 'action=mypage',
        displayText: 'MyPage'
      }
    },
    {
      bounds: {
        x: 1250,
        y: 0,
        width: 1250,
        height: 843
      },
      action: {
        type: 'postback',
        label: 'MyMile',
        data: 'action=mymile',
        displayText: 'MyMile'
      }
    }
  ]
};

// 建立 Rich Menu
function createRichMenu() {
  const data = JSON.stringify(richMenuObject);
  
  const options = {
    hostname: 'api.line.me',
    path: '/v2/bot/richmenu',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${channelAccessToken}`,
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        const result = JSON.parse(body);
        console.log('Rich Menu 建立成功！');
        console.log('Rich Menu ID:', result.richMenuId);
        console.log('\n請執行以下步驟：');
        console.log('1. 準備一張 2500x843 的選單圖片');
        console.log('2. 上傳圖片到 Rich Menu（使用 LINE Official Account Manager）');
        console.log('3. 設定為預設選單');
        
        // 儲存 Rich Menu ID
        fs.writeFileSync('rich-menu-id.txt', result.richMenuId);
      } else {
        console.error('建立失敗:', res.statusCode, body);
      }
    });
  });

  req.on('error', (error) => {
    console.error('請求錯誤:', error);
  });

  req.write(data);
  req.end();
}

// 執行
createRichMenu();