import type { NextPage } from 'next';
import Link from 'next/link';
import { SEO } from '@/components/layout/SEO';
import { SITE_NAME } from '@/lib/constants';

const NotFoundPage: NextPage = () => {
  return (
    <>
      <SEO
        title={`Halaman Tidak Ditemukan — ${SITE_NAME}`}
        description="Halaman yang kamu cari tidak ditemukan."
        path="/404"
        noIndex
      />
      <section className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-5 py-20 text-center">
        <span className="font-display text-7xl font-extrabold text-brand-600">404</span>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mt-2 text-ink-800/70">
          Sepertinya halaman yang kamu cari sudah dipindahkan atau tidak pernah ada.
        </p>
        <Link href="/" className="btn-primary mt-6">
          Kembali ke Beranda
        </Link>
      </section>
    </>
  );
};

export default NotFoundPage;
