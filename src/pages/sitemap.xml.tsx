import type { GetServerSideProps } from 'next';
import { SITE_URL } from '@/lib/constants';

const STATIC_ROUTES: { path: string; priority: string; changefreq: string }[] = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/faq', priority: '0.7', changefreq: 'monthly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/contact', priority: '0.4', changefreq: 'yearly' },
  { path: '/dmca', priority: '0.3', changefreq: 'yearly' },
  { path: '/disclaimer', priority: '0.3', changefreq: 'yearly' },
  { path: '/tqto', priority: '0.2', changefreq: 'yearly' },
];

function buildSitemapXml(): string {
  const now = new Date().toISOString();
  const urls = STATIC_ROUTES.map(
    (route) => `
  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
  ).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.write(buildSitemapXml());
  res.end();
  return { props: {} };
};

// This page's actual output is written directly to the response above;
// nothing here ever renders.
export default function Sitemap() {
  return null;
}
