const fs = require('fs');

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  let report = `# Step 2: Interactive Features Verification Report\n\n`;
  const token = 'mock-jwt-superadmin'; // Our App.tsx mock token
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const addResult = (feature, status, details) => {
    console.log(`[${status}] ${feature}`);
    report += `### ${feature}\n**Status**: ${status}\n**Details**: \n\`\`\`json\n${JSON.stringify(details, null, 2)}\n\`\`\`\n\n`;
  };

  try {
    // 1. Health
    const h = await fetch(`${baseUrl}/api/health`);
    addResult('Backend Health', h.status === 200 ? 'WORKING' : 'STILL BROKEN', await h.text());

    // 2. Authentication Login
    const loginResp = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST', headers, body: JSON.stringify({ email: 'admin@uacas.edu.in', password: 'Demo@1234' })
    });
    addResult('Login Button (API)', loginResp.status === 200 ? 'WORKING' : 'STILL BROKEN', await loginResp.text());

    // 3. Forgot Password
    const forgotResp = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST', headers, body: JSON.stringify({ email: 'admin@uacas.com' })
    });
    addResult('Forgot Password Button (API)', forgotResp.status === 200 ? 'WORKING' : 'STILL BROKEN', await forgotResp.text());

    // 4. AI Narrative Generation
    const aiResp = await fetch(`${baseUrl}/api/ai/narrative`, {
      method: 'POST', headers, body: JSON.stringify({
        criterion: "Criterion 1: Curricular Aspects",
        context: "150 courses, 12 BoS meetings",
      })
    });
    addResult('Generate Narrative AI Button (API)', aiResp.status === 200 ? 'WORKING' : 'STILL BROKEN', await aiResp.text());

    // 5. NAAC C1 - Add BoS Meeting
    const c1Resp = await fetch(`${baseUrl}/api/naac/c1/bos`, {
      method: 'POST', headers, body: JSON.stringify({
        programName: 'B.Tech CS Test', meetingDate: '2023-01-01', hasIndustryFeedback: true, academicYear: `Year-${Date.now()}`
      })
    });
    addResult('Add BoS Meeting Button (Criterion 1)', c1Resp.status === 200 ? 'WORKING' : 'STILL BROKEN', await c1Resp.text());

    // 6. NAAC C4 - Maintenance Budget
    const c4Resp = await fetch(`${baseUrl}/api/naac/c4/maintenance`, {
      method: 'POST', headers, body: JSON.stringify({
        annualBudgetINR: 500000, amountUtilizedINR: 450000, academicYear: `Year-${Date.now()}`
      })
    });
    addResult('Add Maintenance Budget (Criterion 4)', c4Resp.status === 200 ? 'WORKING' : 'STILL BROKEN', await c4Resp.text());

    // 7. NAAC C7 - Green Initiatives
    const c7Resp = await fetch(`${baseUrl}/api/naac/c7/green`, {
      method: 'POST', headers, body: JSON.stringify({
        solarPanels: true, solarCapacityKw: 50, academicYear: '2099-00'
      })
    });
    addResult('Add Green Initiative (Criterion 7)', c7Resp.status === 200 ? 'WORKING' : 'STILL BROKEN', await c7Resp.text());

    // 8. Super Admin - Add Institution
    const adminResp = await fetch(`${baseUrl}/api/admin/institutions`, {
      method: 'POST', headers, body: JSON.stringify({
        name: 'Automated Test University', adminEmail: `test${Date.now()}@univ.edu`, adminPassword: 'securepass'
      })
    });
    addResult('Add Institution (Super Admin)', adminResp.status === 201 ? 'WORKING' : 'STILL BROKEN', await adminResp.text());

    fs.writeFileSync('C:\\Users\\91700\\.gemini\\antigravity-ide\\brain\\039bbcaf-dc1c-4672-a05f-2ab6d83f64ae\\verification_report.md', report);
    console.log('Report generated at verification_report.md');
  } catch(e) {
    console.error('Test execution failed:', e.message);
  }
}

runTests();
