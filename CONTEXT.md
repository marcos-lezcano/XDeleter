# XDeleter - Project Context

## Overview
XDeleter is a web app to bulk delete tweets from Twitter/X using scraping (not official API). Built with Next.js App Router.

## Current Status
The app is **functional** with:
- Landing page with hero, features, and pricing sections
- User authentication (Supabase Auth - email/password)
- Dashboard with subscription management
- Tweet listing with selection (checkboxes, select all)
- Batch deletion (25 tweets at a time to avoid rate limits)
- Payment integration with Gumroad
- Usage limits (50/day free, unlimited paid)

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React, CSS (no Tailwind)
- **Backend**: Next.js API routes that proxy requests to Twitter's GraphQL API
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Payments**: Gumroad (overlay checkout + webhooks)

## Key Files

### Pages
- `/src/app/page.js` - Landing page
- `/src/app/login/page.js` - Login
- `/src/app/register/page.js` - Register
- `/src/app/dashboard/page.js` - User dashboard with Gumroad checkout links
- `/src/app/app/page.js` - Main app (delete tweets)

### API Routes
- `/src/app/api/tweets/route.js` - Fetch tweets from Twitter
- `/src/app/api/delete/route.js` - Delete tweets + track usage
- `/src/app/api/webhook/[secret]/route.js` - Gumroad webhook (secure)

### Auth & Context
- `/src/context/AuthContext.js` - Auth state + subscription checks
- `/src/lib/supabase/` - Supabase client setup

## Pricing
- Free: $0 (50 tweets/day)
- Pro: $1.99/month (unlimited)
- Lifetime: $9.99 one-time (unlimited)

## Payment Flow (Gumroad)
1. User clicks checkout link in dashboard
2. Gumroad overlay opens (script loaded in layout.js)
3. User pays
4. Gumroad sends webhook to `/api/webhook/[secret]`
5. Webhook verifies request and updates user's subscription_tier

## Pending Configuration
See `/docs/SETUP.md` for detailed setup instructions:
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] Create Gumroad products (Pro + Lifetime)
- [ ] Configure Gumroad webhook URL
- [ ] Get GUMROAD_SELLER_ID from test ping
- [ ] Deploy to production

## Documentation
- `/docs/SETUP.md` - Step-by-step setup guide
- `/docs/ARCHITECTURE.md` - Technical architecture details
- `/docs/CONTEXT.md` - Context for future Claude sessions

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://gsvwcwlxivsmbzzjiahu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_GUMROAD_PRO_URL=https://...
NEXT_PUBLIC_GUMROAD_LIFETIME_URL=https://...
GUMROAD_WEBHOOK_SECRET=...
GUMROAD_SELLER_ID=...
```

## Twitter API Notes
- Bearer token is public/constant
- Query IDs may change - check github.com/trevorhobenshield/twitter-api-client
- CORS requires backend proxy
- auth_token cookie is HttpOnly (user must copy from DevTools)