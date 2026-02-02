import { useState, createContext, useContext, ReactNode } from 'react';
import { Eye, Edit3, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface ReadOnlyContextType {
  isReadOnly: boolean;
  toggleReadOnly: () => void;
}

const ReadOnlyContext = createContext<ReadOnlyContextType>({
  isReadOnly: false,
  toggleReadOnly: () => {},
});

export function useReadOnly() {
  return useContext(ReadOnlyContext);
}

export function ReadOnlyProvider({ children }: { children: ReactNode }) {
  const [isReadOnly, setIsReadOnly] = useState(false);

  const toggleReadOnly = () => {
    setIsReadOnly((prev) => !prev);
  };

  return (
    <ReadOnlyContext.Provider value={{ isReadOnly, toggleReadOnly }}>
      {children}
    </ReadOnlyContext.Provider>
  );
}

export function ReadOnlyToggle() {
  const { isReadOnly, toggleReadOnly } = useReadOnly();
  const { isAdmin } = useAuth();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isReadOnly ? 'secondary' : 'ghost'}
            size="sm"
            onClick={toggleReadOnly}
            className={cn(
              'gap-2 transition-all',
              isReadOnly && 'bg-ireland-orange/10 text-ireland-orange border border-ireland-orange/30'
            )}
          >
            {isReadOnly ? (
              <>
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Modo Leitura</span>
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4" />
                <span className="hidden sm:inline">Modo Edição</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isReadOnly 
            ? 'Clique para habilitar edição' 
            : 'Clique para modo somente leitura (compartilhamento seguro)'
          }
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// HOC to wrap editable components
export function withReadOnlyProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: { showOverlay?: boolean }
) {
  return function ReadOnlyProtectedComponent(props: P & { disabled?: boolean }) {
    const { isReadOnly } = useReadOnly();
    
    if (options?.showOverlay && isReadOnly) {
      return (
        <div className="relative">
          <div className="pointer-events-none opacity-60">
            <WrappedComponent {...props} disabled />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="h-5 w-5" />
              <span>Modo Leitura</span>
            </div>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} disabled={isReadOnly || props.disabled} />;
  };
}
