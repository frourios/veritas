import JSZip from 'jszip';
import { s3 } from 'server/lib/s3Client';
import { createRoute } from './frourio.server';

async function createZipArchive(rev: string, otsData: ArrayBuffer): Promise<ArrayBuffer> {
  const zip = new JSZip();

  zip.file('rev.txt', rev);
  zip.file('rev.txt.ots', otsData);

  return await zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

export const { GET } = createRoute({
  get: async ({ params }) => {
    const { rev } = params;
    const otsKey = `timestamps/${rev}.ots`;
    const otsData = await s3.getBuffer(otsKey).catch(() => null);

    if (!otsData) {
      return { status: 404, body: { error: 'OpenTimestamp not found for this CID' } };
    }

    const zipArrayBuffer = await createZipArchive(rev, otsData);

    return {
      status: 200,
      body: zipArrayBuffer,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${rev}.zip"`,
      },
    };
  },
});
