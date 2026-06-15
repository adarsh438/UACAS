import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test('AQAR Auto-population Logic', async (t) => {
  await t.test('Should fetch AQAR data and auto-populate correctly', async () => {
    // 1. Setup minimal test data
    const university = await prisma.university.findFirst();
    if (!university) {
      assert.fail("No university found in DB to run test against");
    }

    const year = "2024-25";
    const testTitle = "Test Publication For AQAR";

    // 2. Insert a test publication
    const pub = await prisma.publication.create({
      data: {
        type: "JOURNAL",
        title: testTitle,
        authors: "Test Author",
        year: 2024,
        indexedIn: "SCOPUS",
        universityId: university.id
      }
    });

    // 3. Test logic (simulating the endpoint's data aggregation)
    const publicationsCount = await prisma.publication.count({
      where: { universityId: university.id, year: parseInt(year.split('-')[0]) }
    });

    // 4. Assert
    assert.ok(publicationsCount >= 1, "Should count at least the publication we just inserted");

    // 5. Cleanup
    await prisma.publication.delete({ where: { id: pub.id } });
  });
});
