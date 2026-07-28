import { useRef } from 'react';

/**
 * Returns a wrapped version of `fn` that ignores calls made within
 * `delayMs` of the previous *accepted* call. Used on the download button to
 * blunt accidental double-clicks and simple auto-clicker scripts before the
 * request even reaches the network.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): (...args: Args) => void {
  const lastCallRef = useRef(0);

  return (...args: Args) => {
    const now = Date.now();
    if (now - lastCallRef.current < delayMs) return;
    lastCallRef.current = now;
    fn(...args);
  };
}
