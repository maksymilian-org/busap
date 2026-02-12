'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { CalendarDays, Plus, ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarEntry {
  id: string;
  name: string;
  dateType: string;
  fixedDate: string | null;
  easterOffset: number | null;
  nthWeekday: any;
  startDate: string | null;
  endDate: string | null;
  isRecurring: boolean;
}

interface Calendar {
  id: string;
  code: string;
  name: string;
  description: string | null;
  country: string;
  type: string;
  companyId: string | null;
  isActive: boolean;
  entries?: CalendarEntry[];
  _count?: { entries: number };
}

interface CalendarDate {
  date: string;
  name: string;
  entryId: string;
}

export default function CalendarsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const t = useTranslations('company.calendars');
  const { toast } = useToast();

  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCalendar, setExpandedCalendar] = useState<string | null>(null);
  const [calendarDates, setCalendarDates] = useState<Record<string, CalendarDate[]>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState<string | null>(null);

  // Create calendar form
  const [createForm, setCreateForm] = useState({
    code: '',
    name: '',
    description: '',
    country: 'PL',
    type: 'custom',
  });
  const [creating, setCreating] = useState(false);

  // Create entry form
  const [entryForm, setEntryForm] = useState({
    name: '',
    dateType: 'fixed',
    fixedDate: '',
    easterOffset: 0,
    isRecurring: true,
  });
  const [creatingEntry, setCreatingEntry] = useState(false);

  useEffect(() => {
    fetchCalendars();
  }, [companyId]);

  const fetchCalendars = async () => {
    setLoading(true);
    try {
      const data = await api.get<Calendar[]>(`/companies/${companyId}/calendars`);
      setCalendars(data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleCalendar = async (calendarId: string) => {
    if (expandedCalendar === calendarId) {
      setExpandedCalendar(null);
      return;
    }
    setExpandedCalendar(calendarId);

    // Fetch dates for this year
    if (!calendarDates[calendarId]) {
      try {
        const year = new Date().getFullYear();
        const dates = await api.get<CalendarDate[]>(`/calendars/dates?calendarId=${calendarId}&year=${year}`);
        setCalendarDates((prev) => ({ ...prev, [calendarId]: dates }));
      } catch {}
    }
  };

  const handleCreateCalendar = async () => {
    setCreating(true);
    try {
      await api.post(`/companies/${companyId}/calendars`, createForm);
      toast({ title: t('createModal.success'), variant: 'success' as any });
      setShowCreateModal(false);
      setCreateForm({ code: '', name: '', description: '', country: 'PL', type: 'custom' });
      fetchCalendars();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleCreateEntry = async () => {
    if (!showEntryModal) return;
    setCreatingEntry(true);
    try {
      await api.post(`/companies/${companyId}/calendars/${showEntryModal}/entries`, entryForm);
      toast({ title: t('entryModal.success'), variant: 'success' as any });
      setShowEntryModal(null);
      setEntryForm({ name: '', dateType: 'fixed', fixedDate: '', easterOffset: 0, isRecurring: true });
      // Refresh dates
      setCalendarDates((prev) => {
        const copy = { ...prev };
        delete copy[showEntryModal!];
        return copy;
      });
      fetchCalendars();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCreatingEntry(false);
    }
  };

  const handleDeleteEntry = async (calendarId: string, entryId: string) => {
    try {
      await api.delete(`/companies/${companyId}/calendars/${calendarId}/entries/${entryId}`);
      setCalendarDates((prev) => {
        const copy = { ...prev };
        delete copy[calendarId];
        return copy;
      });
      fetchCalendars();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const systemCalendars = calendars.filter((c) => !c.companyId);
  const companyCalendars = calendars.filter((c) => c.companyId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {t('addCalendar')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* System calendars */}
          {systemCalendars.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {t('system')}
                <span className="text-xs text-muted-foreground font-normal">({t('readOnly')})</span>
              </h2>
              <div className="space-y-2">
                {systemCalendars.map((cal) => (
                  <CalendarCard
                    key={cal.id}
                    calendar={cal}
                    isExpanded={expandedCalendar === cal.id}
                    onToggle={() => toggleCalendar(cal.id)}
                    dates={calendarDates[cal.id]}
                    isSystem={true}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Company calendars */}
          <div>
            <h2 className="text-lg font-semibold mb-3">{t('company')}</h2>
            {companyCalendars.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('noCalendars')}</p>
            ) : (
              <div className="space-y-2">
                {companyCalendars.map((cal) => (
                  <CalendarCard
                    key={cal.id}
                    calendar={cal}
                    isExpanded={expandedCalendar === cal.id}
                    onToggle={() => toggleCalendar(cal.id)}
                    dates={calendarDates[cal.id]}
                    isSystem={false}
                    onAddEntry={() => setShowEntryModal(cal.id)}
                    onDeleteEntry={(entryId) => handleDeleteEntry(cal.id, entryId)}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create calendar modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{t('createModal.title')}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">{t('createModal.code')}</label>
                <input
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                  className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="my-company-holidays"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('createModal.name')}</label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('createModal.description')}</label>
                <input
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('createModal.type')}</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                  className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="holidays">{t('createModal.typeHolidays')}</option>
                  <option value="school_days">{t('createModal.typeSchoolDays')}</option>
                  <option value="custom">{t('createModal.typeCustom')}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreateCalendar} disabled={!createForm.code || !createForm.name || creating}>
                {creating ? t('createModal.submitting') : t('createModal.submit')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create entry modal */}
      {showEntryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEntryModal(null)}>
          <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{t('entryModal.title')}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">{t('entryModal.name')}</label>
                <input
                  value={entryForm.name}
                  onChange={(e) => setEntryForm({ ...entryForm, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('entryModal.dateType')}</label>
                <select
                  value={entryForm.dateType}
                  onChange={(e) => setEntryForm({ ...entryForm, dateType: e.target.value })}
                  className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="fixed">{t('entryModal.fixed')}</option>
                  <option value="easter_relative">{t('entryModal.easterRelative')}</option>
                </select>
              </div>
              {entryForm.dateType === 'fixed' && (
                <div>
                  <label className="text-sm font-medium">{t('entryModal.fixedDate')}</label>
                  <input
                    value={entryForm.fixedDate}
                    onChange={(e) => setEntryForm({ ...entryForm, fixedDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="MM-DD or YYYY-MM-DD"
                  />
                </div>
              )}
              {entryForm.dateType === 'easter_relative' && (
                <div>
                  <label className="text-sm font-medium">{t('entryModal.easterOffset')}</label>
                  <input
                    type="number"
                    value={entryForm.easterOffset}
                    onChange={(e) => setEntryForm({ ...entryForm, easterOffset: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={entryForm.isRecurring}
                  onChange={(e) => setEntryForm({ ...entryForm, isRecurring: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm">{t('entryModal.isRecurring')}</label>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setShowEntryModal(null)}>Cancel</Button>
              <Button onClick={handleCreateEntry} disabled={!entryForm.name || creatingEntry}>
                {creatingEntry ? t('entryModal.submitting') : t('entryModal.submit')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarCard({
  calendar,
  isExpanded,
  onToggle,
  dates,
  isSystem,
  onAddEntry,
  onDeleteEntry,
  t,
}: {
  calendar: Calendar;
  isExpanded: boolean;
  onToggle: () => void;
  dates?: CalendarDate[];
  isSystem: boolean;
  onAddEntry?: () => void;
  onDeleteEntry?: (entryId: string) => void;
  t: any;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <div className="text-left">
            <span className="font-medium">{calendar.name}</span>
            <span className="ml-2 text-xs text-muted-foreground">({calendar.code})</span>
            {calendar.description && (
              <p className="text-xs text-muted-foreground">{calendar.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {calendar._count?.entries || 0} {t('entries')}
          </span>
          <span className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            calendar.type === 'holidays' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' :
            calendar.type === 'school_days' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' :
            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          )}>
            {calendar.type}
          </span>
        </div>
      </button>
      {isExpanded && (
        <div className="border-t px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">{t('previewYear')} {new Date().getFullYear()}</h4>
            {!isSystem && onAddEntry && (
              <Button size="sm" variant="outline" onClick={onAddEntry}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t('addEntry')}
              </Button>
            )}
          </div>
          {dates ? (
            dates.length > 0 ? (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {dates.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/30">
                    <div>
                      <span className="font-mono text-xs mr-2">{d.date}</span>
                      <span>{d.name}</span>
                    </div>
                    {!isSystem && onDeleteEntry && (
                      <button
                        onClick={() => onDeleteEntry(d.entryId)}
                        className="text-destructive hover:text-destructive/80 text-xs"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No dates for this year</p>
            )
          ) : (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
