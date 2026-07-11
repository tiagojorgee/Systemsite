import React, { useState } from 'react';
import { PlayerStats } from '../types';
import { ServiceMeshTab } from './GameHubLiveHub/ServiceMeshTab';
import { EventBusTab } from './GameHubLiveHub/EventBusTab';
import { TournamentTab } from './GameHubLiveHub/TournamentTab';
import { StreamingTab } from './GameHubLiveHub/StreamingTab';
import { PartyTab } from './GameHubLiveHub/PartyTab';
import { SecurityTab } from './GameHubLiveHub/SecurityTab';
import { PresenceTab } from './GameHubLiveHub/PresenceTab';
import { StatsTab } from './GameHubLiveHub/StatsTab';
import { 
  Network, 
  Workflow, 
  Trophy, 
  Tv, 
  Users, 
  ShieldAlert, 
  Layers, 
  Database, 
  SlidersHorizontal,
  Sparkles,
  Zap,
  Activity,
  UserCheck,
  TrendingUp
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface GameHubLiveHubProps {
  stats: PlayerStats;
  updateStats: (newStats: Partial<PlayerStats>) => void;
  addCoins: (amount: number) => void;
}

type ActiveSubTab = 'presence' | 'mesh' | 'eventbus' | 'tournaments' | 'streaming' | 'party' | 'security' | 'stats';

export const GameHubLiveHub: React.FC<GameHubLiveHubProps> = ({
  stats,
  updateStats,
  addCoins
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ActiveSubTab>('presence');

  const handleSubTabChange = (tab: ActiveSubTab) => {
    playSound.click();
    setActiveSubTab(tab);
  };

  const addPoints = (amount: number) => {
    const currentPoints = stats.points ?? 0;
    const nextPoints = currentPoints + amount;
    
    // Simple level progression calculation (1000 points per level)
    const nextLevel = Math.floor(nextPoints / 1000) + 1;
    
    updateStats({
      points: nextPoints,
      level: nextLevel
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Module Jumbotron Branding */}
      <div className="relative overflow-hidden bg-slate-950 text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Glow ambient effects */}
        <div className="absolute -top-10 -left-10 w-44 h-44 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 max-w-2xl z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-md border border-indigo-500/35 font-bold tracking-wider">
              Arquitetura Empresarial
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-md border border-purple-500/35 font-bold tracking-wider">
              DDD &amp; SOLID
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/35 font-bold tracking-wider">
              Escala de Milhões 🚀
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase">
            GameHub &amp; LiveHub Core Architectures
          </h2>
          
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">
            Módulo avançado de serviços corporativos em nuvem do ecossistema <strong className="text-indigo-400 uppercase">GameZon</strong>. Projetado sob princípios de Clean Architecture, Microsserviços desacoplados com Banco de Dados Isolado e Barramento Event-Driven reativo de alta velocidade.
          </p>
        </div>

        {/* Global Cluster Status Indicators */}
        <div className="grid grid-cols-2 gap-3 shrink-0 z-10 w-full md:w-auto font-mono text-[10px]">
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <span className="text-slate-500 uppercase block font-sans font-bold">Capacidade de Ingestão</span>
            <div className="text-sm font-black text-emerald-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              100% OK
            </div>
            <span className="text-[9px] text-slate-500">Global Cluster Nodes</span>
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <span className="text-slate-500 uppercase block font-sans font-bold">Barramento de Mensagens</span>
            <div className="text-sm font-black text-indigo-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              7.2 M/seg
            </div>
            <span className="text-[9px] text-slate-500">Active Queue backlogs</span>
          </div>
        </div>
      </div>

      {/* Central Sub-tab navigation menu */}
      <div className="flex items-center justify-start gap-1.5 overflow-x-auto scrollbar-none pb-2 border-b border-slate-200 dark:border-slate-800 -mx-3 px-3 md:mx-0 md:px-0 flex-nowrap">
        <button
          onClick={() => handleSubTabChange('presence')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
            activeSubTab === 'presence'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white border border-slate-900 dark:border-indigo-600 scale-[1.01] shadow-sm font-black ring-2 ring-indigo-500/20'
              : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>Presença Global &amp; Social Hub</span>
        </button>

        <button
          onClick={() => handleSubTabChange('mesh')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
            activeSubTab === 'mesh'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white border border-slate-900 dark:border-indigo-600 scale-[1.01] shadow-sm'
              : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Service Mesh &amp; Clean Architecture ( SOLID )</span>
        </button>

        <button
          onClick={() => handleSubTabChange('eventbus')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
            activeSubTab === 'eventbus'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white border border-slate-900 dark:border-indigo-600 scale-[1.01] shadow-sm'
              : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          <Workflow className="w-3.5 h-3.5" />
          <span>Simulador Event Bus ( EDA )</span>
        </button>

        <button
          onClick={() => handleSubTabChange('tournaments')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
            activeSubTab === 'tournaments'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white border border-slate-900 dark:border-indigo-600 scale-[1.01] shadow-sm'
              : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Torneios &amp; Matchmaking Arena</span>
        </button>

        <button
          onClick={() => handleSubTabChange('streaming')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
            activeSubTab === 'streaming'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white border border-slate-900 dark:border-indigo-600 scale-[1.01] shadow-sm'
              : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Transmissões &amp; Replay Studio</span>
        </button>

        <button
          onClick={() => handleSubTabChange('party')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
            activeSubTab === 'party'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white border border-slate-900 dark:border-indigo-600 scale-[1.01] shadow-sm'
              : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Equipes &amp; Voz (Party Lobbies)</span>
        </button>

        <button
          onClick={() => handleSubTabChange('security')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
            activeSubTab === 'security'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white border border-slate-900 dark:border-indigo-600 scale-[1.01] shadow-sm'
              : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Filtro de IA &amp; Anti-Cheat</span>
        </button>

        <button
          onClick={() => handleSubTabChange('stats')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
            activeSubTab === 'stats'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white border border-slate-900 dark:border-indigo-600 scale-[1.01] shadow-sm font-black ring-2 ring-indigo-500/20'
              : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          <span>Estatísticas &amp; Analytics Hub (Real-Time)</span>
        </button>
      </div>

      {/* Main Tab Rendering Block */}
      <div className="transition-all duration-300">
        {activeSubTab === 'presence' && <PresenceTab />}
        {activeSubTab === 'mesh' && <ServiceMeshTab />}
        {activeSubTab === 'eventbus' && <EventBusTab />}
        {activeSubTab === 'tournaments' && (
          <TournamentTab 
            playerCoins={stats.coins}
            addCoins={addCoins}
            playerLevel={stats.level ?? 1}
            addPoints={addPoints}
          />
        )}
        {activeSubTab === 'streaming' && <StreamingTab />}
        {activeSubTab === 'party' && <PartyTab />}
        {activeSubTab === 'security' && <SecurityTab />}
        {activeSubTab === 'stats' && <StatsTab />}
      </div>

    </div>
  );
};
