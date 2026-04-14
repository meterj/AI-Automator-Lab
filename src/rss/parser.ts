// src/rss/parser.ts - RSS 피드 수집

import Parser from 'rss-parser';
import { config } from '../config';
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

  /**
   * 단일 RSS 피드 파싱
   */
  async parseFeed(feedUrl: string): Promise<RSSItem[]> {
    try {
      const feed = await this.parser.parseURL(feedUrl);
      
      return feed.items.map(item => ({
        title: item.title || '제목 없음',
        content: item.contentSnippet || item.content || '',
        link: item.link || '',
        pubDate: item.pubDate,
        author: item.creator || item.author,
        categories: item.categories?.map(c => 
          typeof c === 'string' ? c : (c as { name?: string }).name || ''
        ).filter(c => c) || [],
      }));
    } catch (error) {
      console.error(`RSS 파싱 실패 (${feedUrl}):`, error);
      return [];
    }
  }

  /**
   * 여러 RSS 피드 파싱
   */
  async parseAllFeeds(): Promise<RSSItem[]> {
    const feeds = config.rss.feeds;
    
    if (feeds.length === 0) {
      console.warn('설정된 RSS 피드가 없습니다.');
      return [];
    }

    const results = await Promise.all(
      feeds.map(feed => this.parseFeed(feed))
    );

    return results.flat();
  }

  /**
   * RSS 아이템을 포스트로 변환
   */
  itemToPost(item: RSSItem, options?: { 
    includeSourceLink?: boolean;
    prefix?: string;
    suffix?: string;
  }): Post {
    let htmlContent = '';

    // 1. 도입부 (RSS 출처 명시)
    const sourceText = item.author ? `${item.author} (via RSS)` : 'RSS 뉴스 수집';
    htmlContent += LAYOUT_TEMPLATES.lead(`${item.title}\n\n${sourceText}`);

    // 2. 본문
    htmlContent += `<div style="margin-top: 1.5rem;">${item.content}</div>`;

    // 3. 원본 링크 카드
    if (options?.includeSourceLink && item.link) {
      htmlContent += LAYOUT_TEMPLATES.card('공식 출처', `<a href="${item.link}" target="_blank" style="color: #1a2a6c; text-decoration: underline;">원문 읽기</a>`);
    }

    // 4. 전체 래핑
    const finalHtml = LAYOUT_TEMPLATES.wrap(htmlContent);

    return {
      title: item.title,
      content: finalHtml,
      excerpt: item.content.substring(0, 200) + '...',
      categories: item.categories,
      status: 'draft',
      createdAt: new Date(),
      source: 'rss',
      sourceUrl: item.link,
    };
  }

  /**
   * 특정 키워드로 필터링
   */
  filterByKeywords(items: RSSItem[], keywords: string[]): RSSItem[] {
    if (keywords.length === 0) return items;
    
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    
    return items.filter(item => {
      const title = item.title.toLowerCase();
      const content = item.content.toLowerCase();
      
      return lowerKeywords.some(keyword => 
        title.includes(keyword) || content.includes(keyword)
      );
    });
  }

  /**
   * 날짜 범위로 필터링
   */
  filterByDate(items: RSSItem[], days: number = 7): RSSItem[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return items.filter(item => {
      if (!item.pubDate) return false;
      const itemDate = new Date(item.pubDate);
      return itemDate >= cutoffDate;
    });
  }

  /**
   * 중복 제거
   */
  removeDuplicates(items: RSSItem[]): RSSItem[] {
    const seen = new Set<string>();
    
    return items.filter(item => {
      const key = item.link || `${item.title}:${item.content.substring(0, 100)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * 최신 순 정렬
   */
  sortByDate(items: RSSItem[]): RSSItem[] {
    return [...items].sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return dateB - dateA;
    });
  }

  /**
   * 수집 → 필터링 → 변환 전체 파이프라인
   */
  async collectPosts(options?: {
    keywords?: string[];
    days?: number;
    maxPosts?: number;
    includeSourceLink?: boolean;
    prefix?: string;
    suffix?: string;
  }): Promise<Post[]> {
    let items = await this.parseAllFeeds();
    
    // 중복 제거
    items = this.removeDuplicates(items);
    
    // 필터링
    if (options?.keywords && options.keywords.length > 0) {
      items = this.filterByKeywords(items, options.keywords);
    }
    
    if (options?.days) {
      items = this.filterByDate(items, options.days);
    }
    
    // 정렬
    items = this.sortByDate(items);
    
    // 최대 개수 제한
    if (options?.maxPosts) {
      items = items.slice(0, options.maxPosts);
    }
    
    // 포스트로 변환
    return items.map(item => this.itemToPost(item, options));
  }
}

// 싱글톤 인스턴스
export const rssCollector = new RSSCollector();