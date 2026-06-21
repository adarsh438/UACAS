// src/server/routes/nirf.ts — NIRF Ranking Module API Routes
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { logger } from '../logger';
import { computeNirfScores, NirfInputData } from '../services/nirfScoringEngine';
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  HeadingLevel, WidthType, AlignmentType, TextRun,
  Header, Footer, PageNumber, TabStopPosition, TabStopType
} from 'docx';

export const nirfRouter = Router();
const prisma = new PrismaClient();

async function getUniversityId() {
  const univ = await prisma.university.findFirst();
  return univ?.id || 'univ-demo-001';
}

function buildDocxTable(headers: string[], rows: string[][], colWidths: number[]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map((h, i) => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })] })],
          shading: { fill: "1E293B" },
          width: { size: colWidths[i], type: WidthType.PERCENTAGE },
        }))
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, ci) => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: cell, size: 18 })] })],
          shading: ri % 2 === 1 ? { fill: "F8FAFC" } : undefined,
          width: { size: colWidths[ci], type: WidthType.PERCENTAGE },
        }))
      }))
    ]
  });
}

// ─────────────────────────────────────────────
//  GET /nirf/dashboard — Multi-year trends + latest scores
// ─────────────────────────────────────────────
nirfRouter.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const universityId = await getUniversityId();
    const records = await prisma.nirfParameter.findMany({
      where: { universityId },
      orderBy: { year: 'desc' },
    });

    // Get available years from SSR data
    const ssrYears = await prisma.enrollmentRecord.findMany({
      where: { universityId },
      select: { academicYear: true },
      distinct: ['academicYear']
    });

    res.json({
      records,
      availableYears: ssrYears.map(s => s.academicYear),
    });
  } catch (e) {
    logger.error(`NIRF dashboard failed: ${e}`);
    res.status(500).json({ error: 'Failed to fetch NIRF dashboard' });
  }
});

// ─────────────────────────────────────────────
//  GET /nirf/data/:year — Auto-populated NIRF data from SSR
// ─────────────────────────────────────────────
nirfRouter.get('/data/:year', requireAuth, async (req, res) => {
  try {
    const { year } = req.params;
    const universityId = await getUniversityId();
    const university = await prisma.university.findFirst({ where: { id: universityId } });

    // Existing NIRF record
    const nirfRecord = await prisma.nirfParameter.findUnique({
      where: { year_universityId: { year, universityId } }
    });
    const perception = await prisma.nirfPerception.findUnique({
      where: { year_universityId: { year, universityId } }
    });

    // Auto-populate from SSR data
    const enrollment = await prisma.enrollmentRecord.findMany({ where: { universityId, academicYear: year } });
    const totalStudents = enrollment.reduce((s, e) => s + e.enrolled, 0);
    const totalSanctioned = enrollment.reduce((s, e) => s + e.sanctionedIntake, 0);
    const femaleStudents = enrollment.reduce((s, e) => s + ((e as any).enrolledFemale || 0), 0);
    const reservedStudents = enrollment.reduce((s, e) => s + e.enrolledSC + e.enrolledST + e.enrolledOBC + e.enrolledEWS, 0);

    const facultyList = await prisma.faculty.findMany({ where: { department: { universityId } } });
    const totalFaculty = facultyList.length;
    const phdFaculty = facultyList.filter(f => f.hasPhD).length;
    const avgExperience = totalFaculty > 0
      ? facultyList.reduce((s, f) => s + (f.experienceYears || 0), 0) / totalFaculty
      : 0;

    const publications = await prisma.publication.findMany({ where: { universityId } });
    const pubsForYear = publications.filter(p => String(p.year) === year.split('-')[0] || String(p.year) === year.split('-')[1]);
    const scopusPubs = pubsForYear.filter(p => p.indexedIn === 'SCOPUS' || p.indexedIn === 'WOS');

    const patents = await prisma.patent.findMany({ where: { universityId } });
    const grants = await prisma.researchGrant.findMany({ where: { universityId, academicYear: year } });

    const placements = await prisma.placementRecord.findMany({ where: { universityId, academicYear: year } });
    const placedStudents = placements.reduce((s, p) => s + p.studentsPlaced, 0);
    const avgPackage = placements.length > 0
      ? placements.reduce((s, p) => s + (p.packageLPA || 0), 0) / placements.length
      : 0;

    const financial = await prisma.financialRecord.findFirst({ where: { universityId, academicYear: year } });
    const facility = await prisma.physicalFacility.findFirst({ where: { universityId, academicYear: year } });

    const lo = await prisma.learningOutcomeRecord.findMany({ where: { universityId, academicYear: year } });
    const higherStudiesPercent = lo.length > 0
      ? lo.reduce((s, l) => s + (l.higherStudiesPercentage || 0), 0) / lo.length
      : 0;

    const autoPopulated = {
      tlr: {
        totalStudents,
        totalFaculty,
        sanctionedPosts: totalSanctioned,
        phdFaculty,
        avgExperienceYears: Math.round(avgExperience * 10) / 10,
        totalExpenditure: financial?.totalExpenditureINR || 0,
        capitalExpenditure: financial?.academicExpenditureINR || 0,
        femaleStudents,
        economicallyBackwardStudents: reservedStudents,
      },
      rp: {
        publicationsCount: pubsForYear.length,
        citationsCount: pubsForYear.reduce((s, p) => s + ((p as any).citations || 0), 0),
        scopusPublications: scopusPubs.length,
        patentsPublished: patents.filter(p => p.status === 'FILED').length,
        patentsGranted: patents.filter(p => p.status === 'GRANTED').length,
        fundedProjects: grants.filter(g => g.status === 'ONGOING').length,
        fundingAmount: grants.reduce((s, g) => s + g.amount, 0),
        fpppAmount: 0, // Manual input
      },
      go: {
        graduatesLastYear: totalStudents,
        placedStudents,
        higherStudiesStudents: Math.round(totalStudents * higherStudiesPercent / 100),
        medianSalary: avgPackage,
        phdGraduates: 0, // Manual input
        totalStudentsGO: totalStudents,
      },
      oi: {
        femaleStudentsPercent: totalStudents > 0 ? Math.round(femaleStudents / totalStudents * 1000) / 10 : 0,
        economicallyBackwardPercent: totalStudents > 0 ? Math.round(reservedStudents / totalStudents * 1000) / 10 : 0,
        facilitiesForDifferentlyAbled: facility?.rampAvailability || false,
        femaleStudentsPhd: 0,
        totalPhDStudents: 0,
        regionalDiversityScore: 50,
      },
      pr: {
        peerScore: perception?.peerScore || 0,
        employerScore: perception?.employerScore || 0,
      }
    };

    res.json({
      nirfRecord,
      perception,
      autoPopulated,
      universityName: university?.name || '',
    });
  } catch (e) {
    logger.error(`NIRF data fetch failed: ${e}`);
    res.status(500).json({ error: 'Failed to fetch NIRF data' });
  }
});

// ─────────────────────────────────────────────
//  POST /nirf/scores/:year — Compute and save scores
// ─────────────────────────────────────────────
nirfRouter.post('/scores/:year', requireAuth, async (req, res) => {
  try {
    const { year } = req.params;
    const universityId = await getUniversityId();
    const inputData: NirfInputData = req.body;

    const result = computeNirfScores(inputData);

    // Save scores
    const nirfParam = await prisma.nirfParameter.upsert({
      where: { year_universityId: { year, universityId } },
      update: {
        tlrScore: result.tlr.score,
        rpScore: result.rp.score,
        goScore: result.go.score,
        oiScore: result.oi.score,
        prScore: result.pr.score,
        totalScore: result.totalScore,
        rank: req.body.rank || null,
      },
      create: {
        year, universityId,
        tlrScore: result.tlr.score,
        rpScore: result.rp.score,
        goScore: result.go.score,
        oiScore: result.oi.score,
        prScore: result.pr.score,
        totalScore: result.totalScore,
        rank: req.body.rank || null,
      }
    });

    // Save perception scores
    if (inputData.pr) {
      await prisma.nirfPerception.upsert({
        where: { year_universityId: { year, universityId } },
        update: {
          peerScore: inputData.pr.peerScore,
          employerScore: inputData.pr.employerScore,
        },
        create: {
          year, universityId,
          peerScore: inputData.pr.peerScore,
          employerScore: inputData.pr.employerScore,
        }
      });
    }

    res.json({ scores: result, saved: nirfParam });
  } catch (e) {
    logger.error(`NIRF scoring failed: ${e}`);
    res.status(500).json({ error: 'Failed to compute NIRF scores' });
  }
});

// ─────────────────────────────────────────────
//  POST /nirf/reports/generate — Generate NIRF Word report
// ─────────────────────────────────────────────
nirfRouter.post('/reports/generate', requireAuth, async (req, res) => {
  try {
    const { year } = req.body;
    const universityId = await getUniversityId();
    const university = await prisma.university.findFirst({ where: { id: universityId } });
    const univName = university?.name || 'UACAS Institute';

    const nirfRecord = await prisma.nirfParameter.findUnique({
      where: { year_universityId: { year, universityId } }
    });

    if (!nirfRecord) {
      return res.status(404).json({ error: 'NIRF scores not computed for this year yet' });
    }

    const doc = new Document({
      sections: [{
        properties: {},
        headers: {
          default: new Header({
            children: [new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                new TextRun({ text: univName, bold: true, color: "64748b", size: 16 }),
                new TextRun({ text: `\tNIRF Report ${year}`, bold: true, color: "64748b", size: 16 }),
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
              ],
            })],
          }),
        },
        children: [
          new Paragraph({
            text: univName.toUpperCase(),
            heading: HeadingLevel.HEADING_3,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          }),
          new Paragraph({
            text: "NATIONAL INSTITUTIONAL RANKING FRAMEWORK (NIRF)",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 60 },
          }),
          new Paragraph({
            text: `Score Report — Academic Year ${year}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
          }),

          // Overall Score
          new Paragraph({
            text: "Overall NIRF Score",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          }),
          buildDocxTable(
            ["Total Score", "TLR (30%)", "RP (30%)", "GO (20%)", "OI (10%)", "PR (10%)"],
            [[
              `${nirfRecord.totalScore.toFixed(2)} / 100`,
              nirfRecord.tlrScore.toFixed(2),
              nirfRecord.rpScore.toFixed(2),
              nirfRecord.goScore.toFixed(2),
              nirfRecord.oiScore.toFixed(2),
              nirfRecord.prScore.toFixed(2),
            ]],
            [20, 16, 16, 16, 16, 16]
          ),

          new Paragraph({ text: "", spacing: { after: 240 } }),

          // Parameter Breakdown
          new Paragraph({
            text: "Parameter-wise Score Breakdown",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          }),
          buildDocxTable(
            ["Parameter", "Weightage", "Score", "Weighted Score", "Performance"],
            [
              ["Teaching, Learning & Resources (TLR)", "30%", nirfRecord.tlrScore.toFixed(2), (nirfRecord.tlrScore * 0.3).toFixed(2), nirfRecord.tlrScore > 70 ? "Strong" : nirfRecord.tlrScore > 40 ? "Moderate" : "Needs Improvement"],
              ["Research & Professional Practice (RP)", "30%", nirfRecord.rpScore.toFixed(2), (nirfRecord.rpScore * 0.3).toFixed(2), nirfRecord.rpScore > 70 ? "Strong" : nirfRecord.rpScore > 40 ? "Moderate" : "Needs Improvement"],
              ["Graduation Outcomes (GO)", "20%", nirfRecord.goScore.toFixed(2), (nirfRecord.goScore * 0.2).toFixed(2), nirfRecord.goScore > 70 ? "Strong" : nirfRecord.goScore > 40 ? "Moderate" : "Needs Improvement"],
              ["Outreach & Inclusivity (OI)", "10%", nirfRecord.oiScore.toFixed(2), (nirfRecord.oiScore * 0.1).toFixed(2), nirfRecord.oiScore > 70 ? "Strong" : nirfRecord.oiScore > 40 ? "Moderate" : "Needs Improvement"],
              ["Perception (PR)", "10%", nirfRecord.prScore.toFixed(2), (nirfRecord.prScore * 0.1).toFixed(2), nirfRecord.prScore > 70 ? "Strong" : nirfRecord.prScore > 40 ? "Moderate" : "Needs Improvement"],
            ],
            [30, 12, 15, 18, 25]
          ),

          // Signature
          new Paragraph({ text: "", spacing: { before: 480 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "NIRF Coordinator", bold: true, size: 20 })],
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
    res.setHeader('Content-Disposition', `attachment; filename=NIRF_Report_${year}.docx`);
    res.send(buffer);
  } catch (e) {
    logger.error(`NIRF report generation failed: ${e}`);
    res.status(500).json({ error: 'Failed to generate NIRF report' });
  }
});
