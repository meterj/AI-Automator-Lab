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

  private getItemContent(item: Parser.Item): string {
    const extendedItem = item as Parser.Item & {
      'content:encoded'?: string;
      summary?: string;
      description?: string;
    };

    const candidates = [
      extendedItem['content:encoded'],
      item.content,
      item.contentSnippet,
      extendedItem.summary,
      extendedItem.description,
    ]
      .map((candidate) => (typeof candidate === 'string' ? candidate.trim() : ''))
      .filter(Boolean);

    if (candidates.length === 0) {
      return '';
    }

    return candidates.sort((a, b) => sanitizePlainText(b).length - sanitizePlainText(a).length)[0];
  }

  private extractKeySentences(text: string, maxItems = 3): string[] {
    const normalized = sanitizePlainText(text).replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return [];
    }

    const sentenceCandidates = normalized
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= 40);

    const unique: string[] = [];
    const seen = new Set<string>();

    for (const sentence of sentenceCandidates) {
      const key = sentence.toLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      unique.push(sentence);

      if (unique.length >= maxItems) {
        break;
      }
    }

    if (unique.length > 0) {
      return unique;
    }

    return normalized
      .split(/[,;]\s+/)
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length >= 35)
      .slice(0, maxItems);
  }

  private extractEntities(text: string): string[] {
    const matches =
      sanitizePlainText(text).match(/\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}|[A-Z]{2,}(?:\s+[A-Z]{2,})?)\b/g) || [];
    const stopwords = new Set([
      'The',
      'This',
      'That',
      'These',
      'Those',
      'For',
      'And',
      'With',
      'From',
      'Into',
      'Over',
      'Under',
      'A',
      'An',
      'In',
      'On',
      'At',
      'By',
    ]);

    const entities: string[] = [];
    const seen = new Set<string>();

    for (const match of matches) {
      const candidate = match.trim();
      if (candidate.length < 3 || stopwords.has(candidate)) {
        continue;
      }

      const key = candidate.toLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      entities.push(candidate);

      if (entities.length >= 6) {
        break;
      }
    }

    return entities;
  }

  private buildKeyTakeaways(title: string, sourceSummary: string): string {
    const keySentences = this.extractKeySentences(sourceSummary, 3);
    const points =
      keySentences.length > 0
        ? keySentences
        : [`${title} was captured from the feed, but the publisher exposed only a short preview snippet.`];

    return LAYOUT_TEMPLATES.card(
      'Key Takeaways',
      `<ul>${points.map((point) => `<li>${point}</li>`).join('')}</ul>`
    );
  }

  private buildExtendedAnalysis(options: {
    title: string;
    sourceSummary: string;
    sourceName: string;
    categories: string[];
    sourceLink?: string;
  }): string {
    const { title, sourceSummary, sourceName, categories, sourceLink } = options;
    const keywordLine = categories.length > 0 ? categories.slice(0, 4).join(', ') : 'AI operations, product strategy, automation';
    const safeSummary = sourceSummary || 'The source summary is limited, but the topic itself signals an important shift.';
    const namedEntities = this.extractEntities(`${title} ${sourceSummary}`);
    const entityLine = namedEntities.length > 0 ? namedEntities.join(', ') : 'No clearly named entities were exposed in the snippet.';

    const sourceNote = sourceLink
      ? `<p style="margin-top: 0.8rem; color: #5d6770;">Source for verification: ${sourceName}. Original link is attached below.</p>`
      : '';

    return `
      ${LAYOUT_TEMPLATES.section(
        'What this means now',
        `<p>${safeSummary}</p>
         <p>This story matters because <strong>${title}</strong> connects directly to near-term decisions in deployment speed, tooling choices, and team workflows.</p>`
      )}
      ${LAYOUT_TEMPLATES.section(
        'Operational impact',
        `<p>Teams tracking this topic should assess immediate implications in three areas: execution risk, stack compatibility, and customer-facing reliability.</p>
         <p>Priority lens: ${keywordLine}.</p>
         <p><strong>Named entities:</strong> ${entityLine}</p>`
      )}
      ${LAYOUT_TEMPLATES.section(
        'Source context',
        `<p>Use this update as a directional signal, then verify timing, scope, and implementation details against the original publication before acting.</p>
         ${sourceNote}`
      )}
    `;
  }

  private buildBodyContent(options: {
    title: string;
    rawContent: string;
    sourceName: string;
    categories: string[];
    sourceLink?: string;
  }): string {
    const { title, rawContent, sourceName, categories, sourceLink } = options;
    const summaryText = sanitizePlainText(rawContent);
    const normalizedSummary = summaryText || 'Source summary was limited.';
    const keyTakeaways = this.buildKeyTakeaways(title, normalizedSummary);
    const baseContent = `<div style="margin-top: 1.5rem;">${rawContent}</div>`;

    if (summaryText.length >= 780) {
      return `${keyTakeaways}${baseContent}`;
    }

    return `${keyTakeaways}${baseContent}${this.buildExtendedAnalysis({
      title,
      sourceSummary: normalizedSummary,
      sourceName,
      categories,
      sourceLink,
    })}`;
  }

  async parseFeed(feedUrl: string): Promise<RSSItem[]> {
    try {
      const feed = await this.parser.parseURL(feedUrl);

      return feed.items.map((item) => ({
        title: item.title || 'Untitled',
        content: this.getItemContent(item),
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
    const safeCategories = item.categories?.map((category) => sanitizePlainText(category)).filter(Boolean) || [];

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
    htmlContent += this.buildBodyContent({
      title: safeTitle,
      rawContent: safeContent,
      sourceName: hostname || 'the source publication',
      categories: safeCategories,
      sourceLink: safeLink,
    });

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
    const bodyText = sanitizePlainText(htmlContent);
    const generatedExcerpt = bodyText.slice(0, 240);

    return {
      title: safeTitle,
      content: LAYOUT_TEMPLATES.wrap(htmlContent),
      excerpt: generatedExcerpt ? `${generatedExcerpt}...` : (excerpt ? `${excerpt}...` : safeTitle),
      categories: safeCategories,
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
