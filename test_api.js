// 测试激活码API的响应格式
const testActivationAPI = async () => {
  const testCode = "MDLHR527-VSQD75-806F974C"; // 使用一个测试激活码
  
  try {
    const response = await fetch('https://api-g.lacs.cc/api/activation-codes/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HOUT-Client/1.0.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        code: testCode
      })
    });

    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    try {
      const jsonData = JSON.parse(responseText);
      console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('Failed to parse as JSON:', e.message);
    }
    
  } catch (error) {
    console.error('Request failed:', error);
  }
};

testActivationAPI();
