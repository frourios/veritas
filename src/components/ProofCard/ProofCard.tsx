import Link from 'next/link';
import { CopyButton } from 'src/app/proofs/[rev]/CopyButton';
import type { Proof } from 'src/schemas/proof';
import { pagesPath } from 'src/utils/$path';
import { formatDateTimeInJST } from 'src/utils/dateUtils';
import { OTSButton } from './OTSButton';
import styles from './ProofCard.module.css';

function AuthorsSection({ proof }: { proof: Proof }): React.ReactElement | null {
  if (proof.authors.length === 0) return null;

  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>Authors:</p>
      <ul className={styles.sectionContent}>
        {proof.authors.map((author) => (
          <li key={author.id}>
            {author.name}
            <span className={styles.authorEmail}> ({author.email})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProofFooter({ proof }: { proof: Proof }): React.ReactElement {
  return (
    <div className={styles.proofFooter}>
      <div>Posted: {formatDateTimeInJST(proof.createdAt)}</div>
    </div>
  );
}

export function ProofCard({
  proof,
  variant = 'default',
}: {
  proof: Proof;
  variant?: 'default' | 'detail';
}): React.ReactElement {
  const isDetail = variant === 'detail';

  return (
    <div className={`${styles.proofCard} ${isDetail ? styles.detailCard : ''}`}>
      <div className={styles.proofHeader}>
        <h2 className={`${styles.proofTitle} ${isDetail ? styles.detailTitle : ''}`}>
          <Link
            href={pagesPath.proofs._rev(proof.rev).$url().path}
            className={styles.proofTitleLink}
          >
            {proof.name}
          </Link>
        </h2>
        <div className={styles.headerRight}>
          <OTSButton rev={proof.rev} variant="compact" />
        </div>
      </div>

      <AuthorsSection proof={proof} />

      <div className={styles.section}>
        <p className={styles.sectionLabel}>Repository URL:</p>
        <ul className={styles.sectionContent}>
          {proof.repositories.map((repo) => (
            <li key={repo.id}>
              <Link href={repo.url} target="_brank">
                {repo.url}
              </Link>
              <CopyButton content={repo.url} variant="compact" />
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>References:</p>
        <ul className={styles.sectionContent}>
          {proof.references.map((ref) => (
            <li key={ref.rev}>
              <Link href={pagesPath.proofs._rev(ref.rev).$url().path}>{ref.name}</Link>
            </li>
          ))}
        </ul>
      </div>

      <ProofFooter proof={proof} />
    </div>
  );
}
