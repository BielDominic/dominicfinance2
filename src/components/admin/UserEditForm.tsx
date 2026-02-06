import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, User, Mail, Phone, MapPin, UserCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UserEditFormProps {
  user: {
    id: string;
    username: string;
    display_name: string | null;
    email: string;
    full_name?: string | null;
    phone?: string | null;
    city?: string | null;
  };
  currentAdminId: string;
  onSaved?: () => void;
}

export function UserEditForm({ user, currentAdminId, onSaved }: UserEditFormProps) {
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [fullName, setFullName] = useState(user.full_name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [city, setCity] = useState(user.city || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Get the profile id first
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, display_name, full_name, phone, city')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const oldValues = {
        display_name: profile.display_name,
        full_name: profile.full_name,
        phone: profile.phone,
        city: profile.city,
      };

      const newValues = {
        display_name: displayName.trim() || null,
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
      };

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update(newValues)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Log changes to profile_change_history
      const changedFields: { field: string; old: string | null; new: string | null }[] = [];
      
      if (oldValues.display_name !== newValues.display_name) {
        changedFields.push({ field: 'display_name', old: oldValues.display_name, new: newValues.display_name });
      }
      if (oldValues.full_name !== newValues.full_name) {
        changedFields.push({ field: 'full_name', old: oldValues.full_name, new: newValues.full_name });
      }
      if (oldValues.phone !== newValues.phone) {
        changedFields.push({ field: 'phone', old: oldValues.phone, new: newValues.phone });
      }
      if (oldValues.city !== newValues.city) {
        changedFields.push({ field: 'city', old: oldValues.city, new: newValues.city });
      }

      // Insert change history records
      if (changedFields.length > 0) {
        const historyRecords = changedFields.map(change => ({
          profile_id: profile.id,
          changed_by: currentAdminId,
          field_name: change.field,
          old_value: change.old,
          new_value: change.new,
        }));

        await supabase.from('profile_change_history').insert(historyRecords);

        // Also log to audit_logs
        await supabase.from('audit_logs').insert({
          user_id: currentAdminId,
          action: 'ADMIN_UPDATE_PROFILE',
          table_name: 'profiles',
          record_id: user.id,
          old_values: oldValues,
          new_values: newValues,
        });
      }

      toast.success('Perfil atualizado com sucesso');
      onSaved?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4" />
          Editar Informações
        </CardTitle>
        <CardDescription className="text-xs">
          Altere as informações básicas do usuário
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="displayName" className="text-xs flex items-center gap-1">
              <User className="h-3 w-3" /> Nome de Exibição
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Como aparece no sistema"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs flex items-center gap-1">
              <UserCircle className="h-3 w-3" /> Nome Completo
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nome completo"
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs flex items-center gap-1">
              <Phone className="h-3 w-3" /> Telefone
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-xs flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Cidade
            </Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Cidade"
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3 w-3" />
          <span>Email: {user.email}</span>
          <span className="text-[10px]">(não editável)</span>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full" size="sm">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </CardContent>
    </Card>
  );
}
