'use client';
import { useSyncExternalStore } from 'react';
export const MOBILE_QUERY = '(max-width: 760px), (max-height: 500px) and (pointer: coarse)';
export function isMobileViewport() {
  return window.matchMedia(MOBILE_QUERY).matches;
}
function subscribe(callback: () => void) {
  const media = window.matchMedia(MOBILE_QUERY);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
export function useIsMobile() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}
