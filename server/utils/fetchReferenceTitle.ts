import { SITE_DOMAIN } from 'src/constants';

// Determine reference type and fetch title accordingly
export async function fetchReferenceTitle(reference: string): Promise<string | null> {
  try {
    const response = await fetch(reference, {
      headers: {
        'User-Agent': `Mozilla/5.0 (compatible; ${SITE_DOMAIN}/1.0)`,
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Try to find og:title first
    const ogTitleMatch = html.match(
      /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i,
    );
    if (ogTitleMatch) {
      return ogTitleMatch[1];
    }

    // Fallback to regular title tag
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1].trim();
    }

    return null;
  } catch (error) {
    console.error(`Error fetching title from ${reference}:`, error);
    return null;
  }
}
