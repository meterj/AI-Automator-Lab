import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { applySeo } from '../seo';
import SubscribeForm from '../components/SubscribeForm';
import { sanitizeHtml } from '../lib/sanitizeHtml';
import { API_BASE } from '../lib/api';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  source: string;
  status: string;
  createdAt: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1800';
const DETAIL_IMAGES = [
  'photo-1498050108023-c5249f4df085',
  'photo-1516321318423-f06f85e504b3',
  'photo-1451187580459-43490279c0fa',
  'photo-1504384308090-c894fdcc538d',
  'photo-1518770660439-4636190af475',
  'photo-1526379095098-d400fd0bf935'
];

const extractFirstImage = (html: string | undefined): string | null => {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] && /^https?:\/\//i.test(match[1]) ? match[1] : null;
};

const getAuthorName = (source: string) => {
  switch (source) {
    case 'rss':
      return 'AI Automator Lab Wire Desk';
    case 'manual':
      return 'AI Automator Lab Editorial Desk';
    default:
      return 'AI Automator Lab Research Desk';
  }
};

const getSourceLabel = (source: string) => {
  switch (source) {
    case 'rss':
      return 'Wire Report';
    case 'manual':
      return 'Editorial';
    default:
      return 'AI Analysis';
  }
};

const extractReadableText = (html: string | undefined): string => {
  if (!html) {
    return '';
  }

  return html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const buildAutoDepthSection = (post: Post, sourceLabel: string): string => {
  const summary = extractReadableText(post.excerpt || post.content).slice(0, 260)
    || 'This story has limited source detail, so the desk added context for readability.';

  return `
    <section data-auto-brief="1" style="margin-top:2rem;border-top:1px solid rgba(255,255,255,0.15);padding-top:1.4rem;">
      <h2>Why this matters</h2>
      <p>${summary}</p>
      <p>This development can affect implementation speed, tooling decisions, and near-term operational planning.</p>
      <h2 style="margin-top:1.2rem;">Reader checklist</h2>
      <ul>
        <li>Identify what changed versus previous coverage.</li>
        <li>Map impact on roadmap, quality, and budget priorities.</li>
        <li>Track what should be monitored over the next 30 days.</li>
      </ul>
      <p style="opacity:0.78;">Editorial note: this ${sourceLabel.toLowerCase()} article was auto-expanded for readability.</p>
    </section>
  `;
};

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`${API_BASE}/posts/${id}`);
        setPost(res.data);
      } catch (err) {
        console.error('Failed to fetch post:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!post) {
      return;
    }

    const numericId = Number.parseInt(post.id, 10);
    const fallbackIndex = Number.isNaN(numericId) ? 0 : numericId % DETAIL_IMAGES.length;
    const heroImage =
      extractFirstImage(post.content) ||
      `https://images.unsplash.com/${DETAIL_IMAGES[fallbackIndex]}?auto=format&fit=crop&q=80&w=1800`;
    const authorName = getAuthorName(post.source);

    return applySeo({
      title: `${post.title} | AI Automator Lab`,
      description: (post.excerpt || '').trim() || 'AI and automation article from AI Automator Lab.',
      url: `https://ai-automator-lab.vercel.app/post/${post.id}`,
      image: heroImage,
      type: 'article',
      articlePublishedTime: new Date(post.createdAt).toISOString(),
      authorName,
    });
  }, [post]);

  const handleCopyLink = async () => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return <div className="detail-status">Loading article...</div>;
  }

  if (!post) {
    return <div className="detail-status">The requested article could not be found.</div>;
  }

  const numericId = Number.parseInt(post.id, 10);
  const fallbackIndex = Number.isNaN(numericId) ? 0 : numericId % DETAIL_IMAGES.length;
  const heroImage =
    extractFirstImage(post.content) ||
    `https://images.unsplash.com/${DETAIL_IMAGES[fallbackIndex]}?auto=format&fit=crop&q=80&w=1800`;
  const safeContent = sanitizeHtml(post.content);
  const safeText = extractReadableText(safeContent);
  const hasVisibleContent = safeText.length > 40;
  const hasReadableDepth = safeText.length >= 420;
  const fallbackContent = `<p>${(post.excerpt || 'This article content is being prepared. Please check back shortly.').trim()}</p>`;
  const authorName = getAuthorName(post.source);
  const sourceLabel = getSourceLabel(post.source);
  const shouldInjectDepth = hasVisibleContent && !hasReadableDepth && !safeContent.includes('data-auto-brief="1"');
  const renderedContent = hasVisibleContent
    ? `${safeContent}${shouldInjectDepth ? buildAutoDepthSection(post, sourceLabel) : ''}`
    : `${fallbackContent}${buildAutoDepthSection(post, sourceLabel)}`;

  return (
    <>
      <motion.div className="progress-bar" style={{ scaleX }} />

      <main className="article-shell">
        <section className="article-hero">
          <div className="article-hero-media">
            <img
              src={heroImage}
              alt={post.title}
              onError={(event) => {
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </div>
          <div className="article-hero-overlay" />

          <div className="article-hero-copy">
            <Link to="/" className="back-link">
              Back to front page
            </Link>
            <p className="eyebrow">Feature article</p>
            <h1 className="display-serif">{post.title}</h1>
            <div className="article-meta">
              <Link to="/authors/desk">{authorName}</Link>
              <span>{sourceLabel}</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </section>

        <section className="article-layout">
          <aside className="article-aside">
            <div>
              <p className="eyebrow">Byline</p>
              <p>
                Filed by <Link to="/authors/desk" className="inline-link">{authorName}</Link>. Source type: {sourceLabel}.
              </p>
            </div>

            <div>
              <p className="eyebrow">Reader note</p>
              <p>
                This layout is intentionally restrained. The page frames the image and metadata, then gets out of the way so the writing remains the main asset.
              </p>
            </div>

            <div className="share-stack">
              <button
                className="share-btn"
                onClick={() =>
                  window.open(
                    `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`,
                    '_blank',
                    'noopener,noreferrer'
                  )
                }
              >
                Share on X
              </button>
              <button
                className="share-btn"
                onClick={() =>
                  window.open(
                    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                    '_blank',
                    'noopener,noreferrer'
                  )
                }
              >
                Share on LinkedIn
              </button>
              <button className="share-btn" onClick={handleCopyLink}>
                Copy link
              </button>
            </div>
          </aside>

          <article className="article-body">
            <div className="article-content" dangerouslySetInnerHTML={{ __html: renderedContent }} />
          </article>
        </section>

        <section className="article-cta">
          <p className="eyebrow">Next move</p>
          <h2 className="display-serif">The archive is only half the product. Retention and quality control are the business layer.</h2>
          <p>
            Once the content pipeline is hardened, this space should connect strong stories to a working newsletter or membership funnel instead of staying decorative.
          </p>
          <SubscribeForm sourcePage={`post-${post.id}-cta`} buttonLabel="Get the daily briefing" />
          <Link to="/authors/desk" className="secondary-link">
            Meet the desk
          </Link>
          <Link to="/" className="primary-link">
            Return to the briefing
          </Link>
        </section>
      </main>
    </>
  );
};

export default PostDetail;
