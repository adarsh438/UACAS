const https = require('https');

const postData = JSON.stringify({ email: 'admin@uacas.edu.in', password: 'Demo@1234' });

const options = {
  hostname: 'uacas.vercel.app',
  port: 443,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (e) => { console.error('Error:', e); });
req.write(postData);
req.end();
