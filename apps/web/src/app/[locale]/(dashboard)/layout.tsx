'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/auth-context';
import {
  Bus,
  Search,
  Map,
  Clock,
  Heart,
  Newspaper,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  LayoutDashboard,
  Route,
  Truck,
  Users,
  BarChart3,
  Shield,
  Building2,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, loading, logout, isAnyDriver } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tCompany = useTranslations('company');

  const passengerNav = [
    { name: t('passengerNav.dashboard'), href: '/passenger', icon: LayoutDashboard },
    { name: t('passengerNav.search'), href: '/passenger/search', icon: Search },
    { name: t('passengerNav.map'), href: '/passenger/map', icon: Map },
    { name: t('passengerNav.favorites'), href: '/passenger/favorites', icon: Heart },
    { name: t('passengerNav.news'), href: '/passenger/news', icon: Newspaper },
  ];

  const driverNav = [
    { name: t('driverNav.myCourses'), href: '/driver', icon: LayoutDashboard },
    { name: t('driverNav.schedule'), href: '/driver/schedule', icon: CalendarDays },
  ];

  const managerNav = [
    { name: t('managerNav.dashboard'), href: '/manager', icon: LayoutDashboard },
    { name: t('managerNav.stops'), href: '/manager/stops', icon: Map },
    { name: t('managerNav.routes'), href: '/manager/routes', icon: Route },
    { name: t('managerNav.trips'), href: '/manager/trips', icon: Clock },
    { name: t('managerNav.vehicles'), href: '/manager/vehicles', icon: Truck },
    { name: t('managerNav.users'), href: '/manager/users', icon: Users },
    { name: t('managerNav.reports'), href: '/manager/reports', icon: BarChart3 },
  ];

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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

  if (!user) {
    return null;
  }

  // Determine which navigation to show based on path
  const getNavigation = () => {
    if (pathname.startsWith('/driver')) return driverNav;
    if (pathname.startsWith('/manager')) return managerNav;
    return passengerNav;
  };

  const navigation = getNavigation();

  const getRoleTitle = () => {
    if (pathname.startsWith('/driver')) return t('layout.driverPanel');
    if (pathname.startsWith('/manager')) return t('layout.managerPanel');
    return t('layout.passengerPanel');
  };

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
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Bus className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-primary">Busap</span>
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

          {/* Role indicator */}
          <div className="border-b px-4 py-3">
            <p className="text-sm font-medium text-muted-foreground">
              {getRoleTitle()}
            </p>
            {/* Company role badges */}
            {user.companyMemberships && user.companyMemberships.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {user.companyMemberships.map((m) => (
                  <span
                    key={m.companyId}
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.role === 'owner'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : m.role === 'manager'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    }`}
                  >
                    {tCompany(`roles.${m.role}`)}: {m.company.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
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
            {(user.systemRole === 'admin' || user.systemRole === 'superadmin') && (
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Shield className="h-5 w-5" />
                {tCommon('navigation.adminPanel')}
              </Link>
            )}
            {isAnyDriver() && !pathname.startsWith('/driver') && (
              <Link
                href="/driver"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Truck className="h-5 w-5" />
                {t('layout.driverPanel')}
              </Link>
            )}
            {pathname.startsWith('/driver') && (
              <Link
                href="/passenger"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Bus className="h-5 w-5" />
                {t('layout.passengerPanel')}
              </Link>
            )}
            {user.companyMemberships?.some((m) => m.role === 'owner' || m.role === 'manager') && (
              <Link
                href="/company"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Building2 className="h-5 w-5" />
                {tCompany('layout.companyPanel')}
              </Link>
            )}
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <User className="h-5 w-5" />
              {tCommon('navigation.profile')}
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
              {tCommon('navigation.settings')}
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
                {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
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
