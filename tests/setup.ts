import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import type { SetupServerApi } from 'msw/lib/node';
import type * as routerMock from 'next-router-mock';
import type * as nextNavigation from 'next/navigation';
import { ulid } from 'ulid';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { setupMsw } from './setupMsw';
import { patchFilePrototype } from './setupMswHandlers';
import { deleteS3Bucket, resetS3Bucket } from './setupUtils';

vi.mock('server/utils/serverEnvs', async (importOriginal) => {
  const actual = await importOriginal<Record<string, string>>();
  const { S3_BUCKET } = await setupS3();

  process.env.S3_BUCKET = S3_BUCKET;

  return { ...actual, S3_BUCKET };
});

// https://github.com/vercel/next.js/discussions/63100#discussioncomment-8737391
vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof nextNavigation>();
  const { useRouter } = await vi.importActual<typeof routerMock>('next-router-mock');
  const usePathname = vi.fn().mockImplementation(() => {
    const router = useRouter();
    return router.pathname;
  });
  const useSearchParams = vi.fn().mockImplementation(() => {
    const router = useRouter();

    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return new URLSearchParams(router.query.toString());
  });

  return {
    ...actual,
    useRouter: (): { replace: (_href: string) => Promise<void> } => ({
      replace: (_href: string) => Promise.resolve(),
    }),
    usePathname,
    useSearchParams,
  };
});

let server: SetupServerApi;

beforeAll(() => {
  server = setupMsw();
  global.alert = (message: string): void => console.error(message);

  patchFilePrototype();
});

afterEach(async () => {
  await resetS3Bucket(createS3Client());

  cleanup();
  vi.clearAllMocks();

  if ('document' in global) {
    localStorage.clear();
    document.cookie.split(';').forEach((cookie) => {
      document.cookie = `${cookie.split('=')[0].trim()}=; Max-Age=0; path=/`;
    });
  }
});

afterAll(async () => {
  server.close();

  await deleteS3Bucket(createS3Client());
});

function createS3Client(): S3Client {
  return new S3Client({
    forcePathStyle: true,
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
  });
}

async function setupS3(): Promise<{ S3_BUCKET: string }> {
  const S3_BUCKET = `test-${ulid().toLowerCase()}`;

  await createS3Client().send(new CreateBucketCommand({ Bucket: S3_BUCKET }));

  return { S3_BUCKET };
}
