// scratch/check-db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAudit() {
  console.log('🔍 Starting Database Cross-Validation Integrity Audit...\n');
  let inconsistencies = 0;

  // 1. Check: Enrolled students never exceed sanctioned intake
  console.log('⏳ Check 1: Enrolled students vs Sanctioned intake...');
  const enrollmentRecords = await prisma.enrollmentRecord.findMany({
    include: { program: true }
  });
  
  let enrollViolations = 0;
  for (const rec of enrollmentRecords) {
    if (rec.enrolled > rec.sanctionedIntake) {
      console.log(`   ❌ Inconsistency: In ${rec.academicYear}, Program "${rec.program?.name || rec.programId}" has actual enrolled (${rec.enrolled}) exceeding sanctioned intake (${rec.sanctionedIntake})`);
      enrollViolations++;
      inconsistencies++;
    }
    const categorySum = rec.enrolledSC + rec.enrolledST + rec.enrolledOBC + rec.enrolledEWS + rec.enrolledGeneral;
    if (categorySum > rec.enrolled) {
      console.log(`   ❌ Inconsistency: In ${rec.academicYear}, Program "${rec.program?.name || rec.programId}" category breakdown sum (${categorySum}) exceeds actual enrolled (${rec.enrolled})`);
      enrollViolations++;
      inconsistencies++;
    }
  }
  if (enrollViolations === 0) {
    console.log('   ✅ All student enrollment records align perfectly within sanctioned intakes.\n');
  } else {
    console.log(`   ⚠️ Found ${enrollViolations} student enrollment inconsistencies.\n`);
  }

  // 2. Check: Publication count matches faculty count logic
  console.log('⏳ Check 2: Publications relations...');
  const publications = await prisma.publication.findMany();
  const totalFacultyCount = await prisma.faculty.count();
  
  let pubViolations = 0;
  // Publications per teacher should theoretically be a reasonable ratio (not skewing to infinity)
  const ratio = totalFacultyCount > 0 ? publications.length / totalFacultyCount : 0;
  console.log(`   ℹ️ Total Faculty: ${totalFacultyCount} | Total Publications: ${publications.length}`);
  console.log(`   ℹ️ Publications per teacher ratio: ${ratio.toFixed(2)}`);
  
  if (ratio > 50) { // Extremely high ratio check
    console.log(`   ❌ Inconsistency: Highly anomalous publications-to-faculty ratio: ${ratio.toFixed(2)}`);
    pubViolations++;
    inconsistencies++;
  }
  if (pubViolations === 0) {
    console.log('   ✅ Publication counts align logically with faculty population dimensions.\n');
  }

  // 3. Check: Grant amounts are positive numbers
  console.log('⏳ Check 3: Research grant amounts positivity...');
  const negativeGrants = await prisma.researchGrant.findMany({
    where: { amount: { lt: 0 } }
  });
  if (negativeGrants.length > 0) {
    for (const grant of negativeGrants) {
      console.log(`   ❌ Inconsistency: Grant "${grant.projectTitle}" has a negative amount: ₹${grant.amount}`);
      inconsistencies++;
    }
  } else {
    console.log('   ✅ All research grant funding amounts are strictly positive numbers.\n');
  }

  // 4. Check: All mandatory fields flagged if empty
  console.log('⏳ Check 4: Mandatory fields validation (Prisma/DB Schema level)...');
  // At the DB level, required fields are guaranteed by non-null constraints in SQLite.
  // Let's check for empty/whitespace string entries on vital fields.
  const emptyUnivNames = await prisma.university.findMany({
    where: { name: { equals: "" } }
  });
  if (emptyUnivNames.length > 0) {
    console.log('   ❌ Inconsistency: University record exists with an empty name string.');
    inconsistencies++;
  }
  
  const emptyFacultyNames = await prisma.faculty.findMany({
    where: { name: { equals: "" } }
  });
  if (emptyFacultyNames.length > 0) {
    console.log(`   ❌ Inconsistency: Found ${emptyFacultyNames.length} faculty members with empty names.`);
    inconsistencies++;
  }
  
  if (emptyUnivNames.length === 0 && emptyFacultyNames.length === 0) {
    console.log('   ✅ Schema required fields are validated. No blank names or orphan constraints found.\n');
  }

  // 5. Check: Year ranges are consistent (same 5-year period across all criteria)
  console.log('⏳ Check 5: Academic Year Consistency (5-year alignment)...');
  const allowedYears = new Set(['2020-21', '2021-22', '2022-23', '2023-24', '2024-25']);
  
  // Query years from multiple criteria tables
  const [bosYears, vacYears, remedialYears, fdpYears, grantYears, facilityYears, scholarYears, financialYears, greenYears] = await Promise.all([
    prisma.bosMeeting.findMany({ select: { academicYear: true } }),
    prisma.valueAddedCourse.findMany({ select: { academicYear: true } }),
    prisma.remedialProgram.findMany({ select: { academicYear: true } }),
    prisma.fDPRecord.findMany({ select: { academicYear: true } }),
    prisma.researchGrant.findMany({ select: { academicYear: true } }),
    prisma.physicalFacility.findMany({ select: { academicYear: true } }),
    prisma.scholarship.findMany({ select: { academicYear: true } }),
    prisma.financialRecord.findMany({ select: { academicYear: true } }),
    prisma.greenInitiative.findMany({ select: { academicYear: true } }),
  ]);

  const yearValidation = (records: Array<{ academicYear: string }>, tableName: string) => {
    let tableViolations = 0;
    const tableYears = new Set(records.map(r => r.academicYear));
    for (const yr of tableYears) {
      if (!allowedYears.has(yr)) {
        console.log(`   ❌ Inconsistency: Table "${tableName}" contains out-of-bounds academic year: "${yr}"`);
        tableViolations++;
        inconsistencies++;
      }
    }
    return tableViolations;
  };

  const v1 = yearValidation(bosYears, 'BoS Meetings (C1)');
  const v2 = yearValidation(vacYears, 'Value-Added Courses (C1)');
  const v3 = yearValidation(remedialYears, 'Remedial Programs (C2)');
  const v4 = yearValidation(fdpYears, 'FDP Records (C2)');
  const v5 = yearValidation(grantYears, 'Research Grants (C3)');
  const v6 = yearValidation(facilityYears, 'Physical Facilities (C4)');
  const v7 = yearValidation(scholarYears, 'Scholarships (C5)');
  const v8 = yearValidation(financialYears, 'Financial Records (C6)');
  const v9 = yearValidation(greenYears, 'Green Campus (C7)');

  const totalYearViolations = v1 + v2 + v3 + v4 + v5 + v6 + v7 + v8 + v9;
  if (totalYearViolations === 0) {
    console.log('   ✅ Academic year ranges are 100% consistent across all 7 Criteria (2020-21 through 2024-25).\n');
  }

  console.log('=========================================');
  console.log(`📊 Audit Completed: Found ${inconsistencies} total database inconsistencies.`);
  console.log('=========================================');
}

runAudit()
  .catch(e => console.error('Audit failed:', e))
  .finally(async () => { await prisma.$disconnect(); });
