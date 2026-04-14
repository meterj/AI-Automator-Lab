// src/groq/generator.ts - Professional English AI Journalism Hub

import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { Post, AIGenerationConfig } from '../types';
import { LAYOUT_TEMPLATES } from '../wordpress/templates/post-style';

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
   * Generates a high-end blog post via Groq AI in English
   */
  async generatePost(config: AIGenerationConfig): Promise<Post> {
    const lengthGuide = {
      short: '500-800 words',
      medium: '1000-1500 words',
      long: '2000-3000 words',
    };

    const toneGuide = {
      formal: 'Authoritative & Professional',
      casual: 'Engaging & Conversational',
      friendly: 'Insightful & Warm',
    };

    const prompt = this.buildPrompt(config, lengthGuide, toneGuide);

    const response = await this.groq.post('/chat/completions', {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: `You are a world-class technology journalist and senior editor at "AI Automator Lab," a premium global technology magazine.
          Your mission is to write groundbreaking, deeply insightful articles about AI and automation for a global audience.
          
          Adhere to these editorial standards:
          1. **Tech Mastery**: Use precise technical terminology but maintain high clarity.
          2. **Narrative Flow**: Write like a storyteller from TechCrunch or WIRED, not a robotic list-maker.
          3. **Visual Structure**: Use H2, blockquotes, and custom summaries to create a magazine-like layout.
          4. **Language**: Always write in **PROFESSIONAL ENGLISH**.`,
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

  private buildPrompt(
    config: AIGenerationConfig,
    lengthGuide: Record<string, string>,
    toneGuide: Record<string, string>
  ): string {
    const { topic, keywords, tone = 'formal', length = 'medium' } = config;

    let prompt = `
Write a premium magazine article based on:

Topic: ${topic}
Tone: ${toneGuide[tone] || 'Professional'}
Length: approximately ${lengthGuide[length] || '1200 words'}
Language: English

Key Insights to include: ${keywords && keywords.length > 0 ? keywords.join(', ') : 'Latest industry trends and practical applications'}

STRICT STRUCTURE (Required for parsing):
[TITLE]
A powerful, SEO-optimized headline for a global tech audience.

[LEAD]
A compelling 2-3 sentence introduction that hooks the reader immediately.

[BODY]
Detailed article content with subheadings using '## Subheading' format.
Incorporate storytelling and real-world examples.

[INSIGHT]
A single, profound "Golden Quote" or key insight from the article, in a sentence.

[SUMMARY]
3-5 bullet points summarizing the strategic takeaways.

Separate each section with the [SECTION_NAME] tags clearly.
`;

    return prompt;
  }

  /**
   * Parses the generated content and wraps it in a luxury magazine layout
   */
  private parseGeneratedContent(content: string, config: AIGenerationConfig): Post {
    const sections: Record<string, string> = {};
    const lines = content.split('\n');
    
    let currentSection = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const sectionMatch = trimmedLine.match(/^\[?(TITLE|LEAD|BODY|INSIGHT|SUMMARY)\]?/i);
      
      if (sectionMatch) {
        currentSection = sectionMatch[1].toUpperCase();
        sections[currentSection] = '';
      } else if (currentSection) {
        sections[currentSection] += line + '\n';
      }
    }

    const title = sections['TITLE']?.trim() || config.topic;
    const lead = sections['LEAD']?.trim() || '';
    const body = sections['BODY']?.trim() || '';
    const insight = sections['INSIGHT']?.trim() || '';
    const summary = sections['SUMMARY']?.trim() || '';

    const cleanText = (text: string) => {
      return text
        .replace(/<[^>]*>?/gm, '')
        .replace(/@import[^;]*;/g, '')
        .replace(/\.[a-zA-Z0-9_-]+\s*\{[^}]*\}/g, '')
        .replace(/[\[\]]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const excerptSource = lead || (body.length > 50 ? body : '');
    const cleanExcerpt = cleanText(excerptSource).substring(0, 180);

    // Build Luxury Layout
    let htmlContent = '';
    
    if (lead) {
      htmlContent += LAYOUT_TEMPLATES.lead(lead);
    }

    let formattedBody = body
      .replace(/^##\s+(.*)/gm, '<h2>$1</h2>')
      .replace(/^###\s+(.*)/gm, '<h3>$1</h3>')
      .replace(/\r?\n\r?\n/g, '</div><div style="margin-bottom: 2rem;">')
      .trim();
    
    htmlContent += `<div style="margin-top: 2rem;">${formattedBody}</div>`;

    if (insight) {
      htmlContent += LAYOUT_TEMPLATES.quote(insight);
    }

    if (summary) {
      const summaryList = summary
        .split('\n')
        .filter(s => s.trim())
        .map(s => `<li>${cleanText(s).replace(/^[-\d.]+\s*/, '')}</li>`)
        .join('');
      
      htmlContent += LAYOUT_TEMPLATES.card('Key Strategic Takeaways', `<ul>${summaryList}</ul>`);
    }

    const finalHtml = LAYOUT_TEMPLATES.wrap(htmlContent);

    return {
      title: cleanText(title),
      content: finalHtml,
      excerpt: cleanExcerpt,
      status: 'publish',
      createdAt: new Date(),
      source: 'ai',
      tags: config.keywords || ['AI', 'Tech', 'Automation'],
    };
  }

  async generateMultiplePosts(configs: AIGenerationConfig[]): Promise<Post[]> {
    const posts: Post[] = [];
    for (const cfg of configs) {
      try {
        const post = await this.generatePost(cfg);
        posts.push(post);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Generation Failed for topic ${cfg.topic}:`, error);
      }
    }
    return posts;
  }
}

export const aiGenerator = new AIGenerator();