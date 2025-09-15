
"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortableItemProps = {
  id: string;
  children: React.ReactNode;
  className?: string;
};

export function SortableItem({ id, children, className }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("relative group", className)}>
       <button {...attributes} {...listeners} className="absolute top-2 right-2 p-1 bg-background/50 rounded-md cursor-grab focus:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      {children}
    </div>
  );
}
