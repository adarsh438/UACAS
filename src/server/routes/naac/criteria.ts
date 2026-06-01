import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireNaacWriter, requireAccess } from '../../middleware/auth';
import { z } from 'zod';

export const criteriaRouter = Router();
const prisma = new PrismaClient();

// Helper to determine NAAC SSR resource type from URL path
function getResourceType(path: string): string | undefined {
  if (path.includes('/c1/bos')) return 'BOS_MEETING';
  if (path.includes('/c1/newcourse') || path.includes('/c1/courses')) return 'NEW_COURSE';
  if (path.includes('/c1/vac') || path.includes('/c1/valueadded')) return 'VALUE_ADDED_COURSE';
  if (path.includes('/c2/enrollment')) return 'ENROLLMENT';
  if (path.includes('/c2/lo') || path.includes('/c2/learningoutcomes')) return 'LEARNING_OUTCOME';
  if (path.includes('/c3/publications')) return 'PUBLICATION';
  if (path.includes('/c2/fdp') || path.includes('/c3/fdp')) return 'FDP_RECORD';
  return undefined;
}

// Secure all accreditation CRUD routes globally using dynamic RBAC requireAccess middleware
criteriaRouter.use(requireAuth);
criteriaRouter.use((req, res, next) => {
  const action = ['POST', 'PUT', 'DELETE'].includes(req.method) ? 'WRITE' : 'READ';
  const resourceType = getResourceType(req.path);
  return requireAccess(action, resourceType)(req, res, next);
});

async function getUniversityId() {
  const univ = await prisma.university.findFirst();
  return univ?.id || '';
}

// ─────── Helper ───────
function parseBody(req: any) { return req.body; }

// ═══════════════════════════════════════════
// CRITERION I — CURRICULAR ASPECTS
// ═══════════════════════════════════════════

// BoS Meetings
criteriaRouter.get('/c1/bos', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  const data = await prisma.bosMeeting.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) }, orderBy: { meetingDate: 'desc' } });
  res.json(data);
});
criteriaRouter.post('/c1/bos', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.bosMeeting.findFirst({
      where: {
        universityId: uid,
        programName: req.body.programName,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    const record = await prisma.bosMeeting.create({ data: { ...req.body, universityId: uid, meetingDate: new Date(req.body.meetingDate) } });
    res.json(record);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c1/bos/:id', requireAuth, async (req, res) => {
  try {
    const record = await prisma.bosMeeting.update({ where: { id: req.params.id }, data: { ...req.body, meetingDate: new Date(req.body.meetingDate) } });
    res.json(record);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.delete('/c1/bos/:id', requireAuth, async (req, res) => {
  await prisma.bosMeeting.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Value Added Courses
criteriaRouter.get('/c1/vac', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.valueAddedCourse.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c1/vac', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.valueAddedCourse.findFirst({
      where: {
        universityId: uid,
        name: req.body.name,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.valueAddedCourse.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c1/vac/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.valueAddedCourse.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.delete('/c1/vac/:id', requireAuth, async (req, res) => {
  await prisma.valueAddedCourse.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// MOOC Enrollments
criteriaRouter.get('/c1/mooc', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.mOOCEnrollment.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c1/mooc', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.mOOCEnrollment.findFirst({
      where: {
        universityId: uid,
        courseName: req.body.courseName,
        platform: req.body.platform,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.mOOCEnrollment.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c1/mooc/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.mOOCEnrollment.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.delete('/c1/mooc/:id', requireAuth, async (req, res) => {
  await prisma.mOOCEnrollment.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Feedback Records
criteriaRouter.get('/c1/feedback', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.feedbackRecord.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c1/feedback', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.feedbackRecord.findFirst({
      where: {
        universityId: uid,
        stakeholderType: req.body.stakeholderType,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.feedbackRecord.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c1/feedback/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.feedbackRecord.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

// New Courses
criteriaRouter.get('/c1/new-courses', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.newCourse.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c1/new-courses', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.newCourse.findFirst({
      where: {
        universityId: uid,
        courseCode: req.body.courseCode,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.newCourse.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.delete('/c1/new-courses/:id', requireAuth, async (req, res) => {
  await prisma.newCourse.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// ═══════════════════════════════════════════
// CRITERION II — TEACHING-LEARNING
// ═══════════════════════════════════════════

criteriaRouter.get('/c2/enrollment', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.enrollmentRecord.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) }, include: { program: true } }));
});
criteriaRouter.post('/c2/enrollment', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.enrollmentRecord.findFirst({
      where: {
        universityId: uid,
        programId: req.body.programId,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.enrollmentRecord.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c2/enrollment/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.enrollmentRecord.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

criteriaRouter.get('/c2/remedial', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.remedialProgram.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c2/remedial', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.remedialProgram.findFirst({
      where: {
        universityId: uid,
        type: req.body.type,
        description: req.body.description,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.remedialProgram.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.delete('/c2/remedial/:id', requireAuth, async (req, res) => {
  await prisma.remedialProgram.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

criteriaRouter.get('/c2/ict', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.teacherICTRecord.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c2/ict', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.teacherICTRecord.findFirst({
      where: {
        universityId: uid,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.teacherICTRecord.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c2/ict/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.teacherICTRecord.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

criteriaRouter.get('/c2/fdp', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.fDPRecord.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c2/fdp', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.fDPRecord.findFirst({
      where: {
        universityId: uid,
        programName: req.body.programName,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.fDPRecord.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.delete('/c2/fdp/:id', requireAuth, async (req, res) => {
  await prisma.fDPRecord.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

criteriaRouter.get('/c2/exam', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.examRecord.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c2/exam', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.examRecord.findFirst({
      where: {
        universityId: uid,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.examRecord.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c2/exam/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.examRecord.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

criteriaRouter.get('/c2/learning-outcomes', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.learningOutcomeRecord.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) }, include: { program: true } }));
});
criteriaRouter.post('/c2/learning-outcomes', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.learningOutcomeRecord.findFirst({
      where: {
        universityId: uid,
        programId: req.body.programId,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.learningOutcomeRecord.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c2/learning-outcomes/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.learningOutcomeRecord.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

// ═══════════════════════════════════════════
// CRITERION III — RESEARCH
// ═══════════════════════════════════════════

criteriaRouter.get('/c3/grants', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.researchGrant.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c3/grants', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.researchGrant.findFirst({
      where: {
        universityId: uid,
        projectTitle: req.body.projectTitle,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.researchGrant.create({ data: { ...req.body, universityId: uid, amount: parseFloat(req.body.amount) } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c3/grants/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.researchGrant.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.delete('/c3/grants/:id', requireAuth, async (req, res) => {
  await prisma.researchGrant.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

criteriaRouter.get('/c3/patents', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  res.json(await prisma.patent.findMany({ where: { universityId: uid } }));
});
criteriaRouter.post('/c3/patents', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.patent.findFirst({
      where: {
        universityId: uid,
        OR: [
          { patentNumber: req.body.patentNumber },
          { title: req.body.title, year: parseInt(req.body.year) }
        ]
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.patent.create({ data: { ...req.body, universityId: uid, year: parseInt(req.body.year) } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c3/patents/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.patent.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.delete('/c3/patents/:id', requireAuth, async (req, res) => {
  await prisma.patent.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

criteriaRouter.get('/c3/publications', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  res.json(await prisma.publication.findMany({ where: { universityId: uid }, orderBy: { year: 'desc' } }));
});
criteriaRouter.post('/c3/publications', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.publication.findFirst({
      where: {
        universityId: uid,
        title: req.body.title,
        year: parseInt(req.body.year)
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.publication.create({ data: { ...req.body, universityId: uid, year: parseInt(req.body.year) } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c3/publications/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.publication.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.delete('/c3/publications/:id', requireAuth, async (req, res) => {
  await prisma.publication.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

criteriaRouter.get('/c3/mous', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  res.json(await prisma.moU.findMany({ where: { universityId: uid } }));
});
criteriaRouter.post('/c3/mous', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.moU.findFirst({
      where: {
        universityId: uid,
        partnerName: req.body.partnerName
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.moU.create({ data: { ...req.body, universityId: uid, signedDate: req.body.signedDate ? new Date(req.body.signedDate) : null, expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c3/mous/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.moU.update({ where: { id: req.params.id }, data: { ...req.body, signedDate: req.body.signedDate ? new Date(req.body.signedDate) : null, expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null } })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.delete('/c3/mous/:id', requireAuth, async (req, res) => {
  await prisma.moU.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

criteriaRouter.get('/c3/extension', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.extensionActivity.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c3/extension', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.extensionActivity.findFirst({
      where: {
        universityId: uid,
        name: req.body.name,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.extensionActivity.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.delete('/c3/extension/:id', requireAuth, async (req, res) => {
  await prisma.extensionActivity.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// ═══════════════════════════════════════════
// CRITERION IV — INFRASTRUCTURE
// ═══════════════════════════════════════════

criteriaRouter.get('/c4/facility', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.physicalFacility.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c4/facility', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.physicalFacility.findFirst({
      where: {
        universityId: uid,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.physicalFacility.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c4/facility/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.physicalFacility.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

criteriaRouter.get('/c4/library', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.libraryRecord.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c4/library', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.libraryRecord.findFirst({
      where: {
        universityId: uid,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.libraryRecord.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c4/library/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.libraryRecord.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

criteriaRouter.get('/c4/it', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.iTInfrastructure.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c4/it', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.iTInfrastructure.findFirst({
      where: {
        universityId: uid,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.iTInfrastructure.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c4/it/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.iTInfrastructure.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

criteriaRouter.get('/c4/maintenance', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.maintenanceBudget.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c4/maintenance', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.maintenanceBudget.findFirst({
      where: {
        universityId: uid,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.maintenanceBudget.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c4/maintenance/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.maintenanceBudget.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

// ═══════════════════════════════════════════
// CRITERION V — STUDENT SUPPORT
// ═══════════════════════════════════════════

criteriaRouter.get('/c5/scholarships', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.scholarship.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c5/scholarships', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.scholarship.findFirst({
      where: {
        universityId: uid,
        name: req.body.name,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.scholarship.create({ data: { ...req.body, universityId: uid, amountINR: parseFloat(req.body.amountINR) } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c5/scholarships/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.scholarship.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.delete('/c5/scholarships/:id', requireAuth, async (req, res) => {
  await prisma.scholarship.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

criteriaRouter.get('/c5/placements', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.placementRecord.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) }, include: { program: true } }));
});
criteriaRouter.post('/c5/placements', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.placementRecord.findFirst({
      where: {
        universityId: uid,
        companyName: req.body.companyName,
        programId: req.body.programId,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.placementRecord.create({ data: { ...req.body, universityId: uid, studentsPlaced: parseInt(req.body.studentsPlaced), packageLPA: parseFloat(req.body.packageLPA) || null } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c5/placements/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.placementRecord.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.delete('/c5/placements/:id', requireAuth, async (req, res) => {
  await prisma.placementRecord.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

criteriaRouter.get('/c5/competitive-exams', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.competitiveExamResult.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c5/competitive-exams', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.competitiveExamResult.findFirst({
      where: {
        universityId: uid,
        examType: req.body.examType,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.competitiveExamResult.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c5/competitive-exams/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.competitiveExamResult.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.delete('/c5/competitive-exams/:id', requireAuth, async (req, res) => {
  await prisma.competitiveExamResult.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

criteriaRouter.get('/c5/alumni', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  res.json(await prisma.alumniRecord.findMany({ where: { universityId: uid } }));
});
criteriaRouter.post('/c5/alumni', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.alumniRecord.findFirst({
      where: {
        universityId: uid,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.alumniRecord.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c5/alumni/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.alumniRecord.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

// ═══════════════════════════════════════════
// CRITERION VI — GOVERNANCE
// ═══════════════════════════════════════════

criteriaRouter.get('/c6/vision', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  res.json(await prisma.visionMission.findMany({ where: { universityId: uid } }));
});
criteriaRouter.post('/c6/vision', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const existing = await prisma.visionMission.findFirst({ where: { universityId: uid } });
    if (existing) {
      res.json(await prisma.visionMission.update({ where: { id: existing.id }, data: req.body }));
    } else {
      res.json(await prisma.visionMission.create({ data: { ...req.body, universityId: uid } }));
    }
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

criteriaRouter.get('/c6/egovernance', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.eGovernanceRecord.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c6/egovernance', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.eGovernanceRecord.findFirst({
      where: {
        universityId: uid,
        area: req.body.area,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.eGovernanceRecord.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c6/egovernance/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.eGovernanceRecord.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

criteriaRouter.get('/c6/committees', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  res.json(await prisma.adminCommittee.findMany({ where: { universityId: uid } }));
});
criteriaRouter.post('/c6/committees', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.adminCommittee.findFirst({
      where: {
        universityId: uid,
        name: req.body.name
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.adminCommittee.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.delete('/c6/committees/:id', requireAuth, async (req, res) => {
  await prisma.adminCommittee.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

criteriaRouter.get('/c6/financial', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.financialRecord.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c6/financial', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.financialRecord.findFirst({
      where: {
        universityId: uid,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.financialRecord.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.put('/c6/financial/:id', requireAuth, async (req, res) => {
  try { res.json(await prisma.financialRecord.update({ where: { id: req.params.id }, data: req.body })); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

criteriaRouter.get('/c6/iqac', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.iQACRecord.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c6/iqac', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const data = { ...req.body, universityId: uid, constitutionDate: req.body.constitutionDate ? new Date(req.body.constitutionDate) : null };
    const existing = await prisma.iQACRecord.findFirst({ where: { universityId: uid, academicYear: req.body.academicYear } });
    if (existing) res.json(await prisma.iQACRecord.update({ where: { id: existing.id }, data }));
    else res.json(await prisma.iQACRecord.create({ data }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ═══════════════════════════════════════════
// CRITERION VII — INSTITUTIONAL VALUES
// ═══════════════════════════════════════════

criteriaRouter.get('/c7/gender', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.genderProgram.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c7/gender', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const existing = await prisma.genderProgram.findFirst({ where: { universityId: uid, academicYear: req.body.academicYear } });
    if (existing) res.json(await prisma.genderProgram.update({ where: { id: existing.id }, data: req.body }));
    else res.json(await prisma.genderProgram.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

criteriaRouter.get('/c7/green', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.greenInitiative.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c7/green', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const existing = await prisma.greenInitiative.findFirst({ where: { universityId: uid, academicYear: req.body.academicYear } });
    if (existing) res.json(await prisma.greenInitiative.update({ where: { id: existing.id }, data: req.body }));
    else res.json(await prisma.greenInitiative.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

criteriaRouter.get('/c7/inclusion', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.inclusionActivity.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/c7/inclusion', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const duplicate = await prisma.inclusionActivity.findFirst({
      where: {
        universityId: uid,
        activityName: req.body.activityName,
        academicYear: req.body.academicYear
      }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Duplicate entry detected. A record with identical key details already exists for this academic period." });
    }
    res.json(await prisma.inclusionActivity.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
criteriaRouter.delete('/c7/inclusion/:id', requireAuth, async (req, res) => {
  await prisma.inclusionActivity.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

criteriaRouter.get('/c7/best-practices', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  res.json(await prisma.bestPractice.findMany({ where: { universityId: uid } }));
});
criteriaRouter.post('/c7/best-practices', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const existing = await prisma.bestPractice.findFirst({ where: { universityId: uid, practiceNumber: req.body.practiceNumber } });
    if (existing) res.json(await prisma.bestPractice.update({ where: { id: existing.id }, data: req.body }));
    else res.json(await prisma.bestPractice.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

criteriaRouter.get('/c7/distinctiveness', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  res.json(await prisma.institutionalDistinctiveness.findMany({ where: { universityId: uid } }));
});
criteriaRouter.post('/c7/distinctiveness', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const existing = await prisma.institutionalDistinctiveness.findFirst({ where: { universityId: uid } });
    if (existing) res.json(await prisma.institutionalDistinctiveness.update({ where: { id: existing.id }, data: req.body }));
    else res.json(await prisma.institutionalDistinctiveness.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ═══════════════════════════════════════════
// PROGRAMS (shared reference)
// ═══════════════════════════════════════════
criteriaRouter.get('/programs', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  res.json(await prisma.program.findMany({ where: { department: { universityId: uid } }, include: { department: true } }));
});

criteriaRouter.get('/mentoring', requireAuth, async (req, res) => {
  const uid = await getUniversityId();
  const year = req.query.year as string;
  res.json(await prisma.mentoringData.findMany({ where: { universityId: uid, ...(year && { academicYear: year }) } }));
});
criteriaRouter.post('/mentoring', requireAuth, async (req, res) => {
  try {
    const uid = await getUniversityId();
    const existing = await prisma.mentoringData.findFirst({ where: { universityId: uid, academicYear: req.body.academicYear } });
    if (existing) res.json(await prisma.mentoringData.update({ where: { id: existing.id }, data: req.body }));
    else res.json(await prisma.mentoringData.create({ data: { ...req.body, universityId: uid } }));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});
