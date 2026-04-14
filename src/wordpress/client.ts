// src/wordpress/client.ts - WordPress.com REST API 클라이언트

import { config } from '../config';
import { Post, PublishResult } from '../types';

interface WordPressPostResponse {
  ID: number;
  title: string;
  content: string;
  URL: string;
  status: string;
  date: string;
}

export class WordPressClient {
  private readonly apiUrl: string;
  private readonly auth: string;

  constructor() {
    this.apiUrl = config.wordpress.apiUrl;
    // Basic Auth: username:password를 base64로 인코딩
    const credentials = Buffer.from(
      `${config.wordpress.username}:${config.wordpress.password}`
    ).toString('base64');
    this.auth = `Basic ${credentials}`;
  }

  /**
   * 워드프레스에 글 발행
   */
  async publishPost(post: Post): Promise<PublishResult> {
    try {
      const wpPost = {
        title: post.title,
        content: post.content,
        status: post.status,
        excerpt: post.excerpt || '',
        categories: post.categories?.join(',') || '',
        tags: post.tags?.join(',') || '',
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.auth,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wpPost),
      });

       if (!response.ok) {
         const errorText = await response.text();
         throw new Error(`WordPress API 오류: ${response.status} - ${errorText}`);
       }

       const result = await response.json() as WordPressPostResponse;

       return {
         success: true,
         postId: result.ID,
         postUrl: result.URL,
       };
     } catch (error) {
       const message = error instanceof Error ? error.message : '알 수 없는 오류';
       console.error(`WordPress 발행 실패: ${message}`);
       return {
         success: false,
         error: message,
       };
     }
  }

  /**
   * 기존 글 수정
   */
  async updatePost(postId: number, post: Partial<Post>): Promise<PublishResult> {
    try {
      const updateUrl = `${this.apiUrl}/${postId}`;
      
      const wpPost: Record<string, string> = {};
      if (post.title) wpPost.title = post.title;
      if (post.content) wpPost.content = post.content;
      if (post.status) wpPost.status = post.status;
      if (post.excerpt) wpPost.excerpt = post.excerpt;
      if (post.categories) wpPost.categories = post.categories.join(',');
      if (post.tags) wpPost.tags = post.tags.join(',');

      const response = await fetch(updateUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.auth,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wpPost),
      });

       if (!response.ok) {
         const errorText = await response.text();
         throw new Error(`WordPress API 오류: ${response.status} - ${errorText}`);
       }

       const result = await response.json() as WordPressPostResponse;

       return {
         success: true,
         postId: result.ID,
         postUrl: result.URL,
       };
     } catch (error) {
       const message = error instanceof Error ? error.message : '알 수 없는 오류';
       return {
         success: false,
         error: message,
       };
     }
  }

  /**
   * 글 삭제
   */
  async deletePost(postId: number): Promise<PublishResult> {
    try {
      const deleteUrl = `${this.apiUrl}/${postId}?delete=true`;

      const response = await fetch(deleteUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.auth,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WordPress API 오류: ${response.status} - ${errorText}`);
      }

      return {
        success: true,
        postId: postId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * 글 목록 조회
   */
  async getPosts(options?: { page?: number; perPage?: number; status?: string }): Promise<WordPressPostResponse[]> {
    try {
      const page = options?.page || 1;
      const perPage = options?.perPage || 10;
      const status = options?.status || 'any';

      const listUrl = `${this.apiUrl.replace('/sites/', '/sites/').replace('/posts', '')}/posts?page=${page}&per_page=${perPage}&status=${status}`;

      const response = await fetch(listUrl, {
        method: 'GET',
        headers: {
          'Authorization': this.auth,
        },
      });

       if (!response.ok) {
         const errorText = await response.text();
         throw new Error(`WordPress API 오류: ${response.status} - ${errorText}`);
       }

       const result = await response.json() as { posts: WordPressPostResponse[] };
       return result.posts || [];
     } catch (error) {
       const message = error instanceof Error ? error.message : '알 수 없는 오류';
       console.error(`WordPress 글 목록 조회 실패: ${message}`);
       return [];
     }
  }
}

// 싱글톤 인스턴스
export const wpClient = new WordPressClient();