interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="glass-panel flex flex-col items-center gap-4 p-8 text-center animate-fade-up">
      <svg viewBox="0 0 120 120" className="h-28 w-28" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="#eff6ff" />
        <circle cx="60" cy="60" r="52" fill="none" stroke="#bfdbfe" strokeWidth="2" />
        <rect x="38" y="46" width="44" height="34" rx="6" fill="#2563eb" />
        <rect x="46" y="54" width="28" height="4" rx="2" fill="#ffffff" opacity="0.8" />
        <rect x="46" y="62" width="20" height="4" rx="2" fill="#ffffff" opacity="0.5" />
        <circle cx="60" cy="34" r="4" fill="#1d4ed8" />
        <path d="M60 40v4" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M42 90c4-6 12-9 18-9s14 3 18 9"
          stroke="#93c5fd"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      <div>
        <h3 className="font-display text-lg font-bold text-ink-900">Gagal mengambil video</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-800/70">{message}</p>
      </div>

      <button type="button" onClick={onRetry} className="btn-primary">
        Coba Lagi
      </button>
    </div>
  );
}
