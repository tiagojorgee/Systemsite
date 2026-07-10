import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Network, 
  Database, 
  Key, 
  Brain, 
  Radio, 
  Tv, 
  FolderHeart, 
  TrendingUp, 
  Percent, 
  ShieldAlert, 
  Cpu, 
  Layers, 
  Settings, 
  Activity, 
  BellRing, 
  Heart, 
  Coins, 
  MessageSquare, 
  Plus, 
  Search, 
  Code, 
  Flame, 
  Zap, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  AlertTriangle,
  FileCode,
  ShieldCheck,
  Send,
  Workflow,
  Sparkle
} from 'lucide-react';
import { motion } from 'motion/react';
import { GAMEZON_ENTERPRISE_MODULES, serviceMesh, EnterpriseModule } from '../modules/index';
import { AppUser } from './AuthModal';
import { PlayerStats, TransactionLog } from '../types';
import { playSound } from '../utils/audio';

interface EcosystemDashboardProps {
  loggedInUser: AppUser | null;
  stats: PlayerStats;
  realBalance: number;
  logs: TransactionLog[];
  onTriggerToast: (msg: string) => void;
  onRefreshUserData: () => void;
}

export const EcosystemDashboard: React.FC<EcosystemDashboardProps> = ({
  loggedInUser,
  stats,
  realBalance,
  logs,
  onTriggerToast,
  onRefreshUserData
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('user');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Real-time simulated traffic generator for millions of users
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [apiGatewayLogs, setApiGatewayLogs] = useState<any[]>([]);
  const [activeUsersSimulated, setActiveUsersSimulated] = useState<number>(450201);
  const [totalRpsSimulated, setTotalRpsSimulated] = useState<number>(78910);
  
  // Sandbox API Test States
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [isCallingAPI, setIsCallingAPI] = useState<boolean>(false);
  const [apiCallDuration, setApiCallDuration] = useState<number>(0);
  
  // Specific Module Playground States
  const [developerApiKey, setDeveloperApiKey] = useState<string>('');
  const [testDeveloperKeyInput, setTestDeveloperKeyInput] = useState<string>('');
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [customApiAppName, setCustomApiAppName] = useState<string>('Minha App Externa');

  // Generate traffic metrics loop
  useEffect(() => {
    // Initial data
    const list: any[] = [];
    for (let i = 0; i < 15; i++) {
      list.push({
        time: `${15 - i}s atrás`,
        traffic: Math.floor(Math.random() * 20000) + 60000,
        latency: Math.floor(Math.random() * 4) + 8,
        errors: Math.floor(Math.random() * 5)
      });
    }
    setTrafficData(list);

    const interval = setInterval(() => {
      setTrafficData(prev => {
        const next = [...prev.slice(1)];
        next.push({
          time: 'Agora',
          traffic: Math.floor(Math.random() * 25000) + 65000,
          latency: Math.floor(Math.random() * 5) + 7,
          errors: Math.floor(Math.random() * 4)
        });
        return next;
      });

      // Fluctuate simulated live telemetry
      setActiveUsersSimulated(prev => prev + (Math.floor(Math.random() * 200) - 100));
      setTotalRpsSimulated(prev => prev + (Math.floor(Math.random() * 400) - 200));

      // Fetch latest logs from API Gateway Service Mesh
      setApiGatewayLogs(serviceMesh.getAuditLogs());
    }, 2500);

    setApiGatewayLogs(serviceMesh.getAuditLogs());

    return () => clearInterval(interval);
  }, []);

  const handleSelectModule = (modId: string) => {
    setSelectedModuleId(modId);
    playSound.tick();
    setSandboxResult(null);
  };

  const currentModule = GAMEZON_ENTERPRISE_MODULES.find(m => m.id === selectedModuleId) || GAMEZON_ENTERPRISE_MODULES[0];

  // Helper to retrieve icon corresponding to a module
  const getModuleIcon = (id: string) => {
    switch (id) {
      case 'user': return <Key className="w-5 h-5 text-indigo-500" />;
      case 'social': return <TrendingUp className="w-5 h-5 text-indigo-500" />;
      case 'chat': return <MessageSquare className="w-5 h-5 text-emerald-500" />;
      case 'marketplace': return <Layers className="w-5 h-5 text-amber-500" />;
      case 'games': return <Flame className="w-5 h-5 text-cyan-500 animate-pulse" />;
      case 'video': return <Tv className="w-5 h-5 text-rose-500" />;
      case 'movies': return <Radio className="w-5 h-5 text-red-500" />;
      case 'library': return <FolderHeart className="w-5 h-5 text-teal-500" />;
      case 'payments': return <Coins className="w-5 h-5 text-emerald-600" />;
      case 'economy': return <Zap className="w-5 h-5 text-purple-500" />;
      case 'admin': return <Server className="w-5 h-5 text-slate-600" />;
      case 'ai': return <Brain className="w-5 h-5 text-pink-500 animate-bounce" style={{ animationDuration: '4s' }} />;
      case 'notifications': return <BellRing className="w-5 h-5 text-amber-400 animate-pulse" />;
      case 'publicapi': return <Code className="w-5 h-5 text-indigo-600" />;
      case 'settings': return <Settings className="w-5 h-5 text-slate-500" />;
      default: return <Workflow className="w-5 h-5 text-slate-400" />;
    }
  };

  // Execute internal decoupled API communication
  const executeSandboxAPICall = async (endpointMethod: string) => {
    if (!loggedInUser) {
      onTriggerToast('⚠️ Acesse sua conta de usuário para testar as APIs do Ecossistema!');
      return;
    }

    setIsCallingAPI(true);
    playSound.click();

    let targetService = selectedModuleId;
    let endpoint = '';
    let payload: any = {};

    // Map selected module to sandbox business call
    switch (selectedModuleId) {
      case 'user':
        endpoint = 'getUserProfile';
        payload = { userId: loggedInUser.uid || loggedInUser.email };
        break;
      case 'social':
        endpoint = 'publishAnnouncement';
        payload = {
          title: 'Grande Inauguração!',
          text: 'Estamos no ar com o novo ecossistema GameZon completo e modularizado. Venha explorar!',
          link: '#modules',
          category: 'shop',
          uploaderId: loggedInUser.uid || loggedInUser.email
        };
        break;
      case 'chat':
        endpoint = 'getUnreadCount';
        payload = { userId: loggedInUser.uid || loggedInUser.email };
        break;
      case 'marketplace':
        endpoint = 'processAffiliateCommission';
        payload = {
          productId: 'prod-boost-rtp-pack',
          title: 'Kit Super Sorte RTP (Parceiro)',
          price: 59.90,
          storeOwnerId: loggedInUser.uid || loggedInUser.email
        };
        break;
      case 'games':
        endpoint = 'executeWager';
        payload = {
          userId: loggedInUser.uid || loggedInUser.email,
          betAmount: 10,
          multiplier: Math.random() > 0.4 ? 2.5 : 0 // 60% win chance
        };
        break;
      case 'video':
        endpoint = 'getBroadcasterStatus';
        payload = { channelId: 'gamers-stream-01' };
        break;
      case 'movies':
        endpoint = 'getMovieInfo';
        payload = { movieId: 'cinema-community-shawshank' };
        break;
      case 'library':
        endpoint = 'getStorageQuote';
        payload = { userId: loggedInUser.uid || loggedInUser.email };
        break;
      case 'payments':
        endpoint = 'depositFunds';
        payload = {
          userId: loggedInUser.uid || loggedInUser.email,
          amount: 15.00,
          description: 'Bônus de Integração de Módulo REST API'
        };
        break;
      case 'economy':
        endpoint = 'adjustCoins';
        payload = { userId: loggedInUser.uid || loggedInUser.email, amount: 100 };
        break;
      case 'admin':
        endpoint = 'getDatabaseTelemetry';
        break;
      case 'ai':
        endpoint = 'analyzePostContent';
        payload = { text: 'Amei esse novo jogo da plataforma, sem cheats e 100% justo!' };
        break;
      case 'notifications':
        endpoint = 'sendAlert';
        payload = {
          userId: loggedInUser.uid || loggedInUser.email,
          title: 'Notificação do Sistema',
          body: 'Seu microserviço foi instanciado com sucesso.',
          type: 'system'
        };
        break;
      case 'publicapi':
        endpoint = 'generateDeveloperKey';
        payload = { userId: loggedInUser.uid || loggedInUser.email, appName: customApiAppName };
        break;
      case 'settings':
        endpoint = 'getAccessibilityParams';
        break;
    }

    try {
      const response = await serviceMesh.callInternalAPI('developer-console', targetService, endpoint, payload);
      setSandboxResult(response);
      setApiCallDuration(response.latency);
      
      if (response.success) {
        onTriggerToast(`✅ API Chamada com sucesso: ${targetService}.${endpoint}()`);
        // Refresh player data for changes like payments, coins, level
        if (selectedModuleId === 'payments' || selectedModuleId === 'games' || selectedModuleId === 'marketplace') {
          setTimeout(() => onRefreshUserData(), 1500);
        }

        // Handle keys extraction
        if (selectedModuleId === 'publicapi' && response.data) {
          setDeveloperApiKey((response.data as any).apiKey);
        }
      } else {
        onTriggerToast(`❌ Erro interno da API: ${response.error}`);
      }
    } catch (e: any) {
      setSandboxResult({ success: false, error: e.message || 'Falha de conexão física.' });
    } finally {
      setIsCallingAPI(false);
    }
  };

  // Run AI system recommendation logic
  const handleTriggerAiRecommendation = async () => {
    if (!loggedInUser) return;
    setIsAiLoading(true);
    playSound.purchase();
    
    setTimeout(async () => {
      try {
        const response = await serviceMesh.callInternalAPI('developer-console', 'ai', 'getProductRecommendation', {
          coins: stats.coins,
          isVip: stats.isVip || false
        });
        if (response.success) {
          setAiRecommendation(response.data);
        }
      } catch (e) {}
      setIsAiLoading(false);
    }, 1200);
  };

  // Run cryptographically audit of transactions ledgers
  const handleRunCryptographicAudit = async () => {
    if (!loggedInUser) return;
    playSound.click();
    setAuditResult('loading');
    
    setTimeout(async () => {
      try {
        const response = await serviceMesh.callInternalAPI('developer-console', 'payments', 'auditLedger', {
          userId: loggedInUser.uid || loggedInUser.email,
          logs: logs
        });
        if (response.success) {
          setAuditResult(response.data);
        }
      } catch (e) {}
    }, 1500);
  };

  const filteredModules = GAMEZON_ENTERPRISE_MODULES.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-fadeIn text-slate-800">
      
      {/* HEADER DA ARQUITETURA */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-950 -z-10" />
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 -z-10" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full text-xs font-mono font-bold">
              <Workflow className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              ARQUITETURA DE MICROSERVIÇOS EM PRODUÇÃO
            </div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white uppercase font-sans">
              Ecosistema <span className="text-indigo-400 bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">GameZon</span>
            </h2>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
              O GameZon é estruturado em 15 módulos independentes e altamente desacoplados. Cada microsserviço evolui isoladamente, interagindo exclusivamente através de contratos REST mTLS internos criptografados, garantindo escalabilidade ilimitada, segurança de transação e zero atrito de negócios.
            </p>
          </div>

          {/* TELEMETRIA DE INFRAESTRUTURA EM NÍVEL CORPORATIVO */}
          <div className="grid grid-cols-2 gap-3.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 font-mono text-xs shrink-0 md:w-80">
            <div className="space-y-0.5">
              <span className="text-slate-500 text-[10px] uppercase block">Usuários Ativos / Instant</span>
              <span className="text-white font-bold text-sm tracking-wide">
                {activeUsersSimulated.toLocaleString()} <span className="text-emerald-500 text-[10px] animate-pulse">●</span>
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 text-[10px] uppercase block">Tráfego Total / Global</span>
              <span className="text-indigo-400 font-bold text-sm">
                {totalRpsSimulated.toLocaleString()} RPS
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 text-[10px] uppercase block">SLA do Cluster</span>
              <span className="text-emerald-400 font-bold text-sm">99.998%</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 text-[10px] uppercase block">Barramento do Mesh</span>
              <span className="text-purple-400 font-bold text-sm uppercase">Active (mTLS)</span>
            </div>
          </div>
        </div>
      </div>

      {/* PAINEL CENTRAL DE OPERAÇÕES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUNA ESQUERDA: LISTA DOS 15 MÓDULOS DE NEGÓCIO */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-indigo-600" />
                Microsserviços ({filteredModules.length})
              </h3>
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-md font-mono">
                Isolados
              </span>
            </div>
            
            {/* Campo de pesquisa de módulos */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar módulo, SLA, API..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs transition-all outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Lista dos cartões dos módulos */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
              {filteredModules.map((mod) => {
                const isActive = mod.id === selectedModuleId;
                return (
                  <button
                    key={mod.id}
                    onClick={() => handleSelectModule(mod.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                      isActive 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                        : 'bg-slate-50 hover:bg-slate-100/50 border-slate-200/80 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-white/10 text-white' : 'bg-slate-200/60 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors'}`}>
                        {getModuleIcon(mod.id)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-black truncate leading-tight ${isActive ? 'text-white' : 'text-slate-800'}`}>
                            {mod.name}
                          </span>
                          <span className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {mod.telemetry.version}
                          </span>
                        </div>
                        <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {mod.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right font-mono shrink-0 ml-2">
                      <div className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-slate-700'}`}>
                        SLA {mod.sla}%
                      </div>
                      <div className={`text-[8px] ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {mod.telemetry.rps.toLocaleString()} RPS
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredModules.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum microsserviço correspondente à busca.
                </div>
              )}
            </div>
          </div>

          {/* SIMULAÇÃO DE TRÁFEGO EM TEMPO REAL */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
                Vazão do Ecossistema (RPS)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">1M Usuários/Target</span>
            </div>
            
            <div className="h-28 w-full relative">
              {/* Custom SVG Area Chart with interactive details */}
              {(() => {
                if (trafficData.length === 0) return <div className="text-center py-8 text-xs text-slate-400">Coletando métricas...</div>;
                const maxVal = Math.max(...trafficData.map(d => d.traffic), 1);
                const minVal = Math.min(...trafficData.map(d => d.traffic), 0);
                const range = maxVal - minVal || 1;
                const height = 80;
                const width = 500;
                const stepX = width / (trafficData.length - 1);

                // Build line path
                const points = trafficData.map((d, i) => {
                  const x = i * stepX;
                  const y = height - ((d.traffic - minVal) / range) * (height - 15) - 5;
                  return { x, y, val: d.traffic, time: d.time };
                });

                const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

                const lastPoint = points[points.length - 1] || { val: 0 };

                return (
                  <div className="w-full h-full flex flex-col justify-between">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20 overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="colorTrafficCustom" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0"/>
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      <line x1="0" y1="0" x2={width} y2="0" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1={height} x2={width} y2={height} stroke="#e2e8f0" strokeWidth="1" />

                      {/* Area Path */}
                      <path d={areaPath} fill="url(#colorTrafficCustom)" />

                      {/* Stroke Line */}
                      <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Interactive Circles / Dots */}
                      {points.map((p, i) => (
                        <g key={i} className="group/dot cursor-pointer">
                          <circle cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" className="transition-all duration-200 hover:r-5 hover:fill-indigo-600" />
                          <title>{`${p.time}: ${p.val.toLocaleString()} RPS`}</title>
                        </g>
                      ))}
                    </svg>
                    
                    {/* Time labels under SVG */}
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                      <span>{trafficData[0]?.time || 'Início'}</span>
                      <span className="bg-indigo-50 text-indigo-700 font-black px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                        ● {lastPoint.val?.toLocaleString()} RPS Atual
                      </span>
                      <span>Agora</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: DETALHE DO MÓDULO, TELEMETRIA E APIS INTERNAS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* PAINEL DE DETALHES DO MÓDULO SELECIONADO */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            
            {/* Header do Cartão de Detalhe */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  {getModuleIcon(currentModule.id)}
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-800 leading-tight">
                    {currentModule.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">ID de barramento: <strong className="text-indigo-600 font-bold">{currentModule.id}</strong></p>
                </div>
              </div>

              {/* Status do Microserviço */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 font-mono uppercase bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-full">
                  Instância {currentModule.telemetry.status}
                </span>
              </div>
            </div>

            {/* Conteúdo do Detalhe */}
            <div className="p-5 space-y-6">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block mb-1">Descrição Funcional</span>
                <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                  {currentModule.description}
                </p>
              </div>

              {/* GRADE DE MÉTRICAS OPERACIONAIS DO MICROSERVIÇO (Simulação Real) */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block mb-2.5">Métricas Operacionais (Servidor Dedicado)</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5 text-left">
                    <span className="text-[9px] text-slate-400 uppercase block">Réplicas Ativas</span>
                    <span className="text-slate-800 font-extrabold text-sm font-mono">{currentModule.telemetry.replicas} pods</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5 text-left">
                    <span className="text-[9px] text-slate-400 uppercase block">Vazão (RPS)</span>
                    <span className="text-indigo-600 font-extrabold text-sm font-mono">{currentModule.telemetry.rps.toLocaleString()} /s</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5 text-left">
                    <span className="text-[9px] text-slate-400 uppercase block">Latência</span>
                    <span className="text-slate-800 font-extrabold text-sm font-mono">{currentModule.telemetry.latencyMs} ms</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5 text-left">
                    <span className="text-[9px] text-slate-400 uppercase block">Uso de CPU</span>
                    <span className="text-slate-800 font-extrabold text-sm font-mono">{currentModule.telemetry.cpuUsage}%</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5 text-left">
                    <span className="text-[9px] text-slate-400 uppercase block">Memória RAM</span>
                    <span className="text-slate-800 font-extrabold text-sm font-mono">{currentModule.telemetry.memoryUsageMb} MB</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5 text-left">
                    <span className="text-[9px] text-slate-400 uppercase block">Taxa de Erro</span>
                    <span className="text-emerald-600 font-extrabold text-sm font-mono">{currentModule.telemetry.errorRate.toFixed(2)}%</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5 text-left">
                    <span className="text-[9px] text-slate-400 uppercase block">Cache Hit Rate</span>
                    <span className="text-purple-600 font-extrabold text-sm font-mono">{currentModule.telemetry.cacheHitRate}%</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5 text-left">
                    <span className="text-[9px] text-slate-400 uppercase block">Conexões DB</span>
                    <span className="text-slate-800 font-extrabold text-sm font-mono">{currentModule.telemetry.databaseConnections} pools</span>
                  </div>
                </div>
              </div>

              {/* APIS INTERNAS EXPOSTAS (ENTRADA DO MICROSERVIÇO) */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block mb-2">Contratos REST / Endpoints Expostos</span>
                
                <div className="space-y-2">
                  {currentModule.endpoints.map((ep, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-xl gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 font-black font-mono text-[9px] rounded text-white ${ep.method === 'GET' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                          {ep.method}
                        </span>
                        <code className="text-[11px] font-mono text-slate-700 bg-slate-200/60 px-1.5 py-0.5 rounded">{ep.path}</code>
                      </div>
                      <span className="text-slate-500 text-[11px]">{ep.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* INTEGRADO SANDBOX PLAYGROUND COM REQUISIÇÃO REAL AO SERVICE MESH */}
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-150 space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs text-indigo-900 uppercase">
                      Console de Teste de Microsserviço
                    </h4>
                    <p className="text-[10px] text-indigo-600">Simule requisições criptografadas de ponta a ponta na rede interna</p>
                  </div>
                  <button
                    onClick={() => executeSandboxAPICall(currentModule.endpoints[0]?.method || 'GET')}
                    disabled={isCallingAPI}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer select-none transition-all"
                  >
                    {isCallingAPI ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="w-3 h-3 fill-white text-white" />
                    )}
                    <span>Enviar Request 🚀</span>
                  </button>
                </div>

                {/* API JSON Output Console */}
                {sandboxResult && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Status da Resposta: <strong className={sandboxResult.success ? 'text-emerald-600' : 'text-rose-600'}>{sandboxResult.success ? '200 OK' : '500 ERROR'}</strong></span>
                      <span>Latência Interna: <strong className="text-indigo-600">{apiCallDuration}ms</strong></span>
                    </div>
                    <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-44 border border-slate-800">
                      {JSON.stringify(sandboxResult.data || sandboxResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* PLAYGROUNDS ESPECÍFICOS DE MÓDULO */}
          
          {/* PLAYGROUND MÓDULO 12: IA RECOMENDADOR */}
          {selectedModuleId === 'ai' && (
            <div className="bg-pink-50/40 p-5 rounded-2xl border border-pink-150 space-y-4 animate-scaleIn">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-pink-500 text-white rounded-xl">
                  <Brain className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-pink-900">Módulo de Inteligência Artificial</h4>
                  <p className="text-[10px] text-pink-500">Gere sugestões comerciais altamente customizadas processadas pelo motor cognitivo</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleTriggerAiRecommendation}
                  disabled={isAiLoading}
                  className="w-full py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isAiLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Gerar Recomendação Cognitiva</span>
                </button>

                {aiRecommendation && (
                  <div className="p-4 bg-white border border-pink-100 rounded-xl space-y-1 text-xs">
                    <p className="font-extrabold text-pink-800">🎁 Produto Sugerido: {aiRecommendation.title}</p>
                    <p className="text-slate-600 italic">"{aiRecommendation.reason}"</p>
                    <p className="text-[10px] text-slate-400 font-mono">Preço teórico sugerido: {aiRecommendation.costCoins} moedas</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PLAYGROUND MÓDULO 9: AUDITORIA CRIPTOGRÁFICA DE SALDOS */}
          {selectedModuleId === 'payments' && (
            <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-150 space-y-4 animate-scaleIn">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-900">Segurança Financeira &amp; Ledger Audit</h4>
                  <p className="text-[10px] text-emerald-500">Varredura de integridade contra adulteração de transações (anti-cheat de saldos)</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Para suportar milhões de usuários, cada operação de crédito/débito de faturamento real gera um hash único contendo saltos privados do compilador. Nosso algoritmo audita a correspondência criptográfica de cada registro.
                </p>

                <button
                  onClick={handleRunCryptographicAudit}
                  disabled={auditResult === 'loading'}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {auditResult === 'loading' ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>Verificar Integridade de Saldos</span>
                </button>

                {auditResult && auditResult !== 'loading' && (
                  <div className="p-4 bg-white border border-emerald-100 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Verificação Completa Realizada</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mt-1 text-slate-600">
                      <div>Transações Auditadas: <strong>{auditResult.auditedCount}</strong></div>
                      <div>Status do Ledger: <strong className="text-emerald-600">SEGURO</strong></div>
                    </div>
                    <p className="text-[10px] text-slate-400">Nenhum registro violado ou divergência de hash SHA-256 detectada.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PLAYGROUND MÓDULO 14: GERADOR DE API PÚBLICA */}
          {selectedModuleId === 'publicapi' && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 animate-scaleIn">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Portal do Desenvolvedor (External API Keys)</h4>
                  <p className="text-[10px] text-indigo-600">Gere credenciais externas para conectar aplicativos de terceiros ao ecossistema</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customApiAppName}
                    onChange={(e) => setCustomApiAppName(e.target.value)}
                    placeholder="Nome da sua aplicação"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none"
                  />
                  <button
                    onClick={() => executeSandboxAPICall('GET')}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Criar API Key
                  </button>
                </div>

                {developerApiKey && (
                  <div className="space-y-3 p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl text-xs">
                    <p className="font-extrabold text-indigo-900">🔑 Credencial Ativa:</p>
                    <code className="block p-2 bg-slate-900 text-indigo-300 rounded font-mono text-[10px] break-all select-all">
                      {developerApiKey}
                    </code>
                    
                    {/* Test Calling the Public API live! */}
                    <div className="space-y-2 mt-2">
                      <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Testar Chamada Pública</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={testDeveloperKeyInput}
                          onChange={(e) => setTestDeveloperKeyInput(e.target.value)}
                          placeholder="Cole sua API Key gerada aqui para validar"
                          className="flex-1 px-3 py-1 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg text-[10px] font-mono outline-none"
                        />
                        <button
                          onClick={() => {
                            playSound.click();
                            if (testDeveloperKeyInput === developerApiKey) {
                              onTriggerToast('🎯 API KEY VALIDADA! GET /api/public/profile executado com sucesso.');
                            } else {
                              onTriggerToast('❌ Falha na validação: Token de desenvolvedor incorreto.');
                            }
                          }}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Validar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BARRAMENTO DE EVENTOS DO GATEWAY (SERVICE MESH LIVE LOGS) */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-extrabold text-xs text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Network className="w-4 h-4 text-indigo-400 animate-pulse" />
                Logs de Barramento Criptografados (mTLS Mesh)
              </h3>
              <span className="text-[9px] px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded font-mono font-bold">
                Live Sniffer
              </span>
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto scrollbar-thin text-[10px] font-mono">
              {apiGatewayLogs.map((log, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-800/40 text-slate-300">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-slate-500 shrink-0">{log.timestamp.split('T')[1].substring(0, 8)}</span>
                    <span className="text-emerald-400 shrink-0">[{log.caller} ➜ {log.target}]</span>
                    <span className="text-slate-200 truncate">{log.api}()</span>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-slate-400">{log.latency}ms</span>
                    <span className={`px-1 rounded text-[9px] font-bold ${log.status === 200 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}

              {apiGatewayLogs.length === 0 && (
                <div className="p-4 text-center text-slate-500 text-xs italic">
                  Aguardando primeiras requisições de serviço...
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
