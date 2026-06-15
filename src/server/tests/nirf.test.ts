import test from 'node:test';
import assert from 'node:assert/strict';
import { computeNirfScores } from '../services/nirfScoringEngine';

test('NIRF Scoring Engine', async (t) => {
  await t.test('Should compute NIRF scores correctly based on input data', () => {
    const mockInput = {
      tlr: {
        totalStudents: 1000,
        totalFaculty: 50,
        sanctionedPosts: 50,
        phdFaculty: 25,
        avgExperienceYears: 10,
        totalExpenditure: 10000000,
        capitalExpenditure: 5000000,
        femaleStudents: 400,
        economicallyBackwardStudents: 200,
      },
      rp: {
        publicationsCount: 100,
        citationsCount: 500,
        scopusPublications: 80,
        patentsPublished: 5,
        patentsGranted: 2,
        fundedProjects: 10,
        fundingAmount: 5000000,
        fpppAmount: 2000000,
      },
      go: {
        graduatesLastYear: 200,
        placedStudents: 150,
        higherStudiesStudents: 30,
        medianSalary: 600000,
        phdGraduates: 5,
        totalStudentsGO: 200,
      },
      oi: {
        femaleStudentsPercent: 40,
        economicallyBackwardPercent: 20,
        facilitiesForDifferentlyAbled: true,
        femaleStudentsPhd: 2,
        totalPhDStudents: 10,
        regionalDiversityScore: 50,
      },
      pr: {
        peerScore: 80,
        employerScore: 75,
      }
    };

    const result = computeNirfScores(mockInput);
    
    assert.ok(result.tlr.score >= 0 && result.tlr.score <= 100, 'TLR Score out of bounds');
    assert.ok(result.rp.score >= 0 && result.rp.score <= 100, 'RP Score out of bounds');
    assert.ok(result.go.score >= 0 && result.go.score <= 100, 'GO Score out of bounds');
    assert.ok(result.oi.score >= 0 && result.oi.score <= 100, 'OI Score out of bounds');
    assert.ok(result.pr.score >= 0 && result.pr.score <= 100, 'PR Score out of bounds');
    assert.ok(result.totalScore >= 0 && result.totalScore <= 100, 'Total Score out of bounds');
  });
});
