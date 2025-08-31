import type { FrourioSpec } from '@frourio/next';
import { ProofSchema } from 'src/schemas/proof';
import { z } from 'zod';

export const frourioSpec = {
  get: {
    query: z
      .object({
        page: z.number().int().positive().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .optional(),
    res: { 200: { body: z.array(ProofSchema).readonly() } },
  },
} satisfies FrourioSpec;
