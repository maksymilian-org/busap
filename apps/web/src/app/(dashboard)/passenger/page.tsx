'use client';

import { useState } from 'react';
import {
  Search,
  MapPin,
  ArrowRight,
  Calendar,
  Clock,
  Bus,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Sample data
const recentSearches = [
  { from: 'Warszawa Centralna', to: 'Kraków Dworzec', date: '2024-01-15' },
  { from: 'Gdańsk Główny', to: 'Warszawa Centralna', date: '2024-01-12' },
];

const upcomingTrips = [
  {
    id: '1',
    route: 'Warszawa - Kraków',
    company: 'PKS Polonus',
    departure: '14:30',
    arrival: '17:45',
    date: 'Dzisiaj',
    status: 'scheduled',
  },
];

export default function PassengerPage() {
  const [fromStop, setFromStop] = useState('');
  const [toStop, setToStop] = useState('');
  const [date, setDate] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search
    console.log('Searching:', { fromStop, toStop, date });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Szukaj połączenia</h1>
        <p className="text-muted-foreground">
          Znajdź autobus i sprawdź rozkład jazdy
        </p>
      </div>

      {/* Search form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Skąd</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Przystanek początkowy"
                    className="w-full rounded-lg border bg-background py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={fromStop}
                    onChange={(e) => setFromStop(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Dokąd</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                  <input
                    type="text"
                    placeholder="Przystanek końcowy"
                    className="w-full rounded-lg border bg-background py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={toStop}
                    onChange={(e) => setToStop(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    className="w-full rounded-lg border bg-background py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button type="submit" className="w-full" size="lg">
                  <Search className="mr-2 h-5 w-5" />
                  Szukaj
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent searches */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ostatnie wyszukiwania</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSearches.length > 0 ? (
              <div className="space-y-3">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted"
                    onClick={() => {
                      setFromStop(search.from);
                      setToStop(search.to);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Bus className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {search.from}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          {search.to}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {search.date}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Brak ostatnich wyszukiwań
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming trips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nadchodzące podróże</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTrips.length > 0 ? (
              <div className="space-y-3">
                {upcomingTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="rounded-lg border p-4 hover:bg-muted"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{trip.route}</p>
                        <p className="text-sm text-muted-foreground">
                          {trip.company}
                        </p>
                      </div>
                      <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {trip.date}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {trip.departure} - {trip.arrival}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Brak zaplanowanych podróży
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
