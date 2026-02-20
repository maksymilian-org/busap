'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Edit, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScheduleFormModal } from '@/components/schedules/ScheduleFormModal';

interface RouteForSchedules {
  id: string;
  name: string;
  currentVersion?: {
    stops: Array<{
      id: string;
      sequenceNumber: number;
      isMain?: boolean;
      stop: { id: string; name: string };
    }>;
  };
}

interface ScheduleData {
  id: string;
  name: string;
  description: string | null;
  departureTime: string;
  arrivalTime: string;
  scheduleType: string;
  rrule: string | null;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
  vehicleId: string | null;
  driverId: string | null;
  calendarModifiers: any[];
  stopTimes: Array<{
    id: string;
    routeStopId: string;
    arrivalTime: string;
    departureTime: string;
    routeStop: { sequenceNumber: number; stop: { name: string } };
  }>;
  _count?: { exceptions: number; generatedTrips: number };
}

interface RouteSchedulesSectionProps {
  companyId: string;
  routeId: string;
  route: RouteForSchedules;
}

export function RouteSchedulesSection({ companyId, routeId, route }: RouteSchedulesSectionProps) {
  const t = useTranslations('company');
  const tCommon = useTranslations('common');

  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleData | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/schedules?companyId=${companyId}&routeId=${routeId}`);
      setSchedules(Array.isArray(data) ? data : []);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, routeId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleDuplicate = async (scheduleId: string) => {
    try {
      await api.post(`/schedules/${scheduleId}/duplicate`);
      toast({ variant: 'success', title: t('routes.schedules.duplicated') });
      fetchSchedules();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  const handleDelete = async (scheduleId: string) => {
    try {
      await api.delete(`/schedules/${scheduleId}`);
      fetchSchedules();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  return (
    <div className="border-t px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{t('routes.schedules.title')}</h3>
        <Button size="sm" onClick={() => { setEditingSchedule(null); setShowModal(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          {t('routes.schedules.addSchedule')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : schedules.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('routes.schedules.noSchedules')}
        </p>
      ) : (
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="rounded border p-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{schedule.name}</span>
                  <span className="ml-2 text-muted-foreground">
                    {schedule.departureTime} &rarr; {schedule.arrivalTime}
                  </span>
                  <span
                    className={cn(
                      'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      schedule.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    )}
                  >
                    {schedule.isActive ? t('schedules.active') : t('schedules.inactive')}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    {schedule.scheduleType === 'recurring' ? t('schedules.recurring') : t('schedules.single')}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditingSchedule(schedule); setShowModal(true); }}
                    title={tCommon('actions.edit')}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicate(schedule.id)}
                    title={t('routes.schedules.duplicate')}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(schedule.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {schedule.stopTimes && schedule.stopTimes.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium">{t('routes.schedules.stopTimes')}:</span>
                  {schedule.stopTimes.map((st) => (
                    <span key={st.id} className="ml-2">
                      {st.routeStop.stop.name} ({st.arrivalTime}-{st.departureTime})
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ScheduleFormModal
          companyId={companyId}
          routeId={routeId}
          route={route}
          schedule={editingSchedule || undefined}
          onClose={() => { setShowModal(false); setEditingSchedule(null); }}
          onSaved={() => {
            setShowModal(false);
            setEditingSchedule(null);
            fetchSchedules();
          }}
        />
      )}
    </div>
  );
}
