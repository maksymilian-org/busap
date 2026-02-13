'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Star, X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BuilderStop {
  id: string;
  stopId: string;
  name: string;
  city?: string;
  code?: string;
  latitude: number;
  longitude: number;
  isMain: boolean;
}

interface DraggableStopListProps {
  stops: BuilderStop[];
  onReorder: (stops: BuilderStop[]) => void;
  onToggleMain: (index: number) => void;
  onRemove: (index: number) => void;
  emptyMessage: string;
  mainStopLabel: string;
  removeStopLabel: string;
}

function SortableStopItem({
  stop,
  index,
  onToggleMain,
  onRemove,
  mainStopLabel,
  removeStopLabel,
}: {
  stop: BuilderStop;
  index: number;
  onToggleMain: () => void;
  onRemove: () => void;
  mainStopLabel: string;
  removeStopLabel: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5 text-sm',
        isDragging && 'opacity-50 shadow-lg z-50'
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <span className="font-medium">{stop.name}</span>
        {stop.city && (
          <span className="ml-1 text-muted-foreground">{stop.city}</span>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleMain}
        title={mainStopLabel}
        className={cn(
          'shrink-0 transition-colors',
          stop.isMain
            ? 'text-amber-500 hover:text-amber-600'
            : 'text-muted-foreground/30 hover:text-amber-400'
        )}
      >
        <Star className={cn('h-4 w-4', stop.isMain && 'fill-current')} />
      </button>

      <button
        type="button"
        onClick={onRemove}
        title={removeStopLabel}
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function DraggableStopList({
  stops,
  onReorder,
  onToggleMain,
  onRemove,
  emptyMessage,
  mainStopLabel,
  removeStopLabel,
}: DraggableStopListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stops.findIndex((s) => s.id === active.id);
    const newIndex = stops.findIndex((s) => s.id === over.id);
    onReorder(arrayMove(stops, oldIndex, newIndex));
  }

  if (stops.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center">
        <MapPin className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {stops.map((stop, index) => (
            <SortableStopItem
              key={stop.id}
              stop={stop}
              index={index}
              onToggleMain={() => onToggleMain(index)}
              onRemove={() => onRemove(index)}
              mainStopLabel={mainStopLabel}
              removeStopLabel={removeStopLabel}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
