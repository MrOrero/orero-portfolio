# Orero Ozore · Portfolio

A one-page portfolio built with Next.js (App Router), React and `motion`. The work is presented as cargo on a container ship: a pinned voyage you can load by sector or by year, a yard of containers, a full manifest, and a bill of lading for the bio.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

## Where things live

- `src/content/`: all copy and project data (typed). Edit projects, years and links here.
- `src/app/page.tsx`: the page, assembled from `src/app/_components/`.
- `src/app/globals.css`: every style and design token for the site.
- `public/projects/mockups/`: the high-resolution device mockups (2916px wide).
- `scripts/contrast.mjs`: checks every text/background colour pair against WCAG AA.

## Deploying

Set `NEXT_PUBLIC_SITE_URL` (for example `https://example.com`) so the canonical URL, share card, sitemap and robots file point at the real domain. On Vercel the production domain is used automatically when it is not set.

When you replace a project image, give it a new file name. Images are cached for a month under their name, so reusing a name can keep serving the old picture.
