import 'katex/dist/katex.min.css';
import type { Metadata } from 'next';
import { cache } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { fetchProofFromCache, fetchReadmeFromCache } from 'src/app/api/proofs/route';
import { ProofCard } from 'src/components/ProofCard/ProofCard';
import { SITE_DOMAIN, URL_ORIGIN } from 'src/constants';
import type { Proof } from 'src/schemas/proof';
import { pagesPath } from 'src/utils/$path';
import { formatJPDateFromISO } from 'src/utils/dateUtils';
import { CopyButton } from './CopyButton';
import styles from './page.module.css';

interface PageProps {
  params: { rev: string };
}

const getCachedProofContent = cache(async (rev: string) => {
  return fetchProofFromCache(`proofs/${rev}/proof.json`).catch(() => null);
});

export const revalidate = 31536000; // 1 year in seconds

export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const proof = await getCachedProofContent(params.rev);

  if (proof === null) {
    return {
      title: `Proof Not Found - ${SITE_DOMAIN}`,
      description: 'The requested proof could not be found.',
    };
  }

  const description = `${proof.name} by ${proof.authors.map((a) => a.name).join(', ') || 'Unknown'}`;

  return {
    title: proof.name,
    description,
    openGraph: {
      title: proof.name,
      description,
      type: 'article',
      url: `${URL_ORIGIN}${pagesPath.proofs._rev(params.rev).$url().path}`,
      siteName: SITE_DOMAIN,
    },
    twitter: { card: 'summary', title: proof.name, description },
  };
}

export default async function Page({ params }: PageProps): Promise<React.ReactElement> {
  const proof = await getCachedProofContent(params.rev);

  if (!proof) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Proof Not Found</h1>
        <p>The requested proof could not be found.</p>
      </div>
    );
  }

  const readme = await fetchReadmeFromCache(params.rev).catch(() => null);

  if (readme === null) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>README content Not Found</h1>
        <p>The requested README could not be found.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ProofCard proof={proof} variant="detail" />
      <ContentSection title="README" content={readme} proof={proof} />
    </div>
  );
}

function ContentSection({
  title,
  content,
  proof,
}: {
  title: string;
  content: string;
  proof: Proof;
}): React.ReactElement {
  // Pre-process content to fix math environments
  const processedContent = content.replace(/\$\$([\s\S]*?)\$\$/g, (_match, mathContent: string) => {
    // Remove line breaks within math environments to prevent parsing issues
    const processed = mathContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join(' ');

    return `$$${processed}$$`;
  });

  function prepareContentForCopy(): string {
    // Check if content already starts with # title and remove it if present
    const lines = content.split('\n');
    let contentWithoutTitle = content;
    if (lines[0] && lines[0].trim().startsWith('# ')) {
      contentWithoutTitle = lines.slice(1).join('\n');
    }

    const httpUrlText = `**HTTP URL: ${URL_ORIGIN}${pagesPath.proofs._rev(proof.rev).$url().path} **`;
    const formattedDate = `**Date: ${formatJPDateFromISO(proof.createdAt)}**`;
    const authorsText = `**Authors:**\n${proof.authors.map((a) => `- ${a.name} (${a.email}）`).join('\n')}\n\n`;
    const referencesText =
      proof.references.length === 0
        ? ''
        : `**References:**\n${proof.references
            .map(
              (ref) =>
                `- [${ref.name}](${`${URL_ORIGIN}${pagesPath.proofs._rev(ref.rev).$url().path}`})`,
            )
            .join('\n')}\n\n`;

    return `# ${proof.name}\n\n${httpUrlText}  \n${formattedDate}  \n${authorsText}${referencesText}${contentWithoutTitle}`;
  }

  return (
    <div className={styles.contentSection}>
      <div className={styles.contentHeader}>
        <h2 className={styles.contentTitle}>{title}</h2>
        <CopyButton content={prepareContentForCopy()} />
      </div>
      <div className={styles.markdownContent}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[
            [
              rehypeKatex,
              {
                trust: true,
                strict: false,
                throwOnError: false,
                errorColor: '#cc0000',
                fleqn: false,
                leqno: false,
                output: 'html',
                maxExpand: 1000,
              },
            ],
          ]}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
