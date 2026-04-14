// src/openai/generator.ts - Groq API 글 생성

import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { Post, AIGenerationConfig } from '../types';

export class AIGenerator {
  private groq: AxiosInstance;
  private model: string;

  constructor() {
    const apiUrl = 'https://api.groq.com/openai/v1';
    this.groq = axios.create({
      baseURL: apiUrl,
      headers: {
        'Authorization': `Bearer ${config.groq.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    this.model = config.groq.model;
  }

  /**
   * AI로 블로그 글 생성
   */
  async generatePost(config: AIGenerationConfig): Promise<Post> {
    const lengthGuide = {
      short: '500-800자',
      medium: '1000-1500자',
      long: '2000-3000자',
    };

    const toneGuide = {
      formal: '정중하고 격식 있는',
      casual: '친근하고 편안한',
      friendly: '따뜻하고 공감 가는',
    };

    const prompt = this.buildPrompt(config, lengthGuide, toneGuide);

    const response = await this.groq.post('/chat/completions', {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: '당신은 전문 블로그 작성자입니다. 주어진 주제로 독자에게 유용하고 흥미로운 한국어 블로그 글을 작성합니다. SEO를 고려하여 자연스러운 문체로 작성하세요.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const content = response.data.choices[0]?.message?.content || '';

    return this.parseGeneratedContent(content, config);
  }

  /**
   * 프롬프트 생성
   */
  private buildPrompt(
    config: AIGenerationConfig,
    lengthGuide: Record<string, string>,
    toneGuide: Record<string, string>
  ): string {
    const { topic, keywords, tone = 'casual', length = 'medium', language = 'Korean' } = config;

    let prompt = `
다음 정보를 바탕으로 블로그 글을 작성해 주세요:

주제: ${topic}
문체: ${toneGuide[tone] || '친근한'} 어조
길이: ${lengthGuide[length] || '1000-1500자'}
언어: ${language}
`;

    if (keywords && keywords.length > 0) {
      prompt += `\n포함할 키워드: ${keywords.join(', ')}`;
    }

    prompt += `

형식:
- 제목: [글 제목]
- 본문: [글 내용]

글을 시작하기 전에 제목을 한 줄로 작성하고, 그 다음에 본문을 작성하세요.
본문은 서론, 본론, 결론 구조로 자연스럽게 작성하세요.
독자가 쉽게 이해할 수 있도록 문단을 나누어 작성하세요.
`;

    return prompt;
  }

  /**
   * 생성된 콘텐츠 파싱
   */
  private parseGeneratedContent(content: string, config: AIGenerationConfig): Post {
    const lines = content.split('\n').filter(line => line.trim());
    
    let title = '';
    let bodyContent = '';
    
    // 제목 추출
    const titleLine = lines.find(line => 
      line.toLowerCase().startsWith('제목:') || 
      line.toLowerCase().startsWith('title:')
    );
    
    if (titleLine) {
      title = titleLine.replace(/^제목:\s*/i, '').replace(/^title:\s*/i, '').trim();
    } else {
      // 첫 번째 줄을 제목으로 사용
      title = lines[0]?.replace(/^#+\s*/, '').trim() || config.topic;
    }

    // 본문 추출
    const contentStartIndex = lines.findIndex(line => 
      line.toLowerCase().startsWith('본문:') || 
      line.toLowerCase().startsWith('content:')
    );
    
    if (contentStartIndex >= 0) {
      bodyContent = lines.slice(contentStartIndex + 1).join('\n').trim();
    } else {
      // 제목 뒤의 모든 내용을 본문으로
      const titleIndex = lines.indexOf(titleLine || lines[0]);
      bodyContent = lines.slice(titleIndex + 1).join('\n').trim();
    }

    // 본문이 비어있으면 원본 내용 사용
    if (!bodyContent) {
      bodyContent = content;
    }

    return {
      title,
      content: bodyContent,
      status: 'draft',
      createdAt: new Date(),
      source: 'ai',
      tags: config.keywords,
    };
  }

  /**
   * 여러 글 일괄 생성
   */
  async generateMultiplePosts(configs: AIGenerationConfig[]): Promise<Post[]> {
    const posts: Post[] = [];

    for (const cfg of configs) {
      try {
        const post = await this.generatePost(cfg);
        posts.push(post);
        // API 속도 제한 고려
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`글 생성 самый失败 (주제: ${cfg.topic}):`, error);
      }
    }

    return posts;
  }

  /**
   * 글 개선/수정
   */
  async improvePost(post: Post, instructions: string): Promise<Post> {
    const response = await this.groq.post('/chat/completions', {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: '당신은 전문 블로그 편집자입니다. 주어진 글을 지시에 따라 개선하세요.',
        },
        {
          role: 'user',
          content: `
        다음 글을 개선해 주세요.

        현재 제목: ${post.title}

        현재 본문:
        ${post.content}

        개선 지시: ${instructions}

        형식:
        - 제목: [개선된 제목]
        - 본문: [개선된 내용]
      `,
        },
      ],
      temperature: 0.5,
    });

    const improvedContent = response.data.choices[0]?.message?.content || '';
    return this.parseGeneratedContent(improvedContent, { topic: post.title });
  }
}

// 싱글톤 인스턴스
export const aiGenerator = new AIGenerator();