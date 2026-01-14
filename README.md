# XDeleter

A web application to bulk delete tweets from Twitter/X using scraping (not official API). Built with Next.js App Router.

## Features

- 🚀 Lightning fast batch deletion (up to 25 tweets at once)
- 🔒 Secure & private (credentials never stored)
- 🎯 Selective control (choose exactly which tweets to delete)
- 💰 Flexible pricing (Free, Pro, Lifetime)

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 18
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Payments**: Gumroad

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Gumroad account (for payments)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/marcos-lezcano/XDeleter.git
cd XDeleter
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Fill in your environment variables (see `docs/SETUP.md` for details)

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy!

## Documentation

- [Setup Guide](docs/SETUP.md) - Step-by-step setup instructions
- [Architecture](docs/ARCHITECTURE.md) - Technical architecture details
- [Context](docs/CONTEXT.md) - Project context for developers

## License

MIT