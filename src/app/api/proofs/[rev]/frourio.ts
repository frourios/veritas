import type { FrourioSpec } from '@frourio/next';
import { ProofSchema } from 'src/schemas/proof';
import { z } from 'zod';

export const frourioSpec = {
  get: {
    query: z.object({
      url: z.string().url(),
    }),
    res: { 200: { body: ProofSchema } },
  },
} satisfies FrourioSpec;
