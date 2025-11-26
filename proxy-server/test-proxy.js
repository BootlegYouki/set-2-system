import fetch from 'node-fetch';

// Test the proxy server
async function testProxy() {
  const PROXY_URL = process.env.PROXY_URL || 'http://localhost:3001';
  
  console.log('🧪 Testing proxy server at:', PROXY_URL);
  
  try {
    // Test health check
    console.log('\n1️⃣ Testing health check endpoint...');
    const healthResponse = await fetch(PROXY_URL);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test chat endpoint
    console.log('\n2️⃣ Testing chat endpoint...');
    const chatResponse = await fetch(`${PROXY_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [
          { role: 'user', content: 'Say hello in one word' }
        ]
      })
    });
    
    const chatData = await chatResponse.json();
    if (chatData.success) {
      console.log('✅ Chat test successful!');
      console.log('Response:', chatData.data.choices[0].message.content);
    } else {
      console.log('❌ Chat test failed:', chatData.error);
    }
    
    console.log('\n✨ All tests passed! Your proxy server is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Error testing proxy:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. The proxy server is running');
    console.log('   2. You have added OPENROUTER_API_KEY to .env');
    console.log('   3. The proxy URL is correct');
  }
}

testProxy();
