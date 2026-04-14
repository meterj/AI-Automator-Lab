import Parser from 'rss-parser';
import { config } from '../config';
import { sanitizeHtmlFragment, sanitizePlainText, escapeHtmlAttribute, toSafeHttpUrl } from '../content/sanitize';
import { RSSItem, Post } from '../types';
import { LAYOUT_TEMPLATES } from '../wordpress/templates/post-style';

export class RSSCollector {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'WordPress-Auto-Blog/1.0',
      },
    });
  }

  private extractImageUrl(item: Parser.Item): string | undefined {
    const candidateValues = [
      item.enclosure?.url,
      (item as Parser.Item & { image?: { url?: string } }).image?.url,
      (item as Parser.Item & { thumbnail?: { url?: string } }).thumbnail?.url,
      (item as Parser.Item & { 'media:content'?: Array<{ $?: { url?: string } }> })['media:content']?.[0]?.$?.url,
      (item as Parser.Item & { 'media:thumbnail'?: Array<{ $?: { url?: string } }> })['media:thumbnail']?.[0]?.$?.url,
    ];

    return candidateValues.find((candidate) => typeof candidate === 'string' && /^https?:\/\//i.test(candidate));
  }

  private extractHostname(link: string): string | null {
    try {
      return new URL(link).hostname.replace(/^www\./i, '');
    } catch {
      return null;
    }
  }

  async parseFeed(feedUrl: string): Promise<RSSItem[]> {
    try {
      const feed = await this.parser.parseURL(feedUrl);

      return feed.items.map((item) => ({
        title: item.title || 'Untitled',
        content: item.contentSnippet || item.content || '',
        link: item.link || '',
        pubDate: item.pubDate,
        author: item.creator || item.author,
        categories: item.categories
          ?.map((category) => (typeof category === 'string' ? category : (category as { name?: string }).name || ''))
          .filter(Boolean) || [],
        imageUrl: this.extractImageUrl(item),
      }));
    } catch (error) {
      console.error(`RSS parse failed (${feedUrl}):`, error);
      return [];
    }
  }

  async parseAllFeeds(): Promise<RSSItem[]> {
    const feeds = config.rss.feeds;

    if (feeds.length === 0) {
      console.warn('No RSS feeds configured.');
      return [];
    }

    const results = await Promise.all(feeds.map((feed) => this.parseFeed(feed)));
    return results.flat();
  }

  itemToPost(
    item: RSSItem,
    options?: {
      includeSourceLink?: boolean;
      prefix?: string;
      suffix?: string;
    }
  ): Post {
    const safeTitle = sanitizePlainText(item.title) || 'Untitled';
    const safeContent = sanitizeHtmlFragment(item.content, { removeStyleTags: true });
    const safeImageUrl = toSafeHttpUrl(item.imageUrl);
    const safeLink = toSafeHttpUrl(item.link);
    const safeAuthor = sanitizePlainText(item.author || '');
    const hostname = safeLink ? this.extractHostname(safeLink) : null;

    let htmlContent = '';

    if (safeImageUrl) {
      htmlContent += `
        <figure style="margin: 0 0 1.75rem;">
          <img
            src="${safeImageUrl}"
            alt="${escapeHtmlAttribute(safeTitle)}"
            style="width: 100%; max-height: 520px; object-fit: cover; border-radius: 18px; display: block;"
          />
        </figure>
      `;
    }

    const sourceText = safeAuthor
      ? `${safeAuthor}${hostname ? ` | ${hostname}` : ''}`
      : hostname || 'Collected from RSS';

    htmlContent += LAYOUT_TEMPLATES.lead(`${safeTitle}\n\n${sourceText}`);
    htmlContent += `<div style="margin-top: 1.5rem;">${safeContent}</div>`;

    if (options?.includeSourceLink && safeLink) {
      const publishedAt = item.pubDate
        ? new Date(item.pubDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
        : 'Unknown';

      htmlContent += LAYOUT_TEMPLATES.card(
        'Original Source',
        `<p>Publisher: ${hostname || 'Unknown source'}</p>
         <p>Published: ${publishedAt}</p>
         <p><a href="${safeLink}" target="_blank" rel="noopener noreferrer" style="color: #1a2a6c; text-decoration: underline;">Read the full article</a></p>`
      );
    }

    const excerpt = sanitizePlainText(safeContent).slice(0, 200);

    return {
      title: safeTitle,
      content: LAYOUT_TEMPLATES.wrap(htmlContent),
      excerpt: excerpt ? `${excerpt}...` : safeTitle,
      categories: item.categories?.map((category) => sanitizePlainText(category)).filter(Boolean),
      status: 'draft',
      createdAt: new Date(),
      source: 'rss',
      sourceUrl: safeLink,
    };
  }

  filterByKeywords(items: RSSItem[], keywords: string[]): RSSItem[] {
    if (keywords.length === 0) {
      return items;
    }

    const lowerKeywords = keywords.map((keyword) => keyword.toLowerCase());

    return items.filter((item) => {
      const title = item.title.toLowerCase();
      const content = item.content.toLowerCase();

      return lowerKeywords.some((keyword) => title.includes(keyword) || content.includes(keyword));
    });
  }

  filterByDate(items: RSSItem[], days = 7): RSSItem[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return items.filter((item) => {
      if (!item.pubDate) {
        return false;
      }

      return new Date(item.pubDate) >= cutoffDate;
    });
  }

  removeDuplicates(items: RSSItem[]): RSSItem[] {
    const seen = new Set<string>();

    return items.filter((item) => {
      const key = item.link || `${item.title}:${item.content.substring(0, 100)}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  sortByDate(items: RSSItem[]): RSSItem[] {
    return [...items].sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return dateB - dateA;
    });
  }

  async collectPosts(options?: {
    keywords?: string[];
    days?: number;
    maxPosts?: number;
    includeSourceLink?: boolean;
    prefix?: string;
    suffix?: string;
  }): Promise<Post[]> {
    let items = await this.parseAllFeeds();

    items = this.removeDuplicates(items);

    if (options?.keywords && options.keywords.length > 0) {
      items = this.filterByKeywords(items, options.keywords);
    }

    if (options?.days) {
      items = this.filterByDate(items, options.days);
    }

    items = this.sortByDate(items);

    if (options?.maxPosts) {
      items = items.slice(0, options.maxPosts);
    }

    return items.map((item) => this.itemToPost(item, options));
  }
}

export const rssCollector = new RSSCollector();
