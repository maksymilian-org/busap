'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Route as RouteIcon, Plus, X, Edit, Trash2, Calendar, Copy, ChevronDown, ChevronRight, Eye, Clock, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RouteData {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  comment?: string | null;
  type: string;
  isActive: boolean;
  currentVersion?: {
    id: string;
    stops: Array<{
      id: string;
      sequenceNumber: number;
      isMain?: boolean;
      stop: { id: string; name: string };
    }>;
  };
  _count?: {
    trips: number;
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

export default function CompanyRoutesPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const { isManagerOf } = useAuth();
  const t = useTranslations('company');
  const tCommon = useTranslations('common');

  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [routeSchedules, setRouteSchedules] = useState<Record<string, ScheduleData[]>>({});
  const [showScheduleModal, setShowScheduleModal] = useState<string | null>(null); // routeId
  const [editingSchedule, setEditingSchedule] = useState<{ routeId: string; schedule: ScheduleData } | null>(null);

  const fetchRoutes = useCallback(async () => {
    try {
      const response = await api.get(`/routes?companyId=${companyId}`);
      setRoutes(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to fetch routes:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const handleDelete = async (routeId: string) => {
    if (!confirm(t('routes.confirmDelete'))) return;
    try {
      await api.delete(`/routes/${routeId}`);
      toast({ variant: 'success', title: t('routes.deleted') });
      fetchRoutes();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  const fetchSchedules = useCallback(async (routeId: string) => {
    try {
      const data = await api.get(`/schedules?companyId=${companyId}&routeId=${routeId}`);
      setRouteSchedules((prev) => ({ ...prev, [routeId]: Array.isArray(data) ? data : [] }));
    } catch {}
  }, [companyId]);

  const toggleRouteSchedules = async (routeId: string) => {
    if (expandedRoute === routeId) {
      setExpandedRoute(null);
      return;
    }
    setExpandedRoute(routeId);
    if (!routeSchedules[routeId]) {
      fetchSchedules(routeId);
    }
  };

  const handleDuplicate = async (scheduleId: string, routeId: string) => {
    try {
      await api.post(`/schedules/${scheduleId}/duplicate`);
      toast({ variant: 'success', title: t('routes.schedules.duplicated') });
      fetchSchedules(routeId);
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  const handleDeleteSchedule = async (scheduleId: string, routeId: string) => {
    try {
      await api.delete(`/schedules/${scheduleId}`);
      fetchSchedules(routeId);
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  const handleDuplicateRoute = async (routeId: string) => {
    try {
      await api.post(`/routes/${routeId}/duplicate`);
      toast({ variant: 'success', title: t('routes.duplicated') });
      fetchRoutes();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  const handleReverseRoute = async (routeId: string) => {
    try {
      await api.post(`/routes/${routeId}/reverse`);
      toast({ variant: 'success', title: t('routes.reversed') });
      fetchRoutes();
    } catch (err: any) {
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    }
  };

  useEffect(() => {
    if (!isManagerOf(companyId)) {
      router.push('/company');
      return;
    }
    fetchRoutes();
  }, [companyId, isManagerOf, router, fetchRoutes]);

  if (!isManagerOf(companyId)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('routes.title')}</h1>
          <p className="text-muted-foreground">{t('routes.description')}</p>
        </div>
        <Button onClick={() => router.push(`/company/${companyId}/routes/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('routes.addRoute')}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : routes.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <RouteIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{t('routes.noRoutes')}</p>
          <Button className="mt-4" onClick={() => router.push(`/company/${companyId}/routes/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('routes.addRoute')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((route) => (
            <div key={route.id} className="rounded-lg border bg-card">
              <div className="p-4 transition-colors hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <RouteIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{route.name}</p>
                        {route.code && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            {route.code}
                          </span>
                        )}
                      </div>
                      {route.description && (
                        <p className="text-sm text-muted-foreground">{route.description}</p>
                      )}
                      {route.comment && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">{route.comment}</p>
                      )}
                      {route.currentVersion?.stops && (() => {
                        const mainStops = route.currentVersion.stops
                          .filter((s) => s.isMain)
                          .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
                          .map((s) => s.stop.name);
                        return mainStops.length > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            {t('routes.via')}: {mainStops.join(', ')}
                          </p>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        route.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      )}
                    >
                      {route.isActive ? tCommon('status.active') : tCommon('status.inactive')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRouteSchedules(route.id)}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      {t('routes.tabs.schedules')}
                      {expandedRoute === route.id ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/company/${companyId}/routes/${route.id}/edit`)}
                        title={tCommon('actions.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicateRoute(route.id)}
                        title={t('routes.duplicate')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReverseRoute(route.id)}
                        title={t('routes.reverse')}
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(route.id)}
                        title={tCommon('actions.delete')}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedules section */}
              {expandedRoute === route.id && (
                <div className="border-t px-4 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">{t('routes.schedules.title')}</h3>
                    <Button size="sm" onClick={() => setShowScheduleModal(route.id)}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      {t('routes.schedules.addSchedule')}
                    </Button>
                  </div>
                  {!routeSchedules[route.id] ? (
                    <div className="flex justify-center py-4">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : routeSchedules[route.id].length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{t('routes.schedules.noSchedules')}</p>
                  ) : (
                    <div className="space-y-2">
                      {routeSchedules[route.id].map((schedule) => (
                        <div key={schedule.id} className="rounded border p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{schedule.name}</span>
                              <span className="ml-2 text-muted-foreground">
                                {schedule.departureTime} &rarr; {schedule.arrivalTime}
                              </span>
                              <span className={cn(
                                'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                schedule.isActive
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                              )}>
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
                                onClick={() => setEditingSchedule({ routeId: route.id, schedule })}
                                title={tCommon('actions.edit')}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDuplicate(schedule.id, route.id)}
                                title={t('routes.schedules.duplicate')}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSchedule(schedule.id, route.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          {/* Show stop times if they exist */}
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(showScheduleModal || editingSchedule) && (
        <ScheduleFormModal
          companyId={companyId}
          routeId={showScheduleModal || editingSchedule!.routeId}
          route={routes.find((r) => r.id === (showScheduleModal || editingSchedule!.routeId))}
          schedule={editingSchedule?.schedule}
          t={t}
          tCommon={tCommon}
          onClose={() => {
            setShowScheduleModal(null);
            setEditingSchedule(null);
          }}
          onSaved={() => {
            const rid = showScheduleModal || editingSchedule!.routeId;
            setShowScheduleModal(null);
            setEditingSchedule(null);
            fetchSchedules(rid);
          }}
        />
      )}
    </div>
  );
}

// --- Schedule Form Modal ---

interface CalendarOption {
  id: string;
  code: string;
  name: string;
  companyId: string | null;
}

interface RouteStopOption {
  id: string;
  sequenceNumber: number;
  stop: { id: string; name: string };
}

interface StopTimeEntry {
  routeStopId: string;
  stopName: string;
  sequenceNumber: number;
  arrivalTime: string;
  departureTime: string;
}

interface CalendarModifierEntry {
  type: 'exclude' | 'include_only';
  calendarId: string;
}

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const RRULE_DAYS: Record<string, string> = {
  mon: 'MO', tue: 'TU', wed: 'WE', thu: 'TH', fri: 'FR', sat: 'SA', sun: 'SU',
};

function ScheduleFormModal({
  companyId,
  routeId,
  route,
  schedule,
  t,
  tCommon,
  onClose,
  onSaved,
}: {
  companyId: string;
  routeId: string;
  route?: RouteData;
  schedule?: ScheduleData;
  t: any;
  tCommon: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!schedule;

  const [vehicles, setVehicles] = useState<Array<{ id: string; registrationNumber: string }>>([]);
  const [drivers, setDrivers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [routeStops, setRouteStops] = useState<RouteStopOption[]>([]);

  // Form state
  const [name, setName] = useState(schedule?.name || '');
  const [description, setDescription] = useState(schedule?.description || '');
  const [vehicleId, setVehicleId] = useState(schedule?.vehicleId || '');
  const [driverId, setDriverId] = useState(schedule?.driverId || '');
  const [departureTime, setDepartureTime] = useState(schedule?.departureTime || '');
  const [arrivalTime, setArrivalTime] = useState(schedule?.arrivalTime || '');
  const [scheduleType, setScheduleType] = useState<'single' | 'recurring'>(
    (schedule?.scheduleType as 'single' | 'recurring') || 'recurring'
  );
  const [validFrom, setValidFrom] = useState(
    schedule?.validFrom ? new Date(schedule.validFrom).toISOString().split('T')[0] : ''
  );
  const [validTo, setValidTo] = useState(
    schedule?.validTo ? new Date(schedule.validTo).toISOString().split('T')[0] : ''
  );
  const [isActive, setIsActive] = useState(schedule?.isActive ?? true);

  // RRULE builder
  const parseExistingRRule = (rrule: string | null | undefined) => {
    if (!rrule) return { frequency: 'WEEKLY' as const, days: ['MO', 'TU', 'WE', 'TH', 'FR'] };
    const freq = rrule.match(/FREQ=(\w+)/)?.[1] || 'WEEKLY';
    const byDay = rrule.match(/BYDAY=([A-Z,]+)/)?.[1]?.split(',') || [];
    return { frequency: freq as 'DAILY' | 'WEEKLY' | 'MONTHLY', days: byDay };
  };

  const existingRRule = parseExistingRRule(schedule?.rrule);
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>(existingRRule.frequency);
  const [selectedDays, setSelectedDays] = useState<string[]>(existingRRule.days);

  // Calendar modifiers
  const parseExistingModifiers = (mods: any[]): CalendarModifierEntry[] => {
    if (!mods || !Array.isArray(mods)) return [];
    return mods
      .filter((m: any) => m.type === 'exclude' || m.type === 'include_only')
      .map((m: any) => ({ type: m.type, calendarId: m.calendarId }));
  };
  const [calendarModifiers, setCalendarModifiers] = useState<CalendarModifierEntry[]>(
    parseExistingModifiers(schedule?.calendarModifiers || [])
  );

  // Stop times
  const [stopTimes, setStopTimes] = useState<StopTimeEntry[]>([]);

  // Preview
  const [previewDates, setPreviewDates] = useState<string[]>([]);
  const [previewDays, setPreviewDays] = useState(14);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load options
  useEffect(() => {
    const load = async () => {
      const [vehiclesResult, membersResult, calendarsResult] = await Promise.allSettled([
        api.get<any>(`/vehicles?companyId=${companyId}`),
        api.get<any>(`/companies/${companyId}/members`),
        api.get<any>(`/companies/${companyId}/calendars`),
      ]);

      if (vehiclesResult.status === 'fulfilled') {
        const vehiclesData = vehiclesResult.value;
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : vehiclesData?.data || []);
      }

      if (membersResult.status === 'fulfilled') {
        const membersData = membersResult.value;
        const members = Array.isArray(membersData) ? membersData : membersData?.data || [];
        setDrivers(
          members
            .filter((m: any) => m.role === 'driver')
            .map((m: any) => ({
              id: m.userId || m.user?.id,
              firstName: m.user?.firstName || '',
              lastName: m.user?.lastName || '',
            }))
        );
      }

      if (calendarsResult.status === 'fulfilled') {
        setCalendars(Array.isArray(calendarsResult.value) ? calendarsResult.value : []);
      }
    };
    load();
  }, [companyId]);

  // Load route stops
  useEffect(() => {
    const loadStops = async () => {
      try {
        const routeData = await api.get<any>(`/routes/${routeId}`);
        const stops: RouteStopOption[] = routeData?.currentVersion?.stops || [];
        stops.sort((a: any, b: any) => a.sequenceNumber - b.sequenceNumber);
        setRouteStops(stops);

        // Initialize stop times from existing schedule or blank
        if (schedule?.stopTimes && schedule.stopTimes.length > 0) {
          const entries: StopTimeEntry[] = stops.map((rs) => {
            const existing = schedule.stopTimes.find((st) => st.routeStopId === rs.id);
            return {
              routeStopId: rs.id,
              stopName: rs.stop.name,
              sequenceNumber: rs.sequenceNumber,
              arrivalTime: existing?.arrivalTime || '',
              departureTime: existing?.departureTime || '',
            };
          });
          setStopTimes(entries);
        } else {
          setStopTimes(
            stops.map((rs) => ({
              routeStopId: rs.id,
              stopName: rs.stop.name,
              sequenceNumber: rs.sequenceNumber,
              arrivalTime: '',
              departureTime: '',
            }))
          );
        }
      } catch {}
    };
    loadStops();
  }, [routeId, schedule]);

  const toggleDay = (rruleDay: string) => {
    setSelectedDays((prev) =>
      prev.includes(rruleDay) ? prev.filter((d) => d !== rruleDay) : [...prev, rruleDay]
    );
  };

  const buildRRule = () => {
    if (frequency === 'DAILY') return 'FREQ=DAILY';
    if (frequency === 'WEEKLY' && selectedDays.length > 0) {
      return `FREQ=WEEKLY;BYDAY=${selectedDays.join(',')}`;
    }
    if (frequency === 'MONTHLY') return 'FREQ=MONTHLY';
    return `FREQ=${frequency}`;
  };

  const addCalendarModifier = () => {
    setCalendarModifiers((prev) => [...prev, { type: 'exclude', calendarId: '' }]);
  };

  const removeCalendarModifier = (idx: number) => {
    setCalendarModifiers((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCalendarModifier = (idx: number, field: keyof CalendarModifierEntry, value: string) => {
    setCalendarModifiers((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  const updateStopTime = (routeStopId: string, field: 'arrivalTime' | 'departureTime', value: string) => {
    setStopTimes((prev) =>
      prev.map((st) => (st.routeStopId === routeStopId ? { ...st, [field]: value } : st))
    );
  };

  const loadPreview = async () => {
    if (!isEdit) return;
    setLoadingPreview(true);
    try {
      const data = await api.get<any>(`/schedules/${schedule!.id}/preview?days=${previewDays}`);
      setPreviewDates(Array.isArray(data) ? data.map((d: any) => (typeof d === 'string' ? d : d.date)) : []);
    } catch {
      setPreviewDates([]);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Build stop times payload — only include entries with at least one time set
      const stopTimesPayload = stopTimes
        .filter((st) => st.arrivalTime || st.departureTime)
        .map((st) => ({
          routeStopId: st.routeStopId,
          arrivalTime: st.arrivalTime || undefined,
          departureTime: st.departureTime || undefined,
        }));

      // Build calendar modifiers payload
      const modifiersPayload = calendarModifiers
        .filter((m) => m.calendarId)
        .map((m) => ({ type: m.type, calendarId: m.calendarId }));

      // Derive departure/arrival from first/last stop times
      const firstStop = stopTimes[0];
      const lastStop = stopTimes[stopTimes.length - 1];
      const derivedDeparture = firstStop?.departureTime || firstStop?.arrivalTime || departureTime || '00:00';
      const derivedArrival = lastStop?.arrivalTime || lastStop?.departureTime || arrivalTime || '00:00';

      const payload: any = {
        name,
        description: description || undefined,
        vehicleId: vehicleId || undefined,
        driverId: driverId || undefined,
        departureTime: derivedDeparture,
        arrivalTime: derivedArrival,
        rrule: scheduleType === 'recurring' ? buildRRule() : undefined,
        validFrom: new Date(validFrom).toISOString(),
        validTo: validTo ? new Date(validTo).toISOString() : undefined,
        calendarModifiers: modifiersPayload,
        stopTimes: stopTimesPayload.length > 0 ? stopTimesPayload : undefined,
        isActive,
      };

      if (isEdit) {
        await api.put(`/schedules/${schedule!.id}`, payload);
        toast({ variant: 'success', title: t('schedules.editModal.success') });
      } else {
        payload.routeId = routeId;
        payload.companyId = companyId;
        payload.scheduleType = scheduleType;
        await api.post('/schedules', payload);
        toast({ variant: 'success', title: t('schedules.createModal.success') });
      }
      onSaved();
    } catch (err: any) {
      setError(err.message);
      toast({ variant: 'destructive', title: tCommon('status.error'), description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isEdit ? t('schedules.editModal.title') : t('schedules.createModal.title')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium">{t('schedules.createModal.name')}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium">{t('schedules.createModal.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Route (read-only) */}
          <div>
            <label className="text-sm font-medium">{t('schedules.createModal.route')}</label>
            <input
              type="text"
              readOnly
              value={route?.name || routeId}
              className="mt-1 w-full rounded-lg border bg-muted px-3 py-2 text-sm cursor-not-allowed"
            />
          </div>

          {/* Vehicle / Driver */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t('schedules.createModal.vehicle')}</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t('schedules.createModal.selectVehicle')}</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.registrationNumber}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t('schedules.createModal.driver')}</label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t('schedules.createModal.selectDriver')}</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule type */}
          <div>
            <label className="text-sm font-medium">{t('schedules.createModal.scheduleType')}</label>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as 'single' | 'recurring')}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="single">{t('schedules.createModal.typeSingle')}</option>
              <option value="recurring">{t('schedules.createModal.typeRecurring')}</option>
            </select>
          </div>

          {/* RRULE builder — only for recurring */}
          {scheduleType === 'recurring' && (
            <div className="rounded-lg border p-3 space-y-3">
              <label className="text-sm font-medium">{t('schedules.createModal.rrule')}</label>
              <div>
                <label className="text-xs text-muted-foreground">{t('schedules.createModal.frequency')}</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY')}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="DAILY">{t('schedules.createModal.freqDaily')}</option>
                  <option value="WEEKLY">{t('schedules.createModal.freqWeekly')}</option>
                  <option value="MONTHLY">{t('schedules.createModal.freqMonthly')}</option>
                </select>
              </div>
              {frequency === 'WEEKLY' && (
                <div>
                  <label className="text-xs text-muted-foreground">{t('schedules.createModal.days')}</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(RRULE_DAYS[day])}
                        className={cn(
                          'rounded-md px-3 py-1.5 text-xs font-medium border transition-colors',
                          selectedDays.includes(RRULE_DAYS[day])
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-input hover:bg-muted'
                        )}
                      >
                        {t(`schedules.createModal.${day}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validity period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t('schedules.createModal.validFrom')}</label>
              <input
                type="date"
                required
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('schedules.createModal.validTo')}</label>
              <input
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Calendar modifiers */}
          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t('schedules.createModal.calendarModifiers')}</label>
              <Button type="button" variant="outline" size="sm" onClick={addCalendarModifier}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t('schedules.createModal.addModifier')}
              </Button>
            </div>
            {calendarModifiers.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('schedules.createModal.calendarModifiers')}</p>
            ) : (
              <div className="space-y-2">
                {calendarModifiers.map((mod, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={mod.type}
                      onChange={(e) => updateCalendarModifier(idx, 'type', e.target.value)}
                      className="rounded-lg border bg-background px-2 py-1.5 text-xs"
                    >
                      <option value="exclude">{t('schedules.createModal.modifierExclude')}</option>
                      <option value="include_only">{t('schedules.createModal.modifierIncludeOnly')}</option>
                    </select>
                    <select
                      value={mod.calendarId}
                      onChange={(e) => updateCalendarModifier(idx, 'calendarId', e.target.value)}
                      className="flex-1 rounded-lg border bg-background px-2 py-1.5 text-xs"
                    >
                      <option value="">{t('schedules.createModal.selectCalendar')}</option>
                      {calendars.map((cal) => (
                        <option key={cal.id} value={cal.id}>
                          {cal.name} {!cal.companyId ? '(system)' : ''}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCalendarModifier(idx)}
                      className="text-destructive hover:text-destructive h-7 w-7 p-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stop times table */}
          {routeStops.length > 0 && (
            <div className="rounded-lg border p-3 space-y-2">
              <label className="text-sm font-medium">{t('schedules.createModal.stopTimes')}</label>
              <p className="text-xs text-muted-foreground">{t('routes.schedules.stopTimesHint')}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1.5 px-2 font-medium">#</th>
                      <th className="text-left py-1.5 px-2 font-medium">{t('routes.schedules.stop')}</th>
                      <th className="text-left py-1.5 px-2 font-medium">{t('routes.schedules.arrival')}</th>
                      <th className="text-left py-1.5 px-2 font-medium">{t('routes.schedules.departure')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stopTimes.map((st, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === stopTimes.length - 1;
                      return (
                        <tr key={st.routeStopId} className="border-b last:border-0">
                          <td className="py-1.5 px-2 text-muted-foreground">{st.sequenceNumber}</td>
                          <td className="py-1.5 px-2 font-medium">
                            {st.stopName}
                            {(isFirst || isLast) && (
                              <span className="ml-1 text-destructive">*</span>
                            )}
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="time"
                              value={st.arrivalTime}
                              onChange={(e) => updateStopTime(st.routeStopId, 'arrivalTime', e.target.value)}
                              className={cn(
                                'w-24 rounded border bg-background px-2 py-1 text-xs',
                                isLast && !st.arrivalTime && 'border-destructive'
                              )}
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="time"
                              value={st.departureTime}
                              onChange={(e) => updateStopTime(st.routeStopId, 'departureTime', e.target.value)}
                              className={cn(
                                'w-24 rounded border bg-background px-2 py-1 text-xs',
                                isFirst && !st.departureTime && 'border-destructive'
                              )}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Preview — only for saved schedules */}
          {isEdit && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t('routes.schedules.preview')}</label>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">{t('routes.schedules.previewDays')}</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={previewDays}
                    onChange={(e) => setPreviewDays(Number(e.target.value))}
                    className="w-16 rounded border bg-background px-2 py-1 text-xs"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={loadPreview} disabled={loadingPreview}>
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    {t('routes.schedules.preview')}
                  </Button>
                </div>
              </div>
              {previewDates.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t('routes.schedules.previewDates')}:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {previewDates.map((d, i) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                        {new Date(d).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {previewDates.length === 0 && !loadingPreview && (
                <p className="text-xs text-muted-foreground">{t('routes.schedules.noPreview')}</p>
              )}
              {loadingPreview && (
                <div className="flex justify-center py-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>
          )}

          {/* Active toggle */}
          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="schedule-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border"
              />
              <label htmlFor="schedule-active" className="text-sm">
                {t('schedules.active')}
              </label>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon('actions.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? (isEdit ? t('schedules.editModal.submitting') : t('schedules.createModal.submitting'))
                : (isEdit ? t('schedules.editModal.submit') : t('schedules.createModal.submit'))
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
