import { getRequestConfig } from 'next-intl/server';
import { routing } from './navigation';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Ensure that the incoming locale is valid
  if (!locale || !routing.locales.includes(locale as 'pl' | 'en')) {
    locale = routing.defaultLocale;
  }

  // Load all message namespaces
  const common = (await import(`../../messages/${locale}/common.json`)).default;
  const auth = (await import(`../../messages/${locale}/auth.json`)).default;
  const dashboard = (await import(`../../messages/${locale}/dashboard.json`)).default;
  const admin = (await import(`../../messages/${locale}/admin.json`)).default;
  const home = (await import(`../../messages/${locale}/home.json`)).default;
  const errors = (await import(`../../messages/${locale}/errors.json`)).default;
  const company = (await import(`../../messages/${locale}/company.json`)).default;
  const settings = (await import(`../../messages/${locale}/settings.json`)).default;

  return {
    locale,
    messages: {
      common,
      auth,
      dashboard,
      admin,
      home,
      errors,
      company,
      settings,
    },
  };
});
