import type { NextPage } from 'next';
import { SEO } from '@/components/layout/SEO';
import { PageShell } from '@/components/layout/PageShell';
import { breadcrumbSchema } from '@/lib/seo';
import { SITE_NAME } from '@/lib/constants';

const DMCA_EMAIL = 'dmca@savenest.web.id';

const DmcaPage: NextPage = () => {
  return (
    <>
      <SEO
        title={`DMCA — ${SITE_NAME}`}
        description="Prosedur pengajuan pemberitahuan pelanggaran hak cipta (DMCA takedown)."
        path="/dmca"
        jsonLd={breadcrumbSchema([{ name: 'DMCA', path: '/dmca' }])}
      />
      <PageShell title="DMCA">
        <p>
          {SITE_NAME} menghormati hak kekayaan intelektual pihak lain. {SITE_NAME} sendiri tidak
          meng-hosting atau menyimpan file video apa pun — setiap tautan unduhan diproses langsung
          dari server sumber. Namun, jika kamu adalah pemegang hak cipta dan yakin bahwa konten
          yang dapat diakses melalui layanan ini melanggar hak cipta kamu, silakan kirimkan
          pemberitahuan resmi.
        </p>
        <h2>Pemberitahuan Wajib Memuat</h2>
        <ul>
          <li>Identifikasi karya berhak cipta yang diklaim dilanggar.</li>
          <li>URL spesifik yang melanggar (URL yang diproses melalui SaveNest).</li>
          <li>Informasi kontak: nama lengkap, alamat, nomor telepon, dan email.</li>
          <li>
            Pernyataan bahwa kamu memiliki itikad baik bahwa penggunaan tersebut tidak diizinkan.
          </li>
          <li>Pernyataan bahwa informasi dalam pemberitahuan akurat, di bawah sumpah.</li>
          <li>Tanda tangan fisik atau elektronik pemegang hak atau kuasanya.</li>
        </ul>
        <h2>Kirimkan Pemberitahuan ke</h2>
        <p>
          <a href={`mailto:${DMCA_EMAIL}`} className="font-semibold text-brand-700 underline">
            {DMCA_EMAIL}
          </a>
        </p>
      </PageShell>
    </>
  );
};

export default DmcaPage;
