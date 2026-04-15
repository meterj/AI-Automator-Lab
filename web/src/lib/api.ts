const PRODUCTION_API_BASE = 'https://ai-automator-lab-production.up.railway.app/api';

function resolveDefaultApiBase(): string {
  if (typeof window === 'undefined') {
    return PRODUCTION_API_BASE;
  }

  const host = window.location.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }

  return PRODUCTION_API_BASE;
}

export const API_BASE = import.meta.env.VITE_API_URL?.trim() || resolveDefaultApiBase();
