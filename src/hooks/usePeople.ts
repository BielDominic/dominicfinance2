import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardPerson {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  display_order: number;
}

export function usePeople() {
  const [people, setPeople] = useState<DashboardPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPeople = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('dashboard_people')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching people:', error);
    } else {
      setPeople((data || []) as DashboardPerson[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPeople();

    const channel = supabase
      .channel('people_sync_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_people' }, fetchPeople)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPeople]);

  // Get all person names (including "Ambos")
  const personNames = people.map(p => p.name);

  // Get individual people (excluding "Ambos")
  const individualPeople = people.filter(p => p.name !== 'Ambos');

  // Get the count for division calculations
  const peopleCount = individualPeople.length || 1;

  // Get color for a person name
  const getPersonColor = useCallback((personName: string) => {
    const person = people.find(p => p.name === personName);
    return person?.color || '#6366f1';
  }, [people]);

  // Check if a person name exists
  const personExists = useCallback((personName: string) => {
    return people.some(p => p.name === personName);
  }, [people]);

  return {
    people,
    personNames,
    individualPeople,
    peopleCount,
    isLoading,
    getPersonColor,
    personExists,
    refetch: fetchPeople,
  };
}

// Smaller hook for components that only need person names for selects
export function usePersonOptions() {
  const [options, setOptions] = useState<{ value: string; label: string; color: string }[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      const { data } = await supabase
        .from('dashboard_people')
        .select('name, color')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (data) {
        setOptions(data.map(p => ({ value: p.name, label: p.name, color: p.color })));
      }
    };

    fetchOptions();

    const channel = supabase
      .channel('person_options_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_people' }, fetchOptions)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return options;
}
