// src/server/services/nirfScoringEngine.ts — NIRF Ranking Score Computation
// Official MHRD NIRF Methodology: 5 parameters with sub-parameters

export interface NirfInputData {
  // Teaching, Learning & Resources (TLR) - 30%
  tlr: {
    totalStudents: number;
    totalFaculty: number;
    sanctionedPosts: number;
    phdFaculty: number;
    avgExperienceYears: number;
    totalExpenditure: number;   // INR
    capitalExpenditure: number; // INR
    femaleStudents: number;
    economicallyBackwardStudents: number;
  };
  // Research & Professional Practice (RP) - 30%
  rp: {
    publicationsCount: number;
    citationsCount: number;
    scopusPublications: number;
    patentsPublished: number;
    patentsGranted: number;
    fundedProjects: number;
    fundingAmount: number;   // INR
    fpppAmount: number;      // INR (earnings from professional practice)
  };
  // Graduation Outcomes (GO) - 20%
  go: {
    graduatesLastYear: number;
    placedStudents: number;
    higherStudiesStudents: number;
    medianSalary: number;      // INR LPA
    phdGraduates: number;
    totalStudentsGO: number;
  };
  // Outreach & Inclusivity (OI) - 10%
  oi: {
    femaleStudentsPercent: number;
    economicallyBackwardPercent: number;
    facilitiesForDifferentlyAbled: boolean;
    femaleStudentsPhd: number;
    totalPhDStudents: number;
    regionalDiversityScore: number; // 0-100
  };
  // Perception (PR) - 10%
  pr: {
    peerScore: number;        // 0-100
    employerScore: number;    // 0-100
  };
}

export interface NirfScoreResult {
  tlr: { score: number; maxScore: number; subParams: Record<string, number> };
  rp: { score: number; maxScore: number; subParams: Record<string, number> };
  go: { score: number; maxScore: number; subParams: Record<string, number> };
  oi: { score: number; maxScore: number; subParams: Record<string, number> };
  pr: { score: number; maxScore: number; subParams: Record<string, number> };
  totalScore: number;
  maxTotalScore: number;
  breakdown: {
    parameter: string;
    weight: number;
    rawScore: number;
    weightedScore: number;
  }[];
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// Sigmoid-like function for normalization used by NIRF
function nirfNormalize(value: number, benchmark: number, scale: number = 1): number {
  if (benchmark <= 0) return 0;
  const ratio = value / benchmark;
  return clamp(ratio * 100 * scale, 0, 100);
}

export function computeNirfScores(input: NirfInputData): NirfScoreResult {
  // ─── TLR (30 marks total) ─────────────────────────
  // SS: Student Strength (20 marks)
  const ss = clamp(input.tlr.totalStudents / 100, 0, 20); // scaled

  // FSR: Faculty-Student Ratio (30 marks)
  const fsr = input.tlr.totalStudents > 0
    ? clamp((input.tlr.totalFaculty / input.tlr.totalStudents) * 100, 0, 30)
    : 0;

  // FQE: Faculty with PhD (20 marks)
  const phdPercent = input.tlr.totalFaculty > 0
    ? (input.tlr.phdFaculty / input.tlr.totalFaculty) * 100
    : 0;
  const fqe = clamp(phdPercent / 100 * 20, 0, 20);

  // FRU: Financial Resources Utilization (30 marks)
  const perStudentExpenditure = input.tlr.totalStudents > 0
    ? input.tlr.totalExpenditure / input.tlr.totalStudents
    : 0;
  const fru = clamp(nirfNormalize(perStudentExpenditure, 200000) / 100 * 30, 0, 30);

  const tlrRaw = ss + fsr + fqe + fru;
  const tlrScore = clamp(tlrRaw, 0, 100);

  // ─── RP (30 marks total) ─────────────────────────
  // PU: Publications (35 marks)
  const pubPerFaculty = input.tlr.totalFaculty > 0
    ? input.rp.publicationsCount / input.tlr.totalFaculty
    : 0;
  const pu = clamp(pubPerFaculty * 15, 0, 35);

  // QP: Quality of Publications (35 marks)
  const citationsPerPub = input.rp.publicationsCount > 0
    ? input.rp.citationsCount / input.rp.publicationsCount
    : 0;
  const scopusRatio = input.rp.publicationsCount > 0
    ? input.rp.scopusPublications / input.rp.publicationsCount
    : 0;
  const qp = clamp((citationsPerPub * 5 + scopusRatio * 20), 0, 35);

  // IPR: Intellectual Property Rights (15 marks)
  const ipr = clamp(
    (input.rp.patentsPublished * 2 + input.rp.patentsGranted * 5),
    0, 15
  );

  // FPPP: Footprint of Projects and Practice (15 marks)
  const fppp = clamp(
    nirfNormalize(input.rp.fundingAmount + input.rp.fpppAmount, 50000000) / 100 * 15,
    0, 15
  );

  const rpRaw = pu + qp + ipr + fppp;
  const rpScore = clamp(rpRaw, 0, 100);

  // ─── GO (20 marks total) ─────────────────────────
  // GPH: Combined % of Placement and Higher Studies (40 marks)
  const totalOutcomes = input.go.placedStudents + input.go.higherStudiesStudents;
  const gphPercent = input.go.graduatesLastYear > 0
    ? (totalOutcomes / input.go.graduatesLastYear) * 100
    : 0;
  const gph = clamp(gphPercent / 100 * 40, 0, 40);

  // GUE: University Examinations (15 marks)
  const gue = clamp(
    nirfNormalize(input.go.medianSalary, 8) / 100 * 15,
    0, 15
  ); // benchmark 8 LPA

  // MS: Median Salary (25 marks)
  const ms = clamp(
    nirfNormalize(input.go.medianSalary, 10) / 100 * 25,
    0, 25
  );

  // GPHD: Metric for PhD students (20 marks)
  const gphd = clamp(
    (input.go.phdGraduates / Math.max(1, input.go.totalStudentsGO)) * 100 * 2,
    0, 20
  );

  const goRaw = gph + gue + ms + gphd;
  const goScore = clamp(goRaw, 0, 100);

  // ─── OI (10 marks total) ─────────────────────────
  // RD: Regional Diversity (30 marks)
  const rd = clamp(input.oi.regionalDiversityScore / 100 * 30, 0, 30);

  // WD: Women Diversity (30 marks)
  const wd = clamp(input.oi.femaleStudentsPercent / 100 * 30, 0, 30);

  // ESCS: Economically & Socially Challenged Students (20 marks)
  const escs = clamp(input.oi.economicallyBackwardPercent / 100 * 20, 0, 20);

  // WF: Facilities for Differently Abled (20 marks)
  const wf = input.oi.facilitiesForDifferentlyAbled ? 20 : 5;

  const oiRaw = rd + wd + escs + wf;
  const oiScore = clamp(oiRaw, 0, 100);

  // ─── PR (10 marks total) ─────────────────────────
  const prRaw = (input.pr.peerScore * 0.5 + input.pr.employerScore * 0.5);
  const prScore = clamp(prRaw, 0, 100);

  // ─── Aggregate ─────────────────────────
  const weights = { tlr: 0.30, rp: 0.30, go: 0.20, oi: 0.10, pr: 0.10 };
  const totalScore =
    tlrScore * weights.tlr +
    rpScore * weights.rp +
    goScore * weights.go +
    oiScore * weights.oi +
    prScore * weights.pr;

  return {
    tlr: {
      score: Math.round(tlrScore * 100) / 100,
      maxScore: 100,
      subParams: { SS: Math.round(ss * 100) / 100, FSR: Math.round(fsr * 100) / 100, FQE: Math.round(fqe * 100) / 100, FRU: Math.round(fru * 100) / 100 }
    },
    rp: {
      score: Math.round(rpScore * 100) / 100,
      maxScore: 100,
      subParams: { PU: Math.round(pu * 100) / 100, QP: Math.round(qp * 100) / 100, IPR: Math.round(ipr * 100) / 100, FPPP: Math.round(fppp * 100) / 100 }
    },
    go: {
      score: Math.round(goScore * 100) / 100,
      maxScore: 100,
      subParams: { GPH: Math.round(gph * 100) / 100, GUE: Math.round(gue * 100) / 100, MS: Math.round(ms * 100) / 100, GPHD: Math.round(gphd * 100) / 100 }
    },
    oi: {
      score: Math.round(oiScore * 100) / 100,
      maxScore: 100,
      subParams: { RD: Math.round(rd * 100) / 100, WD: Math.round(wd * 100) / 100, ESCS: Math.round(escs * 100) / 100, WF: Math.round(wf * 100) / 100 }
    },
    pr: {
      score: Math.round(prScore * 100) / 100,
      maxScore: 100,
      subParams: { PeerScore: input.pr.peerScore, EmployerScore: input.pr.employerScore }
    },
    totalScore: Math.round(totalScore * 100) / 100,
    maxTotalScore: 100,
    breakdown: [
      { parameter: 'Teaching, Learning & Resources', weight: 30, rawScore: Math.round(tlrScore * 100) / 100, weightedScore: Math.round(tlrScore * weights.tlr * 100) / 100 },
      { parameter: 'Research & Professional Practice', weight: 30, rawScore: Math.round(rpScore * 100) / 100, weightedScore: Math.round(rpScore * weights.rp * 100) / 100 },
      { parameter: 'Graduation Outcomes', weight: 20, rawScore: Math.round(goScore * 100) / 100, weightedScore: Math.round(goScore * weights.go * 100) / 100 },
      { parameter: 'Outreach & Inclusivity', weight: 10, rawScore: Math.round(oiScore * 100) / 100, weightedScore: Math.round(oiScore * weights.oi * 100) / 100 },
      { parameter: 'Perception', weight: 10, rawScore: Math.round(prScore * 100) / 100, weightedScore: Math.round(prScore * weights.pr * 100) / 100 },
    ]
  };
}
