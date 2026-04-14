import React from 'react';
import { BrowserRouter as Router, Link, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import InfoPage from './pages/InfoPage';
import PostDetail from './pages/PostDetail';
import './App.css';

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
            <Link to="/contact">Contact</Link>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route
            path="/about"
            element={
              <InfoPage
                eyebrow="About"
                title="About AI Automator Lab"
                description="AI Automator Lab is built as a daily AI publication. The product combines source collection, automation, editorial cleanup, and distribution so the site can grow beyond a simple headline feed."
                path="/about"
                ctaLabel="Read the editorial policy"
                ctaHref="/editorial-policy"
                sections={[
                  {
                    heading: 'What the publication does',
                    body: 'The site tracks AI launches, infrastructure shifts, regulation, and operator-focused changes. The goal is to compress a chaotic daily news cycle into a readable product with strong visual hierarchy and source-linked context.',
                  },
                  {
                    heading: 'How the workflow is built',
                    body: 'Articles can originate from RSS collection, manual publishing, or AI-assisted drafting. Every route now runs through content quality checks, duplicate detection, and a cleaner presentation layer before the story reaches the archive.',
                  },
                  {
                    heading: 'Why this matters for monetization',
                    body: 'A publication becomes viable when it has repeatable output, trustworthy sourcing, and an audience retention layer. That is why this site now emphasizes archive quality, SEO assets, and newsletter capture instead of behaving like a demo.',
                  },
                ]}
              />
            }
          />
          <Route
            path="/contact"
            element={
              <InfoPage
                eyebrow="Contact"
                title="Contact and Partnership Requests"
                description="Use this page for editorial corrections, partnership inquiries, newsletter issues, and future advertising conversations."
                path="/contact"
                ctaLabel="Email the desk"
                ctaHref="mailto:contact@ai-automator-lab.vercel.app"
                sections={[
                  {
                    heading: 'Editorial corrections',
                    body: 'If a story needs a correction, source update, or attribution fix, send the article URL and the exact issue. Fast-moving AI coverage benefits from visible correction discipline.',
                  },
                  {
                    heading: 'Partnerships and sponsorships',
                    body: 'Sponsorship, syndication, and product partnership inquiries should include company name, objective, audience fit, and timing. The site is being shaped toward a niche operator and builder audience rather than broad consumer traffic.',
                  },
                  {
                    heading: 'Current contact channel',
                    body: 'Primary contact is handled through the published mailto address in the site footer. Replace that address with your real managed inbox before traffic or sponsorship outreach scales.',
                  },
                ]}
              />
            }
          />
          <Route
            path="/editorial-policy"
            element={
              <InfoPage
                eyebrow="Editorial"
                title="Editorial Standards"
                description="These are the operating rules behind the publication: source selection, update discipline, AI assistance boundaries, and why low-quality posts are filtered before publication."
                path="/editorial-policy"
                ctaLabel="Review AI disclosure"
                ctaHref="/ai-policy"
                sections={[
                  {
                    heading: 'Source and freshness rules',
                    body: 'Stories are intended to come from current AI news feeds and are prioritized by recency. Duplicate source URLs are filtered, and stale or low-information items are skipped before they reach the live archive.',
                  },
                  {
                    heading: 'Publication quality threshold',
                    body: 'Short, placeholder, or structurally broken posts are blocked by quality checks. The archive is treated as a product surface, so content that does not meet a minimum readability threshold should not auto-publish.',
                  },
                  {
                    heading: 'Corrections and updates',
                    body: 'Where claims change quickly, the publication should prefer explicit source links and later updates over silent edits. That discipline is necessary for search trust, reader retention, and eventual ad or sponsorship credibility.',
                  },
                ]}
              />
            }
          />
          <Route
            path="/ai-policy"
            element={
              <InfoPage
                eyebrow="AI Policy"
                title="AI Assistance and Disclosure"
                description="This publication uses automation and AI-assisted drafting, but automation is not treated as a substitute for source quality, reader clarity, or basic publishing discipline."
                path="/ai-policy"
                ctaLabel="Contact the desk"
                ctaHref="/contact"
                sections={[
                  {
                    heading: 'Where AI is used',
                    body: 'AI may assist with drafting, summarization, formatting, and turning structured source material into publication-ready layouts. The workflow is designed to accelerate production, not to hide origin or invent sourcing.',
                  },
                  {
                    heading: 'What AI should not do',
                    body: 'AI output should not be used as a substitute for primary-source verification on fast-moving claims. When a story depends on a specific announcement, regulation, or product release, the reader should still be able to trace the source path.',
                  },
                  {
                    heading: 'Why disclosure matters',
                    body: 'Transparent disclosure is part of business credibility. Search quality systems, ad reviewers, and actual readers all respond better when the site openly states how automation is used instead of pretending every article is fully hand-written.',
                  },
                ]}
              />
            }
          />
          <Route
            path="/privacy"
            element={
              <InfoPage
                eyebrow="Privacy"
                title="Privacy Policy"
                description="This site may use analytics, server logs, and newsletter collection to understand readership and improve the product."
                path="/privacy"
                sections={[
                  {
                    heading: 'Subscriber information',
                    body: 'Newsletter email addresses are stored in the connected Supabase project and are meant for publication updates, operational notices, and product improvement related to the publication itself.',
                  },
                  {
                    heading: 'Traffic and diagnostics',
                    body: 'Server logs, error traces, and future analytics setup may be used to understand which content performs, where readers come from, and what breaks in production.',
                  },
                  {
                    heading: 'Operational note',
                    body: 'Before running paid traffic or a larger newsletter funnel, replace placeholder contact details and make sure the live privacy policy matches the actual tools installed on the stack.',
                  },
                ]}
              />
            }
          />
          <Route
            path="/terms"
            element={
              <InfoPage
                eyebrow="Terms"
                title="Terms of Use"
                description="Articles are published for informational purposes, and some content may be drafted or transformed with automation."
                path="/terms"
                sections={[
                  {
                    heading: 'Informational use',
                    body: 'The archive is intended for information, analysis, and publication reading. It should not be treated as legal, financial, or operational advice without independent verification.',
                  },
                  {
                    heading: 'Automation notice',
                    body: 'Parts of the publication may be collected, transformed, or drafted with automated systems. Readers should verify time-sensitive claims with original sources before relying on them in production or investment contexts.',
                  },
                  {
                    heading: 'Site operation',
                    body: 'The publication may change design, routes, feeds, and subscription features as the product matures. Archived stories, feeds, and metadata may also be updated as part of normal editorial maintenance.',
                  },
                ]}
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
            <Link to="/contact">Contact</Link>
            <Link to="/editorial-policy">Editorial Policy</Link>
            <Link to="/ai-policy">AI Disclosure</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <a href="mailto:contact@ai-automator-lab.vercel.app">Email</a>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
