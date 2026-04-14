# Deployment Notes

## Current production topology

- Frontend: Vercel
- API / scheduler: Railway
- Database: Supabase

## Railway variables required for daily RSS publishing

- `SCHEDULE_ENABLED=true`
- `SCHEDULE_MODE=rss`
- `SCHEDULE_CRON=0 9 * * *`

Recommended supporting variables:

- `NODE_ENV=production`
- `RSS_FEEDS=https://techcrunch.com/category/artificial-intelligence/feed/,https://venturebeat.com/category/ai/feed/,https://openai.com/news/rss.xml,https://www.artificialintelligence-news.com/feed/`
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `GROQ_API_KEY=...`

## Verification URLs

- Health: `https://ai-automator-lab-production.up.railway.app/health`
- Schedule: `https://ai-automator-lab-production.up.railway.app/api/schedule`
- Site: `https://ai-automator-lab.vercel.app/`

Expected API state after Railway is configured:

- `schedulerEnabled: true`
- `mode: rss`

## Manual test after deploy

1. Redeploy Railway service.
2. Confirm `/health` returns `schedulerEnabled: true`.
3. Confirm `/api/schedule` returns `enabled: true` and `mode: rss`.
4. Trigger a manual RSS run via `POST /api/schedule/run` with `{"mode":"rss"}`.
5. Verify new posts appear in Supabase and on the Vercel frontend.

## Notes

- The frontend is already live with the redesigned UI, route rewrites, robots, and sitemap.
- If Railway still reports `enabled: false` after code deploy, the service is almost certainly using explicit environment overrides in the Railway dashboard.
