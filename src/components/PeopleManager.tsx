import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Loader2, ChevronDown, ChevronUp, GripVertical, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardPerson {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  display_order: number;
}

interface PeopleManagerProps {
  onPeopleChange?: (people: DashboardPerson[]) => void;
}

const COLORS = [
  '#3b82f6', // blue
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export function PeopleManager({ onPeopleChange }: PeopleManagerProps) {
  const { user } = useAuth();
  const [people, setPeople] = useState<DashboardPerson[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchPeople();

    const channel = supabase
      .channel('people_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_people' }, () => {
        fetchPeople();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPeople = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('dashboard_people')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching people:', error);
    } else {
      const peopleData = (data || []) as DashboardPerson[];
      setPeople(peopleData);
      onPeopleChange?.(peopleData);
    }
    setIsLoading(false);
  };

  const addPerson = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }
    
    if (!newName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    const maxOrder = Math.max(...people.map(p => p.display_order), 0);

    const { error } = await supabase.from('dashboard_people').insert({
      name: newName.trim(),
      color: newColor,
      display_order: maxOrder + 1,
      user_id: user.id,
    });

    if (error) {
      toast.error('Erro ao adicionar pessoa');
      console.error(error);
    } else {
      toast.success('Pessoa adicionada!');
      setNewName('');
      setNewColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
      setIsAdding(false);
      fetchPeople();
    }
  };

  const deletePerson = async () => {
    if (!deleteId) return;

    // Check if it's "Ambos" - can't delete
    const person = people.find(p => p.id === deleteId);
    if (person?.name === 'Ambos') {
      toast.error('Não é possível excluir "Ambos"');
      setDeleteId(null);
      return;
    }

    const { error } = await supabase
      .from('dashboard_people')
      .update({ is_active: false })
      .eq('id', deleteId);

    if (error) {
      toast.error('Erro ao excluir pessoa');
    } else {
      toast.success('Pessoa removida');
      fetchPeople();
    }
    setDeleteId(null);
  };

  const getActiveCount = () => people.filter(p => p.name !== 'Ambos').length;

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Pessoas do Dashboard
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{getActiveCount()} pessoas</Badge>
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gerencie as pessoas que participam do planejamento financeiro. 
              Custos marcados como "Ambos" serão divididos igualmente entre todas as pessoas.
            </p>

            {/* Add Person Form */}
            <div className="space-y-3">
              {!isAdding ? (
                <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Pessoa
                </Button>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <Input
                      placeholder="Nome da pessoa *"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addPerson();
                        if (e.key === 'Escape') setIsAdding(false);
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Cor:</span>
                      <div className="flex gap-1">
                        {COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewColor(color)}
                            className={`w-6 h-6 rounded-full transition-transform ${newColor === color ? 'scale-125 ring-2 ring-offset-2 ring-primary' : 'hover:scale-110'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addPerson} className="flex-1">
                        <Check className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                      <Button variant="outline" onClick={() => setIsAdding(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
              </div>
            )}
          </div>

            {/* People List */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : people.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma pessoa cadastrada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {people.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: person.color }}
                      />
                      <span className="font-medium">{person.name}</span>
                      {person.name === 'Ambos' && (
                        <Badge variant="outline" className="text-xs">Compartilhado</Badge>
                      )}
                    </div>

                    {person.name !== 'Ambos' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        onClick={() => setDeleteId(person.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t text-xs text-muted-foreground">
              <p>💡 Dica: Quando uma despesa é marcada como "Ambos", o valor será dividido igualmente entre {getActiveCount()} pessoas no resumo.</p>
            </div>
          </CardContent>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remover Pessoa"
        description="Tem certeza que deseja remover esta pessoa do dashboard? Os dados associados serão mantidos."
        onConfirm={deletePerson}
      />
    </>
  );
}

// Hook to get people count for division calculations
export function usePeopleCount() {
  const [count, setCount] = useState(2); // default 2 people
  const [people, setPeople] = useState<DashboardPerson[]>([]);

  useEffect(() => {
    const fetchPeople = async () => {
      const { data } = await supabase
        .from('dashboard_people')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (data) {
        const peopleData = data as DashboardPerson[];
        setPeople(peopleData);
        // Count excluding "Ambos"
        setCount(peopleData.filter(p => p.name !== 'Ambos').length || 1);
      }
    };

    fetchPeople();

    const channel = supabase
      .channel('people_count_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_people' }, fetchPeople)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { count, people };
}
