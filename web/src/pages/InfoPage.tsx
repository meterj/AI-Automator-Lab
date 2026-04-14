import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../seo';

type InfoSection = {
  heading: string;
  body: string;
};

type InfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  path: string;
  sections: InfoSection[];
  ctaLabel?: string;
  ctaHref?: string;
};

const InfoPage: React.FC<InfoPageProps> = ({
  eyebrow,
  title,
  description,
  path,
  sections,
  ctaLabel,
  ctaHref,
}) => {
  useEffect(() => {
    return applySeo({
      title: `${title} | AI Automator Lab`,
      description,
      url: `https://ai-automator-lab.vercel.app${path}`,
      type: 'website',
    });
  }, [description, path, title]);

  return (
    <main className="info-shell">
      <section className="info-hero">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display-serif">{title}</h1>
        <p className="info-lead">{description}</p>
        {ctaLabel && ctaHref && (
          ctaHref.startsWith('/')
            ? <Link to={ctaHref} className="primary-link">{ctaLabel}</Link>
            : <a href={ctaHref} className="primary-link">{ctaLabel}</a>
        )}
      </section>

      <section className="info-grid">
        {sections.map((section) => (
          <article key={section.heading} className="info-card">
            <p className="eyebrow">Section</p>
            <h2 className="display-serif">{section.heading}</h2>
            <p>{section.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
};

export default InfoPage;
