// src/server/services/scoringEngine.ts
// NAAC SSR Scoring Engine — Implements NAAC's official weightage framework

export interface MetricScore {
  code: string;
  label: string;
  score: number;
  maxScore: number;
  percentage: number;
  flag: 'GREEN' | 'AMBER' | 'RED';
  value?: string; // human-readable computed value
  warnings?: string[];
  isEvidenceMissing?: boolean;
}

export interface CriterionScore {
  criterion: number;
  title: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  weightage: number; // NAAC official weightage (total 1000)
  weightedScore: number;
  metrics: MetricScore[];
}

export interface InstitutionScore {
  academicYear: string;
  criteria: CriterionScore[];
  totalWeightedScore: number;
  cgpa: number;
  predictedGrade: string;
  completionPercent: number;
}

// NAAC 2022 Criterion Weightages (Total = 1000)
const WEIGHTAGES = {
  1: 150, // Curricular Aspects
  2: 200, // Teaching-Learning
  3: 250, // Research
  4: 100, // Infrastructure
  5: 150, // Student Support
  6: 100, // Governance
  7: 50,  // Institutional Values
};
// Total = 1000; CGPA = (total weighted score / 1000) * 4

function flag(pct: number, greenThreshold = 70, amberThreshold = 30): 'GREEN' | 'AMBER' | 'RED' {
  if (pct >= greenThreshold) return 'GREEN';
  if (pct >= amberThreshold) return 'AMBER';
  return 'RED';
}

function metric(
  code: string,
  label: string,
  score: number,
  maxScore: number,
  value?: string,
  warnings?: string[],
  isEvidenceMissing?: boolean
): MetricScore {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return {
    code,
    label,
    score: Math.round(score * 100) / 100,
    maxScore,
    percentage: Math.round(pct * 10) / 10,
    flag: flag(pct),
    value,
    warnings,
    isEvidenceMissing,
  };
}

// ─────────────────────────────────────────────
// CRITERION I — Curricular Aspects (Max 150)
// ─────────────────────────────────────────────
export function computeCriterion1Score(data: {
  totalPrograms: number;
  programsWithBoS: number;
  programsWithIndustryFeedback: number;
  coursesWithEmployabilityFocus: number;
  totalCoursesCount: number;
  newCoursesCount: number;
  programsWithCBCS: number;
  integratesEthicsIssues: boolean;
  valueAddedCoursesCount: number;
  valueAddedEnrollment: number;
  totalStudents: number;
  studentsInProjectsCount: number;
  feedbackStakeholderCount: number;
  feedbackActionTaken: boolean;
  uploadedEvidenceCodes?: string[];
  hasBoSMinutes?: boolean;
}): CriterionScore {
  const metrics: MetricScore[] = [];

  // 1.1.1 — Curricula relevance to local/national/global needs (QlM) (20 marks)
  const bosPerc = data.totalPrograms > 0 ? (data.programsWithBoS / data.totalPrograms) * 100 : 0;
  const isC111EvMissing = data.programsWithBoS > 0 && !(data.hasBoSMinutes || data.uploadedEvidenceCodes?.includes('1.1.1'));
  const c111Warnings = isC111EvMissing ? ["Missing BoS meeting minutes or evidence upload for metric 1.1.1"] : undefined;
  metrics.push(metric('1.1.1', 'Curricula relevance reflected in POs/COs (QlM)', Math.min((bosPerc / 100) * 20, 20), 20, `${bosPerc.toFixed(1)}% programs`, c111Warnings, isC111EvMissing));

  // 1.1.2 — Syllabus revision percentage in last 5 years (QnM) (20 marks)
  const fbPerc = data.totalPrograms > 0 ? (data.programsWithIndustryFeedback / data.totalPrograms) * 100 : 0;
  metrics.push(metric('1.1.2', 'Program syllabus revision percentage (QnM)', Math.min((fbPerc / 100) * 20, 20), 20, `${fbPerc.toFixed(1)}% revised`));

  // 1.1.3 — Average percentage of courses with employability focus (QnM) (10 marks)
  const empPerc = data.totalCoursesCount > 0 ? (data.coursesWithEmployabilityFocus / data.totalCoursesCount) * 100 : 0;
  metrics.push(metric('1.1.3', 'Courses with employability focus percentage (QnM)', Math.min((empPerc / 100) * 10, 10), 10, `${empPerc.toFixed(1)}% courses`));

  // 1.2.1 — New courses introduced in last 5 years (QnM) (30 marks)
  const newCoursePerc = data.totalCoursesCount > 0 ? (data.newCoursesCount / data.totalCoursesCount) * 100 : 0;
  metrics.push(metric('1.2.1', 'New courses introduced percentage (QnM)', Math.min((newCoursePerc / 100) * 30, 30), 30, `${newCoursePerc.toFixed(1)}% new courses`));

  // 1.2.2 — Choice Based Credit System (CBCS) implementation % (QnM) (20 marks)
  const cbcsPerc = data.totalPrograms > 0 ? (data.programsWithCBCS / data.totalPrograms) * 100 : 0;
  metrics.push(metric('1.2.2', 'Programs adopting CBCS/elective system (QnM)', Math.min((cbcsPerc / 100) * 20, 20), 20, `${cbcsPerc.toFixed(1)}% programs`));

  // 1.3.1 — Curriculum integrates professional ethics & sustainability (QlM) (5 marks)
  const ethicsScore = data.integratesEthicsIssues ? 5 : 0;
  metrics.push(metric('1.3.1', 'Ethics & sustainability issue integration (QlM)', ethicsScore, 5, data.integratesEthicsIssues ? 'Integrated' : 'Not integrated'));

  // 1.3.2 — Number of value-added courses offered (QnM) (10 marks)
  const vacScore = Math.min(data.valueAddedCoursesCount * 2, 10);
  metrics.push(metric('1.3.2', 'Value-added transferable courses count (QnM)', vacScore, 10, `${data.valueAddedCoursesCount} courses`));

  // 1.3.3 — Students enrolled in value-added courses (QnM) (10 marks)
  const vacEnrollPerc = data.totalStudents > 0 ? (data.valueAddedEnrollment / data.totalStudents) * 100 : 0;
  metrics.push(metric('1.3.3', 'Students enrolled in value-added courses (QnM)', Math.min((vacEnrollPerc / 100) * 10, 10), 10, `${vacEnrollPerc.toFixed(1)}% students`));

  // 1.3.4 — Students undertaking field projects / internships (QnM) (5 marks)
  const projPerc = data.totalStudents > 0 ? (data.studentsInProjectsCount / data.totalStudents) * 100 : 0;
  metrics.push(metric('1.3.4', 'Students in projects/internships percentage (QnM)', Math.min((projPerc / 100) * 5, 5), 5, `${projPerc.toFixed(1)}% students`));

  // 1.4.1 — Stakeholder feedback collected (QnM) (10 marks)
  const fbScore = data.feedbackStakeholderCount >= 4 ? 10 : data.feedbackStakeholderCount === 3 ? 7 : data.feedbackStakeholderCount === 2 ? 5 : data.feedbackStakeholderCount === 1 ? 2 : 0;
  metrics.push(metric('1.4.1', 'Feedback collected from stakeholders (QnM)', fbScore, 10, `${data.feedbackStakeholderCount}/4 categories`));

  // 1.4.2 — Feedback action taken report available (QnM) (10 marks)
  const atrScore = data.feedbackActionTaken ? 10 : 0;
  const isC142EvMissing = data.feedbackActionTaken && !data.uploadedEvidenceCodes?.includes('1.4.2');
  const c142Warnings = isC142EvMissing ? ["Missing Feedback Action Taken Report upload for 1.4.2"] : undefined;
  metrics.push(metric('1.4.2', 'Feedback action taken website report (QnM)', atrScore, 10, data.feedbackActionTaken ? 'Available' : 'Not Available', c142Warnings, isC142EvMissing));

  const totalScore = metrics.reduce((s, m) => s + m.score, 0);
  const maxScore = metrics.reduce((s, m) => s + m.maxScore, 0);
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    criterion: 1, title: 'Curricular Aspects',
    totalScore, maxScore, percentage: Math.round(percentage * 10) / 10,
    weightage: WEIGHTAGES[1],
    weightedScore: maxScore > 0 ? (totalScore / maxScore) * WEIGHTAGES[1] : 0,
    metrics,
  };
}

// ─────────────────────────────────────────────
// CRITERION II — Teaching-Learning (Max 200)
// ─────────────────────────────────────────────
export function computeCriterion2Score(data: {
  totalSanctioned: number;
  totalEnrolled: number;
  reservedSanctioned: number;
  reservedEnrolled: number;
  slowLearnerProgramsCount: number;
  totalStudents: number;
  totalFaculty: number;
  studentsPerMentor: number;
  experientialMethodsImplemented: boolean;
  ictPercent: number;
  lmsUsed: boolean;
  vacancyPercent: number;
  phdPercent: number;
  avgTeachingExperienceYears: number;
  awardsCount: number;
  avgDaysExamToResult: number;
  examComplaintsPercent: number;
  examITReformsImplemented: boolean;
  automationStatus: boolean;
  posCosDefined: boolean;
  posCosAttainmentEvaluated: boolean;
  avgPassPercent: number;
  studentSatisfactionRate: number;
  uploadedEvidenceCodes?: string[];
}): CriterionScore {
  const metrics: MetricScore[] = [];

  // 2.1.1 — % enrolment vs sanctioned (QnM) (5 marks)
  const fillPerc = data.totalSanctioned > 0 ? (data.totalEnrolled / data.totalSanctioned) * 100 : 0;
  metrics.push(metric('2.1.1', '% seats filled vs sanctioned intake (QnM)', Math.min((fillPerc / 100) * 5, 5), 5, `${fillPerc.toFixed(1)}%`));

  // 2.1.2 — % Reserved category seats filled (QnM) (5 marks)
  const resPerc = data.reservedSanctioned > 0 ? (data.reservedEnrolled / data.reservedSanctioned) * 100 : 0;
  metrics.push(metric('2.1.2', '% reserved category seats filled (QnM)', Math.min((resPerc / 100) * 5, 5), 5, `${resPerc.toFixed(1)}%`));

  // 2.2.1 — Special programmes organized for advanced & slow learners (QlM) (10 marks)
  const slowScore = data.slowLearnerProgramsCount > 0 ? 10 : 0;
  metrics.push(metric('2.2.1', 'Programs for advanced/slow learners (QlM)', slowScore, 10, `${data.slowLearnerProgramsCount} programs`));

  // 2.2.2 — Student - Full time teacher ratio (QnM) (10 marks)
  const sRatio = data.totalFaculty > 0 ? data.totalStudents / data.totalFaculty : 0;
  const ratioScore = sRatio <= 0 ? 0 : sRatio <= 15 ? 10 : sRatio <= 20 ? 7 : sRatio <= 25 ? 5 : 2;
  metrics.push(metric('2.2.2', 'Student - Full time teacher ratio (QnM)', ratioScore, 10, sRatio > 0 ? `1:${sRatio.toFixed(1)} ratio` : 'No faculty'));

  // 2.3.1 — experiential, participative learning methods used (QlM) (6 marks)
  const expScore = data.experientialMethodsImplemented ? 6 : 3;
  metrics.push(metric('2.3.1', 'Experiential & PBL student learning (QlM)', expScore, 6, data.experientialMethodsImplemented ? 'Active' : 'Moderate'));

  // 2.3.2 — Teachers use ICT enabled tools, LMS (QlM) (6 marks)
  const ictToolsScore = (data.ictPercent >= 80 || data.lmsUsed) ? 6 : 3;
  metrics.push(metric('2.3.2', 'Teachers using ICT and LMS tools (QlM)', ictToolsScore, 6, `${data.ictPercent.toFixed(0)}% ICT users`));

  // 2.3.3 — Ratio of students to mentor (QnM) (8 marks)
  const mentorScore = data.studentsPerMentor <= 0 ? 0 : data.studentsPerMentor <= 20 ? 8 : data.studentsPerMentor <= 30 ? 6 : 4;
  metrics.push(metric('2.3.3', 'Mentoring (students per mentor ratio) (QnM)', mentorScore, 8, `1:${data.studentsPerMentor.toFixed(0)} ratio`));

  // 2.4.1 — % teachers against sanctioned posts (QnM) (15 marks)
  const vacScore = Math.max(0, Math.min((1 - data.vacancyPercent / 100) * 15, 15));
  metrics.push(metric('2.4.1', 'Full-time teachers posts filled (QnM)', vacScore, 15, `${(100 - data.vacancyPercent).toFixed(1)}% filled`));

  // 2.4.2 — % full-time teachers with PhD (QnM) (15 marks)
  const phdScore = Math.min((data.phdPercent / 100) * 15, 15);
  metrics.push(metric('2.4.2', 'Full-time teachers with Ph.D percentage (QnM)', phdScore, 15, `${data.phdPercent.toFixed(1)}% PhD`));

  // 2.4.3 — Average teaching experience of full time teachers (QnM) (10 marks)
  const expScoreYears = data.avgTeachingExperienceYears >= 8 ? 10 : data.avgTeachingExperienceYears >= 5 ? 7 : 4;
  metrics.push(metric('2.4.3', 'Full-time teacher avg teaching experience (QnM)', expScoreYears, 10, `${data.avgTeachingExperienceYears.toFixed(1)} years`));

  // 2.4.4 — % full time teachers receiving awards/fellowships (QnM) (10 marks)
  const teacherAwardsPerc = data.totalFaculty > 0 ? (data.awardsCount / data.totalFaculty) * 100 : 0;
  const awardsScore = Math.min((teacherAwardsPerc / 10) * 10, 10); // Capped at 10% for full marks
  metrics.push(metric('2.4.4', 'Faculty awards & fellowship percentage (QnM)', awardsScore, 10, `${teacherAwardsPerc.toFixed(1)}% awarded`));

  // 2.5.1 — Average result declaration days timeline (QnM) (15 marks)
  const resultScore = data.avgDaysExamToResult <= 0 ? 0 : data.avgDaysExamToResult <= 15 ? 15 : data.avgDaysExamToResult <= 30 ? 10 : data.avgDaysExamToResult <= 45 ? 5 : 2;
  metrics.push(metric('2.5.1', 'Average exam result declaration days (QnM)', resultScore, 15, `${data.avgDaysExamToResult.toFixed(0)} days`));

  // 2.5.2 — % student evaluation grievances (QnM) (10 marks)
  const grievanceScore = data.examComplaintsPercent <= 1 ? 10 : data.examComplaintsPercent <= 3 ? 7 : data.examComplaintsPercent <= 5 ? 4 : 0;
  metrics.push(metric('2.5.2', 'Evaluation grievances and complaints (QnM)', grievanceScore, 10, `${data.examComplaintsPercent.toFixed(1)}% complaints`));

  // 2.5.3 — IT integration and reforms in examination (QlM) (10 marks)
  const reformsScore = data.examITReformsImplemented ? 10 : 5;
  metrics.push(metric('2.5.3', 'IT exam reforms & transparent process (QlM)', reformsScore, 10, data.examITReformsImplemented ? 'Implemented' : 'Moderate'));

  // 2.5.4 — Status of automation of Examination division (QnM) (5 marks)
  const autoScore = data.automationStatus ? 5 : 0;
  metrics.push(metric('2.5.4', 'Examination division automation status (QnM)', autoScore, 5, data.automationStatus ? 'Complete Automation' : 'Manual'));

  // 2.6.1 — POs and COs definitions publicity (QlM) (10 marks)
  const isC261EvMissing = data.posCosDefined && !data.uploadedEvidenceCodes?.includes('2.6.1');
  const c261Warnings = isC261EvMissing ? ["Missing PO/CO definition mapping sheet for 2.6.1"] : undefined;
  metrics.push(metric('2.6.1', 'Stated program PO/CO definitions (QlM)', data.posCosDefined ? 10 : 0, 10, data.posCosDefined ? 'Yes' : 'No', c261Warnings, isC261EvMissing));

  // 2.6.2 — Attainment of POs and COs evaluated (QlM) (10 marks)
  const attainedScore = data.posCosAttainmentEvaluated ? 10 : 0;
  metrics.push(metric('2.6.2', 'Evaluation of PO/CO course attainments (QlM)', attainedScore, 10, data.posCosAttainmentEvaluated ? 'Evaluated' : 'Not Evaluated'));

  // 2.6.3 — Pass percentage of students (QnM) (10 marks)
  const passScore = Math.min((data.avgPassPercent / 100) * 10, 10);
  metrics.push(metric('2.6.3', 'Average students pass percentage (QnM)', passScore, 10, `${data.avgPassPercent.toFixed(1)}%`));

  // 2.7.1 — Online Student Satisfaction Survey (SSS) (QnM) (30 marks)
  const sssScore = Math.min((data.studentSatisfactionRate / 100) * 30, 30);
  metrics.push(metric('2.7.1', 'Online student satisfaction survey (QnM)', sssScore, 30, `${data.studentSatisfactionRate.toFixed(1)}% rating`));

  const totalScore = metrics.reduce((s, m) => s + m.score, 0);
  const maxScore = metrics.reduce((s, m) => s + m.maxScore, 0);
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    criterion: 2, title: 'Teaching-Learning and Evaluation',
    totalScore, maxScore, percentage: Math.round(percentage * 10) / 10,
    weightage: WEIGHTAGES[2],
    weightedScore: maxScore > 0 ? (totalScore / maxScore) * WEIGHTAGES[2] : 0,
    metrics,
  };
}

// ─────────────────────────────────────────────
// CRITERION III — Research (Max 250)
// ─────────────────────────────────────────────
export function computeCriterion3Score(data: {
  totalGrantsINR: number;
  totalFaculty: number;
  activeProjects: number;
  patentsGranted: number;
  patentsFiled: number;
  scopusPublications: number;
  ugcPublications: number;
  booksChapters: number;
  extensionActivities: number;
  nssNccStudents: number;
  totalStudents: number;
  mouCount: number;
  uploadedEvidenceCodes?: string[];
}): CriterionScore {
  const metrics: MetricScore[] = [];

  // 3.1.1 — Research grants per teacher (50 marks)
  const grantsPerTeacher = data.totalFaculty > 0 ? data.totalGrantsINR / data.totalFaculty : 0;
  const grantScore = grantsPerTeacher >= 500000 ? 50 : grantsPerTeacher >= 200000 ? 35 : grantsPerTeacher >= 100000 ? 20 : grantsPerTeacher >= 50000 ? 10 : 5;
  const isC311EvMissing = data.totalGrantsINR > 0 && !data.uploadedEvidenceCodes?.includes('3.1.1');
  const c311Warnings = isC311EvMissing ? ["Missing research grant sanction letters evidence for 3.1.1"] : undefined;
  metrics.push(metric('3.1.1', 'Research grants received (per teacher)', grantScore, 50, `₹${(grantsPerTeacher / 1000).toFixed(0)}K/teacher`, c311Warnings, isC311EvMissing));

  // 3.1.2 — Active research projects (20 marks)
  const projScore = Math.min(data.activeProjects * 2, 20);
  metrics.push(metric('3.1.2', 'Number of active research projects', projScore, 20, `${data.activeProjects} projects`));

  // 3.2.1 — Patents granted (40 marks)
  const patentGrantScore = Math.min(data.patentsGranted * 10, 30) + Math.min(data.patentsFiled * 2, 10);
  metrics.push(metric('3.2.1', 'Patents granted / filed', Math.min(patentGrantScore, 40), 40, `${data.patentsGranted} granted, ${data.patentsFiled} filed`));

  // 3.3.1 — Scopus/WoS publications per teacher (50 marks)
  const pubPerTeacher = data.totalFaculty > 0 ? data.scopusPublications / data.totalFaculty : 0;
  const pubScore = pubPerTeacher >= 2 ? 50 : pubPerTeacher >= 1 ? 35 : pubPerTeacher >= 0.5 ? 20 : 10;
  metrics.push(metric('3.3.1', 'Scopus/WoS publications per teacher', pubScore, 50, `${pubPerTeacher.toFixed(2)}/teacher`));

  // 3.3.2 — UGC Care publications (20 marks)
  const ugcScore = Math.min(data.ugcPublications * 2, 20);
  metrics.push(metric('3.3.2', 'UGC Care publications', ugcScore, 20, `${data.ugcPublications} papers`));

  // 3.3.3 — Books and chapters (20 marks)
  const bookScore = Math.min(data.booksChapters * 4, 20);
  metrics.push(metric('3.3.3', 'Books / book chapters published', bookScore, 20, `${data.booksChapters} items`));

  // 3.4.1 — Extension activities (30 marks)
  const extScore = Math.min(data.extensionActivities * 3, 30);
  metrics.push(metric('3.4.1', 'Extension/outreach activities', extScore, 30, `${data.extensionActivities} activities`));

  // 3.4.2 — NSS/NCC student participation (10 marks)
  const nssPerc = data.totalStudents > 0 ? (data.nssNccStudents / data.totalStudents) * 100 : 0;
  metrics.push(metric('3.4.2', '% students in NSS/NCC/social programs', Math.min((nssPerc / 100) * 10, 10), 10, `${nssPerc.toFixed(1)}%`));

  // 3.5.1 — MoU collaborations (10 marks)
  const mouScore = Math.min(data.mouCount * 2, 10);
  const isC351EvMissing = data.mouCount > 0 && !data.uploadedEvidenceCodes?.includes('3.5.1');
  const c351Warnings = isC351EvMissing ? ["Missing signed MoU agreement files for 3.5.1"] : undefined;
  metrics.push(metric('3.5.1', 'Number of functional MoUs', mouScore, 10, `${data.mouCount} MoUs`, c351Warnings, isC351EvMissing));

  const totalScore = metrics.reduce((s, m) => s + m.score, 0);
  const maxScore = metrics.reduce((s, m) => s + m.maxScore, 0);
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    criterion: 3, title: 'Research, Innovations and Extension',
    totalScore, maxScore, percentage: Math.round(percentage * 10) / 10,
    weightage: WEIGHTAGES[3],
    weightedScore: maxScore > 0 ? (totalScore / maxScore) * WEIGHTAGES[3] : 0,
    metrics,
  };
}

// ─────────────────────────────────────────────
// CRITERION IV — Infrastructure (Max 100)
// ─────────────────────────────────────────────
export function computeCriterion4Score(data: {
  ictClassroomPercent: number;
  hasRamp: boolean; hasLift: boolean;
  libraryVolumes: number;
  eJournals: number;
  computerStudentRatio: number; // students per computer
  bandwidthMbps: number;
  totalStudents: number;
  wifiCoverage: number;
  maintenanceUtilizationPercent: number;
  uploadedEvidenceCodes?: string[];
}): CriterionScore {
  const metrics: MetricScore[] = [];

  // 4.1.1 — ICT-enabled classrooms (20 marks)
  const ictClassroomPct = Math.min(Math.max(data.ictClassroomPercent, 0), 100);
  metrics.push(metric('4.1.1', '% classrooms with ICT facilities', (ictClassroomPct / 100) * 20, 20, `${ictClassroomPct.toFixed(1)}%`));

  // 4.1.2 — Disabled-friendly infrastructure (10 marks)
  const disabledScore = (data.hasRamp ? 5 : 0) + (data.hasLift ? 5 : 0);
  metrics.push(metric('4.1.2', 'Disabled-friendly infrastructure', disabledScore, 10, `Ramp: ${data.hasRamp}, Lift: ${data.hasLift}`));

  // 4.2.1 — Library volumes (20 marks)
  const volScore = data.libraryVolumes >= 80000 ? 20 : data.libraryVolumes >= 50000 ? 15 : data.libraryVolumes >= 30000 ? 10 : data.libraryVolumes > 0 ? 5 : 0;
  const isC421EvMissing = data.libraryVolumes > 0 && !data.uploadedEvidenceCodes?.includes('4.2.1');
  const c421Warnings = isC421EvMissing ? ["Missing library automation/invoices ledger proof for 4.2.1"] : undefined;
  metrics.push(metric('4.2.1', 'Library volumes', volScore, 20, `${data.libraryVolumes.toLocaleString()} volumes`, c421Warnings, isC421EvMissing));

  // 4.2.2 — e-Journals access (10 marks)
  const ejScore = data.eJournals >= 5000 ? 10 : data.eJournals >= 2000 ? 7 : data.eJournals >= 500 ? 4 : data.eJournals > 0 ? 2 : 0;
  metrics.push(metric('4.2.2', 'e-Journals accessible', ejScore, 10, `${data.eJournals.toLocaleString()}`));

  // 4.3.1 — Student-to-computer ratio (20 marks)
  const compScore = data.computerStudentRatio <= 0 ? 0 : data.computerStudentRatio <= 2 ? 20 : data.computerStudentRatio <= 4 ? 15 : data.computerStudentRatio <= 6 ? 10 : 5;
  metrics.push(metric('4.3.1', 'Student-to-computer ratio', compScore, 20, data.computerStudentRatio > 0 ? `1:${data.computerStudentRatio.toFixed(1)}` : 'No computers'));

  // 4.3.2 — Internet bandwidth (10 marks)
  const bwPerStudent = data.totalStudents > 0 ? (data.bandwidthMbps * 1000) / data.totalStudents : 0; // Kbps per student
  const bwScore = bwPerStudent >= 100 ? 10 : bwPerStudent >= 50 ? 7 : bwPerStudent > 0 ? 4 : 0;
  metrics.push(metric('4.3.2', 'Internet bandwidth per student', bwScore, 10, `${bwPerStudent.toFixed(1)} Kbps/student`));

  // 4.3.3 — Wi-Fi coverage (10 marks)
  const wifiPct = Math.min(Math.max(data.wifiCoverage, 0), 100);
  metrics.push(metric('4.3.3', 'Campus Wi-Fi coverage', (wifiPct / 100) * 10, 10, `${wifiPct}%`));

  // 4.4.1 — Maintenance budget utilization (QnM) (10 marks)
  // Tiered scoring: ≥75% → 10, ≥50% → 7, ≥25% → 4, else 0
  const budgetScore =
    data.maintenanceUtilizationPercent >= 75 ? 10 :
    data.maintenanceUtilizationPercent >= 50 ? 7  :
    data.maintenanceUtilizationPercent >= 25 ? 4  : 0;
  metrics.push(metric(
    '4.4.1',
    'Maintenance budget utilization (QnM)',
    budgetScore,
    10,
    `${data.maintenanceUtilizationPercent.toFixed(1)}% utilized`,
  ));

  const totalScore = metrics.reduce((s, m) => s + m.score, 0);
  const maxScore = metrics.reduce((s, m) => s + m.maxScore, 0);
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    criterion: 4, title: 'Infrastructure and Learning Resources',
    totalScore, maxScore, percentage: Math.round(percentage * 10) / 10,
    weightage: WEIGHTAGES[4],
    weightedScore: maxScore > 0 ? (totalScore / maxScore) * WEIGHTAGES[4] : 0,
    metrics,
  };
}

// ─────────────────────────────────────────────
// CRITERION V — Student Support (Max 150)
// ─────────────────────────────────────────────
export function computeCriterion5Score(data: {
  totalScholarshipRecipients: number;
  totalStudents: number;
  totalScholarshipAmountINR: number;
  placementPercent: number;
  avgPackageLPA: number;
  competitiveExamQualifiedPercent: number;
  higherStudiesPercent: number;
  alumniAssociationActive: boolean;
  alumniMeetsPerYear: number;
  studentEventsCount: number;
  uploadedEvidenceCodes?: string[];
}): CriterionScore {
  const metrics: MetricScore[] = [];

  // 5.1.1 — % students receiving scholarships (30 marks)
  const scholarPerc = data.totalStudents > 0 ? (data.totalScholarshipRecipients / data.totalStudents) * 100 : 0;
  metrics.push(metric('5.1.1', '% students receiving scholarships', Math.min((scholarPerc / 100) * 30, 30), 30, `${scholarPerc.toFixed(1)}%`));

  // 5.1.2 — Total scholarship amount (20 marks)
  const amtScore = data.totalScholarshipAmountINR >= 10000000 ? 20 : data.totalScholarshipAmountINR >= 5000000 ? 15 : data.totalScholarshipAmountINR >= 2000000 ? 10 : data.totalScholarshipAmountINR > 0 ? 5 : 0;
  metrics.push(metric('5.1.2', 'Total scholarship amount disbursed', amtScore, 20, `₹${(data.totalScholarshipAmountINR / 100000).toFixed(1)}L`));

  // 5.2.1 — % students placed (40 marks)
  const placScore = data.placementPercent >= 80 ? 40 : data.placementPercent >= 60 ? 30 : data.placementPercent >= 40 ? 20 : data.placementPercent > 0 ? 10 : 0;
  metrics.push(metric('5.2.1', '% eligible students placed', placScore, 40, `${data.placementPercent.toFixed(1)}%`));

  // 5.2.2 — Higher studies progression (20 marks)
  const hsScore = data.higherStudiesPercent >= 20 ? 20 : data.higherStudiesPercent >= 10 ? 15 : data.higherStudiesPercent >= 5 ? 10 : data.higherStudiesPercent > 0 ? 5 : 0;
  metrics.push(metric('5.2.2', '% students proceeding to higher studies', hsScore, 20, `${data.higherStudiesPercent.toFixed(1)}%`));

  // 5.2.3 — Competitive exam qualified (20 marks)
  const ceScore = Math.min((data.competitiveExamQualifiedPercent / 100) * 20, 20);
  metrics.push(metric('5.2.3', '% students qualifying competitive exams', ceScore, 20, `${data.competitiveExamQualifiedPercent.toFixed(1)}%`));

  // 5.3.1 — Student activities/events (10 marks)
  const evtScore = Math.min(data.studentEventsCount * 2, 10);
  metrics.push(metric('5.3.1', 'Student activities and events', evtScore, 10, `${data.studentEventsCount} events`));

  // 5.4.1 — Alumni engagement (10 marks)
  const alumniScore = (data.alumniAssociationActive ? 5 : 0) + Math.min(data.alumniMeetsPerYear * 2, 5);
  const isC541EvMissing = data.alumniAssociationActive && !data.uploadedEvidenceCodes?.includes('5.4.1');
  const c541Warnings = isC541EvMissing ? ["Missing alumni association registration or annual reports for 5.4.1"] : undefined;
  metrics.push(metric('5.4.1', 'Alumni association & engagement', alumniScore, 10, data.alumniAssociationActive ? `Active, ${data.alumniMeetsPerYear} meets/yr` : 'Inactive', c541Warnings, isC541EvMissing));

  const totalScore = metrics.reduce((s, m) => s + m.score, 0);
  const maxScore = metrics.reduce((s, m) => s + m.maxScore, 0);
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    criterion: 5, title: 'Student Support and Progression',
    totalScore, maxScore, percentage: Math.round(percentage * 10) / 10,
    weightage: WEIGHTAGES[5],
    weightedScore: maxScore > 0 ? (totalScore / maxScore) * WEIGHTAGES[5] : 0,
    metrics,
  };
}

// ─────────────────────────────────────────────
// CRITERION VI — Governance (Max 100)
// ─────────────────────────────────────────────
export function computeCriterion6Score(data: {
  hasVisionMission: boolean;
  hasStrategicPlan: boolean;
  eGovernanceAvgPercent: number;
  adminCommitteesCount: number;
  academicBudgetPercent: number;
  hasInternalAudit: boolean;
  hasExternalAudit: boolean;
  iqacMeetingsPerYear: number;
  qualityInitiativesCount: number;
  nirfParticipated: boolean;
  aqarSubmittedYears: number;
  uploadedEvidenceCodes?: string[];
}): CriterionScore {
  const metrics: MetricScore[] = [];

  // 6.1.1 — Vision, Mission, Strategic Plan (20 marks)
  const vmScore = (data.hasVisionMission ? 10 : 0) + (data.hasStrategicPlan ? 10 : 0);
  const isC611EvMissing = data.hasStrategicPlan && !data.uploadedEvidenceCodes?.includes('6.1.1');
  const c611Warnings = isC611EvMissing ? ["Missing official strategic plan policy publication for 6.1.1"] : undefined;
  metrics.push(metric('6.1.1', 'Vision, Mission & Strategic Plan', vmScore, 20, `VM: ${data.hasVisionMission}, SP: ${data.hasStrategicPlan}`, c611Warnings, isC611EvMissing));

  // 6.2.1 — e-Governance implementation (30 marks)
  const egovScore = (data.eGovernanceAvgPercent / 100) * 30;
  metrics.push(metric('6.2.1', '% e-governance across areas', egovScore, 30, `${data.eGovernanceAvgPercent.toFixed(1)}% avg`));

  // 6.2.2 — Administrative committees (10 marks)
  const cmtScore = Math.min(data.adminCommitteesCount * 2, 10);
  metrics.push(metric('6.2.2', 'Functional administrative committees', cmtScore, 10, `${data.adminCommitteesCount} committees`));

  // 6.4.1 — % budget on academic activities (20 marks)
  const budgetScore = data.academicBudgetPercent >= 60 ? 20 : data.academicBudgetPercent >= 50 ? 15 : data.academicBudgetPercent >= 40 ? 10 : data.academicBudgetPercent > 0 ? 5 : 0;
  metrics.push(metric('6.4.1', '% budget on academic activities', budgetScore, 20, `${data.academicBudgetPercent.toFixed(1)}%`));

  // 6.4.2 — Audit compliance (10 marks)
  const auditScore = (data.hasInternalAudit ? 5 : 0) + (data.hasExternalAudit ? 5 : 0);
  const isC642EvMissing = (data.hasInternalAudit || data.hasExternalAudit) && !data.uploadedEvidenceCodes?.includes('6.4.2');
  const c642Warnings = isC642EvMissing ? ["Missing certified internal/external audit statements for 6.4.2"] : undefined;
  metrics.push(metric('6.4.2', 'Internal & external audit compliance', auditScore, 10, `Internal: ${data.hasInternalAudit}, External: ${data.hasExternalAudit}`, c642Warnings, isC642EvMissing));

  // 6.5.1 — IQAC meetings & initiatives (10 marks)
  const iqacMeetingOk = data.iqacMeetingsPerYear >= 4;
  const iqacScore = (iqacMeetingOk ? 5 : 2) + Math.min(data.qualityInitiativesCount, 5);
  metrics.push(metric('6.5.1', 'IQAC meetings & quality initiatives', iqacScore, 10, `${data.iqacMeetingsPerYear} meetings, ${data.qualityInitiativesCount} initiatives`));

  // 6.5.2 — NIRF / AQAR participation (10 marks)
  const partScore = (data.nirfParticipated ? 5 : 0) + Math.min(data.aqarSubmittedYears * 1, 5);
  metrics.push(metric('6.5.2', 'NIRF & AQAR participation', partScore, 10, `NIRF: ${data.nirfParticipated}, AQAR: ${data.aqarSubmittedYears} years`));

  const totalScore = metrics.reduce((s, m) => s + m.score, 0);
  const maxScore = metrics.reduce((s, m) => s + m.maxScore, 0);
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    criterion: 6, title: 'Governance, Leadership and Management',
    totalScore, maxScore, percentage: Math.round(percentage * 10) / 10,
    weightage: WEIGHTAGES[6],
    weightedScore: maxScore > 0 ? (totalScore / maxScore) * WEIGHTAGES[6] : 0,
    metrics,
  };
}

// ─────────────────────────────────────────────
// CRITERION VII — Institutional Values (Max 50)
// ─────────────────────────────────────────────
export function computeCriterion7Score(data: {
  genderProgramsCount: number;
  grievanceCellExists: boolean;
  antiHarassmentCommitteeExists: boolean;
  greenInitiativesChecklist: { solar: boolean; rainwater: boolean; composting: boolean; paperless: boolean; ewaste: boolean; led: boolean };
  inclusionActivitiesCount: number;
  bestPracticesComplete: number; // 0, 1, or 2 fully completed
  hasDistinctiveness: boolean;
  uploadedEvidenceCodes?: string[];
}): CriterionScore {
  const metrics: MetricScore[] = [];

  // 7.1.1 — Gender programs (10 marks)
  const genderScore = Math.min(data.genderProgramsCount * 1.5, 6) + (data.grievanceCellExists ? 2 : 0) + (data.antiHarassmentCommitteeExists ? 2 : 0);
  metrics.push(metric('7.1.1', 'Gender equity programs & facilities', Math.min(genderScore, 10), 10, `${data.genderProgramsCount} programs`));

  // 7.1.2 — Green campus initiatives (15 marks)
  const greenChecks = Object.values(data.greenInitiativesChecklist).filter(Boolean).length;
  const greenScore = (greenChecks / 6) * 15;
  metrics.push(metric('7.1.2', 'Green campus initiatives', greenScore, 15, `${greenChecks}/6 initiatives`));

  // 7.1.3 — Inclusion activities (10 marks)
  const inclScore = Math.min(data.inclusionActivitiesCount * 2, 10);
  metrics.push(metric('7.1.3', 'Inclusion activities for marginalized', inclScore, 10, `${data.inclusionActivitiesCount} activities`));

  // 7.2 — Best Practices (15 marks)
  const bpScore = data.bestPracticesComplete >= 2 ? 15 : data.bestPracticesComplete === 1 ? 8 : 0;
  const isC721EvMissing = data.bestPracticesComplete > 0 && !data.uploadedEvidenceCodes?.includes('7.2.1');
  const c721Warnings = isC721EvMissing ? ["Missing best practices case study evidence report for 7.2.1"] : undefined;
  metrics.push(metric('7.2.1', 'Best practices (2 required, 7 fields each)', bpScore, 15, `${data.bestPracticesComplete}/2 complete`, c721Warnings, isC721EvMissing));

  // 7.3 — Institutional Distinctiveness (10 marks)
  const bpDistinctScore = data.hasDistinctiveness ? 10 : 0;
  const isC731EvMissing = data.hasDistinctiveness && !data.uploadedEvidenceCodes?.includes('7.3.1');
  const c731Warnings = isC731EvMissing ? ["Missing institutional distinctiveness focus area narrative pdf for 7.3.1"] : undefined;
  metrics.push(metric('7.3.1', 'Institutional distinctiveness documented', bpDistinctScore, 10, data.hasDistinctiveness ? 'Documented' : 'Not documented', c731Warnings, isC731EvMissing));

  const totalScore = metrics.reduce((s, m) => s + m.score, 0);
  const maxScore = metrics.reduce((s, m) => s + m.maxScore, 0);
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    criterion: 7, title: 'Institutional Values and Best Practices',
    totalScore, maxScore, percentage: Math.round(percentage * 10) / 10,
    weightage: WEIGHTAGES[7],
    weightedScore: maxScore > 0 ? (totalScore / maxScore) * WEIGHTAGES[7] : 0,
    metrics,
  };
}

// ─────────────────────────────────────────────
// CONSOLIDATED SCORE AGGREGATION
// ─────────────────────────────────────────────
export function computeGrade(cgpa: number): string {
  if (cgpa >= 3.76) return 'A++';
  if (cgpa >= 3.51) return 'A+';
  if (cgpa >= 3.26) return 'A';
  if (cgpa >= 3.01) return 'B++';
  if (cgpa >= 2.76) return 'B+';
  if (cgpa >= 2.51) return 'B';
  if (cgpa >= 2.01) return 'C';
  return 'D';
}

export function aggregateScores(criteria: CriterionScore[]): {
  totalWeightedScore: number;
  cgpa: number;
  predictedGrade: string;
  completionPercent: number;
} {
  const totalWeightedScore = criteria.reduce((sum, c) => sum + c.weightedScore, 0);
  const totalMaxWeighted = criteria.reduce((sum, c) => sum + c.weightage, 0);
  // CGPA = (score / maxScore) * 4
  const cgpa = Math.round(((totalWeightedScore / totalMaxWeighted) * 4) * 100) / 100;
  const predictedGrade = computeGrade(cgpa);
  const completionPercent = Math.round((criteria.reduce((sum, c) => sum + c.percentage, 0) / (criteria.length * 100)) * 100);

  return { totalWeightedScore: Math.round(totalWeightedScore * 10) / 10, cgpa, predictedGrade, completionPercent };
}

// Flag metrics below 30% for attention
export function getGapAnalysis(criteria: CriterionScore[]) {
  const flagged: Array<{ criterion: number; criterionTitle: string; metric: MetricScore; gap: number; priority: 'HIGH' | 'MEDIUM' }> = [];
  for (const c of criteria) {
    for (const m of c.metrics) {
      if (m.flag !== 'GREEN') {
        flagged.push({
          criterion: c.criterion, criterionTitle: c.title, metric: m,
          gap: m.maxScore - m.score,
          priority: m.flag === 'RED' ? 'HIGH' : 'MEDIUM',
        });
      }
    }
  }
  return flagged.sort((a, b) => b.gap - a.gap);
}
