'use client';

import { useState } from 'react';
import styles from './page.module.css';

export function CopyButton({
  content,
  variant = 'default',
}: {
  content: string;
  variant?: 'default' | 'compact';
}): React.ReactElement {
  const [copied, setCopied] = useState(false);

  async function handleCopyText(): Promise<void> {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  }

  const isCompact = variant === 'compact';

  return (
    <div className={styles.copyButtonContainer}>
      {copied && <span className={styles.copiedMessage}>コピーしました</span>}
      <button
        type="button"
        onClick={handleCopyText}
        className={`${styles.copyButton} ${isCompact ? styles.compactButton : ''}`}
      >
        Copy
      </button>
    </div>
  );
}
