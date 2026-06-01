// prisma/seed.ts — Full NAAC SSR Demo Data Seed
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding NAAC SSR database...');

  // ── University ──────────────────────────────────────────
  const university = await prisma.university.upsert({
    where: { id: 'univ-demo-001' },
    update: {},
    create: {
      id: 'univ-demo-001',
      name: 'UACAS Institute of Technology & Management',
      address: '14th Cross, Rajajinagar Industrial Estate',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560044',
      website: 'https://uacas.edu.in',
      established: 2003,
      type: 'Private',
      affiliation: 'Visvesvaraya Technological University',
      aisheCode: 'C-45872',
      ugcRecognition: '2(f) & 12(B)',
      naacCycle: 3,
      naacGrade: 'B++',
      totalPrograms: 12,
    },
  });

  // ── Users ────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Demo@1234', 10);

  await prisma.user.upsert({
    where: { email: 'iqac@uacas.edu.in' },
    update: {},
    create: {
      email: 'iqac@uacas.edu.in',
      password: hashedPassword,
      name: 'Dr. Priya Sharma',
      role: 'IQAC_COORDINATOR',
      universityId: university.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@uacas.edu.in' },
    update: {},
    create: {
      email: 'admin@uacas.edu.in',
      password: hashedPassword,
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      universityId: university.id,
    },
  });

  // ── Departments ─────────────────────────────────────────
  const depts = await Promise.all([
    prisma.department.upsert({ where: { id: 'dept-cse' }, update: {}, create: { id: 'dept-cse', name: 'Computer Science & Engineering', code: 'CSE', universityId: university.id } }),
    prisma.department.upsert({ where: { id: 'dept-ece' }, update: {}, create: { id: 'dept-ece', name: 'Electronics & Communication Engineering', code: 'ECE', universityId: university.id } }),
    prisma.department.upsert({ where: { id: 'dept-mba' }, update: {}, create: { id: 'dept-mba', name: 'Master of Business Administration', code: 'MBA', universityId: university.id } }),
    prisma.department.upsert({ where: { id: 'dept-mech' }, update: {}, create: { id: 'dept-mech', name: 'Mechanical Engineering', code: 'MECH', universityId: university.id } }),
  ]);
  const [cse, ece, mba, mech] = depts;

  // ── Programs ────────────────────────────────────────────
  const prog1 = await prisma.program.upsert({ where: { id: 'prog-be-cse' }, update: {}, create: { id: 'prog-be-cse', name: 'B.E. Computer Science', code: 'BE-CSE', level: 'UG', durationYears: 4, departmentId: cse.id } });
  const prog2 = await prisma.program.upsert({ where: { id: 'prog-be-ece' }, update: {}, create: { id: 'prog-be-ece', name: 'B.E. Electronics', code: 'BE-ECE', level: 'UG', durationYears: 4, departmentId: ece.id } });
  const prog3 = await prisma.program.upsert({ where: { id: 'prog-mba' }, update: {}, create: { id: 'prog-mba', name: 'MBA', code: 'MBA', level: 'PG', durationYears: 2, departmentId: mba.id } });
  const prog4 = await prisma.program.upsert({ where: { id: 'prog-be-mech' }, update: {}, create: { id: 'prog-be-mech', name: 'B.E. Mechanical', code: 'BE-MECH', level: 'UG', durationYears: 4, departmentId: mech.id } });

  // ── Faculty ─────────────────────────────────────────────
  const facultyData = [
    { id: 'f001', name: 'Dr. Ramesh Kumar', employeeId: 'EMP001', designation: 'Professor', qualification: 'Ph.D', departmentId: cse.id, hasPhD: true, hasNetSetSlet: true, experienceYears: 18, researchPapers: 32, patents: 2, awards: JSON.stringify(['Best Teacher 2022', 'Research Excellence 2023']) },
    { id: 'f002', name: 'Dr. Anita Rao', employeeId: 'EMP002', designation: 'Associate Professor', qualification: 'Ph.D', departmentId: cse.id, hasPhD: true, hasNetSetSlet: true, experienceYears: 12, researchPapers: 18, patents: 1 },
    { id: 'f003', name: 'Prof. Suresh Patil', employeeId: 'EMP003', designation: 'Assistant Professor', qualification: 'M.Tech', departmentId: cse.id, hasPhD: false, hasNetSetSlet: true, experienceYears: 6, researchPapers: 5 },
    { id: 'f004', name: 'Dr. Meera Iyer', employeeId: 'EMP004', designation: 'Professor', qualification: 'Ph.D', departmentId: ece.id, hasPhD: true, hasNetSetSlet: true, experienceYears: 20, researchPapers: 45, patents: 3 },
    { id: 'f005', name: 'Prof. Kiran Naik', employeeId: 'EMP005', designation: 'Associate Professor', qualification: 'M.Tech', departmentId: ece.id, hasPhD: false, hasNetSetSlet: false, experienceYears: 9, researchPapers: 8 },
    { id: 'f006', name: 'Dr. Lakshmi Devi', employeeId: 'EMP006', designation: 'Professor', qualification: 'Ph.D', departmentId: mba.id, hasPhD: true, hasNetSetSlet: true, experienceYears: 15, researchPapers: 22 },
    { id: 'f007', name: 'Prof. Arun Bhatt', employeeId: 'EMP007', designation: 'Assistant Professor', qualification: 'MBA', departmentId: mba.id, hasPhD: false, hasNetSetSlet: false, experienceYears: 4, researchPapers: 2 },
    { id: 'f008', name: 'Dr. Vijay Shetty', employeeId: 'EMP008', designation: 'Professor', qualification: 'Ph.D', departmentId: mech.id, hasPhD: true, hasNetSetSlet: true, experienceYears: 22, researchPapers: 28 },
  ];
  for (const f of facultyData) {
    await prisma.faculty.upsert({ where: { employeeId: f.employeeId }, update: {}, create: f });
  }

  // ── CRITERION I — Curricular Aspects ────────────────────
  const years = ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25'];
  for (const year of years) {
    // BoS Meetings
    await prisma.bosMeeting.createMany({ data: [
      { programName: 'BE-CSE', meetingDate: new Date(`${year.split('-')[0]}-08-15`), hasIndustryFeedback: true, academicYear: year, universityId: university.id },
      { programName: 'BE-ECE', meetingDate: new Date(`${year.split('-')[0]}-08-20`), hasIndustryFeedback: true, academicYear: year, universityId: university.id },
      { programName: 'MBA', meetingDate: new Date(`${year.split('-')[0]}-09-05`), hasIndustryFeedback: true, academicYear: year, universityId: university.id },
      { programName: 'BE-MECH', meetingDate: new Date(`${year.split('-')[0]}-08-18`), hasIndustryFeedback: false, academicYear: year, universityId: university.id },
    ] });

    // Value Added Courses
    await prisma.valueAddedCourse.createMany({ data: [
      { name: 'Python for Data Science', type: 'CERTIFICATE', duration: '40 hours', studentsEnrolled: 120, academicYear: year, universityId: university.id },
      { name: 'Digital Marketing', type: 'VALUE_ADDED', duration: '30 hours', studentsEnrolled: 85, academicYear: year, universityId: university.id },
      { name: 'IoT Fundamentals', type: 'CERTIFICATE', duration: '36 hours', studentsEnrolled: 95, academicYear: year, universityId: university.id },
    ] });

    // MOOC Enrollments
    await prisma.mOOCEnrollment.createMany({ data: [
      { platform: 'NPTEL', courseName: 'Data Structures & Algorithms', creditsEarned: 3, studentsEnrolled: 65, academicYear: year, universityId: university.id },
      { platform: 'Coursera', courseName: 'Machine Learning', creditsEarned: 4, studentsEnrolled: 42, academicYear: year, universityId: university.id },
      { platform: 'SWAYAM', courseName: 'Environmental Science', creditsEarned: 2, studentsEnrolled: 210, academicYear: year, universityId: university.id },
    ] });

    // Feedback Records
    for (const stakeholder of ['STUDENT', 'TEACHER', 'EMPLOYER', 'ALUMNI']) {
      await prisma.feedbackRecord.createMany({ data: [{
        stakeholderType: stakeholder, collectionMethod: 'ONLINE',
        analysisReportUrl: `/docs/feedback/${year}/${stakeholder.toLowerCase()}.pdf`,
        actionTakenReport: true, academicYear: year, universityId: university.id,
      }] });
    }
  }

  // ── CRITERION II — Teaching-Learning ────────────────────
  for (const year of years) {
    // Enrollment Records
    await prisma.enrollmentRecord.createMany({ data: [
      { programId: prog1.id, sanctionedIntake: 120, enrolled: 118, enrolledSC: 12, enrolledST: 6, enrolledOBC: 28, enrolledEWS: 8, enrolledGeneral: 64, academicYear: year, universityId: university.id },
      { programId: prog2.id, sanctionedIntake: 60, enrolled: 58, enrolledSC: 6, enrolledST: 3, enrolledOBC: 14, enrolledEWS: 4, enrolledGeneral: 31, academicYear: year, universityId: university.id },
      { programId: prog3.id, sanctionedIntake: 60, enrolled: 55, enrolledSC: 5, enrolledST: 2, enrolledOBC: 12, enrolledEWS: 4, enrolledGeneral: 32, academicYear: year, universityId: university.id },
      { programId: prog4.id, sanctionedIntake: 60, enrolled: 54, enrolledSC: 5, enrolledST: 3, enrolledOBC: 10, enrolledEWS: 3, enrolledGeneral: 33, academicYear: year, universityId: university.id },
    ] });

    // Remedial Programs
    await prisma.remedialProgram.createMany({ data: [
      { type: 'REMEDIAL', description: 'Mathematics Bridge Course', beneficiaries: 45, academicYear: year, universityId: university.id },
      { type: 'BRIDGE', description: 'Communication Skills Enhancement', beneficiaries: 80, academicYear: year, universityId: university.id },
      { type: 'ADVANCED', description: 'Competitive Exam Preparation', beneficiaries: 60, academicYear: year, universityId: university.id },
    ] });

    // Mentoring Data
    await prisma.mentoringData.createMany({ data: [{ totalMentors: 24, totalStudents: 285, academicYear: year, universityId: university.id }] });

    // Teacher ICT
    await prisma.teacherICTRecord.createMany({ data: [{
      totalTeachers: 48, ictUsersCount: 40, lmsUsed: true, lmsName: 'Moodle',
      recordedLectures: true, smartBoardCount: 22,
      studentCentricMethods: JSON.stringify(['FLIPPED_CLASS', 'COLLABORATIVE', 'PBL', 'EXPERIENTIAL']),
      academicYear: year, universityId: university.id
    }] });

    // FDP Records
    await prisma.fDPRecord.createMany({ data: [
      { programName: 'AI/ML Workshop', type: 'FDP', facultyCount: 12, duration: '5 days', organizer: 'IISc Bangalore', academicYear: year, universityId: university.id },
      { programName: 'Research Methodology', type: 'WORKSHOP', facultyCount: 8, duration: '3 days', organizer: 'VTU', academicYear: year, universityId: university.id },
    ] });

    // Exam Records
    await prisma.examRecord.createMany({ data: [{
      totalCourses: 48, coursesWithCIA: 48, grievancesReceived: 8, grievancesResolved: 7,
      reEvaluationPolicy: true, automationStatus: true,
      automationDescription: 'Online exam management via Examly platform',
      transparencyMechanisms: 'Answer scripts shown, re-evaluation within 7 days',
      academicYear: year, universityId: university.id
    }] });

    // Learning Outcomes
    await prisma.learningOutcomeRecord.createMany({ data: [
      { programId: prog1.id, posCosDefined: true, attainmentMethod: 'Both', passPercentage: 87.5, placementPercentage: 82.0, higherStudiesPercentage: 15.0, academicYear: year, universityId: university.id },
      { programId: prog2.id, posCosDefined: true, attainmentMethod: 'Both', passPercentage: 84.0, placementPercentage: 75.0, higherStudiesPercentage: 18.0, academicYear: year, universityId: university.id },
      { programId: prog3.id, posCosDefined: true, attainmentMethod: 'Indirect', passPercentage: 91.0, placementPercentage: 88.0, higherStudiesPercentage: 10.0, academicYear: year, universityId: university.id },
    ] });
  }

  // ── CRITERION III — Research ─────────────────────────────
  await prisma.researchGrant.createMany({ data: [
    { agencyName: 'DST-SERB', projectTitle: 'ML for Healthcare Diagnostics', amount: 2500000, status: 'ONGOING', sanctionYear: 2023, academicYear: '2023-24', universityId: university.id },
    { agencyName: 'AICTE', projectTitle: 'IoT Smart Agriculture', amount: 1200000, status: 'ONGOING', sanctionYear: 2022, academicYear: '2022-23', universityId: university.id },
    { agencyName: 'DBT', projectTitle: 'Bioinformatics Research', amount: 800000, status: 'COMPLETED', sanctionYear: 2021, academicYear: '2021-22', universityId: university.id },
    { agencyName: 'Industry (Infosys)', projectTitle: 'Cloud Computing Lab', amount: 500000, status: 'COMPLETED', sanctionYear: 2022, academicYear: '2022-23', universityId: university.id },
    { agencyName: 'UGC', projectTitle: 'Renewable Energy Systems', amount: 1800000, status: 'ONGOING', sanctionYear: 2024, academicYear: '2024-25', universityId: university.id },
  ] });

  await prisma.patent.createMany({ data: [
    { patentNumber: 'IN202341025678', title: 'Smart Irrigation Controller Using AI', inventors: 'Dr. Ramesh Kumar, Dr. Anita Rao', year: 2023, status: 'GRANTED', universityId: university.id },
    { patentNumber: 'IN202241018923', title: 'Energy Harvesting Wireless Sensor Node', inventors: 'Dr. Meera Iyer', year: 2022, status: 'GRANTED', universityId: university.id },
    { title: 'Blockchain-Based Academic Certificate Verification', inventors: 'Dr. Ramesh Kumar', year: 2024, status: 'FILED', universityId: university.id },
  ] });

  await prisma.publication.createMany({ data: [
    { type: 'JOURNAL', title: 'Deep Learning for Medical Image Segmentation', authors: 'Dr. Anita Rao, Dr. Ramesh Kumar', journalName: 'IEEE Trans. Medical Imaging', year: 2024, indexedIn: 'SCOPUS', doiUrl: '10.1109/TMI.2024.001', citationCount: 12, universityId: university.id },
    { type: 'JOURNAL', title: 'IoT-Enabled Precision Agriculture Framework', authors: 'Dr. Vijay Shetty', journalName: 'Computers and Electronics in Agriculture', year: 2023, indexedIn: 'SCOPUS', citationCount: 8, universityId: university.id },
    { type: 'JOURNAL', title: 'Green Supply Chain Management in SMEs', authors: 'Dr. Lakshmi Devi', journalName: 'Journal of Cleaner Production', year: 2023, indexedIn: 'WOS', citationCount: 15, universityId: university.id },
    { type: 'CONFERENCE', title: 'Federated Learning for Privacy-Preserving Analytics', authors: 'Dr. Ramesh Kumar', journalName: 'IEEE ICASSP 2024', year: 2024, indexedIn: 'SCOPUS', universityId: university.id },
    { type: 'JOURNAL', title: 'VLSI Design for Low-Power Embedded Systems', authors: 'Dr. Meera Iyer, Prof. Kiran Naik', journalName: 'Microelectronics Journal', year: 2022, indexedIn: 'SCOPUS', universityId: university.id },
    { type: 'BOOK', title: 'Machine Learning: Theory and Practice', authors: 'Dr. Anita Rao', isbnIssn: '978-81-203-5421-6', year: 2023, universityId: university.id },
    { type: 'JOURNAL', title: 'Entrepreneurship Ecosystem in Tier-2 Cities', authors: 'Dr. Lakshmi Devi', journalName: 'Journal of Business Venturing', year: 2024, indexedIn: 'UGC_CARE', universityId: university.id },
    { type: 'JOURNAL', title: 'Thermal Analysis of Heat Exchangers', authors: 'Dr. Vijay Shetty, Prof. Arun Bhatt', journalName: 'Applied Thermal Engineering', year: 2023, indexedIn: 'SCOPUS', universityId: university.id },
  ] });

  await prisma.extensionActivity.createMany({ data: [
    { name: 'Blood Donation Camp', type: 'NSS', description: '350 units collected, 500 volunteers', studentsParticipated: 500, academicYear: '2024-25', universityId: university.id },
    { name: 'Rural Digital Literacy Drive', type: 'OUTREACH', description: 'Trained 200 villagers in digital payments', studentsParticipated: 80, partnerOrganization: 'Gram Panchayat Doddaballapura', academicYear: '2024-25', universityId: university.id },
    { name: 'Clean Bengaluru Campaign', type: 'COMMUNITY_SERVICE', studentsParticipated: 300, academicYear: '2023-24', universityId: university.id },
    { name: 'Tree Plantation Drive', type: 'NSS', studentsParticipated: 450, academicYear: '2023-24', universityId: university.id },
  ] });

  await prisma.moU.createMany({ data: [
    { partnerName: 'Infosys Ltd.', partnerType: 'INDUSTRY', scope: 'Internship, Research, Placement', isInternational: false, signedDate: new Date('2022-06-01'), expiryDate: new Date('2025-05-31'), activitiesCount: 12, universityId: university.id },
    { partnerName: 'Bosch Global Software', partnerType: 'INDUSTRY', scope: 'Research, Lab Establishment', isInternational: false, signedDate: new Date('2023-01-15'), expiryDate: new Date('2026-01-14'), universityId: university.id },
    { partnerName: 'NUS Singapore', partnerType: 'INSTITUTION', scope: 'Student Exchange, Joint Research', isInternational: true, signedDate: new Date('2021-09-01'), expiryDate: new Date('2024-08-31'), universityId: university.id },
    { partnerName: 'CRY NGO', partnerType: 'NGO', scope: 'Community Service, CSR', isInternational: false, signedDate: new Date('2023-07-01'), expiryDate: new Date('2026-06-30'), universityId: university.id },
    { partnerName: 'TCS iON', partnerType: 'INDUSTRY', scope: 'Assessment, Placement', isInternational: false, signedDate: new Date('2022-03-01'), expiryDate: new Date('2025-02-28'), universityId: university.id },
  ] });

  // ── CRITERION IV — Infrastructure ──────────────────────
  for (const year of years) {
    await prisma.physicalFacility.createMany({ data: [{
      campusAreaAcres: 14.5, builtUpAreaSqM: 32000,
      sportsGround: true, indoorSports: true, gym: true, auditorium: true,
      totalClassrooms: 62, ictClassrooms: 45, seminarHalls: 8, labs: 28,
      rampAvailability: true, liftAvailability: true, disabledFriendlyToilets: true, brailleSignage: false,
      academicYear: year, universityId: university.id,
    }] });

    await prisma.libraryRecord.createMany({ data: [{
      volumes: 68500, titles: 14200, printJournals: 82, eJournals: 3400,
      eBooks: 12000, databases: JSON.stringify(['EBSCO', 'JSTOR', 'Scopus', 'Springer Link']),
      automationSoftware: 'KOHA (v22.05)', userProgramsCount: 12,
      footfallPerDay: 320, footfallPerMonth: 7200,
      nDelNet: true, inflibnet: true,
      academicYear: year, universityId: university.id,
    }] });

    await prisma.iTInfrastructure.createMany({ data: [{
      computersForStudents: 480, totalStudents: 1540, internetBandwidthMbps: 500,
      wifiAvailable: true, wifiCoveragePercent: 95, licensedSoftwareCount: 24,
      licensedSoftwareList: JSON.stringify(['MATLAB', 'AutoCAD', 'ANSYS', 'MS Office', 'Tally', 'Adobe CC']),
      cybersecurityMeasures: 'Firewall, VPN, IDS/IPS, 24x7 monitoring, VAPT annually',
      erp: true, erpName: 'EduManager Pro',
      academicYear: year, universityId: university.id,
    }] });

    await prisma.maintenanceBudget.createMany({ data: [{
      annualBudgetINR: 8500000, amountUtilizedINR: 7820000,
      policyDocumentUrl: '/docs/maintenance-policy.pdf',
      academicYear: year, universityId: university.id,
    }] });
  }

  // ── CRITERION V — Student Support ──────────────────────
  for (const year of years) {
    await prisma.scholarship.createMany({ data: [
      { name: 'Post-Matric Scholarship SC/ST', type: 'GOVERNMENT', amountINR: 4500000, recipients: 85, academicYear: year, universityId: university.id },
      { name: 'OBC Scholarship', type: 'GOVERNMENT', amountINR: 1800000, recipients: 42, academicYear: year, universityId: university.id },
      { name: 'Merit Scholarship', type: 'INSTITUTIONAL', amountINR: 2200000, recipients: 38, academicYear: year, universityId: university.id },
      { name: 'Sports Achievement Scholarship', type: 'INSTITUTIONAL', amountINR: 350000, recipients: 12, academicYear: year, universityId: university.id },
    ] });

    await prisma.placementRecord.createMany({ data: [
      { companyName: 'Infosys', sector: 'IT', studentsPlaced: 28, packageLPA: 4.5, programId: prog1.id, academicYear: year, universityId: university.id },
      { companyName: 'Wipro', sector: 'IT', studentsPlaced: 22, packageLPA: 3.8, programId: prog1.id, academicYear: year, universityId: university.id },
      { companyName: 'TCS', sector: 'IT', studentsPlaced: 35, packageLPA: 3.36, programId: prog1.id, academicYear: year, universityId: university.id },
      { companyName: 'Bosch', sector: 'CORE', studentsPlaced: 14, packageLPA: 5.2, programId: prog2.id, academicYear: year, universityId: university.id },
      { companyName: 'Deloitte', sector: 'CONSULTING', studentsPlaced: 18, packageLPA: 8.5, programId: prog3.id, academicYear: year, universityId: university.id },
      { companyName: 'L&T', sector: 'CORE', studentsPlaced: 12, packageLPA: 4.8, programId: prog4.id, academicYear: year, universityId: university.id },
    ] });

    await prisma.competitiveExamResult.createMany({ data: [
      { examType: 'GATE', appearedCount: 45, qualifiedCount: 22, academicYear: year, universityId: university.id },
      { examType: 'CAT', appearedCount: 35, qualifiedCount: 12, academicYear: year, universityId: university.id },
      { examType: 'NET', appearedCount: 18, qualifiedCount: 8, academicYear: year, universityId: university.id },
      { examType: 'UPSC', appearedCount: 8, qualifiedCount: 2, academicYear: year, universityId: university.id },
    ] });

    await prisma.studentActivity.createMany({ data: [
      { name: 'Inter-University Cricket Tournament', type: 'SPORTS', level: 'STATE', participants: 22, winners: 22, academicYear: year, universityId: university.id },
      { name: 'National Level Hackathon', type: 'TECH_CHAPTER', level: 'NATIONAL', participants: 45, winners: 6, academicYear: year, universityId: university.id },
      { name: 'Cultural Fest - UTSAV', type: 'CULTURAL', level: 'INSTITUTIONAL', participants: 850, academicYear: year, universityId: university.id },
      { name: 'IEEE Student Branch', type: 'TECH_CHAPTER', level: 'NATIONAL', participants: 120, chapterName: 'IEEE UACAS Student Branch', academicYear: year, universityId: university.id },
    ] });
  }

  await prisma.alumniRecord.createMany({ data: [
    { associationRegistered: true, meetsPerYear: 2, contributionAmountINR: 850000, contributionDescription: 'Laboratory Equipment & Scholarship Fund', distinguishedAlumni: JSON.stringify([{ name: 'Rahul Mehta', designation: 'VP Engineering', org: 'Google India' }, { name: 'Deepa Krishnan', designation: 'IPS Officer', org: 'Karnataka Police' }]), academicYear: '2024-25', universityId: university.id },
  ] });

  // ── CRITERION VI — Governance ───────────────────────────
  await prisma.visionMission.createMany({ data: [{ visionStatement: 'To be a globally recognized institution fostering innovation, research, and ethical leadership for sustainable societal development.', missionStatement: 'To provide quality education through cutting-edge curriculum, industry collaboration, and holistic development; nurturing globally competent, socially responsible professionals.', hasStrategicPlan: true, strategicPlanUrl: '/docs/strategic-plan-2025-30.pdf', decentralizationDesc: 'Decision-making delegated to Academic Council, BoG, Examination Board, and Department Advisory Committees. Faculty grievance redressal through IQAC.', academicYear: '2024-25', universityId: university.id }] });

  const eGovAreas = ['FINANCE', 'HR', 'ADMISSION', 'EXAM', 'LIBRARY'];
  const eGovPercents = [90, 80, 95, 85, 75];
  const eGovSoftwares = ['Tally ERP 9', 'EduManager HR', 'Samarth ERP', 'Examly Platform', 'KOHA LMS'];
  for (let i = 0; i < eGovAreas.length; i++) {
    await prisma.eGovernanceRecord.createMany({ data: [{ area: eGovAreas[i], automationPercent: eGovPercents[i], softwareUsed: eGovSoftwares[i], isImplemented: true, academicYear: '2024-25', universityId: university.id }] });
  }

  await prisma.adminCommittee.createMany({ data: [
    { name: 'Internal Quality Assurance Cell (IQAC)', role: 'Quality Monitoring & Accreditation', membersJson: JSON.stringify(['Dr. Priya Sharma (Coord)', 'Dr. Ramesh Kumar', 'Dr. Meera Iyer', 'Industry Rep: Mr. Rajiv Nair', 'Alumni Rep: Ms. Kavya Reddy']), meetingsPerYear: 6, universityId: university.id },
    { name: 'Board of Governors', role: 'Strategic Oversight & Governance', membersJson: JSON.stringify(['Dr. S.K. Agarwal (Chairman)', 'Dr. Priya Sharma', 'Prof. VTU Nominee', 'Industry Rep', 'Government Nominee']), meetingsPerYear: 4, universityId: university.id },
    { name: 'Academic Council', role: 'Curriculum & Academic Policy', membersJson: JSON.stringify(['Principal', 'HoDs of all depts', 'Senior Faculty', 'Student Rep']), meetingsPerYear: 4, universityId: university.id },
    { name: 'Anti-Ragging Committee', role: 'Student Safety & Anti-Ragging', membersJson: JSON.stringify(['Chief Proctor', 'HoDs', 'Student Counselor', 'Police Liaison']), meetingsPerYear: 2, universityId: university.id },
    { name: 'Grievance Redressal Cell', role: 'Student & Staff Grievances', membersJson: JSON.stringify(['Ombudsperson', 'IQAC Coordinator', 'Legal Advisor']), meetingsPerYear: 12, universityId: university.id },
  ] });

  for (const year of years) {
    await prisma.financialRecord.createMany({ data: [{
      totalIncomeINR: 185000000, grantIncomeINR: 12000000, feeIncomeINR: 168000000, otherIncomeINR: 5000000,
      totalExpenditureINR: 175000000, academicExpenditureINR: 122500000, adminExpenditureINR: 52500000,
      internalAuditDone: true, externalAuditDone: true,
      academicYear: year, universityId: university.id,
    }] });
  }

  await prisma.iQACRecord.createMany({ data: [{ constitutionDate: new Date('2015-07-01'), meetingsPerYear: 6, meetingDatesJson: JSON.stringify(['2024-07-15', '2024-09-12', '2024-11-20', '2025-01-18', '2025-03-14', '2025-05-10']), qualityInitiatives: 14, initiativesDesc: 'NAAC documentation, NBA preparation, NIRF submission, Academic Audit, FDP series, e-governance rollout', nabaCertified: false, isoCertified: true, certificationDetails: 'ISO 9001:2015 (Teaching-Learning Processes)', nirfParticipated: true, nirfRank: 142, aqarSubmittedYears: JSON.stringify(['2019-20', '2020-21', '2021-22', '2022-23', '2023-24']), academicYear: '2024-25', universityId: university.id }] });

  // ── CRITERION VII — Institutional Values ────────────────
  for (const year of years) {
    await prisma.genderProgram.createMany({ data: [{
      sensitizationCount: 8, safetyFacilities: true, grievanceCellExists: true,
      antiHarassmentCommittee: true, internalComplaintsCommittee: true, womenHelpdesk: true,
      descriptionJson: JSON.stringify([
        'Gender Sensitization Workshop (Aug 2024)', 'Women Safety Awareness Program (Oct 2024)',
        'Celebrating Women Achievers (Mar 2025)', 'Self-Defense Training Camp'
      ]),
      academicYear: year, universityId: university.id,
    }] });

    await prisma.greenInitiative.createMany({ data: [{
      solarPanels: true, solarCapacityKw: 120, rainwaterHarvesting: true, composting: true,
      paperlessOffice: true, eWasteManagement: true, ledLighting: true, greenCampusCertified: false,
      energyConsumptionKwh: 185000,
      waterConservationDesc: 'Rainwater harvesting tanks (50,000 L capacity), STP plant, zero liquid discharge',
      academicYear: year, universityId: university.id,
    }] });

    await prisma.inclusionActivity.createMany({ data: [
      { type: 'DIFFERENTLY_ABLED', activityName: 'Accessible Campus Initiative', participants: 25, description: 'Ramps, assistive technology lab, reader facility', academicYear: year, universityId: university.id },
      { type: 'MARGINALIZED', activityName: 'First-Generation Scholar Support Program', participants: 85, description: 'Mentoring, coaching and financial aid for first-gen students', academicYear: year, universityId: university.id },
    ] });
  }

  await prisma.bestPractice.createMany({ data: [
    {
      practiceNumber: 1, title: 'Industry-Integrated Curriculum (IIC) Model',
      objectives: 'Bridge the gap between academia and industry by co-creating curriculum with industry partners, ensuring graduates are immediately employable.',
      context: 'Traditional curricula were found to lag behind rapidly evolving industry requirements, resulting in a skills gap that hampered placement rates.',
      practiceDesc: 'An Industry Advisory Board (IAB) of 15 CXOs meets bi-annually to review and co-design course content. Industry mentors are assigned to final-year students. Live projects replace 30% of theory coursework.',
      evidenceSuccess: 'Placement rate improved from 68% (2019) to 87% (2024). Average CTC increased from ₹3.2 LPA to ₹5.8 LPA. 4 industry-funded labs established.',
      problemsNotes: 'Initial resistance from faculty. Addressed via extensive FDPs and incentive-based appraisal linked to industry collaboration.',
      universityId: university.id,
    },
    {
      practiceNumber: 2, title: 'UACAS Research Incubation Ladder (URIL)',
      objectives: 'Create a structured pathway for students and faculty from idea conception to patent filing and startup incubation.',
      context: 'Despite having talented researchers, the institution lacked a systematic framework to convert ideas into protectable IP and viable startups.',
      practiceDesc: 'Four-stage ladder: (1) Idea Hackathon → (2) Prototype Lab funding (₹10,000–₹50,000) → (3) IPR Cell filing support → (4) Pre-Incubation and BIRAC/TiE mentorship. 20 slots per year.',
      evidenceSuccess: '3 patents granted, 2 startups incubated, ₹35 lakh external funding raised by student-led startups in 3 years.',
      problemsNotes: 'Funding for prototype development required external sponsorship. Resolved through CSR tie-ups with Infosys and Bosch.',
      universityId: university.id,
    },
  ] });

  await prisma.institutionalDistinctiveness.createMany({ data: [{
    uniqueCharacters: '1. Only institution in Bengaluru North with all programs NBA-accredited. 2. 100% Wi-Fi campus with 500 Mbps fiber. 3. KOHA-based fully automated library with Scopus & EBSCO access. 4. ISO 9001:2015 certified academic processes. 5. International MoU with NUS Singapore for student exchange.',
    differentiators: 'Our Industry-Integrated Curriculum (IIC) model and the UACAS Research Incubation Ladder (URIL) uniquely position us at the intersection of academia and industry. Unlike conventional institutions, we mandate live industry projects as partial credit substitutes for theory courses.',
    evidence: 'Ranked 142 in NIRF 2024. 87% placement rate. 3 patents granted. 2 startups operational. ISO certified.',
    recognitions: 'NIRF Rank 142 (2024); Best Emerging Engineering College – Times Education Awards 2023; VTU Best Research Cluster Award 2022',
    universityId: university.id,
  }] });

  console.log('✅ NAAC SSR database seeded successfully!');
  console.log(`   University: ${university.name}`);
  console.log(`   Users: 2 (admin + IQAC coordinator)`);
  console.log(`   Departments: 4 | Programs: 4 | Faculty: 8`);
  console.log(`   Criterion I–VII data populated for 5 academic years`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

