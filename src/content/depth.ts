import { Post } from '../types';

const DEPTH_MARKER = '<!--depth-enriched-->';

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

export function isPostSubstantive(post: Post): boolean {
  const normalized = stripDepthEnrichment(post);
  const text = extractReadableText(normalized.content);
  return text.length >= 80;
}
