import { Post } from '../types';

const DEPTH_MARKER = '<!--depth-enriched-->';
const CORE_SUMMARY_MARKER = 'data-core-summary="1"';

export function extractReadableText(html: string): string {
  return (html || '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripDepthEnrichment(post: Post): Post {
  if (!post.content.includes(DEPTH_MARKER)) {
    return post;
  }

  const strippedContent = post.content.replace(/\s*<!--depth-enriched-->[\s\S]*$/i, '').trim();
  const plain = extractReadableText(strippedContent);
  const nextExcerpt = plain ? `${plain.slice(0, 240)}...` : post.excerpt;

  return {
    ...post,
    content: strippedContent,
    excerpt: nextExcerpt,
  };
}

function extractSummaryPoints(text: string, maxItems = 3): string[] {
  const normalized = extractReadableText(text);
  if (!normalized) {
    return [];
  }

  const sentenceCandidates = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 35);

  if (sentenceCandidates.length > 0) {
    return sentenceCandidates.slice(0, maxItems);
  }

  return normalized
    .split(/[,;]\s+/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length >= 30)
    .slice(0, maxItems);
}

export function ensureRssCoreSummary(post: Post): Post {
  if (post.source !== 'rss') {
    return post;
  }

  if (post.content.includes(CORE_SUMMARY_MARKER) || /Key Takeaways|Core Summary/i.test(post.content)) {
    return post;
  }

  const points = extractSummaryPoints(`${post.excerpt || ''} ${post.content || ''}`);
  if (points.length === 0) {
    return post;
  }

  const summaryBlock = `
    <section ${CORE_SUMMARY_MARKER} style="margin-top: 2rem;">
      <h2>Core Summary</h2>
      <ul>
        ${points.map((point) => `<li>${point}</li>`).join('')}
      </ul>
    </section>
  `;

  const nextContent = `${post.content}${summaryBlock}`;
  const nextExcerpt = `${extractReadableText(nextContent).slice(0, 240)}...`;

  return {
    ...post,
    content: nextContent,
    excerpt: nextExcerpt,
  };
}

export function isPostSubstantive(post: Post): boolean {
  const normalized = stripDepthEnrichment(post);
  const text = extractReadableText(normalized.content);
  return text.length >= 80;
}
