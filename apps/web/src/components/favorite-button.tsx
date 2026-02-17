'use client';

import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/use-favorites';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  type: 'company' | 'route' | 'stop';
  id: string;
  size?: 'sm' | 'default';
}

export function FavoriteButton({ type, id, size = 'default' }: FavoriteButtonProps) {
  const { user } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();

  if (!user) return null;

  const favorited = isFavorited(type, id);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        size === 'sm' && 'h-7 w-7',
        favorited && 'text-red-500 hover:text-red-600'
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(type, id);
      }}
    >
      <Heart
        className={cn(
          size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
          favorited && 'fill-current'
        )}
      />
    </Button>
  );
}
