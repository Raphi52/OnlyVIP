import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Don't redirect the default locale (keep /en/ in URL for consistency)
  localePrefix: 'always',

  // Detect locale from Accept-Language header
  localeDetection: true,
});

export const config = {
  // Match all pathnames except for:
  // - API routes (/api/...)
  // - Static files (/_next/static/..., /_next/image/..., /favicon.ico, etc.)
  // - Public files with extensions (.svg, .png, .jpg, etc.)
  matcher: [
    // Match all pathnames except those starting with:
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
