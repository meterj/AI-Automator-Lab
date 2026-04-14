import React, { useDeferredValue, useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  source: string;
  status: string;
  createdAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1600';
const STORY_IMAGES = [
  'photo-1516321318423-f06f85e504b3',
  'photo-1498050108023-c5249f4df085',
  'photo-1451187580459-43490279c0fa',
  'photo-1504384308090-c894fdcc538d',
  'photo-1518770660439-4636190af475',
  'photo-1526379095098-d400fd0bf935',
  'photo-1485827404703-89b55fcc595e',
  'photo-1620712943543-bcc4638d9f80'
];

const cleanContent = (text: string | undefined): string => {
  if (!text) return '';

  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/@import[^;]*;/g, '')
    .replace(/\.[a-zA-Z0-9_-]+\s*\{[^}]*\}/g, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const extractFirstImage = (html: string | undefined): string | null => {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] || null;
};

const getStoryImage = (post: Post, index: number) =>
  extractFirstImage(post.content) || `https://images.unsplash.com/${STORY_IMAGES[index % STORY_IMAGES.length]}?auto=format&fit=crop&q=80&w=1600`;

const getSourceLabel = (source: string) => {
  switch (source) {
    case 'rss':
      return 'WIRE';
    case 'manual':
      return 'DESK';
    default:
      return 'AI FILE';
  }
};

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const deferredSearch = useDeferredValue(searchTerm);

  const categories = ['All', 'Agents', 'Automation', 'Infrastructure', 'Policy', 'Research'];

  useEffect(() => {
    document.title = 'AI Automator Lab | Daily AI News and Analysis';

    const fetchPosts = async () => {
      try {
        const res = await axios.get(`${API_BASE}/posts`);
        setPosts(res.data);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const filteredPosts = posts.filter((post) => {
    const searchable = `${post.title} ${cleanContent(post.excerpt || post.content)}`.toLowerCase();
    const matchesSearch = deferredSearch ? searchable.includes(deferredSearch.toLowerCase()) : true;
    const matchesCategory = activeCategory === 'All' ? true : searchable.includes(activeCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const activePosts = filteredPosts.length > 0 ? filteredPosts : posts;
  const featuredPost = activePosts[0] || null;
  const archivePosts = activePosts.slice(featuredPost ? 1 : 0, 9);

  return (
    <main>
      {featuredPost && (
        <section className="hero-poster">
          <motion.div
            className="hero-media"
            initial={{ opacity: 0.6, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={getStoryImage(featuredPost, 0)}
              alt={featuredPost.title}
              onError={(event) => {
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </motion.div>

          <div className="hero-gradient" />

          <div className="hero-copy">
            <motion.p
              className="hero-brand"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              AI AUTOMATOR LAB
            </motion.p>
            <motion.p
              className="hero-kicker"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.08 }}
            >
              Daily briefings for AI operators, founders, and research teams
            </motion.p>
            <motion.h1
              className="display-serif hero-title"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.16 }}
            >
              {featuredPost.title}
            </motion.h1>
            <motion.p
              className="hero-summary"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.24 }}
            >
              {cleanContent(featuredPost.excerpt || featuredPost.content).slice(0, 220)}...
            </motion.p>
            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.32 }}
            >
              <Link to={`/post/${featuredPost.id}`} className="primary-link">
                Read feature
              </Link>
              <a href="#archive" className="secondary-link">
                Browse archive
              </a>
            </motion.div>
          </div>
        </section>
      )}

      <section className="signal-strip" id="briefing">
        <div>
          <p className="eyebrow">Positioning</p>
          <h2 className="display-serif">This should feel like a live editorial desk, not a starter template with AI headlines.</h2>
        </div>

        <div className="signal-grid">
          <article>
            <span>Freshness</span>
            <strong>{posts.length} stories in the live archive</strong>
            <p>The front page reflects API-backed content instead of static mock data.</p>
          </article>
          <article>
            <span>Visuals</span>
            <strong>Story-led imagery</strong>
            <p>RSS images now flow into cards and detail pages when the source provides them.</p>
          </article>
          <article>
            <span>Goal</span>
            <strong>Readable daily briefing</strong>
            <p>The layout is optimized for scanning, depth, and eventual newsletter conversion.</p>
          </article>
        </div>
      </section>

      <section className="archive-shell" id="archive">
        <div className="archive-intro">
          <p className="eyebrow">Archive</p>
          <h2 className="display-serif">A front page with editorial gravity and enough structure to scale.</h2>
          <p className="archive-copy">
            Filter topics, scan headlines, and move directly into article context. The interface is deliberately sparse so content and rhythm do the work.
          </p>

          <div className="archive-controls">
            <label className="search-field">
              <span>Search the desk</span>
              <input
                type="text"
                placeholder="Agents, regulation, model launches..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <div className="category-row" aria-label="Topic filters">
              {categories.map((category) => (
                <button
                  key={category}
                  className={activeCategory === category ? 'category-chip active' : 'category-chip'}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="story-rail">
          {loading ? (
            <div className="status-message">Loading the live desk...</div>
          ) : archivePosts.length === 0 ? (
            <div className="status-message">No stories match the current filter.</div>
          ) : (
            archivePosts.map((post, index) => (
              <motion.article
                key={post.id}
                className="story-row"
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.55, delay: Math.min(index * 0.06, 0.24) }}
              >
                <Link to={`/post/${post.id}`} className="story-media">
                  <img
                    src={getStoryImage(post, index + 1)}
                    alt={post.title}
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </Link>

                <div className="story-copy">
                  <div className="story-meta">
                    <span>{getSourceLabel(post.source)}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>

                  <Link to={`/post/${post.id}`} className="story-title-link">
                    <h3 className="display-serif">{post.title}</h3>
                  </Link>

                  <p>{cleanContent(post.excerpt || post.content).slice(0, 180)}...</p>

                  <Link to={`/post/${post.id}`} className="story-action">
                    Open article
                  </Link>
                </div>
              </motion.article>
            ))
          )}
        </div>
      </section>

      <section className="closing-banner">
        <p className="eyebrow">Newsletter</p>
        <h2 className="display-serif">A publication becomes a business when the audience can be retained outside the feed.</h2>
        <p>
          The page now has stronger visual identity. The next conversion step is replacing the decorative signup with a real subscriber pipeline and editorial cadence.
        </p>
        <div className="closing-actions">
          <input type="email" placeholder="Your work email" aria-label="Email address" />
          <button type="button">Join the briefing</button>
        </div>
      </section>
    </main>
  );
};

export default Home;
