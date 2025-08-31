'use client';

import { useState } from 'react';
import { apiClient } from 'src/utils/apiClient';
import styles from './OTSButton.module.css';

export function OTSButton({
  rev,
  variant = 'default',
}: {
  rev: string;
  variant?: 'default' | 'compact';
}): React.ReactElement {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload(): Promise<void> {
    setIsDownloading(true);
    setError(null);

    const blob = await apiClient['proofs/[rev]/ots']
      .$get({ params: { rev } })
      .then((res) => new Blob([res]))
      .catch(() => null);

    setIsDownloading(false);

    if (!blob) {
      setError('Failed to download OTS');
      return;
    }

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${rev}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const buttonText = isDownloading ? 'Downloading...' : '🗂️ Download OTS';
  const buttonClass = variant === 'compact' ? styles.compactButton : styles.button;

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={buttonClass}
        type="button"
      >
        {buttonText}
      </button>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
