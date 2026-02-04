import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OnboardingData {
  id?: string;
  user_id: string;
  has_completed_onboarding: boolean;
  destination_country: string | null;
  destination_city: string | null;
  travel_date: string | null;
  financial_goal: number | null;
  monthly_income_estimate: number | null;
  monthly_expense_estimate: number | null;
  goal_description: string | null;
}

export const useOnboarding = () => {
  const { user } = useAuth();
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Fetch onboarding status
  const fetchOnboarding = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching onboarding:', error);
        setIsLoading(false);
        return;
      }

      if (data) {
        setOnboardingData(data as OnboardingData);
        setNeedsOnboarding(!data.has_completed_onboarding);
      } else {
        // No onboarding record exists, user needs to complete onboarding
        setNeedsOnboarding(true);
        setOnboardingData(null);
      }
    } catch (error) {
      console.error('Error fetching onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOnboarding();
  }, [fetchOnboarding]);

  // Save onboarding data
  const saveOnboarding = useCallback(async (data: Partial<OnboardingData>) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { data: existing } = await supabase
        .from('user_onboarding')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('user_onboarding')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating onboarding:', error);
          return { error };
        }
      } else {
        // Insert new record
        const { error } = await supabase
          .from('user_onboarding')
          .insert({
            user_id: user.id,
            ...data,
          });

        if (error) {
          console.error('Error inserting onboarding:', error);
          return { error };
        }
      }

      await fetchOnboarding();
      return { error: null };
    } catch (error) {
      console.error('Error saving onboarding:', error);
      return { error: error as Error };
    }
  }, [user, fetchOnboarding]);

  // Complete onboarding and set up initial dashboard
  const completeOnboarding = useCallback(async (data: Partial<OnboardingData>) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      // Save onboarding data
      const result = await saveOnboarding({
        ...data,
        has_completed_onboarding: true,
      });

      if (result.error) {
        return result;
      }

      // Set up counter config with travel date and destination
      if (data.travel_date || data.destination_city || data.destination_country) {
        const destination = data.destination_city 
          ? `${data.destination_city}${data.destination_country ? ', ' + data.destination_country : ''}`
          : data.destination_country || '';
        
        const counterTitle = destination ? `Contagem para ${destination}` : '';

        const { data: existingCounter } = await supabase
          .from('user_counter_config')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        const counterData = {
          target_date: data.travel_date || '',
          counter_title: counterTitle,
          counter_background: 'ocean',
          counter_icon: 'plane',
          counter_color: 'blue',
        };

        if (existingCounter) {
          await supabase
            .from('user_counter_config')
            .update(counterData)
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('user_counter_config')
            .insert({
              user_id: user.id,
              ...counterData,
            });
        }
      }

      // Set income goal if provided
      if (data.financial_goal) {
        await supabase
          .from('app_settings')
          .upsert({
            key: 'meta_entradas',
            value: data.financial_goal,
          }, { onConflict: 'key' });
      }

      setNeedsOnboarding(false);
      return { error: null };
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return { error: error as Error };
    }
  }, [user, saveOnboarding]);

  // Skip onboarding
  const skipOnboarding = useCallback(async () => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const result = await saveOnboarding({
        has_completed_onboarding: true,
      });

      if (!result.error) {
        // Still set default counter config for new users
        const { data: existingCounter } = await supabase
          .from('user_counter_config')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!existingCounter) {
          await supabase
            .from('user_counter_config')
            .insert({
              user_id: user.id,
              target_date: '',
              counter_title: '',
              counter_background: 'ocean',
              counter_icon: 'plane',
              counter_color: 'blue',
            });
        }

        setNeedsOnboarding(false);
      }

      return result;
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      return { error: error as Error };
    }
  }, [user, saveOnboarding]);

  return {
    onboardingData,
    isLoading,
    needsOnboarding,
    saveOnboarding,
    completeOnboarding,
    skipOnboarding,
    refetch: fetchOnboarding,
  };
};
