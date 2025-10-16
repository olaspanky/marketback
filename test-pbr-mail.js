// test-pbr-mail.js
const axios = require('axios');
const https = require('https');

const httpsAgent = new https.Agent({  
  rejectUnauthorized: false
});

// Test Format 1: Standard format
const testFormat1 = async () => {
  console.log('\n🧪 Testing Format 1: Standard fields...');
  try {
    const response = await axios.post('https://Mail.pbr.com.ng/send', {
      to: 'olakareemomobolarinwa@gmail.com',
      from: 'noreply@pbrinsight.com',
      fromName: 'PBR Lifesciences',
      subject: 'Test Email',
      html: '<h1>Test Email</h1><p>This is a test from your API.</p>',
      text: 'Test Email - This is a test from your API.'
    }, {
      headers: { 'Content-Type': 'application/json' },
      httpsAgent
    });
    console.log('✅ Format 1 Success:', response.data);
  } catch (error) {
    console.error('❌ Format 1 Failed:', error.response?.data || error.message);
  }
};

// Test Format 2: recipient instead of to
const testFormat2 = async () => {
  console.log('\n🧪 Testing Format 2: recipient field...');
  try {
    const response = await axios.post('https://Mail.pbr.com.ng/send', {
      recipient: 'olakareemomobolarinwa@gmail.com',
      sender: 'noreply@pbrinsight.com',
      senderName: 'PBR Lifesciences',
      subject: 'Test Email',
      htmlBody: '<h1>Test Email</h1><p>This is a test from your API.</p>',
      textBody: 'Test Email - This is a test from your API.'
    }, {
      headers: { 'Content-Type': 'application/json' },
      httpsAgent
    });
    console.log('✅ Format 2 Success:', response.data);
  } catch (error) {
    console.error('❌ Format 2 Failed:', error.response?.data || error.message);
  }
};

// Test Format 3: email field
const testFormat3 = async () => {
  console.log('\n🧪 Testing Format 3: email field...');
  try {
    const response = await axios.post('https://Mail.pbr.com.ng/send', {
      email: 'olakareemomobolarinwa@gmail.com',
      from: 'noreply@pbrinsight.com',
      name: 'PBR Lifesciences',
      subject: 'Test Email',
      message: '<h1>Test Email</h1><p>This is a test from your API.</p>'
    }, {
      headers: { 'Content-Type': 'application/json' },
      httpsAgent
    });
    console.log('✅ Format 3 Success:', response.data);
  } catch (error) {
    console.error('❌ Format 3 Failed:', error.response?.data || error.message);
  }
};

// Test Format 4: body field
const testFormat4 = async () => {
  console.log('\n🧪 Testing Format 4: body field...');
  try {
    const response = await axios.post('https://Mail.pbr.com.ng/send', {
      to: 'olakareemomobolarinwa@gmail.com',
      from: 'noreply@pbrinsight.com',
      subject: 'Test Email',
      body: '<h1>Test Email</h1><p>This is a test from your API.</p>'
    }, {
      headers: { 'Content-Type': 'application/json' },
      httpsAgent
    });
    console.log('✅ Format 4 Success:', response.data);
  } catch (error) {
    console.error('❌ Format 4 Failed:', error.response?.data || error.message);
  }
};

// Run all tests
const runTests = async () => {
  await testFormat1();
  await testFormat2();
  await testFormat3();
  await testFormat4();
};

runTests();