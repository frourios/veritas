import { s3 } from 'server/lib/s3Client';
import { createRoute } from './frourio.server';

function throwError(label: string) {
  return (e: Error): never => {
    /* v8 ignore next 1 */
    throw new Error(`${label} ${e.message}`);
  };
}

export const { GET } = createRoute({
  get: async () => ({
    status: 200,
    body: await Promise.all([s3.health().catch(throwError('S3'))]).then(() => 'ok'),
  }),
});
