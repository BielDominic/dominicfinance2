import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  headerContent?: ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  children,
  defaultExpanded = true,
  headerContent,
  className,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn('financial-card overflow-hidden animate-fade-in', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {Icon && <Icon className={cn('h-5 w-5', iconColor)} />}
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </button>
          
          {headerContent && isExpanded && (
            <div className="flex flex-wrap items-center gap-2">
              {headerContent}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && children}
    </div>
  );
}
