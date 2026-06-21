const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.user.findMany()
  .then(users => {
    console.log('Users found:', users.length);
    users.forEach(u => {
      console.log('  -', u.email, '| role:', u.role, '| pwd:', u.password ? u.password.substring(0, 7) + '...' : 'NULL');
    });
    return p.$disconnect();
  })
  .catch(e => {
    console.error('DB Error:', e.message);
    return p.$disconnect();
  });
