import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_URL = 'https://ai-automator-lab.vercel.app';
const API_URL = process.env.WEB_API_URL || process.env.VITE_API_URL || 'https://ai-automator-lab-production.up.railway.app/api';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

function escapeXml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function stripHtml(value = '') {
  return value
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractFirstImage(html = '') {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] || '';
}

async function fetchPosts() {
  try {
    const response = await fetch(`${API_URL}/posts?limit=50`);

    if (!response.ok) {
      throw new Error(`Unexpected response: ${response.status}`);
    }

    const payload = await response.json();
    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    console.warn(`[generate-static-assets] Failed to fetch posts from ${API_URL}:`, error);
    return [];
  }
}

function buildSitemap(posts) {
  const staticUrls = [
    { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/about`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${SITE_URL}/privacy`, changefreq: 'yearly', priority: '0.3' },
    { loc: `${SITE_URL}/terms`, changefreq: 'yearly', priority: '0.3' },
  ];

  const staticEntries = staticUrls.map((entry) => [
    '  <url>',
    `    <loc>${escapeXml(entry.loc)}</loc>`,
    `    <changefreq>${entry.changefreq}</changefreq>`,
    `    <priority>${entry.priority}</priority>`,
    '  </url>',
  ].join('\n'));

  const articleUrls = posts
    .filter((post) => post?.id)
    .map((post) => {
      const lastmod = post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString();

      return [
        '  <url>',
        `    <loc>${escapeXml(`${SITE_URL}/post/${post.id}`)}</loc>`,
        `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
        '    <changefreq>daily</changefreq>',
        '    <priority>0.8</priority>',
        '  </url>',
      ].join('\n');
    });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticEntries,
    ...articleUrls,
    '</urlset>',
    '',
  ].join('\n');
}

function buildFeed(posts) {
  const items = posts
    .filter((post) => post?.id && post?.title)
    .slice(0, 20)
    .map((post) => {
      const link = `${SITE_URL}/post/${post.id}`;
      const description = stripHtml(post.excerpt || post.content || '').slice(0, 280) || `${post.title} from AI Automator Lab.`;
      const image = extractFirstImage(post.content || '');
      const publicationDate = post.createdAt ? new Date(post.createdAt).toUTCString() : new Date().toUTCString();

      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid>${escapeXml(link)}</guid>`,
        `      <pubDate>${escapeXml(publicationDate)}</pubDate>`,
        `      <description>${escapeXml(description)}</description>`,
        image ? `      <enclosure url="${escapeXml(image)}" type="image/jpeg" />` : '',
        '    </item>',
      ].filter(Boolean).join('\n');
    });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    '    <title>AI Automator Lab</title>',
    '    <link>https://ai-automator-lab.vercel.app/</link>',
    '    <description>Daily AI news, automation monitoring, and source-linked analysis.</description>',
    `    <lastBuildDate>${escapeXml(new Date().toUTCString())}</lastBuildDate>`,
    '    <language>en-us</language>',
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

await mkdir(publicDir, { recursive: true });

const posts = await fetchPosts();
await writeFile(path.join(publicDir, 'sitemap.xml'), buildSitemap(posts), 'utf8');
await writeFile(path.join(publicDir, 'feed.xml'), buildFeed(posts), 'utf8');

console.log(`[generate-static-assets] Wrote sitemap and feed with ${posts.length} posts.`);
