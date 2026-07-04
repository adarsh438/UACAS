import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING CLIENT RESET ---');
  console.log('WARNING: This will delete ALL transactional NAAC data, keeping only University and User records.');
  
  // Wait 3 seconds to allow cancellation if run accidentally
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // 1. Delete all Evidence and Audit Logs
    await prisma.evidence.deleteMany();
    await prisma.auditLog.deleteMany();
    console.log('✅ Cleared Evidence & Audit Logs');

    // 2. Delete all Criterion 7 (Values)
    await prisma.genderProgram.deleteMany();
    await prisma.greenInitiative.deleteMany();
    await prisma.inclusionActivity.deleteMany();
    await prisma.bestPractice.deleteMany();
    await prisma.institutionalDistinctiveness.deleteMany();
    console.log('✅ Cleared Criterion 7');

    // 3. Delete all Criterion 6 (Governance)
    await prisma.visionMission.deleteMany();
    await prisma.eGovernanceRecord.deleteMany();
    await prisma.adminCommittee.deleteMany();
    await prisma.financialRecord.deleteMany();
    await prisma.iQACRecord.deleteMany();
    console.log('✅ Cleared Criterion 6');

    // 4. Delete all Criterion 5 (Student Support)
    await prisma.scholarship.deleteMany();
    await prisma.placementRecord.deleteMany();
    await prisma.competitiveExamResult.deleteMany();
    await prisma.studentActivity.deleteMany();
    await prisma.alumniRecord.deleteMany();
    console.log('✅ Cleared Criterion 5');

    // 5. Delete all Criterion 4 (Infrastructure)
    await prisma.physicalFacility.deleteMany();
    await prisma.libraryRecord.deleteMany();
    await prisma.iTInfrastructure.deleteMany();
    await prisma.maintenanceBudget.deleteMany();
    console.log('✅ Cleared Criterion 4');

    // 6. Delete all Criterion 3 (Research)
    await prisma.researchGrant.deleteMany();
    await prisma.researchProject.deleteMany();
    await prisma.patent.deleteMany();
    await prisma.startup.deleteMany();
    await prisma.publication.deleteMany();
    await prisma.extensionActivity.deleteMany();
    await prisma.moU.deleteMany();
    console.log('✅ Cleared Criterion 3');

    // 7. Delete all Criterion 2 (Teaching-Learning)
    await prisma.enrollmentRecord.deleteMany();
    await prisma.remedialProgram.deleteMany();
    await prisma.mentoringData.deleteMany();
    await prisma.teacherICTRecord.deleteMany();
    await prisma.fDPRecord.deleteMany();
    await prisma.examRecord.deleteMany();
    await prisma.learningOutcomeRecord.deleteMany();
    console.log('✅ Cleared Criterion 2');

    // 8. Delete all Criterion 1 (Curricular)
    await prisma.bosMeeting.deleteMany();
    await prisma.newCourse.deleteMany();
    await prisma.valueAddedCourse.deleteMany();
    await prisma.mOOCEnrollment.deleteMany();
    await prisma.feedbackRecord.deleteMany();
    console.log('✅ Cleared Criterion 1');

    // 9. Delete external modules
    await prisma.nbaCoAttainment.deleteMany();
    await prisma.nbaPoAttainment.deleteMany();
    await prisma.nbaCoPoMapping.deleteMany();
    await prisma.nbaCourseOutcome.deleteMany();
    await prisma.nbaProgramOutcome.deleteMany();
    await prisma.nbaProgram.deleteMany();
    await prisma.nirfParameter.deleteMany();
    await prisma.nirfPerception.deleteMany();
    await prisma.aqarIqacActivity.deleteMany();
    await prisma.aqarRecord.deleteMany();
    console.log('✅ Cleared NBA, NIRF, AQAR');

    // 10. Delete Academics & Curriculum mapping
    await prisma.cO.deleteMany();
    await prisma.course.deleteMany();
    await prisma.pO.deleteMany();
    await prisma.pSO.deleteMany();
    await prisma.program.deleteMany();
    await prisma.student.deleteMany();
    await prisma.faculty.deleteMany();
    await prisma.department.deleteMany();
    console.log('✅ Cleared Departments, Programs, Faculty, Students, Outcomes');

    // 11. Delete all generated NaacScores and Accreditations
    await prisma.naacScore.deleteMany();
    await prisma.accreditationRecord.deleteMany();
    console.log('✅ Cleared Scores');

    // Reset setup flag for all universities
    await prisma.university.updateMany({
      data: { setupCompleted: false }
    });
    
    // Force all users to change password on next login
    await prisma.user.updateMany({
      data: { mustChangePassword: true }
    });
    
    console.log('✅ Reset university setup flag and user password enforcement');

    console.log('--- RESET COMPLETE ---');
    console.log('The database is now clean and ready for a fresh client installation.');
  } catch (error) {
    console.error('Failed to reset database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
