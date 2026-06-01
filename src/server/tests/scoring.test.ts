// src/server/tests/scoring.test.ts
// Native Node.js Unit Tests for the NAAC Scoring Engine
// Run with: node --import tsx --test src/server/tests/scoring.test.ts

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  computeCriterion1Score,
  computeCriterion2Score,
  computeCriterion3Score,
  computeCriterion4Score,
  computeCriterion5Score,
  computeCriterion6Score,
  computeCriterion7Score,
  aggregateScores,
  computeGrade
} from '../services/scoringEngine';

describe('NAAC SSR Scoring Engine — Unit Tests', () => {

  // ═══════════════════════════════════════════════════════════════════════════
  //  1. CRITERION I EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Criterion 1 — Curricular Aspects', () => {

    test('Edge Case: Zero Enrollment & Omitted Data (Prevent division by zero)', () => {
      const zeroData = {
        totalPrograms: 0,
        programsWithBoS: 0,
        programsWithIndustryFeedback: 0,
        coursesWithEmployabilityFocus: 0,
        totalCoursesCount: 0,
        newCoursesCount: 0,
        programsWithCBCS: 0,
        integratesEthicsIssues: false,
        valueAddedCoursesCount: 0,
        valueAddedEnrollment: 0,
        totalStudents: 0,
        studentsInProjectsCount: 0,
        feedbackStakeholderCount: 0,
        feedbackActionTaken: false
      };

      const result = computeCriterion1Score(zeroData);

      // Verify no NaN or Infinity is generated
      assert.strictEqual(result.totalScore, 0);
      assert.strictEqual(result.maxScore, 150);
      assert.strictEqual(result.percentage, 0);
      assert.strictEqual(result.weightedScore, 0);
      
      // Enforce RED alerts on zero completion
      assert.strictEqual(result.metrics[0].flag, 'RED');
      assert.strictEqual(result.metrics[3].flag, 'RED');
    });

    test('Normal Scenario: Partial / Under-performing stats', () => {
      const partialData = {
        totalPrograms: 10,
        programsWithBoS: 5,               // 50% -> 10/20 marks
        programsWithIndustryFeedback: 2,   // 20% -> 4/20 marks
        coursesWithEmployabilityFocus: 30, // 30/100 -> 3/10 marks
        totalCoursesCount: 100,
        newCoursesCount: 10,               // 10/100 -> 3/30 marks
        programsWithCBCS: 8,               // 80% -> 16/20 marks
        integratesEthicsIssues: true,      // 5/5 marks
        valueAddedCoursesCount: 3,         // 3 courses -> 6/10 marks
        valueAddedEnrollment: 100,         // 100/1000 = 10% -> 1/10 marks
        totalStudents: 1000,
        studentsInProjectsCount: 200,      // 200/1000 = 20% -> 1/5 marks
        feedbackStakeholderCount: 2,       // 2/4 -> 5/10 marks
        feedbackActionTaken: true          // ATR available -> 10/10 marks
      };

      const result = computeCriterion1Score(partialData);
      
      assert.strictEqual(result.metrics.find(m => m.code === '1.1.1')?.score, 10);
      assert.strictEqual(result.metrics.find(m => m.code === '1.1.2')?.score, 4);
      assert.strictEqual(result.metrics.find(m => m.code === '1.1.3')?.score, 3);
      assert.strictEqual(result.metrics.find(m => m.code === '1.2.1')?.score, 3);
      assert.strictEqual(result.metrics.find(m => m.code === '1.2.2')?.score, 16);
      assert.strictEqual(result.metrics.find(m => m.code === '1.3.1')?.score, 5);
      assert.strictEqual(result.metrics.find(m => m.code === '1.3.2')?.score, 6);
      assert.strictEqual(result.metrics.find(m => m.code === '1.3.3')?.score, 1);
      assert.strictEqual(result.metrics.find(m => m.code === '1.3.4')?.score, 1);
      assert.strictEqual(result.metrics.find(m => m.code === '1.4.1')?.score, 5);
      assert.strictEqual(result.metrics.find(m => m.code === '1.4.2')?.score, 10);

      const expectedTotal = 10 + 4 + 3 + 3 + 16 + 5 + 6 + 1 + 1 + 5 + 10; // 64
      assert.strictEqual(result.totalScore, expectedTotal);
      assert.strictEqual(result.percentage, 42.7);
    });

    test('Maximum Scenario: Perfect marks & Caps validation', () => {
      const maxData = {
        totalPrograms: 10,
        programsWithBoS: 10,               // 100% -> 20/20 marks
        programsWithIndustryFeedback: 10,  // 100% -> 20/20 marks
        coursesWithEmployabilityFocus: 100, // 100% -> 10/10 marks
        totalCoursesCount: 100,
        newCoursesCount: 100,              // 100% -> 30/30 marks
        programsWithCBCS: 10,              // 100% -> 20/20 marks
        integratesEthicsIssues: true,      // 5/5 marks
        valueAddedCoursesCount: 5,         // 5 courses -> 10/10 marks
        valueAddedEnrollment: 1000,        // 100% -> 10/10 marks
        totalStudents: 1000,
        studentsInProjectsCount: 1000,     // 100% -> 5/5 marks
        feedbackStakeholderCount: 4,       // 4/4 -> 10/10 marks
        feedbackActionTaken: true          // ATR available -> 10/10 marks
      };

      const result = computeCriterion1Score(maxData);

      assert.strictEqual(result.totalScore, 150);
      assert.strictEqual(result.percentage, 100);
      assert.strictEqual(result.weightedScore, 150);
      
      // All flags should be GREEN
      result.metrics.forEach(m => {
        assert.strictEqual(m.flag, 'GREEN');
      });
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  2. CRITERION II EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Criterion 2 — Teaching-Learning and Evaluation', () => {

    test('Edge Case: Zero base counts', () => {
      const zeroData = {
        totalSanctioned: 0,
        totalEnrolled: 0,
        reservedSanctioned: 0,
        reservedEnrolled: 0,
        slowLearnerProgramsCount: 0,
        totalStudents: 0,
        totalFaculty: 0,
        studentsPerMentor: 0,
        experientialMethodsImplemented: false,
        ictPercent: 0,
        lmsUsed: false,
        vacancyPercent: 0,
        phdPercent: 0,
        avgTeachingExperienceYears: 0,
        awardsCount: 0,
        avgDaysExamToResult: 0,
        examComplaintsPercent: 0,
        examITReformsImplemented: false,
        automationStatus: false,
        posCosDefined: false,
        posCosAttainmentEvaluated: false,
        avgPassPercent: 0,
        studentSatisfactionRate: 0
      };

      const result = computeCriterion2Score(zeroData);

      assert.ok(!isNaN(result.totalScore));
      assert.strictEqual(result.maxScore, 200);
    });

    test('Threshold Scenario: student-to-mentor scoring bands', () => {
      // 1:15 ratio should yield maximum 10 marks for Student-Teacher ratio, and studentPerMentor 15 should yield 8 marks
      const perfectRatio = computeCriterion2Score({
        totalSanctioned: 100, totalEnrolled: 100, reservedSanctioned: 50, reservedEnrolled: 50,
        slowLearnerProgramsCount: 2, totalStudents: 100, totalFaculty: 10, studentsPerMentor: 15, // ST ratio = 10, SSS = 80% -> 24 marks
        experientialMethodsImplemented: true, ictPercent: 100, lmsUsed: true, vacancyPercent: 0,
        phdPercent: 80, avgTeachingExperienceYears: 10, awardsCount: 1, avgDaysExamToResult: 14,
        examComplaintsPercent: 0.5, examITReformsImplemented: true, automationStatus: true,
        posCosDefined: true, posCosAttainmentEvaluated: true, avgPassPercent: 95, studentSatisfactionRate: 90
      });
      assert.strictEqual(perfectRatio.metrics.find(m => m.code === '2.2.2')?.score, 10);
      assert.strictEqual(perfectRatio.metrics.find(m => m.code === '2.3.3')?.score, 8);

      // 1:25 ratio should yield medium 6 marks for studentPerMentor
      const mediumRatio = computeCriterion2Score({
        totalSanctioned: 100, totalEnrolled: 100, reservedSanctioned: 50, reservedEnrolled: 50,
        slowLearnerProgramsCount: 2, totalStudents: 100, totalFaculty: 4, studentsPerMentor: 25,
        experientialMethodsImplemented: true, ictPercent: 100, lmsUsed: true, vacancyPercent: 0,
        phdPercent: 80, avgTeachingExperienceYears: 10, awardsCount: 1, avgDaysExamToResult: 14,
        examComplaintsPercent: 0.5, examITReformsImplemented: true, automationStatus: true,
        posCosDefined: true, posCosAttainmentEvaluated: true, avgPassPercent: 95, studentSatisfactionRate: 90
      });
      assert.strictEqual(mediumRatio.metrics.find(m => m.code === '2.2.2')?.score, 5);
      assert.strictEqual(mediumRatio.metrics.find(m => m.code === '2.3.3')?.score, 6);
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  3. CRITERION III EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Criterion 3 — Research, Innovations and Extension', () => {

    test('Edge Case: Zero base counts (No crashes/NaNs)', () => {
      const result = computeCriterion3Score({
        totalGrantsINR: 0,
        totalFaculty: 0,
        activeProjects: 0,
        patentsGranted: 0,
        patentsFiled: 0,
        scopusPublications: 0,
        ugcPublications: 0,
        booksChapters: 0,
        extensionActivities: 0,
        nssNccStudents: 0,
        totalStudents: 0,
        mouCount: 0
      });
      assert.strictEqual(result.totalScore, 15); // Mathematically 5 (grants) + 10 (pubs) = 15
      assert.strictEqual(result.maxScore, 250);
      assert.ok(!isNaN(result.totalScore));
    });

    test('Normal Scenario: Mid-range statistics', () => {
      const result = computeCriterion3Score({
        totalGrantsINR: 1500000, // ₹1.5M / 10 = ₹150K per teacher -> 20 marks
        totalFaculty: 10,
        activeProjects: 3,       // 3 projects * 2 = 6 marks
        patentsGranted: 1,       // 1 granted * 10 = 10 marks
        patentsFiled: 2,         // 2 filed * 2 = 4 marks -> patent score 14 marks
        scopusPublications: 8,   // 8 Scopus / 10 teachers = 0.8 pub/teacher -> 20 marks
        ugcPublications: 4,      // 4 publications * 2 = 8 marks
        booksChapters: 2,        // 2 books * 4 = 8 marks
        extensionActivities: 4,  // 4 activities * 3 = 12 marks
        nssNccStudents: 200,     // 200 / 1000 = 20% NSS -> 2 marks
        totalStudents: 1000,
        mouCount: 3              // 3 MoUs * 2 = 6 marks
      });
      assert.strictEqual(result.totalScore, 20 + 6 + 14 + 20 + 8 + 8 + 12 + 2 + 6); // 96 marks
      assert.strictEqual(result.percentage, 38.4);
    });

    test('Maximum Scenario: High funding and papers (Capped validation)', () => {
      const result = computeCriterion3Score({
        totalGrantsINR: 10000000, // ₹1M per teacher -> 50 marks max
        totalFaculty: 10,
        activeProjects: 15,       // 15 projects * 2 = 30 -> capped at 20 marks
        patentsGranted: 5,        // 5 * 10 = 50 -> capped at 40 marks
        patentsFiled: 5,
        scopusPublications: 30,   // 3 pub/teacher -> 50 marks max
        ugcPublications: 15,      // 15 * 2 = 30 -> capped at 20 marks
        booksChapters: 10,        // 10 * 4 = 40 -> capped at 20 marks
        extensionActivities: 15,  // 15 * 3 = 45 -> capped at 30 marks
        nssNccStudents: 1000,     // 100% -> 10 marks
        totalStudents: 1000,
        mouCount: 10              // 10 MoUs * 2 = 20 -> capped at 10 marks
      });
      assert.strictEqual(result.totalScore, 250); // Fully capped perfect score
      assert.strictEqual(result.percentage, 100);
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  4. CRITERION IV EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Criterion 4 — Infrastructure and Learning Resources', () => {

    test('Edge Case: Zero base counts', () => {
      const result = computeCriterion4Score({
        ictClassroomPercent: 0,
        hasRamp: false,
        hasLift: false,
        libraryVolumes: 0,
        eJournals: 0,
        computerStudentRatio: 0,
        bandwidthMbps: 0,
        totalStudents: 0,
        wifiCoverage: 0,
        maintenanceUtilizationPercent: 0
      });
      assert.strictEqual(result.totalScore, 0); // Correctly yields 0 with no library, computer, or bandwidth data
      assert.strictEqual(result.maxScore, 110); // 7 original metrics (100) + 4.4.1 budget utilization (10) = 110
      assert.ok(!isNaN(result.totalScore));
    });

    test('Maximum Scenario: Excellent facilities', () => {
      const result = computeCriterion4Score({
        ictClassroomPercent: 100, // 20 marks
        hasRamp: true,            // 5 marks
        hasLift: true,            // 5 marks
        libraryVolumes: 90000,    // 20 marks
        eJournals: 6000,          // 10 marks
        computerStudentRatio: 1.5, // 1:1.5 ratio -> 20 marks
        bandwidthMbps: 1000,      // 1000 Mbps for 1000 students = 1000 Kbps/student -> 10 marks
        totalStudents: 1000,
        wifiCoverage: 100,        // 10 marks
        maintenanceUtilizationPercent: 95
      });
      assert.strictEqual(result.totalScore, 110); // 100 (original 7 metrics) + 10 (4.4.1 budget ≥75%) = 110
      assert.strictEqual(result.percentage, 100);
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  5. CRITERION V EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Criterion 5 — Student Support and Progression', () => {

    test('Edge Case: Zero base counts', () => {
      const result = computeCriterion5Score({
        totalScholarshipRecipients: 0,
        totalStudents: 0,
        totalScholarshipAmountINR: 0,
        placementPercent: 0,
        avgPackageLPA: 0,
        competitiveExamQualifiedPercent: 0,
        higherStudiesPercent: 0,
        alumniAssociationActive: false,
        alumniMeetsPerYear: 0,
        studentEventsCount: 0
      });
      assert.strictEqual(result.totalScore, 0); // Correctly yields 0 with no scholarships, placements, or alumni data
      assert.strictEqual(result.maxScore, 150);
      assert.ok(!isNaN(result.totalScore));
    });

    test('Maximum Scenario: Capped statistics', () => {
      const result = computeCriterion5Score({
        totalScholarshipRecipients: 1000,
        totalStudents: 1000,
        totalScholarshipAmountINR: 12000000, // ₹12M -> 20 marks
        placementPercent: 90,                // 90% Placed -> 40 marks
        avgPackageLPA: 12,
        competitiveExamQualifiedPercent: 100, // 100% -> 20 marks
        higherStudiesPercent: 25,             // 25% -> 20 marks
        alumniAssociationActive: true,        // 5 marks
        alumniMeetsPerYear: 4,                // 4 meets * 2 = 8 -> capped at 5 marks (total 10 marks for alumni)
        studentEventsCount: 10                // 10 events * 2 = 20 -> capped at 10 marks
      });
      assert.strictEqual(result.totalScore, 150);
      assert.strictEqual(result.percentage, 100);
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  6. CRITERION VI EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Criterion 6 — Governance, Leadership and Management', () => {

    test('Edge Case: Zero base counts', () => {
      const result = computeCriterion6Score({
        hasVisionMission: false,
        hasStrategicPlan: false,
        eGovernanceAvgPercent: 0,
        adminCommitteesCount: 0,
        academicBudgetPercent: 0,
        hasInternalAudit: false,
        hasExternalAudit: false,
        iqacMeetingsPerYear: 0,
        qualityInitiativesCount: 0,
        nirfParticipated: false,
        aqarSubmittedYears: 0
      });
      assert.strictEqual(result.totalScore, 2); // Only gets 2 minimum marks for meetings count <= 0
      assert.strictEqual(result.maxScore, 110); // Sum of metric max marks
      assert.ok(!isNaN(result.totalScore));
    });

    test('Maximum Scenario: Full e-governance & budgets', () => {
      const result = computeCriterion6Score({
        hasVisionMission: true,   // 10 marks
        hasStrategicPlan: true,   // 10 marks
        eGovernanceAvgPercent: 100, // 30 marks
        adminCommitteesCount: 10, // 10*2 = 20 -> capped at 10 marks
        academicBudgetPercent: 75, // 75% -> 20 marks
        hasInternalAudit: true,   // 5 marks
        hasExternalAudit: true,   // 5 marks
        iqacMeetingsPerYear: 4,   // 4 meets -> 5 marks + 5 quality initiatives = 10 marks
        qualityInitiativesCount: 5,
        nirfParticipated: true,   // 5 marks + 5 years AQAR = 10 marks
        aqarSubmittedYears: 5
      });
      assert.strictEqual(result.totalScore, 110);
      assert.strictEqual(result.maxScore, 110);
      assert.strictEqual(result.percentage, 100);
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  7. CRITERION VII EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Criterion 7 — Institutional Values and Best Practices', () => {

    test('Edge Case: Zero base counts', () => {
      const result = computeCriterion7Score({
        genderProgramsCount: 0,
        grievanceCellExists: false,
        antiHarassmentCommitteeExists: false,
        greenInitiativesChecklist: { solar: false, rainwater: false, composting: false, paperless: false, ewaste: false, led: false },
        inclusionActivitiesCount: 0,
        bestPracticesComplete: 0,
        hasDistinctiveness: false
      });
      assert.strictEqual(result.totalScore, 0);
      assert.strictEqual(result.maxScore, 60); // Sum of metric max marks
      assert.ok(!isNaN(result.totalScore));
    });

    test('Maximum Scenario: Fully compliant', () => {
      const result = computeCriterion7Score({
        genderProgramsCount: 8,                  // 8*1.5 = 12 -> capped + facilities = 10 marks
        grievanceCellExists: true,
        antiHarassmentCommitteeExists: true,
        greenInitiativesChecklist: { solar: true, rainwater: true, composting: true, paperless: true, ewaste: true, led: true }, // 6/6 -> 15 marks
        inclusionActivitiesCount: 5,             // 5*2 = 10 marks
        bestPracticesComplete: 2,                // 2 practice -> 15 marks
        hasDistinctiveness: true                 // 10 marks
      });
      assert.strictEqual(result.totalScore, 60);
      assert.strictEqual(result.maxScore, 60);
      assert.strictEqual(result.percentage, 100);
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  8. ACCREDITATION CONSOLIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Consolidated Score & predictedGrade bounds', () => {

    test('CGPA Grade Bands', () => {
      assert.strictEqual(computeGrade(3.80), 'A++');
      assert.strictEqual(computeGrade(3.76), 'A++');
      assert.strictEqual(computeGrade(3.75), 'A+');
      assert.strictEqual(computeGrade(3.55), 'A+');
      assert.strictEqual(computeGrade(3.51), 'A+');
      assert.strictEqual(computeGrade(3.50), 'A');
      assert.strictEqual(computeGrade(3.30), 'A');
      assert.strictEqual(computeGrade(3.26), 'A');
      assert.strictEqual(computeGrade(3.25), 'B++');
      assert.strictEqual(computeGrade(3.15), 'B++');
      assert.strictEqual(computeGrade(3.01), 'B++');
      assert.strictEqual(computeGrade(3.00), 'B+');
      assert.strictEqual(computeGrade(2.85), 'B+');
      assert.strictEqual(computeGrade(2.76), 'B+');
      assert.strictEqual(computeGrade(2.75), 'B');
      assert.strictEqual(computeGrade(2.55), 'B');
      assert.strictEqual(computeGrade(2.51), 'B');
      assert.strictEqual(computeGrade(2.50), 'C');
      assert.strictEqual(computeGrade(2.10), 'C');
      assert.strictEqual(computeGrade(2.01), 'C');
      assert.strictEqual(computeGrade(2.00), 'D');
      assert.strictEqual(computeGrade(1.80), 'D');
    });

    test('Consolidated aggregate and scaled score calculations', () => {
      // Stub 7 Criteria as all achieving 50% completion
      const halfCompletionCriteria = Array.from({ length: 7 }, (_, i) => ({
        criterion: i + 1,
        title: `Criterion ${i + 1}`,
        totalScore: 50,
        maxScore: 100,
        percentage: 50,
        weightage: i + 1 === 1 ? 150 : i + 1 === 2 ? 200 : i + 1 === 3 ? 250 : i + 1 === 4 ? 100 : i + 1 === 5 ? 150 : i + 1 === 6 ? 100 : 50,
        weightedScore: (50 / 100) * (i + 1 === 1 ? 150 : i + 1 === 2 ? 200 : i + 1 === 3 ? 250 : i + 1 === 4 ? 100 : i + 1 === 5 ? 150 : i + 1 === 6 ? 100 : 50),
        metrics: []
      }));

      const agg = aggregateScores(halfCompletionCriteria);
      
      // Total weightage = 1000. Achieved = 50% across all -> Weighted Score = 500
      assert.strictEqual(agg.totalWeightedScore, 500);
      
      // CGPA = (500/1000) * 4 = 2.00
      assert.strictEqual(agg.cgpa, 2.00);
      assert.strictEqual(agg.predictedGrade, 'D'); // correctly returns 'D' since 2.00 is <= 2.00
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  9. ROBUST EDGE CASES & WARNING INTEGRITY
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Robust Edge Case Handling & Missing Evidence Warnings', () => {

    test('Verify Missing Evidence Warnings are flagged correctly', () => {
      // Programs with BoS but NO minutes or uploaded code should trigger a warning
      const result = computeCriterion1Score({
        totalPrograms: 5,
        programsWithBoS: 3,
        programsWithIndustryFeedback: 0,
        coursesWithEmployabilityFocus: 0,
        totalCoursesCount: 100,
        newCoursesCount: 0,
        programsWithCBCS: 5,
        integratesEthicsIssues: false,
        valueAddedCoursesCount: 0,
        valueAddedEnrollment: 0,
        totalStudents: 100,
        studentsInProjectsCount: 0,
        feedbackStakeholderCount: 0,
        feedbackActionTaken: false,
        uploadedEvidenceCodes: [], // empty list
        hasBoSMinutes: false
      });

      const bosMetric = result.metrics.find(m => m.code === '1.1.1');
      assert.strictEqual(bosMetric?.isEvidenceMissing, true);
      assert.ok(bosMetric?.warnings && bosMetric.warnings.length > 0);
      assert.ok(bosMetric.warnings[0].includes("Missing BoS meeting minutes"));
    });

    test('Verify BoS Evidence warning is cleared if minutes are present', () => {
      const result = computeCriterion1Score({
        totalPrograms: 5,
        programsWithBoS: 3,
        programsWithIndustryFeedback: 0,
        coursesWithEmployabilityFocus: 0,
        totalCoursesCount: 100,
        newCoursesCount: 0,
        programsWithCBCS: 5,
        integratesEthicsIssues: false,
        valueAddedCoursesCount: 0,
        valueAddedEnrollment: 0,
        totalStudents: 100,
        studentsInProjectsCount: 0,
        feedbackStakeholderCount: 0,
        feedbackActionTaken: false,
        uploadedEvidenceCodes: [],
        hasBoSMinutes: true // minutes URL present
      });

      const bosMetric = result.metrics.find(m => m.code === '1.1.1');
      assert.notStrictEqual(bosMetric?.isEvidenceMissing, true);
      assert.strictEqual(bosMetric?.warnings, undefined);
    });

    test('Verify safe handling of zero students / zero computers in computer ratio', () => {
      const result = computeCriterion4Score({
        ictClassroomPercent: 0,
        hasRamp: false,
        hasLift: false,
        libraryVolumes: 0,
        eJournals: 0,
        computerStudentRatio: 0, // no computer data / division by zero safety
        bandwidthMbps: 0,
        totalStudents: 0,
        wifiCoverage: 0,
        maintenanceUtilizationPercent: 0,
        uploadedEvidenceCodes: []
      });

      const compRatioMetric = result.metrics.find(m => m.code === '4.3.1');
      assert.strictEqual(compRatioMetric?.score, 0); // 0 computers should yield 0 score safely
      assert.strictEqual(compRatioMetric?.value, 'No computers');
    });

  });

});

