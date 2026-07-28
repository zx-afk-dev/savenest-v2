import type { NextPage } from 'next';
import { SEO } from '@/components/layout/SEO';
import { PageShell } from '@/components/layout/PageShell';
import { breadcrumbSchema } from '@/lib/seo';
import { SITE_NAME } from '@/lib/constants';

const TermsPage: NextPage = () => {
  return (
    <>
      <SEO
        title={`Ketentuan & Syarat — ${SITE_NAME}`}
        description={`Ketentuan penggunaan layanan ${SITE_NAME}.`}
        path="/terms"
        jsonLd={breadcrumbSchema([{ name: 'Terms', path: '/terms' }])}
      />
      <PageShell title="Ketentuan & Syarat" subtitle="Terakhir diperbarui: Juli 2026">
        <p>
          Dengan menggunakan {SITE_NAME}, kamu menyetujui ketentuan berikut. Jika tidak setuju,
          mohon untuk tidak menggunakan layanan ini.
        </p>
        <h2>1. Penggunaan Layanan</h2>
        <ul>
          <li>
            {SITE_NAME} disediakan untuk keperluan pribadi, non-komersial, dan hanya untuk konten
            yang kamu miliki haknya atau yang penggunaannya diizinkan oleh pemilik konten.
          </li>
          <li>Kamu bertanggung jawab penuh atas cara kamu menggunakan file yang diunduh.</li>
          <li>Dilarang menggunakan layanan ini untuk tujuan yang melanggar hukum.</li>
        </ul>
        <h2>2. Batasan Layanan</h2>
        <p>
          Layanan memiliki kuota harian bersama yang berlaku untuk seluruh pengguna dan dapat
          berubah sewaktu-waktu. {SITE_NAME} tidak menjamin ketersediaan layanan tanpa gangguan.
        </p>
        <h2>3. Konten Pihak Ketiga</h2>
        <p>
          Data media diambil dari layanan pihak ketiga. {SITE_NAME} tidak bertanggung jawab atas
          keakuratan, ketersediaan, atau legalitas konten yang diproses melalui layanan pihak
          ketiga tersebut.
        </p>
        <h2>4. Perubahan Ketentuan</h2>
        <p>
          Ketentuan ini dapat diperbarui sewaktu-waktu. Penggunaan berkelanjutan atas layanan
          setelah perubahan dianggap sebagai persetujuan atas ketentuan yang baru.
        </p>
      </PageShell>
    </>
  );
};

export default TermsPage;
