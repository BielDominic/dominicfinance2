import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EntryTag } from '@/types/financial';
import { cn } from '@/lib/utils';

interface TagBadgeProps {
  tag: EntryTag;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

const tagColors: Record<EntryTag, { bg: string; text: string; border: string }> = {
  urgente: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  opcional: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' },
  confirmado: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
  pendente: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' },
  recorrente: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
};

const tagLabels: Record<EntryTag, string> = {
  urgente: '🔥 Urgente',
  opcional: '💭 Opcional',
  confirmado: '✅ Confirmado',
  pendente: '⏳ Pendente',
  recorrente: '🔄 Recorrente',
};

export function TagBadge({ tag, onRemove, size = 'sm' }: TagBadgeProps) {
  const colors = tagColors[tag];
  
  return (
    <Badge
      variant="outline"
      className={cn(
        colors.bg,
        colors.text,
        colors.border,
        'font-medium border',
        size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5',
        onRemove && 'pr-1'
      )}
    >
      {tagLabels[tag]}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-black/10 rounded-full p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}

export function TagSelector({ 
  selectedTags, 
  onToggleTag 
}: { 
  selectedTags: EntryTag[]; 
  onToggleTag: (tag: EntryTag) => void;
}) {
  const allTags: EntryTag[] = ['urgente', 'opcional', 'confirmado', 'pendente', 'recorrente'];
  
  return (
    <div className="flex flex-wrap gap-1.5">
      {allTags.map(tag => {
        const isSelected = selectedTags.includes(tag);
        const colors = tagColors[tag];
        
        return (
          <button
            key={tag}
            onClick={() => onToggleTag(tag)}
            className={cn(
              'text-xs px-2 py-1 rounded-full border transition-all',
              isSelected 
                ? `${colors.bg} ${colors.text} ${colors.border}` 
                : 'bg-muted/50 text-muted-foreground border-transparent hover:border-border'
            )}
          >
            {tagLabels[tag]}
          </button>
        );
      })}
    </div>
  );
}
