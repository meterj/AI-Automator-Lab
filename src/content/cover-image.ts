const CURATED_COVER_IMAGES: Array<{ matchers: string[]; url: string }> = [
  {
    matchers: ['agent', 'multi-agent', 'workflow', 'orchestration'],
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1800',
  },
  {
    matchers: ['robot', 'automation', 'factory', 'industry', 'manufacturing'],
    url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1800',
  },
  {
    matchers: ['privacy', 'security', 'data', 'sovereignty', 'compliance'],
    url: 'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&q=80&w=1800',
  },
  {
    matchers: ['education', 'tutor', 'learning', 'training'],
    url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1800',
  },
  {
    matchers: ['market', 'finance', 'analytics', 'predictive'],
    url: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&q=80&w=1800',
  },
  {
    matchers: ['translation', 'language', 'speech', 'voice'],
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1800',
  },
  {
    matchers: ['creative', 'design', 'image', 'video', 'media'],
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1800',
  },
];

const DEFAULT_COVER_IMAGE =
  'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&q=80&w=1800';

export function pickCoverImage(topic: string, keywords: string[] = []): string {
  const haystack = `${topic} ${keywords.join(' ')}`.toLowerCase();
  const matched = CURATED_COVER_IMAGES.find((entry) =>
    entry.matchers.some((matcher) => haystack.includes(matcher))
  );

  return matched?.url || DEFAULT_COVER_IMAGE;
}

export function buildCoverFigure(title: string, imageUrl: string): string {
  const safeTitle = title.replace(/"/g, '&quot;');

  return `
    <figure style="margin: 0 0 1.75rem;">
      <img
        src="${imageUrl}"
        alt="${safeTitle}"
        style="width: 100%; max-height: 560px; object-fit: cover; border-radius: 18px; display: block;"
      />
    </figure>
  `;
}
