// src/db/database.ts - Supabase 클라우드 데이터베이스 연동

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { Post } from '../types';

export class PostDatabase {
  private supabase: SupabaseClient | null = null;
  private initialized: boolean = false;

  constructor() {}

  /**
   * 데이터베이스 초기화 (비동기)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    const { url, serviceRoleKey } = config.supabase;
    
    if (!url || !serviceRoleKey) {
      throw new Error('Supabase URL 또는 Service Role Key가 설정되지 않았습니다.');
    }

    this.supabase = createClient(url, serviceRoleKey);
    this.initialized = true;
    console.log('✅ Supabase 클라이언트 초기화 완료');
  }

  /**
   * 초기화 확인
   */
  private ensureInitialized(): void {
    if (!this.supabase || !this.initialized) {
      throw new Error('데이터베이스가 초기화되지 않았습니다. db.initialize()를 먼저 호출하세요.');
    }
  }

  /**
   * 게시글 저장
   */
  async savePost(post: Post): Promise<Post> {
    this.ensureInitialized();
    
    const { data, error } = await this.supabase!
      .from('posts')
      .insert({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        categories: post.categories?.join(','),
        tags: post.tags?.join(','),
        status: post.status,
        published_at: post.publishedAt?.toISOString(),
        wordpress_id: post.wordpressId,
        wordpress_url: post.wordpressUrl,
        source: post.source,
        source_url: post.sourceUrl
      })
      .select()
      .single();

    if (error) {
      console.error('❌ 게시글 저장 실패:', error);
      throw error;
    }

    return this.mapDataToPost(data);
  }

  /**
   * ID로 게시글 조회
   */
  async getPostById(id: number): Promise<Post | null> {
    this.ensureInitialized();

    const { data, error } = await this.supabase!
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapDataToPost(data);
  }

  /**
   * URL로 중복 체크
   */
  async existsByUrl(url: string): Promise<boolean> {
    this.ensureInitialized();
    if (!url) return false;
    
    const { count, error } = await this.supabase!
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('source_url', url);

    if (error) return false;
    return (count || 0) > 0;
  }

  /**
   * 게시글 목록 조회
   */
  async getPosts(options?: {
    source?: 'ai' | 'rss' | 'manual';
    status?: 'draft' | 'publish' | 'pending';
    limit?: number;
    offset?: number;
  }): Promise<Post[]> {
    this.ensureInitialized();
    
    let query = this.supabase!.from('posts').select('*');

    if (options?.source) {
      query = query.eq('source', options.source);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error || !data) return [];
    return data.map(item => this.mapDataToPost(item));
  }

  /**
   * 게시글 업데이트
   */
  async updatePost(id: number, updates: Partial<Post>): Promise<boolean> {
    this.ensureInitialized();
    
    const dbUpdates: any = {};
    const fieldMapping: Record<string, string> = {
      publishedAt: 'published_at',
      wordpressId: 'wordpress_id',
      wordpressUrl: 'wordpress_url'
    };

    for (const [key, value] of Object.entries(updates)) {
      const dbKey = fieldMapping[key] || key;
      if (key === 'categories' || key === 'tags') {
        dbUpdates[dbKey] = (value as string[])?.join(',');
      } else if (key === 'publishedAt') {
        dbUpdates[dbKey] = (value as Date)?.toISOString();
      } else {
        dbUpdates[dbKey] = value;
      }
    }

    const { error } = await this.supabase!
      .from('posts')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('❌ 게시글 업데이트 실패:', error);
      return false;
    }
    
    return true;
  }

  /**
   * 게시글 삭제
   */
  async deletePost(id: number): Promise<boolean> {
    this.ensureInitialized();
    
    const { error } = await this.supabase!
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) return false;
    return true;
  }

  /**
   * 통계 조회
   */
  async getStats(): Promise<{
    total: number;
    bySource: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    this.ensureInitialized();
    
    const { data: allPosts, error } = await this.supabase!.from('posts').select('source, status');

    if (error || !allPosts) return { total: 0, bySource: {}, byStatus: {} };

    const total = allPosts.length;
    const bySource: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    allPosts.forEach(post => {
      bySource[post.source] = (bySource[post.source] || 0) + 1;
      byStatus[post.status] = (byStatus[post.status] || 0) + 1;
    });

    return { total, bySource, byStatus };
  }

  /**
   * 데이터베이스 결과 매핑
   */
  private mapDataToPost(data: any): Post {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      categories: data.categories?.split(',').filter(Boolean),
      tags: data.tags?.split(',').filter(Boolean),
      status: data.status,
      createdAt: new Date(data.created_at),
      publishedAt: data.published_at ? new Date(data.published_at) : undefined,
      wordpressId: data.wordpress_id,
      wordpressUrl: data.wordpress_url,
      source: data.source,
      sourceUrl: data.source_url
    };
  }
}

// 싱글톤 인스턴스
export const db = new PostDatabase();