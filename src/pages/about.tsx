import type { NextPage } from 'next';
import { SEO } from '@/components/layout/SEO';
import { PageShell } from '@/components/layout/PageShell';
import { breadcrumbSchema, organizationSchema } from '@/lib/seo';
import { SITE_NAME } from '@/lib/constants';

const AboutPage: NextPage = () => {
  return (
    <>
      <SEO
        title={`Tentang ${SITE_NAME}`}
        description={`Kenali ${SITE_NAME}, downloader video modern untuk TikTok, Instagram, dan YouTube.`}
        path="/about"
        jsonLd={[organizationSchema(), breadcrumbSchema([{ name: 'Tentang', path: '/about' }])]}
      />
      <PageShell
        title={`Tentang ${SITE_NAME}`}
        subtitle="Unduh video favoritmu tanpa ribet, tanpa aplikasi tambahan."
      >
        <p>
          {SITE_NAME} dibuat untuk satu tujuan sederhana: membuat proses menyimpan video dari
          TikTok, Instagram, dan YouTube secepat menempelkan sebuah tautan. Tidak perlu memasang
          aplikasi, tidak perlu mendaftar akun.
        </p>
        <h2>Bagaimana cara kerjanya?</h2>
        <p>
          Saat kamu menempelkan URL video, {SITE_NAME} memvalidasi tautan tersebut lalu meminta
          data medianya dari penyedia layanan pihak ketiga. Kami tidak melakukan scraping sendiri
          dan tidak menyimpan file video apa pun di server kami — setiap unduhan mengalir langsung
          dari sumber ke perangkatmu.
        </p>
        <h2>Komitmen kami</h2>
        <ul>
          <li>Tanpa biaya tersembunyi dan tanpa iklan yang mengganggu.</li>
          <li>Tanpa penyimpanan video di server — privasi tetap terjaga.</li>
          <li>Antarmuka cepat, ringan, dan mudah digunakan di perangkat apa pun.</li>
        </ul>
      </PageShell>
    </>
  );
};

export default AboutPage;
