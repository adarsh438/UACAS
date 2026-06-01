// src/server/tests/api.test.ts
// Native Node.js API Integration Unit Tests
// Run with: node --import tsx --test src/server/tests/api.test.ts

import { test, describe } from 'node:test';
import assert from 'node:assert';
import ExcelJS from 'exceljs';

const API_BASE = 'http://localhost:3000/api';

describe('NAAC SSR API Endpoints — Integration Tests', () => {

  // ═══════════════════════════════════════════════════════════════════════════
  //  1. PUBLIC ACCESSIBLE ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Public System Endpoints', () => {

    test('GET /health — Verify server status is online', async () => {
      const res = await fetch(`${API_BASE}/health`);
      assert.strictEqual(res.status, 200);
      
      const body = await res.json();
      assert.strictEqual(body.status, 'UP');
      assert.ok(body.timestamp);
    });

    test('GET /system/license — Verify institutional license key active', async () => {
      const res = await fetch(`${API_BASE}/system/license`);
      assert.strictEqual(res.status, 200);
      
      const body = await res.json();
      assert.strictEqual(body.status, 'ACTIVE');
      assert.strictEqual(body.type, 'PERPETUAL_ENTERPRISE');
      assert.strictEqual(body.licensedTo, 'UACAS Institute of Tech');
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  2. SECURITY MIDDLEWARE ENFORCEMENT (JWT Auth Guards)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Security Guard Middleware (Authorization Headers)', () => {

    test('GET /naac/scores/2024-25 — Deny access without Authorization Token', async () => {
      // Accessing a protected endpoint without header
      const res = await fetch(`${API_BASE}/naac/scores/2024-25`);
      
      // Enforce security block
      assert.strictEqual(res.status, 401);
      
      const body = await res.json();
      assert.strictEqual(body.error, 'Unauthorized: Missing or invalid token');
    });

    test('POST /reports/generate/pdf — Deny compilation downloads without Credentials', async () => {
      const res = await fetch(`${API_BASE}/reports/generate/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: '2024-25' })
      });

      assert.strictEqual(res.status, 401);
      
      const body = await res.json();
      assert.strictEqual(body.error, 'Unauthorized: Missing or invalid token');
    });

    test('POST /evidence/upload — Deny uploading files anonymously', async () => {
      const res = await fetch(`${API_BASE}/evidence/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/pdf',
          'x-file-name': 'hacker_leak.pdf',
          'x-criterion': 'C1'
        },
        body: new Uint8Array([0, 1, 2, 3]) // Dummy raw file buffer
      });

      assert.strictEqual(res.status, 401);
      
      const body = await res.json();
      assert.strictEqual(body.error, 'Unauthorized: Missing or invalid token');
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  3. AUTHENTICATED ACTIONS (Using local mock bypass)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Authenticated Operations & Report Generation', () => {
    const mockHeaders = {
      'Authorization': 'Bearer mock-jwt-token',
      'Content-Type': 'application/json'
    };

    test('GET /naac/scores/2024-25 — Fetch institutional calculations successfully', async () => {
      const res = await fetch(`${API_BASE}/naac/scores/2024-25`, {
        headers: mockHeaders
      });
      assert.strictEqual(res.status, 200);
      
      const body = await res.json();
      assert.strictEqual(body.academicYear, '2024-25');
      assert.ok(Array.isArray(body.criteria));
      assert.ok(body.cgpa >= 0 && body.cgpa <= 4.00);
      assert.ok(body.predictedGrade);
    });

    test('POST /reports/generate/pdf — Compile A4 PDF consolidated report', async () => {
      const res = await fetch(`${API_BASE}/reports/generate/pdf`, {
        method: 'POST',
        headers: mockHeaders,
        body: JSON.stringify({ year: '2024-25' })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/pdf');

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // PDF files always begin with the magic header bytes: %PDF
      const magicBytes = buffer.toString('utf8', 0, 4);
      assert.strictEqual(magicBytes, '%PDF');
    });

    test('POST /reports/generate/docx — Compile structured Word report', async () => {
      const res = await fetch(`${API_BASE}/reports/generate/docx`, {
        method: 'POST',
        headers: mockHeaders,
        body: JSON.stringify({ year: '2024-25' })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    test('POST /reports/generate/xlsx — Compile Excel spreadsheet matrix', async () => {
      const res = await fetch(`${API_BASE}/reports/generate/xlsx`, {
        method: 'POST',
        headers: mockHeaders,
        body: JSON.stringify({ year: '2024-25' })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    test('POST /reports/generate/json — Retrieve scores as downloadable JSON payload', async () => {
      const res = await fetch(`${API_BASE}/reports/generate/json`, {
        method: 'POST',
        headers: mockHeaders,
        body: JSON.stringify({ year: '2024-25' })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      
      const body = await res.json();
      assert.strictEqual(body.academicYear, '2024-25');
      assert.ok(body.gapAnalysis);
    });

    test('Flow: Upload, list and delete evidence binary documents', async () => {
      // 1. Upload a mock evidence PDF
      const uploadRes = await fetch(`${API_BASE}/evidence/upload`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-jwt-token',
          'Content-Type': 'application/pdf',
          'x-file-name': 'test_compliance_vault.pdf',
          'x-criterion': 'C1',
          'x-metric-code': '1.1.1',
          'x-academic-year': '2024-25',
          'x-uploader-name': 'IQAC Admin Auditor'
        },
        body: new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52]) // Dummy PDF header: %PDF-1.4
      });
      assert.strictEqual(uploadRes.status, 201);
      
      const uploadBody = await uploadRes.json();
      assert.strictEqual(uploadBody.name, 'test_compliance_vault.pdf');
      assert.strictEqual(uploadBody.criterion, 'C1');
      assert.strictEqual(uploadBody.metricCode, '1.1.1');
      assert.ok(uploadBody.id);

      const evidenceId = uploadBody.id;

      // 2. Query list of evidence and find the newly uploaded item
      const listRes = await fetch(`${API_BASE}/evidence?criterion=C1&academicYear=2024-25`, {
        headers: mockHeaders
      });
      assert.strictEqual(listRes.status, 200);
      
      const listBody = await listRes.json();
      assert.ok(Array.isArray(listBody));
      const uploadedItem = listBody.find((item: any) => item.id === evidenceId);
      assert.ok(uploadedItem);
      assert.strictEqual(uploadedItem.name, 'test_compliance_vault.pdf');

      // 3. Delete evidence using its ID and clean up local resources
      const deleteRes = await fetch(`${API_BASE}/evidence/${evidenceId}`, {
        method: 'DELETE',
        headers: mockHeaders
      });
      assert.strictEqual(deleteRes.status, 200);
      
      const deleteBody = await deleteRes.json();
      assert.strictEqual(deleteBody.success, true);
    });

    test('POST /naac/c1/bos — Prevent duplicate entry and yield 409 Conflict', async () => {
      // 1. Post a valid BoS record
      const uniquePayload = {
        programName: "Unique Test BTech Program",
        meetingDate: "2026-05-31T00:00:00.000Z",
        academicYear: "2024-25"
      };

      const res1 = await fetch(`${API_BASE}/naac/c1/bos`, {
        method: 'POST',
        headers: mockHeaders,
        body: JSON.stringify(uniquePayload)
      });
      assert.ok(res1.status === 200 || res1.status === 409); // either OK or already posted

      // 2. Post the same BoS record again
      const res2 = await fetch(`${API_BASE}/naac/c1/bos`, {
        method: 'POST',
        headers: mockHeaders,
        body: JSON.stringify(uniquePayload)
      });
      
      // Enforce unique duplicate blocker
      assert.strictEqual(res2.status, 409);
      const body = await res2.json();
      assert.ok(body.error.includes("Duplicate entry detected"));
    });

    test('GET /naac/scores/2029-30 — Return hasNoData true for inactive year', async () => {
      const res = await fetch(`${API_BASE}/naac/scores/2029-30`, {
        headers: mockHeaders
      });
      assert.strictEqual(res.status, 200);
      
      const body = await res.json();
      assert.strictEqual(body.hasNoData, true);
      assert.strictEqual(body.cgpa, 0);
      assert.strictEqual(body.predictedGrade, 'D');
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  4. GRANULAR ROLE-BASED ACCESS CONTROL (RBAC) INTEGRATION TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Granular Role-Based Access Control (RBAC) Enforcements', () => {

    test('REVIEWER role: Block PDF report generation with 403 Forbidden', async () => {
      const res = await fetch(`${API_BASE}/reports/generate/pdf`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-jwt-reviewer',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ year: '2024-25' })
      });
      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.ok(body.error.includes('Requires IQAC_COORDINATOR role privileges') || body.error.includes('Forbidden'));
    });

    test('FACULTY role: Block posting BoS meetings with 403 Forbidden', async () => {
      const res = await fetch(`${API_BASE}/naac/c1/bos`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-jwt-faculty',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          programName: "Faculty Malicious Program",
          meetingDate: "2026-05-31T00:00:00.000Z",
          academicYear: "2024-25"
        })
      });
      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.ok(body.error.includes('Faculty members can only enter/modify') || body.error.includes('Forbidden'));
    });

    test('DEPT_HEAD role: Block modifying global infrastructure budgets with 403 Forbidden', async () => {
      const res = await fetch(`${API_BASE}/naac/c4/maintenance`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-jwt-depthead',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          academicYear: "2024-25",
          physicalBudget: 1000000,
          academicBudget: 500000
        })
      });
      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.ok(body.error.includes('Department Heads can only modify') || body.error.includes('Forbidden'));
    });

    test('DEPT_HEAD role: Allow posting BoS meetings (department-bound resource) with 200 OK', async () => {
      const randomProgramName = `BoS Dept Head Auth Program ${Math.floor(Math.random() * 1000000)}`;
      const res = await fetch(`${API_BASE}/naac/c1/bos`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-jwt-depthead',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          programName: randomProgramName,
          meetingDate: "2026-05-31T00:00:00.000Z",
          academicYear: "2024-25"
        })
      });
      // Should succeed because BOS is department bound
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.programName, randomProgramName);
    });

    test('FACULTY role: Allow posting publications (faculty allowed resource) with 200 OK', async () => {
      const randomTitle = `Faculty Auth Publication ${Math.floor(Math.random() * 1000000)}`;
      const res = await fetch(`${API_BASE}/naac/c3/publications`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-jwt-faculty',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: "JOURNAL",
          title: randomTitle,
          authors: "Dr. Faculty",
          journalName: "IEEE Transactions on Agentic AI",
          year: 2026
        })
      });
      // Should succeed because Publication is allowed for Faculty
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.title, randomTitle);
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  5. EXCEL BULK DATA IMPORT & EXPORT TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Excel Bulk Data Import/Export Engine', () => {

    test('Excel Template generator: GET /imports/templates/1 — Retrieve Criterion 1 empty template', async () => {
      const res = await fetch(`${API_BASE}/imports/templates/1`, {
        headers: { 'Authorization': 'Bearer mock-jwt-coordinator' }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    test('Excel Export backup: GET /imports/export/backup — Success download full database backup spreadsheet', async () => {
      const res = await fetch(`${API_BASE}/imports/export/backup`, {
        headers: { 'Authorization': 'Bearer mock-jwt-coordinator' }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    test('Excel Import: POST /imports/upload/1 — Reject invalid data choice and report Zod row-level errors', async () => {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('BoS Meetings');
      
      ws.addRow(['NAAC Criterion 1 Import Template']);
      ws.addRow(['Instructions...']);
      ws.addRow(['Program Name', 'Meeting Date (YYYY-MM-DD)', 'Minutes URL', 'Industry Feedback (YES/NO)', 'Academic Year']);
      
      // Deliberate invalid date & hasIndustryFeedback field choice
      ws.addRow(['BTech CS', 'INVALID-DATE-FORMAT', '/docs/bos.pdf', 'INVALID_CHOICE', '2024-25']);
      
      const buffer = await workbook.xlsx.writeBuffer();
      
      const res = await fetch(`${API_BASE}/imports/upload/1`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-jwt-coordinator',
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        body: buffer
      });
      
      assert.strictEqual(res.status, 422);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.errors['BoS Meetings']);
      assert.strictEqual(body.errors['BoS Meetings'][0].row, 4);
      assert.strictEqual(body.errors['BoS Meetings'][0].field, 'meetingDate');
    });

    test('Excel Import: POST /imports/upload/1 — Accept valid data choice and return 200 OK', async () => {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('BoS Meetings');
      ws.addRow(['NAAC Criterion 1 Import Template']);
      ws.addRow(['Instructions...']);
      ws.addRow(['Program Name', 'Meeting Date (YYYY-MM-DD)', 'Minutes URL', 'Industry Feedback (YES/NO)', 'Academic Year']);
      
      const uniqueProgramName = `BTech Excel Import Valid Program ${Math.floor(Math.random() * 1000000)}`;
      ws.addRow([uniqueProgramName, '2026-05-31', '/docs/bos.pdf', 'YES', '2024-25']);
      
      const buffer = await workbook.xlsx.writeBuffer();
      
      const res = await fetch(`${API_BASE}/imports/upload/1`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-jwt-coordinator',
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        body: buffer
      });
      
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.importedCount, 1);
    });

  });

});
