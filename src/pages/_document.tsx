import { Html, Head, Main, NextScript } from 'next/document';
import { BRAND_COLOR, SITE_NAME } from '@/lib/constants';

export default function Document() {
  return (
    <Html lang="id">
      <Head>
        {/* Overrides Next.js's automatic <meta name="generator"> tag so the
            underlying framework isn't disclosed in the page source. */}
        <meta name="generator" content={SITE_NAME} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content={BRAND_COLOR} />
        <meta name="msapplication-TileColor" content={BRAND_COLOR} />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

