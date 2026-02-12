import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/navigation';
import { Providers } from '@/components/providers';
import '../globals.css';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    pl: 'Busap - Platforma Transportu Autobusowego',
    en: 'Busap - Bus Transport Platform',
  };

  const descriptions: Record<string, string> = {
    pl: 'Nowoczesna platforma do zarządzania transportem autobusowym. Śledź autobusy w czasie rzeczywistym, sprawdzaj rozkłady i planuj podróże.',
    en: 'Modern platform for bus transport management. Track buses in real-time, check schedules and plan your trips.',
  };

  return {
    title: titles[locale] || titles.pl,
    description: descriptions[locale] || descriptions.pl,
    keywords: locale === 'pl'
      ? ['autobus', 'transport', 'rozkład jazdy', 'GPS', 'śledzenie', 'bilety']
      : ['bus', 'transport', 'schedule', 'GPS', 'tracking', 'tickets'],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as 'pl' | 'en')) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
