import type { NextPage } from 'next';
import { SEO } from '@/components/layout/SEO';
import { PageShell } from '@/components/layout/PageShell';
import { breadcrumbSchema } from '@/lib/seo';
import { SITE_NAME } from '@/lib/constants';

const DisclaimerPage: NextPage = () => {
  return (
    <>
      <SEO
        title={`Disclaimer — ${SITE_NAME}`}
        description={`Penafian penggunaan layanan ${SITE_NAME}.`}
        path="/disclaimer"
        jsonLd={breadcrumbSchema([{ name: 'Disclaimer', path: '/disclaimer' }])}
      />
      <PageShell title="Disclaimer">
        <p>
          {SITE_NAME} adalah alat bantu teknis yang mempermudah pengambilan tautan media dari
          platform TikTok, Instagram, dan YouTube. {SITE_NAME}:
        </p>
        <ul>
          <li>Tidak berafiliasi dengan, disponsori oleh, atau didukung oleh TikTok, Instagram/Meta, maupun YouTube/Google.</li>
          <li>Tidak melakukan hosting, penyimpanan, atau distribusi ulang konten video apa pun.</li>
          <li>
            Tidak bertanggung jawab atas cara pengguna memanfaatkan konten yang diunduh. Tanggung
            jawab hukum atas penggunaan konten sepenuhnya berada di tangan pengguna.
          </li>
          <li>Disediakan "sebagaimana adanya" tanpa jaminan ketersediaan atau keakuratan data.</li>
        </ul>
        <p>
          Pengguna diimbau untuk hanya mengunduh konten yang mereka miliki hak atasnya, atau yang
          penggunaannya diizinkan oleh pemilik hak cipta / ketentuan platform terkait.
        </p>
      </PageShell>
    </>
  );
};

export default DisclaimerPage;
