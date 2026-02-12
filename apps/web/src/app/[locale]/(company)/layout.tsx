'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/auth-context';
import {
  Bus,
  Building2,
  Route,
  Truck,
  CalendarClock,
  Users,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  User,
  ChevronLeft,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, loading, logout, getMyCompanies } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useTranslations('company');
  const tCommon = useTranslations('common');

  // Extract companyId from pathname if present
  const companyIdMatch = pathname.match(/\/company\/([^/]+)/);
  const currentCompanyId = companyIdMatch ? companyIdMatch[1] : null;

  // Find current company from user's memberships
  const myCompanies = getMyCompanies();
  const currentCompany = currentCompanyId
    ? myCompanies.find((c) => c.companyId === currentCompanyId)?.company
    : null;

  const companyNav = currentCompanyId
    ? [
        {
          name: t('nav.dashboard'),
          href: `/company/${currentCompanyId}`,
          icon: LayoutDashboard,
        },
        {
          name: t('nav.timetable'),
          href: `/company/${currentCompanyId}/timetable`,
          icon: CalendarClock,
        },
        {
          name: t('nav.routes'),
          href: `/company/${currentCompanyId}/routes`,
          icon: Route,
        },
        {
          name: t('nav.vehicles'),
          href: `/company/${currentCompanyId}/vehicles`,
          icon: Truck,
        },
        {
          name: t('nav.stops'),
          href: `/company/${currentCompanyId}/stops`,
          icon: MapPin,
        },
        {
          name: t('nav.members'),
          href: `/company/${currentCompanyId}/members`,
          icon: Users,
        },
        {
          name: t('nav.calendars'),
          href: `/company/${currentCompanyId}/calendars`,
          icon: CalendarDays,
        },
      ]
    : [];

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    // Check if user has company role
    if (!loading && user && myCompanies.length === 0) {
      router.push('/passenger');
    }
  }, [user, loading, router, myCompanies.length]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || myCompanies.length === 0) {
    return null;
  }

  // Get user's role in current company
  const currentMembership = currentCompanyId
    ? user.companyMemberships?.find((m) => m.companyId === currentCompanyId)
    : null;

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-card shadow-lg transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Link href="/company" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-primary">Busap</span>
                <span className="ml-1 text-xs text-muted-foreground">
                  {t('layout.companyPanel')}
                </span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Company info & role badge */}
          <div className="border-b px-4 py-3">
            {currentCompany ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Link
                    href="/company"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                  <span className="font-medium truncate">{currentCompany.name}</span>
                </div>
                {currentMembership && (
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      currentMembership.role === 'owner'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    )}
                  >
                    {t(`roles.${currentMembership.role}`)}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">
                {t('layout.selectCompany')}
              </p>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {currentCompanyId &&
              companyNav.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== `/company/${currentCompanyId}` &&
                    pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
          </nav>

          {/* Bottom links */}
          <div className="border-t p-4">
            <Link
              href="/passenger"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Bus className="h-5 w-5" />
              {tCommon('navigation.userPanel')}
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <User className="h-5 w-5" />
              {tCommon('navigation.profile')}
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              {tCommon('navigation.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Link href="/profile" className="flex items-center gap-2 hover:opacity-80">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden text-sm font-medium sm:block">
                {user.firstName} {user.lastName}
              </span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
