import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { IncomeEntry, ExpenseCategory, Investment, Person, EntryStatus } from '@/types/financial';

interface ImportExportDataProps {
  incomeEntries: IncomeEntry[];
  expenseCategories: ExpenseCategory[];
  investments: Investment[];
  metaEntradas: number;
  onImportData: (data: {
    incomeEntries: IncomeEntry[];
    expenseCategories: ExpenseCategory[];
    investments: Investment[];
    metaEntradas: number;
  }) => void;
}

export function ImportExportData({
  incomeEntries,
  expenseCategories,
  investments,
  metaEntradas,
  onImportData,
}: ImportExportDataProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Income Entries Sheet with sequential IDs only
      const incomeData = incomeEntries.map((entry, index) => ({
        'ID': index + 1,
        'Valor': entry.valor,
        'Descrição': entry.descricao,
        'Data': entry.data || '',
        'Pessoa': entry.pessoa,
        'Status': entry.status,
      }));
      const incomeWs = XLSX.utils.json_to_sheet(incomeData);
      XLSX.utils.book_append_sheet(wb, incomeWs, 'Entradas');

      // Expense Categories Sheet with sequential IDs only
      const expenseData = expenseCategories.map((cat, index) => ({
        'ID': index + 1,
        'Categoria': cat.categoria,
        'Total': cat.total,
        'Pago': cat.pago,
        'Falta Pagar': cat.faltaPagar,
      }));
      const expenseWs = XLSX.utils.json_to_sheet(expenseData);
      XLSX.utils.book_append_sheet(wb, expenseWs, 'Despesas');

      // Investments Sheet with sequential IDs only
      const investmentData = investments.map((inv, index) => ({
        'ID': index + 1,
        'Categoria': inv.categoria,
        'Valor': inv.valor,
      }));
      const investmentWs = XLSX.utils.json_to_sheet(investmentData);
      XLSX.utils.book_append_sheet(wb, investmentWs, 'Investimentos');

      // Settings Sheet
      const settingsData = [{ 'Configuração': 'Meta Entradas', 'Valor': metaEntradas }];
      const settingsWs = XLSX.utils.json_to_sheet(settingsData);
      XLSX.utils.book_append_sheet(wb, settingsWs, 'Configurações');

      // Generate file and download
      const fileName = `planejamento_financeiro_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Erro ao exportar dados');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const safeParseNumber = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined || value === '') return defaultValue;
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  const safeParseString = (value: any, defaultValue: string = ''): string => {
    if (value === null || value === undefined) return defaultValue;
    return String(value).trim();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    let parsedIncome: IncomeEntry[] = [];
    let parsedExpenses: ExpenseCategory[] = [];
    let parsedInvestments: Investment[] = [];
    let parsedMeta = 20000;
    let warnings: string[] = [];
    let skippedRows = 0;

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);

      // Parse Income Entries with error handling per row
      try {
        const incomeSheet = wb.Sheets['Entradas'];
        const incomeRaw = incomeSheet ? XLSX.utils.sheet_to_json<any>(incomeSheet) : [];
        
        incomeRaw.forEach((row: any, index: number) => {
          try {
            // Use UUID if available, otherwise use ID or generate new one
            const uuid = safeParseString(row['UUID']) || safeParseString(row['ID']);
            const isValidUuid = uuid && uuid.length > 10; // Simple check for UUID format
            
            // Validate pessoa and status values
            const pessoaRaw = safeParseString(row['Pessoa'], 'Gabriel');
            const pessoa = (pessoaRaw === 'Gabriel' || pessoaRaw === 'Myrelle') ? pessoaRaw : 'Gabriel';
            
            const statusRaw = safeParseString(row['Status'], 'Entrada');
            const status = (statusRaw === 'Entrada' || statusRaw === 'Futuros') ? statusRaw : 'Entrada';
            
            const entry: IncomeEntry = {
              id: isValidUuid ? uuid : `import-${Date.now()}-${index}`,
              valor: safeParseNumber(row['Valor']),
              descricao: safeParseString(row['Descrição']),
              data: safeParseString(row['Data']) || null,
              pessoa,
              status,
            };
            parsedIncome.push(entry);
          } catch (rowError) {
            console.warn(`Skipped income row ${index + 1}:`, rowError);
            skippedRows++;
          }
        });
      } catch (sheetError) {
        console.warn('Error parsing Entradas sheet:', sheetError);
        warnings.push('Aba "Entradas" não encontrada ou com erros');
      }

      // Parse Expense Categories with error handling per row
      try {
        const expenseSheet = wb.Sheets['Despesas'];
        const expenseRaw = expenseSheet ? XLSX.utils.sheet_to_json<any>(expenseSheet) : [];
        
        expenseRaw.forEach((row: any, index: number) => {
          try {
            const uuid = safeParseString(row['UUID']) || safeParseString(row['ID']);
            const isValidUuid = uuid && uuid.length > 10;
            
            const expense: ExpenseCategory = {
              id: isValidUuid ? uuid : `import-exp-${Date.now()}-${index}`,
              categoria: safeParseString(row['Categoria']),
              total: safeParseNumber(row['Total']),
              pago: safeParseNumber(row['Pago']),
              faltaPagar: safeParseNumber(row['Falta Pagar']),
            };
            parsedExpenses.push(expense);
          } catch (rowError) {
            console.warn(`Skipped expense row ${index + 1}:`, rowError);
            skippedRows++;
          }
        });
      } catch (sheetError) {
        console.warn('Error parsing Despesas sheet:', sheetError);
        warnings.push('Aba "Despesas" não encontrada ou com erros');
      }

      // Parse Investments with error handling per row
      try {
        const investmentSheet = wb.Sheets['Investimentos'];
        const investmentRaw = investmentSheet ? XLSX.utils.sheet_to_json<any>(investmentSheet) : [];
        
        investmentRaw.forEach((row: any, index: number) => {
          try {
            const uuid = safeParseString(row['UUID']) || safeParseString(row['ID']);
            const isValidUuid = uuid && uuid.length > 10;
            
            const investment: Investment = {
              id: isValidUuid ? uuid : `import-inv-${Date.now()}-${index}`,
              categoria: safeParseString(row['Categoria']),
              valor: safeParseNumber(row['Valor']),
            };
            parsedInvestments.push(investment);
          } catch (rowError) {
            console.warn(`Skipped investment row ${index + 1}:`, rowError);
            skippedRows++;
          }
        });
      } catch (sheetError) {
        console.warn('Error parsing Investimentos sheet:', sheetError);
        warnings.push('Aba "Investimentos" não encontrada ou com erros');
      }

      // Parse Settings with error handling
      try {
        const settingsSheet = wb.Sheets['Configurações'];
        const settingsRaw = settingsSheet ? XLSX.utils.sheet_to_json<any>(settingsSheet) : [];
        const metaRow = settingsRaw.find((row: any) => 
          safeParseString(row['Configuração']).toLowerCase().includes('meta')
        );
        parsedMeta = metaRow ? safeParseNumber(metaRow['Valor'], 20000) : 20000;
      } catch (sheetError) {
        console.warn('Error parsing Configurações sheet:', sheetError);
        warnings.push('Aba "Configurações" não encontrada, usando valores padrão');
      }

      // Only import if we have at least some valid data
      const hasData = parsedIncome.length > 0 || parsedExpenses.length > 0 || parsedInvestments.length > 0;
      
      if (!hasData) {
        toast.error('Nenhum dado válido encontrado no arquivo. Verifique se as abas estão nomeadas corretamente: Entradas, Despesas, Investimentos');
        return;
      }

      onImportData({
        incomeEntries: parsedIncome,
        expenseCategories: parsedExpenses,
        investments: parsedInvestments,
        metaEntradas: parsedMeta,
      });

      // Build success message
      let message = `Importado: ${parsedIncome.length} entradas, ${parsedExpenses.length} despesas, ${parsedInvestments.length} investimentos`;
      
      if (skippedRows > 0) {
        message += `. ${skippedRows} linhas ignoradas por erros`;
        toast.warning(message);
      } else if (warnings.length > 0) {
        toast.success(message);
        warnings.forEach(w => toast.warning(w));
      } else {
        toast.success(message);
      }

    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Erro ao ler o arquivo. Verifique se é um arquivo Excel válido (.xlsx ou .xls)');
    } finally {
      setIsImporting(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exportar Dados
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImportClick} disabled={isImporting}>
            {isImporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Importar Dados
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
