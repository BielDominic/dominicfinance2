import { useState } from 'react';
import { Wallet, Plane, LogOut, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImportExportData } from '@/components/ImportExportData';
import { ThemeToggle } from '@/components/ThemeToggle';
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
  title?: string;
  subtitle?: string;
  onTitleChange?: (title: string) => void;
  onSubtitleChange?: (subtitle: string) => void;
  darkMode?: boolean;
  onDarkModeChange?: (value: boolean) => void;
}

export function Header({ 
  onLogout,
  incomeEntries = [],
  expenseCategories = [],
  investments = [],
  metaEntradas = 20000,
  onImportData,
  title = 'Planejamento Financeiro',
  subtitle = 'Viagem 2025/2026',
  onTitleChange,
  onSubtitleChange,
  darkMode = false,
  onDarkModeChange,
}: HeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [titleInput, setTitleInput] = useState(title);
  const [subtitleInput, setSubtitleInput] = useState(subtitle);

  const handleLogout = () => {
    localStorage.removeItem('financial-auth');
    onLogout?.();
  };

  const handleSaveTitle = () => {
    onTitleChange?.(titleInput);
    setIsEditingTitle(false);
  };

  const handleSaveSubtitle = () => {
    onSubtitleChange?.(subtitleInput);
    setIsEditingSubtitle(false);
  };

  const handleCancelTitle = () => {
    setTitleInput(title);
    setIsEditingTitle(false);
  };

  const handleCancelSubtitle = () => {
    setSubtitleInput(subtitle);
    setIsEditingSubtitle(false);
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
              {/* Editable Title */}
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') handleCancelTitle();
                    }}
                    className="h-8 text-lg font-bold w-64"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveTitle}>
                    <Check className="h-4 w-4 text-income" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelTitle}>
                    <X className="h-4 w-4 text-expense" />
                  </Button>
                </div>
              ) : (
                <h1 
                  className="text-xl font-bold tracking-tight flex items-center gap-2 group cursor-pointer"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {title}
                  <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-xs px-2 py-0.5 bg-ireland-orange-light text-ireland-orange rounded-full font-medium">
                    🇮🇪 Irlanda
                  </span>
                </h1>
              )}
              
              {/* Editable Subtitle */}
              {isEditingSubtitle ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={subtitleInput}
                    onChange={(e) => setSubtitleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveSubtitle();
                      if (e.key === 'Escape') handleCancelSubtitle();
                    }}
                    className="h-7 text-sm w-48"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveSubtitle}>
                    <Check className="h-3 w-3 text-income" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelSubtitle}>
                    <X className="h-3 w-3 text-expense" />
                  </Button>
                </div>
              ) : (
                <p 
                  className="text-sm text-muted-foreground flex items-center gap-1 group cursor-pointer"
                  onClick={() => setIsEditingSubtitle(true)}
                >
                  <Plane className="h-3 w-3" />
                  {subtitle}
                  <Pencil className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              )}
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
            
            {onDarkModeChange && (
              <ThemeToggle darkMode={darkMode} onToggle={onDarkModeChange} />
            )}
            
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
