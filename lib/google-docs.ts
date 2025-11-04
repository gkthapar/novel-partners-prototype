// Utility to fetch and parse Google Docs

export interface GoogleDocContent {
  id: string;
  title: string;
  content: string;
  html: string;
  url: string;
}

/**
 * Extract document ID from Google Docs URL
 */
export function extractDocId(url: string): string | null {
  const patterns = [
    /\/document\/d\/([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Fetch Google Doc content as plain text
 * Uses the public export URL which works for docs with link sharing enabled
 */
export async function fetchGoogleDocAsText(docIdOrUrl: string): Promise<string> {
  const docId = docIdOrUrl.includes('docs.google.com')
    ? extractDocId(docIdOrUrl)
    : docIdOrUrl;

  if (!docId) {
    throw new Error('Invalid Google Docs URL or ID');
  }

  // Use the export URL which works for publicly shared docs
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

  try {
    const response = await fetch(exportUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }

    const text = await response.text();
    return text;
  } catch (error: any) {
    throw new Error(`Error fetching Google Doc: ${error.message}`);
  }
}

/**
 * Fetch Google Doc content as HTML
 * Better for preserving formatting
 */
export async function fetchGoogleDocAsHtml(docIdOrUrl: string): Promise<string> {
  const docId = docIdOrUrl.includes('docs.google.com')
    ? extractDocId(docIdOrUrl)
    : docIdOrUrl;

  if (!docId) {
    throw new Error('Invalid Google Docs URL or ID');
  }

  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;

  try {
    const response = await fetch(exportUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }

    const html = await response.text();
    return html;
  } catch (error: any) {
    throw new Error(`Error fetching Google Doc: ${error.message}`);
  }
}

/**
 * Fetch full Google Doc with both text and HTML
 */
export async function fetchGoogleDoc(docIdOrUrl: string): Promise<GoogleDocContent> {
  const docId = docIdOrUrl.includes('docs.google.com')
    ? extractDocId(docIdOrUrl)!
    : docIdOrUrl;

  const [text, html] = await Promise.all([
    fetchGoogleDocAsText(docId),
    fetchGoogleDocAsHtml(docId)
  ]);

  // Extract title from HTML (appears in <title> tag)
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : 'Untitled Document';

  return {
    id: docId,
    title,
    content: text,
    html,
    url: `https://docs.google.com/document/d/${docId}/edit`
  };
}

/**
 * Convert HTML to clean markdown (simplified)
 */
export function htmlToMarkdown(html: string): string {
  let markdown = html;

  // Remove style tags and content
  markdown = markdown.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Convert headings
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');

  // Convert bold and italic
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Convert lists
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  markdown = markdown.replace(/<ul[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/ul>/gi, '\n');
  markdown = markdown.replace(/<ol[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/ol>/gi, '\n');

  // Convert paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

  // Convert line breaks
  markdown = markdown.replace(/<br[^>]*>/gi, '\n');

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  markdown = markdown.replace(/&nbsp;/g, ' ');
  markdown = markdown.replace(/&amp;/g, '&');
  markdown = markdown.replace(/&lt;/g, '<');
  markdown = markdown.replace(/&gt;/g, '>');
  markdown = markdown.replace(/&quot;/g, '"');
  markdown = markdown.replace(/&#39;/g, "'");

  // Clean up extra whitespace
  markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');
  markdown = markdown.trim();

  return markdown;
}
