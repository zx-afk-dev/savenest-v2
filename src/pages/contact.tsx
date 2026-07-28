import type { NextPage } from 'next';
import { SEO } from '@/components/layout/SEO';
import { PageShell } from '@/components/layout/PageShell';
import { breadcrumbSchema } from '@/lib/seo';
import { SITE_NAME } from '@/lib/constants';

const CONTACT_EMAIL = 'halo@savenest.web.id';

const ContactPage: NextPage = () => {
  return (
    <>
      <SEO
        title={`Kontak — ${SITE_NAME}`}
        description={`Hubungi tim ${SITE_NAME} untuk pertanyaan, laporan bug, atau kerja sama.`}
        path="/contact"
        jsonLd={breadcrumbSchema([{ name: 'Contact', path: '/contact' }])}
      />
      <PageShell
        title="Kontak Kami"
        subtitle="Punya pertanyaan, laporan masalah, atau masukan? Kami siap mendengarkan."
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/10">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-brand-600" fill="none" aria-hidden="true">
              <path
                d="M4 6h16v12H4z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="text-sm text-ink-800/70">Kirim email langsung ke:</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="btn-primary"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="max-w-sm text-xs text-ink-800/50">
            Untuk laporan pelanggaran hak cipta, silakan gunakan halaman{' '}
            <a href="/dmca" className="font-semibold text-brand-700 underline">
              DMCA
            </a>{' '}
            agar diproses lebih cepat.
          </p>
        </div>
      </PageShell>
    </>
  );
};

export default ContactPage;
