import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, max, className, showLabel = true }: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const isComplete = percentage >= 100;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="progress-bar">
        <div
          className={cn(
            'progress-fill',
            isComplete ? 'bg-income' : 'bg-primary'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{percentage.toFixed(0)}%</span>
          {isComplete && (
            <span className="text-income font-medium">✓ Pago</span>
          )}
        </div>
      )}
    </div>
  );
}
