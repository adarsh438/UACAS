// E2E login test script — tests the Auth.js credentials login flow via HTTP
const http = require('http');

function httpRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      const cookies = res.headers['set-cookie'] || [];
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, cookies, body: data }));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function test() {
  console.log('=== STEP 1: Fetch CSRF Token ===');
  const csrfRes = await httpRequest({
    hostname: 'localhost', port: 3000,
    path: '/api/auth/csrf',
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });
  console.log('Status:', csrfRes.status);
  console.log('Body:', csrfRes.body);
  const csrfData = JSON.parse(csrfRes.body);
  const csrfToken = csrfData.csrfToken;
  const csrfCookies = csrfRes.cookies.join('; ');
  console.log('CSRF Token:', csrfToken);
  console.log('Cookies received:', csrfCookies);

  console.log('\n=== STEP 2: Submit Login ===');
  const loginBody = `csrfToken=${encodeURIComponent(csrfToken)}&email=${encodeURIComponent('iqac@uacas.edu.in')}&password=${encodeURIComponent('Demo@1234')}&redirect=false`;
  const loginRes = await httpRequest({
    hostname: 'localhost', port: 3000,
    path: '/api/auth/callback/credentials',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookies
    }
  }, loginBody);
  console.log('Status:', loginRes.status);
  console.log('Response body (first 500 chars):', loginRes.body.substring(0, 500));
  console.log('Set-Cookie headers:', loginRes.cookies);
  const allCookies = [...(csrfCookies ? [csrfCookies] : []), ...loginRes.cookies].join('; ');

  console.log('\n=== STEP 3: Fetch Session (verify login worked) ===');
  const sessionRes = await httpRequest({
    hostname: 'localhost', port: 3000,
    path: '/api/auth/session',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Cookie': allCookies
    }
  });
  console.log('Status:', sessionRes.status);
  console.log('Session body:', sessionRes.body);

  const session = JSON.parse(sessionRes.body);
  if (session && session.user) {
    console.log('\n✅ LOGIN SUCCESS!');
    console.log('   User:', session.user.name);
    console.log('   Email:', session.user.email);
    console.log('   Role:', session.user.role);
  } else {
    console.log('\n❌ LOGIN FAILED — no session established');
    console.log('   Session data:', JSON.stringify(session));
  }
}

test().catch(e => console.error('Test error:', e));
