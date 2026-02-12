import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/navigation';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - api routes
  // - _next (Next.js internals)
  // - _vercel (Vercel internals)
  // - Static files with extensions (e.g., .js, .css, .png)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
