import { s3 } from 'server/lib/s3Client';
import type { Proof } from 'src/schemas/proof';
import { ProofSchema } from 'src/schemas/proof';
import type { z } from 'zod';
import type { frourioSpec } from './frourio';
import { createRoute } from './frourio.server';

export async function fetchProofFromCache(key: string): Promise<Proof> {
  const buf = await s3.getBuffer(key);
  const text = Buffer.from(buf).toString('utf8');
  return ProofSchema.parse(JSON.parse(text));
}

export async function fetchReadmeFromCache(rev: string): Promise<string> {
  const buf = await s3.getBuffer(`proofs/${rev}/README.md`);

  return Buffer.from(buf).toString('utf8');
}

export async function fetchProofsFromCache(
  query: z.infer<typeof frourioSpec.get.query>,
): Promise<z.infer<(typeof frourioSpec.get.res)[200]['body']>> {
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 20;
  const skip = (page - 1) * limit;
  const keys = await s3.listAllKeys('proofs/');
  const proofJsonKeys = keys.filter((k) => k.endsWith('/proof.json'));
  const proofs = await Promise.all(proofJsonKeys.map(fetchProofFromCache));

  return [...proofs]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
    .slice(skip, skip + limit);
}

export const { GET } = createRoute({
  get: async ({ query }) => {
    return { status: 200, body: await fetchProofsFromCache(query) };
  },
});
