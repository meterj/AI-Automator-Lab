const SELF_CLOSING_TAGS = ['base', 'embed', 'iframe', 'img', 'input', 'link', 'meta', 'source'];
const BLOCKED_TAGS = ['script', 'object', 'form', 'button', 'textarea', 'select', 'option', 'svg', 'math'];

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

export function sanitizeHtmlFragment(html: string, options?: { removeStyleTags?: boolean }): string {
  let sanitized = html || '';

  sanitized = sanitized.replace(/<!--([\s\S]*?)-->/g, '');

  if (options?.removeStyleTags) {
    sanitized = sanitized.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  }

  sanitized = stripBlockedTags(sanitized);
  sanitized = sanitized.replace(/\son[a-z-]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '');
  sanitized = sanitized.replace(/\s(?:href|src)\s*=\s*(['"])\s*(?:javascript:|data:text\/html)[\s\S]*?\1/gi, ' $1#$1');
  sanitized = sanitized.replace(/\ssrcdoc\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '');
  sanitized = sanitized.replace(/\ssrcset\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '');

  return sanitized.trim();
}

export function sanitizePlainText(value: string): string {
  return (value || '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function toSafeHttpUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}
