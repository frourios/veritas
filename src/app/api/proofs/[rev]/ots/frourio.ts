import type { FrourioSpec } from '@frourio/next';
import { z } from 'zod';

export const frourioSpec = {
  get: {
    res: {
      200: { body: z.instanceof(ArrayBuffer), headers: z.record(z.string()) },
      404: { body: z.object({ error: z.string() }) },
      500: { body: z.object({ error: z.string() }) },
    },
  },
} satisfies FrourioSpec;
