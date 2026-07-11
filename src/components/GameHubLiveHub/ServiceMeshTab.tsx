import React, { useState } from 'react';
import { MicroserviceInfo } from './types';
import { GAMEHUB_LIVEHUB_MICROSERVICES } from './servicesData';
import { 
  Network, 
  Database, 
  Activity, 
  Terminal, 
  Lock, 
  Cpu, 
  Layers, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Zap,
  Globe,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { playSound } from '../../utils/audio';

export const ServiceMeshTab: React.FC = () => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('gamehub-core');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const selectedService = GAMEHUB_LIVEHUB_MICROSERVICES.find(s => s.id === selectedServiceId) || GAMEHUB_LIVEHUB_MICROSERVICES[0];

  const filteredServices = GAMEHUB_LIVEHUB_MICROSERVICES.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'core': return 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-400';
      case 'gameplay': return 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400';
      case 'social': return 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-400';
      case 'media': return 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400';
      case 'security': return 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const selectService = (id: string) => {
    playSound.click();
    setSelectedServiceId(id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Sidebar: 16 Microservices Grid */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-1.5">
              <Network className="w-4 h-4 text-indigo-500" />
              Service Mesh ({GAMEHUB_LIVEHUB_MICROSERVICES.length} Microsserviços)
            </h3>
            <span className="text-[10px] font-mono bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-black uppercase">
              Isolated Databases
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            Arquitetura desacoplada onde cada serviço possui seu próprio banco dedicado. A comunicação ocorre exclusivamente através de chamadas internas via Service Mesh de gRPC/REST.
          </p>

          {/* Search and Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar microsserviço..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {['all', 'core', 'gameplay', 'social', 'media', 'security'].map(cat => (
                <button
                  key={cat}
                  onClick={() => { playSound.click(); setCategoryFilter(cat); }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all border cursor-pointer ${
                    categoryFilter === cat 
                      ? 'bg-slate-800 dark:bg-indigo-600 text-white border-slate-800 dark:border-indigo-600' 
                      : 'bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List of services */}
        <div className="space-y-2 overflow-y-auto max-h-[500px] pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {filteredServices.map(service => {
            const isSelected = service.id === selectedServiceId;
            return (
              <button
                key={service.id}
                onClick={() => selectService(service.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected 
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50/50 dark:from-indigo-950/30 dark:to-slate-900 border-indigo-300 dark:border-indigo-500/50 shadow-md shadow-indigo-100/10 scale-[1.01]' 
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${getCategoryColor(service.category)}`}>
                      {service.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold">
                      {service.version}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {service.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate mt-0.5">
                    {service.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <div className="text-right">
                    <div className="text-[10px] font-mono font-bold text-emerald-500 flex items-center gap-1 justify-end">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      {service.telemetry.rps} RPS
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                      {service.telemetry.latencyMs}ms latency
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-transform ${isSelected ? 'rotate-90 text-indigo-500' : ''}`} />
                </div>
              </button>
            );
          })}

          {filteredServices.length === 0 && (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
              Nenhum microsserviço encontrado.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Architectural Deep Dive Inspector */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Service Core Card */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-150 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-50 uppercase tracking-tight">
                  {selectedService.name}
                </h2>
                <span className="text-[10px] font-mono font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> SLA {selectedService.sla}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {selectedService.description}
              </p>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 dark:text-slate-500 self-start sm:self-center bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-150 dark:border-slate-800">
              <Server className="w-3.5 h-3.5 text-indigo-500" />
              <span>{selectedService.telemetry.replicas} Replicas</span>
            </div>
          </div>

          {/* Telemetry Panel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-150 dark:border-slate-800/80">
              <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" /> Taxa de Requisições
              </div>
              <div className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono mt-1">
                {selectedService.telemetry.rps.toLocaleString()} RPS
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-150 dark:border-slate-800/80">
              <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1">
                <Activity className="w-3 h-3 text-indigo-500" /> Latência Média
              </div>
              <div className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono mt-1">
                {selectedService.telemetry.latencyMs} ms
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-150 dark:border-slate-800/80">
              <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1">
                <Cpu className="w-3 h-3 text-indigo-500" /> Uso de CPU
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5 mb-1">
                <div className="bg-indigo-500 h-full" style={{ width: `${selectedService.telemetry.cpu}%` }} />
              </div>
              <div className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                {selectedService.telemetry.cpu}%
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-150 dark:border-slate-800/80">
              <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1">
                <Cpu className="w-3 h-3 text-emerald-500" /> Memória RAM
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5 mb-1">
                <div className="bg-emerald-500 h-full" style={{ width: `${(selectedService.telemetry.ram / 2048) * 100}%` }} />
              </div>
              <div className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                {selectedService.telemetry.ram} MB
              </div>
            </div>
          </div>

          {/* Clean Architecture Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500" />
              Design de DDD &amp; Clean Architecture ( SOLID )
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/40 rounded-xl space-y-1.5">
                <span className="text-[10px] font-mono font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
                  1. Entities Layer
                </span>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Regras de negócio corporativas imutáveis e entidades puras de domínio.</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedService.cleanArchitecture.entities.map(ent => (
                    <span key={ent} className="text-[9px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold">
                      {ent}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-purple-50/20 dark:bg-purple-950/10 border border-purple-100/50 dark:border-purple-900/40 rounded-xl space-y-1.5">
                <span className="text-[10px] font-mono font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block">
                  2. Use Cases (Application)
                </span>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Fluxos de orquestração de domínio que executam regras de caso de uso específico.</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedService.cleanArchitecture.useCases.map(uc => (
                    <span key={uc} className="text-[9px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold">
                      {uc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-teal-50/20 dark:bg-teal-950/10 border border-teal-100/50 dark:border-teal-900/40 rounded-xl space-y-1.5">
                <span className="text-[10px] font-mono font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest block">
                  3. Adapters &amp; Controllers
                </span>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Contratos de infraestrutura, adaptadores de repositório e interfaces de comunicação.</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedService.cleanArchitecture.adapters.map(ad => (
                    <span key={ad} className="text-[9px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold">
                      {ad}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Database Isolation Section (Ensuring no direct multi-db reads) */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-150 dark:border-slate-800">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-500" />
              Banco de Dados Isolado (Database Isolation)
            </h3>
            <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-bold border border-indigo-150 dark:border-indigo-900">
              {selectedService.database.engine}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong className="text-indigo-600 dark:text-indigo-400">Garantia DDD:</strong> {selectedService.database.description} Nenhum outro módulo tem permissão de ler ou escrever nesta tabela diretamente. Toda integração de dados é realizada de forma assíncrona orientada a eventos ou via chamadas RPC autenticadas.
          </p>

          <div className="bg-slate-900 dark:bg-black rounded-xl p-3.5 overflow-x-auto border border-slate-800 font-mono text-[10px] text-slate-300 leading-relaxed scrollbar-thin">
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-600 border-b border-slate-800 pb-1.5 mb-2">
              <span>DATABASE SCHEMATICS CODE BLOCK</span>
              <span className="text-[8px] tracking-widest text-indigo-400 uppercase">ReadOnly</span>
            </div>
            <pre className="whitespace-pre">{selectedService.database.schema}</pre>
          </div>
        </div>

        {/* Versioned API Endpoints Section */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-3">
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-indigo-500" />
            Contrato de API Versionado (Endpoints REST / gRPC)
          </h3>

          <div className="space-y-2.5">
            {selectedService.endpoints.map((endpoint, idx) => (
              <div 
                key={idx} 
                className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 p-3 rounded-xl flex flex-col md:flex-row md:items-start justify-between gap-3 font-mono text-[11px]"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded font-mono ${
                      endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' :
                      endpoint.method === 'POST' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                      endpoint.method === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                    }`}>
                      {endpoint.method}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {endpoint.path}
                    </span>
                  </div>
                  <p className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-1">
                    {endpoint.description}
                  </p>
                </div>

                {endpoint.input && (
                  <div className="flex flex-col gap-1 text-[9px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-2 rounded-lg max-w-xs shrink-0 text-slate-400">
                    <span className="font-sans font-bold text-slate-500 dark:text-slate-300">Payload input:</span>
                    <code className="text-indigo-500 dark:text-indigo-400">{endpoint.input}</code>
                    <span className="font-sans font-bold text-slate-500 dark:text-slate-300 mt-1">Payload output:</span>
                    <code className="text-emerald-500 dark:text-emerald-400">{endpoint.output}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
