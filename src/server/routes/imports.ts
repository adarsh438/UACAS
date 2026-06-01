// src/server/routes/imports.ts
import { Router } from 'express';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import { requireAuth, requireAccess, requireRole } from '../middleware/auth';

export const importsRouter = Router();
const prisma = new PrismaClient();

interface SheetColumn {
  header: string;
  key: string;
  width: number;
  validation?: ExcelJS.DataValidation;
  note?: string;
}

interface SheetSpec {
  name: string;
  columns: SheetColumn[];
}

const CRITERION_SHEETS: Record<number, SheetSpec[]> = {
  1: [
    {
      name: 'BoS Meetings',
      columns: [
        { header: 'Program Name', key: 'programName', width: 25, note: 'Descriptive program title, e.g., B.Tech CSE' },
        { header: 'Meeting Date (YYYY-MM-DD)', key: 'meetingDate', width: 25, note: 'Format: YYYY-MM-DD' },
        { header: 'Minutes URL', key: 'minutesUrl', width: 30, note: 'Link to BoS minutes document (optional)' },
        {
          header: 'Industry Feedback (YES/NO)', key: 'hasIndustryFeedback', width: 25,
          validation: { type: 'list', allowBlank: true, formulae: ['"YES,NO"'] }
        },
        {
          header: 'Academic Year', key: 'academicYear', width: 20,
          validation: { type: 'list', allowBlank: false, formulae: ['"2020-21,2021-22,2022-23,2023-24,2024-25"'] }
        }
      ]
    },
    {
      name: 'Value Added Courses',
      columns: [
        { header: 'Course Name', key: 'name', width: 30 },
        {
          header: 'Type (CERTIFICATE/VALUE_ADDED/ADDON)', key: 'type', width: 35,
          validation: { type: 'list', allowBlank: false, formulae: ['"CERTIFICATE,VALUE_ADDED,ADDON"'] }
        },
        { header: 'Duration (Hours)', key: 'duration', width: 20 },
        { header: 'Students Enrolled', key: 'studentsEnrolled', width: 20 },
        {
          header: 'Academic Year', key: 'academicYear', width: 20,
          validation: { type: 'list', allowBlank: false, formulae: ['"2020-21,2021-22,2022-23,2023-24,2024-25"'] }
        }
      ]
    },
    {
      name: 'MOOC Enrollments',
      columns: [
        {
          header: 'Platform', key: 'platform', width: 20,
          validation: { type: 'list', allowBlank: false, formulae: ['"NPTEL,SWAYAM,Coursera,edX,Udemy,Other"'] }
        },
        { header: 'Course Name', key: 'courseName', width: 30 },
        { header: 'Credits Earned', key: 'creditsEarned', width: 18 },
        { header: 'Students Enrolled', key: 'studentsEnrolled', width: 20 },
        {
          header: 'Academic Year', key: 'academicYear', width: 20,
          validation: { type: 'list', allowBlank: false, formulae: ['"2020-21,2021-22,2022-23,2023-24,2024-25"'] }
        }
      ]
    },
    {
      name: 'Stakeholder Feedback',
      columns: [
        {
          header: 'Stakeholder Type', key: 'stakeholderType', width: 25,
          validation: { type: 'list', allowBlank: false, formulae: ['"STUDENT,TEACHER,EMPLOYER,ALUMNI"'] }
        },
        {
          header: 'Collection Method', key: 'collectionMethod', width: 25,
          validation: { type: 'list', allowBlank: false, formulae: ['"ONLINE,OFFLINE,BOTH"'] }
        },
        { header: 'Analysis Report URL', key: 'analysisReportUrl', width: 30 },
        {
          header: 'Action Taken Report (YES/NO)', key: 'actionTakenReport', width: 28,
          validation: { type: 'list', allowBlank: true, formulae: ['"YES,NO"'] }
        },
        {
          header: 'Academic Year', key: 'academicYear', width: 20,
          validation: { type: 'list', allowBlank: false, formulae: ['"2020-21,2021-22,2022-23,2023-24,2024-25"'] }
        }
      ]
    }
  ],
  2: [
    {
      name: 'Enrollment Records',
      columns: [
        { header: 'Program Code', key: 'programId', width: 20 },
        { header: 'Sanctioned Intake', key: 'sanctionedIntake', width: 20 },
        { header: 'Admitted Students', key: 'enrolled', width: 20 },
        {
          header: 'Academic Year', key: 'academicYear', width: 20,
          validation: { type: 'list', allowBlank: false, formulae: ['"2020-21,2021-22,2022-23,2023-24,2024-25"'] }
        }
      ]
    },
    {
      name: 'FDP Records',
      columns: [
        { header: 'Program Name', key: 'programName', width: 30 },
        {
          header: 'Type (FDP/SEMINAR/CONFERENCE/WORKSHOP/TRAINING)', key: 'type', width: 35,
          validation: { type: 'list', allowBlank: false, formulae: ['"FDP,SEMINAR,CONFERENCE,WORKSHOP,TRAINING"'] }
        },
        { header: 'Faculty Count', key: 'facultyCount', width: 20 },
        { header: 'Duration', key: 'duration', width: 20 },
        { header: 'Organizer', key: 'organizer', width: 25 },
        {
          header: 'Academic Year', key: 'academicYear', width: 20,
          validation: { type: 'list', allowBlank: false, formulae: ['"2020-21,2021-22,2022-23,2023-24,2024-25"'] }
        }
      ]
    }
  ],
  3: [
    {
      name: 'Research Grants',
      columns: [
        { header: 'Project Title', key: 'projectTitle', width: 30 },
        { header: 'Agency Name', key: 'agencyName', width: 25 },
        { header: 'Amount (INR)', key: 'amount', width: 20 },
        {
          header: 'Status (ONGOING/COMPLETED)', key: 'status', width: 25,
          validation: { type: 'list', allowBlank: false, formulae: ['"ONGOING,COMPLETED"'] }
        },
        { header: 'Sanction Year', key: 'sanctionYear', width: 20 },
        {
          header: 'Academic Year', key: 'academicYear', width: 20,
          validation: { type: 'list', allowBlank: false, formulae: ['"2020-21,2021-22,2022-23,2023-24,2024-25"'] }
        }
      ]
    },
    {
      name: 'Publications',
      columns: [
        {
          header: 'Type (JOURNAL/BOOK/CHAPTER/CONFERENCE)', key: 'type', width: 35,
          validation: { type: 'list', allowBlank: false, formulae: ['"JOURNAL,BOOK,CHAPTER,CONFERENCE"'] }
        },
        { header: 'Title', key: 'title', width: 35 },
        { header: 'Authors', key: 'authors', width: 30 },
        { header: 'Journal / Book Name', key: 'journalName', width: 30 },
        { header: 'Publication Year', key: 'year', width: 25 },
        {
          header: 'Indexed In', key: 'indexedIn', width: 20,
          validation: { type: 'list', allowBlank: true, formulae: ['"UGC_CARE,SCOPUS,WOS,NONE"'] }
        }
      ]
    }
  ],
  4: [
    {
      name: 'Physical Facility',
      columns: [
        { header: 'Campus Area (Acres)', key: 'campusArea', width: 25, note: 'Total campus area in acres' },
        { header: 'Built-Up Area (Sq.M)', key: 'builtUpArea', width: 25, note: 'Total built-up area in square metres' },
        { header: 'ICT Classrooms', key: 'ictClassrooms', width: 20, note: 'Number of ICT-enabled classrooms' },
        { header: 'Total Classrooms', key: 'totalClassrooms', width: 20, note: 'Total number of classrooms' },
        {
          header: 'Sports Ground (YES/NO)', key: 'sportsGround', width: 25,
          validation: { type: 'list', allowBlank: false, formulae: ['"YES,NO"'] }
        },
        {
          header: 'Disabled Friendly (YES/NO)', key: 'disabledFriendly', width: 26,
          validation: { type: 'list', allowBlank: false, formulae: ['"YES,NO"'] }
        },
        {
          header: 'Academic Year', key: 'academicYear', width: 20,
          validation: { type: 'list', allowBlank: false, formulae: ['"2020-21,2021-22,2022-23,2023-24,2024-25"'] }
        }
      ]
    },
    {
      name: 'Library Record',
      columns: [
        { header: 'Volumes', key: 'volumes', width: 20, note: 'Total book volumes' },
        { header: 'Print Journals', key: 'printJournals', width: 20 },
        { header: 'e-Journals', key: 'eJournals', width: 20 },
        { header: 'e-Databases', key: 'eDatabases', width: 20, note: 'Number of subscribed e-databases' },
        { header: 'e-Books', key: 'eBooks', width: 20 },
        { header: 'Automation Software', key: 'automationSoftware', width: 25, note: 'e.g., KOHA, SOUL, LibSys' },
        { header: 'Footfall Per Day', key: 'footfallPerDay', width: 22 },
        {
          header: 'Academic Year', key: 'academicYear', width: 20,
          validation: { type: 'list', allowBlank: false, formulae: ['"2020-21,2021-22,2022-23,2023-24,2024-25"'] }
        }
      ]
    },
    {
      name: 'IT Infrastructure',
      columns: [
        { header: 'Student Computers', key: 'studentComputers', width: 22, note: 'Computers exclusively for student use' },
        { header: 'Total Students', key: 'totalStudents', width: 20 },
        { header: 'Bandwidth (Mbps)', key: 'bandwidthMbps', width: 22 },
        { header: 'Wi-Fi Coverage (%)', key: 'wifiCoverage', width: 22, note: 'Campus area covered by Wi-Fi (0–100)' },
        { header: 'Licensed Software Count', key: 'licensedSoftware', width: 25, note: 'Number of licensed software titles' },
        {
          header: 'Academic Year', key: 'academicYear', width: 20,
          validation: { type: 'list', allowBlank: false, formulae: ['"2020-21,2021-22,2022-23,2023-24,2024-25"'] }
        }
      ]
    },
    {
      name: 'Maintenance Budgets',
      columns: [
        { header: 'Annual Budget INR', key: 'annualBudgetINR', width: 30 },
        { header: 'Amount Utilized INR', key: 'amountUtilizedINR', width: 30 },
        {
          header: 'Academic Year', key: 'academicYear', width: 20,
          validation: { type: 'list', allowBlank: false, formulae: ['"2020-21,2021-22,2022-23,2023-24,2024-25"'] }
        }
      ]
    }
  ],
  5: [
    {
      name: 'Placement Records',
      columns: [
        { header: 'Program Code', key: 'programId', width: 20 },
        { header: 'Company Name', key: 'companyName', width: 25 },
        { header: 'Students Placed', key: 'studentsPlaced', width: 20 },
        { header: 'Average Package (LPA)', key: 'packageLPA', width: 25 },
        {
          header: 'Academic Year', key: 'academicYear', width: 20,
          validation: { type: 'list', allowBlank: false, formulae: ['"2020-21,2021-22,2022-23,2023-24,2024-25"'] }
        }
      ]
    }
  ],
  6: [
    {
      name: 'E-Governance Records',
      columns: [
        {
          header: 'Operational Area', key: 'area', width: 30,
          validation: { type: 'list', allowBlank: false, formulae: ['"ADMINISTRATION,FINANCE,EXAMS,STUDENT_SUPPORT"'] }
        },
        { header: 'Software / Portal Used', key: 'softwareUsed', width: 30 },
        {
          header: 'Academic Year', key: 'academicYear', width: 20,
          validation: { type: 'list', allowBlank: false, formulae: ['"2020-21,2021-22,2022-23,2023-24,2024-25"'] }
        }
      ]
    }
  ],
  7: [
    {
      name: 'Gender Programs',
      columns: [
        { header: 'Sensitization Programs Count', key: 'sensitizationCount', width: 30 },
        {
          header: 'Safety Facilities Available (YES/NO)', key: 'safetyFacilities', width: 28,
          validation: { type: 'list', allowBlank: false, formulae: ['"YES,NO"'] }
        },
        {
          header: 'Grievance Cell Exists (YES/NO)', key: 'grievanceCellExists', width: 28,
          validation: { type: 'list', allowBlank: false, formulae: ['"YES,NO"'] }
        },
        {
          header: 'Academic Year', key: 'academicYear', width: 20,
          validation: { type: 'list', allowBlank: false, formulae: ['"2020-21,2021-22,2022-23,2023-24,2024-25"'] }
        }
      ]
    }
  ]
};

const isYesNo = (val: any) => val === 'YES' || val === 'NO' || val === true || val === false;
const parseYesNo = (val: any): boolean => val === 'YES' || val === true;

const SCHEMAS: Record<string, z.ZodObject<any>> = {
  'BoS Meetings': z.object({
    programName: z.string().min(1, 'Program Name is required'),
    meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    minutesUrl: z.string().optional().nullable(),
    hasIndustryFeedback: z.any().refine(isYesNo, 'Must be YES or NO'),
    academicYear: z.string().min(1, 'Academic Year is required')
  }),
  'Value Added Courses': z.object({
    name: z.string().min(1, 'Course Name is required'),
    type: z.enum(['CERTIFICATE', 'VALUE_ADDED', 'ADDON'], { message: 'Must be CERTIFICATE, VALUE_ADDED, or ADDON' }),
    duration: z.string().min(1, 'Duration is required'),
    studentsEnrolled: z.number().int().nonnegative('Students Enrolled must be a positive integer'),
    academicYear: z.string().min(1, 'Academic Year is required')
  }),
  'MOOC Enrollments': z.object({
    platform: z.string().min(1, 'Platform is required'),
    courseName: z.string().min(1, 'Course Name is required'),
    creditsEarned: z.number().nonnegative('Credits must be a positive number'),
    studentsEnrolled: z.number().int().nonnegative('Students must be a positive integer'),
    academicYear: z.string().min(1, 'Academic Year is required')
  }),
  'Stakeholder Feedback': z.object({
    stakeholderType: z.enum(['STUDENT', 'TEACHER', 'EMPLOYER', 'ALUMNI']),
    collectionMethod: z.enum(['ONLINE', 'OFFLINE', 'BOTH']),
    analysisReportUrl: z.string().min(1, 'Analysis Report URL is required'),
    actionTakenReport: z.any().refine(isYesNo, 'Must be YES or NO'),
    academicYear: z.string().min(1, 'Academic Year is required')
  }),
  'Enrollment Records': z.object({
    programId: z.string().min(1, 'Program Code is required'),
    sanctionedIntake: z.number().int().nonnegative(),
    enrolled: z.number().int().nonnegative(),
    academicYear: z.string().min(1)
  }),
  'FDP Records': z.object({
    programName: z.string().min(1),
    type: z.enum(['FDP', 'SEMINAR', 'CONFERENCE', 'WORKSHOP', 'TRAINING']),
    facultyCount: z.number().int().nonnegative(),
    duration: z.string().optional().nullable(),
    organizer: z.string().optional().nullable(),
    academicYear: z.string().min(1)
  }),
  'Research Grants': z.object({
    projectTitle: z.string().optional().nullable(),
    agencyName: z.string().min(1),
    amount: z.number().positive(),
    status: z.enum(['ONGOING', 'COMPLETED']),
    sanctionYear: z.number().int().positive(),
    academicYear: z.string().min(1)
  }),
  'Publications': z.object({
    type: z.enum(['JOURNAL', 'BOOK', 'CHAPTER', 'CONFERENCE']),
    title: z.string().min(1),
    authors: z.string().min(1),
    journalName: z.string().optional().nullable(),
    year: z.number().int().positive(),
    indexedIn: z.enum(['UGC_CARE', 'SCOPUS', 'WOS', 'NONE']).optional().nullable()
  }),
  'Physical Facility': z.object({
    campusArea: z.number().nonnegative().optional().nullable(),
    builtUpArea: z.number().nonnegative().optional().nullable(),
    ictClassrooms: z.number().int().nonnegative().optional().nullable(),
    totalClassrooms: z.number().int().nonnegative().optional().nullable(),
    sportsGround: z.any().refine(isYesNo, 'Must be YES or NO'),
    disabledFriendly: z.any().refine(isYesNo, 'Must be YES or NO'),
    academicYear: z.string().min(1)
  }),
  'Library Record': z.object({
    volumes: z.number().int().nonnegative().optional().nullable(),
    printJournals: z.number().int().nonnegative().optional().nullable(),
    eJournals: z.number().int().nonnegative().optional().nullable(),
    eDatabases: z.number().int().nonnegative().optional().nullable(),
    eBooks: z.number().int().nonnegative().optional().nullable(),
    automationSoftware: z.string().optional().nullable(),
    footfallPerDay: z.number().int().nonnegative().optional().nullable(),
    academicYear: z.string().min(1)
  }),
  'IT Infrastructure': z.object({
    studentComputers: z.number().int().nonnegative().optional().nullable(),
    totalStudents: z.number().int().nonnegative().optional().nullable(),
    bandwidthMbps: z.number().nonnegative().optional().nullable(),
    wifiCoverage: z.number().min(0).max(100).optional().nullable(),
    licensedSoftware: z.number().int().nonnegative().optional().nullable(),
    academicYear: z.string().min(1)
  }),
  'Maintenance Budgets': z.object({
    annualBudgetINR: z.number().nonnegative(),
    amountUtilizedINR: z.number().nonnegative(),
    academicYear: z.string().min(1)
  }),
  'Placement Records': z.object({
    programId: z.string().min(1),
    companyName: z.string().min(1),
    studentsPlaced: z.number().int().nonnegative(),
    packageLPA: z.number().nonnegative(),
    academicYear: z.string().min(1)
  }),
  'E-Governance Records': z.object({
    area: z.enum(['ADMINISTRATION', 'FINANCE', 'EXAMS', 'STUDENT_SUPPORT']),
    softwareUsed: z.string().min(1),
    academicYear: z.string().min(1)
  }),
  'Gender Programs': z.object({
    sensitizationCount: z.number().int().nonnegative(),
    safetyFacilities: z.any().refine(isYesNo),
    grievanceCellExists: z.any().refine(isYesNo),
    academicYear: z.string().min(1)
  })
};

async function ensureProgramExists(prismaTx: any, programId: string, universityId: string) {
  const existing = await prismaTx.program.findUnique({ where: { id: programId } });
  if (!existing) {
    await prismaTx.program.create({
      data: {
        id: programId,
        name: `Program ${programId}`,
        code: programId,
        departmentId: 'dept-cs-456',
        universityId
      }
    });
  }
}

// 1. Template Generator
importsRouter.get('/templates/:criterion', requireAuth, async (req, res) => {
  const criterionNum = parseInt(req.params.criterion);
  if (isNaN(criterionNum) || criterionNum < 1 || criterionNum > 7) {
    return res.status(400).json({ error: 'Invalid Criterion number' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const sheets = CRITERION_SHEETS[criterionNum] || [];

    const criterionColors: Record<number, string> = {
      1: '6366f1',
      2: '0ea5e9',
      3: '10b981',
      4: 'f59e0b',
      5: 'ef4444',
      6: '8b5cf6',
      7: '14b8a6'
    };
    const themeColor = criterionColors[criterionNum] || '2563eb';

    for (const sheetSpec of sheets) {
      const ws = workbook.addWorksheet(sheetSpec.name);
      
      ws.addRow([`NAAC Criterion ${criterionNum} Bulk Data Import Template — Sheet: ${sheetSpec.name}`]);
      ws.addRow(['Instructions: Fill rows starting from Row 3. Ensure dropdown constraints are satisfied. Do not modify headers.']);
      
      const headerRowValues = sheetSpec.columns.map(c => c.header);
      const headerRow = ws.addRow(headerRowValues);
      
      ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
      ws.getRow(1).getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: themeColor } };
      ws.getRow(2).font = { italic: true, color: { argb: '475569' }, size: 9 };
      ws.mergeCells(1, 1, 1, sheetSpec.columns.length);
      ws.mergeCells(2, 1, 2, sheetSpec.columns.length);

      headerRow.font = { bold: true, color: { argb: '1E293B' }, size: 10 };
      headerRow.eachCell((cell, colIndex) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
        cell.border = {
          bottom: { style: 'medium', color: { argb: 'CBD5E1' } },
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };
        
        const colSpec = sheetSpec.columns[colIndex - 1];
        if (colSpec.note) {
          cell.note = colSpec.note;
        }
      });

      sheetSpec.columns.forEach((c, idx) => {
        ws.getColumn(idx + 1).width = c.width;
        if (c.validation) {
          for (let row = 4; row <= 100; row++) {
            const cell = ws.getCell(row, idx + 1);
            cell.dataValidation = c.validation;
          }
        }
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=naac_template_c${criterionNum}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to build Excel template', details: String(err) });
  }
});

// 2. Parser & Zod Upload Router
importsRouter.post('/upload/:criterion', requireAuth, express.raw({ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', limit: '10mb' }), async (req: express.Request, res: express.Response) => {
  const criterionNum = parseInt(req.params.criterion);
  if (isNaN(criterionNum) || criterionNum < 1 || criterionNum > 7) {
    return res.status(400).json({ error: 'Invalid Criterion number' });
  }

  const buffer = req.body;
  if (!buffer || buffer.length === 0) {
    return res.status(400).json({ error: 'No Excel buffer received' });
  }

  const role = req.user?.role;
  if (role === 'REVIEWER') {
    return res.status(403).json({ error: 'Forbidden: Peer Reviewer has strictly read-only access' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const sheets = CRITERION_SHEETS[criterionNum] || [];
    const errors: Record<string, any[]> = {};
    const parsedData: Record<string, any[]> = {};
    let totalRows = 0;

    for (const sheetSpec of sheets) {
      const ws = workbook.getWorksheet(sheetSpec.name);
      if (!ws) continue;

      errors[sheetSpec.name] = [];
      parsedData[sheetSpec.name] = [];

      ws.eachRow((row, rowNumber) => {
        if (rowNumber < 4) return; // Skip title row, instructions row & header row
        
        let isEmpty = true;
        row.eachCell((cell) => {
          if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
            isEmpty = false;
          }
        });
        if (isEmpty) return;

        const rawRow: Record<string, any> = {};
        sheetSpec.columns.forEach((col, colIdx) => {
          const cell = row.getCell(colIdx + 1);
          let val = cell.value;
          
          if (val && typeof val === 'object') {
            if ('result' in val) val = val.result;
            else if ('text' in val) val = val.text;
          }

          const schemaField = SCHEMAS[sheetSpec.name]?.shape[col.key];
          if (schemaField instanceof z.ZodNumber && typeof val === 'string') {
            val = parseFloat(val);
          }

          rawRow[col.key] = val;
        });

        const schema = SCHEMAS[sheetSpec.name];
        if (schema) {
          const result = schema.safeParse(rawRow);
          if (!result.success) {
            result.error.issues.forEach(err => {
              errors[sheetSpec.name].push({
                row: rowNumber,
                field: err.path.join('.'),
                value: rawRow[err.path[0] as string],
                error: err.message
              });
            });
          } else {
            parsedData[sheetSpec.name].push(result.data);
            totalRows++;
          }
        }
      });

      if (errors[sheetSpec.name].length === 0) {
        delete errors[sheetSpec.name];
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ success: false, errors });
    }

    const univ = await prisma.university.findFirst();
    const universityId = univ?.id || '';

    // Save transactionally
    await prisma.$transaction(async (tx) => {
      for (const sheetName of Object.keys(parsedData)) {
        const rows = parsedData[sheetName];
        
        for (const row of rows) {
          if (sheetName === 'BoS Meetings') {
            await tx.bosMeeting.create({
              data: {
                programName: row.programName,
                meetingDate: new Date(row.meetingDate),
                minutesUrl: row.minutesUrl,
                hasIndustryFeedback: parseYesNo(row.hasIndustryFeedback),
                academicYear: row.academicYear,
                universityId
              }
            });
          } else if (sheetName === 'Value Added Courses') {
            await tx.valueAddedCourse.create({
              data: {
                name: row.name,
                type: row.type,
                duration: row.duration,
                studentsEnrolled: row.studentsEnrolled,
                academicYear: row.academicYear,
                universityId
              }
            });
          } else if (sheetName === 'MOOC Enrollments') {
            await tx.mOOCEnrollment.create({
              data: {
                platform: row.platform,
                courseName: row.courseName,
                creditsEarned: row.creditsEarned,
                studentsEnrolled: row.studentsEnrolled,
                academicYear: row.academicYear,
                universityId
              }
            });
          } else if (sheetName === 'Stakeholder Feedback') {
            await tx.feedbackRecord.create({
              data: {
                stakeholderType: row.stakeholderType,
                collectionMethod: row.collectionMethod,
                analysisReportUrl: row.analysisReportUrl,
                actionTakenReport: parseYesNo(row.actionTakenReport),
                academicYear: row.academicYear,
                universityId
              }
            });
          } else if (sheetName === 'Enrollment Records') {
            await ensureProgramExists(tx, row.programId, universityId);
            await tx.enrollmentRecord.create({
              data: {
                programId: row.programId,
                sanctionedIntake: row.sanctionedIntake,
                enrolled: row.enrolled,
                academicYear: row.academicYear,
                universityId
              }
            });
          } else if (sheetName === 'FDP Records') {
            await tx.fDPRecord.create({
              data: {
                programName: row.programName,
                type: row.type,
                facultyCount: row.facultyCount,
                duration: row.duration,
                organizer: row.organizer,
                academicYear: row.academicYear,
                universityId
              }
            });
          } else if (sheetName === 'Research Grants') {
            await tx.researchGrant.create({
              data: {
                projectTitle: row.projectTitle,
                agencyName: row.agencyName,
                amount: row.amount,
                status: row.status,
                sanctionYear: row.sanctionYear,
                academicYear: row.academicYear,
                universityId
              }
            });
          } else if (sheetName === 'Publications') {
            await tx.publication.create({
              data: {
                type: row.type,
                title: row.title,
                authors: row.authors,
                journalName: row.journalName,
                year: row.year,
                indexedIn: row.indexedIn,
                universityId
              }
            });
          } else if (sheetName === 'Physical Facility') {
            await tx.physicalFacility.create({
              data: {
                campusAreaAcres: row.campusArea ?? null,
                builtUpAreaSqM: row.builtUpArea ?? null,
                ictClassrooms: row.ictClassrooms ?? null,
                totalClassrooms: row.totalClassrooms ?? null,
                sportsGround: parseYesNo(row.sportsGround),
                rampAvailability: parseYesNo(row.disabledFriendly),
                disabledFriendlyToilets: parseYesNo(row.disabledFriendly),
                academicYear: row.academicYear,
                universityId
              }
            });
          } else if (sheetName === 'Library Record') {
            await tx.libraryRecord.create({
              data: {
                volumes: row.volumes ?? 0,
                printJournals: row.printJournals ?? 0,
                eJournals: row.eJournals ?? 0,
                eBooks: row.eBooks ?? 0,
                automationSoftware: row.automationSoftware ?? null,
                footfallPerDay: row.footfallPerDay ?? null,
                academicYear: row.academicYear,
                universityId
              }
            });
          } else if (sheetName === 'IT Infrastructure') {
            await tx.iTInfrastructure.create({
              data: {
                computersForStudents: row.studentComputers ?? 0,
                totalStudents: row.totalStudents ?? 0,
                internetBandwidthMbps: row.bandwidthMbps ?? 0,
                wifiCoveragePercent: row.wifiCoverage ?? null,
                licensedSoftwareCount: row.licensedSoftware ?? null,
                academicYear: row.academicYear,
                universityId
              }
            });
          } else if (sheetName === 'Maintenance Budgets') {
            await tx.maintenanceBudget.create({
              data: {
                annualBudgetINR: row.annualBudgetINR,
                amountUtilizedINR: row.amountUtilizedINR,
                academicYear: row.academicYear,
                universityId
              }
            });
          } else if (sheetName === 'Placement Records') {
            await ensureProgramExists(tx, row.programId, universityId);
            await tx.placementRecord.create({
              data: {
                programId: row.programId,
                companyName: row.companyName,
                studentsPlaced: row.studentsPlaced,
                packageLPA: row.packageLPA,
                academicYear: row.academicYear,
                universityId
              }
            });
          } else if (sheetName === 'E-Governance Records') {
            await tx.eGovernanceRecord.create({
              data: {
                area: row.area,
                softwareUsed: row.softwareUsed,
                academicYear: row.academicYear,
                universityId
              }
            });
          } else if (sheetName === 'Gender Programs') {
            await tx.genderProgram.create({
              data: {
                sensitizationCount: row.sensitizationCount,
                safetyFacilities: parseYesNo(row.safetyFacilities),
                grievanceCellExists: parseYesNo(row.grievanceCellExists),
                academicYear: row.academicYear,
                universityId
              }
            });
          }
        }
      }
    });

    res.json({ success: true, importedCount: totalRows });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error during data import', details: String(err) });
  }
});

// 3. Consolidated Full System Backup Exporter
importsRouter.get('/export/backup', requireAuth, requireRole('IQAC_COORDINATOR'), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const uid = await prisma.university.findFirst().then(u => u?.id || '');

    const tables = [
      { name: 'BoS Meetings', model: prisma.bosMeeting, query: { where: { universityId: uid } } },
      { name: 'Value Added Courses', model: prisma.valueAddedCourse, query: { where: { universityId: uid } } },
      { name: 'MOOC Enrollments', model: prisma.mOOCEnrollment, query: { where: { universityId: uid } } },
      { name: 'Stakeholder Feedback', model: prisma.feedbackRecord, query: { where: { universityId: uid } } },
      { name: 'Enrollment Records', model: prisma.enrollmentRecord, query: { where: { universityId: uid } } },
      { name: 'FDP Records', model: prisma.fDPRecord, query: { where: { universityId: uid } } },
      { name: 'Research Grants', model: prisma.researchGrant, query: { where: { universityId: uid } } },
      { name: 'Publications', model: prisma.publication, query: { where: { universityId: uid } } },
      { name: 'Maintenance Budgets', model: prisma.maintenanceBudget, query: { where: { universityId: uid } } },
      { name: 'Placement Records', model: prisma.placementRecord, query: { where: { universityId: uid } } },
      { name: 'E-Governance Records', model: prisma.eGovernanceRecord, query: { where: { universityId: uid } } },
      { name: 'Gender Programs', model: prisma.genderProgram, query: { where: { universityId: uid } } }
    ];

    for (const table of tables) {
      const ws = workbook.addWorksheet(table.name);
      const rows: any[] = await (table.model as any).findMany(table.query);

      if (rows.length === 0) {
        ws.addRow(['No records found in this table']);
        continue;
      }

      const headers = Object.keys(rows[0]).filter(k => k !== 'universityId' && k !== 'createdAt');
      ws.addRow(headers);

      rows.forEach(r => {
        const rowVal = headers.map(h => {
          const val = r[h];
          if (val instanceof Date) return val.toISOString().split('T')[0];
          return val;
        });
        ws.addRow(rowVal);
      });

      ws.getRow(1).font = { bold: true };
      ws.columns.forEach(col => { col.width = 25; });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=naac_ssr_full_backup_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate consolidated Excel backup', details: String(err) });
  }
});
