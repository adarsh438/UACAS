const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

const NEON_KEY = 'napi_qtg2u37d26j56f5irlcy4korsxzkf9rul8t8suhiox06dm2xlzas4xrgsif590p3';
const ORG_ID = 'org-steep-band-12015864';

function neonRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'console.neon.tech',
      port: 443,
      path: `/api/v2${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${NEON_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  // ── Step 1: List or create Neon project ────────────────
  console.log('\n🔍 Step 1: Checking existing Neon projects...');
  const projectsRes = await neonRequest('GET', `/projects?org_id=${ORG_ID}`, null);

  if (projectsRes.status !== 200) {
    console.error('List projects failed:', JSON.stringify(projectsRes.body, null, 2));
    process.exit(1);
  }

  const projects = projectsRes.body.projects || [];
  let project = projects.find(p => p.name === 'uacas-enterprise');
  let initialConnectionString = null;

  if (project) {
    console.log(`✅ Found existing project: ${project.id}`);
  } else {
    console.log('🚀 Creating new Neon Postgres project...');
    const createRes = await neonRequest('POST', '/projects', {
      project: {
        name: 'uacas-enterprise',
        org_id: ORG_ID,
        region_id: 'aws-ap-southeast-1',
        pg_version: 16,
      }
    });

    if (createRes.status !== 201 && createRes.status !== 200) {
      console.error('Create project failed:', JSON.stringify(createRes.body, null, 2));
      process.exit(1);
    }

    project = createRes.body.project;
    console.log(`✅ Project created: ${project.id}`);

    // The creation response includes connection URIs directly
    if (createRes.body.connection_uris?.[0]) {
      initialConnectionString = createRes.body.connection_uris[0].connection_uri;
      console.log('✅ Got connection URI from creation response');
    }

    // Wait for project to be ready
    console.log('⏳ Waiting for project to initialize...');
    await sleep(5000);
  }

  // ── Step 2: Get connection string ──────────────────────
  let connectionString = initialConnectionString;

  if (!connectionString) {
    console.log('\n🔍 Step 2: Fetching branches...');
    const branchRes = await neonRequest('GET', `/projects/${project.id}/branches`, null);
    const branches = branchRes.body.branches || [];
    const mainBranch = branches.find(b => b.primary || b.name === 'main') || branches[0];
    console.log('Branch:', mainBranch?.name, mainBranch?.id);

    console.log('🔍 Fetching endpoints...');
    const endpointRes = await neonRequest('GET', `/projects/${project.id}/endpoints`, null);
    const endpoints = endpointRes.body.endpoints || [];
    const endpoint = endpoints.find(e => e.branch_id === mainBranch?.id) || endpoints[0];
    console.log('Endpoint host:', endpoint?.host);

    console.log('🔍 Fetching databases...');
    const dbRes = await neonRequest('GET', `/projects/${project.id}/branches/${mainBranch.id}/databases`, null);
    const db = dbRes.body.databases?.[0];
    console.log('Database:', db?.name);

    console.log('🔍 Fetching roles...');
    const roleRes = await neonRequest('GET', `/projects/${project.id}/branches/${mainBranch.id}/roles`, null);
    const roles = roleRes.body.roles || [];
    const role = roles.find(r => !r.name.includes('web_access')) || roles[0];
    console.log('Role:', role?.name);

    console.log('🔑 Getting password...');
    const pwRes = await neonRequest(
      'GET',
      `/projects/${project.id}/branches/${mainBranch.id}/roles/${role.name}/reveal_password`,
      null
    );
    const password = pwRes.body.password;

    if (!endpoint || !db || !role || !password) {
      console.error('Missing connection details:', { endpoint: !!endpoint, db: !!db, role: !!role, password: !!password });
      console.error('Endpoint:', JSON.stringify(endpoint));
      console.error('DB:', JSON.stringify(db));
      console.error('Role:', JSON.stringify(role));
      process.exit(1);
    }

    connectionString = `postgresql://${role.name}:${encodeURIComponent(password)}@${endpoint.host}/${db.name}?sslmode=require`;
  }

  console.log('\n✅ Connection string obtained!');

  // Save securely to scratch file
  fs.writeFileSync('scratch/neon_result.json', JSON.stringify({
    projectId: project.id,
    connectionString,
  }, null, 2));
  console.log('💾 Saved connection string to scratch/neon_result.json');

  // ── Step 3: Update Prisma schema to use PostgreSQL ──────
  console.log('\n📝 Step 3: Switching Prisma schema from SQLite → PostgreSQL...');
  let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  schema = schema
    .replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"')
    .replace(/url\s*=\s*"file:\.\/dev\.db"/, 'url = env("DATABASE_URL")');
  fs.writeFileSync('prisma/schema.prisma', schema);
  console.log('✅ schema.prisma updated');

  // ── Step 4: Push schema to Neon Postgres ───────────────
  console.log('\n🏗️  Step 4: Running prisma db push on Neon Postgres...');
  try {
    const pushResult = execSync(
      `npx prisma db push --accept-data-loss`,
      {
        env: { ...process.env, DATABASE_URL: connectionString },
        cwd: process.cwd(),
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 120000,
      }
    );
    console.log('✅ Prisma push output:\n', pushResult.substring(0, 500));
  } catch (err) {
    console.error('❌ Prisma push failed:', err.stdout || err.message);
    process.exit(1);
  }

  // ── Step 5: Seed database ───────────────────────────────
  console.log('\n🌱 Step 5: Seeding database with demo data...');
  try {
    const seedResult = execSync(
      `npx tsx prisma/seed.ts`,
      {
        env: { ...process.env, DATABASE_URL: connectionString },
        cwd: process.cwd(),
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 120000,
      }
    );
    console.log('✅ Seed output:\n', seedResult.substring(0, 800));
  } catch (err) {
    console.error('❌ Seed failed:', err.stdout || err.stderr || err.message);
    process.exit(1);
  }

  // ── Step 6: Update Vercel env vars ─────────────────────
  console.log('\n🔧 Step 6: Updating Vercel environment variables...');
  
  // Remove existing DATABASE_URL and re-add with Postgres value
  try {
    execSync(`vercel env rm DATABASE_URL production --yes`, { stdio: 'pipe', encoding: 'utf8' });
    console.log('Removed old DATABASE_URL');
  } catch {
    console.log('No existing DATABASE_URL to remove (ok)');
  }
  try {
    execSync(`vercel env rm DATABASE_URL preview --yes`, { stdio: 'pipe', encoding: 'utf8' });
  } catch {}

  // Add the new Postgres URL
  const { execSync: es } = require('child_process');
  
  // Write to temp file to avoid shell escaping issues
  fs.writeFileSync('scratch/.db_url_temp', connectionString);
  
  try {
    execSync(
      `vercel env add DATABASE_URL production < scratch/.db_url_temp`,
      { stdio: 'pipe', encoding: 'utf8' }
    );
    console.log('✅ DATABASE_URL set for production');
  } catch (err) {
    // Try alternative approach
    console.log('Trying alternative env set method...');
    try {
      execSync(
        `echo ${connectionString} | vercel env add DATABASE_URL production`,
        { stdio: 'pipe', encoding: 'utf8', shell: true }
      );
      console.log('✅ DATABASE_URL set for production (alt method)');
    } catch (err2) {
      console.log('Will try vercel env add manually later:', err2.message);
    }
  }
  
  // Clean up temp file
  try { fs.unlinkSync('scratch/.db_url_temp'); } catch {}

  console.log('\n🎉 All done! Summary:');
  console.log('  ✅ Neon Postgres project: uacas-enterprise');
  console.log('  ✅ Schema pushed (all tables created)');
  console.log('  ✅ Database seeded with demo data');
  console.log('  ⏳ DATABASE_URL needs to be set in Vercel (see below if it failed)');
  console.log('\n  Connection string saved to: scratch/neon_result.json');
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
