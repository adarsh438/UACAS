// src/server/services/nbaAttainmentEngine.ts — NBA CO-PO Attainment Computation
// CO attainment = weighted avg of direct (70%) + indirect (30%)
// PO attainment = weighted avg of mapped CO attainments (weighted by correlation level)
// Level mapping: <1.5 = Level 1, 1.5-2.5 = Level 2, >2.5 = Level 3

export interface CoAttainmentInput {
  coId: string;
  directScore: number;   // 0-3
  indirectScore: number; // 0-3
}

export interface CoPoMappingInput {
  coId: string;
  poId: string;
  correlationLevel: number; // 1, 2, or 3
}

export interface CoAttainmentResult {
  coId: string;
  directScore: number;
  indirectScore: number;
  finalAttainment: number;
}

export interface PoAttainmentResult {
  poId: string;
  poNumber: number;
  attainmentLevel: number;
  target: number;
  isAboveTarget: boolean;
  level: string; // "Level 1", "Level 2", "Level 3"
  mappedCOs: number;
}

export function computeCoAttainment(input: CoAttainmentInput): CoAttainmentResult {
  const directWeight = 0.70;
  const indirectWeight = 0.30;
  const finalAttainment = input.directScore * directWeight + input.indirectScore * indirectWeight;

  return {
    coId: input.coId,
    directScore: Math.round(input.directScore * 100) / 100,
    indirectScore: Math.round(input.indirectScore * 100) / 100,
    finalAttainment: Math.round(finalAttainment * 100) / 100,
  };
}

export function computePoAttainment(
  poId: string,
  poNumber: number,
  coAttainments: CoAttainmentResult[],
  mappings: CoPoMappingInput[],
  target: number = 2.0
): PoAttainmentResult {
  // Filter mappings for this PO
  const poMappings = mappings.filter(m => m.poId === poId);

  if (poMappings.length === 0) {
    return {
      poId, poNumber,
      attainmentLevel: 0,
      target,
      isAboveTarget: false,
      level: 'N/A',
      mappedCOs: 0,
    };
  }

  // Weighted average: each CO's attainment is weighted by its correlation level
  let totalWeight = 0;
  let weightedSum = 0;

  for (const mapping of poMappings) {
    const coAtt = coAttainments.find(c => c.coId === mapping.coId);
    if (coAtt) {
      weightedSum += coAtt.finalAttainment * mapping.correlationLevel;
      totalWeight += mapping.correlationLevel;
    }
  }

  const attainmentLevel = totalWeight > 0
    ? Math.round((weightedSum / totalWeight) * 100) / 100
    : 0;

  const level = attainmentLevel < 1.5
    ? 'Level 1'
    : attainmentLevel < 2.5
      ? 'Level 2'
      : 'Level 3';

  return {
    poId,
    poNumber,
    attainmentLevel,
    target,
    isAboveTarget: attainmentLevel >= target,
    level,
    mappedCOs: poMappings.length,
  };
}

export function computeAllAttainments(
  coInputs: CoAttainmentInput[],
  mappings: CoPoMappingInput[],
  poDefinitions: { poId: string; poNumber: number; target?: number }[],
): {
  coAttainments: CoAttainmentResult[];
  poAttainments: PoAttainmentResult[];
  overallProgramAttainment: number;
  programLevel: string;
} {
  // Step 1: Compute CO attainments
  const coAttainments = coInputs.map(computeCoAttainment);

  // Step 2: Compute PO attainments from CO attainments + mappings
  const poAttainments = poDefinitions.map(po =>
    computePoAttainment(po.poId, po.poNumber, coAttainments, mappings, po.target || 2.0)
  );

  // Step 3: Compute overall program attainment (average of all PO attainments)
  const activePOs = poAttainments.filter(p => p.mappedCOs > 0);
  const overallProgramAttainment = activePOs.length > 0
    ? Math.round(
        (activePOs.reduce((s, p) => s + p.attainmentLevel, 0) / activePOs.length) * 100
      ) / 100
    : 0;

  const programLevel = overallProgramAttainment < 1.5
    ? 'Level 1'
    : overallProgramAttainment < 2.5
      ? 'Level 2'
      : 'Level 3';

  return { coAttainments, poAttainments, overallProgramAttainment, programLevel };
}
