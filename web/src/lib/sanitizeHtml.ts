const SELF_CLOSING_TAGS = ['base', 'embed', 'iframe', 'input', 'link', 'meta', 'source'];
const BLOCKED_TAGS = ['script', 'style', 'noscript', 'object', 'form', 'button', 'textarea', 'select', 'option', 'svg', 'math'];

function stripBlockedTags(html: string): string {
  let sanitized = html;

  for (const tag of BLOCKED_TAGS) {
    sanitized = sanitized.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'), '');
  }

  for (const tag of SELF_CLOSING_TAGS) {
    sanitized = sanitized.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi'), '');
  }

  return sanitized;
}

export function sanitizeHtml(html: string | undefined): string {
  if (!html) {
    return '';
  }

  let sanitized = html;
  sanitized = sanitized.replace(/<!--([\s\S]*?)-->/g, '');
  sanitized = stripBlockedTags(sanitized);
  sanitized = sanitized.replace(/\son[a-z-]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '');
  sanitized = sanitized.replace(/\s(?:href|src)\s*=\s*(['"])\s*(?:javascript:|data:text\/html)[\s\S]*?\1/gi, ' $1#$1');
  sanitized = sanitized.replace(/\ssrcdoc\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '');
  sanitized = sanitized.replace(/\ssrcset\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '');

  return sanitized.trim();
}
