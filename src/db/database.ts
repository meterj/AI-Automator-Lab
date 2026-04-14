import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { sanitizeHtmlFragment, sanitizePlainText } from '../content/sanitize';
import { Post } from '../types';

type SubscriberMetadata = {
  sourcePage?: string;
  referrer?: string;
  userAgent?: string;
};

type SubscriberRecord = {
  id: number;
};

export class PostDatabase {
  private supabase: SupabaseClient | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const { url, serviceRoleKey } = config.supabase;

    if (!url || !serviceRoleKey) {
      throw new Error('Supabase URL and service role key must be configured.');
    }

    this.supabase = createClient(url, serviceRoleKey);
    this.initialized = true;
    console.log('[Database] Supabase client initialized');
  }

  private ensureInitialized(): void {
    if (!this.supabase || !this.initialized) {
      throw new Error('Database is not initialized. Call db.initialize() before use.');
    }
  }

  private normalizePost(post: Post): Post {
    return {
      ...post,
      title: sanitizePlainText(post.title),
      excerpt: post.excerpt ? sanitizePlainText(post.excerpt) : undefined,
      content: sanitizeHtmlFragment(post.content),
      categories: post.categories?.map((category) => sanitizePlainText(category)).filter(Boolean),
      tags: post.tags?.map((tag) => sanitizePlainText(tag)).filter(Boolean),
    };
  }

  async savePost(post: Post): Promise<Post> {
    this.ensureInitialized();

    const normalizedPost = this.normalizePost(post);

    const { data, error } = await this.supabase!
      .from('posts')
      .insert({
        title: normalizedPost.title,
        content: normalizedPost.content,
        excerpt: normalizedPost.excerpt,
        categories: normalizedPost.categories?.join(','),
        tags: normalizedPost.tags?.join(','),
        status: normalizedPost.status,
        published_at: normalizedPost.publishedAt?.toISOString(),
        wordpress_id: normalizedPost.wordpressId,
        wordpress_url: normalizedPost.wordpressUrl,
        source: normalizedPost.source,
        source_url: normalizedPost.sourceUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('[Database] Failed to save post:', error);
      throw error;
    }

    return this.mapDataToPost(data);
  }

  async getPostById(id: number): Promise<Post | null> {
    this.ensureInitialized();

    const { data, error } = await this.supabase!
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapDataToPost(data);
  }

  async existsByUrl(url: string): Promise<boolean> {
    this.ensureInitialized();

    if (!url) {
      return false;
    }

    const { count, error } = await this.supabase!
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('source_url', url);

    if (error) {
      return false;
    }

    return (count || 0) > 0;
  }

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

    if (error || !data) {
      return [];
    }

    return data.map((item) => this.mapDataToPost(item));
  }

  async updatePost(id: number, updates: Partial<Post>): Promise<boolean> {
    this.ensureInitialized();

    const normalizedUpdates = this.normalizePost({
      title: updates.title || '',
      content: updates.content || '',
      status: updates.status || 'draft',
      createdAt: updates.createdAt || new Date(),
      source: updates.source || 'manual',
      excerpt: updates.excerpt,
      categories: updates.categories,
      tags: updates.tags,
      publishedAt: updates.publishedAt,
      wordpressId: updates.wordpressId,
      wordpressUrl: updates.wordpressUrl,
      sourceUrl: updates.sourceUrl,
    });

    const dbUpdates: Record<string, unknown> = {};
    const fieldMapping: Record<string, string> = {
      publishedAt: 'published_at',
      wordpressId: 'wordpress_id',
      wordpressUrl: 'wordpress_url',
      sourceUrl: 'source_url',
    };

    for (const [key, value] of Object.entries({
      ...updates,
      title: updates.title ? normalizedUpdates.title : undefined,
      excerpt: updates.excerpt ? normalizedUpdates.excerpt : undefined,
      content: updates.content ? normalizedUpdates.content : undefined,
      categories: updates.categories ? normalizedUpdates.categories : undefined,
      tags: updates.tags ? normalizedUpdates.tags : undefined,
    })) {
      if (value === undefined) {
        continue;
      }

      const dbKey = fieldMapping[key] || key;

      if (key === 'categories' || key === 'tags') {
        dbUpdates[dbKey] = (value as string[]).join(',');
      } else if (key === 'publishedAt') {
        dbUpdates[dbKey] = (value as Date).toISOString();
      } else {
        dbUpdates[dbKey] = value;
      }
    }

    const { error } = await this.supabase!
      .from('posts')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('[Database] Failed to update post:', error);
      return false;
    }

    return true;
  }

  async deletePost(id: number): Promise<boolean> {
    this.ensureInitialized();

    const { error } = await this.supabase!
      .from('posts')
      .delete()
      .eq('id', id);

    return !error;
  }

  async getStats(): Promise<{
    total: number;
    bySource: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    this.ensureInitialized();

    const { data: allPosts, error } = await this.supabase!.from('posts').select('source, status');

    if (error || !allPosts) {
      return { total: 0, bySource: {}, byStatus: {} };
    }

    const bySource: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    allPosts.forEach((post) => {
      bySource[post.source] = (bySource[post.source] || 0) + 1;
      byStatus[post.status] = (byStatus[post.status] || 0) + 1;
    });

    return {
      total: allPosts.length,
      bySource,
      byStatus,
    };
  }

  async subscribe(email: string, metadata?: SubscriberMetadata): Promise<'created' | 'existing'> {
    this.ensureInitialized();

    const normalizedEmail = email.trim().toLowerCase();

    const { data: existing, error: lookupError } = await this.supabase!
      .from('subscribers')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle<SubscriberRecord>();

    if (lookupError) {
      console.error('[Database] Failed to look up subscriber:', lookupError);
      throw lookupError;
    }

    const payload = {
      email: normalizedEmail,
      status: 'active',
      source_page: metadata?.sourcePage || null,
      referrer: metadata?.referrer || null,
      user_agent: metadata?.userAgent || null,
      last_seen_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await this.supabase!
        .from('subscribers')
        .update(payload)
        .eq('id', existing.id);

      if (error) {
        console.error('[Database] Failed to update subscriber:', error);
        throw error;
      }

      return 'existing';
    }

    const { error } = await this.supabase!
      .from('subscribers')
      .insert({
        ...payload,
        subscribed_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[Database] Failed to create subscriber:', error);
      throw error;
    }

    return 'created';
  }

  private mapDataToPost(data: Record<string, unknown>): Post {
    return {
      id: data.id as number,
      title: data.title as string,
      content: data.content as string,
      excerpt: data.excerpt as string | undefined,
      categories: typeof data.categories === 'string' ? data.categories.split(',').filter(Boolean) : undefined,
      tags: typeof data.tags === 'string' ? data.tags.split(',').filter(Boolean) : undefined,
      status: data.status as Post['status'],
      createdAt: new Date(data.created_at as string),
      publishedAt: data.published_at ? new Date(data.published_at as string) : undefined,
      wordpressId: data.wordpress_id as number | undefined,
      wordpressUrl: data.wordpress_url as string | undefined,
      source: data.source as Post['source'],
      sourceUrl: data.source_url as string | undefined,
    };
  }
}

export const db = new PostDatabase();
