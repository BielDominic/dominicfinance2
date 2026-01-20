import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IncomeEntry, ExpenseCategory, Investment } from '@/types/financial';
import { toast } from 'sonner';

export const useFinancialData = () => {
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [metaEntradas, setMetaEntradas] = useState(35000);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
        })));
      }

      if (expenseRes.data) {
        setExpenseCategories(expenseRes.data.map(c => ({
          id: c.id,
          categoria: c.categoria,
          total: Number(c.total),
          pago: Number(c.pago),
          faltaPagar: Number(c.falta_pagar),
        })));
      }

      if (investRes.data) {
        setInvestments(investRes.data.map(i => ({
          id: i.id,
          categoria: i.categoria,
          valor: Number(i.valor),
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

    return () => {
      supabase.removeChannel(incomeChannel);
      supabase.removeChannel(expenseChannel);
      supabase.removeChannel(investChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, [fetchData]);

  // Income entry handlers
  const handleUpdateIncomeEntry = useCallback(async (id: string, updates: Partial<IncomeEntry>) => {
    setIncomeEntries(prev => prev.map(entry => entry.id === id ? { ...entry, ...updates } : entry));
    
    const dbUpdates: Record<string, unknown> = {};
    if (updates.valor !== undefined) dbUpdates.valor = updates.valor;
    if (updates.descricao !== undefined) dbUpdates.descricao = updates.descricao;
    if (updates.data !== undefined) dbUpdates.data = updates.data;
    if (updates.pessoa !== undefined) dbUpdates.pessoa = updates.pessoa;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

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
      setIncomeEntries(prev => [...prev, {
        id: data.id,
        valor: Number(data.valor),
        descricao: data.descricao,
        data: data.data,
        pessoa: data.pessoa as 'Gabriel' | 'Myrelle',
        status: data.status as 'Entrada' | 'Futuros',
      }]);
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

    const { error } = await supabase.from('expense_categories').update(dbUpdates).eq('id', id);
    if (error) console.error('Error updating expense category:', error);
  }, []);

  const handleAddExpenseCategory = useCallback(async () => {
    const newCategory = {
      categoria: '',
      total: 0,
      pago: 0,
      falta_pagar: 0,
    };

    const { data, error } = await supabase.from('expense_categories').insert(newCategory).select().single();
    if (error) {
      console.error('Error adding expense category:', error);
      toast.error('Erro ao adicionar categoria');
    } else if (data) {
      setExpenseCategories(prev => [...prev, {
        id: data.id,
        categoria: data.categoria,
        total: Number(data.total),
        pago: Number(data.pago),
        faltaPagar: Number(data.falta_pagar),
      }]);
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
      setInvestments(prev => [...prev, {
        id: data.id,
        categoria: data.categoria,
        valor: Number(data.valor),
      }]);
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
      // Delete all existing data first
      await Promise.all([
        supabase.from('income_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('expense_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('investments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      ]);

      // Insert new data
      if (data.incomeEntries.length > 0) {
        const incomeData = data.incomeEntries.map(e => ({
          valor: e.valor,
          descricao: e.descricao,
          data: e.data || '',
          pessoa: e.pessoa,
          status: e.status,
        }));
        await supabase.from('income_entries').insert(incomeData);
      }

      if (data.expenseCategories.length > 0) {
        const expenseData = data.expenseCategories.map(c => ({
          categoria: c.categoria,
          total: c.total,
          pago: c.pago,
          falta_pagar: c.faltaPagar,
        }));
        await supabase.from('expense_categories').insert(expenseData);
      }

      if (data.investments.length > 0) {
        const investData = data.investments.map(i => ({
          categoria: i.categoria,
          valor: i.valor,
        }));
        await supabase.from('investments').insert(investData);
      }

      // Update meta
      await supabase
        .from('app_settings')
        .upsert({ key: 'meta_entradas', value: data.metaEntradas }, { onConflict: 'key' });

      // Refetch data
      await fetchData();
      toast.success('Dados importados com sucesso!');
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Erro ao importar dados');
    }
  }, [fetchData]);

  return {
    incomeEntries,
    expenseCategories,
    investments,
    metaEntradas,
    isLoading,
    isSaving,
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
  };
};
