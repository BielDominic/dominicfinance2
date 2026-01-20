import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Plane } from 'lucide-react';

interface PasswordScreenProps {
  onSuccess: () => void;
}

const CORRECT_PASSWORD = 'IRLANDA2026';

export function PasswordScreen({ onSuccess }: PasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.toUpperCase() === CORRECT_PASSWORD) {
      localStorage.setItem('financial-auth', 'true');
      onSuccess();
    } else {
      setError(true);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div 
        className={`bg-card border border-border rounded-2xl p-8 w-full max-w-md shadow-lg transition-transform ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mx-auto mb-4">
            <Plane className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Planejamento Financeiro</h1>
          <p className="text-muted-foreground mt-2 flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            Acesso Restrito
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Digite a senha"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={`text-center text-lg h-12 ${error ? 'border-expense focus-visible:ring-expense' : ''}`}
              autoFocus
            />
            {error && (
              <p className="text-expense text-sm mt-2 text-center">
                Senha incorreta. Tente novamente.
              </p>
            )}
          </div>

          <Button type="submit" className="w-full h-12 text-lg">
            Entrar
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Gabriel & Myrelle • Viagem 2025/2026
        </p>
      </div>
    </div>
  );
}
