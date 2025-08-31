import OpenTimestamps from 'opentimestamps';
import { s3 } from 'server/lib/s3Client';

export async function createOTS(rev: string): Promise<void> {
  try {
    // Check if timestamp already exists
    const otsKey = `timestamps/${rev}.ots`;
    try {
      await s3.getBuffer(otsKey);
      console.log(`Timestamp already exists for Rev ${rev}`);
      return;
    } catch {
      // Timestamp doesn't exist, continue to create it
    }

    // Create timestamp
    const fileData = Buffer.from(rev, 'utf8');
    const detached = OpenTimestamps.DetachedTimestampFile.fromBytes(
      new OpenTimestamps.Ops.OpSHA256(),
      fileData,
    );

    await OpenTimestamps.stamp(detached);

    // Serialize and save to S3
    const serialized = detached.serializeToBytes();
    await s3.upload(otsKey, 'application/octet-stream', serialized);

    console.log(`Successfully created OpenTimestamp for Rev ${rev} and saved to ${otsKey}`);
  } catch (error) {
    console.error(`Failed to create OpenTimestamp for Rev ${rev}:`, error);
    // Don't throw error to avoid blocking the main flow
  }
}
