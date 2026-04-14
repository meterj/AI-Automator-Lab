import React, { useState, useEffect } from 'react';
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

const cleanContent = (text: string | undefined): string => {
  if (!text) return '';
  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/@import[^;]*;/g, '')
    .replace(/\.[a-zA-Z0-9_-]+\s*\{[^}]*\}/g, '')
    .replace(/\[\d+\]/g, '') // [1] 같은 출처 표시 제거
    .replace(/\s+/g, ' ')
    .trim();
};

// 검증된 고화질 Unsplash 테크 이미지 ID 목록
const TECH_IMAGES = [
  'photo-1677442136019-21780ecad995', // AI Abstract Blue
  'photo-1485827404703-89b55fcc595e', // Robot hand
  'photo-1620712943543-bcc4638d9f80', // Digital Brain
  'photo-1550751827-4bd374c3f58b', // Motherboard
  'photo-1451187580459-43490279c0fa', // Digital Earth
  'photo-1518770660439-4636190af475'  // CPU
];

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  return (
    <main className="container">
      {/* Featured Entry - Luxury Hero */}
      {posts.length > 0 && (
        <motion.section 
          className="hero"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-card glass-card luxury-glow">
            <div className="hero-image-side">
              <img 
                src={`https://images.unsplash.com/${TECH_IMAGES[0]}?auto=format&fit=crop&q=80&w=1600`} 
                alt="AI Feature" 
              />
              <div className="image-overlay"></div>
            </div>
            <div className="hero-content-side">
              <div className="hero-badge animate-pulse">EXCLUSIVE FEATURE</div>
              <h1 className="gradient-text NotoSerif">{posts[0].title}</h1>
              <p className="hero-excerpt">
                {posts[0].excerpt ? cleanContent(posts[0].excerpt) : cleanContent(posts[0].content).substring(0, 180) + '...'}
              </p>
              <Link to={`/post/${posts[0].id}`} className="luxury-btn">
                READ FULL ISSUE <span>→</span>
              </Link>
            </div>
          </div>
        </motion.section>
      )}

      {/* Grid Section */}
      <section className="section">
        <h2 className="section-title Montserrat">
          <span className="accent-dot"></span> CURATED STORIES
        </h2>
        
        {loading ? (
          <div className="loading">매거진 기사를 준비하는 중...</div>
        ) : (
          <div className="posts-grid">
            {posts.slice(1, 10).map((post, index) => (
              <motion.article 
                key={post.id} 
                className="post-card glass-card luxury-border luxury-glow"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: (index % 3) * 0.15 }}
                whileHover={{ y: -15, scale: 1.02 }}
              >
                <div className="post-thumbnail">
                  <img 
                    src={`https://images.unsplash.com/${TECH_IMAGES[(index + 1) % TECH_IMAGES.length]}?auto=format&fit=crop&q=80&w=800`} 
                    alt={post.title} 
                  />
                  <div className="thumbnail-overlay"></div>
                </div>
                <div className="post-info">
                  <div className="post-meta Montserrat">
                    <span className="post-tag">AI LAB</span>
                    <span className="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="NotoSerif">{post.title}</h3>
                  <div className="post-preview">
                    {post.excerpt ? cleanContent(post.excerpt) : cleanContent(post.content).substring(0, 120) + '...'}
                  </div>
                  <Link to={`/post/${post.id}`} className="read-more">
                    READ STORY <span>→</span>
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* Luxury Newsletter Engagement */}
      <motion.section 
        className="newsletter-section luxury-glow"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="newsletter-content">
          <h2 className="Montserrat">STAY AHEAD OF THE CURVE</h2>
          <p>매주 전 세계에서 가장 핫한 AI 인사이트를 당신의 메일함으로 배달합니다.</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your business email" />
            <button className="luxury-btn">JOIN THE LAB</button>
          </div>
        </div>
      </motion.section>
    </main>
  );
};

export default Home;
