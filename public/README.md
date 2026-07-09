# public/

Static assets served at the site root.

Add before production:
- `icon-192.png` and `icon-512.png` — referenced by the PWA manifest (`src/app/manifest.ts`).
- `favicon.ico`, `apple-touch-icon.png`, `og-image.png` (Open Graph share image).

Generate a full icon set from a single source with e.g. `pwa-asset-generator` or
`sharp`. Keeping this README ensures the directory exists for the Docker build.
