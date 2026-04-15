import { Post } from '../types';
import { sanitizePlainText } from './sanitize';

const DEPTH_MARKER = '<!--depth-enriched-->';

function getSourceLabel(source: Post['source']): string {
  switch (source) {
    case 'rss':
      return 'wire source';
    case 'manual':
      return 'editorial source';
    default:
      return 'analysis source';
  }
}

function getMinimumBodyLength(source: Post['source']): number {
  if (source === 'rss') {
    return 520;
  }

  return 340;
}

export function extractReadableText(html: string): string {
  return (html || '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isPostSubstantive(post: Post): boolean {
  const text = extractReadableText(post.content);
  return text.length >= 80;
}

function buildDepthBlocks(post: Post): string {
  const source = getSourceLabel(post.source);
  const summary =
    sanitizePlainText(post.excerpt || '').trim() ||
    extractReadableText(post.content).slice(0, 280) ||
    'The source summary is limited, but the signal is relevant for operational planning.';

  return `
    ${DEPTH_MARKER}
    <section style="margin-top: 2.25rem;">
      <h2>Why this update matters</h2>
      <p>${summary}</p>
      <p>This article is connected to short-term execution choices in tooling, budget priority, and rollout timing.</p>
    </section>
    <section style="margin-top: 1.8rem;">
      <h2>Operator checklist</h2>
      <ul>
        <li>Confirm the baseline before reacting to the headline.</li>
        <li>Map direct impact on roadmap, reliability, and customer communication.</li>
        <li>Track what needs validation in the next 7-30 days.</li>
      </ul>
    </section>
    <section style="margin-top: 1.8rem;">
      <h2>Editorial note</h2>
      <p>This post was expanded automatically because the original ${source} summary was short.</p>
    </section>
  `;
}

export function ensurePostDepth(post: Post): Post {
  const bodyText = extractReadableText(post.content);
  const excerptText = sanitizePlainText(post.excerpt || '');

  const needsBodyExpansion = bodyText.length < getMinimumBodyLength(post.source);
  const needsExcerptExpansion = excerptText.length > 0 && excerptText.length < 90;

  if ((!needsBodyExpansion && !needsExcerptExpansion) || post.content.includes(DEPTH_MARKER)) {
    return post;
  }

  // Legacy empty AI posts should be hidden or regenerated, not padded with synthetic filler blocks.
  if (post.source === 'ai' && bodyText.length < 80) {
    return post;
  }

  const nextContent = `${post.content}${buildDepthBlocks(post)}`;
  const nextText = extractReadableText(nextContent);
  const nextExcerpt = `${nextText.slice(0, 240)}...`;

  return {
    ...post,
    content: nextContent,
    excerpt: nextExcerpt,
  };
}
