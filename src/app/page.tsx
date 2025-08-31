import Link from 'next/link';
import { ProofCard } from 'src/components/ProofCard/ProofCard';
import { pagesPath } from 'src/utils/$path';
import { z } from 'zod';
import { fetchProofsFromCache } from './api/proofs/route';
import styles from './page.module.css';

export type OptionalQuery = { page?: string } | undefined;

function queryToPage(query: OptionalQuery): number {
  return (
    z
      .number()
      .int()
      .positive()
      .safeParse(+(query?.page ?? 1)).data || 1
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: OptionalQuery;
}): Promise<React.ReactElement> {
  const page = queryToPage(searchParams);
  const limit = 20;
  const proofs = await fetchProofsFromCache({ page, limit }).catch(() => null);

  if (!proofs) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>Server Error</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.proofsGrid}>
        {proofs.map((proof) => (
          <ProofCard key={proof.rev} proof={proof} />
        ))}
      </div>

      <div className={styles.pagination}>
        {page > 1 ? (
          <Link
            href={pagesPath.$url({ query: { page: `${page - 1}` } }).path}
            className={styles.paginationButton}
          >
            Previous
          </Link>
        ) : (
          <button disabled className={styles.paginationButton}>
            Previous
          </button>
        )}
        <span className={styles.pageInfo}>Page {page}</span>
        {proofs.length < limit ? (
          <button disabled className={styles.paginationButton}>
            Next
          </button>
        ) : (
          <Link
            href={pagesPath.$url({ query: { page: `${page + 1}` } }).path}
            className={styles.paginationButton}
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
