export const FAQ_ITEMS = [
  {
    question: 'Apakah SaveNest gratis digunakan?',
    answer: 'Ya, SaveNest sepenuhnya gratis. Setiap hari tersedia kuota bersama untuk semua pengguna.',
  },
  {
    question: 'Apakah hasil download memiliki watermark?',
    answer:
      'Jika tersedia dari sumbernya, SaveNest menampilkan opsi "No Watermark" di samping opsi standar.',
  },
  {
    question: 'Mengapa proses download saya gagal?',
    answer:
      'Biasanya karena URL tidak valid, video bersifat privat, atau server sumber sedang sibuk. Coba klik "Coba Lagi" setelah beberapa saat.',
  },
  {
    question: 'Apakah SaveNest menyimpan video saya di server?',
    answer:
      'Tidak. SaveNest tidak memiliki penyimpanan berkas di server — file diunduh langsung dari sumber ke perangkatmu.',
  },
  {
    question: 'Kenapa ada batas jumlah request per hari?',
    answer:
      'Batas harian dipakai bersama oleh seluruh pengguna untuk menjaga layanan tetap stabil dan gratis untuk semua orang.',
  },
];

export function FAQSection() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
          Pertanyaan Umum
        </h2>
        <p className="mt-2 text-ink-800/70">Hal-hal yang sering ditanyakan pengguna SaveNest.</p>
      </div>

      <div className="mt-8 space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="glass-panel group p-5 open:pb-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-semibold text-ink-900">
              {item.question}
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0 text-brand-600 transition-transform group-open:rotate-45"
                fill="none"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-800/70">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
