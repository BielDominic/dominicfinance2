import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Shield, Eye, EyeOff } from 'lucide-react';

interface AdminPasswordGateProps {
  onSuccess: () => void;
}

export function AdminPasswordGate({ onSuccess }: AdminPasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    try {
      // Fetch stored password from database
      const { data, error: fetchError } = await supabase
        .from('system_config')
        .select('config_value')
        .eq('config_key', 'admin_password')
        .single();

      if (fetchError) throw fetchError;

      // The password is stored as JSON string, so parse it
      const storedPassword = typeof data.config_value === 'string' 
        ? data.config_value 
        : JSON.stringify(data.config_value).replace(/"/g, '');

      if (password === storedPassword) {
        sessionStorage.setItem('admin-panel-auth', 'true');
        onSuccess();
      } else {
        setError(true);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch (err) {
      console.error('Error checking admin password:', err);
      setError(true);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } finally {
      setIsLoading(false);
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
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-2 flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            Acesso Restrito
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite a senha do painel"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={`text-center text-lg h-12 pr-10 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {error && (
            <p className="text-destructive text-sm text-center">
              Senha incorreta. Tente novamente.
            </p>
          )}

          <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
            {isLoading ? 'Verificando...' : 'Acessar Painel'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Somente administradores autorizados
        </p>
      </div>
    </div>
  );
}
