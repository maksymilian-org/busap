'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import { api } from '@/lib/api';

interface StopData {
  id: string;
  name: string;
  city?: string;
}

interface StopAutocompleteProps {
  value: string;
  stopId: string | null;
  onChange: (text: string) => void;
  onSelect: (stop: StopData) => void;
  onClear: () => void;
  placeholder?: string;
  label?: string;
  iconVariant?: 'muted' | 'primary';
  inputClassName?: string;
}

export function StopAutocomplete({
  value,
  stopId,
  onChange,
  onSelect,
  onClear,
  placeholder,
  label,
  iconVariant = 'muted',
  inputClassName,
}: StopAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<StopData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced stop search — only when no stop is selected
  useEffect(() => {
    if (stopId || value.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await api.fetch<StopData[]>(
          `/stops/search?query=${encodeURIComponent(value)}&limit=10`,
        );
        setSuggestions(Array.isArray(data) ? data : []);
        setHighlightedIdx(-1);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [value, stopId]);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (stop: StopData) => {
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIdx(-1);
    onSelect(stop);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && highlightedIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightedIdx]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIdx(-1);
    }
  };

  const iconColor = iconVariant === 'primary' ? 'text-primary' : 'text-muted-foreground';
  const defaultInputClass =
    'w-full rounded-lg border bg-background py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="relative">
        <MapPin className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${iconColor}`} />
        <input
          type="text"
          placeholder={placeholder}
          className={inputClassName ?? defaultInputClass}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {stopId && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <div
            className="absolute z-50 mt-1 w-full rounded-lg border bg-card shadow-lg overflow-hidden"
            role="listbox"
          >
            {suggestions.map((stop, idx) => (
              <button
                key={stop.id}
                type="button"
                onClick={() => handleSelect(stop)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                  idx === highlightedIdx
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
                role="option"
                aria-selected={idx === highlightedIdx}
              >
                <MapPin
                  className={`h-4 w-4 flex-shrink-0 ${
                    idx === highlightedIdx ? 'text-primary-foreground' : iconColor
                  }`}
                />
                <div>
                  <div className="font-medium">{stop.name}</div>
                  {stop.city && (
                    <div
                      className={`text-xs ${
                        idx === highlightedIdx
                          ? 'text-primary-foreground/80'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {stop.city}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
