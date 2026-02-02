import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, User, Plane, Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signIn, signUp } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerDisplayName, setRegisterDisplayName] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginUsername || !loginPassword) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signIn(loginUsername, loginPassword);
    
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }
    
    toast.success('Login realizado com sucesso!');
    navigate('/', { replace: true });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerUsername || !registerEmail || !registerPassword || !registerConfirmPassword) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerEmail)) {
      toast.error('Digite um email válido');
      return;
    }
    
    if (registerPassword !== registerConfirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (registerPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (registerUsername.length < 3) {
      toast.error('O nome de usuário deve ter pelo menos 3 caracteres');
      return;
    }
    
    // Validate username format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(registerUsername)) {
      toast.error('Nome de usuário deve conter apenas letras, números e underscores');
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signUp(
      registerUsername,
      registerEmail,
      registerPassword,
      registerDisplayName || registerUsername
    );
    
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }
    
    toast.success('Conta criada com sucesso!', {
      description: 'Você já pode fazer login.',
    });
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Irish Flag */}
            <div className="flex justify-center mb-4">
              <div className="flex rounded-lg overflow-hidden shadow-lg">
                <div className="w-8 h-12 bg-ireland-green"></div>
                <div className="w-8 h-12 bg-white"></div>
                <div className="w-8 h-12 bg-ireland-orange"></div>
              </div>
            </div>
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mx-auto mb-4">
              <Plane className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Dominic</h1>
            <p className="text-muted-foreground mt-2 flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" />
              Planejamento Financeiro
            </p>
          </div>

          {/* Auth Tabs */}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Criar Conta</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Nome de Usuário</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Digite seu usuário"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="pl-10"
                      autoComplete="username"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Digite sua senha"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="current-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">Nome de Usuário *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="Escolha um nome de usuário"
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      className="pl-10"
                      autoComplete="username"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Apenas letras, números e underscores
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="pl-10"
                      autoComplete="email"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-display-name">Nome de Exibição</Label>
                  <Input
                    id="register-display-name"
                    type="text"
                    placeholder="Como você quer ser chamado"
                    value={registerDisplayName}
                    onChange={(e) => setRegisterDisplayName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Crie uma senha"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Confirmar Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirme sua senha"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      className="pl-10"
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar Conta'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Dominic • Planejamento Financeiro Inteligente
          </p>
        </div>
      </div>
    </div>
  );
}
