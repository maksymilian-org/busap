'use client';

import { useTranslations } from 'next-intl';
import { Bus, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('common.footer');

  const footerLinks = {
    product: [
      { name: t('features'), href: '#features' },
      { name: t('pricing'), href: '#pricing' },
      { name: t('business'), href: '#business' },
      { name: t('mobileApp'), href: '#mobile' },
    ],
    company: [
      { name: t('about'), href: '/about' },
      { name: t('blog'), href: '/blog' },
      { name: t('careers'), href: '/careers' },
      { name: t('contact'), href: '/contact' },
    ],
    legal: [
      { name: t('privacy'), href: '/privacy' },
      { name: t('terms'), href: '/terms' },
      { name: t('gdpr'), href: '/gdpr' },
    ],
  };

  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Bus className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-primary">Busap</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              {t('description')}
            </p>
            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>kontakt@busap.pl</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+48 123 456 789</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Warszawa, Polska</span>
              </div>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="font-semibold">{t('product')}</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="font-semibold">{t('company')}</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="font-semibold">{t('legal')}</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>{t('copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
