import { Wallet, Plane } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Planejamento Financeiro
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Plane className="h-3 w-3" />
                Viagem 2025/2026
              </p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="px-2 py-1 bg-income-light text-income rounded-md font-medium">
              Gabriel
            </span>
            <span className="text-muted-foreground">&</span>
            <span className="px-2 py-1 bg-future-light text-future rounded-md font-medium">
              Myrelle
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
