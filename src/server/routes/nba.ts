// src/server/routes/nba.ts — NBA Module API Routes
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { logger } from '../logger';
import { computeAllAttainments, CoAttainmentInput, CoPoMappingInput } from '../services/nbaAttainmentEngine';
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  HeadingLevel, WidthType, AlignmentType, TextRun,
  Header, Footer, PageNumber, TabStopPosition, TabStopType
} from 'docx';

export const nbaRouter = Router();
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
//  GET /nba/programs — List NBA programs
// ─────────────────────────────────────────────
nbaRouter.get('/programs', requireAuth, async (req, res) => {
  try {
    const universityId = await getUniversityId();
    const programs = await prisma.nbaProgram.findMany({
      where: { universityId },
      include: {
        _count: { select: { courseOutcomes: true, programOutcomes: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also get institution programs for linking
    const instPrograms = await prisma.program.findMany({
      where: { department: { universityId } },
      include: { department: true },
    });

    res.json({ nbaPrograms: programs, institutionPrograms: instPrograms });
  } catch (e) {
    logger.error(`NBA programs fetch failed: ${e}`);
    res.status(500).json({ error: 'Failed to fetch NBA programs' });
  }
});

// ─────────────────────────────────────────────
//  POST /nba/programs — Create NBA program
// ─────────────────────────────────────────────
nbaRouter.post('/programs', requireAuth, requireRole('IQAC_COORDINATOR'), async (req, res) => {
  try {
    const universityId = await getUniversityId();
    const { programId, accreditationYear, tier, peos } = req.body;

    const program = await prisma.nbaProgram.create({
      data: {
        programId,
        accreditationYear,
        tier: tier || 1,
        peos: peos ? JSON.stringify(peos) : null,
        universityId,
      }
    });

    // Auto-create 12 standard POs
    const standardPOs = [
      'Engineering Knowledge', 'Problem Analysis', 'Design/Development of Solutions',
      'Conduct Investigations', 'Modern Tool Usage', 'Engineer and Society',
      'Environment and Sustainability', 'Ethics', 'Individual and Team Work',
      'Communication', 'Project Management and Finance', 'Life-long Learning'
    ];

    for (let i = 0; i < standardPOs.length; i++) {
      await prisma.nbaProgramOutcome.create({
        data: {
          poNumber: i + 1,
          description: standardPOs[i],
          nbaProgramId: program.id,
        }
      });
    }

    res.status(201).json(program);
  } catch (e) {
    logger.error(`NBA program creation failed: ${e}`);
    res.status(500).json({ error: 'Failed to create NBA program' });
  }
});

// ─────────────────────────────────────────────
//  GET /nba/dashboard/:programId — Program dashboard data
// ─────────────────────────────────────────────
nbaRouter.get('/dashboard/:programId', requireAuth, async (req, res) => {
  try {
    const { programId } = req.params;
    const program = await prisma.nbaProgram.findUnique({
      where: { id: programId },
      include: {
        courseOutcomes: {
          include: {
            coPoMappings: true,
            attainments: true,
          }
        },
        programOutcomes: {
          include: {
            coPoMappings: true,
            attainments: true,
          },
          orderBy: { poNumber: 'asc' },
        },
      }
    });

    if (!program) {
      return res.status(404).json({ error: 'NBA program not found' });
    }

    res.json(program);
  } catch (e) {
    logger.error(`NBA dashboard failed: ${e}`);
    res.status(500).json({ error: 'Failed to fetch NBA dashboard' });
  }
});

// ─────────────────────────────────────────────
//  POST /nba/course-outcomes/:programId — Add course outcome
// ─────────────────────────────────────────────
nbaRouter.post('/course-outcomes/:programId', requireAuth, async (req, res) => {
  try {
    const { programId } = req.params;
    const { courseId, code, description, bloomsLevel } = req.body;

    const co = await prisma.nbaCourseOutcome.create({
      data: {
        courseId,
        code,
        description,
        bloomsLevel: bloomsLevel || null,
        nbaProgramId: programId,
      }
    });

    res.status(201).json(co);
  } catch (e) {
    logger.error(`CO creation failed: ${e}`);
    res.status(500).json({ error: 'Failed to create course outcome' });
  }
});

// ─────────────────────────────────────────────
//  POST /nba/co-po-mapping/:programId — Save CO-PO mapping
// ─────────────────────────────────────────────
nbaRouter.post('/co-po-mapping/:programId', requireAuth, async (req, res) => {
  try {
    const { mappings } = req.body; // [{coId, poId, correlationLevel}]

    // Delete existing mappings for this program's COs
    const program = await prisma.nbaProgram.findUnique({
      where: { id: req.params.programId },
      include: { courseOutcomes: true }
    });
    if (!program) return res.status(404).json({ error: 'Program not found' });

    const coIds = program.courseOutcomes.map(co => co.id);
    await prisma.nbaCoPoMapping.deleteMany({ where: { coId: { in: coIds } } });

    // Create new mappings
    const created = [];
    for (const m of mappings) {
      if (m.correlationLevel > 0) {
        const mapping = await prisma.nbaCoPoMapping.create({
          data: {
            coId: m.coId,
            poId: m.poId,
            correlationLevel: m.correlationLevel,
          }
        });
        created.push(mapping);
      }
    }

    res.json({ saved: created.length });
  } catch (e) {
    logger.error(`CO-PO mapping save failed: ${e}`);
    res.status(500).json({ error: 'Failed to save CO-PO mapping' });
  }
});

// ─────────────────────────────────────────────
//  POST /nba/attainment/calculate/:programId/:year — Compute attainments
// ─────────────────────────────────────────────
nbaRouter.post('/attainment/calculate/:programId/:year', requireAuth, async (req, res) => {
  try {
    const { programId, year } = req.params;
    const { coScores } = req.body; // [{coId, directScore, indirectScore}]

    const program = await prisma.nbaProgram.findUnique({
      where: { id: programId },
      include: {
        courseOutcomes: { include: { coPoMappings: true } },
        programOutcomes: { orderBy: { poNumber: 'asc' } },
      }
    });

    if (!program) return res.status(404).json({ error: 'Program not found' });

    const coInputs: CoAttainmentInput[] = coScores || program.courseOutcomes.map(co => ({
      coId: co.id,
      directScore: 2.0,
      indirectScore: 2.0,
    }));

    const allMappings: CoPoMappingInput[] = program.courseOutcomes.flatMap(co =>
      co.coPoMappings.map(m => ({
        coId: m.coId,
        poId: m.poId,
        correlationLevel: m.correlationLevel,
      }))
    );

    const poDefinitions = program.programOutcomes.map(po => ({
      poId: po.id,
      poNumber: po.poNumber,
      target: 2.0,
    }));

    const result = computeAllAttainments(coInputs, allMappings, poDefinitions);

    // Save CO attainments
    for (const coAtt of result.coAttainments) {
      await prisma.nbaCoAttainment.upsert({
        where: { id: `${coAtt.coId}-${year}` },
        update: {
          directScore: coAtt.directScore,
          indirectScore: coAtt.indirectScore,
          finalAttainment: coAtt.finalAttainment,
        },
        create: {
          coId: coAtt.coId,
          year,
          directScore: coAtt.directScore,
          indirectScore: coAtt.indirectScore,
          finalAttainment: coAtt.finalAttainment,
        }
      });
    }

    // Save PO attainments
    for (const poAtt of result.poAttainments) {
      await prisma.nbaPoAttainment.upsert({
        where: { id: `${poAtt.poId}-${year}` },
        update: { attainmentLevel: poAtt.attainmentLevel, target: poAtt.target },
        create: {
          poId: poAtt.poId,
          year,
          attainmentLevel: poAtt.attainmentLevel,
          target: poAtt.target,
        }
      });
    }

    res.json(result);
  } catch (e) {
    logger.error(`NBA attainment calculation failed: ${e}`);
    res.status(500).json({ error: 'Failed to compute attainments' });
  }
});

// ─────────────────────────────────────────────
//  POST /nba/reports/generate/:programId — Generate SAR Word doc
// ─────────────────────────────────────────────
nbaRouter.post('/reports/generate/:programId', requireAuth, async (req, res) => {
  try {
    const { programId } = req.params;
    const universityId = await getUniversityId();
    const university = await prisma.university.findFirst({ where: { id: universityId } });
    const univName = university?.name || 'UACAS Institute';

    const program = await prisma.nbaProgram.findUnique({
      where: { id: programId },
      include: {
        courseOutcomes: {
          include: { coPoMappings: true, attainments: true }
        },
        programOutcomes: {
          include: { coPoMappings: true, attainments: true },
          orderBy: { poNumber: 'asc' },
        },
      }
    });

    if (!program) return res.status(404).json({ error: 'Program not found' });

    const instProgram = await prisma.program.findUnique({
      where: { id: program.programId },
      include: { department: true },
    });

    const doc = new Document({
      sections: [{
        properties: {},
        headers: {
          default: new Header({
            children: [new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                new TextRun({ text: univName, bold: true, color: "64748b", size: 16 }),
                new TextRun({ text: `\tNBA SAR`, bold: true, color: "64748b", size: 16 }),
              ],
            })],
          }),
        },
        children: [
          new Paragraph({
            text: "SELF ASSESSMENT REPORT (SAR)",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
          new Paragraph({
            text: `Program: ${instProgram?.name || 'Program'}`,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
          new Paragraph({
            text: `Accreditation Year: ${program.accreditationYear} | Tier: ${program.tier}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
          }),

          // POs
          new Paragraph({ text: "Program Outcomes (POs)", heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }),
          buildDocxTable(
            ["PO", "Description"],
            program.programOutcomes.map(po => [`PO${po.poNumber}`, po.description]),
            [15, 85]
          ),

          // COs
          new Paragraph({ text: "Course Outcomes (COs)", heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }),
          buildDocxTable(
            ["Code", "Description", "Bloom's Level"],
            program.courseOutcomes.map(co => [co.code, co.description, co.bloomsLevel || 'N/A']),
            [15, 60, 25]
          ),

          // CO-PO Mapping Matrix
          new Paragraph({ text: "CO-PO Mapping Matrix", heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }),
          new Paragraph({
            text: "Correlation Levels: 1 = Low, 2 = Medium, 3 = High",
            spacing: { after: 120 },
            children: [new TextRun({ text: "Correlation Levels: 1 = Low, 2 = Medium, 3 = High", italics: true, color: "64748b", size: 18 })]
          }),
          buildDocxTable(
            ["CO / PO", ...program.programOutcomes.map(po => `PO${po.poNumber}`)],
            program.courseOutcomes.map(co => {
              const row = [co.code];
              for (const po of program.programOutcomes) {
                const mapping = co.coPoMappings.find(m => m.poId === po.id);
                row.push(mapping ? String(mapping.correlationLevel) : '-');
              }
              return row;
            }),
            [10, ...program.programOutcomes.map(() => Math.floor(90 / program.programOutcomes.length))]
          ),

          // PO Attainment
          ...(program.programOutcomes[0]?.attainments?.length > 0 ? [
            new Paragraph({ text: "PO Attainment Summary", heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }),
            buildDocxTable(
              ["PO", "Attainment Level", "Target", "Status"],
              program.programOutcomes.map(po => {
                const att = po.attainments[0];
                return [
                  `PO${po.poNumber}`,
                  att ? att.attainmentLevel.toFixed(2) : 'N/A',
                  att ? att.target.toFixed(2) : '2.00',
                  att && att.attainmentLevel >= att.target ? '✓ Above Target' : '✗ Below Target',
                ];
              }),
              [15, 25, 25, 35]
            ),
          ] : []),
        ],
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=NBA_SAR_${instProgram?.name || 'Program'}.docx`);
    res.send(buffer);
  } catch (e) {
    logger.error(`NBA SAR generation failed: ${e}`);
    res.status(500).json({ error: 'Failed to generate SAR document' });
  }
});
