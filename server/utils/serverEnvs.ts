import { config } from 'dotenv';
import { z } from 'zod';

const NODE_ENV = z
  .enum(['test', 'development', 'production', 'cli'])
  .default('cli')
  .parse(process.env.NODE_ENV);

config();

const S3_ENDPOINT = z.string().default('').parse(process.env.S3_ENDPOINT);
const S3_BUCKET = z.string().default('').parse(process.env.S3_BUCKET);
const S3_PUBLIC_ENDPOINT = z
  .string()
  .url()
  .default(`${S3_ENDPOINT}/${S3_BUCKET}`)
  .parse(process.env.S3_PUBLIC_ENDPOINT);
const S3_ACCESS_KEY = z.string().default('').parse(process.env.S3_ACCESS_KEY);
const S3_SECRET_KEY = z.string().default('').parse(process.env.S3_SECRET_KEY);
const S3_REGION = z.string().default('').parse(process.env.S3_REGION);

export {
  NODE_ENV,
  S3_ACCESS_KEY,
  S3_BUCKET,
  S3_ENDPOINT,
  S3_PUBLIC_ENDPOINT,
  S3_REGION,
  S3_SECRET_KEY,
};
