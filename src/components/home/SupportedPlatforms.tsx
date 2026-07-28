const PLATFORMS = [
  {
    name: 'TikTok',
    desc: 'Video & foto TikTok tanpa watermark, kualitas HD.',
    color: 'bg-ink-900',
  },
  {
    name: 'Instagram',
    desc: 'Reels, postingan, dan IGTV dari akun publik.',
    color: 'bg-gradient-to-br from-brand-500 to-brand-700',
  },
  {
    name: 'YouTube',
    desc: 'Video & Shorts, termasuk ekstrak audio ke MP3.',
    color: 'bg-red-600',
  },
];

export function SupportedPlatforms() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
          Platform yang Didukung
        </h2>
        <p className="mt-2 text-ink-800/70">Tiga platform, satu tempat untuk semuanya.</p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {PLATFORMS.map((platform) => (
          <div key={platform.name} className="glass-panel p-6">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold text-white ${platform.color}`}
            >
              {platform.name.slice(0, 2).toUpperCase()}
            </span>
            <h3 className="mt-4 font-display text-lg font-bold text-ink-900">{platform.name}</h3>
            <p className="mt-1.5 text-sm text-ink-800/70">{platform.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
