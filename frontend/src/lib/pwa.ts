export type PwaAppKind = 'public' | 'admin';

const PUBLIC_PATHS = ['/public', '/shop'];

export const getPwaAppKind = (pathname: string): PwaAppKind =>
  PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
    ? 'public'
    : 'admin';

const config = {
  public: {
    manifest: '/manifest-public.webmanifest',
    icon: '/pwa-public-192.png',
    appleIcon: '/pwa-public-180.png',
  },
  admin: {
    manifest: '/manifest-admin.webmanifest',
    icon: '/pwa-admin-192.png',
    appleIcon: '/pwa-admin-180.png',
  },
} satisfies Record<PwaAppKind, { manifest: string; icon: string; appleIcon: string }>;

export function configurePwaIdentity(kind: PwaAppKind) {
  const selected = config[kind];
  const manifest = document.querySelector<HTMLLinkElement>('#app-manifest');
  const favicon = document.querySelector<HTMLLinkElement>('#app-favicon');
  const appleIcon = document.querySelector<HTMLLinkElement>('#apple-touch-icon');

  manifest?.setAttribute('href', selected.manifest);
  favicon?.setAttribute('href', selected.icon);
  appleIcon?.setAttribute('href', selected.appleIcon);
  document.documentElement.dataset.pwaKind = kind;
}
