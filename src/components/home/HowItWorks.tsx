const STEPS = [
  {
    number: '01',
    title: 'Salin URL',
    desc: 'Buka video di TikTok, Instagram, atau YouTube, lalu salin tautannya.',
  },
  {
    number: '02',
    title: 'Tempel & Klik Download',
    desc: 'Tempel URL ke kolom di atas, lalu klik tombol Download.',
  },
  {
    number: '03',
    title: 'Pilih & Simpan',
    desc: 'Pilih kualitas yang diinginkan, lalu unduh langsung ke perangkatmu.',
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
          Cara Penggunaan
        </h2>
        <p className="mt-2 text-ink-800/70">Tiga langkah, tanpa instalasi apa pun.</p>
      </div>

      <ol className="mt-10 grid gap-5 sm:grid-cols-3">
        {STEPS.map((step) => (
          <li key={step.number} className="glass-panel p-6">
            <span className="font-mono text-sm font-semibold text-brand-500">{step.number}</span>
            <h3 className="mt-3 font-display text-lg font-bold text-ink-900">{step.title}</h3>
            <p className="mt-1.5 text-sm text-ink-800/70">{step.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
