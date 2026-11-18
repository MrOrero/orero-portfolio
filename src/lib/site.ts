/**
 * The public origin, used for canonical, Open Graph, sitemap and robots URLs.
 * Set NEXT_PUBLIC_SITE_URL in production; on Vercel the production domain is used
 * automatically when it is not set.
 */
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
);
