import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceConfig {
  enabled: boolean;
  message: string;
}

export function useMaintenanceMode() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('system_config')
          .select('config_value')
          .eq('config_key', 'maintenance_mode')
          .maybeSingle();

        if (data && !error) {
          const config = data.config_value as unknown as MaintenanceConfig;
          setIsMaintenanceMode(config?.enabled || false);
          setMaintenanceMessage(config?.message || 'O sistema está em manutenção. Tente novamente mais tarde.');
        }
      } catch (error) {
        console.error('Error fetching maintenance status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaintenanceStatus();

    // Subscribe to changes
    const channel = supabase
      .channel('maintenance_mode_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'system_config',
        filter: 'config_key=eq.maintenance_mode',
      }, (payload) => {
        if (payload.new && 'config_value' in payload.new) {
          const config = payload.new.config_value as MaintenanceConfig;
          setIsMaintenanceMode(config?.enabled || false);
          setMaintenanceMessage(config?.message || 'O sistema está em manutenção. Tente novamente mais tarde.');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleMaintenanceMode = async (enabled: boolean, message?: string) => {
    try {
      const config = JSON.parse(JSON.stringify({
        enabled,
        message: message || 'O sistema está em manutenção. Tente novamente mais tarde.',
      }));

      const { error } = await supabase
        .from('system_config')
        .update({ config_value: config })
        .eq('config_key', 'maintenance_mode');

      if (error) throw error;

      setIsMaintenanceMode(enabled);
      if (message) setMaintenanceMessage(message);

      return { error: null };
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      return { error };
    }
  };

  return {
    isMaintenanceMode,
    maintenanceMessage,
    isLoading,
    toggleMaintenanceMode,
  };
}
