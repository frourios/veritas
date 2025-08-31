import type { Metadata, Viewport } from 'next';
import type { PropsWithChildren } from 'react';
import { Header } from 'src/components/Header/Header';
import { APP_NAME, SITE_DOMAIN } from 'src/constants';
import { staticPath } from 'src/utils/$path';
import '../styles/globals.css';
import styles from './layout.module.css';

export const metadata: Metadata = {
  title: {
    template: `%s - ${SITE_DOMAIN}`,
    default: APP_NAME,
  },
  description: 'Proofs with LEAN',
  icons: {
    icon: staticPath.favicon_png,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: PropsWithChildren): React.ReactElement {
  return (
    <html lang="ja">
      <body>
        <Header />
        <main className={styles.mainContent}>{children}</main>
      </body>
    </html>
  );
}
