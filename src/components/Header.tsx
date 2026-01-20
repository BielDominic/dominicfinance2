import { Wallet, Plane, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImportExportData } from '@/components/ImportExportData';
import { IncomeEntry, ExpenseCategory, Investment } from '@/types/financial';

interface HeaderProps {
  onLogout?: () => void;
  incomeEntries?: IncomeEntry[];
  expenseCategories?: ExpenseCategory[];
  investments?: Investment[];
  metaEntradas?: number;
  onImportData?: (data: {
    incomeEntries: IncomeEntry[];
    expenseCategories: ExpenseCategory[];
    investments: Investment[];
    metaEntradas: number;
  }) => void;
}

export function Header({ 
  onLogout,
  incomeEntries = [],
  expenseCategories = [],
  investments = [],
  metaEntradas = 20000,
  onImportData,
}: HeaderProps) {
  const handleLogout = () => {
    localStorage.removeItem('financial-auth');
    onLogout?.();
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                Planejamento Financeiro
                <span className="text-xs px-2 py-0.5 bg-ireland-orange-light text-ireland-orange rounded-full font-medium">
                  🇮🇪 Irlanda
                </span>
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Plane className="h-3 w-3" />
                Viagem 2025/2026
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="px-2 py-1 bg-income-light text-income rounded-md font-medium">
                Gabriel
              </span>
              <span className="text-muted-foreground">&</span>
              <span className="px-2 py-1 bg-ireland-orange-light text-ireland-orange rounded-md font-medium">
                Myrelle
              </span>
            </div>
            
            {onImportData && (
              <ImportExportData
                incomeEntries={incomeEntries}
                expenseCategories={expenseCategories}
                investments={investments}
                metaEntradas={metaEntradas}
                onImportData={onImportData}
              />
            )}
            
            {onLogout && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="gap-2 text-muted-foreground hover:text-expense"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
