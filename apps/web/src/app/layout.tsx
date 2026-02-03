import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
  title: 'Busap - Platforma Transportu Autobusowego',
  description:
    'Nowoczesna platforma do zarządzania transportem autobusowym. Śledź autobusy w czasie rzeczywistym, sprawdzaj rozkłady i planuj podróże.',
  keywords: [
    'autobus',
    'transport',
    'rozkład jazdy',
    'GPS',
    'śledzenie',
    'bilety',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
