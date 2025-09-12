/**
 * API响应测试脚本
 * 直接调用版本检查API查看响应格式
 */

const https = require('https');

async function testApiResponse() {
  console.log('🧪 开始测试API响应格式...\n');
  
  const apiUrl = 'https://api-g.lacs.cc/app/software/id/1/versions';
  
  console.log(`🌐 调用API: ${apiUrl}`);
  
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    console.log('\n📥 API响应状态:', response.status);
    console.log('📥 完整API响应:');
    console.log(JSON.stringify(data, null, 2));
    
    // 分析响应结构
    console.log('\n🔍 响应结构分析:');
    console.log('- success字段:', data.success);
    console.log('- data字段存在:', !!data.data);
    
    if (data.data) {
      console.log('- data内容:', data.data);
      console.log('- version字段:', data.data.version);
      console.log('- 所有字段:', Object.keys(data.data));
    } else {
      console.log('- 根级别字段:', Object.keys(data));
      console.log('- 可能的版本字段:');
      ['version', 'latestVersion', 'currentVersion', 'appVersion', 'ver'].forEach(field => {
        if (data[field]) {
          console.log(`  - ${field}: ${data[field]}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ API调用失败:', error.message);
  }
}

// 使用Node.js内置fetch（需要Node.js 18+）或使用https模块
if (typeof fetch === 'undefined') {
  console.log('使用https模块进行请求...');
  
  const https = require('https');
  const url = require('url');
  
  function makeRequest(apiUrl) {
    return new Promise((resolve, reject) => {
      const parsedUrl = url.parse(apiUrl);
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.path,
        method: 'GET',
        headers: {
          'User-Agent': 'Version-Check-Test/1.0.0'
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, json: () => Promise.resolve(jsonData) });
          } catch (error) {
            reject(new Error(`JSON解析失败: ${error.message}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.end();
    });
  }
  
  // 重新定义testApiResponse使用https模块
  async function testApiResponseWithHttps() {
    console.log('🧪 开始测试API响应格式...\n');
    
    const apiUrl = 'https://api-g.lacs.cc/app/software/id/1/versions';
    
    console.log(`🌐 调用API: ${apiUrl}`);
    
    try {
      const response = await makeRequest(apiUrl);
      const data = await response.json();
      
      console.log('\n📥 API响应状态:', response.status);
      console.log('📥 完整API响应:');
      console.log(JSON.stringify(data, null, 2));
      
      // 分析响应结构
      console.log('\n🔍 响应结构分析:');
      console.log('- success字段:', data.success);
      console.log('- data字段存在:', !!data.data);
      
      if (data.data) {
        console.log('- data内容:', data.data);
        console.log('- version字段:', data.data.version);
        console.log('- 所有字段:', Object.keys(data.data));
      } else {
        console.log('- 根级别字段:', Object.keys(data));
        console.log('- 可能的版本字段:');
        ['version', 'latestVersion', 'currentVersion', 'appVersion', 'ver'].forEach(field => {
          if (data[field]) {
            console.log(`  - ${field}: ${data[field]}`);
          }
        });
      }
      
    } catch (error) {
      console.error('❌ API调用失败:', error.message);
    }
  }
  
  testApiResponseWithHttps();
} else {
  testApiResponse();
}