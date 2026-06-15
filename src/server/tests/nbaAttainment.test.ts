import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAllAttainments, CoAttainmentInput, CoPoMappingInput } from '../services/nbaAttainmentEngine';

test('NBA Attainment Engine', async (t) => {
  await t.test('Should calculate CO and PO attainments correctly', () => {
    // 1. Setup mock data
    const mockMappings: CoPoMappingInput[] = [
      { coId: 'c1', poId: 'p1', correlationLevel: 3 },
      { coId: 'c2', poId: 'p1', correlationLevel: 2 },
      { coId: 'c1', poId: 'p2', correlationLevel: 1 },
    ];

    const mockCoAttainments: CoAttainmentInput[] = [
      { coId: 'c1', directScore: 2.5, indirectScore: 2.0 },
      { coId: 'c2', directScore: 2.0, indirectScore: 2.5 },
    ];

    const mockPoDefinitions = [
      { poId: 'p1', poNumber: 1, target: 2.0 },
      { poId: 'p2', poNumber: 2, target: 1.5 },
    ];

    // 2. Call engine
    const { coAttainments, poAttainments } = computeAllAttainments(
      mockCoAttainments,
      mockMappings,
      mockPoDefinitions
    );

    // 3. Assert CO Attainments
    // c1: (2.5 * 0.7) + (2.0 * 0.3) = 1.75 + 0.6 = 2.35
    const c1 = coAttainments.find(c => c.coId === 'c1');
    assert.equal(c1?.finalAttainment.toFixed(2), '2.35');

    // c2: (2.0 * 0.7) + (2.5 * 0.3) = 1.4 + 0.75 = 2.15
    const c2 = coAttainments.find(c => c.coId === 'c2');
    assert.equal(c2?.finalAttainment.toFixed(2), '2.15');

    // 4. Assert PO Attainments
    // p1 involves c1 (level 3) and c2 (level 2)
    // p1 attainment = ((3 * 2.35) + (2 * 2.15)) / 5 = (7.05 + 4.30) / 5 = 11.35 / 5 = 2.27
    const p1 = poAttainments.find(p => p.poId === 'p1');
    assert.equal(p1?.attainmentLevel.toFixed(2), '2.27');

    // p2 involves c1 (level 1)
    // p2 attainment = (1 * 2.35) / 1 = 2.35
    const p2 = poAttainments.find(p => p.poId === 'p2');
    assert.equal(p2?.attainmentLevel.toFixed(2), '2.35');
  });
});
