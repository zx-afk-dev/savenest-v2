import { useCallback, useRef, useState } from 'react';
import type { DownloadApiResponse, DownloadResult } from '@/types';
import { validateSupportedUrl } from '@/lib/security/urlValidator';

export type DownloaderStatus = 'idle' | 'validating' | 'loading' | 'success' | 'error';

interface DownloaderState {
  status: DownloaderStatus;
  result: DownloadResult | null;
  errorMessage: string | null;
}

export function useDownloader() {
  const [state, setState] = useState<DownloaderState>({
    status: 'idle',
    result: null,
    errorMessage: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: 'idle', result: null, errorMessage: null });
  }, []);

  const submit = useCallback(async (rawUrl: string, turnstileToken?: string | null) => {
    setState({ status: 'validating', result: null, errorMessage: null });

    const validation = validateSupportedUrl(rawUrl);
    if (!validation.valid) {
      setState({
        status: 'error',
        result: null,
        errorMessage: validation.reason ?? 'URL tidak valid.',
      });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: 'loading', result: null, errorMessage: null });

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          url: validation.normalizedUrl,
          ...(turnstileToken ? { turnstileToken } : {}),
        }),
        signal: controller.signal,
      });

      const payload = (await response.json()) as DownloadApiResponse;

      if (!payload.success) {
        setState({ status: 'error', result: null, errorMessage: payload.message });
        return;
      }

      setState({ status: 'success', result: payload.data, errorMessage: null });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setState({
        status: 'error',
        result: null,
        errorMessage: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
      });
    }
  }, []);

  return { ...state, submit, reset };
}
