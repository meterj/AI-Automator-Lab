type SeoConfig = {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: 'website' | 'article';
  articlePublishedTime?: string;
  authorName?: string;
};

const SITE_NAME = 'AI Automator Lab';
const DESK_URL = 'https://ai-automator-lab.vercel.app/authors/desk';

function upsertMeta(selector: string, create: () => HTMLMetaElement, apply: (element: HTMLMetaElement) => void) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = create();
    document.head.appendChild(element);
  }

  apply(element);
}

function upsertLink(selector: string, create: () => HTMLLinkElement, href: string) {
  let element = document.head.querySelector(selector) as HTMLLinkElement | null;

  if (!element) {
    element = create();
    document.head.appendChild(element);
  }

  element.href = href;
}

export function applySeo(config: SeoConfig): () => void {
  document.title = config.title;

  upsertMeta(
    'meta[name="description"]',
    () => {
      const meta = document.createElement('meta');
      meta.name = 'description';
      return meta;
    },
    (meta) => {
      meta.content = config.description;
    }
  );

  upsertMeta(
    'meta[property="og:site_name"]',
    () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:site_name');
      return meta;
    },
    (meta) => {
      meta.content = SITE_NAME;
    }
  );

  upsertMeta(
    'meta[property="og:title"]',
    () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      return meta;
    },
    (meta) => {
      meta.content = config.title;
    }
  );

  upsertMeta(
    'meta[property="og:description"]',
    () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      return meta;
    },
    (meta) => {
      meta.content = config.description;
    }
  );

  upsertMeta(
    'meta[property="og:type"]',
    () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:type');
      return meta;
    },
    (meta) => {
      meta.content = config.type || 'website';
    }
  );

  upsertMeta(
    'meta[property="og:url"]',
    () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:url');
      return meta;
    },
    (meta) => {
      meta.content = config.url;
    }
  );

  upsertMeta(
    'meta[name="twitter:title"]',
    () => {
      const meta = document.createElement('meta');
      meta.name = 'twitter:title';
      return meta;
    },
    (meta) => {
      meta.content = config.title;
    }
  );

  upsertMeta(
    'meta[name="twitter:description"]',
    () => {
      const meta = document.createElement('meta');
      meta.name = 'twitter:description';
      return meta;
    },
    (meta) => {
      meta.content = config.description;
    }
  );

  upsertMeta(
    'meta[name="author"]',
    () => {
      const meta = document.createElement('meta');
      meta.name = 'author';
      return meta;
    },
    (meta) => {
      meta.content = config.authorName || SITE_NAME;
    }
  );

  if (config.image) {
    upsertMeta(
      'meta[property="og:image"]',
      () => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:image');
        return meta;
      },
      (meta) => {
        meta.content = config.image!;
      }
    );

    upsertMeta(
      'meta[name="twitter:image"]',
      () => {
        const meta = document.createElement('meta');
        meta.name = 'twitter:image';
        return meta;
      },
      (meta) => {
        meta.content = config.image!;
      }
    );
  }

  if (config.articlePublishedTime) {
    upsertMeta(
      'meta[property="article:published_time"]',
      () => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'article:published_time');
        return meta;
      },
      (meta) => {
        meta.content = config.articlePublishedTime!;
      }
    );

    upsertMeta(
      'meta[property="article:author"]',
      () => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'article:author');
        return meta;
      },
      (meta) => {
        meta.content = config.authorName || `${SITE_NAME} Desk`;
      }
    );
  }

  upsertLink(
    'link[rel="canonical"]',
    () => {
      const link = document.createElement('link');
      link.rel = 'canonical';
      return link;
    },
    config.url
  );

  const scriptId = 'structured-data-jsonld';
  const existingScript = document.getElementById(scriptId);

  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = scriptId;
  script.text = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': config.type === 'article' ? 'Article' : 'WebSite',
    name: config.title,
    headline: config.title,
    description: config.description,
    url: config.url,
    image: config.image,
    author: config.type === 'article'
      ? {
          '@type': 'Person',
          name: config.authorName || `${SITE_NAME} Desk`,
          url: DESK_URL,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: 'https://ai-automator-lab.vercel.app/',
    },
    datePublished: config.articlePublishedTime,
    mainEntityOfPage: config.type === 'article' ? config.url : undefined,
  });
  document.head.appendChild(script);

  return () => {
    script.remove();
  };
}
