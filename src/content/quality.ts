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

  if (title.length < 12) {
    issues.push('title-too-short');
  }

  if (bodyText.length < 280) {
    issues.push('body-too-short');
  }

  if (excerpt.length > 0 && excerpt.length < 60) {
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
