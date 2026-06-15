// src/server/routes/aqar.ts — AQAR Module API Routes
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { logger } from '../logger';
import { z } from 'zod';
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  HeadingLevel, WidthType, AlignmentType, TextRun,
  Header, Footer, PageNumber, TabStopPosition, TabStopType
} from 'docx';

export const aqarRouter = Router();
const prisma = new PrismaClient();

// Helper: get universityId from first university (single-tenant for now)
async function getUniversityId() {
  const univ = await prisma.university.findFirst();
  return univ?.id || 'univ-demo-001';
}

// Helper: build a formatted docx table
function buildDocxTable(headers: string[], rows: string[][], colWidths: number[]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map((h, i) => new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })],
          })],
          shading: { fill: "1E293B" },
          width: { size: colWidths[i], type: WidthType.PERCENTAGE },
        }))
      }),
      ...rows.map((row, rowIdx) => new TableRow({
        children: row.map((cell, cellIdx) => new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: cell, size: 18 })],
          })],
          shading: rowIdx % 2 === 1 ? { fill: "F8FAFC" } : undefined,
          width: { size: colWidths[cellIdx], type: WidthType.PERCENTAGE },
        }))
      }))
    ]
  });
}

// ─────────────────────────────────────────────
//  GET /aqar/status — All years submission status
// ─────────────────────────────────────────────
aqarRouter.get('/status', requireAuth, async (req, res) => {
  try {
    const universityId = await getUniversityId();
    const records = await prisma.aqarRecord.findMany({
      where: { universityId },
      orderBy: { year: 'desc' },
      select: {
        id: true,
        year: true,
        status: true,
        submittedDate: true,
        updatedAt: true,
        _count: { select: { iqacActivities: true } }
      }
    });

    // Generate list of academic years that have SSR data but no AQAR yet
    const existingYears = records.map(r => r.year);
    const ssrYears = await prisma.enrollmentRecord.findMany({
      where: { universityId },
      select: { academicYear: true },
      distinct: ['academicYear']
    });

    const availableYears = ssrYears
      .map(s => s.academicYear)
      .filter(y => !existingYears.includes(y));

    res.json({ records, availableYears });
  } catch (e) {
    logger.error(`Failed to fetch AQAR status: ${e}`);
    res.status(500).json({ error: 'Failed to fetch AQAR status' });
  }
});

// ─────────────────────────────────────────────
//  GET /aqar/:year — Auto-populated AQAR data
// ─────────────────────────────────────────────
aqarRouter.get('/:year', requireAuth, async (req, res) => {
  try {
    const { year } = req.params;
    const universityId = await getUniversityId();

    // Fetch or create AQAR record
    let aqar = await prisma.aqarRecord.findUnique({
      where: { year_universityId: { year, universityId } },
      include: { iqacActivities: { orderBy: { activityDate: 'desc' } } }
    });

    if (!aqar) {
      aqar = await prisma.aqarRecord.create({
        data: { year, universityId },
        include: { iqacActivities: true }
      });
    }

    // Auto-populate Part A: Institutional Details
    const university = await prisma.university.findFirst({ where: { id: universityId } });
    const departments = await prisma.department.findMany({ where: { universityId } });
    const programs = await prisma.program.findMany({
      where: { department: { universityId } },
      include: { department: true }
    });
    const totalFaculty = await prisma.faculty.count({ where: { department: { universityId } } });
    const phdFaculty = await prisma.faculty.count({ where: { department: { universityId }, hasPhD: true } });

    // Auto-populate Part B: Criterion-wise summary from SSR data
    const enrollment = await prisma.enrollmentRecord.findMany({ where: { universityId, academicYear: year } });
    const totalStudents = enrollment.reduce((s, e) => s + e.enrolled, 0);
    const totalSanctioned = enrollment.reduce((s, e) => s + e.sanctionedIntake, 0);

    const publications = await prisma.publication.findMany({ where: { universityId } });
    const pubsThisYear = publications.filter(p => String(p.year) === year.split('-')[0] || String(p.year) === year.split('-')[1]);
    const grants = await prisma.researchGrant.findMany({ where: { universityId, academicYear: year } });
    const patents = await prisma.patent.findMany({ where: { universityId } });
    const placements = await prisma.placementRecord.findMany({ where: { universityId, academicYear: year } });
    const scholarships = await prisma.scholarship.findMany({ where: { universityId, academicYear: year } });
    const extensions = await prisma.extensionActivity.findMany({ where: { universityId, academicYear: year } });
    const mous = await prisma.moU.findMany({ where: { universityId } });
    const fdps = await prisma.fDPRecord.findMany({ where: { universityId, academicYear: year } });
    const feedback = await prisma.feedbackRecord.findMany({ where: { universityId, academicYear: year } });
    const vac = await prisma.valueAddedCourse.findMany({ where: { universityId, academicYear: year } });
    const iqacRec = await prisma.iQACRecord.findFirst({ where: { universityId, academicYear: year } });
    const bestPractices = await prisma.bestPractice.findMany({ where: { universityId } });
    const distinctiveness = await prisma.institutionalDistinctiveness.findFirst({ where: { universityId } });
    const greenRec = await prisma.greenInitiative.findFirst({ where: { universityId, academicYear: year } });
    const financial = await prisma.financialRecord.findFirst({ where: { universityId, academicYear: year } });
    const eGov = await prisma.eGovernanceRecord.findMany({ where: { universityId, academicYear: year } });

    const autoPopulated = {
      partA: {
        institutionName: university?.name || '',
        aisheCode: university?.aisheCode || '',
        type: university?.type || '',
        city: university?.city || '',
        state: university?.state || '',
        website: university?.website || '',
        established: university?.established || 0,
        naacCycle: university?.naacCycle || 1,
        naacGrade: university?.naacGrade || '',
        totalPrograms: programs.length,
        departments: departments.map(d => ({ name: d.name, code: d.code })),
        programsSummary: programs.map(p => ({
          name: p.name, level: p.level, department: p.department.name
        })),
        totalStudents,
        totalSanctioned,
        totalFaculty,
        phdFaculty,
        enrollmentByCategory: {
          sc: enrollment.reduce((s, e) => s + e.enrolledSC, 0),
          st: enrollment.reduce((s, e) => s + e.enrolledST, 0),
          obc: enrollment.reduce((s, e) => s + e.enrolledOBC, 0),
          ews: enrollment.reduce((s, e) => s + e.enrolledEWS, 0),
          general: enrollment.reduce((s, e) => s + e.enrolledGeneral, 0),
        }
      },
      partB: {
        criterion1: {
          valueAddedCourses: vac.length,
          valueAddedEnrollment: vac.reduce((s, v) => s + v.studentsEnrolled, 0),
          feedbackTypes: new Set(feedback.map(f => f.stakeholderType)).size,
          feedbackActionTaken: feedback.some(f => f.actionTakenReport),
        },
        criterion2: {
          totalEnrolled: totalStudents,
          totalSanctioned,
          fdpCount: fdps.length,
          facultyInFDP: fdps.reduce((s, f) => s + f.facultyCount, 0),
        },
        criterion3: {
          totalPublications: pubsThisYear.length,
          scopusWos: pubsThisYear.filter(p => p.indexedIn === 'SCOPUS' || p.indexedIn === 'WOS').length,
          totalGrants: grants.reduce((s, g) => s + g.amount, 0),
          activeProjects: grants.filter(g => g.status === 'ONGOING').length,
          patentsFiled: patents.filter(p => p.status === 'FILED').length,
          patentsGranted: patents.filter(p => p.status === 'GRANTED').length,
          extensionActivities: extensions.length,
          totalMoUs: mous.length,
        },
        criterion4: {
          greenInitiatives: greenRec ? {
            solar: greenRec.solarPanels, rainwater: greenRec.rainwaterHarvesting,
            composting: greenRec.composting, paperless: greenRec.paperlessOffice,
          } : null,
        },
        criterion5: {
          studentsPlaced: placements.reduce((s, p) => s + p.studentsPlaced, 0),
          avgPackageLPA: placements.length > 0 ? placements.reduce((s, p) => s + (p.packageLPA || 0), 0) / placements.length : 0,
          scholarshipRecipients: scholarships.reduce((s, sc) => s + sc.recipients, 0),
          scholarshipAmount: scholarships.reduce((s, sc) => s + sc.amountINR, 0),
        },
        criterion6: {
          iqacMeetings: iqacRec?.meetingsPerYear || 0,
          qualityInitiatives: iqacRec?.qualityInitiatives || 0,
          eGovernanceAreas: eGov.length,
          avgEGovPercent: eGov.length > 0 ? eGov.reduce((s, e) => s + e.automationPercent, 0) / eGov.length : 0,
          internalAudit: financial?.internalAuditDone || false,
          externalAudit: financial?.externalAuditDone || false,
        },
        criterion7: {
          bestPractices: bestPractices.map(bp => ({ title: bp.title, objectives: bp.objectives })),
          distinctiveness: distinctiveness?.uniqueCharacters || '',
        }
      }
    };

    res.json({
      aqar,
      autoPopulated,
    });
  } catch (e) {
    logger.error(`Failed to fetch AQAR for year: ${e}`);
    res.status(500).json({ error: 'Failed to fetch AQAR data' });
  }
});

// ─────────────────────────────────────────────
//  PUT /aqar/:year — Save AQAR-specific fields
// ─────────────────────────────────────────────
const aqarUpdateSchema = z.object({
  body: z.object({
    institutionalAchievements: z.string().optional(),
    futurePlans: z.string().optional(),
    iqacComposition: z.string().optional(),
    iqacMeetingCount: z.number().optional(),
    collaborationActivities: z.string().optional(),
    externalQualityReviews: z.string().optional(),
    status: z.enum(['DRAFT', 'SUBMITTED', 'PENDING']).optional(),
  })
});

aqarRouter.put('/:year', requireAuth, requireRole('IQAC_COORDINATOR'), async (req, res) => {
  try {
    const { year } = req.params;
    const universityId = await getUniversityId();

    const updateData: any = { ...req.body };
    if (updateData.status === 'SUBMITTED') {
      updateData.submittedDate = new Date();
    }

    const aqar = await prisma.aqarRecord.upsert({
      where: { year_universityId: { year, universityId } },
      update: updateData,
      create: { year, universityId, ...updateData },
      include: { iqacActivities: true }
    });

    res.json(aqar);
  } catch (e) {
    logger.error(`Failed to update AQAR: ${e}`);
    res.status(500).json({ error: 'Failed to update AQAR' });
  }
});

// ─────────────────────────────────────────────
//  POST /aqar/:year/activities — Add IQAC activity
// ─────────────────────────────────────────────
aqarRouter.post('/:year/activities', requireAuth, requireRole('IQAC_COORDINATOR'), async (req, res) => {
  try {
    const { year } = req.params;
    const universityId = await getUniversityId();

    // Ensure AQAR record exists
    let aqar = await prisma.aqarRecord.findUnique({
      where: { year_universityId: { year, universityId } }
    });
    if (!aqar) {
      aqar = await prisma.aqarRecord.create({ data: { year, universityId } });
    }

    const activity = await prisma.aqarIqacActivity.create({
      data: {
        aqarId: aqar.id,
        activityDate: new Date(req.body.activityDate),
        description: req.body.description,
        participants: req.body.participants || 0,
        outcome: req.body.outcome || null,
      }
    });

    res.json(activity);
  } catch (e) {
    logger.error(`Failed to add IQAC activity: ${e}`);
    res.status(500).json({ error: 'Failed to add activity' });
  }
});

// ─────────────────────────────────────────────
//  DELETE /aqar/:year/activities/:id — Remove IQAC activity
// ─────────────────────────────────────────────
aqarRouter.delete('/:year/activities/:id', requireAuth, requireRole('IQAC_COORDINATOR'), async (req, res) => {
  try {
    await prisma.aqarIqacActivity.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    logger.error(`Failed to delete IQAC activity: ${e}`);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// ─────────────────────────────────────────────
//  POST /aqar/generate/:year — Generate AQAR Word doc
// ─────────────────────────────────────────────
aqarRouter.post('/generate/:year', requireAuth, requireRole('IQAC_COORDINATOR'), async (req, res) => {
  try {
    const { year } = req.params;
    const universityId = await getUniversityId();
    const university = await prisma.university.findFirst({ where: { id: universityId } });
    const univName = university?.name || 'UACAS Institute';

    // Fetch AQAR record
    const aqar = await prisma.aqarRecord.findUnique({
      where: { year_universityId: { year, universityId } },
      include: { iqacActivities: { orderBy: { activityDate: 'asc' } } }
    });

    // Fetch SSR data for auto-population
    const enrollment = await prisma.enrollmentRecord.findMany({ where: { universityId, academicYear: year } });
    const totalStudents = enrollment.reduce((s, e) => s + e.enrolled, 0);
    const totalFaculty = await prisma.faculty.count({ where: { department: { universityId } } });
    const phdFaculty = await prisma.faculty.count({ where: { department: { universityId }, hasPhD: true } });
    const programs = await prisma.program.findMany({ where: { department: { universityId } }, include: { department: true } });
    const publications = await prisma.publication.findMany({ where: { universityId } });
    const grants = await prisma.researchGrant.findMany({ where: { universityId, academicYear: year } });
    const placements = await prisma.placementRecord.findMany({ where: { universityId, academicYear: year } });
    const bestPractices = await prisma.bestPractice.findMany({ where: { universityId } });
    const distinctiveness = await prisma.institutionalDistinctiveness.findFirst({ where: { universityId } });
    const iqacRec = await prisma.iQACRecord.findFirst({ where: { universityId, academicYear: year } });

    const doc = new Document({
      sections: [{
        properties: {},
        headers: {
          default: new Header({
            children: [new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                new TextRun({ text: univName, bold: true, color: "64748b", size: 16 }),
                new TextRun({ text: `\tAQAR ${year}`, bold: true, color: "64748b", size: 16 }),
              ],
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Page ", color: "64748b", size: 16 }),
                new TextRun({ children: [PageNumber.CURRENT], color: "64748b", bold: true, size: 16 }),
                new TextRun({ text: " of ", color: "64748b", size: 16 }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], color: "64748b", bold: true, size: 16 }),
              ],
            })],
          }),
        },
        children: [
          // Title
          new Paragraph({
            text: univName.toUpperCase(),
            heading: HeadingLevel.HEADING_3,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          }),
          new Paragraph({
            text: "ANNUAL QUALITY ASSURANCE REPORT (AQAR)",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 60 },
          }),
          new Paragraph({
            text: `For the Academic Year ${year}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
          new Paragraph({
            text: `Submitted to the National Assessment and Accreditation Council (NAAC)`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
            children: [new TextRun({ text: `Submitted to the National Assessment and Accreditation Council (NAAC)`, italics: true, color: "64748b", size: 18 })]
          }),

          // PART A: Details of the Institution
          new Paragraph({
            text: "PART A — DETAILS OF THE INSTITUTION",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          }),
          buildDocxTable(
            ["Parameter", "Details"],
            [
              ["Name of the Institution", univName],
              ["AISHE Code", university?.aisheCode || "N/A"],
              ["Year of Establishment", String(university?.established || "N/A")],
              ["Type of Institution", university?.type || "N/A"],
              ["City / State", `${university?.city || ''}, ${university?.state || ''}`],
              ["Website", university?.website || "N/A"],
              ["NAAC Accreditation Cycle", String(university?.naacCycle || 1)],
              ["Last NAAC Grade", university?.naacGrade || "N/A"],
              ["Total Programs Offered", String(programs.length)],
              ["Total Students Enrolled", String(totalStudents)],
              ["Total Faculty", String(totalFaculty)],
              ["Faculty with PhD", String(phdFaculty)],
            ],
            [40, 60]
          ),

          // Programs table
          new Paragraph({
            text: "Programs Offered",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
          }),
          buildDocxTable(
            ["Program Name", "Level", "Department"],
            programs.map(p => [p.name, p.level, p.department.name]),
            [40, 20, 40]
          ),

          // PART B: Criterion-wise Summary
          new Paragraph({
            text: "PART B — CRITERION-WISE SUMMARY",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
          }),

          // C1
          new Paragraph({ text: "Criterion I — Curricular Aspects", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
          new Paragraph({
            text: `The institution has conducted structured feedback collection from ${new Set((await prisma.feedbackRecord.findMany({ where: { universityId, academicYear: year } })).map(f => f.stakeholderType)).size} stakeholder types. ${(await prisma.valueAddedCourse.findMany({ where: { universityId, academicYear: year } })).length} value-added courses were offered during this academic year.`,
            spacing: { after: 120 },
          }),

          // C2
          new Paragraph({ text: "Criterion II — Teaching-Learning and Evaluation", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
          new Paragraph({
            text: `Total enrollment: ${totalStudents} students against a sanctioned intake of ${enrollment.reduce((s, e) => s + e.sanctionedIntake, 0)}. The institution has ${totalFaculty} faculty members, of which ${phdFaculty} hold doctoral degrees (${totalFaculty > 0 ? ((phdFaculty / totalFaculty) * 100).toFixed(1) : 0}%).`,
            spacing: { after: 120 },
          }),

          // C3
          new Paragraph({ text: "Criterion III — Research, Innovations and Extension", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
          buildDocxTable(
            ["Research Metric", "Value"],
            [
              ["Total Publications", String(publications.length)],
              ["Scopus/WoS Indexed", String(publications.filter(p => p.indexedIn === 'SCOPUS' || p.indexedIn === 'WOS').length)],
              ["Research Grants (INR)", `₹${grants.reduce((s, g) => s + g.amount, 0).toLocaleString('en-IN')}`],
              ["Active Projects", String(grants.filter(g => g.status === 'ONGOING').length)],
            ],
            [50, 50]
          ),

          // C5
          new Paragraph({ text: "Criterion V — Student Support and Progression", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
          new Paragraph({
            text: `Students placed: ${placements.reduce((s, p) => s + p.studentsPlaced, 0)}. Average package: ₹${placements.length > 0 ? (placements.reduce((s, p) => s + (p.packageLPA || 0), 0) / placements.length).toFixed(2) : 0} LPA.`,
            spacing: { after: 120 },
          }),

          // C6
          new Paragraph({ text: "Criterion VI — Governance, Leadership and Management", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
          new Paragraph({
            text: `IQAC meetings conducted: ${iqacRec?.meetingsPerYear || 0}. Quality initiatives undertaken: ${iqacRec?.qualityInitiatives || 0}.`,
            spacing: { after: 120 },
          }),

          // C7 - Best Practices
          new Paragraph({ text: "Criterion VII — Best Practices", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
          ...bestPractices.flatMap(bp => [
            new Paragraph({ text: `Best Practice ${bp.practiceNumber}: ${bp.title}`, heading: HeadingLevel.HEADING_3, spacing: { before: 120, after: 60 } }),
            new Paragraph({ text: `Objectives: ${bp.objectives}`, spacing: { after: 60 } }),
            new Paragraph({ text: `Description: ${bp.practiceDesc}`, spacing: { after: 60 } }),
            new Paragraph({ text: `Evidence of Success: ${bp.evidenceSuccess}`, spacing: { after: 120 } }),
          ]),

          // Institutional Distinctiveness
          ...(distinctiveness ? [
            new Paragraph({ text: "Institutional Distinctiveness", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
            new Paragraph({ text: distinctiveness.uniqueCharacters, spacing: { after: 120 } }),
          ] : []),

          // PART C: IQAC Activities
          new Paragraph({
            text: "PART C — IQAC ACTIVITIES AND CONTRIBUTIONS",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
          }),

          ...(aqar?.iqacComposition ? [
            new Paragraph({ text: "IQAC Composition", heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 120 } }),
            new Paragraph({ text: aqar.iqacComposition, spacing: { after: 120 } }),
          ] : []),

          ...(aqar?.collaborationActivities ? [
            new Paragraph({ text: "Collaboration Activities", heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 120 } }),
            new Paragraph({ text: aqar.collaborationActivities, spacing: { after: 120 } }),
          ] : []),

          // IQAC Activity Log
          ...(aqar && aqar.iqacActivities.length > 0 ? [
            new Paragraph({ text: "IQAC Activity Log", heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 120 } }),
            buildDocxTable(
              ["Date", "Activity", "Participants", "Outcome"],
              aqar.iqacActivities.map(a => [
                new Date(a.activityDate).toLocaleDateString('en-IN'),
                a.description,
                String(a.participants),
                a.outcome || '—',
              ]),
              [15, 40, 15, 30]
            ),
          ] : []),

          // PART D: Future Plans
          new Paragraph({
            text: "PART D — FUTURE PLANS",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
          }),

          ...(aqar?.institutionalAchievements ? [
            new Paragraph({ text: "Institutional Achievements", heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 120 } }),
            new Paragraph({ text: aqar.institutionalAchievements, spacing: { after: 120 } }),
          ] : []),

          ...(aqar?.futurePlans ? [
            new Paragraph({ text: "Future Plans", heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 120 } }),
            new Paragraph({ text: aqar.futurePlans, spacing: { after: 120 } }),
          ] : []),

          // Signature block
          new Paragraph({ text: "", spacing: { before: 480 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "IQAC Coordinator", bold: true, size: 20 })],
            spacing: { after: 60 },
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: univName, color: "64748b", size: 18 })],
          }),
        ],
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=AQAR_${year}_${univName.replace(/\s+/g, '_')}.docx`);
    res.send(buffer);
  } catch (e) {
    logger.error(`AQAR Word generation failed: ${e}`);
    res.status(500).json({ error: 'Failed to generate AQAR document', details: String(e) });
  }
});
