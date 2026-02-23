# SimpleFeed Codebase Guide for AI Agents

## Architecture Overview

SimpleFeed is a frontend-only React + Vite app that uses Supabase for:

- Auth (email/password)
- Database table: `photos`
- Storage bucket: `photos`

There is no local Express/SQLite backend in this repo.

## Critical Data Flow

1. User signs in via Supabase Auth.
2. User uploads an image in `UploadModal`.
3. Client extracts EXIF metadata (`src/utils/fileUtils.js`), compresses image in-browser, and uploads two renditions to Supabase Storage.
4. App writes metadata + storage paths to `photos` table.
5. App loads rows and generates signed image URLs for feed/grid rendering.

## Core Frontend Structure

- `src/App.jsx`: app shell, auth gating, feed/grid view state, upload/edit/delete flows.
- `src/utils/api.js`: Supabase CRUD + signed URL generation + client-side image compression.
- `src/utils/supabaseClient.js`: Supabase client using Vite env vars.
- `src/hooks/usePhotoForm.js`: upload/edit form state and FormData creation.
- `src/hooks/useDragDrop.js`: global file drag/drop handling.

## Environment

Required in `simplefeed/.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Local Development

```bash
cd simplefeed
npm install
npm run dev
```

## Notes

- Keep storage path fields (`storage_path_grid`, `storage_path_feed`) in sync with the `photos` table schema.
- Keep signed URL and caching behavior stable when modifying `src/utils/api.js`.
