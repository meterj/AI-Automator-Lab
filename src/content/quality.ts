import { Post } from '../types';

export function extractPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getPostQualityIssues(post: Post): string[] {
  const issues: string[] = [];
  const title = post.title.trim();
  const bodyText = extractPlainText(post.content);
  const excerpt = (post.excerpt || '').trim();
  const minBodyLength = post.source === 'rss' ? 620 : 360;
  const minExcerptLength = post.source === 'rss' ? 90 : 60;

  if (title.length < 12) {
    issues.push('title-too-short');
  }

  if (bodyText.length < minBodyLength) {
    issues.push('body-too-short');
  }

  if (excerpt.length > 0 && excerpt.length < minExcerptLength) {
    issues.push('excerpt-too-short');
  }

  if (/^(untitled|test|sample)$/i.test(title)) {
    issues.push('title-placeholder');
  }

  return issues;
}

export function isPostPublishable(post: Post): boolean {
  return getPostQualityIssues(post).length === 0;
}
