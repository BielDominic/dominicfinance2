import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IncomeEntry, ExpenseCategory, Investment, Currency } from '@/types/financial';
import { toast } from 'sonner';

import { CounterBackground } from '@/components/DayCounterSettings';

interface AppConfig {
  headerTitle: string;
  headerSubtitle: string;
  taxaCambio: number;
  spread: number;
  darkMode: boolean;
  targetDate: string;
  counterTitle: string;
  counterBackground: CounterBackground;
}

export const useFinancialData = () => {
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [metaEntradas, setMetaEntradas] = useState(35000);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // App config state (synced in realtime)
  const [appConfig, setAppConfig] = useState<AppConfig>({
    headerTitle: 'Planejamento Financeiro',
    headerSubtitle: 'Viagem 2025/2026',
    taxaCambio: 6.5,
    spread: 0,
    darkMode: false,
    targetDate: '',
    counterTitle: 'Contagem para Irlanda',
    counterBackground: 'ireland',
  });

  // Fetch app config from database
  const fetchAppConfig = useCallback(async () => {
    try {
      const { data } = await supabase.from('app_config').select('*');
      if (data) {
        const configMap: Record<string, string> = {};
        data.forEach(item => {
          configMap[item.key] = item.value;
        });
        
        setAppConfig(prev => ({
          headerTitle: configMap['header_title'] || prev.headerTitle,
          headerSubtitle: configMap['header_subtitle'] || prev.headerSubtitle,
          taxaCambio: configMap['taxa_cambio'] ? parseFloat(configMap['taxa_cambio']) : prev.taxaCambio,
          spread: configMap['spread'] ? parseFloat(configMap['spread']) : prev.spread,
          darkMode: configMap['dark_mode'] === 'true',
          targetDate: configMap['target_date'] || prev.targetDate,
          counterTitle: configMap['counter_title'] || prev.counterTitle,
          counterBackground: (configMap['counter_background'] as CounterBackground) || prev.counterBackground,
        }));
      }
    } catch (error) {
      console.error('Error fetching app config:', error);
    }
  }, []);

  // Fetch all data from database
  const fetchData = useCallback(async () => {
    try {
      const [incomeRes, expenseRes, investRes, settingsRes] = await Promise.all([
        supabase.from('income_entries').select('*').order('created_at', { ascending: true }),
        supabase.from('expense_categories').select('*').order('created_at', { ascending: true }),
        supabase.from('investments').select('*').order('created_at', { ascending: true }),
        supabase.from('app_settings').select('*').eq('key', 'meta_entradas').maybeSingle(),
      ]);

      if (incomeRes.data) {
        setIncomeEntries(incomeRes.data.map(e => ({
          id: e.id,
          valor: Number(e.valor),
          descricao: e.descricao,
          data: e.data,
          pessoa: e.pessoa as 'Gabriel' | 'Myrelle',
          status: e.status as 'Entrada' | 'Futuros',
          tags: (e as any).tags || [],
          notas: (e as any).notas || null,
          moeda: ((e as any).moeda || 'BRL') as Currency,
        })));
      }

      if (expenseRes.data) {
        setExpenseCategories(expenseRes.data.map(c => ({
          id: c.id,
          categoria: c.categoria,
          total: Number(c.total),
          pago: Number(c.pago),
          faltaPagar: Number(c.falta_pagar),
          metaOrcamento: (c as any).meta_orcamento ? Number((c as any).meta_orcamento) : null,
          vencimento: (c as any).vencimento || null,
          notas: (c as any).notas || null,
          pessoa: ((c as any).pessoa || 'Ambos') as 'Gabriel' | 'Myrelle' | 'Ambos',
          moeda: ((c as any).moeda || 'BRL') as Currency,
        })));
      }

      if (investRes.data) {
        setInvestments(investRes.data.map(i => ({
          id: i.id,
          categoria: i.categoria,
          valor: Number(i.valor),
          moeda: ((i as any).moeda || 'BRL') as Currency,
        })));
      }

      if (settingsRes.data) {
        setMetaEntradas(Number(settingsRes.data.value));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Setup realtime subscriptions
  useEffect(() => {
    fetchData();
    fetchAppConfig();

    const incomeChannel = supabase
      .channel('income_entries_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'income_entries' }, () => {
        fetchData();
      })
      .subscribe();

    const expenseChannel = supabase
      .channel('expense_categories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_categories' }, () => {
        fetchData();
      })
      .subscribe();

    const investChannel = supabase
      .channel('investments_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investments' }, () => {
        fetchData();
      })
      .subscribe();

    const settingsChannel = supabase
      .channel('app_settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => {
        fetchData();
      })
      .subscribe();

    const configChannel = supabase
      .channel('app_config_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, () => {
        fetchAppConfig();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(incomeChannel);
      supabase.removeChannel(expenseChannel);
      supabase.removeChannel(investChannel);
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(configChannel);
    };
  }, [fetchData, fetchAppConfig]);

  // Update app config
  const updateAppConfig = useCallback(async (key: string, value: string) => {
    const { error } = await supabase
      .from('app_config')
      .upsert({ key, value }, { onConflict: 'key' });
    
    if (error) console.error('Error updating app config:', error);
  }, []);

  const handleTitleChange = useCallback(async (title: string) => {
    setAppConfig(prev => ({ ...prev, headerTitle: title }));
    await updateAppConfig('header_title', title);
  }, [updateAppConfig]);

  const handleSubtitleChange = useCallback(async (subtitle: string) => {
    setAppConfig(prev => ({ ...prev, headerSubtitle: subtitle }));
    await updateAppConfig('header_subtitle', subtitle);
  }, [updateAppConfig]);

  const handleTaxaCambioChange = useCallback(async (taxa: number) => {
    setAppConfig(prev => ({ ...prev, taxaCambio: taxa }));
    await updateAppConfig('taxa_cambio', taxa.toString());
  }, [updateAppConfig]);

  const handleSpreadChange = useCallback(async (spreadValue: number) => {
    setAppConfig(prev => ({ ...prev, spread: spreadValue }));
    await updateAppConfig('spread', spreadValue.toString());
  }, [updateAppConfig]);

  const handleDarkModeChange = useCallback(async (darkMode: boolean) => {
    setAppConfig(prev => ({ ...prev, darkMode }));
    await updateAppConfig('dark_mode', darkMode.toString());
  }, [updateAppConfig]);

  const handleTargetDateChange = useCallback(async (targetDate: string) => {
    setAppConfig(prev => ({ ...prev, targetDate }));
    await updateAppConfig('target_date', targetDate);
  }, [updateAppConfig]);

  const handleCounterTitleChange = useCallback(async (counterTitle: string) => {
    setAppConfig(prev => ({ ...prev, counterTitle }));
    await updateAppConfig('counter_title', counterTitle);
  }, [updateAppConfig]);

  const handleCounterBackgroundChange = useCallback(async (counterBackground: CounterBackground) => {
    setAppConfig(prev => ({ ...prev, counterBackground }));
    await updateAppConfig('counter_background', counterBackground);
  }, [updateAppConfig]);

  // Income entry handlers
  const handleUpdateIncomeEntry = useCallback(async (id: string, updates: Partial<IncomeEntry>) => {
    setIncomeEntries(prev => prev.map(entry => entry.id === id ? { ...entry, ...updates } : entry));
    
    const dbUpdates: Record<string, unknown> = {};
    if (updates.valor !== undefined) dbUpdates.valor = updates.valor;
    if (updates.descricao !== undefined) dbUpdates.descricao = updates.descricao;
    if (updates.data !== undefined) dbUpdates.data = updates.data;
    if (updates.pessoa !== undefined) dbUpdates.pessoa = updates.pessoa;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.moeda !== undefined) dbUpdates.moeda = updates.moeda;

    const { error } = await supabase.from('income_entries').update(dbUpdates).eq('id', id);
    if (error) console.error('Error updating income entry:', error);
  }, []);

  const handleAddIncomeEntry = useCallback(async (status: 'Entrada' | 'Futuros') => {
    const newEntry = {
      valor: 0,
      descricao: '',
      data: new Date().toISOString().split('T')[0],
      pessoa: 'Gabriel',
      status: status,
    };

    const { data, error } = await supabase.from('income_entries').insert(newEntry).select().single();
    if (error) {
      console.error('Error adding income entry:', error);
      toast.error('Erro ao adicionar entrada');
    } else if (data) {
      setIncomeEntries(prev => [{
        id: data.id,
        valor: Number(data.valor),
        descricao: data.descricao,
        data: data.data,
        pessoa: data.pessoa as 'Gabriel' | 'Myrelle',
        status: data.status as 'Entrada' | 'Futuros',
        tags: (data as any).tags || [],
        notas: (data as any).notas || null,
        moeda: ((data as any).moeda || 'BRL') as Currency,
      }, ...prev]);
    }
  }, []);

  const handleDeleteIncomeEntry = useCallback(async (id: string) => {
    setIncomeEntries(prev => prev.filter(entry => entry.id !== id));
    const { error } = await supabase.from('income_entries').delete().eq('id', id);
    if (error) console.error('Error deleting income entry:', error);
  }, []);

  // Expense category handlers
  const handleUpdateExpenseCategory = useCallback(async (id: string, updates: Partial<ExpenseCategory>) => {
    setExpenseCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat));
    
    const dbUpdates: Record<string, unknown> = {};
    if (updates.categoria !== undefined) dbUpdates.categoria = updates.categoria;
    if (updates.total !== undefined) dbUpdates.total = updates.total;
    if (updates.pago !== undefined) dbUpdates.pago = updates.pago;
    if (updates.faltaPagar !== undefined) dbUpdates.falta_pagar = updates.faltaPagar;
    if (updates.pessoa !== undefined) dbUpdates.pessoa = updates.pessoa;
    if (updates.vencimento !== undefined) dbUpdates.vencimento = updates.vencimento;
    if (updates.metaOrcamento !== undefined) dbUpdates.meta_orcamento = updates.metaOrcamento;
    if (updates.notas !== undefined) dbUpdates.notas = updates.notas;
    if (updates.moeda !== undefined) dbUpdates.moeda = updates.moeda;

    const { error } = await supabase.from('expense_categories').update(dbUpdates).eq('id', id);
    if (error) console.error('Error updating expense category:', error);
  }, []);

  const handleAddExpenseCategory = useCallback(async () => {
    const newCategory = {
      categoria: '',
      total: 0,
      pago: 0,
      falta_pagar: 0,
      pessoa: 'Ambos',
    };

    const { data, error } = await supabase.from('expense_categories').insert(newCategory).select().single();
    if (error) {
      console.error('Error adding expense category:', error);
      toast.error('Erro ao adicionar categoria');
    } else if (data) {
      setExpenseCategories(prev => [{
        id: data.id,
        categoria: data.categoria,
        total: Number(data.total),
        pago: Number(data.pago),
        faltaPagar: Number(data.falta_pagar),
        metaOrcamento: (data as any).meta_orcamento ? Number((data as any).meta_orcamento) : null,
        vencimento: (data as any).vencimento || null,
        notas: (data as any).notas || null,
        pessoa: ((data as any).pessoa || 'Ambos') as 'Gabriel' | 'Myrelle' | 'Ambos',
        moeda: ((data as any).moeda || 'BRL') as Currency,
      }, ...prev]);
    }
  }, []);

  const handleDeleteExpenseCategory = useCallback(async (id: string) => {
    setExpenseCategories(prev => prev.filter(cat => cat.id !== id));
    const { error } = await supabase.from('expense_categories').delete().eq('id', id);
    if (error) console.error('Error deleting expense category:', error);
  }, []);

  // Investment handlers
  const handleUpdateInvestment = useCallback(async (id: string, updates: Partial<Investment>) => {
    setInvestments(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
    
    const dbUpdates: Record<string, unknown> = {};
    if (updates.categoria !== undefined) dbUpdates.categoria = updates.categoria;
    if (updates.valor !== undefined) dbUpdates.valor = updates.valor;
    if (updates.moeda !== undefined) dbUpdates.moeda = updates.moeda;

    const { error } = await supabase.from('investments').update(dbUpdates).eq('id', id);
    if (error) console.error('Error updating investment:', error);
  }, []);

  const handleAddInvestment = useCallback(async () => {
    const newInvestment = {
      categoria: '',
      valor: 0,
    };

    const { data, error } = await supabase.from('investments').insert(newInvestment).select().single();
    if (error) {
      console.error('Error adding investment:', error);
      toast.error('Erro ao adicionar investimento');
    } else if (data) {
      setInvestments(prev => [{
        id: data.id,
        categoria: data.categoria,
        valor: Number(data.valor),
        moeda: ((data as any).moeda || 'BRL') as Currency,
      }, ...prev]);
    }
  }, []);

  const handleDeleteInvestment = useCallback(async (id: string) => {
    setInvestments(prev => prev.filter(inv => inv.id !== id));
    const { error } = await supabase.from('investments').delete().eq('id', id);
    if (error) console.error('Error deleting investment:', error);
  }, []);

  // Meta handler
  const handleMetaChange = useCallback(async (value: number) => {
    setMetaEntradas(value);
    
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'meta_entradas', value }, { onConflict: 'key' });
    
    if (error) console.error('Error updating meta:', error);
  }, []);

  // Save all data (manual sync)
  const handleSaveData = useCallback(async () => {
    setIsSaving(true);
    try {
      toast.success('Dados sincronizados!', {
        description: 'Todas as alterações já estão salvas automaticamente.',
      });
    } finally {
      setTimeout(() => setIsSaving(false), 1000);
    }
  }, []);

  // Import data from Excel
  const handleImportData = useCallback(async (data: {
    incomeEntries: IncomeEntry[];
    expenseCategories: ExpenseCategory[];
    investments: Investment[];
    metaEntradas: number;
  }) => {
    try {
      // Update local state IMMEDIATELY and ATOMICALLY before DB operations
      // This ensures UI shows all new values at the same time
      setIncomeEntries(data.incomeEntries);
      setExpenseCategories(data.expenseCategories);
      setInvestments(data.investments);
      setMetaEntradas(data.metaEntradas);

      // Delete all existing data first
      await Promise.all([
        supabase.from('income_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('expense_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('investments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      ]);

      // Insert new data and get the real IDs back
      let newIncomeEntries: IncomeEntry[] = [];
      let newExpenseCategories: ExpenseCategory[] = [];
      let newInvestments: Investment[] = [];

      const insertPromises: Promise<void>[] = [];

      if (data.incomeEntries.length > 0) {
        const incomeData = data.incomeEntries.map(e => ({
          valor: e.valor,
          descricao: e.descricao,
          data: e.data || '',
          pessoa: e.pessoa,
          status: e.status,
        }));
        const incomePromise = (async () => {
          const { data: inserted } = await supabase.from('income_entries').insert(incomeData).select();
          if (inserted) {
            newIncomeEntries = inserted.map(e => ({
              id: e.id,
              valor: Number(e.valor),
              descricao: e.descricao,
              data: e.data,
              pessoa: e.pessoa as 'Gabriel' | 'Myrelle',
              status: e.status as 'Entrada' | 'Futuros',
              tags: (e as any).tags || [],
              notas: (e as any).notas || null,
              moeda: ((e as any).moeda || 'BRL') as Currency,
            }));
          }
        })();
        insertPromises.push(incomePromise);
      }

      if (data.expenseCategories.length > 0) {
        const expenseData = data.expenseCategories.map(c => ({
          categoria: c.categoria,
          total: c.total,
          pago: c.pago,
          falta_pagar: c.faltaPagar,
        }));
        const expensePromise = (async () => {
          const { data: inserted } = await supabase.from('expense_categories').insert(expenseData).select();
          if (inserted) {
            newExpenseCategories = inserted.map(c => ({
              id: c.id,
              categoria: c.categoria,
              total: Number(c.total),
              pago: Number(c.pago),
              faltaPagar: Number(c.falta_pagar),
              metaOrcamento: (c as any).meta_orcamento ? Number((c as any).meta_orcamento) : null,
              vencimento: (c as any).vencimento || null,
              notas: (c as any).notas || null,
              pessoa: ((c as any).pessoa || 'Ambos') as 'Gabriel' | 'Myrelle' | 'Ambos',
              moeda: ((c as any).moeda || 'BRL') as Currency,
            }));
          }
        })();
        insertPromises.push(expensePromise);
      }

      if (data.investments.length > 0) {
        const investData = data.investments.map(i => ({
          categoria: i.categoria,
          valor: i.valor,
        }));
        const investPromise = (async () => {
          const { data: inserted } = await supabase.from('investments').insert(investData).select();
          if (inserted) {
            newInvestments = inserted.map(i => ({
              id: i.id,
              categoria: i.categoria,
              valor: Number(i.valor),
              moeda: ((i as any).moeda || 'BRL') as Currency,
            }));
          }
        })();
        insertPromises.push(investPromise);
      }

      // Update meta
      const metaPromise = (async () => {
        await supabase
          .from('app_settings')
          .upsert({ key: 'meta_entradas', value: data.metaEntradas }, { onConflict: 'key' });
      })();
      insertPromises.push(metaPromise);

      // Wait for all inserts to complete
      await Promise.all(insertPromises);

      // Update state with real IDs from database (atomically)
      setIncomeEntries(newIncomeEntries.length > 0 ? newIncomeEntries : []);
      setExpenseCategories(newExpenseCategories.length > 0 ? newExpenseCategories : []);
      setInvestments(newInvestments.length > 0 ? newInvestments : []);

      toast.success('Dados importados com sucesso!');
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Erro ao importar dados');
      // Refetch on error to restore correct state
      await fetchData();
    }
  }, [fetchData]);

  return {
    incomeEntries,
    expenseCategories,
    investments,
    metaEntradas,
    isLoading,
    isSaving,
    appConfig,
    handleUpdateIncomeEntry,
    handleAddIncomeEntry,
    handleDeleteIncomeEntry,
    handleUpdateExpenseCategory,
    handleAddExpenseCategory,
    handleDeleteExpenseCategory,
    handleUpdateInvestment,
    handleAddInvestment,
    handleDeleteInvestment,
    handleMetaChange,
    handleSaveData,
    handleImportData,
    handleTitleChange,
    handleSubtitleChange,
    handleTaxaCambioChange,
    handleSpreadChange,
    handleDarkModeChange,
    handleTargetDateChange,
    handleCounterTitleChange,
    handleCounterBackgroundChange,
  };
};
