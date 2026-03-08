# Day Planner — AI Schedule Builder

A personal scheduling app. Describe your day in plain language → AI builds your block schedule → add notes to each block → all saved to the cloud.

---

## Stack
- **React + Vite** — frontend
- **Claude API** (Sonnet) — AI schedule generation
- **Supabase** — database for schedules and notes
- **Vercel** — hosting + serverless API proxy

---

## Setup (one time)

### 1. Supabase
1. Go to [supabase.com](https://supabase.com) → New Project
2. Once created, go to **SQL Editor**
3. Paste and run the contents of `supabase-schema.sql`
4. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key

### 2. API Keys
**Gemini (free default):**
1. Go to [aistudio.google.com](https://aistudio.google.com) → Get API Key — free, no credit card
2. Copy the key

**Claude (optional paid fallback):**
1. Go to [console.anthropic.com](https://console.anthropic.com) → Create API key

### 3. Local Development
```bash
# Clone your repo and install dependencies
npm install

# Create your environment file
cp .env.example .env.local

# Fill in .env.local with your keys:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
# GEMINI_API_KEY=your-gemini-key          ← free, required
# ANTHROPIC_API_KEY=sk-ant-your-key       ← optional, paid

# Start dev server
npm run dev
```

> Note: The `/api/chat.js` Vercel serverless function won't run locally with `npm run dev`.
> For local testing of the AI, install Vercel CLI: `npm i -g vercel` then run `vercel dev` instead.

### 4. Deploy to Vercel
```bash
# Push to GitHub first
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/yourusername/schedule-app.git
git push -u origin main
```

Then:
1. Go to [vercel.com](https://vercel.com) → Add New Project
2. Import your GitHub repo
3. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` ← required
   - `ANTHROPIC_API_KEY` ← optional, only if you want Claude fallback
4. Click Deploy — your app is live at `yourapp.vercel.app`

---

## How It Works

1. **Chat screen** — describe your day casually. The AI asks 1-2 clarifying questions then generates your schedule.
2. **Schedule screen** — view your blocks. Click "Add / view notes" on any block to write notes. They save automatically to Supabase.
3. **Past Schedules** — browse all previous days, open any schedule, see and edit its notes.
4. **Export PDF** — download a clean PDF of your schedule including any notes.

---

## Phase 2 Roadmap (future)
- Google Calendar integration — read existing events and build around them
- Auth — multi-user support with login
- Weekly view — see all 7 days at a glance
- Recurring blocks — "I always go to the gym at 6pm"
