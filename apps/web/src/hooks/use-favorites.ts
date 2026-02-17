'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

interface FavoriteState {
  companies: Set<string>;
  routes: Set<string>;
  stops: Set<string>;
}

let globalState: FavoriteState = {
  companies: new Set(),
  routes: new Set(),
  stops: new Set(),
};

let listeners: Set<() => void> = new Set();
let initialized = false;

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

async function loadFavorites() {
  try {
    const [companies, routes, stops] = await Promise.all([
      api.fetch<any[]>('/favorites/companies'),
      api.fetch<any[]>('/favorites/routes'),
      api.fetch<any[]>('/favorites/stops'),
    ]);
    globalState = {
      companies: new Set(companies.map((f) => f.companyId)),
      routes: new Set(routes.map((f) => f.routeId)),
      stops: new Set(stops.map((f) => f.stopId)),
    };
    initialized = true;
    notifyListeners();
  } catch {
    // Not logged in or error — ignore
  }
}

export function useFavorites() {
  const { user } = useAuth();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);

    if (user && !initialized) {
      loadFavorites();
    }

    return () => {
      listeners.delete(listener);
    };
  }, [user]);

  // Reset when user logs out
  useEffect(() => {
    if (!user) {
      globalState = { companies: new Set(), routes: new Set(), stops: new Set() };
      initialized = false;
    }
  }, [user]);

  const isFavorited = useCallback(
    (type: 'company' | 'route' | 'stop', id: string) => {
      switch (type) {
        case 'company':
          return globalState.companies.has(id);
        case 'route':
          return globalState.routes.has(id);
        case 'stop':
          return globalState.stops.has(id);
      }
    },
    [],
  );

  const toggleFavorite = useCallback(
    async (type: 'company' | 'route' | 'stop', id: string) => {
      if (!user || !initialized) return;
      const favorited = isFavorited(type, id);
      const endpoint =
        type === 'company'
          ? `/favorites/companies/${id}`
          : type === 'route'
            ? `/favorites/routes/${id}`
            : `/favorites/stops/${id}`;

      // Optimistic update
      const key = type === 'company' ? 'companies' : type === 'route' ? 'routes' : 'stops';
      if (favorited) {
        globalState[key].delete(id);
      } else {
        globalState[key].add(id);
      }
      notifyListeners();

      try {
        if (favorited) {
          await api.fetch(endpoint, { method: 'DELETE' });
        } else {
          await api.fetch(endpoint, { method: 'POST' });
        }
      } catch {
        // Revert on error
        if (favorited) {
          globalState[key].add(id);
        } else {
          globalState[key].delete(id);
        }
        notifyListeners();
      }
    },
    [isFavorited],
  );

  return { isFavorited, toggleFavorite };
}
