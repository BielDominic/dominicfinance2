import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  type?: 'text' | 'currency' | 'date';
  placeholder?: string;
}

export function EditableCell({ 
  value, 
  onChange, 
  className,
  type = 'text',
  placeholder = '...'
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type === 'date' ? 'text' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 -mx-1',
          type === 'currency' && 'font-mono',
          className
        )}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={cn(
        'cursor-text hover:bg-muted/50 rounded px-1 -mx-1 transition-colors inline-block min-w-[2rem]',
        !value && 'text-muted-foreground italic',
        className
      )}
    >
      {value || placeholder}
    </span>
  );
}
