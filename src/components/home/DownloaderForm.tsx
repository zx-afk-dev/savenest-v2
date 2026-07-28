import { useState, type FormEvent } from 'react';
import { useDownloader } from '@/hooks/useDownloader';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { validateSupportedUrl } from '@/lib/security/urlValidator';
import { DownloadLoadingOverlay } from '@/components/loading/DownloadLoadingOverlay';
import { ResultCard } from '@/components/home/ResultCard';
import { ErrorState } from '@/components/home/ErrorState';
import { Button } from '@/components/common/Button';

export function DownloaderForm() {
  const [inputValue, setInputValue] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const { status, result, errorMessage, submit, reset } = useDownloader();

  const debouncedSubmit = useDebouncedCallback((url: string) => {
    void submit(url);
  }, 1200);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    const validation = validateSupportedUrl(trimmed);

    if (!validation.valid) {
      setFieldError(validation.reason ?? 'URL tidak valid.');
      return;
    }
    setFieldError(null);
    debouncedSubmit(trimmed);
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputValue(text);
        setFieldError(null);
      }
    } catch {
      // Clipboard read requires permission the user may not have granted —
      // they can still paste manually with Ctrl/Cmd+V.
    }
  }

  const isBusy = status === 'validating' || status === 'loading';
  const detectedPlatform = validateSupportedUrl(inputValue.trim()).platform ?? null;

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="glass-panel-strong p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <label htmlFor="video-url" className="sr-only">
              Tempel URL video TikTok, Instagram, atau YouTube
            </label>
            <input
              id="video-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="Tempel URL TikTok, Instagram, atau YouTube di sini..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (fieldError) setFieldError(null);
              }}
              className="w-full rounded-2xl border border-mist-200 bg-white/90 px-5 py-4 text-sm text-ink-900 placeholder:text-ink-800/40 focus:border-brand-400"
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? 'video-url-error' : undefined}
            />
            <button
              type="button"
              onClick={handlePaste}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl bg-mist-100 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-mist-200"
            >
              Paste
            </button>
          </div>

          <Button type="submit" loading={isBusy} className="sm:w-auto">
            {isBusy ? 'Memproses...' : 'Download'}
          </Button>
        </div>

        {fieldError && (
          <p id="video-url-error" role="alert" className="mt-3 px-1 text-sm font-medium text-red-600">
            {fieldError}
          </p>
        )}
      </form>

      {isBusy && <DownloadLoadingOverlay platform={detectedPlatform} />}

      {status === 'error' && errorMessage && (
        <div className="mt-6">
          <ErrorState message={errorMessage} onRetry={reset} />
        </div>
      )}

      {status === 'success' && result && (
        <div className="mt-6">
          <ResultCard result={result} />
        </div>
      )}
    </div>
  );
        }
