import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';

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

// 검증된 고화질 Unsplash 테크 이미지 목록
const TECH_IMAGES = [
  'photo-1677442136019-21780ecad995', // AI Abstract
  'photo-1485827404703-89b55fcc595e', // Robot
  'photo-1620712943543-bcc4638d9f80', // Digital Brain
  'photo-1550751827-4bd374c3f58b', // Motherboard
  'photo-1451187580459-43490279c0fa', // Digital Earth
  'photo-1518770660439-4636190af475', // CPU
  'photo-1531297484001-80022131f5a1', // Laptop
  'photo-1504384308090-c894fdcc538d', // Data Center
  'photo-1581091226825-a6a2a5aee158', // Technician
  'photo-1488590528505-98d2b5aba04b'  // Code
];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200';

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.src = FALLBACK_IMAGE;
};

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  // Reading Progress Bar Logic
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
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

  if (loading) return <div className="container loading">매거진 기사를 불러오는 중...</div>;
  if (!post) return <div className="container error">기사를 찾을 수 없습니다.</div>;

  return (
    <>
      {/* Reading Progress Bar */}
      <motion.div className="progress-bar" style={{ scaleX }} />

      <div className="container post-detail-page">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link to="/" className="back-button Montserrat">
            <span>←</span> BACK TO MAGAZINE
          </Link>
        </motion.div>
        
        <motion.article 
          className="post-detail-container glass-card luxury-border"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Banner Image */}
          <div className="post-detail-banner">
            <img 
              src={`https://images.unsplash.com/${TECH_IMAGES[parseInt(post.id) % TECH_IMAGES.length] || TECH_IMAGES[0]}?auto=format&fit=crop&q=80&w=1632`} 
              alt="Post Banner" 
              onError={handleImageError}
            />
          </div>

          <div className="post-detail-content">
            <header className="post-header">
              <div className="post-meta Montserrat">
                <span className="post-tag">PREMIUM INSIGHTS</span>
                <span className="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <h1 className="post-title-detail NotoSerif">{post.title}</h1>
              <div className="post-divider"></div>
            </header>

            {/* Content Rendering */}
            <div 
              className="post-content-render" 
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />
            
            <footer className="post-footer">
              <div className="post-divider"></div>
              <div className="share-section Montserrat">
                <span>SHARE THIS STORY</span>
                <div className="share-icons">
                  <button className="share-btn">Twitter</button>
                  <button className="share-btn">LinkedIn</button>
                  <button className="share-btn">Copy Link</button>
                </div>
              </div>
            </footer>
          </div>
        </motion.article>

        {/* Bottom Newsletter Signup */}
        <section className="detail-newsletter section">
           <div className="glass-card luxury-glow newsletter-mini">
              <h3 className="Montserrat">ENJOYED THIS STORY?</h3>
              <p>최신 AI 아티클을 매주 이메일로 받아보세요.</p>
              <div className="newsletter-form">
                <input type="email" placeholder="email@example.com" />
                <button className="luxury-btn">GET INSIGHTS</button>
              </div>
           </div>
        </section>
      </div>
    </>
  );
};

export default PostDetail;
