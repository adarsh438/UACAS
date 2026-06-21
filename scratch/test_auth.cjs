const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('\n=== UACAS Auth System Tests ===\n');

  // Test 1: Health check
  const health = await request({ host: 'localhost', port: 3000, path: '/health', method: 'GET' });
  console.log('1. Health:', health.status, health.body);

  // Test 2: Login with correct credentials
  const loginBody = JSON.stringify({ email: 'admin@uacas.edu.in', password: 'Demo@1234' });
  const login = await request({
    host: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
  }, loginBody);
  console.log('\n2. Login (admin@uacas.edu.in / Demo@1234):');
  console.log('   Status:', login.status);
  const loginData = JSON.parse(login.body);
  console.log('   User:', loginData.user ? JSON.stringify(loginData.user) : 'null');
  console.log('   Token present:', !!loginData.token);
  const token = loginData.token;
  const cookie = login.headers['set-cookie'] ? login.headers['set-cookie'][0].split(';')[0] : '';
  console.log('   Cookie set:', cookie ? cookie.substring(0, 40) + '...' : 'NONE');

  // Test 3: /me with Bearer token
  if (token) {
    const me = await request({
      host: 'localhost', port: 3000, path: '/api/auth/me', method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('\n3. GET /api/auth/me (with Bearer token):');
    console.log('   Status:', me.status);
    console.log('   Body:', me.body.substring(0, 200));
  }

  // Test 4: Wrong password
  const badBody = JSON.stringify({ email: 'admin@uacas.edu.in', password: 'wrongpassword' });
  const bad = await request({
    host: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(badBody) }
  }, badBody);
  console.log('\n4. Login with wrong password:');
  console.log('   Status:', bad.status, '(expected 401)');
  console.log('   Body:', bad.body);

  // Test 5: /me without token
  const unauth = await request({ host: 'localhost', port: 3000, path: '/api/auth/me', method: 'GET' });
  console.log('\n5. GET /api/auth/me without token:');
  console.log('   Status:', unauth.status, '(expected 401)');

  // Test 6: Logout
  const logout = await request({
    host: 'localhost', port: 3000, path: '/api/auth/logout', method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('\n6. POST /api/auth/logout:');
  console.log('   Status:', logout.status, '(expected 200)');
  console.log('   Body:', logout.body);

  // Test 7: IQAC coordinator login
  const iqacBody = JSON.stringify({ email: 'iqac@uacas.edu.in', password: 'Demo@1234' });
  const iqac = await request({
    host: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(iqacBody) }
  }, iqacBody);
  const iqacData = JSON.parse(iqac.body);
  console.log('\n7. Login (iqac@uacas.edu.in / Demo@1234):');
  console.log('   Status:', iqac.status);
  console.log('   Role:', iqacData.user?.role);

  console.log('\n=== All tests completed ===\n');
}

runTests().catch(console.error);
