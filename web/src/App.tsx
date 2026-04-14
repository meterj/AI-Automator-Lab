import React from 'react';
import { BrowserRouter as Router, Link, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import './App.css';

const StaticPage: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <main className="static-shell">
    <section className="static-page">
      <p className="eyebrow">Information</p>
      <h1 className="display-serif">{title}</h1>
      <p>{body}</p>
    </section>
  </main>
);

const App: React.FC = () => {
  return (
    <Router>
      <div className="site-shell">
        <header className="site-header">
          <Link to="/" className="brand-mark" aria-label="AI Automator Lab home">
            <span className="brand-kicker">AI AUTOMATOR</span>
            <span className="brand-word">LAB</span>
          </Link>

          <nav className="site-nav" aria-label="Primary">
            <Link to="/">Latest</Link>
            <a href="/#briefing">Briefing</a>
            <a href="/#archive">Archive</a>
            <Link to="/about">About</Link>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route
            path="/about"
            element={
              <StaticPage
                title="About AI Automator Lab"
                body="AI Automator Lab is designed as a daily AI and automation front page. The system combines automation, source collection, and editorial cleanup to turn a stream of developments into a readable publication."
              />
            }
          />
          <Route
            path="/privacy"
            element={
              <StaticPage
                title="Privacy Policy"
                body="This site may use analytics, server logs, and newsletter collection to understand readership and improve the product. If email signup is enabled, subscriber data is used only for publication updates and site operations."
              />
            }
          />
          <Route
            path="/terms"
            element={
              <StaticPage
                title="Terms of Use"
                body="Articles are published for informational purposes. Some content may be drafted or transformed with automation, and readers should verify time-sensitive claims with the original source before relying on them."
              />
            }
          />
        </Routes>

        <footer className="site-footer">
          <div>
            <p className="footer-title">AI Automator Lab</p>
            <p className="footer-copy">A daily AI news surface shaped like an editorial product, not a generic content grid.</p>
          </div>

          <div className="footer-links">
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <a href="mailto:contact@ai-automator-lab.vercel.app">Contact</a>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
