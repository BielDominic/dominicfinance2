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
import { IncomeEntry, ExpenseCategory, Investment } from '@/types/financial';

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

      // Income Entries Sheet
      const incomeData = incomeEntries.map(entry => ({
        'ID': entry.id,
        'Valor': entry.valor,
        'Descrição': entry.descricao,
        'Data': entry.data || '',
        'Pessoa': entry.pessoa,
        'Status': entry.status,
      }));
      const incomeWs = XLSX.utils.json_to_sheet(incomeData);
      XLSX.utils.book_append_sheet(wb, incomeWs, 'Entradas');

      // Expense Categories Sheet
      const expenseData = expenseCategories.map(cat => ({
        'ID': cat.id,
        'Categoria': cat.categoria,
        'Total': cat.total,
        'Pago': cat.pago,
        'Falta Pagar': cat.faltaPagar,
      }));
      const expenseWs = XLSX.utils.json_to_sheet(expenseData);
      XLSX.utils.book_append_sheet(wb, expenseWs, 'Despesas');

      // Investments Sheet
      const investmentData = investments.map(inv => ({
        'ID': inv.id,
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);

      // Parse Income Entries
      const incomeSheet = wb.Sheets['Entradas'];
      const incomeRaw = incomeSheet ? XLSX.utils.sheet_to_json<any>(incomeSheet) : [];
      const parsedIncome: IncomeEntry[] = incomeRaw.map((row: any, index: number) => ({
        id: row['ID'] || `import-${Date.now()}-${index}`,
        valor: Number(row['Valor']) || 0,
        descricao: row['Descrição'] || '',
        data: row['Data'] || null,
        pessoa: row['Pessoa'] || 'Gabriel',
        status: row['Status'] || 'Entrada',
      }));

      // Parse Expense Categories
      const expenseSheet = wb.Sheets['Despesas'];
      const expenseRaw = expenseSheet ? XLSX.utils.sheet_to_json<any>(expenseSheet) : [];
      const parsedExpenses: ExpenseCategory[] = expenseRaw.map((row: any, index: number) => ({
        id: row['ID'] || `import-exp-${Date.now()}-${index}`,
        categoria: row['Categoria'] || '',
        total: Number(row['Total']) || 0,
        pago: Number(row['Pago']) || 0,
        faltaPagar: Number(row['Falta Pagar']) || 0,
      }));

      // Parse Investments
      const investmentSheet = wb.Sheets['Investimentos'];
      const investmentRaw = investmentSheet ? XLSX.utils.sheet_to_json<any>(investmentSheet) : [];
      const parsedInvestments: Investment[] = investmentRaw.map((row: any, index: number) => ({
        id: row['ID'] || `import-inv-${Date.now()}-${index}`,
        categoria: row['Categoria'] || '',
        valor: Number(row['Valor']) || 0,
      }));

      // Parse Settings
      const settingsSheet = wb.Sheets['Configurações'];
      const settingsRaw = settingsSheet ? XLSX.utils.sheet_to_json<any>(settingsSheet) : [];
      const metaRow = settingsRaw.find((row: any) => row['Configuração'] === 'Meta Entradas');
      const parsedMeta = metaRow ? Number(metaRow['Valor']) || 20000 : 20000;

      onImportData({
        incomeEntries: parsedIncome,
        expenseCategories: parsedExpenses,
        investments: parsedInvestments,
        metaEntradas: parsedMeta,
      });

      toast.success(`Dados importados: ${parsedIncome.length} entradas, ${parsedExpenses.length} despesas, ${parsedInvestments.length} investimentos`);
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Erro ao importar dados. Verifique o formato do arquivo.');
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
