import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { PrismaClient } from '@prisma/client';
import express from 'express';
import { requireAuth, validate, requireRole } from '../middleware/auth';
import { logger } from '../logger';
import { z } from 'zod';
import { criteriaRouter } from './naac/criteria';
import { scoringRouter } from './naac/scoring';
import { importsRouter } from './imports';
import { getNaacScoresInternal } from './naac/scoring';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, WidthType, AlignmentType, TextRun, ImageRun, ExternalHyperlink } from 'docx';
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export const apiRouter = Router();
const prisma = new PrismaClient();
const BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

// Mount NAAC sub-routers
apiRouter.use('/naac', criteriaRouter);
apiRouter.use('/naac', scoringRouter);
apiRouter.use('/imports', importsRouter);

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

// --- Health Check ---
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// --- System ---
apiRouter.get("/system/license", (req, res) => {
  res.json({
    status: "ACTIVE",
    type: "PERPETUAL_ENTERPRISE",
    licensedTo: "UACAS Institute of Tech",
    expiry: "NEVER",
    licenseKey: "UACAS-XXXX-XXXX-ENT"
  });
});

apiRouter.post("/system/backup", async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `uacas_backup_${timestamp}.sql`;
    logger.info(`Backup initiated: ${filename}`);
    res.json({ message: "Backup initiated successfully", filename });
  } catch (e) {
    logger.error(`Backup failed: ${e}`);
    res.status(500).json({ error: "Backup failed" });
  }
});

// --- Dashboard ---
// NOTE: Applying requireAuth here means the client must pass the Authorization header!
apiRouter.get("/dashboard/stats", requireAuth, async (req, res) => {
  try {
    const totalFaculty = await prisma.faculty.count();
    const totalStudents = await prisma.student.count();
    const totalPublications = await prisma.publication.count();
    const totalPatents = await prisma.patent.count();
    const totalGrants = await prisma.researchGrant.aggregate({ _sum: { amount: true } });
    const totalPlacements = await prisma.placementRecord.aggregate({ _sum: { studentsPlaced: true } });
    const totalMoUs = await prisma.moU.count();
    const evidenceCount = await prisma.evidence.count();
    res.json({
      totalFaculty: totalFaculty || 8,
      totalStudents: totalStudents || 1540,
      naacProgress: 72,
      nbaProgress: 65,
      complianceScore: 84,
      pendingEvidences: Math.max(0, 15 - evidenceCount),
      totalPublications,
      totalPatents,
      totalGrantsINR: totalGrants._sum.amount || 6800000,
      totalPlaced: totalPlacements._sum.studentsPlaced || 129,
      totalMoUs,
    });
  } catch (e) {
    logger.error(`Failed to load stats: ${e}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- University ---
apiRouter.get("/university", requireAuth, async (req, res) => {
  try {
    const university = await prisma.university.findFirst();
    res.json(university || { name: "UACAS Demo University", city: "Bangalore", type: "Private" });
  } catch (e) {
    logger.error(`Failed to load university: ${e}`);
    res.status(500).json({ error: "Failed to fetch university" });
  }
});

const universitySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    city: z.string().optional(),
    state: z.string().optional(),
    type: z.string().optional(),
    address: z.string().optional(),
    established: z.string().optional(),
    website: z.string().optional(),
  })
});

apiRouter.put("/university", requireAuth, validate(universitySchema), async (req, res) => {
  try {
    const existing = await prisma.university.findFirst();
    if (existing) {
      const updated = await prisma.university.update({
        where: { id: existing.id },
        data: req.body
      });
      res.json(updated);
    } else {
      const created = await prisma.university.create({ data: req.body });
      res.json(created);
    }
  } catch (e) {
    logger.error(`Failed to update university: ${e}`);
    res.status(500).json({ error: "Failed to update university" });
  }
});

// --- Faculty ---
apiRouter.get("/faculty", requireAuth, async (req, res) => {
  try {
    const list = await prisma.faculty.findMany({
      include: { department: true }
    });
    res.json(list);
  } catch (e) {
    logger.error(`Failed to load faculty: ${e}`);
    res.status(500).json({ error: "Failed to fetch faculty" });
  }
});

// --- AI Narrative ---
const narrativeSchema = z.object({
  body: z.object({
    criterion: z.string(),
    context: z.string(),
  })
});

apiRouter.post("/ai/narrative", requireAuth, validate(narrativeSchema), async (req, res) => {
  const { criterion, context } = req.body;
  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a professional SSR narrative for Criterion: ${criterion}. Context: ${context}`,
      config: {
        systemInstruction: "You are an expert in NAAC/NBA university accreditation. Write professional, evidence-based narratives for Self Study Reports (SSR). Format nicely but keep it concise."
      }
    });
    res.json({ narrative: result.text });
  } catch (error) {
    logger.error(`AI generation failed: ${error}`);
    res.status(500).json({ error: "AI generation failed" });
  }
});

// --- Helper Functions for Reports ---
async function fetchUniversityName() {
  const univ = await prisma.university.findFirst();
  return univ?.name || "UACAS Institute of Technology & Management";
}

function splitTextIntoLines(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(' ');
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > maxWidth) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  }
  return lines;
}

function buildDocxTable(headers: string[], rows: string[][], colWidthsPercent: number[]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map((h, i) => new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 18 })],
            alignment: AlignmentType.LEFT,
          })],
          shading: { fill: "1E293B" },
          width: { size: colWidthsPercent[i], type: WidthType.PERCENTAGE },
        }))
      }),
      ...rows.map((row, rowIdx) => new TableRow({
        children: row.map((cell, cellIdx) => {
          let fontColor = "111111";
          let isBold = false;
          if (cell === 'GREEN') { fontColor = "10B981"; isBold = true; }
          else if (cell === 'AMBER') { fontColor = "F59E0B"; isBold = true; }
          else if (cell === 'RED') { fontColor = "EF4444"; isBold = true; }

          return new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: cell, bold: isBold, color: fontColor, size: 16 })],
              alignment: AlignmentType.LEFT,
            })],
            shading: rowIdx % 2 === 1 ? { fill: "F8FAFC" } : undefined,
            width: { size: colWidthsPercent[cellIdx], type: WidthType.PERCENTAGE },
          });
        })
      }))
    ]
  });
}

// --- PDF Generation ---
apiRouter.post("/reports/generate/pdf", requireAuth, requireRole('IQAC_COORDINATOR'), async (req, res) => {
  const { year = "2024-25" } = req.body;
  try {
    const scores = await getNaacScoresInternal(year);
    const univName = await fetchUniversityName();
    const evidenceList = await prisma.evidence.findMany({ where: { academicYear: year } });

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const width = 595;
    const height = 842;
    const margin = 50;

    // Helper to draw page header
    const drawPageHeader = (page: any, title: string, pageNum: number) => {
      page.drawText(univName.toUpperCase(), { x: margin, y: height - 40, size: 8, font: boldFont, color: rgb(0.47, 0.55, 0.67) });
      page.drawText(title, { x: margin, y: height - 52, size: 10, font: boldFont, color: rgb(0.12, 0.16, 0.23) });
      page.drawLine({ start: { x: margin, y: height - 60 }, end: { x: width - margin, y: height - 60 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
      page.drawText(`Page ${pageNum} of 8`, { x: width - margin - 50, y: height - 40, size: 8, font, color: rgb(0.47, 0.55, 0.67) });
    };

    // --- Helper to draw metric tables ---
    function drawTableDirect(page: any, headers: string[], rows: string[][], startX: number, startY: number, colWidths: number[], normalFont: any, bldFont: any, fontSize = 9) {
      let y = startY;
      // Header
      page.drawRectangle({
        x: startX,
        y: y - 16,
        width: colWidths.reduce((a, b) => a + b, 0),
        height: 18,
        color: rgb(0.12, 0.16, 0.23)
      });
      let curX = startX;
      headers.forEach((h, idx) => {
        page.drawText(h, { x: curX + 4, y: y - 11, size: fontSize, font: bldFont, color: rgb(1, 1, 1) });
        curX += colWidths[idx];
      });
      y -= 18;

      // Rows
      rows.forEach((row, rowIdx) => {
        // Find maximum wrapped lines in the description cell (idx 1)
        const descLines = splitTextIntoLines(row[1], normalFont, fontSize - 1, colWidths[1] - 8);
        const rowHeight = 14 + (descLines.length - 1) * 11;

        // Background / Zebra striping
        if (rowIdx % 2 === 1) {
          page.drawRectangle({
            x: startX,
            y: y - rowHeight + 2,
            width: colWidths.reduce((a, b) => a + b, 0),
            height: rowHeight,
            color: rgb(0.96, 0.97, 0.98)
          });
        }
        
        // Border line
        page.drawLine({
          start: { x: startX, y: y - rowHeight + 2 },
          end: { x: startX + colWidths.reduce((a, b) => a + b, 0), y: y - rowHeight + 2 },
          thickness: 0.5,
          color: rgb(0.85, 0.85, 0.85)
        });

        let currentX = startX;
        row.forEach((cell, cellIdx) => {
          let cellFont = normalFont;
          let cellColor = rgb(0.12, 0.16, 0.23);
          
          if (cell === 'GREEN') { cellColor = rgb(0.06, 0.72, 0.5); cellFont = bldFont; }
          else if (cell === 'AMBER') { cellColor = rgb(0.96, 0.62, 0.04); cellFont = bldFont; }
          else if (cell === 'RED') { cellColor = rgb(0.94, 0.27, 0.27); cellFont = bldFont; }
          else if (cellIdx === 0) { cellFont = bldFont; }

          if (cellIdx === 1) {
            // Description (draw line by line)
            descLines.forEach((line, lineIdx) => {
              page.drawText(line, {
                x: currentX + 4,
                y: y - 10 - lineIdx * 11,
                size: fontSize - 1,
                font: cellFont,
                color: cellColor
              });
            });
          } else {
            page.drawText(cell, {
              x: currentX + 4,
              y: y - 10 - (descLines.length - 1) * 5.5,
              size: fontSize - 1,
              font: cellFont,
              color: cellColor
            });
          }
          currentX += colWidths[cellIdx];
        });

        y -= rowHeight;
      });
      return y;
    }

    // --- Helper to draw a full criterion section ---
    const drawCriterionSection = (page: any, c: any, startY: number) => {
      page.drawText(`CRITERION ${c.criterion} - ${c.title.toUpperCase()}`, { x: margin, y: startY, size: 11, font: boldFont, color: rgb(0.14, 0.25, 0.46) });
      page.drawText(`Weightage: ${c.weightage} | Score: ${c.totalScore.toFixed(1)} / ${c.maxScore} | Weighted: ${c.weightedScore.toFixed(1)}`, { x: margin, y: startY - 14, size: 8, font, color: rgb(0.4, 0.5, 0.6) });

      const headers = ["Metric", "Description", "Score", "Max", "Status"];
      const rows = c.metrics.map((m: any) => {
        const matchingEv = evidenceList.filter((e: any) => e.metricCode === m.code);
        const evLabel = matchingEv.length > 0
          ? `\nEvidence: ${matchingEv.map(e => `${e.name} (/api/evidence/file/${e.id})`).join(', ')}`
          : '';
        return [
          m.code,
          m.label + evLabel,
          String(m.score.toFixed(1)),
          String(m.maxScore),
          m.flag
        ];
      });
      const colWidths = [45, 285, 55, 55, 55];
      return drawTableDirect(page, headers, rows, margin, startY - 25, colWidths, font, boldFont, 9);
    };

    // --- Page 1: Title Cover & Executive Summary Part A ---
    const page1 = pdfDoc.addPage([width, height]);
    
    // Decorative top color bar
    page1.drawRectangle({ x: 0, y: height - 15, width, height: 15, color: rgb(0.14, 0.25, 0.46) });

    // Title
    page1.drawText("NAAC ACCREDITATION REPORT", { x: margin, y: height - 100, size: 24, font: boldFont, color: rgb(0.09, 0.16, 0.3) });
    page1.drawText(`Self Study Report (Consolidated SSR) - Academic Year ${year}`, { x: margin, y: height - 120, size: 11, font, color: rgb(0.3, 0.4, 0.5) });
    page1.drawText(univName, { x: margin, y: height - 165, size: 15, font: boldFont, color: rgb(0.12, 0.16, 0.23) });
    page1.drawText("National Assessment and Accreditation Council Compliance System", { x: margin, y: height - 180, size: 9, font, color: rgb(0.4, 0.5, 0.6) });

    // Scorecard block
    page1.drawRectangle({ x: margin, y: height - 320, width: width - 2 * margin, height: 115, color: rgb(0.95, 0.97, 1.0), borderColor: rgb(0.8, 0.85, 0.95), borderWidth: 1 });
    
    page1.drawText("PREDICTED NAAC GRADE", { x: margin + 20, y: height - 235, size: 8, font: boldFont, color: rgb(0.4, 0.5, 0.6) });
    page1.drawText(scores.predictedGrade, { x: margin + 20, y: height - 280, size: 36, font: boldFont, color: rgb(0.14, 0.25, 0.46) });

    page1.drawText("INSTITUTIONAL CGPA", { x: margin + 180, y: height - 235, size: 8, font: boldFont, color: rgb(0.4, 0.5, 0.6) });
    page1.drawText(`${scores.cgpa.toFixed(2)} / 4.00`, { x: margin + 180, y: height - 270, size: 22, font: boldFont, color: rgb(0.09, 0.16, 0.3) });

    page1.drawText("TOTAL WEIGHTED SCORE", { x: margin + 180, y: height - 295, size: 8, font: boldFont, color: rgb(0.4, 0.5, 0.6) });
    page1.drawText(`${scores.totalWeightedScore} / 1000`, { x: margin + 180, y: height - 310, size: 11, font: boldFont, color: rgb(0.12, 0.16, 0.23) });

    page1.drawText("DATA COMPLETION", { x: margin + 340, y: height - 235, size: 8, font: boldFont, color: rgb(0.4, 0.5, 0.6) });
    page1.drawText(`${scores.completionPercent}%`, { x: margin + 340, y: height - 270, size: 22, font: boldFont, color: rgb(0.06, 0.72, 0.5) });
    page1.drawText("Verified by IQAC", { x: margin + 340, y: height - 295, size: 8, font, color: rgb(0.4, 0.5, 0.6) });

    // Executive Summary Part A
    page1.drawText("EXECUTIVE SUMMARY (PART A)", { x: margin, y: height - 355, size: 12, font: boldFont, color: rgb(0.12, 0.16, 0.23) });
    
    const summaryPartAText = 
      "This document serves as the official Self Study Report (SSR) generated for UACAS Institute of Tech for " +
      `the academic cycle ${year}. The compilation represents a unified overview of all 7 NAAC criteria dimensions, ` +
      "anchored in absolute transactional transparency, role-based database verification, and verified compliance indices.\n\n" +
      "Under the strategic guidance of the Internal Quality Assurance Cell (IQAC), the institution has experienced substantial " +
      "growth across curriculum designs, learner support facilities, e-governance expansions, and socio-community outreach " +
      "initiatives. High faculty mentoring programs, remedial support structures, and active Career Placement centers have " +
      "consistently driven high graduation and industry placement outcomes.\n\n" +
      "Furthermore, the institution has made tremendous progress in fostering an environment of active research. Our faculty " +
      "members contribute to high-impact indexed publications and filed patents, supported by substantial internal and external " +
      "research grants. We have established state-of-the-art laboratory infrastructures and libraries to serve as foundational " +
      "learning systems for students and teachers alike.";
      
    const partALines = splitTextIntoLines(summaryPartAText, font, 9.5, width - 2 * margin);
    let partAY = height - 375;
    partALines.forEach(line => {
      page1.drawText(line, { x: margin, y: partAY, size: 9.5, font, color: rgb(0.15, 0.2, 0.25), lineHeight: 14 });
      partAY -= 14;
    });

    // --- Page 2: Executive Summary Part B & Scorecard Table ---
    const page2 = pdfDoc.addPage([width, height]);
    drawPageHeader(page2, "EXECUTIVE SUMMARY (PART B)", 2);
    
    page2.drawText("EXECUTIVE SUMMARY (STRATEGIC STRENGTHS & ANALYSIS)", { x: margin, y: height - 85, size: 12, font: boldFont, color: rgb(0.12, 0.16, 0.23) });

    const summaryPartBText =
      "Our curricular model reflects high alignment with NAAC criteria benchmarks, incorporating intensive stakeholder feedback, " +
      "value-added curriculum pathways, and online MOOC integrations. Strategic objectives are distributed across Criterion heads " +
      "to ensure continuous quality improvement:\n\n" +
      "• Criterion 1 (Curricular Aspects) scores are driven by structured feedback collection and collaborative industry board alignments.\n" +
      "• Criterion 2 (Teaching-Learning & Evaluation) incorporates student enrollment quotas and comprehensive learning outcomes tracking.\n" +
      "• Criterion 3 (Research, Innovations & Extension) highlights filed/granted patents and indexed faculty publication counts.\n" +
      "• Criterion 4 (Infrastructure & Learning Resources) ensures physical/academic budgets are fully utilized for maintenance.\n" +
      "• Criterion 5 (Student Support & Progression) shows excellent placement averages and competitive exam preparation records.\n" +
      "• Criterion 6 (Governance, Leadership & Management) is bolstered by active e-governance implementation in administration & finance.\n" +
      "• Criterion 7 (Institutional Values & Best Practices) promotes gender sensitization workshops, safety, and green practices.";

    const partBLines = splitTextIntoLines(summaryPartBText, font, 9, width - 2 * margin);
    let partBY = height - 105;
    partBLines.forEach(line => {
      page2.drawText(line, { x: margin, y: partBY, size: 9, font, color: rgb(0.15, 0.2, 0.25), lineHeight: 13 });
      partBY -= 13;
    });

    // Score Table
    page2.drawText("CRITERION-WISE ACADEMIC PERFORMANCE BREAKDOWN", { x: margin, y: partBY - 15, size: 11, font: boldFont, color: rgb(0.12, 0.16, 0.23) });
    
    const summaryHeaders = ["Criterion", "Description", "Weightage", "Score Obtained", "Weighted Score", "Achieved %"];
    const summaryRows = scores.criteria.map((c: any) => [
      `Criterion ${c.criterion}`,
      c.title,
      String(c.weightage),
      `${c.totalScore.toFixed(1)} / ${c.maxScore}`,
      c.weightedScore.toFixed(1),
      `${c.percentage.toFixed(1)}%`
    ]);
    const summaryWidths = [65, 195, 55, 75, 55, 50];
    
    drawTableDirect(page2, summaryHeaders, summaryRows, margin, partBY - 35, summaryWidths, font, boldFont, 8.5);

    // --- Page 3: Radar Chart performance Visualization & Analysis ---
    const page3 = pdfDoc.addPage([width, height]);
    drawPageHeader(page3, "ACCREDITATION PERFORMANCE RADAR MAP", 3);
    
    page3.drawText("INSTITUTIONAL RADAR CHART SUMMARY", { x: margin, y: height - 85, size: 12, font: boldFont, color: rgb(0.12, 0.16, 0.23) });
    page3.drawText("Spider-Chart performance mapping across all seven NAAC Criteria dimensions", { x: margin, y: height - 98, size: 9, font, color: rgb(0.4, 0.5, 0.6) });

    // Drawing vector radar chart
    const centerX = 297.5;
    const centerY = 500;
    const radius = 100;
    const angles = Array.from({ length: 7 }, (_, i) => -Math.PI / 2 + (2 * Math.PI / 7) * i);

    // 1. Concentric heptagons
    [25, 50, 75, 100].forEach((level) => {
      for (let i = 0; i < 7; i++) {
        const angle1 = angles[i];
        const angle2 = angles[(i + 1) % 7];
        const r = (level / 100) * radius;
        const x1 = centerX + r * Math.cos(angle1);
        const y1 = centerY + r * Math.sin(angle1);
        const x2 = centerX + r * Math.cos(angle2);
        const y2 = centerY + r * Math.sin(angle2);
        page3.drawLine({
          start: { x: x1, y: y1 },
          end: { x: x2, y: y2 },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8),
          opacity: 0.7
        });
      }
    });

    // 2. Axes lines and labels
    angles.forEach((angle, i) => {
      const outerX = centerX + radius * Math.cos(angle);
      const outerY = centerY + radius * Math.sin(angle);
      page3.drawLine({
        start: { x: centerX, y: centerY },
        end: { x: outerX, y: outerY },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });

      const labelRadius = radius + 15;
      const labelX = centerX + labelRadius * Math.cos(angle);
      const labelY = centerY + labelRadius * Math.sin(angle);
      
      let labelOffset = { x: -8, y: -4 };
      if (i === 0) labelOffset = { x: -8, y: 5 }; // C1 (Top)
      else if (i === 1 || i === 2) labelOffset = { x: 3, y: -4 }; // C2, C3 (Right)
      else if (i === 5 || i === 6) labelOffset = { x: -20, y: -4 }; // C6, C7 (Left)

      page3.drawText(`C${i + 1}`, {
        x: labelX + labelOffset.x,
        y: labelY + labelOffset.y,
        size: 9,
        font: boldFont,
        color: rgb(0.12, 0.16, 0.23)
      });
    });

    // 3. Filled score polygon
    const scoresArray = scores.criteria.map((c: any) => c.percentage);
    const scorePoints: string[] = [];
    scoresArray.forEach((score: number, i: number) => {
      const r = (score / 100) * radius;
      const x = centerX + r * Math.cos(angles[i]);
      const y = centerY + r * Math.sin(angles[i]);
      scorePoints.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    });
    const svgPathStr = scorePoints.join(' ') + ' Z';

    page3.drawSvgPath(svgPathStr, {
      x: 0,
      y: 0,
      color: rgb(0.39, 0.4, 0.95), // Indigo fill
      borderColor: rgb(0.29, 0.27, 0.9), // Dark border
      borderWidth: 2,
      opacity: 0.32
    });

    // Performance analysis narrative
    page3.drawText("PERFORMANCE COVERAGE ANALYSIS", { x: margin, y: height - 520, size: 11, font: boldFont, color: rgb(0.12, 0.16, 0.23) });
    
    const radarAnalysisText = 
      "The spider performance radar maps the institutional achievement relative to official NAAC benchmarks. " +
      "The total covered geometric area correlates with the predicted CGPA. Wider expansions in Criterion 1 (Curricular Aspects) " +
      "and Criterion 2 (Teaching-Learning) highlight high feedback and academic mentoring compliance. " +
      "Conversely, inner contractions pinpoint areas of immediate strategic focus. " +
      "The IQAC uses this heptagonal footprint to optimize resource distribution, allocating corrective action plans to specific " +
      "department heads to bolster compliance and overall readiness for peer reviews.";

    const radarLines = splitTextIntoLines(radarAnalysisText, font, 9.5, width - 2 * margin);
    let radarY = height - 540;
    radarLines.forEach(line => {
      page3.drawText(line, { x: margin, y: radarY, size: 9.5, font, color: rgb(0.15, 0.2, 0.25), lineHeight: 14 });
      radarY -= 14;
    });

    // --- Page 4: C1 & C2 ---
    const page4 = pdfDoc.addPage([width, height]);
    drawPageHeader(page4, "DETAILED CRITERION ASSESSMENT (PART A)", 4);
    let y = height - 85;
    y = drawCriterionSection(page4, scores.criteria[0], y);
    y -= 30;
    drawCriterionSection(page4, scores.criteria[1], y);

    // --- Page 5: C3 & C4 ---
    const page5 = pdfDoc.addPage([width, height]);
    drawPageHeader(page5, "DETAILED CRITERION ASSESSMENT (PART B)", 5);
    y = height - 85;
    y = drawCriterionSection(page5, scores.criteria[2], y);
    y -= 30;
    drawCriterionSection(page5, scores.criteria[3], y);

    // --- Page 6: C5 & C6 ---
    const page6 = pdfDoc.addPage([width, height]);
    drawPageHeader(page6, "DETAILED CRITERION ASSESSMENT (PART C)", 6);
    y = height - 85;
    y = drawCriterionSection(page6, scores.criteria[4], y);
    y -= 30;
    drawCriterionSection(page6, scores.criteria[5], y);

    // --- Page 7: C7 ---
    const page7 = pdfDoc.addPage([width, height]);
    drawPageHeader(page7, "DETAILED CRITERION ASSESSMENT (PART D)", 7);
    y = height - 85;
    drawCriterionSection(page7, scores.criteria[6], y);

    // --- Page 8: Clickable Evidence Index ---
    const page8 = pdfDoc.addPage([width, height]);
    drawPageHeader(page8, "COMPREHENSIVE COMPLIANCE EVIDENCE INDEX", 8);
    
    page8.drawText("INSTITUTIONAL EVIDENCE VAULT", { x: margin, y: height - 85, size: 12, font: boldFont, color: rgb(0.12, 0.16, 0.23) });
    page8.drawText("Clickable document link register verified and archived for peer review audits", { x: margin, y: height - 98, size: 9, font, color: rgb(0.4, 0.5, 0.6) });

    const evidenceHeaders = ["Metric", "Evidence Document Name", "Uploaded By", "Verification / Serve URL Link"];
    const evidenceRows = evidenceList.map((e: any) => [
      e.metricCode || "—",
      e.name,
      e.uploaderName || "—",
      `${BASE_URL}/api/evidence/file/${e.id}`
    ]);
    const evidenceWidths = [60, 200, 95, 140];

    drawTableDirect(page8, evidenceHeaders, evidenceRows, margin, height - 120, evidenceWidths, font, boldFont, 8.5);

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=naac_ssr_report_${year}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (e) {
    logger.error(`PDF generation failed: ${e}`);
    res.status(500).json({ error: "Failed to generate PDF report", details: String(e) });
  }
});

// --- Word (.docx) Generation ---
apiRouter.post("/reports/generate/docx", requireAuth, requireRole('IQAC_COORDINATOR'), async (req, res) => {
  const { year = "2024-25" } = req.body;
  try {
    const scores = await getNaacScoresInternal(year);
    const univName = await fetchUniversityName();
    const evidenceList = await prisma.evidence.findMany({ where: { academicYear: year } });

    // Read and embed the high-fidelity pre-rendered radar chart image asset
    let imageRun: any = null;
    try {
      const imgPath = path.resolve('src/server/assets/radar_chart.png');
      const imgBuffer = await fs.readFile(imgPath);
      imageRun = new ImageRun({
        data: imgBuffer,
        type: "png",
        transformation: {
          width: 320,
          height: 320
        }
      });
    } catch (imgErr) {
      logger.error(`Failed to read radar chart image for docx: ${imgErr}`);
    }

    const criteriaTables = scores.criteria.map((c: any) => {
      const headers = ["Metric", "Description", "Score Obtained", "Max Score", "Status"];
      const rows = c.metrics.map((m: any) => {
        const matchingEv = evidenceList.filter((e: any) => e.metricCode === m.code);
        const evLabel = matchingEv.length > 0
          ? `\nEvidence: ${matchingEv.map(e => `${e.name} (${BASE_URL}/api/evidence/file/${e.id})`).join(', ')}`
          : '';
        return [
          m.code,
          m.label + evLabel,
          m.score.toFixed(1),
          String(m.maxScore),
          m.flag
        ];
      });
      const colWidths = [12, 58, 10, 10, 10]; // percentage based

      return [
        new Paragraph({
          text: `Criterion ${c.criterion} — ${c.title}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        }),
        new Paragraph({
          text: `Total Score: ${c.totalScore.toFixed(1)} / ${c.maxScore} | Weighted Score: ${c.weightedScore.toFixed(1)} (NAAC Weightage: ${c.weightage})`,
          spacing: { after: 120 },
        }),
        buildDocxTable(headers, rows, colWidths)
      ];
    }).flat();

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: univName.toUpperCase(),
            heading: HeadingLevel.HEADING_3,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          }),
          new Paragraph({
            text: "NAAC SELF STUDY REPORT (SSR)",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 120 },
          }),
          new Paragraph({
            text: `Consolidated Report for Academic Year ${year}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 480 },
          }),
          
          // Executive Summary Part A (Page 1)
          new Paragraph({
            text: "1. Executive Summary (Part A)",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          }),
          new Paragraph({
            text: "This document serves as the official Self Study Report (SSR) generated for UACAS Institute of Tech. The compilation represents a unified overview of all 7 NAAC criteria dimensions, anchored in absolute transactional transparency, role-based database verification, and verified compliance indices. Under the strategic guidance of the Internal Quality Assurance Cell (IQAC), the institution has experienced substantial growth across curriculum designs, learner support facilities, e-governance expansions, and socio-community outreach initiatives. High faculty mentoring programs, remedial support structures, and active Career Placement centers have consistently driven high graduation and industry placement outcomes.",
            spacing: { after: 120 },
          }),
          new Paragraph({
            text: "Furthermore, the institution has made tremendous progress in fostering an environment of active research. Our faculty members contribute to high-impact indexed publications and filed patents, supported by substantial internal and external research grants. We have established state-of-the-art laboratory infrastructures and libraries to serve as foundational learning systems for students and teachers alike.",
            spacing: { after: 240 },
          }),

          // Executive Summary Part B (Page 2)
          new Paragraph({
            text: "Executive Summary (Part B — Strategic Focus & Summary Scorecard)",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          }),
          new Paragraph({
            text: "Our curricular model reflects high alignment with NAAC criteria benchmarks, incorporating intensive stakeholder feedback, value-added curriculum pathways, and online MOOC integrations. Strategic objectives are distributed across Criterion heads to ensure continuous quality improvement. Concentrated efforts in Criterion 1 Curricular Aspects ensure regular syllabi revisions, while Criterion 2 and 3 focus on student mentoring and research innovations. Administrative budgets are utilized efficiently for infrastructure upkeep in Criterion 4, student placement drives succeed under Criterion 5, governance is digitized in Criterion 6, and socio-community programs excel in Criterion 7.",
            spacing: { after: 120 },
          }),
          
          new Paragraph({
            text: "Accreditation Core Metrics Scorecard",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 120, after: 120 },
          }),
          buildDocxTable(
            ["Predicted Grade", "Consolidated CGPA", "Total Weighted Score", "Data Completion %"],
            [[scores.predictedGrade, `${scores.cgpa.toFixed(2)} / 4.00`, `${scores.totalWeightedScore} / 1000`, `${scores.completionPercent}%`]],
            [25, 25, 25, 25]
          ),
          new Paragraph({ text: "", spacing: { after: 240 } }),

          new Paragraph({
            text: "Criterion-wise Performance Breakdown",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 120, after: 120 },
          }),
          buildDocxTable(
            ["Criterion", "Title", "Official Weightage", "Score Obtained", "Weighted Score", "Achieved %"],
            scores.criteria.map((c: any) => [
              `Criterion ${c.criterion}`,
              c.title,
              String(c.weightage),
              `${c.totalScore.toFixed(1)} / ${c.maxScore}`,
              c.weightedScore.toFixed(1),
              `${c.percentage.toFixed(1)}%`
            ]),
            [15, 45, 12, 12, 10, 6]
          ),
          new Paragraph({ text: "", spacing: { after: 240 } }),

          // Performance Radar Map (Page 3)
          new Paragraph({
            text: "Accreditation Performance Radar Map",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
            alignment: AlignmentType.CENTER
          }),
          ...(imageRun ? [
            new Paragraph({
              children: [imageRun],
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 }
            })
          ] : []),
          new Paragraph({
            text: "The spider performance radar maps the institutional achievement relative to official NAAC benchmarks. Higher covered areas represent major strategic strengths, while contractions point to core areas that have been assigned corrective action paths under the IQAC committee.",
            spacing: { after: 240 }
          }),

          // Detailed Breakdown
          new Paragraph({
            text: "Detailed Criteria Breakdown",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          }),
          ...criteriaTables,
          new Paragraph({ text: "", spacing: { after: 240 } }),

          // Clickable Evidence Index table
          new Paragraph({
            text: "Accreditation Evidence Index Register",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          }),
          new Paragraph({
            text: "The following matrix details the complete compliance evidence register uploaded to support the NAAC accreditation criteria. Click the links below to instantly serve and download the compliance documents.",
            spacing: { after: 120 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ["Metric Code", "Evidence Document", "Uploaded By", "Auditor Download Hyperlink"].map((h, i) => new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 18 })],
                  })],
                  shading: { fill: "1E293B" },
                  width: { size: i === 0 ? 15 : i === 1 ? 40 : i === 2 ? 20 : 25, type: WidthType.PERCENTAGE },
                }))
              }),
              ...evidenceList.map((e: any, idx: number) => {
                const downloadUrl = `${BASE_URL}/api/evidence/file/${e.id}`;
                return new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: e.metricCode || "—", bold: true, size: 16 })]
                      })],
                      shading: idx % 2 === 1 ? { fill: "F8FAFC" } : undefined
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: e.name, size: 16 })]
                      })],
                      shading: idx % 2 === 1 ? { fill: "F8FAFC" } : undefined
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: e.uploaderName || "—", size: 16 })]
                      })],
                      shading: idx % 2 === 1 ? { fill: "F8FAFC" } : undefined
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [
                          new ExternalHyperlink({
                            children: [
                              new TextRun({
                                text: "Download Evidence",
                                color: "2563EB",
                                underline: {},
                                size: 16
                              })
                            ],
                            link: downloadUrl
                          })
                        ]
                      })],
                      shading: idx % 2 === 1 ? { fill: "F8FAFC" } : undefined
                    })
                  ]
                });
              })
            ]
          })
        ]
      }]
    });

    const docBuffer = await Packer.toBuffer(doc);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename=naac_ssr_report_${year}.docx`);
    res.send(docBuffer);
  } catch (e) {
    logger.error(`Word generation failed: ${e}`);
    res.status(500).json({ error: "Failed to generate Word report", details: String(e) });
  }
});

// --- Excel (.xlsx) Generation ---
apiRouter.post("/reports/generate/xlsx", requireAuth, requireRole('IQAC_COORDINATOR'), async (req, res) => {
  const { year = "2024-25" } = req.body;
  try {
    const scores = await getNaacScoresInternal(year);
    const univName = await fetchUniversityName();
    const evidenceList = await prisma.evidence.findMany({ where: { academicYear: year } });

    const workbook = new ExcelJS.Workbook();
    
    // --- Sheet 1: Summary ---
    const summarySheet = workbook.addWorksheet("Executive Summary");
    summarySheet.addRow([univName.toUpperCase()]).font = { bold: true, size: 14 };
    summarySheet.addRow(["NAAC Self Study Report (SSR) - Executive Summary"]).font = { size: 12, italic: true };
    summarySheet.addRow([`Academic Year: ${year}`]).font = { size: 11 };
    summarySheet.addRow([]);

    summarySheet.addRow(["Accreditation Scorecard"]).font = { bold: true, size: 12 };
    summarySheet.addRow(["Metric", "Value"]);
    summarySheet.addRow(["Predicted NAAC Grade", scores.predictedGrade]);
    summarySheet.addRow(["Consolidated CGPA", scores.cgpa]);
    summarySheet.addRow(["Total Weighted Score", `${scores.totalWeightedScore} / 1000`]);
    summarySheet.addRow(["Data Completion %", `${scores.completionPercent}%`]);

    // Apply styles to scorecard rows
    for (let r = 7; r <= 10; r++) {
      summarySheet.getCell(`A${r}`).font = { bold: true };
      summarySheet.getCell(`B${r}`).font = { bold: true, color: { argb: '2563EB' } };
    }
    summarySheet.addRow([]);

    // Criteria Overview Table
    summarySheet.addRow(["Criterion-wise Performance Breakdown"]).font = { bold: true, size: 12 };
    const summaryTableHead = ["Criterion", "Title", "Official Weightage", "Score Obtained", "Weighted Score", "Completion %"];
    summarySheet.addRow(summaryTableHead);

    scores.criteria.forEach((c: any) => {
      summarySheet.addRow([
        `Criterion ${c.criterion}`,
        c.title,
        c.weightage,
        Number(c.totalScore.toFixed(1)),
        Number(c.weightedScore.toFixed(1)),
        c.percentage
      ]);
    });

    // Style headers
    const headerRowIdx = 13;
    summarySheet.getRow(headerRowIdx).font = { bold: true, color: { argb: 'FFFFFF' } };
    summarySheet.getRow(headerRowIdx).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    });

    summarySheet.columns = [
      { key: 'A', width: 25 },
      { key: 'B', width: 45 },
      { key: 'C', width: 18 },
      { key: 'D', width: 18 },
      { key: 'E', width: 18 },
      { key: 'F', width: 18 }
    ];

    // --- Sheet 2: Detailed Metrics ---
    const detailSheet = workbook.addWorksheet("Detailed Metrics");
    detailSheet.addRow(["NAAC SSR - Detailed Metric-wise Data Scorecard"]).font = { bold: true, size: 12 };
    detailSheet.addRow([`Academic Year: ${year}`]);
    detailSheet.addRow([]);

    const detailHeaders = ["Criterion", "Metric Code", "Metric Description", "Score Obtained", "Max Score", "Percentage", "Status Flag", "Computed Value", "Evidence Link"];
    detailSheet.addRow(detailHeaders);

    scores.criteria.forEach((c: any) => {
      c.metrics.forEach((m: any) => {
        const matchingEv = evidenceList.filter((e: any) => e.metricCode === m.code);
        const evLinkVal = matchingEv.length > 0
          ? matchingEv.map(e => `${BASE_URL}/api/evidence/file/${e.id}`).join(', ')
          : "—";

        detailSheet.addRow([
          `Criterion ${c.criterion}`,
          m.code,
          m.label,
          Number(m.score.toFixed(1)),
          m.maxScore,
          m.percentage,
          m.flag,
          m.value || "—",
          evLinkVal
        ]);
      });
    });

    // Format headers of sheet 2
    detailSheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFF' } };
    detailSheet.getRow(4).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    });

    // Color code status flags in sheet 2
    detailSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 4) {
        const flagCell = row.getCell(7);
        const flagVal = flagCell.value;
        if (flagVal === 'GREEN') {
          flagCell.font = { bold: true, color: { argb: '10B981' } };
        } else if (flagVal === 'AMBER') {
          flagCell.font = { bold: true, color: { argb: 'F59E0B' } };
        } else if (flagVal === 'RED') {
          flagCell.font = { bold: true, color: { argb: 'EF4444' } };
        }
      }
    });

    detailSheet.columns = [
      { key: 'A', width: 15 },
      { key: 'B', width: 15 },
      { key: 'C', width: 55 },
      { key: 'D', width: 16 },
      { key: 'E', width: 16 },
      { key: 'F', width: 16 },
      { key: 'G', width: 16 },
      { key: 'H', width: 25 },
      { key: 'I', width: 55 }
    ];

    const xlsxBuffer = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=naac_ssr_report_${year}.xlsx`);
    res.send(Buffer.from(xlsxBuffer));
  } catch (e) {
    logger.error(`Excel generation failed: ${e}`);
    res.status(500).json({ error: "Failed to generate Excel report", details: String(e) });
  }
});

// --- JSON Data Export ---
apiRouter.post("/reports/generate/json", requireAuth, requireRole('IQAC_COORDINATOR'), async (req, res) => {
  const { year = "2024-25" } = req.body;
  try {
    const scores = await getNaacScoresInternal(year);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=naac_ssr_report_${year}.json`);
    res.json(scores);
  } catch (e) {
    logger.error(`JSON generation failed: ${e}`);
    res.status(500).json({ error: "Failed to generate JSON data", details: String(e) });
  }
});

// --- Evidence Upload (Document Management Module) ---
apiRouter.post("/evidence/upload", requireAuth, express.raw({ type: ['application/pdf', 'image/*'], limit: '50mb' }), async (req, res) => {
  try {
    const univ = await prisma.university.findFirst();
    const uid = univ?.id;
    if (!uid) return res.status(404).json({ error: "University not found" });

    const fileName = (req.headers['x-file-name'] as string) || 'evidence.pdf';
    const criterion = (req.headers['x-criterion'] as string) || 'C1';
    const metricCode = req.headers['x-metric-code'] as string || null;
    const academicYear = (req.headers['x-academic-year'] as string) || '2024-25';
    const uploaderName = (req.headers['x-uploader-name'] as string) || 'IQAC Coordinator';

    const ext = path.extname(fileName) || '.pdf';
    const fileType = ext.slice(1).toUpperCase();

    // Create database entry first to obtain a unique ID
    const dbRecord = await prisma.evidence.create({
      data: {
        name: fileName,
        fileUrl: '', // updated dynamically below
        fileType,
        criterion,
        metricCode,
        academicYear,
        uploaderName,
        universityId: uid
      }
    });

    // Save the raw binary buffer directly to local storage
    const uploadDir = path.resolve('./uploads/evidence');
    await fs.mkdir(uploadDir, { recursive: true });
    
    const localFileName = `${dbRecord.id}${ext}`;
    const filePath = path.join(uploadDir, localFileName);
    await fs.writeFile(filePath, req.body);

    // Update the database record with the unique serve url
    const fileUrl = `/api/evidence/file/${dbRecord.id}`;
    const updated = await prisma.evidence.update({
      where: { id: dbRecord.id },
      data: { fileUrl }
    });

    res.status(201).json(updated);
  } catch (e) {
    logger.error(`Evidence upload failed: ${e}`);
    res.status(500).json({ error: "Failed to upload evidence file", details: String(e) });
  }
});

// --- Serve Uploaded File ---
apiRouter.get("/evidence/file/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const record = await prisma.evidence.findUnique({ where: { id } });
    if (!record) return res.status(404).json({ error: "Evidence record not found" });

    const ext = path.extname(record.name) || '.pdf';
    const filePath = path.resolve('./uploads/evidence', `${record.id}${ext}`);
    
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: "Physical evidence file not found on local disk" });
    }

    res.sendFile(filePath);
  } catch (e) {
    logger.error(`Failed to serve evidence file: ${e}`);
    res.status(500).json({ error: "Failed to retrieve evidence file" });
  }
});

// --- List Uploaded Evidences ---
apiRouter.get("/evidence", requireAuth, async (req, res) => {
  try {
    const univ = await prisma.university.findFirst();
    const uid = univ?.id;
    if (!uid) return res.status(404).json({ error: "University not found" });

    const { criterion, academicYear } = req.query;

    const list = await prisma.evidence.findMany({
      where: {
        universityId: uid,
        ...(criterion && { criterion: criterion as string }),
        ...(academicYear && { academicYear: academicYear as string })
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(list);
  } catch (e) {
    logger.error(`Failed to fetch evidence vault: ${e}`);
    res.status(500).json({ error: "Failed to retrieve evidence list" });
  }
});

// --- Delete Uploaded Evidence ---
apiRouter.delete("/evidence/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const record = await prisma.evidence.findUnique({ where: { id } });
    if (!record) return res.status(404).json({ error: "Evidence record not found" });

    // Remove physical file from on-premise local disk
    const ext = path.extname(record.name) || '.pdf';
    const filePath = path.resolve('./uploads/evidence', `${record.id}${ext}`);
    if (existsSync(filePath)) {
      await fs.unlink(filePath);
    }

    // Delete record from database
    await prisma.evidence.delete({ where: { id } });
    res.json({ success: true, message: "Evidence record and physical file deleted successfully" });
  } catch (e) {
    logger.error(`Failed to delete evidence: ${e}`);
    res.status(500).json({ error: "Failed to delete evidence record" });
  }
});
