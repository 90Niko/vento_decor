const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

/**
 * Resolves the backend origin for browser-only feature clients.
 * Features depend on this small boundary instead of duplicating environment logic.
 */
export function getApiUrl(): string {
  return (
    configuredApiUrl ??
    `${window.location.protocol}//${window.location.hostname}:3001`
  );
}
