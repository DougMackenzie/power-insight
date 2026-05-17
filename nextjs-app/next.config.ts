import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile mapbox-gl for SSR compatibility
  transpilePackages: ['mapbox-gl', 'react-map-gl'],
  // Set turbopack root to this directory (fixes monorepo module resolution)
  turbopack: {
    root: '.',
  },
  // Security headers (added 2026-05-17 per public-surface security audit
  // Workstream E item E3). HSTS preload + clickjacking + MIME-sniffing +
  // referrer scoping + permissions lockdown. Strict-but-not-broken CSP:
  // unsafe-inline allowed on style + script because Next.js + Mapbox GL +
  // Recharts all need inline runtime code; tightening to nonces is a
  // larger refactor tracked separately.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
