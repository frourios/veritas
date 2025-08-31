import { s3 } from 'server/lib/s3Client';
import type { Proof } from 'src/schemas/proof';
import { LakeManifestSchema, ProofSchema } from 'src/schemas/proof';
import { createRoute } from './frourio.server';

import { mkdtemp, readFile, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createOTS } from 'server/utils/openTimestamps';
import type { SimpleGit } from 'simple-git';
import simpleGit from 'simple-git';

type GitAuthor = { name: string; email: string; date: string };

function parseRepoName(repoUrl: string): string {
  const cleaned = repoUrl.replace(/\.git$/, '');
  const parts = cleaned.split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : cleaned;
}

async function fileExists(p: string): Promise<boolean> {
  return await stat(p).then(
    () => true,
    () => false,
  );
}

async function tryReadLakeManifest(repoDir: string): Promise<{ name: string; rev: string }[]> {
  const manifestPath = path.join(repoDir, 'lake-manifest.json');
  if (!(await fileExists(manifestPath))) return [];

  const text = await readFile(manifestPath, 'utf8');
  const json = LakeManifestSchema.parse(JSON.parse(text));
  const refs: { name: string; rev: string }[] = [];
  const packages = json.packages;

  for (const p of packages) {
    const name = p.name;
    const rev = p.rev;

    refs.push({ name, rev });
  }

  return refs;
}

function getS3Keys(rev: string): { baseKey: string; proofKey: string } {
  const baseKey = `proofs/${rev}`;
  return { baseKey, proofKey: `${baseKey}/proof.json` };
}

async function tryGetProofFromCache(proofKey: string): Promise<Proof | null> {
  const keys = await s3.listAllKeys(proofKey);
  if (!keys.includes(proofKey)) return null;

  const buf = await s3.getBuffer(proofKey);
  const text = Buffer.from(buf).toString('utf8');
  const parsed: unknown = JSON.parse(text);
  return ProofSchema.parse(parsed);
}

async function cloneAndCheckout(url: string, rev: string, repoDir: string): Promise<SimpleGit> {
  await simpleGit().clone(url, repoDir, ['--no-tags', '--depth', '1']);
  const git = simpleGit(repoDir);
  await git.fetch(['origin', rev, '--depth', '1']);
  await git.checkout(rev);
  return git;
}

async function getProofCreatedAt(
  git: SimpleGit,
  rev: string,
  fallbackIso: string,
): Promise<string> {
  const single = await git.log({ from: rev, to: rev });
  const e = single.latest ?? single.all[0];
  const dateStr = (e as { date?: string } | undefined)?.date;
  return dateStr ? new Date(dateStr).toISOString() : fallbackIso;
}

function parseAuthorLine(line: string, proofCreatedAt: string): GitAuthor | null {
  const trimmed = line.trim();
  const parts = trimmed.split('|');
  const namePart = parts[0];
  const emailPart = (parts[1] ?? '').trim();
  if (!emailPart) return null;
  const datePart = parts.at(2);

  return { name: namePart || emailPart, email: emailPart, date: datePart ?? proofCreatedAt };
}

function mergeAuthor(map: Map<string, GitAuthor>, author: GitAuthor): void {
  const existing = map.get(author.email);
  if (!existing) {
    map.set(author.email, author);
    return;
  }

  if (author.date && existing.date && new Date(author.date) < new Date(existing.date)) {
    existing.date = author.date;
  }
}

async function collectAuthors(
  git: SimpleGit,
  proofCreatedAt: string,
): Promise<Map<string, GitAuthor>> {
  const authorsMap = new Map<string, GitAuthor>();
  const logs = await git.raw(['log', '--format=%aN|%aE|%aI']);

  for (const line of logs.split('\n')) {
    const parsed = parseAuthorLine(line, proofCreatedAt);
    if (!parsed) continue;
    mergeAuthor(authorsMap, parsed);
  }

  return authorsMap;
}

async function uploadOptionalReadme(repoDir: string, baseKey: string): Promise<void> {
  const readmePath = path.join(repoDir, 'README.md');
  if (!(await fileExists(readmePath))) return;
  const md = await readFile(readmePath);
  await s3.upload(`${baseKey}/README.md`, 'text/markdown', md);
}

async function uploadProofJson(baseKey: string, proof: Proof): Promise<void> {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(proof));
  await s3.upload(`${baseKey}/proof.json`, 'application/json', jsonBytes);
}

export async function fetchProofFromCacheOrGit(rev: string, url: string): Promise<Proof> {
  const { baseKey, proofKey } = getS3Keys(rev);

  const cached = await tryGetProofFromCache(proofKey);
  if (cached) return cached;

  const tmpBase = await mkdtemp(path.join(os.tmpdir(), 'veritas-'));
  const repoDir = path.join(tmpBase, 'repo');
  const nowIso = new Date().toISOString();

  const git = await cloneAndCheckout(url, rev, repoDir);
  const proofCreatedAt = await getProofCreatedAt(git, rev, nowIso);

  const authorsMap = await collectAuthors(git, proofCreatedAt);
  const refs = await tryReadLakeManifest(repoDir);

  const proof: Proof = {
    rev,
    name: parseRepoName(url),
    repositories: [
      {
        id: url,
        url,
        createdAt: proofCreatedAt,
      },
    ],
    authors: Array.from(authorsMap.values()).map((a) => ({
      id: a.email,
      name: a.name,
      email: a.email,
      createdAt: a.date,
    })),
    references: refs.map((r) => ({ rev: r.rev, name: r.name })),
    createdAt: proofCreatedAt,
  };

  await uploadOptionalReadme(repoDir, baseKey);
  await uploadProofJson(baseKey, proof);
  await createOTS(rev);

  return proof;
}

export const { GET } = createRoute({
  get: async ({ params, query }) => {
    return { status: 200, body: await fetchProofFromCacheOrGit(params.rev, query.url) };
  },
});
