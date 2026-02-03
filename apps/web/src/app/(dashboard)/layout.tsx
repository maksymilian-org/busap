'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/auth-context';
import {
  Bus,
  Search,
  Map,
  Clock,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const passengerNav = [
  { name: 'Szukaj', href: '/passenger', icon: Search },
  { name: 'Mapa', href: '/passenger/map', icon: Map },
  { name: 'Historia', href: '/passenger/history', icon: Clock },
];

const driverNav = [
  { name: 'Moje kursy', href: '/driver', icon: LayoutDashboard },
  { name: 'W trasie', href: '/driver/active', icon: Route },
  { name: 'Historia', href: '/driver/history', icon: Clock },
];

const managerNav = [
  { name: 'Dashboard', href: '/manager', icon: LayoutDashboard },
  { name: 'Przystanki', href: '/manager/stops', icon: Map },
  { name: 'Trasy', href: '/manager/routes', icon: Route },
  { name: 'Kursy', href: '/manager/trips', icon: Clock },
  { name: 'Pojazdy', href: '/manager/vehicles', icon: Truck },
  { name: 'Użytkownicy', href: '/manager/users', icon: Users },
  { name: 'Raporty', href: '/manager/reports', icon: BarChart3 },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    if (pathname.startsWith('/driver')) return 'Panel kierowcy';
    if (pathname.startsWith('/manager')) return 'Panel managera';
    return 'Panel pasażera';
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
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <User className="h-5 w-5" />
              Profil
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
              Ustawienia
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              Wyloguj
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

          <div className="flex items-center gap-4">
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
                {user.name || user.email}
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
