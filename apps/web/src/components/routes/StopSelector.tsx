'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StopResult {
  id: string;
  name: string;
  code?: string;
  city?: string;
  latitude: number;
  longitude: number;
}

interface StopSelectorProps {
  companyId: string;
  addedStopIds: Set<string>;
  onSelect: (stop: StopResult) => void;
  onQuickCreate: () => void;
  searchPlaceholder: string;
  quickCreateLabel: string;
}

export default function StopSelector({
  companyId,
  addedStopIds,
  onSelect,
  onQuickCreate,
  searchPlaceholder,
  quickCreateLabel,
}: StopSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StopResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get<StopResult[]>(
        `/stops/search?query=${encodeURIComponent(q)}&companyId=${companyId}&limit=20`
      );
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-lg border bg-background">
          {results.map((stop) => {
            const isAdded = addedStopIds.has(stop.id);
            return (
              <button
                key={stop.id}
                type="button"
                disabled={isAdded}
                onClick={() => {
                  onSelect(stop);
                  setQuery('');
                  setResults([]);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                  isAdded
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-muted cursor-pointer'
                )}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{stop.name}</span>
                  {stop.city && (
                    <span className="ml-1.5 text-muted-foreground">{stop.city}</span>
                  )}
                  {stop.code && (
                    <span className="ml-1.5 text-xs text-muted-foreground">({stop.code})</span>
                  )}
                </div>
                {isAdded && (
                  <span className="text-xs text-muted-foreground shrink-0">+</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={onQuickCreate}
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        {quickCreateLabel}
      </button>
    </div>
  );
}
