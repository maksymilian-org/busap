import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Bus } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('auth.layout');

  return (
    <div className="flex min-h-screen">
      {/* Left side - branding */}
      <div className="hidden w-1/2 bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
            <Bus className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Busap</span>
        </Link>
        <div>
          <blockquote className="space-y-2">
            <p className="text-lg text-white/90">
              &ldquo;{t('testimonial')}&rdquo;
            </p>
            <footer className="text-sm text-white/70">
              {t('testimonialAuthor')}
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
