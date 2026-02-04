import { useState } from 'react';
import { Search, Filter, X, Calendar, DollarSign, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EntryStatus, EntryTag } from '@/types/financial';
import { TagSelector } from './TagBadge';
import { PersonFilterSelect } from './PersonFilterSelect';
import { cn } from '@/lib/utils';

export interface FilterState {
  search: string;
  person: string;
  status: EntryStatus | 'all';
  tags: EntryTag[];
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  valueMin: number | undefined;
  valueMax: number | undefined;
}

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  showStatusFilter?: boolean;
}

export const defaultFilters: FilterState = {
  search: '',
  person: 'all',
  status: 'all',
  tags: [],
  dateFrom: undefined,
  dateTo: undefined,
  valueMin: undefined,
  valueMax: undefined,
};

export function FilterBar({ filters, onFiltersChange, showStatusFilter = true }: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasActiveFilters = 
    filters.search !== '' ||
    filters.person !== 'all' ||
    filters.status !== 'all' ||
    filters.tags.length > 0 ||
    filters.dateFrom !== undefined ||
    filters.dateTo !== undefined ||
    filters.valueMin !== undefined ||
    filters.valueMax !== undefined;
  
  const clearFilters = () => {
    onFiltersChange(defaultFilters);
  };
  
  const toggleTag = (tag: EntryTag) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  return (
    <div className="space-y-3">
      {/* Main Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            placeholder="Buscar por descrição..."
            className="pl-9 h-9"
          />
        </div>
        
        <Button
          variant={isExpanded ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2 h-9"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="bg-primary-foreground text-primary px-1.5 py-0.5 rounded-full text-xs">
              !
            </span>
          )}
        </Button>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>
      
      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 rounded-lg border bg-muted/30 space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Person Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Pessoa
              </label>
              <PersonFilterSelect
                value={filters.person}
                onChange={(v) => onFiltersChange({ ...filters, person: v })}
              />
            </div>
            
            {/* Status Filter */}
            {showStatusFilter && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select 
                  value={filters.status} 
                  onValueChange={(v) => onFiltersChange({ ...filters, status: v as EntryStatus | 'all' })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Entrada">Entrada</SelectItem>
                    <SelectItem value="Futuros">Futuros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Date From */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Data Início
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal h-9',
                      !filters.dateFrom && 'text-muted-foreground'
                    )}
                  >
                    {filters.dateFrom ? format(filters.dateFrom, 'dd/MM/yyyy') : 'Selecionar...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => onFiltersChange({ ...filters, dateFrom: date })}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Date To */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Data Fim
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal h-9',
                      !filters.dateTo && 'text-muted-foreground'
                    )}
                  >
                    {filters.dateTo ? format(filters.dateTo, 'dd/MM/yyyy') : 'Selecionar...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => onFiltersChange({ ...filters, dateTo: date })}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Value Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Valor Mínimo
              </label>
              <Input
                type="number"
                value={filters.valueMin ?? ''}
                onChange={(e) => onFiltersChange({ 
                  ...filters, 
                  valueMin: e.target.value ? Number(e.target.value) : undefined 
                })}
                placeholder="R$ 0,00"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Valor Máximo
              </label>
              <Input
                type="number"
                value={filters.valueMax ?? ''}
                onChange={(e) => onFiltersChange({ 
                  ...filters, 
                  valueMax: e.target.value ? Number(e.target.value) : undefined 
                })}
                placeholder="R$ 999.999"
                className="h-9"
              />
            </div>
          </div>
          
          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Tags</label>
            <TagSelector selectedTags={filters.tags} onToggleTag={toggleTag} />
          </div>
        </div>
      )}
    </div>
  );
}
