# spillthebeans

**Find cafes built for deep work.** Rated by remote workers on WiFi, power, noise, and more.

Stack: React 18 + TypeScript + Vite + TanStack Query + Zod + Supabase + Tailwind + Leaflet

---

## Quick Start

### 1. Install

```bash
git clone <repo>
cd spillthebeans
npm install
```

### 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `supabase/schema.sql`
3. Go to **Authentication > Providers > Google** and enable Google OAuth
   - Add your Google OAuth Client ID and Secret (from [console.cloud.google.com](https://console.cloud.google.com))
   - Authorized redirect URI in Google: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
4. Copy your **Project URL** and **anon key** from **Settings > API**

### 3. Environment

```bash
cp .env.example .env
# Fill in your Supabase URL and anon key
```

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run

```bash
npm run dev
```

### 5. Make yourself admin

Sign in once, then go to **Supabase > Authentication > Users**, copy your UUID, and run in the SQL Editor:

```sql
update public.profiles set is_admin = true where id = 'YOUR-UUID-HERE';
```

---

## Project Structure

```
src/
├── components/
│   ├── layout/         Navbar, Footer, Layout, ProtectedRoute
│   ├── review/         ReviewCard
│   ├── spot/           SpotCard
│   └── ui/             Avatar, EmptyState, RatingInput, ScoreBar, Spinner, Toast
├── context/
│   └── AuthContext.tsx Auth state + Google OAuth + logout redirect
├── hooks/
│   ├── useLikes.ts
│   ├── useReviews.ts
│   └── useSpots.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts       Supabase client
│   │   └── queries.ts      All DB operations
│   └── utils.ts            cn(), computeSpotStats(), scoreLabel()
├── pages/
│   ├── AdminPanel.tsx  Spot CRUD + review overview + stats
│   ├── AuthCallback.tsx
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── MapPage.tsx     Leaflet map, score-colored markers
│   ├── Profile.tsx
│   ├── Settings.tsx    Profile edit + sign out
│   ├── SpotPage.tsx    Detail view with all 6 score bars + mini map
│   ├── Spots.tsx       Browse + filter + sort
│   └── WriteReview.tsx 6-dimension rating form with Zod validation
├── types/index.ts      All TypeScript types + constants
├── validation/index.ts Zod schemas for review, spot, profile
├── App.tsx             Routes
└── main.tsx            Entry point
```

---

## Features

| Feature | Status |
|---|---|
| Google OAuth | done |
| Browse spots (search, filter, sort) | done |
| 6-dimension work ratings (WiFi, Power, Noise, Laptop, Coffee, Seating) | done |
| Spot detail page with score bars + mini map | done |
| Full map view with score-colored markers | done |
| Write / edit reviews with Zod validation | done |
| Save / bookmark spots | done |
| Like reviews | done |
| Profile with tabs (reviews, saved) | done |
| Settings + profile edit | done |
| Admin panel (spot CRUD + review table) | done |
| Row Level Security | done |
| TypeScript throughout | done |
| Zod form validation | done |
| PWA manifest | done |
| Sign-out works correctly from all pages | done |

---

## Rating Dimensions

Each spot is rated 1–5 on:

| Dimension | What it measures |
|---|---|
| WiFi Quality | Speed and reliability for calls and uploads |
| Power Outlets | Number and accessibility per seat |
| Noise Level | Ambient sound level for focus |
| Laptop Friendly | Table depth, screen glare, desk height |
| Coffee Quality | Taste, variety, consistency |
| Seating Comfort | Chair support for multi-hour sessions |

---

## Deploy to Vercel

```bash
npm run build
```

Connect your repo to Vercel and add these environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The `vercel.json` already handles SPA routing.

---

## Roadmap

- [ ] Image uploads via Supabase Storage (spot photos from community)
- [ ] City expansion beyond Baguio
- [ ] "Work score" algorithm with weighted dimensions
- [ ] Quick filters: open now, has standing desk, no time limit
- [ ] Admin: delete / flag reviews
- [ ] Next.js migration for SEO / SSR
