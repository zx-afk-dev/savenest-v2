import Head from 'next/head';
import { useRouter } from 'next/router';
import { BRAND_COLOR, SITE_NAME, SITE_URL } from '@/lib/constants';

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  jsonLd?: object | object[];
  noIndex?: boolean;
}

export function SEO({
  title,
  description,
  path,
  ogImage = '/icons/og-cover.png',
  jsonLd,
  noIndex = false,
}: SEOProps) {
  const router = useRouter();
  const canonicalPath = path ?? router.asPath.split('?')[0];
  const canonicalUrl = `${SITE_URL}${canonicalPath === '/' ? '' : canonicalPath}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const jsonLdList = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="theme-color" content={BRAND_COLOR} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${SITE_URL}${ogImage}`} />
      <meta property="og:locale" content="id_ID" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${SITE_URL}${ogImage}`} />

      {jsonLdList.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Head>
  );
}
