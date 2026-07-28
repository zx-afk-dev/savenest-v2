import type { GetServerSideProps } from 'next';
import { SITE_URL } from '@/lib/constants';

function buildRobotsTxt(): string {
  return `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.write(buildRobotsTxt());
  res.end();
  return { props: {} };
};

export default function Robots() {
  return null;
}
