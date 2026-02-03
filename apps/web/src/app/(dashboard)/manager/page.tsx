'use client';

import Link from 'next/link';
import {
  Bus,
  Route,
  MapPin,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Sample data
const stats = [
  {
    name: 'Aktywne pojazdy',
    value: '24',
    change: '+2',
    trend: 'up',
    icon: Bus,
  },
  {
    name: 'Trasy',
    value: '12',
    change: '+1',
    trend: 'up',
    icon: Route,
  },
  {
    name: 'Przystanki',
    value: '156',
    change: '+5',
    trend: 'up',
    icon: MapPin,
  },
  {
    name: 'Kierowcy',
    value: '32',
    change: '-1',
    trend: 'down',
    icon: Users,
  },
];

const recentActivity = [
  {
    id: '1',
    action: 'Nowy kurs dodany',
    description: 'Linia 42: Warszawa - Kraków, 15:00',
    time: '5 min temu',
    user: 'Jan Kowalski',
  },
  {
    id: '2',
    action: 'Pojazd zaktualizowany',
    description: 'WZ 12345 - zmiana statusu na aktywny',
    time: '1 godz. temu',
    user: 'Anna Nowak',
  },
  {
    id: '3',
    action: 'Nowy kierowca',
    description: 'Piotr Wiśniewski dołączył do zespołu',
    time: '2 godz. temu',
    user: 'System',
  },
];

const alerts = [
  {
    id: '1',
    type: 'warning',
    message: 'Pojazd WZ 67890 wymaga przeglądu technicznego',
    time: 'za 3 dni',
  },
  {
    id: '2',
    type: 'info',
    message: 'Kurs Linia 15 opóźniony o 12 minut',
    time: 'teraz',
  },
];

export default function ManagerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Przegląd operacji Twojej firmy transportowej
          </p>
        </div>
        <Button asChild>
          <Link href="/manager/reports">
            <BarChart3 className="mr-2 h-5 w-5" />
            Raporty
          </Link>
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.name}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Alerty</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${
                      alert.type === 'warning'
                        ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20'
                        : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                    }`}
                  >
                    <AlertTriangle
                      className={`mt-0.5 h-5 w-5 ${
                        alert.type === 'warning'
                          ? 'text-orange-600'
                          : 'text-blue-600'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Brak alertów</p>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Ostatnia aktywność</CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time} • {activity.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Szybkie akcje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Dodaj kurs', href: '/manager/trips/new', icon: Clock },
              { name: 'Nowy przystanek', href: '/manager/stops/new', icon: MapPin },
              { name: 'Nowa trasa', href: '/manager/routes/new', icon: Route },
              { name: 'Dodaj pojazd', href: '/manager/vehicles/new', icon: Bus },
            ].map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <action.icon className="h-5 w-5 text-primary" />
                  <span className="font-medium">{action.name}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
