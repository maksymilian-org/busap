'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';

interface Departure {
  date: string;
  departureTime: string;
  arrivalTime: string;
  departureAt: string;
  route: { id: string; name: string; code?: string };
  stops: Array<{ id: string; name: string; city?: string; sequenceNumber: number }>;
  stopTimes: Array<{ stopName: string; arrivalTime: string; departureTime: string }>;
  scheduleName: string;
}

interface DeparturesCountdownProps {
  departures: Departure[];
  maxItems?: number;
}

const DAY_NAMES_PL = ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'];
const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DeparturesCountdown({ departures, maxItems = 8 }: DeparturesCountdownProps) {
  const t = useTranslations('public.company');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (departureAt: string) => {
    const diff = new Date(departureAt).getTime() - now.getTime();
    const totalMinutes = Math.max(0, Math.floor(diff / 60000));

    if (totalMinutes < 1) {
      return { label: t('departureNow'), highlight: true };
    }
    if (totalMinutes < 60) {
      return { label: t('departureIn', { minutes: totalMinutes }), highlight: totalMinutes <= 5 };
    }
    if (totalMinutes < 720) {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return { label: t('departureInHours', { hours, minutes: mins }), highlight: false };
    }

    // More than 12 hours — show day + time
    const depDate = new Date(departureAt);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const time = `${String(depDate.getHours()).padStart(2, '0')}:${String(depDate.getMinutes()).padStart(2, '0')}`;

    if (depDate.toDateString() === tomorrow.toDateString()) {
      return { label: t('departureTomorrow', { time }), highlight: false };
    }

    // Detect locale from translation key presence
    const isPl = t('departureNow') === 'teraz';
    const dayNames = isPl ? DAY_NAMES_PL : DAY_NAMES_EN;
    const day = dayNames[depDate.getDay()];
    return { label: t('departureAt', { day, time }), highlight: false };
  };

  const visibleDepartures = departures.slice(0, maxItems);

  return (
    <div className="space-y-2">
      {visibleDepartures.map((dep, idx) => {
        const { label, highlight } = formatCountdown(dep.departureAt);
        const firstStop = dep.stops[0];
        const lastStop = dep.stops[dep.stops.length - 1];

        return (
          <div
            key={`${dep.date}-${dep.departureTime}-${dep.route.id}-${idx}`}
            className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
          >
            {/* Countdown */}
            <div className={`flex min-w-[80px] flex-col items-center justify-center rounded-lg px-2 py-1.5 ${highlight ? 'bg-primary/20' : 'bg-primary/10'}`}>
              <span className={`text-sm font-bold ${highlight ? 'text-primary' : 'text-primary/80'}`}>
                {label}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{dep.route.name}</span>
                {dep.route.code && (
                  <span className="text-xs rounded bg-muted px-1.5 py-0.5">
                    {dep.route.code}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {firstStop?.name} → {lastStop?.name}
                </span>
              </div>
            </div>

            {/* Time */}
            <div className="text-right text-sm">
              <div className="font-medium">{dep.departureTime}</div>
              <div className="text-xs text-muted-foreground">→ {dep.arrivalTime}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
