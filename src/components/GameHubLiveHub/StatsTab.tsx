import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Gamepad2, 
  Tv, 
  Code, 
  ShieldAlert, 
  Clock, 
  Flame, 
  User, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Eye, 
  Heart, 
  Zap, 
  RefreshCw, 
  Play, 
  Activity, 
  Award, 
  FileText, 
  Filter, 
  Settings, 
  SlidersHorizontal,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  Download,
  Share2,
  Trash2,
  Lock,
  UserCheck
} from 'lucide-react';
import { playSound } from '../../utils/audio';

// Role Types
type StatsRole = 'player' | 'creator' | 'developer' | 'admin';

// Interface definitions for high-fidelity state tracking
interface PlayerStatsData {
  playtimeHours: number;
  playtimeMins: number;
  playtimeSecs: number;
  matches: number;
  wins: number;
  losses: number;
  kills: number;
  assists: number;
  objectives: number;
  achievementsCount: number;
  xp: number;
  level: number;
  eventsCount: number;
  replaysCount: number;
}

interface CreatorStatsData {
  livesCount: number;
  replaysSaved: number;
  views: number;
  likes: number;
  followers: number;
  engagementRate: number; // calculated engagement e.g. 8.4%
  revenueBrl: number;
}

interface DeveloperStatsData {
  averageSessionTimeMins: number;
  retentionDay1: number;
  retentionDay7: number;
  retentionDay30: number;
  apiRequestsPerSec: number;
  latencyMs: number;
  serverUsagePercent: number;
  errorRatePercent: number;
}

interface AdminStatsData {
  grossPlatformRevenueBrl: number;
  totalActiveUsers: number;
  antiCheatScans: number;
  antiCheatBans: number;
  moderationBans: number;
  moderationTimeouts: number;
  spamFiltersTriggered: number;
  systemUptimePercent: number;
}

export const StatsTab: React.FC = () => {
  const [activeRole, setActiveRole] = useState<StatsRole>('player');
  const [isSimulatingLive, setIsSimulatingLive] = useState<boolean>(true);
  const [simulationSpeedMs, setSimulationSpeedMs] = useState<number>(3000); // interval for updates
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- 1. STATE INSTANCES (Covering all requested metrics) ---
  const [playerStats, setPlayerStats] = useState<PlayerStatsData>({
    playtimeHours: 142,
    playtimeMins: 45,
    playtimeSecs: 12,
    matches: 284,
    wins: 168,
    losses: 116,
    kills: 1420,
    assists: 980,
    objectives: 345,
    achievementsCount: 14,
    xp: 8450,
    level: 9,
    eventsCount: 12,
    replaysCount: 45
  });

  const [creatorStats, setCreatorStats] = useState<CreatorStatsData>({
    livesCount: 38,
    replaysSaved: 38,
    views: 45200,
    likes: 12840,
    followers: 3450,
    engagementRate: 8.4,
    revenueBrl: 2845.50
  });

  const [developerStats, setDeveloperStats] = useState<DeveloperStatsData>({
    averageSessionTimeMins: 42.8,
    retentionDay1: 68.4,
    retentionDay7: 42.1,
    retentionDay30: 24.5,
    apiRequestsPerSec: 1240,
    latencyMs: 14,
    serverUsagePercent: 62,
    errorRatePercent: 0.08
  });

  const [adminStats, setAdminStats] = useState<AdminStatsData>({
    grossPlatformRevenueBrl: 48920.45,
    totalActiveUsers: 14205,
    antiCheatScans: 894520,
    antiCheatBans: 142,
    moderationBans: 58,
    moderationTimeouts: 312,
    spamFiltersTriggered: 1420,
    systemUptimePercent: 99.98
  });

  // Log Feed States per Role (to give absolute structural honesty & high quality feedback)
  const [playerLogs, setPlayerLogs] = useState<string[]>([
    "Partida terminada em Retro Speed Racer: Vitória! (+350 XP)",
    "Conquista desbloqueada: 'As do Asfalto' - Complete 100 drifts impecáveis.",
    "Registrado Replay #45 automaticamente da transmissão ao vivo.",
    "Inscrição confirmada no Evento Especial 'Copa Neón Retro'."
  ]);

  const [creatorLogs, setCreatorLogs] = useState<string[]>([
    "Live finalizada com sucesso! Replay salvo e arquivado automaticamente.",
    "Clipe criado por Lady_Gamer: 'Double Kill espetacular na curva 4'.",
    "Pico de audiência registrado: 452 espectadores simultâneos.",
    "Novo assinante: Valkyrae_Pro assinou seu canal! (+R$ 14,90)"
  ]);

  const [developerLogs, setDeveloperLogs] = useState<string[]>([
    "Métrica de retenção Day-7 recalibrada com base em 14.205 amostras.",
    "Sinal de telemetria recebido do nó 'us-east-1a' - Latência de 14ms.",
    "API Gateway processou com sucesso 1.240 req/s.",
    "Análise de tempo médio de sessão ajustada para 42.8 min."
  ]);

  const [adminLogs, setAdminLogs] = useState<string[]>([
    "Auditoria Global: Antivírus integrado Heurístico bloqueou tentativa de injeção de dll.",
    "Moderador baniu usuário 'hacker_neon99' por speedhack detectado automaticamente.",
    "Filtro Anti-Spam ativado: 4 mensagens repetitivas bloqueadas no chat geral.",
    "Relatório financeiro gerado com receita líquida crescendo +14.2% ao dia."
  ]);

  // Charting Data (Historical points for redrawing SVG lines and bars dynamically)
  const [historicalData, setHistoricalData] = useState<{
    playerKda: { match: number; kills: number; assists: number; deaths: number }[];
    creatorViews: { day: string; views: number; revenue: number }[];
    developerLatency: { time: string; latency: number; rps: number }[];
    adminUsers: { hour: string; active: number; bans: number }[];
  }>({
    playerKda: [
      { match: 1, kills: 3, assists: 2, deaths: 1 },
      { match: 2, kills: 5, assists: 1, deaths: 2 },
      { match: 3, kills: 2, assists: 4, deaths: 0 },
      { match: 4, kills: 6, assists: 3, deaths: 3 },
      { match: 5, kills: 8, assists: 5, deaths: 1 }
    ],
    creatorViews: [
      { day: "Seg", views: 2400, revenue: 150 },
      { day: "Ter", views: 3200, revenue: 210 },
      { day: "Qua", views: 2800, revenue: 180 },
      { day: "Qui", views: 4100, revenue: 320 },
      { day: "Sex", views: 5600, revenue: 450 },
      { day: "Sáb", views: 7200, revenue: 680 },
      { day: "Dom", views: 6500, revenue: 590 }
    ],
    developerLatency: [
      { time: "10:00", latency: 15, rps: 1120 },
      { time: "11:00", latency: 12, rps: 1180 },
      { time: "12:00", latency: 18, rps: 1350 },
      { time: "13:00", latency: 14, rps: 1240 },
      { time: "14:00", latency: 13, rps: 1290 }
    ],
    adminUsers: [
      { hour: "08:00", active: 11200, bans: 1 },
      { hour: "10:00", active: 12400, bans: 3 },
      { hour: "12:00", active: 13800, bans: 2 },
      { hour: "14:00", active: 14205, bans: 0 },
      { hour: "16:00", active: 13900, bans: 4 }
    ]
  });

  // Custom Toast Trigger
  const triggerToast = (msg: string) => {
    playSound.click();
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // --- 2. REAL-TIME BACKGROUND SIMULATION ENGINE ---
  useEffect(() => {
    if (!isSimulatingLive) return;

    const interval = setInterval(() => {
      // 1. Simular estatísticas do Jogador
      setPlayerStats(prev => {
        // Incrementa segundos
        let nextSecs = prev.playtimeSecs + Math.floor(Math.random() * 30) + 10;
        let nextMins = prev.playtimeMins;
        let nextHours = prev.playtimeHours;

        if (nextSecs >= 60) {
          nextMins += Math.floor(nextSecs / 60);
          nextSecs = nextSecs % 60;
        }
        if (nextMins >= 60) {
          nextHours += Math.floor(nextMins / 60);
          nextMins = nextMins % 60;
        }

        const addedXp = Math.floor(Math.random() * 25);
        let nextXp = prev.xp + addedXp;
        let nextLevel = prev.level;
        if (nextXp >= nextLevel * 1000) {
          nextXp -= nextLevel * 1000;
          nextLevel += 1;
          setTimeout(() => triggerToast(`🎉 REAL-TIME LEVEL UP! Você subiu para o Nível ${nextLevel}!`), 100);
        }

        return {
          ...prev,
          playtimeHours: nextHours,
          playtimeMins: nextMins,
          playtimeSecs: nextSecs,
          xp: nextXp,
          level: nextLevel
        };
      });

      // 2. Simular estatísticas do Criador (views, likes, followers, receita)
      setCreatorStats(prev => {
        const addedViews = Math.floor(Math.random() * 8) + 2;
        const addedLikes = Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 0;
        const addedFollower = Math.random() > 0.85 ? 1 : 0;
        const addedRevenue = Math.random() > 0.7 ? parseFloat((Math.random() * 4.5 + 0.5).toFixed(2)) : 0;

        if (addedFollower > 0) {
          setCreatorLogs(logs => [
            `Novo seguidor em tempo real: piloto_anonimo_${Math.floor(Math.random() * 1000)} começou a te seguir!`,
            ...logs.slice(0, 9)
          ]);
        }
        if (addedRevenue > 0) {
          setCreatorLogs(logs => [
            `Receita em tempo real: doação de R$ ${addedRevenue.toFixed(2)} recebida de fã!`,
            ...logs.slice(0, 9)
          ]);
        }

        return {
          ...prev,
          views: prev.views + addedViews,
          likes: prev.likes + addedLikes,
          followers: prev.followers + addedFollower,
          revenueBrl: parseFloat((prev.revenueBrl + addedRevenue).toFixed(2)),
          engagementRate: parseFloat((8.0 + Math.sin(Date.now() / 50000) * 0.9).toFixed(1))
        };
      });

      // 3. Simular estatísticas do Desenvolvedor (rps, latência, server usage)
      setDeveloperStats(prev => {
        const rpsDelta = Math.floor(Math.random() * 60) - 30;
        const latencyDelta = Math.floor(Math.random() * 4) - 2;
        const errorDelta = Math.random() > 0.9 ? 0.01 : -0.01;

        return {
          ...prev,
          apiRequestsPerSec: Math.max(1000, prev.apiRequestsPerSec + rpsDelta),
          latencyMs: Math.max(8, Math.min(45, prev.latencyMs + latencyDelta)),
          serverUsagePercent: Math.max(40, Math.min(95, prev.serverUsagePercent + (Math.floor(Math.random() * 4) - 2))),
          errorRatePercent: Math.max(0.01, Math.min(1.5, prev.errorRatePercent + errorDelta))
        };
      });

      // 4. Simular estatísticas de Administrador (Receita bruta, usuários online, anti-cheat scans)
      setAdminStats(prev => {
        const addedScans = Math.floor(Math.random() * 15) + 5;
        const userFluctuation = Math.floor(Math.random() * 10) - 5;
        const addedRevenue = parseFloat((Math.random() * 12 + 2).toFixed(2));

        return {
          ...prev,
          antiCheatScans: prev.antiCheatScans + addedScans,
          totalActiveUsers: Math.max(13000, prev.totalActiveUsers + userFluctuation),
          grossPlatformRevenueBrl: parseFloat((prev.grossPlatformRevenueBrl + addedRevenue).toFixed(2)),
          spamFiltersTriggered: prev.spamFiltersTriggered + (Math.random() > 0.95 ? 1 : 0)
        };
      });

    }, simulationSpeedMs);

    return () => clearInterval(interval);
  }, [isSimulatingLive, simulationSpeedMs]);

  // --- 3. INTERACTIVE SIMULATORS (For each role) ---

  // Player Simulator: Play a simulated Match
  const simulatePlayerMatch = () => {
    playSound.jackpot();
    const isWin = Math.random() > 0.5;
    const killsEarned = Math.floor(Math.random() * 12) + 2;
    const assistsEarned = Math.floor(Math.random() * 15) + 1;
    const objectivesEarned = Math.floor(Math.random() * 4) + 1;
    const xpEarned = isWin ? 500 : 200;

    setPlayerStats(prev => {
      let nextXp = prev.xp + xpEarned;
      let nextLevel = prev.level;
      if (nextXp >= nextLevel * 1000) {
        nextXp -= nextLevel * 1000;
        nextLevel += 1;
      }
      return {
        ...prev,
        matches: prev.matches + 1,
        wins: prev.wins + (isWin ? 1 : 0),
        losses: prev.losses + (isWin ? 0 : 1),
        kills: prev.kills + killsEarned,
        assists: prev.assists + assistsEarned,
        objectives: prev.objectives + objectivesEarned,
        xp: nextXp,
        level: nextLevel,
        replaysCount: prev.replaysCount + 1, // Auto-save replay
        eventsCount: prev.eventsCount + (Math.random() > 0.8 ? 1 : 0)
      };
    });

    // Add new KDA data point to historical
    setHistoricalData(prev => {
      const nextKda = [...prev.playerKda.slice(1)];
      nextKda.push({
        match: prev.playerKda[prev.playerKda.length - 1].match + 1,
        kills: killsEarned,
        assists: assistsEarned,
        deaths: Math.floor(Math.random() * 6) + 1
      });
      return { ...prev, playerKda: nextKda };
    });

    setPlayerLogs(logs => [
      `[SIMULADO] Partida finalizada: ${isWin ? 'VITÓRIA' : 'DERROTA'}! KDA: ${killsEarned}/${Math.floor(Math.random() * 5) + 2}/${assistsEarned} (+${xpEarned} XP, Replay Salvo automaticamente)`,
      ...logs.slice(0, 9)
    ]);

    triggerToast(`🎮 Partida Simulada! ${isWin ? 'Vitória gloriosa!' : 'Derrota honrosa...'} +${xpEarned} XP e Replay salvo.`);
  };

  // Creator Simulator: Launch an instant livestream
  const simulateCreatorStream = () => {
    playSound.victory();
    const viewersAdded = Math.floor(Math.random() * 400) + 100;
    const likesAdded = Math.floor(Math.random() * 150) + 50;
    const followersAdded = Math.floor(Math.random() * 30) + 5;
    const revenueAdded = parseFloat((Math.random() * 80 + 20).toFixed(2));

    setCreatorStats(prev => ({
      ...prev,
      livesCount: prev.livesCount + 1,
      replaysSaved: prev.replaysSaved + 1, // automatic replay save
      views: prev.views + viewersAdded,
      likes: prev.likes + likesAdded,
      followers: prev.followers + followersAdded,
      revenueBrl: parseFloat((prev.revenueBrl + revenueAdded).toFixed(2))
    }));

    // Update charts
    setHistoricalData(prev => {
      const nextViews = [...prev.creatorViews.slice(1)];
      nextViews.push({
        day: "Live",
        views: viewersAdded,
        revenue: Math.floor(revenueAdded)
      });
      return { ...prev, creatorViews: nextViews };
    });

    setCreatorLogs(logs => [
      `[SIMULADO] Nova Transmissão Iniciada. Pico de ${viewersAdded} espectadores em 1080p Baixa Latência. Replay de encerramento agendado.`,
      `[SIMULADO] Doação recebida durante a transmissão: R$ ${revenueAdded.toFixed(2)}`,
      ...logs.slice(0, 9)
    ]);

    triggerToast(`📺 Transmissão gerada! +${viewersAdded} visualizações, +${likesAdded} curtidas e replay salvo.`);
  };

  // Developer Simulator: Force high-stress database API workload test
  const simulateDevWorkload = () => {
    playSound.click();
    
    setDeveloperStats(prev => ({
      ...prev,
      apiRequestsPerSec: prev.apiRequestsPerSec + 800,
      latencyMs: prev.latencyMs + 18,
      serverUsagePercent: 92,
      errorRatePercent: 0.45
    }));

    setDeveloperLogs(logs => [
      `[SIMULADO] Teste de Carga de API iniciado: +800 requisições/s simuladas no Banco de Dados.`,
      `[SIMULADO] Latência disparou para 32ms. Utilização de CPU do Servidor atingiu 92%.`,
      ...logs.slice(0, 9)
    ]);

    // Update charts
    setHistoricalData(prev => {
      const nextDev = [...prev.developerLatency.slice(1)];
      nextDev.push({
        time: "Stress",
        latency: 32,
        rps: 2040
      });
      return { ...prev, developerLatency: nextDev };
    });

    triggerToast(`⚡ Teste de Estresse de API iniciado! RPS elevado e uso de CPU em 92%.`);

    // Cooldown back to normal after 5 seconds
    setTimeout(() => {
      setDeveloperStats(prev => ({
        ...prev,
        apiRequestsPerSec: Math.max(1200, prev.apiRequestsPerSec - 800),
        latencyMs: Math.max(12, prev.latencyMs - 15),
        serverUsagePercent: 65,
        errorRatePercent: 0.07
      }));
      setDeveloperLogs(logs => [
        `[SISTEMA] Teste de Carga encerrado. Auto-scaling provisionou novos containers de réplica. Latência normalizada.`,
        ...logs
      ]);
    }, 4500);
  };

  // Admin Simulator: Ban a hacker (Anti-Cheat integration demo)
  const simulateAdminBan = () => {
    playSound.click();
    
    setAdminStats(prev => ({
      ...prev,
      antiCheatBans: prev.antiCheatBans + 1,
      moderationBans: prev.moderationBans + 1,
      totalActiveUsers: prev.totalActiveUsers - 1
    }));

    const randomName = `x_cheater_neon_${Math.floor(Math.random() * 90) + 10}`;

    setAdminLogs(logs => [
      `[SIMULADO] Anti-Cheat Heurístico detectou modificador de memória no usuário ${randomName}.`,
      `[MODERAÇÃO] Usuário ${randomName} BANIDO permanentemente com auditoria de logs gravada no banco.`,
      ...logs.slice(0, 9)
    ]);

    triggerToast(`🛡️ Jogador Suspeito banido! Conta ${randomName} desativada pelo Anti-Cheat.`);
  };

  return (
    <div className="bg-slate-900/60 dark:bg-slate-950/80 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
      
      {/* Upper Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-48 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-48 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Title & Speed controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-[10px] uppercase font-bold tracking-wider">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            <span>Módulo de Estatísticas &amp; Telemetria em Tempo Real</span>
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight uppercase flex items-center gap-2 mt-1 font-sans">
            Global Analytics Engine
            <span className="text-[10px] normal-case bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
              Live Feed Ativo
            </span>
          </h3>
        </div>

        {/* Real-time simulation settings */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 border border-slate-800 p-2 rounded-2xl shrink-0">
          <div className="flex items-center gap-2 px-2.5 text-xs text-slate-400 font-medium border-r border-slate-800">
            <Activity className={`w-3.5 h-3.5 ${isSimulatingLive ? 'text-emerald-400 animate-spin' : 'text-slate-500'}`} style={{ animationDuration: '3s' }} />
            <span>Simulador Telemetria</span>
          </div>

          <button
            onClick={() => {
              setIsSimulatingLive(!isSimulatingLive);
              playSound.click();
            }}
            className={`px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition-colors ${
              isSimulatingLive 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
          >
            {isSimulatingLive ? 'Pausar Real-Time' : 'Retomar Real-Time'}
          </button>

          {isSimulatingLive && (
            <select
              value={simulationSpeedMs}
              onChange={(e) => {
                setSimulationSpeedMs(Number(e.target.value));
                playSound.click();
              }}
              className="bg-slate-900 text-slate-300 text-[10px] font-mono font-bold border border-slate-800 rounded-lg px-2 py-1 outline-none cursor-pointer hover:border-slate-700"
            >
              <option value="1500">Velocidade: Alta (1.5s)</option>
              <option value="3000">Velocidade: Média (3s)</option>
              <option value="6000">Velocidade: Baixa (6s)</option>
            </select>
          )}
        </div>
      </div>

      {/* Dynamic Role Navigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        <button
          onClick={() => {
            setActiveRole('player');
            playSound.click();
          }}
          className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
            activeRole === 'player'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-500 shadow-lg shadow-indigo-500/10'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <div className="text-left">
            <span className="block text-[8px] opacity-70 uppercase font-mono tracking-tight font-black">Área do Usuário</span>
            <span className="block font-bold">1. Jogador (Player)</span>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveRole('creator');
            playSound.click();
          }}
          className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
            activeRole === 'creator'
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-500 shadow-lg shadow-purple-500/10'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Tv className="w-4 h-4" />
          <div className="text-left">
            <span className="block text-[8px] opacity-70 uppercase font-mono tracking-tight font-black">Área de Conteúdo</span>
            <span className="block font-bold">2. Criador (Creator)</span>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveRole('developer');
            playSound.click();
          }}
          className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
            activeRole === 'developer'
              ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white border-cyan-500 shadow-lg shadow-cyan-500/10'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Code className="w-4 h-4" />
          <div className="text-left">
            <span className="block text-[8px] opacity-70 uppercase font-mono tracking-tight font-black">Engenharia API</span>
            <span className="block font-bold">3. Desenvolvedor</span>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveRole('admin');
            playSound.click();
          }}
          className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
            activeRole === 'admin'
              ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white border-rose-500 shadow-lg shadow-rose-500/10'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <div className="text-left">
            <span className="block text-[8px] opacity-70 uppercase font-mono tracking-tight font-black">Governança global</span>
            <span className="block font-bold">4. Administrador</span>
          </div>
        </button>
      </div>

      {/* Notification Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 rounded-xl text-xs font-semibold flex items-center justify-between"
          >
            <span>{toastMessage}</span>
            <span className="text-[10px] bg-emerald-800 text-white px-1.5 py-0.5 rounded font-mono uppercase">Tempo real</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ROLE VIEWPORT SWITCHER --- */}
      <AnimatePresence mode="wait">
        
        {/* ==================== 1. PLAYER VIEWPORT ==================== */}
        {activeRole === 'player' && (
          <motion.div
            key="player-viewport"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* Playtime Display & Top Level Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block font-bold">Tempo Total Jogado</span>
                <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
                  {playerStats.playtimeHours}<span className="text-xs text-slate-500">h</span>
                  {playerStats.playtimeMins}<span className="text-xs text-slate-500">m</span>
                  {playerStats.playtimeSecs}<span className="text-xs text-slate-500">s</span>
                </div>
                <div className="text-[10px] text-indigo-400 font-semibold">Simulando incremento constante</div>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block font-bold">Histórico de Partidas</span>
                <div className="text-2xl font-black text-white font-mono flex items-baseline gap-2">
                  {playerStats.matches}
                  <span className="text-[11px] text-emerald-400 font-bold">{playerStats.wins}V</span>
                  <span className="text-[11px] text-rose-400 font-bold">{playerStats.losses}D</span>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">Taxa de Vitória: {((playerStats.wins / (playerStats.matches || 1)) * 100).toFixed(1)}%</div>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block font-bold">Desempenho de Combate (KDA)</span>
                <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
                  {playerStats.kills}<span className="text-xs text-slate-500">K</span>
                  <span className="text-slate-500 text-sm">/</span>
                  {playerStats.assists}<span className="text-xs text-slate-500">A</span>
                </div>
                <div className="text-[10px] text-cyan-400 font-semibold">Média KDA: {((playerStats.kills + playerStats.assists) / (playerStats.losses || 1)).toFixed(2)}</div>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block font-bold">XP Acumulada &amp; Nível</span>
                <div className="text-2xl font-black text-white font-mono flex items-center justify-between">
                  <span>Lvl {playerStats.level}</span>
                  <span className="text-xs text-indigo-400 font-bold">{playerStats.xp} XP</span>
                </div>
                {/* Level progress bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${(playerStats.xp / (playerStats.level * 1000)) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Middle Section: Interactivity & Stats breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Interactive Match Simulator */}
              <div className="lg:col-span-4 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400">Ambiente Interativo de Simulação</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Clique abaixo para simular que você acabou de jogar uma partida na arena. O sistema irá registrar estatísticas de combate, acumular XP, atualizar o gráfico de KDA e <strong>gerar/salvar um Replay automaticamente</strong>.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-[10px] font-mono space-y-1.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Replays Gravados:</span>
                    <strong className="text-indigo-400">{playerStats.replaysCount} salvos</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Eventos Atendidos:</span>
                    <strong className="text-amber-400">{playerStats.eventsCount} eventos</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Objetivos Conquistados:</span>
                    <strong className="text-emerald-400">{playerStats.objectives} bandeiras/bosses</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Conquistas Desbloqueadas:</span>
                    <strong className="text-purple-400">{playerStats.achievementsCount} medalhas</strong>
                  </div>
                </div>

                <button
                  onClick={simulatePlayerMatch}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10 transition-colors"
                >
                  <Gamepad2 className="w-4 h-4 text-indigo-200" />
                  <span>Simular Partida Jogada (+XP &amp; Replay)</span>
                </button>
              </div>

              {/* Dynamic KDA Chart (SVG-based for optimal speed and zero compatibility issues) */}
              <div className="lg:col-span-5 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400">Evolução do KDA por Partida</h4>
                  <span className="text-[9px] font-mono text-slate-500">Últimas 5 partidas</span>
                </div>

                {/* SVG Line & Bar Chart combined */}
                <div className="relative h-44 w-full bg-slate-900/50 border border-slate-850 rounded-xl p-2 flex items-end justify-between gap-2 overflow-hidden">
                  
                  {/* Grid background lines */}
                  <div className="absolute inset-x-0 top-1/4 border-b border-slate-800/40 pointer-events-none" />
                  <div className="absolute inset-x-0 top-2/4 border-b border-slate-800/40 pointer-events-none" />
                  <div className="absolute inset-x-0 top-3/4 border-b border-slate-800/40 pointer-events-none" />

                  {/* Render Columns */}
                  {historicalData.playerKda.map((k, idx) => {
                    const maxVal = 15;
                    const killHeight = Math.min(100, (k.kills / maxVal) * 100);
                    const assistHeight = Math.min(100, (k.assists / maxVal) * 100);
                    const deathHeight = Math.min(100, (k.deaths / maxVal) * 100);

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                        
                        {/* Interactive tooltip */}
                        <div className="absolute bottom-full mb-1 bg-slate-950 text-[9px] font-mono text-slate-300 p-2 rounded border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity z-10 w-28 text-center shadow-xl">
                          <p className="font-bold text-white text-[10px]">Partida #{k.match}</p>
                          <p className="text-emerald-400">Kills: {k.kills}</p>
                          <p className="text-cyan-400">Assists: {k.assists}</p>
                          <p className="text-rose-400">Deaths: {k.deaths}</p>
                        </div>

                        {/* Visual Bars Side-by-side */}
                        <div className="flex items-end gap-1 w-full h-3/4 justify-center">
                          {/* Kill Bar */}
                          <div 
                            style={{ height: `${killHeight}%` }} 
                            className="w-2.5 bg-emerald-500 rounded-t-sm shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:bg-emerald-400 transition-all"
                          />
                          {/* Assist Bar */}
                          <div 
                            style={{ height: `${assistHeight}%` }} 
                            className="w-2.5 bg-cyan-500 rounded-t-sm shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:bg-cyan-400 transition-all"
                          />
                          {/* Death Bar */}
                          <div 
                            style={{ height: `${deathHeight}%` }} 
                            className="w-2.5 bg-rose-500 rounded-t-sm shadow-[0_0_10px_rgba(244,63,94,0.2)] hover:bg-rose-400 transition-all"
                          />
                        </div>

                        {/* Label */}
                        <span className="text-[9px] font-mono text-slate-500 mt-2">P {k.match}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Chart Legend */}
                <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-slate-400">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                    <span>Vitórias / Kills</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 bg-cyan-500 rounded-sm" />
                    <span>Assistências</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 bg-rose-500 rounded-sm" />
                    <span>Derrotas / Mortes</span>
                  </div>
                </div>
              </div>

              {/* Player Logs Console Feed */}
              <div className="lg:col-span-3 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400">Logs de Atividade</h4>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {playerLogs.map((log, idx) => (
                    <div key={idx} className="p-2 bg-slate-900 border border-slate-850 rounded-lg text-[10px] font-mono text-slate-300 leading-snug">
                      <span className="text-indigo-400 mr-1">●</span> {log}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ==================== 2. CREATOR VIEWPORT ==================== */}
        {activeRole === 'creator' && (
          <motion.div
            key="creator-viewport"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* Creator Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block font-bold">Total de Livestreams</span>
                <div className="text-2xl font-black text-white font-mono flex items-baseline gap-2">
                  {creatorStats.livesCount}
                  <span className="text-[10px] uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">SAVED REPLAY</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Todo replay é salvo automaticamente no encerramento.
                </p>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block font-bold">Espectadores Totais</span>
                <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
                  {creatorStats.views.toLocaleString()}<span className="text-xs text-slate-500">views</span>
                </div>
                <div className="text-[10px] text-purple-400 font-semibold">Taxa Engajamento: {creatorStats.engagementRate}%</div>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block font-bold">Seguidores e Likes</span>
                <div className="text-2xl font-black text-white font-mono flex items-baseline gap-2">
                  <span>{creatorStats.followers.toLocaleString()}</span>
                  <span className="text-xs text-rose-400 font-bold">♥ {creatorStats.likes.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">Crescimento constante live</div>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block font-bold">Receita Estimada (BRL)</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  R$ {creatorStats.revenueBrl.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold">Inscrições e Doações de Bits</div>
              </div>
            </div>

            {/* Middle Controls & Audiences Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Creator Interactive Simulation Trigger */}
              <div className="lg:col-span-4 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400">Simulador de Transmissão</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Inicie uma transmissão fictícia de alta performance. O simulador flutuará o número de espectadores em tempo real, gerará clipes dos melhores momentos e salvará as gravações de forma resiliente contra falhas de sistema.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-[10px] font-mono space-y-1.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Replays no Banco:</span>
                    <strong className="text-purple-400">{creatorStats.replaysSaved} guardados</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Melhores Clipes:</span>
                    <strong className="text-emerald-400">{Math.floor(creatorStats.livesCount * 2.5)} gerados</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Qualidade de Ingestão:</span>
                    <strong className="text-indigo-400">1080p60 Baixa Latência</strong>
                  </div>
                </div>

                <button
                  onClick={simulateCreatorStream}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/10 transition-colors"
                >
                  <Tv className="w-4 h-4 text-purple-200" />
                  <span>Simular Transmissão (Auto Replay)</span>
                </button>
              </div>

              {/* Creator Views Chart (SVG-based) */}
              <div className="lg:col-span-5 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400">Audiência Semanal</h4>
                  <span className="text-[9px] font-mono text-slate-500">Visualizações por dia</span>
                </div>

                {/* SVG Curve Line Chart */}
                <div className="relative h-44 w-full bg-slate-900/50 border border-slate-850 rounded-xl p-3 flex items-end justify-between overflow-hidden">
                  
                  {/* Grid lines */}
                  <div className="absolute inset-x-0 top-1/4 border-b border-slate-800/30" />
                  <div className="absolute inset-x-0 top-2/4 border-b border-slate-800/30" />
                  <div className="absolute inset-x-0 top-3/4 border-b border-slate-800/30" />

                  {/* Draw SVG Line */}
                  <svg className="absolute inset-0 w-full h-full p-3 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Path representing viewer growth */}
                    <path 
                      d="M 5,80 Q 20,60 35,70 T 65,40 T 95,20" 
                      fill="none" 
                      stroke="#c084fc" 
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Area under curve */}
                    <path 
                      d="M 5,80 Q 20,60 35,70 T 65,40 T 95,20 L 95,100 L 5,100 Z" 
                      fill="url(#purpleGrad)"
                    />
                  </svg>

                  {/* Days indicators along horizontal axis */}
                  {creatorStats.views && historicalData.creatorViews.map((day, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full relative z-10 group cursor-pointer">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mb-1 group-hover:scale-150 transition-transform" />
                      <span className="text-[9px] font-mono text-slate-500">{day.day}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center text-[10px] text-slate-400 font-mono">
                  📊 Gráfico dinâmico flutuando em sintonia com a simulação.
                </div>
              </div>

              {/* Creator Live Alert Feed */}
              <div className="lg:col-span-3 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400">Notificações e Alertas</h4>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {creatorLogs.map((log, idx) => (
                    <div key={idx} className="p-2 bg-slate-900 border border-slate-850 rounded-lg text-[10px] font-mono text-slate-300 leading-snug">
                      <span className="text-purple-400 mr-1">★</span> {log}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ==================== 3. DEVELOPER VIEWPORT ==================== */}
        {activeRole === 'developer' && (
          <motion.div
            key="developer-viewport"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* Developer telemetry metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block font-bold">Tempo Médio de Sessão</span>
                <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
                  {developerStats.averageSessionTimeMins.toFixed(1)}<span className="text-xs text-slate-500">mins</span>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">Sessão média ativa</div>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block font-bold">Retenção de Jogadores (Cohorts)</span>
                <div className="text-xs font-mono space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span>D1 Retention:</span>
                    <strong className="text-cyan-400">{developerStats.retentionDay1}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>D7 Retention:</span>
                    <strong className="text-indigo-400">{developerStats.retentionDay7}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>D30 Retention:</span>
                    <strong className="text-purple-400">{developerStats.retentionDay30}%</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block font-bold">API Requests Gateway (RPS)</span>
                <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
                  {developerStats.apiRequestsPerSec.toLocaleString()}<span className="text-xs text-slate-500">req/s</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold">Média Latência: {developerStats.latencyMs}ms</div>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block font-bold">Utilização Global do Cluster</span>
                <div className="text-2xl font-black text-white font-mono flex items-baseline justify-between">
                  <span>{developerStats.serverUsagePercent}%</span>
                  <span className="text-xs text-rose-400 font-bold">Error: {developerStats.errorRatePercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${developerStats.serverUsagePercent}%` }} />
                </div>
              </div>
            </div>

            {/* Developer middle layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Interactive Telemetry trigger */}
              <div className="lg:col-span-4 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400">Microservice Stress Simulator</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Injete carga fictícia maciça de consultas assíncronas no barramento de eventos (Event Bus) e observe o auto-scaling escalonar réplicas de microsserviços para conter a latência.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-[10px] font-mono space-y-1.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>SLA do Cluster:</span>
                    <strong className="text-emerald-400">99.9% garantido</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Tamanho de Cache Redis:</span>
                    <strong className="text-cyan-400">2.4 GB ativos</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Threads em Execução:</span>
                    <strong className="text-slate-200">12.500 paralelizadas</strong>
                  </div>
                </div>

                <button
                  onClick={simulateDevWorkload}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-550 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/10 transition-colors"
                >
                  <Activity className="w-4 h-4 text-cyan-200" />
                  <span>Injetar Sobrecarga de Teste</span>
                </button>
              </div>

              {/* Server Latency over Time Chart */}
              <div className="lg:col-span-5 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400">Latência do Gateway &amp; Servidor</h4>
                  <span className="text-[9px] font-mono text-slate-500">Últimos logs de telemetria</span>
                </div>

                {/* Bar Graph SVG */}
                <div className="relative h-44 w-full bg-slate-900/50 border border-slate-850 rounded-xl p-3 flex items-end justify-between gap-1.5 overflow-hidden">
                  
                  <div className="absolute inset-x-0 top-1/4 border-b border-slate-800/30" />
                  <div className="absolute inset-x-0 top-2/4 border-b border-slate-800/30" />
                  <div className="absolute inset-x-0 top-3/4 border-b border-slate-800/30" />

                  {historicalData.developerLatency.map((item, idx) => {
                    const h = Math.min(100, (item.latency / 45) * 100);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                        <div 
                          style={{ height: `${h}%` }} 
                          className="w-full bg-cyan-500/80 hover:bg-cyan-400 rounded-t-md transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)] flex items-center justify-center text-[8px] font-bold text-slate-900 font-mono"
                        >
                          <span className="opacity-0 group-hover:opacity-100">{item.latency}ms</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 mt-2">{item.time}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center text-[10px] text-slate-400 font-mono">
                  ⚡ Gráfico atualizando dinamicamente conforme chamadas ao Service Mesh.
                </div>
              </div>

              {/* Developer Logs */}
              <div className="lg:col-span-3 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400">Auditoria de API Gateway</h4>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {developerLogs.map((log, idx) => (
                    <div key={idx} className="p-2 bg-slate-900 border border-slate-850 rounded-lg text-[10px] font-mono text-slate-300 leading-snug">
                      <span className="text-cyan-400 mr-1">#</span> {log}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ==================== 4. ADMINISTRATOR VIEWPORT ==================== */}
        {activeRole === 'admin' && (
          <motion.div
            key="admin-viewport"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* Admin global counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block font-bold">Faturamento Bruto da Plataforma</span>
                <div className="text-2xl font-black text-rose-400 font-mono">
                  R$ {adminStats.grossPlatformRevenueBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">Total líquido deduzido de taxas</div>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block font-bold">Usuários Ativos Simulados</span>
                <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
                  {adminStats.totalActiveUsers.toLocaleString()}<span className="text-xs text-emerald-400 font-bold">ONLINE</span>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">Uptime dos Servidores: {adminStats.systemUptimePercent}%</div>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block font-bold">Ações de Segurança Anti-Cheat</span>
                <div className="text-xs font-mono space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span>Eficácia Scanner:</span>
                    <strong className="text-emerald-400">99.85%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Varreduras Ativas:</span>
                    <strong className="text-slate-200">{adminStats.antiCheatScans.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Hackers Banidos:</span>
                    <strong className="text-rose-400 font-bold">{adminStats.antiCheatBans} banimentos</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block font-bold">Moderação de Conteúdo</span>
                <div className="text-xs font-mono space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span>Banimentos Chat:</span>
                    <strong className="text-rose-400">{adminStats.moderationBans}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Silenciamentos (Timeouts):</span>
                    <strong className="text-amber-400">{adminStats.moderationTimeouts}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Mensagens de Spam Filtradas:</span>
                    <strong className="text-purple-400">{adminStats.spamFiltersTriggered}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Middle Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Interactive Platform Security Panel */}
              <div className="lg:col-span-4 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400">Controle Anti-Cheat e Segurança</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Monitore a eficácia heurística e execute ações administrativas exemplares em tempo real para banir contas fraudulentas e auditar logs gerais do chat.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-[10px] font-mono space-y-1.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Log de Auditoria:</span>
                    <strong className="text-emerald-400">Criptografado SHA-256</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Varredura de Memória:</span>
                    <strong className="text-indigo-400">Ativo no Background</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Proteção de Ataques:</span>
                    <strong className="text-cyan-400">DDoS Cloudflare Pro</strong>
                  </div>
                </div>

                <button
                  onClick={simulateAdminBan}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/10 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-200" />
                  <span>Simular Banimento de Jogador Suspeito</span>
                </button>
              </div>

              {/* Admin Platform active users visualizer */}
              <div className="lg:col-span-5 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400">Curva de Usuários Ativos</h4>
                  <span className="text-[9px] font-mono text-slate-500">Distribuição horária</span>
                </div>

                {/* SVG Area Chart */}
                <div className="relative h-44 w-full bg-slate-900/50 border border-slate-850 rounded-xl p-3 flex items-end justify-between overflow-hidden">
                  
                  <div className="absolute inset-x-0 top-1/4 border-b border-slate-800/30" />
                  <div className="absolute inset-x-0 top-2/4 border-b border-slate-800/30" />
                  <div className="absolute inset-x-0 top-3/4 border-b border-slate-800/30" />

                  <svg className="absolute inset-0 w-full h-full p-3 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fda4af" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M 5,70 Q 25,40 50,55 T 95,20" 
                      fill="none" 
                      stroke="#f43f5e" 
                      strokeWidth="3.5"
                    />
                    <path 
                      d="M 5,70 Q 25,40 50,55 T 95,20 L 95,100 L 5,100 Z" 
                      fill="url(#roseGrad)"
                    />
                  </svg>

                  {historicalData.adminUsers.map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full relative z-10">
                      <span className="text-[9px] font-mono text-slate-500">{item.hour}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center text-[10px] text-slate-400 font-mono">
                  🛡️ Dados consolidados e assinados criptograficamente.
                </div>
              </div>

              {/* Admin Moderation Console Feed */}
              <div className="lg:col-span-3 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400">Console de Moderação Geral</h4>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {adminLogs.map((log, idx) => (
                    <div key={idx} className="p-2 bg-slate-900 border border-slate-850 rounded-lg text-[10px] font-mono text-slate-300 leading-snug">
                      <span className="text-rose-400 mr-1">●</span> {log}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Persistent Footer explaining architectural alignment */}
      <div className="mt-6 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-indigo-400 shrink-0">
            <Info className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="block text-xs font-extrabold text-slate-200">Integridade dos Dados de Gravação &amp; Transmissão</span>
            <span className="block text-[11px] text-slate-400">
              Todo replay, estatística de KDA, faturamento bruto e logs de moderação são mantidos em banco de dados isolado com espelhamento persistente.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-1 bg-slate-900 text-slate-400 rounded-lg border border-slate-800 font-semibold">
            Banco de Dados Relacional / NoSQL Isolado
          </span>
          <span className="text-[10px] font-mono px-2 py-1 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-900/30 font-semibold">
            Conexões Reais Ativas
          </span>
        </div>
      </div>

    </div>
  );
};
