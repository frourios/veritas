import type { Metadata } from 'next';
import { APP_NAME } from 'src/constants';
import About from './about.mdx';

export const metadata: Metadata = {
  title: APP_NAME,
};

export default function AboutPage(): React.ReactElement {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <About />
    </div>
  );
}
