import { z } from 'zod';

export const RepositorySchema = z
  .object({
    id: z.string(),
    url: z.string().url(),
    createdAt: z.string(),
  })
  .readonly();

export type Repository = z.infer<typeof RepositorySchema>;

export const AuthorSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    createdAt: z.string(),
  })
  .readonly();

export type Author = z.infer<typeof AuthorSchema>;

export const ReferenceSchema = z
  .object({
    rev: z.string(),
    name: z.string(),
  })
  .readonly();

export const ProofSchema = z
  .object({
    rev: z.string(),
    name: z.string(),
    repositories: z.array(RepositorySchema).readonly(),
    authors: z.array(AuthorSchema).readonly(),
    references: z.array(ReferenceSchema).readonly(),
    createdAt: z.string(),
  })
  .readonly();

export type Proof = z.infer<typeof ProofSchema>;

export const LakeManifestSchema = z
  .object({
    version: z.string(),
    packagesDir: z.string(),
    packages: z
      .array(
        z.object({
          url: z.string().url(),
          type: z.literal('git'),
          subDir: z.string().nullable(),
          scope: z.string(),
          rev: z.string(),
          name: z.string(),
          manifestFile: z.literal('lake-manifest.json'),
          inputRev: z.string(),
          inherited: z.boolean(),
          configFile: z.string(),
        }),
      )
      .readonly(),
  })
  .readonly();

export type LakeManifest = z.infer<typeof LakeManifestSchema>;
