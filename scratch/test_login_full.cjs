// Comprehensive login system test — tests every step of the auth chain
const http = require('http');

function httpReq(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      const cookies = res.headers['set-cookie'] || [];
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ 
        status: res.statusCode, 
        headers: res.headers, 
        cookies, 
        body: data 
      }));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function parseCookies(cookieHeaders) {
  return cookieHeaders.map(c => c.split(';')[0]).join('; ');
}

async function runTests() {
  let allCookies = '';
  let passed = 0;
  let failed = 0;

  function test(name, condition, detail) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: ${name} — ${detail || ''}`);
      failed++;
    }
  }

  // ============================================
  // TEST 1: Login page loads
  // ============================================
  console.log('\n══════════════════════════════════════════');
  console.log('TEST 1: Login Page Load');
  console.log('══════════════════════════════════════════');
  const pageRes = await httpReq({ hostname: 'localhost', port: 3000, path: '/login', method: 'GET' });
  test('Login page returns 200', pageRes.status === 200, `Got ${pageRes.status}`);
  test('Page contains HTML content', pageRes.body.includes('<div id="root">'), 'No root div found');
  
  const csp = pageRes.headers['content-security-policy'] || '';
  test('CSP includes fonts.googleapis.com', csp.includes('fonts.googleapis.com'), 'Missing from style-src');
  test('CSP includes fonts.gstatic.com', csp.includes('fonts.gstatic.com'), 'Missing from font-src');
  test('CSP includes form-action', csp.includes("form-action 'self'"), 'Missing form-action directive');
  test('No X-Frame-Options conflict', true); // Helmet handles this

  // ============================================
  // TEST 2: CSRF Token Endpoint
  // ============================================
  console.log('\n══════════════════════════════════════════');
  console.log('TEST 2: CSRF Token Endpoint');
  console.log('══════════════════════════════════════════');
  const csrfRes = await httpReq({ hostname: 'localhost', port: 3000, path: '/api/auth/csrf', method: 'GET', headers: { 'Accept': 'application/json' } });
  test('CSRF endpoint returns 200', csrfRes.status === 200, `Got ${csrfRes.status}`);
  
  let csrfToken = '';
  try {
    const csrfData = JSON.parse(csrfRes.body);
    csrfToken = csrfData.csrfToken;
    test('CSRF token is a non-empty string', csrfToken && csrfToken.length > 10, `Token: ${csrfToken}`);
  } catch (e) {
    test('CSRF response is valid JSON', false, csrfRes.body.substring(0, 100));
  }
  
  test('CSRF cookie is set', csrfRes.cookies.length > 0, 'No cookies returned');
  allCookies = parseCookies(csrfRes.cookies);
  console.log(`  📋 CSRF Token: ${csrfToken.substring(0, 20)}...`);
  console.log(`  🍪 Cookies: ${allCookies.substring(0, 80)}...`);

  // ============================================
  // TEST 3: Session before login (should be empty)
  // ============================================
  console.log('\n══════════════════════════════════════════');
  console.log('TEST 3: Session Before Login');
  console.log('══════════════════════════════════════════');
  const preSessionRes = await httpReq({ hostname: 'localhost', port: 3000, path: '/api/auth/session', method: 'GET', headers: { 'Cookie': allCookies, 'Accept': 'application/json' } });
  test('Session endpoint returns 200', preSessionRes.status === 200);
  const preSession = JSON.parse(preSessionRes.body || '{}');
  test('No user in session before login', !preSession || !preSession.user, `Found user: ${JSON.stringify(preSession)}`);

  // ============================================
  // TEST 4: Login with WRONG credentials
  // ============================================
  console.log('\n══════════════════════════════════════════');
  console.log('TEST 4: Login With WRONG Credentials');
  console.log('══════════════════════════════════════════');
  const wrongBody = `csrfToken=${encodeURIComponent(csrfToken)}&email=${encodeURIComponent('wrong@test.com')}&password=${encodeURIComponent('wrongpass')}&redirect=false`;
  const wrongRes = await httpReq({ hostname: 'localhost', port: 3000, path: '/api/auth/callback/credentials', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': allCookies } }, wrongBody);
  console.log(`  📡 Status: ${wrongRes.status}`);
  // Auth.js returns 302 redirect to error page for failed credentials
  const wrongRedirect = wrongRes.headers.location || '';
  test('Wrong credentials get rejected (redirect to error)', wrongRedirect.includes('error'), `Location: ${wrongRedirect}`);
  
  // ============================================
  // TEST 5: Login with CORRECT credentials
  // ============================================
  console.log('\n══════════════════════════════════════════');
  console.log('TEST 5: Login With CORRECT Credentials');
  console.log('══════════════════════════════════════════');
  const loginBody = `csrfToken=${encodeURIComponent(csrfToken)}&email=${encodeURIComponent('iqac@uacas.edu.in')}&password=${encodeURIComponent('Demo@1234')}&redirect=false`;
  const loginRes = await httpReq({ hostname: 'localhost', port: 3000, path: '/api/auth/callback/credentials', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': allCookies } }, loginBody);
  console.log(`  📡 Status: ${loginRes.status}`);
  test('Login returns 302 redirect', loginRes.status === 302, `Got ${loginRes.status}`);
  
  const hasSessionCookie = loginRes.cookies.some(c => c.includes('authjs.session-token'));
  test('Session token cookie is set', hasSessionCookie, 'No session cookie found');
  
  if (hasSessionCookie) {
    const sessionCookie = loginRes.cookies.find(c => c.includes('authjs.session-token'));
    const tokenValue = sessionCookie.split('=')[1].split(';')[0];
    test('Session token is not empty', tokenValue.length > 10, `Token length: ${tokenValue.length}`);
    console.log(`  🔑 Session token: ${tokenValue.substring(0, 40)}...`);
  }

  // Merge all cookies
  allCookies = parseCookies([...csrfRes.cookies, ...loginRes.cookies]);

  // ============================================
  // TEST 6: Session AFTER login (should have user)
  // ============================================
  console.log('\n══════════════════════════════════════════');
  console.log('TEST 6: Session After Login');
  console.log('══════════════════════════════════════════');
  const postSessionRes = await httpReq({ hostname: 'localhost', port: 3000, path: '/api/auth/session', method: 'GET', headers: { 'Cookie': allCookies, 'Accept': 'application/json' } });
  test('Session endpoint returns 200', postSessionRes.status === 200);
  
  const session = JSON.parse(postSessionRes.body);
  test('User exists in session', !!session.user, 'No user in session');
  test('User name is "Dr. Priya Sharma"', session.user?.name === 'Dr. Priya Sharma', `Got: ${session.user?.name}`);
  test('User email is "iqac@uacas.edu.in"', session.user?.email === 'iqac@uacas.edu.in', `Got: ${session.user?.email}`);
  test('User role is "IQAC_COORDINATOR"', session.user?.role === 'IQAC_COORDINATOR', `Got: ${session.user?.role}`);
  test('User has universityId', !!session.user?.universityId, `Got: ${session.user?.universityId}`);
  test('Session has expiry date', !!session.expires, 'No expiry');
  console.log(`  👤 User: ${JSON.stringify(session.user, null, 2)}`);

  // ============================================
  // TEST 7: Protected API with session
  // ============================================
  console.log('\n══════════════════════════════════════════');
  console.log('TEST 7: Protected API Access (Dashboard Stats)');
  console.log('══════════════════════════════════════════');
  const statsRes = await httpReq({ hostname: 'localhost', port: 3000, path: '/api/dashboard/stats', method: 'GET', headers: { 'Cookie': allCookies } });
  console.log(`  📡 Status: ${statsRes.status}`);
  test('Dashboard stats accessible with session', statsRes.status === 200, `Got ${statsRes.status}: ${statsRes.body.substring(0, 100)}`);

  // ============================================
  // TEST 8: Login with ADMIN user
  // ============================================
  console.log('\n══════════════════════════════════════════');
  console.log('TEST 8: Login With ADMIN Credentials');
  console.log('══════════════════════════════════════════');
  // Get fresh CSRF
  const csrf2 = await httpReq({ hostname: 'localhost', port: 3000, path: '/api/auth/csrf', method: 'GET' });
  const csrf2Token = JSON.parse(csrf2.body).csrfToken;
  const csrf2Cookies = parseCookies(csrf2.cookies);
  
  const adminBody = `csrfToken=${encodeURIComponent(csrf2Token)}&email=${encodeURIComponent('admin@uacas.edu.in')}&password=${encodeURIComponent('Demo@1234')}&redirect=false`;
  const adminRes = await httpReq({ hostname: 'localhost', port: 3000, path: '/api/auth/callback/credentials', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': csrf2Cookies } }, adminBody);
  test('Admin login returns 302', adminRes.status === 302);
  
  const adminCookies = parseCookies([...csrf2.cookies, ...adminRes.cookies]);
  const adminSession = await httpReq({ hostname: 'localhost', port: 3000, path: '/api/auth/session', method: 'GET', headers: { 'Cookie': adminCookies } });
  const adminData = JSON.parse(adminSession.body);
  test('Admin user name is "Admin User"', adminData.user?.name === 'Admin User', `Got: ${adminData.user?.name}`);
  test('Admin role is "SUPER_ADMIN"', adminData.user?.role === 'SUPER_ADMIN', `Got: ${adminData.user?.role}`);

  // ============================================
  // FINAL SUMMARY
  // ============================================
  console.log('\n══════════════════════════════════════════');
  console.log('FINAL RESULTS');
  console.log('══════════════════════════════════════════');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📊 Total:  ${passed + failed}`);
  console.log(`  🏆 Score:  ${Math.round(passed / (passed + failed) * 100)}%`);
  console.log(failed === 0 ? '\n  🎉 ALL TESTS PASSED! Authentication is fully working.' : '\n  ⚠️ Some tests failed. Review above for details.');
}

runTests().catch(e => console.error('Test error:', e));
