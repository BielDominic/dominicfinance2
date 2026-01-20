import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  darkMode: boolean;
  onToggle: (value: boolean) => void;
}

export function ThemeToggle({ darkMode, onToggle }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (!mounted) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => onToggle(!darkMode)}
      className="h-9 w-9"
      title={darkMode ? 'Modo claro' : 'Modo escuro'}
    >
      {darkMode ? (
        <Sun className="h-4 w-4 text-yellow-500" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
