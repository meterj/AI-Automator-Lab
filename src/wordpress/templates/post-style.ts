// src/wordpress/templates/post-style.ts - 프리미엄 매거진 디자인 시스템

export const POST_STYLES = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&family=Inter:wght@400;600;800&display=swap');

  .premium-post-wrapper {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #2d3436;
    line-height: 1.8;
    max-width: 850px;
    margin: 0 auto;
    background: #ffffff;
    word-break: keep-all;
  }

  .premium-post-wrapper h1, .premium-post-wrapper h2, .premium-post-wrapper h3 {
    font-family: 'Noto Serif KR', serif;
    color: #1a1a1a;
    margin-top: 2.5rem;
    margin-bottom: 1.2rem;
    letter-spacing: -0.02em;
  }

  .premium-post-wrapper h2 {
    font-size: 2.2rem;
    border-left: 5px solid #1a2a6c;
    padding-left: 1rem;
    background: linear-gradient(to right, #f8f9fa, transparent);
  }

  .premium-lead-text {
    font-size: 1.25rem;
    color: #636e72;
    font-weight: 400;
    margin-bottom: 3rem;
    padding: 2rem;
    background: #fdfdfd;
    border-top: 1px solid #eee;
    border-bottom: 1px solid #eee;
    font-style: italic;
    text-align: center;
  }

  .premium-quote {
    position: relative;
    padding: 3rem 2rem;
    margin: 3rem 0;
    background: #1a2a6c;
    color: #ffffff;
    border-radius: 12px;
    font-size: 1.4rem;
    font-weight: 600;
    text-align: center;
    box-shadow: 0 10px 30px rgba(26, 42, 108, 0.2);
  }

  .premium-quote::before {
    content: '"';
    position: absolute;
    top: -10px;
    left: 20px;
    font-size: 5rem;
    opacity: 0.2;
  }

  .premium-card {
    background: linear-gradient(135deg, #ffffff 0%, #f1f2f6 100%);
    border: 1px solid #dfe4ea;
    border-radius: 16px;
    padding: 2rem;
    margin: 2.5rem 0;
    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
  }

  .premium-card-title {
    display: inline-block;
    background: #1a2a6c;
    color: white;
    padding: 0.4rem 1rem;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 800;
    margin-bottom: 1rem;
    text-transform: uppercase;
  }

  .highlight-accent {
    color: #b33939;
    font-weight: 700;
    background: linear-gradient(120deg, rgba(255, 177, 66, 0.2) 0%, rgba(255, 177, 66, 0.2) 100%);
    background-repeat: no-repeat;
    background-size: 100% 40%;
    background-position: 0 80%;
  }

  .premium-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, #eee, transparent);
    margin: 4rem 0;
  }
</style>
`;

export const LAYOUT_TEMPLATES = {
  wrap: (content: string) => `<div class="premium-post-wrapper">${POST_STYLES}\n${content}</div>`,
  lead: (text: string) => `<div class="premium-lead-text">${text}</div>`,
  quote: (text: string) => `<div class="premium-quote">${text}</div>`,
  card: (title: string, content: string) => `
    <div class="premium-card">
      <div class="premium-card-title">${title}</div>
      <div class="premium-card-content">${content}</div>
    </div>
  `,
  section: (title: string, content: string) => `
    <section>
      <h2>${title}</h2>
      <div>${content}</div>
    </section>
  `
};
