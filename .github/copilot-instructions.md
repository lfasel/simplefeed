# SimpleFeed Codebase Guide for AI Agents

## Architecture Overview
SimpleFeed is a **full-stack photo management app** with:
- **Frontend**: React + Vite SPA with Drag-Drop UX
- **Backend**: Express + SQLite with file uploads
- **Key integration**: Frontend fetches from `http://localhost:4000/api/photos`

## Critical Data Flow
1. **Upload**: Browser File → FormData (with EXIF metadata) → Server → SQLite + `/uploads/` disk storage
2. **Edit**: Prefill form from photo object → Same upload endpoint with photo ID
3. **Delete**: Remove DB record + file from disk via `safeUnlink()`
4. **Display**: Frontend fetches all photos, renders in Feed (list) or Grid (card) view

## React Component Patterns

### State Management
- **App.jsx**: Single source of truth for `photos` array and UI modes (`feed`/`grid`)
- No Redux/Context—pass via props and callback handlers
- `editingPhoto` state tracks edit mode (triggers prefill vs new upload)

### Custom Hooks
- **`usePhotoForm()`** ([src/hooks/usePhotoForm.js](src/hooks/usePhotoForm.js)): Encapsulates all form state + EXIF parsing
  - Handles file preview URLs with proper cleanup (`revokeFilePreviewUrl`)
  - Converts between ISO datetime and local input format
- **`useDragDrop()`** ([src/hooks/useDragDrop.js](src/hooks/useDragDrop.js)): Global window drag listeners
  - Filters non-file drops, prevents defaults, handles single file

### Component Composition
- **PhotoCard**: Renders individual photo with metadata (caption, date, location)
- **PhotoFeed**: Linear list view (scrollable)
- **PhotoGrid**: Card grid layout
- **UploadModal**: Modal form for upload/edit with live preview

## Backend Conventions

### Express Endpoints
```
POST   /api/photos          → Upload new photo
PUT    /api/photos/:id      → Update (re-upload with same ID)
GET    /api/photos          → Fetch all (JSON array)
DELETE /api/photos/:id      → Delete record + file
GET    /uploads/:filename   → Static file serving
```

### Database Schema
- **photos**: id, filename, caption, createdAt, takenAt, lat, lon, locationName
- Dynamic column addition via `addColumnIfMissing()` prevents migration hassles
- All metadata extracted from EXIF client-side to reduce server complexity

### File Handling
- Multer stores to `./uploads/` with timestamp + random suffix
- `safeUnlink()` handles missing files gracefully (ENOENT check)
- URLs returned as `/uploads/{filename}` for static serving

## EXIF & Metadata Extraction
- **Client-side only** using `exifr` library in [src/utils/fileUtils.js](src/utils/fileUtils.js)
- Extracts: DateTimeOriginal → `takenAtLocal`, GPS lat/lon
- Gracefully fails if EXIF unavailable (returns empty object)
- Server receives pre-parsed metadata in FormData

## Key Developer Workflows

### Local Dev
```bash
# Terminal 1: Backend
cd simplefeed-server && node index.js  # Runs on :4000

# Terminal 2: Frontend
cd simplefeed && npm run dev          # Vite on :5173
```

### Building
```bash
cd simplefeed && npm run build        # Output: dist/
```

### Linting
```bash
npm run lint                          # ESLint
```

## Common Editing Patterns

1. **Adding a photo field**: 
   - Add column via `addColumnIfMissing()` in server
   - Add FormData field in `usePhotoForm.createFormData()`
   - Update PhotoCard display + UploadModal form fields

2. **New API endpoint**:
   - Add to [simplefeed-server/index.js](simplefeed-server/index.js)
   - Wrap function in [src/utils/api.js](src/utils/api.js)
   - Call from App.jsx with error handling via alert()

3. **Form state changes**:
   - Modify [src/hooks/usePhotoForm.js](src/hooks/usePhotoForm.js)
   - Update Form UI in [src/components/UploadModal.jsx](src/components/UploadModal.jsx)
   - Handle in `createFormData()` method

## Code Style Notes
- ES Modules throughout (type: "module")
- React imports destructured from "react"
- Optional chaining (`?.`) and nullish coalescing (`??`) heavily used
- Async/await (not promises)
- CSS in separate .css files, not inline styles

## Gotchas
1. **CORS**: Backend requires `cors()` middleware; frontend hardcoded to `:4000`
2. **File preview cleanup**: Always revoke blob URLs in usePhotoForm to prevent memory leaks
3. **Filename uniqueness**: Server uses Date.now() + random; no hash collision risk but not crypto-secure
4. **Mobile support**: Drag-drop may not work on all mobile browsers; touch upload via file input not yet implemented
