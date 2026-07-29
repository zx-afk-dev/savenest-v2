import type { NextPage } from 'next';
import { SEO } from '@/components/layout/SEO';
import { PageShell } from '@/components/layout/PageShell';
import { breadcrumbSchema } from '@/lib/seo';
import { SITE_NAME } from '@/lib/constants';

const CREDITS = [
  { name: 'Modern Web Framework', role: 'Fondasi aplikasi & rendering halaman' },
  { name: 'Utility-First Styling', role: 'Sistem desain & antarmuka' },
  { name: 'Cloud Hosting Partner', role: 'Hosting & infrastruktur serverless' },
  { name: 'Key-Value Storage', role: 'Penyimpanan kuota harian & cache' },
  { name: 'Data Provider Partners', role: 'Penyedia data pengambilan media' },
];

const TqtoPage: NextPage = () => {
  return (
    <>
      <SEO
        title={`Thanks To — ${SITE_NAME}`}
        description={`Pihak dan proyek open-source yang membuat ${SITE_NAME} bisa berjalan.`}
        path="/tqto"
        jsonLd={breadcrumbSchema([{ name: 'Thanks To', path: '/tqto' }])}
      />
      <PageShell title="Thanks To" subtitle="Dibangun di atas karya orang-orang hebat.">
        <ul className="!space-y-3">
          {CREDITS.map((credit) => (
            <li key={credit.name} className="flex items-center justify-between gap-4 !text-sm">
              <span className="font-semibold text-ink-900">{credit.name}</span>
              <span className="text-ink-800/60">{credit.role}</span>
            </li>
          ))}
        </ul>
      </PageShell>
    </>
  );
};

export default TqtoPage;
