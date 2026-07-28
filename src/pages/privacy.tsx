import type { NextPage } from 'next';
import { SEO } from '@/components/layout/SEO';
import { PageShell } from '@/components/layout/PageShell';
import { breadcrumbSchema } from '@/lib/seo';
import { SITE_NAME } from '@/lib/constants';

const PrivacyPage: NextPage = () => {
  return (
    <>
      <SEO
        title={`Kebijakan Privasi — ${SITE_NAME}`}
        description={`Bagaimana ${SITE_NAME} menangani data saat kamu menggunakan layanan.`}
        path="/privacy"
        jsonLd={breadcrumbSchema([{ name: 'Privacy', path: '/privacy' }])}
      />
      <PageShell title="Kebijakan Privasi" subtitle="Terakhir diperbarui: Juli 2026">
        <h2>Data yang Kami Proses</h2>
        <p>
          {SITE_NAME} tidak memiliki database dan tidak menyimpan riwayat URL yang kamu unduh
          secara permanen. URL yang kamu masukkan hanya diproses sementara untuk:
        </p>
        <ul>
          <li>Diteruskan ke API penyedia data video pihak ketiga.</li>
          <li>Disimpan singkat (maksimal 10 menit) di cache untuk mempercepat permintaan berulang.</li>
          <li>Dihitung secara agregat untuk kuota harian bersama — tanpa dikaitkan dengan identitas kamu.</li>
        </ul>
        <h2>Data Teknis</h2>
        <p>
          Seperti kebanyakan situs web, server dapat mencatat data teknis dasar (misalnya alamat
          IP dan user agent) sementara, semata-mata untuk keperluan keamanan seperti pembatasan
          laju permintaan (rate limiting) dan deteksi bot.
        </p>
        <h2>Pihak Ketiga</h2>
        <p>
          File media yang diunduh berasal langsung dari server penyedia layanan pihak ketiga.
          Kebijakan privasi platform asal (TikTok, Instagram, YouTube) tetap berlaku atas konten
          tersebut.
        </p>
        <h2>Cookie</h2>
        <p>{SITE_NAME} tidak menggunakan cookie pelacakan pihak ketiga untuk keperluan iklan.</p>
      </PageShell>
    </>
  );
};

export default PrivacyPage;
