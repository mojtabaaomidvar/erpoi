// src/views/clients/components/ClientList.tsx
import { Button, Badge, Avatar } from '../../../design-system';
import { useTheme } from '../../../contexts/ThemeContext';
import type { Client, Contract } from '../../../types/contract';

interface ClientListProps {
  clients: Client[];
  filteredClients: Client[];
  contracts: Contract[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filter: 'ALL' | 'LEGAL' | 'INDIVIDUAL';
  setFilter: (filter: 'ALL' | 'LEGAL' | 'INDIVIDUAL') => void;
  clientCounts: { total: number; legal: number; individual: number };
  sortBy: 'name' | 'contracts' | 'value';
  setSortBy: (sort: 'name' | 'contracts' | 'value') => void;
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
  onAddClick: () => void;
  onExport: () => void;
}

export function ClientList({
  clients,
  filteredClients,
  contracts,
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
  clientCounts,
  sortBy,
  setSortBy,
  selectedClient,
  setSelectedClient,
  onAddClick,
  onExport,
}: ClientListProps) {
  const { isDark } = useTheme();

  return (
    <div className={`col-span-1 lg:col-span-4 relative flex flex-col rounded-xl panel-3d overflow-hidden transition-all duration-300 ease-in-out max-h-[50vh] lg:max-h-none ${
      isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200/70'
    }`}>
      {/* Header */}
      <div className={`relative z-10 border-b px-4 py-4 space-y-3 ${
        isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'
      }`}>
        {/* Search & Sort */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, ..."
              className="w-full rounded-lg py-2 pl-9 pr-8 text-sm input-themed"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'contracts' | 'value')}
              className={`appearance-none text-xs rounded-md border pl-2 pr-6 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer ${
                isDark ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <option value="contracts">Most Contracts</option>
              <option value="value">Highest Value</option>
              <option value="name">Name (A-Z)</option>
            </select>
            <span className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>▼</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={`flex gap-1 rounded-lg border p-0.5 text-xs ${
          isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
        }`}>
          {(['ALL', 'LEGAL', 'INDIVIDUAL'] as const).map((t) => {
            const count = t === 'ALL' ? clientCounts.total : t === 'LEGAL' ? clientCounts.legal : clientCounts.individual;
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`flex-1 rounded-md px-2 py-1.5 font-medium transition-all ${
                  filter === t
                    ? (isDark 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 border border-indigo-500' 
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200')
                    : (isDark 
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')
                }`}
              >
                {t === 'ALL' ? `All (${count})` : t === 'LEGAL' ? `🏢 Legal (${count})` : `👤 Individual (${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Client List */}
      <div className="flex-1 overflow-y-auto pb-24">
        {filteredClients.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-2">🔍</div>
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>No clients found</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={`flex items-center gap-3 px-4 py-3 border-b cursor-pointer transition-colors ${
                isDark ? 'border-slate-700' : 'border-slate-100'
              } ${
                selectedClient?.id === client.id
                  ? (isDark ? 'bg-indigo-900/30 border-l-4 border-l-indigo-400' : 'bg-indigo-50 border-l-4 border-l-indigo-500')
                  : (isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50')
              }`}
            >
              <Avatar name={client.name_en} gradient={client.logoColor} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{client.name_en}</div>
                <div className={`text-xs truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`} dir="rtl">{client.name_fa}</div>
                <div className="flex items-center gap-2 mt-1">
                  {filter === 'ALL' && (
                    <Badge tone={client.type === 'LEGAL' ? 'indigo' : 'violet'}>
                      {client.type === 'LEGAL' ? 'Legal' : 'Individual'}
                    </Badge>
                  )}
                  {(() => {
                    const realCount = contracts.filter(c => c.client_id === client.id).length;
                    return (
                      <Badge tone="slate" className="font-semibold text-[10px]">
                        {realCount} {realCount === 1 ? 'Agreement' : 'Agreements'}
                      </Badge>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Gradient Fade */}
      <div className={`absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t pointer-events-none z-10 ${
        isDark 
          ? 'from-slate-900 via-slate-900/95 to-slate-900/0' 
          : 'from-white via-white/95 to-white/0'
      }`} />
      
      {/* Action Buttons */}
      <div className="absolute bottom-5 left-0 right-0 px-4 z-20 flex gap-2">
        <Button 
          variant="primary" 
          size="md" 
          onClick={onAddClick} 
          className={`flex-1 justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 ${
            isDark 
              ? 'border border-indigo-400/30 shadow-[0_8px_24px_rgba(99,102,241,0.4)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.6)]' 
              : 'shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30'
          }`}
        >
          <span>➕</span> Add New Client
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={onExport}
          className={`transition-all duration-300 hover:-translate-y-0.5 ${
            isDark 
              ? 'border border-slate-700 shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)]' 
              : 'shadow-lg shadow-slate-300/50 hover:shadow-xl hover:shadow-slate-400/50'
          }`}
          title="Export to Excel"
        >
          📥
        </Button>
      </div>
    </div>
  );
}