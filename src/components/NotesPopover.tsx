import { useState } from 'react';
import { MessageSquare, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface NotesPopoverProps {
  notes: string | null;
  onSave: (notes: string | null) => void;
}

export function NotesPopover({ notes, onSave }: NotesPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(notes || '');
  
  const handleSave = () => {
    onSave(value.trim() || null);
    setIsOpen(false);
  };
  
  const handleCancel = () => {
    setValue(notes || '');
    setIsOpen(false);
  };
  
  const hasNotes = notes && notes.trim().length > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7 transition-opacity',
            hasNotes ? 'text-future opacity-100' : 'text-muted-foreground opacity-0 group-hover:opacity-100'
          )}
          title={hasNotes ? notes : 'Adicionar nota'}
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Notas</h4>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-income" onClick={handleSave}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Adicione uma observação..."
            className="min-h-[100px] resize-none"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {value.length} caracteres
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
