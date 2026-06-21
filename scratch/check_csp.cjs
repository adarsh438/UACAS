const http = require('http');

http.get('http://localhost:3000/', (res) => {
  console.log('Status:', res.statusCode);
  const csp = res.headers['content-security-policy'];
  if (csp) {
    console.log('\nCSP Header:');
    csp.split(';').forEach(d => console.log('  ', d.trim()));
  } else {
    console.log('NO CSP header found!');
  }
  res.resume();
});
