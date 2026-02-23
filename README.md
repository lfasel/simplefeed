# SimpleFeed

SimpleFeed is a React + Vite photo feed app backed by Supabase.

## What it does

- Email/password auth with Supabase Auth
- Upload photos and auto-extract EXIF metadata (date + GPS when available)
- Client-side image compression for feed and grid renditions
- Edit and delete photos
- Feed view and grid view
- Pull-to-refresh and local cache for faster reloads

## Tech stack

- React 19
- Vite
- Supabase (Auth, Postgres, Storage)
- `exifr` for EXIF parsing

## Project structure

- `simplefeed/` - main frontend app
- `simplefeed-server/` - legacy local Express/SQLite backend (removed)

## Prerequisites

- Node.js 20+
- npm
- A Supabase project

## Environment variables

Create `simplefeed/.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

## Supabase setup

1. Create a `photos` storage bucket.
2. Create a `photos` table with columns:
   - `id` (uuid, default generated, primary key)
   - `created_at` (timestamptz, default now())
   - `storage_path_grid` (text, not null)
   - `storage_path_feed` (text, not null)
   - `caption` (text)
   - `taken_at` (timestamptz)
   - `lat` (double precision)
   - `lon` (double precision)
   - `location_name` (text)
3. Configure Row Level Security policies for your auth model.

## Local development

```bash
cd simplefeed
npm install
npm run dev
```

## Build

```bash
cd simplefeed
npm run build
npm run preview
```
