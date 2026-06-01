-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "established" INTEGER,
    "type" TEXT,
    "affiliation" TEXT,
    "aisheCode" TEXT,
    "ugcRecognition" TEXT,
    "naacCycle" INTEGER,
    "naacGrade" TEXT,
    "totalPrograms" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'REVIEWER',
    "universityId" TEXT NOT NULL,
    "departmentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    CONSTRAINT "Department_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'UG',
    "durationYears" INTEGER NOT NULL DEFAULT 4,
    "departmentId" TEXT NOT NULL,
    CONSTRAINT "Program_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "doj" DATETIME,
    "hasPhD" BOOLEAN NOT NULL DEFAULT false,
    "hasNetSetSlet" BOOLEAN NOT NULL DEFAULT false,
    "experienceYears" REAL,
    "researchPapers" INTEGER NOT NULL DEFAULT 0,
    "patents" INTEGER NOT NULL DEFAULT 0,
    "awards" TEXT,
    CONSTRAINT "Faculty_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "batch" TEXT NOT NULL,
    "category" TEXT,
    "departmentId" TEXT NOT NULL,
    "cgpa" REAL,
    CONSTRAINT "Student_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "semester" INTEGER,
    "hasInternship" BOOLEAN NOT NULL DEFAULT false,
    "hasFieldProject" BOOLEAN NOT NULL DEFAULT false,
    "crosscuttingIssue" TEXT,
    "departmentId" TEXT NOT NULL,
    CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CO" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "attainment" REAL DEFAULT 0,
    CONSTRAINT "CO_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PO" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    CONSTRAINT "PO_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PSO" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    CONSTRAINT "PSO_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccreditationRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "data" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccreditationRecord_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "criterion" TEXT NOT NULL,
    "metricCode" TEXT,
    "academicYear" TEXT,
    "expiryDate" DATETIME,
    "uploaderName" TEXT,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evidence_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NaacScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "criterion" INTEGER NOT NULL,
    "subCriterion" TEXT,
    "metricCode" TEXT,
    "score" REAL NOT NULL DEFAULT 0,
    "maxScore" REAL NOT NULL DEFAULT 0,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NaacScore_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BosMeeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programName" TEXT NOT NULL,
    "meetingDate" DATETIME NOT NULL,
    "minutesUrl" TEXT,
    "hasIndustryFeedback" BOOLEAN NOT NULL DEFAULT false,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BosMeeting_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NewCourse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseCode" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "semester" INTEGER,
    "credits" INTEGER,
    "programName" TEXT,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NewCourse_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ValueAddedCourse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duration" TEXT,
    "studentsEnrolled" INTEGER NOT NULL DEFAULT 0,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValueAddedCourse_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MOOCEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "creditsEarned" REAL,
    "studentsEnrolled" INTEGER NOT NULL DEFAULT 0,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MOOCEnrollment_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeedbackRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stakeholderType" TEXT NOT NULL,
    "collectionMethod" TEXT NOT NULL,
    "analysisReportUrl" TEXT,
    "actionTakenReport" BOOLEAN NOT NULL DEFAULT false,
    "actionReportUrl" TEXT,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedbackRecord_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnrollmentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "sanctionedIntake" INTEGER NOT NULL,
    "enrolled" INTEGER NOT NULL,
    "enrolledSC" INTEGER NOT NULL DEFAULT 0,
    "enrolledST" INTEGER NOT NULL DEFAULT 0,
    "enrolledOBC" INTEGER NOT NULL DEFAULT 0,
    "enrolledEWS" INTEGER NOT NULL DEFAULT 0,
    "enrolledGeneral" INTEGER NOT NULL DEFAULT 0,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EnrollmentRecord_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EnrollmentRecord_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RemedialProgram" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "beneficiaries" INTEGER NOT NULL DEFAULT 0,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RemedialProgram_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MentoringData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "totalMentors" INTEGER NOT NULL DEFAULT 0,
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MentoringData_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeacherICTRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "totalTeachers" INTEGER NOT NULL DEFAULT 0,
    "ictUsersCount" INTEGER NOT NULL DEFAULT 0,
    "studentCentricMethods" TEXT,
    "lmsUsed" BOOLEAN NOT NULL DEFAULT false,
    "lmsName" TEXT,
    "recordedLectures" BOOLEAN NOT NULL DEFAULT false,
    "smartBoardCount" INTEGER NOT NULL DEFAULT 0,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeacherICTRecord_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FDPRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "facultyCount" INTEGER NOT NULL DEFAULT 0,
    "duration" TEXT,
    "organizer" TEXT,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FDPRecord_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "totalCourses" INTEGER NOT NULL DEFAULT 0,
    "coursesWithCIA" INTEGER NOT NULL DEFAULT 0,
    "grievancesReceived" INTEGER NOT NULL DEFAULT 0,
    "grievancesResolved" INTEGER NOT NULL DEFAULT 0,
    "reEvaluationPolicy" BOOLEAN NOT NULL DEFAULT false,
    "automationStatus" BOOLEAN NOT NULL DEFAULT false,
    "automationDescription" TEXT,
    "transparencyMechanisms" TEXT,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamRecord_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LearningOutcomeRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "posCosDefined" BOOLEAN NOT NULL DEFAULT false,
    "attainmentMethod" TEXT,
    "passPercentage" REAL,
    "placementPercentage" REAL,
    "higherStudiesPercentage" REAL,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningOutcomeRecord_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LearningOutcomeRecord_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResearchGrant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyName" TEXT NOT NULL,
    "projectTitle" TEXT,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "sanctionYear" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResearchGrant_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResearchProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "principalInvestigator" TEXT NOT NULL,
    "coPrincipalInvestigator" TEXT,
    "fundingAgency" TEXT,
    "fundingAmount" REAL,
    "status" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResearchProject_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Patent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patentNumber" TEXT,
    "title" TEXT NOT NULL,
    "inventors" TEXT,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Patent_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Startup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "foundersNames" TEXT,
    "yearIncubated" INTEGER NOT NULL,
    "sector" TEXT,
    "fundingRaised" REAL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Startup_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT NOT NULL,
    "journalName" TEXT,
    "year" INTEGER NOT NULL,
    "indexedIn" TEXT,
    "isbnIssn" TEXT,
    "doiUrl" TEXT,
    "hIndex" REAL,
    "citationCount" INTEGER,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Publication_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtensionActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "studentsParticipated" INTEGER NOT NULL DEFAULT 0,
    "partnerOrganization" TEXT,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExtensionActivity_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MoU" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerName" TEXT NOT NULL,
    "partnerType" TEXT NOT NULL,
    "scope" TEXT,
    "isInternational" BOOLEAN NOT NULL DEFAULT false,
    "signedDate" DATETIME,
    "expiryDate" DATETIME,
    "activitiesCount" INTEGER NOT NULL DEFAULT 0,
    "documentUrl" TEXT,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MoU_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhysicalFacility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campusAreaAcres" REAL,
    "builtUpAreaSqM" REAL,
    "sportsGround" BOOLEAN NOT NULL DEFAULT false,
    "indoorSports" BOOLEAN NOT NULL DEFAULT false,
    "gym" BOOLEAN NOT NULL DEFAULT false,
    "auditorium" BOOLEAN NOT NULL DEFAULT false,
    "totalClassrooms" INTEGER,
    "ictClassrooms" INTEGER,
    "seminarHalls" INTEGER,
    "labs" INTEGER,
    "rampAvailability" BOOLEAN NOT NULL DEFAULT false,
    "liftAvailability" BOOLEAN NOT NULL DEFAULT false,
    "disabledFriendlyToilets" BOOLEAN NOT NULL DEFAULT false,
    "brailleSignage" BOOLEAN NOT NULL DEFAULT false,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PhysicalFacility_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LibraryRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "volumes" INTEGER NOT NULL DEFAULT 0,
    "titles" INTEGER NOT NULL DEFAULT 0,
    "printJournals" INTEGER NOT NULL DEFAULT 0,
    "eJournals" INTEGER NOT NULL DEFAULT 0,
    "eBooks" INTEGER NOT NULL DEFAULT 0,
    "databases" TEXT,
    "automationSoftware" TEXT,
    "userProgramsCount" INTEGER NOT NULL DEFAULT 0,
    "footfallPerDay" INTEGER,
    "footfallPerMonth" INTEGER,
    "nDelNet" BOOLEAN NOT NULL DEFAULT false,
    "inflibnet" BOOLEAN NOT NULL DEFAULT false,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LibraryRecord_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ITInfrastructure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "computersForStudents" INTEGER NOT NULL DEFAULT 0,
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "internetBandwidthMbps" INTEGER NOT NULL DEFAULT 0,
    "wifiAvailable" BOOLEAN NOT NULL DEFAULT false,
    "wifiCoveragePercent" INTEGER,
    "licensedSoftwareCount" INTEGER,
    "licensedSoftwareList" TEXT,
    "cybersecurityMeasures" TEXT,
    "erp" BOOLEAN NOT NULL DEFAULT false,
    "erpName" TEXT,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ITInfrastructure_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceBudget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "annualBudgetINR" REAL NOT NULL,
    "amountUtilizedINR" REAL NOT NULL,
    "policyDocumentUrl" TEXT,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaintenanceBudget_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amountINR" REAL NOT NULL,
    "recipients" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Scholarship_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlacementRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "sector" TEXT,
    "studentsPlaced" INTEGER NOT NULL,
    "packageLPA" REAL,
    "programId" TEXT,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlacementRecord_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PlacementRecord_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompetitiveExamResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examType" TEXT NOT NULL,
    "appearedCount" INTEGER NOT NULL DEFAULT 0,
    "qualifiedCount" INTEGER NOT NULL DEFAULT 0,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompetitiveExamResult_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "level" TEXT,
    "participants" INTEGER NOT NULL DEFAULT 0,
    "winners" INTEGER NOT NULL DEFAULT 0,
    "chapterName" TEXT,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentActivity_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlumniRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "associationRegistered" BOOLEAN NOT NULL DEFAULT false,
    "meetsPerYear" INTEGER NOT NULL DEFAULT 0,
    "contributionAmountINR" REAL NOT NULL DEFAULT 0,
    "contributionDescription" TEXT,
    "distinguishedAlumni" TEXT,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlumniRecord_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VisionMission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visionStatement" TEXT NOT NULL,
    "missionStatement" TEXT NOT NULL,
    "strategicPlanUrl" TEXT,
    "hasStrategicPlan" BOOLEAN NOT NULL DEFAULT false,
    "decentralizationDesc" TEXT,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VisionMission_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EGovernanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "area" TEXT NOT NULL,
    "automationPercent" INTEGER NOT NULL DEFAULT 0,
    "softwareUsed" TEXT,
    "isImplemented" BOOLEAN NOT NULL DEFAULT false,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EGovernanceRecord_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminCommittee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "membersJson" TEXT,
    "meetingsPerYear" INTEGER NOT NULL DEFAULT 0,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminCommittee_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancialRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "totalIncomeINR" REAL NOT NULL,
    "grantIncomeINR" REAL,
    "feeIncomeINR" REAL,
    "otherIncomeINR" REAL,
    "totalExpenditureINR" REAL NOT NULL,
    "academicExpenditureINR" REAL NOT NULL,
    "adminExpenditureINR" REAL NOT NULL,
    "internalAuditDone" BOOLEAN NOT NULL DEFAULT false,
    "externalAuditDone" BOOLEAN NOT NULL DEFAULT false,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinancialRecord_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IQACRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "constitutionDate" DATETIME,
    "meetingsPerYear" INTEGER NOT NULL DEFAULT 0,
    "meetingDatesJson" TEXT,
    "qualityInitiatives" INTEGER NOT NULL DEFAULT 0,
    "initiativesDesc" TEXT,
    "nabaCertified" BOOLEAN NOT NULL DEFAULT false,
    "isoCertified" BOOLEAN NOT NULL DEFAULT false,
    "certificationDetails" TEXT,
    "nirfParticipated" BOOLEAN NOT NULL DEFAULT false,
    "nirfRank" INTEGER,
    "aqarSubmittedYears" TEXT,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IQACRecord_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GenderProgram" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sensitizationCount" INTEGER NOT NULL DEFAULT 0,
    "safetyFacilities" BOOLEAN NOT NULL DEFAULT false,
    "grievanceCellExists" BOOLEAN NOT NULL DEFAULT false,
    "antiHarassmentCommittee" BOOLEAN NOT NULL DEFAULT false,
    "internalComplaintsCommittee" BOOLEAN NOT NULL DEFAULT false,
    "womenHelpdesk" BOOLEAN NOT NULL DEFAULT false,
    "descriptionJson" TEXT,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GenderProgram_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GreenInitiative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solarPanels" BOOLEAN NOT NULL DEFAULT false,
    "solarCapacityKw" REAL,
    "rainwaterHarvesting" BOOLEAN NOT NULL DEFAULT false,
    "composting" BOOLEAN NOT NULL DEFAULT false,
    "paperlessOffice" BOOLEAN NOT NULL DEFAULT false,
    "eWasteManagement" BOOLEAN NOT NULL DEFAULT false,
    "ledLighting" BOOLEAN NOT NULL DEFAULT false,
    "greenCampusCertified" BOOLEAN NOT NULL DEFAULT false,
    "energyConsumptionKwh" REAL,
    "waterConservationDesc" TEXT,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GreenInitiative_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InclusionActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "activityName" TEXT NOT NULL,
    "participants" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "academicYear" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InclusionActivity_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BestPractice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "practiceDesc" TEXT NOT NULL,
    "evidenceSuccess" TEXT NOT NULL,
    "problemsNotes" TEXT,
    "additionalNotes" TEXT,
    "practiceNumber" INTEGER NOT NULL DEFAULT 1,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BestPractice_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstitutionalDistinctiveness" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniqueCharacters" TEXT NOT NULL,
    "differentiators" TEXT NOT NULL,
    "evidence" TEXT,
    "recognitions" TEXT,
    "universityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InstitutionalDistinctiveness_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_employeeId_key" ON "Faculty"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rollNumber_key" ON "Student"("rollNumber");
