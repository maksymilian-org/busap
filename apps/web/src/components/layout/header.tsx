'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Bus, Menu, X, Moon, Sun, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, loading } = useAuth();
  const t = useTranslations('common');

  const navigation = [
    { name: t('navigation.features'), href: '#features' },
    { name: t('navigation.pricing'), href: '#pricing' },
    { name: t('navigation.business'), href: '#business' },
    { name: t('navigation.contact'), href: '#contact' },
  ];

  // Determine dashboard link based on user role
  const getDashboardLink = () => {
    if (!user) return '/passenger';
    if (user.systemRole === 'admin' || user.systemRole === 'superadmin') {
      return '/admin';
    }
    // Check company roles (owner/manager)
    const ownerManagerCompanies = user.companyMemberships?.filter(
      (m) => m.role === 'owner' || m.role === 'manager'
    );
    if (ownerManagerCompanies && ownerManagerCompanies.length > 0) {
      return '/company';
    }
    return '/passenger';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Bus className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-primary">Busap</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex md:items-center md:gap-8">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </a>
          ))}
        </div>

        <div className="hidden md:flex md:items-center md:gap-2">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={t('theme.toggle')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <Button asChild>
              <Link href={getDashboardLink()} className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('navigation.myAccount')}
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">{t('navigation.login')}</Link>
              </Button>
              <Button asChild>
                <Link href="/register">{t('navigation.register')}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={t('theme.toggle')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          'md:hidden',
          mobileMenuOpen ? 'block' : 'hidden'
        )}
      >
        <div className="space-y-1 px-4 pb-4 pt-2">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </a>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            {loading ? (
              <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
            ) : user ? (
              <Button asChild className="w-full">
                <Link href={getDashboardLink()} onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2">
                  <User className="h-4 w-4" />
                  {t('navigation.myAccount')}
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    {t('navigation.login')}
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    {t('navigation.register')}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
