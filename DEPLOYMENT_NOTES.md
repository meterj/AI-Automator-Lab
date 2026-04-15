# Deployment Notes

## Current production topology

- Frontend: Vercel
- API / scheduler: Railway
- Database: Supabase
- Fallback scheduler: GitHub Actions (`.github/workflows/daily-rss-publish.yml`)

## Railway variables required for daily RSS publishing

- `SCHEDULE_ENABLED=true`
- `SCHEDULE_MODE=rss`
- `SCHEDULE_CRON=0 9 * * *`

Recommended supporting variables:

- `NODE_ENV=production`
- `RSS_FEEDS=https://techcrunch.com/category/artificial-intelligence/feed/,https://venturebeat.com/category/ai/feed/,https://openai.com/news/rss.xml,https://www.artificialintelligence-news.com/feed/`
- `SCHEDULE_TRIGGER_TOKEN=use-the-same-random-secret-in-railway-and-github-actions`
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

## Newsletter subscriber setup

- Run [subscribers.sql](F:\CCP\blog\supabase\subscribers.sql) once in the Supabase SQL editor.
- After that, `POST /api/subscribers` will store newsletter signups and the homepage/article signup forms will become functional.
- `/health` now reports `subscriberStorageReady` and `subscriberCount` so you can confirm the table is live.

## Ads.txt

- [ads.txt](F:\CCP\blog\web\public\ads.txt) has been added as a placeholder.
- Replace it with your real network entry after AdSense or another ad platform approves the site.

## GitHub Actions fallback

- The repository now includes a scheduled workflow that calls `POST /api/schedule/run` every day at 00:00 UTC, which is 09:00 in Asia/Seoul.
- This keeps RSS auto-publishing running even if the Railway internal scheduler remains disabled.
- You can also trigger the workflow manually from the GitHub Actions tab with `workflow_dispatch`.
- Add `SCHEDULE_TRIGGER_TOKEN` as a GitHub Actions secret and set the same value in Railway variables before enabling endpoint protection.
- In production, `/api/schedule/run` is blocked unless `SCHEDULE_TRIGGER_TOKEN` is set. The workflow now fails fast when the secret is missing.

## Notes

- The frontend is already live with the redesigned UI, route rewrites, robots, and sitemap.
- If Railway still reports `enabled: false` after code deploy, the service is almost certainly using explicit environment overrides in the Railway dashboard.
