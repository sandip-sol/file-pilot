export interface FaviconSize {
  id: string;
  label: string;
  width: number;
  height: number;
  filename: string;
  purpose: string;
  maskable?: boolean;
  safePadding?: number;
}

export const faviconSizes: FaviconSize[] = [
  {
    id: 'favicon-16',
    label: '16×16 Favicon',
    width: 16,
    height: 16,
    filename: 'favicon-16x16.png',
    purpose: 'Browser tab icon (standard)',
  },
  {
    id: 'favicon-32',
    label: '32×32 Favicon',
    width: 32,
    height: 32,
    filename: 'favicon-32x32.png',
    purpose: 'Browser tab icon (high-DPI)',
  },
  {
    id: 'favicon-48',
    label: '48×48 Favicon',
    width: 48,
    height: 48,
    filename: 'favicon-48x48.png',
    purpose: 'Windows site icon',
  },
  {
    id: 'apple-touch',
    label: '180×180 Apple Touch Icon',
    width: 180,
    height: 180,
    filename: 'apple-touch-icon.png',
    purpose: 'iOS home screen icon',
  },
  {
    id: 'android-192',
    label: '192×192 Android/PWA Icon',
    width: 192,
    height: 192,
    filename: 'android-chrome-192x192.png',
    purpose: 'Android home screen / PWA icon',
  },
  {
    id: 'android-512',
    label: '512×512 Android/PWA Icon',
    width: 512,
    height: 512,
    filename: 'android-chrome-512x512.png',
    purpose: 'Android splash screen / PWA icon',
  },
  {
    id: 'maskable-512',
    label: '512×512 Maskable Icon',
    width: 512,
    height: 512,
    filename: 'maskable-icon-512x512.png',
    purpose: 'PWA maskable icon with safe area padding',
    maskable: true,
    safePadding: 64,
  },
];

export function generateWebManifest(): string {
  return JSON.stringify(
    {
      name: '',
      short_name: '',
      icons: [
        {
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
    },
    null,
    2,
  );
}

export function generateHtmlSnippet(): string {
  return [
    '<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">',
    '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
    '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
    '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
  ].join('\n');
}
