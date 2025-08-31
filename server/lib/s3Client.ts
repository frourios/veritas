import type { ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import assert from 'assert';
import { MAX_FILE_UPLOAD_SIZE, STORAGE_BASE_PATH } from '../constants';
import {
  S3_ACCESS_KEY,
  S3_BUCKET,
  S3_ENDPOINT,
  S3_REGION,
  S3_SECRET_KEY,
} from '../utils/serverEnvs';

export type S3PutParams = { key: string; data: ArrayBuffer };

export const s3Client = new S3Client({
  forcePathStyle: true,
  ...(S3_ACCESS_KEY && S3_ENDPOINT && S3_SECRET_KEY
    ? {
        endpoint: S3_ENDPOINT,
        region: S3_REGION,
        credentials: { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY },
      }
    : {}),
});

function addPrefix(key: string): string {
  return `${STORAGE_BASE_PATH.slice(1)}/${key}`;
}

export const s3 = {
  health: async (): Promise<boolean> => {
    const command = new ListObjectsV2Command({ Bucket: S3_BUCKET });

    return await s3Client.send(command).then(() => true);
  },
  getSignedUrl: async (
    params:
      | { method: 'get'; key: string }
      | { method: 'put'; key: string; contentLength: number; contentType: string },
  ): Promise<string> => {
    assert(params.method !== 'put' || params.contentLength <= MAX_FILE_UPLOAD_SIZE);

    const command =
      params.method === 'get'
        ? new GetObjectCommand({ Bucket: S3_BUCKET, Key: addPrefix(params.key) })
        : new PutObjectCommand({
            Bucket: S3_BUCKET,
            ContentLength: params.contentLength,
            ContentType: params.contentType,
            Key: addPrefix(params.key),
          });

    return await getSignedUrl(s3Client, command, {
      expiresIn: 24 * 60 * 60,
      signableHeaders: new Set(['content-type', 'content-length']),
    }).then(
      (url) =>
        `${S3_ENDPOINT}/${S3_BUCKET}${STORAGE_BASE_PATH}/${params.key}${url.split(params.key)[1]}`,
    );
  },
  getBuffer: async (key: string): Promise<ArrayBuffer> => {
    const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: addPrefix(key) });

    return await s3Client.send(command).then((res) => {
      assert(res.Body);

      return res.Body.transformToByteArray().then((data) => data.buffer as ArrayBuffer);
    });
  },
  listAllKeys: async (prefix?: string): Promise<string[]> => {
    let continuationToken: string | undefined = undefined;
    const list: ListObjectsV2CommandOutput[] = [];

    do {
      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: prefix && addPrefix(prefix),
        ContinuationToken: continuationToken,
      });

      const res = await s3Client.send(command);

      list.push(res);
      continuationToken = res.NextContinuationToken;
    } while (continuationToken);

    return list
      .flatMap((res) => res.Contents ?? [])
      .map((content) => {
        assert(content.Key);

        return content.Key.replace(`${STORAGE_BASE_PATH.slice(1)}/`, '');
      });
  },
  put: async (params: S3PutParams): Promise<void> => {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      ContentType: 'application/octet-stream',
      Key: addPrefix(params.key),
      Body: Buffer.from(params.data),
    });

    await s3Client.send(command);
  },
  upload: async (key: string, contentType: string, body: Uint8Array): Promise<void> => {
    const upload = new Upload({
      client: s3Client,
      params: { Bucket: S3_BUCKET, ContentType: contentType, Key: addPrefix(key), Body: body },
    });

    await upload.done();
  },
  deleteMany: async (keys: string[]): Promise<void> => {
    const command = new DeleteObjectsCommand({
      Bucket: S3_BUCKET,
      Delete: { Objects: keys.map((k) => ({ Key: addPrefix(k) })) },
    });

    await s3Client.send(command);
  },
};
