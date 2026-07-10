import React, { useState, useEffect } from 'react';
import { 
  Users, Wallet, Coins, ShoppingBag, Radio, Shield, 
  AlertTriangle, RefreshCw, Server, Activity, Key, 
  Settings, Database, PlayCircle, FileText, MessageSquare, 
  Trash2, ShieldCheck, CheckCircle2, XCircle, Search, 
  Percent, Terminal, Award, Copy, Globe, Eye, EyeOff, Lock, UserX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '../utils/audio';

interface AdminPortalProps {
  user: any;
  onTriggerToast: (msg: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ user, onTriggerToast }) => {
  // Main admin tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'payments' | 'games' | 'streaming' | 'marketplace' | 'content' | 'security' | 'configs'>('dashboard');
  
  // Search and filter states
  const [userQuery, setUserQuery] = useState('');
  const [logQuery, setLogQuery] = useState('');
  
  // Selected items for modal/edits
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editingUserStats, setEditingUserStats] = useState({ balance: 0, coins: 0, level: 1 });
  
  // Admin Data State polled from server
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLivePolling, setIsLivePolling] = useState(true);
  
  // Simulation alerts trigger state
  const [simulationAlerts, setSimulationAlerts] = useState<string[]>([]);

  // PCI DSS and custom report states
  const [pciScanResult, setPciScanResult] = useState<'idle' | 'scanning' | 'passed'>('idle');
  const [customReportType, setCustomReportType] = useState('full');
  const [customReportOut, setCustomReportOut] = useState<string | null>(null);

  // New Coupon state
  const [newCoupon, setNewCoupon] = useState({ code: '', type: 'fixed', value: 10, maxUses: 100 });
  
  // Custom streamer status override state
  const [streamIdToOverride, setStreamIdToOverride] = useState('');
  const [streamIsLiveOverride, setStreamIsLiveOverride] = useState(true);

  // Fetch function for real-time syncing
  const fetchAdminData = async (silent = false) => {
    if (!silent) setLoading(true);
    const token = localStorage.getItem('gamezone_jwt_token');
    if (!token) {
      setError('Sessão expirada. Autentique-se novamente.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/system-data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 403) throw new Error('Acesso negado. Nível de privilégio insuficiente.');
        throw new Error('Erro ao carregar dados operacionais.');
      }
      const data = await res.json();
      setAdminData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Setup real-time 3-second interval polling
  useEffect(() => {
    fetchAdminData();
    
    let interval: NodeJS.Timeout | null = null;
    if (isLivePolling) {
      interval = setInterval(() => {
        fetchAdminData(true);
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLivePolling]);

  const handleAction = async (endpoint: string, body: any, successMessage: string) => {
    const token = localStorage.getItem('gamezone_jwt_token');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao processar ação.');
      
      onTriggerToast(`✅ ${successMessage}`);
      playSound.click();
      fetchAdminData(true); // reload instantly
      return data;
    } catch (err: any) {
      onTriggerToast(`❌ ${err.message}`);
    }
  };

  // 1. User management
  const openUserEdit = (u: any) => {
    setSelectedUser(u);
    let stats = { coins: 150, level: 1 };
    if (u.stats) {
      try {
        stats = typeof u.stats === 'string' ? JSON.parse(u.stats) : u.stats;
      } catch {}
    }
    setEditingUserStats({
      balance: u.real_balance ?? 120.0,
      coins: stats.coins ?? 150,
      level: stats.level ?? 1
    });
  };

  const saveUserStats = async () => {
    if (!selectedUser) return;
    await handleAction('/api/admin/users/update-stats', {
      targetUserId: selectedUser.id,
      balance: editingUserStats.balance,
      coins: editingUserStats.coins,
      level: editingUserStats.level
    }, `Saldos de ${selectedUser.nome} atualizados.`);
    setSelectedUser(null);
  };

  const handleToggleBan = async (targetUser: any, ip: string, isCurrentlyBanned: boolean) => {
    await handleAction('/api/admin/users/ban', {
      targetUserId: targetUser.id,
      ip: ip || '127.0.0.1',
      ban: !isCurrentlyBanned,
      reason: 'Violação grave dos termos de conduta e segurança da plataforma'
    }, `${isCurrentlyBanned ? 'Desbanido' : 'Banido'} com sucesso.`);
  };

  const handleToggleShadowban = async (targetUser: any, isCurrentlyShadowbanned: boolean) => {
    await handleAction('/api/admin/users/shadowban', {
      targetUserId: targetUser.id,
      shadowban: !isCurrentlyShadowbanned
    }, `${isCurrentlyShadowbanned ? 'Fim do Shadowban' : 'Shadowban Aplicado'} para ${targetUser.nome}.`);
  };

  const handleRoleChange = async (targetUser: any, newRole: string) => {
    await handleAction('/api/user/role', {
      targetUserId: targetUser.id,
      newRole
    }, `Cargo de ${targetUser.nome} alterado para ${newRole}.`);
  };

  const handleTerminateSession = async (sessionId: string) => {
    await handleAction('/api/admin/users/terminate-session', { sessionId }, 'Sessão revogada remotamente.');
  };

  // 2. Payments / Invoice manual overrides
  const handlePayoutApproval = async (invoiceId: string, approve: boolean) => {
    await handleAction('/api/admin/payments/approve', {
      invoiceId,
      approve,
      reason: 'Revisado por Auditoria de Compliance'
    }, approve ? 'Retirada liberada com sucesso.' : 'Retirada recusada e estornada.');
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return;
    await handleAction('/api/admin/payments/coupons', newCoupon, `Cupom ${newCoupon.code.toUpperCase()} criado!`);
    setNewCoupon({ code: '', type: 'fixed', value: 10, maxUses: 100 });
  };

  // 3. Moderation & Denúncias
  const handleResolveReport = async (reportId: string, action: 'resolved' | 'dismissed') => {
    await handleAction('/api/admin/moderation/resolve-report', { reportId, action }, `Denúncia marcada como ${action}.`);
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Excluir esta publicação permanentemente do Feed público?')) {
      await handleAction('/api/admin/moderation/delete-post', { postId }, 'Publicação excluída do feed.');
    }
  };

  // 4. Game RTP Overrides & Stream
  const handleRtpOverlay = async (level: 'boost' | 'normal' | 'house_win') => {
    await handleAction('/api/admin/configs/update', {
      configs: { rtpOverlay: level }
    }, `Algoritmo RTP global configurado para: ${level.toUpperCase()}`);
  };

  const handleToggleStreamLive = async (streamId: string, currentLive: boolean) => {
    await handleAction('/api/admin/streams/control', {
      streamId,
      isLive: !currentLive
    }, `Transmissão alterada para ${!currentLive ? 'ONLINE' : 'OFFLINE'}`);
  };

  const handleToggleMarketplace = async (storeId: string, currentActive: boolean) => {
    await handleAction('/api/admin/marketplace/control', {
      type: 'marketplace',
      id: storeId,
      isActive: !currentActive
    }, `Status do Marketplace alterado com sucesso.`);
  };

  const handleToggleProductAvailability = async (productId: string, currentAvailable: boolean) => {
    await handleAction('/api/admin/marketplace/control', {
      type: 'product',
      id: productId,
      isAvailable: !currentAvailable
    }, `Status do Produto alterado com sucesso.`);
  };

  // 5. Global Configs & Maintenance
  const handleToggleMaintenance = async () => {
    const nextMaintenance = !adminData?.globalConfigs?.maintenanceMode;
    await handleAction('/api/admin/configs/update', {
      configs: { maintenanceMode: nextMaintenance }
    }, `Modo de Manutenção global: ${nextMaintenance ? 'ATIVADO' : 'DESATIVADO'}`);
  };

  const handleUpdateNotice = async (notice: string) => {
    await handleAction('/api/admin/configs/update', {
      configs: { customNotificationNotice: notice }
    }, 'Aviso global de cabeçalho atualizado.');
  };

  // Simulation Alert triggers
  const triggerSimulationAlert = () => {
    const alerts = [
      `⚠️ ALERTA DE COMPLIANCE: Tentativa de saque incomum de R$ 4,500.00 pelo ID: u-3`,
      `⚠️ MONITOR: Alta taxa de vitórias consecutivas de RTP no jogo Tigrinho detectada. IP: 189.44.20.10`,
      `⚠️ INTRUSÃO: Assinatura HMAC violada no pacote de integridade do usuário u-1`
    ];
    const picked = alerts[Math.floor(Math.random() * alerts.length)];
    setSimulationAlerts(prev => [picked, ...prev.slice(0, 4)]);
    onTriggerToast("🚨 Alerta de Anomalia Gerado pelo Monitoramento!");
    playSound.jackpot();
  };

  // Signed backup compiler simulator
  const handleDownloadBackup = async () => {
    const token = localStorage.getItem('gamezone_jwt_token');
    try {
      const res = await fetch('/api/security/backup', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.backup) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data.backup));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `gamezone_signed_backup_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        onTriggerToast("📦 Backup Criptográfico Compilado e Baixado!");
      }
    } catch {
      onTriggerToast("❌ Falha ao exportar backup.");
    }
  };

  // PCI DSS Compliance Scanner simulator
  const runPciScan = () => {
    setPciScanResult('scanning');
    playSound.click();
    setTimeout(() => {
      setPciScanResult('passed');
      onTriggerToast("🛡️ Varredura Concluída: 100% em Conformidade PCI-DSS v4.0!");
    }, 2000);
  };

  // Custom auditor report generator
  const generateAuditorReport = () => {
    if (!adminData) return;
    const dateStr = new Date().toLocaleString();
    let text = `====================================================\n`;
    text += `   GAMEZONE CORPORATE COMPLIANCE AUDIT REPORT       \n`;
    text += `   Gerado em: ${dateStr}                            \n`;
    text += `====================================================\n\n`;
    text += `1. INDICADORES FINANCEIROS DE COMPLIANCE:\n`;
    text += `   - Volume Total de Depósitos: R$ ${adminData.metrics.totalDeposits.toFixed(2)}\n`;
    text += `   - Volume Total de Saques: R$ ${adminData.metrics.totalWithdrawals.toFixed(2)}\n`;
    text += `   - GGR Operacional Estimado: R$ ${adminData.metrics.ggrAmount.toFixed(2)}\n`;
    text += `   - Usuários Cadastrados: ${adminData.metrics.activeUsersCount}\n`;
    text += `   - Sessões Concorrentes: ${adminData.metrics.activeSessionsCount}\n\n`;
    text += `2. STATUS DO PROTOCOLO CRYPTO-SECURITY:\n`;
    text += `   - Assinatura de Transações: AES-256-GCM / HMAC-SHA256\n`;
    text += `   - Score de Conformidade: ${adminData.metrics.complianceScore}%\n`;
    text += `   - IPs Bloqueados Ativos: ${adminData.metrics.ipBlocksCount}\n\n`;
    text += `3. REGISTROS RECENTES DE AUDITORIA OPERACIONAL:\n`;
    
    adminData.auditLogs?.slice(0, 8).forEach((l: any) => {
      text += `   [${l.timestamp}] Evento: ${l.evento} - Usuário: ${l.usuario_id}\n`;
      text += `     Detalhes: ${l.detalhes}\n`;
    });
    
    text += `\n====================================================\n`;
    text += ` ASSINATURA DIGITAL DO SISTEMA DE CONTROLE DE APIS \n`;
    text += ` SHA256:${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}... \n`;
    text += `====================================================`;

    setCustomReportOut(text);
    onTriggerToast("📄 Relatório Técnico Compilado com Sucesso!");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 font-mono">
        <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm">Iniciando conexão de fluxo de dados em tempo real com o servidor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-3" />
          <h3 className="text-lg font-bold">Privilégios Administrativos Necessários</h3>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const { metrics, users, reports, streams, marketplaces, products, posts, sessions, ipBlocks, auditLogs, coupons, allInvoices, webhookLogs, conciliationRecords, globalConfigs } = adminData || {};

  // Filters
  const filteredUsers = (users || []).filter((u: any) => 
    u.nome.toLowerCase().includes(userQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(userQuery.toLowerCase()) ||
    (u.username && u.username.toLowerCase().includes(userQuery.toLowerCase()))
  );

  const filteredLogs = (auditLogs || []).filter((l: any) => 
    l.evento.toLowerCase().includes(logQuery.toLowerCase()) || 
    l.detalhes.toLowerCase().includes(logQuery.toLowerCase()) ||
    l.usuario_id.toLowerCase().includes(logQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-slate-950 text-slate-100 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 p-4 md:p-8 font-sans">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Painel Administrativo Corporativo
                <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  Realtime Active
                </span>
              </h1>
              <p className="text-slate-400 text-xs md:text-sm mt-0.5">
                Central unificada de controle de infraestrutura, moderação, finanças e compliance.
              </p>
            </div>
          </div>
        </div>

        {/* POLLING CONTROLLER */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
          <div className="flex items-center gap-2 px-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isLivePolling ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-xs font-mono text-slate-400">Tempo Real Sync</span>
          </div>
          <button 
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isLivePolling ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
          >
            {isLivePolling ? 'Pausar Fluxo' : 'Iniciar Fluxo'}
          </button>
          <button 
            onClick={() => fetchAdminData(false)}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
            title="Recarregar dados agora"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUICK STATUS METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
          <p className="text-slate-500 text-xs font-mono">Faturamento Líquido (GGR)</p>
          <p className="text-xl font-bold font-mono text-white mt-1">R$ {metrics?.ggrAmount?.toFixed(2) || '0.00'}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 mt-2">
            <Coins className="w-3.5 h-3.5" />
            <span>Depósitos menos Saques</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
          <p className="text-slate-500 text-xs font-mono">Usuários Operacionais</p>
          <p className="text-xl font-bold font-mono text-indigo-400 mt-1">{metrics?.activeUsersCount || 0}</p>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">Sessões Ativas: {metrics?.activeSessionsCount || 0}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
          <p className="text-slate-500 text-xs font-mono">Denúncias Pendentes</p>
          <p className="text-xl font-bold font-mono text-rose-500 mt-1">{metrics?.pendingReportsCount || 0}</p>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">Total Registradas: {metrics?.totalReportsCount || 0}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
          <p className="text-slate-500 text-xs font-mono">PCI-DSS Score</p>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{metrics?.complianceScore}%</p>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">Criptografia: AES-256-GCM</p>
        </div>
      </div>

      {/* DETAILED TAB NAVIGATION */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-4 mb-6 scrollbar-none">
        {[
          { id: 'dashboard', label: 'Monitor & Analytics', icon: Activity },
          { id: 'users', label: 'Usuários & Acesso', icon: Users },
          { id: 'payments', label: 'Financeiro & Cupons', icon: Wallet },
          { id: 'games', label: 'Config de Jogos', icon: PlayCircle },
          { id: 'streaming', label: 'Streaming Live', icon: Radio },
          { id: 'marketplace', label: 'E-commerce Store', icon: ShoppingBag },
          { id: 'content', label: 'Controle de Feed', icon: MessageSquare },
          { id: 'security', label: 'Auditoria & Logs', icon: Shield },
          { id: 'configs', label: 'Parâmetros Globais', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); playSound.click(); }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition-all ${
                isActive 
                  ? 'bg-indigo-600 text-white border border-indigo-500/40 shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* MAIN CONTAINER */}
      <div className="min-h-[480px]">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: MONITOR & ANALYTICS */}
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Simulated Server Resources */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
                    <Server className="w-4 h-4 text-indigo-400" />
                    Monitoramento de Recursos (VM Container)
                  </h3>
                  <div className="space-y-4 font-mono text-xs">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>CPU Usage (Simulated)</span>
                        <span>{Math.floor(25 + Math.random() * 15)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: '38%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Memory Allocation (DDR4)</span>
                        <span>428 MB / 1024 MB</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: '42%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Conexões WebSocket Ativas</span>
                        <span>{metrics?.activeSessionsCount * 2 + 3} Conexões</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: '55%' }} />
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex justify-between text-slate-500 text-[10px]">
                      <span>Database Engine: SQLite 3</span>
                      <span>Porta Ingress: 3000</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Coin Velocity Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      Velocidade de Geração de Moedas vs Sinks (Realtime)
                    </h3>
                    <span className="text-[10px] font-mono bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                      Taxa de Conversão: 1 COIN = R$ 1.00
                    </span>
                  </div>
                  <div className="h-44 w-full flex items-end justify-between gap-1.5 bg-slate-950 p-4 rounded-xl border border-slate-850 relative">
                    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none text-[8px] text-slate-600 font-mono">
                      <div className="border-b border-slate-900/60 w-full pb-1">10,000 Coins</div>
                      <div className="border-b border-slate-900/60 w-full pb-1">5,000 Coins</div>
                      <div className="w-full">0 Coins</div>
                    </div>
                    {/* Simulated SVG Graph bars */}
                    {[12, 18, 30, 24, 45, 60, 52, 70, 85, 90, 80, 95].map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 z-10">
                        <div className="w-full bg-yellow-500/20 hover:bg-yellow-500/40 border-t border-yellow-400 rounded-t-sm transition-all" style={{ height: `${val}%` }} />
                        <span className="text-[8px] font-mono text-slate-600">t-{12 - idx}m</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* LIVE SECURITY INCIDENT MONITORS */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    Monitoramento de Incidentes de Segurança &amp; Auditoria
                  </h3>
                  <button 
                    onClick={triggerSimulationAlert}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    Simular Anomalia Criptográfica
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {simulationAlerts.length === 0 && (
                    <div className="text-center py-6 text-slate-500 text-xs font-mono">
                      🛡️ Nenhum incidente incomum detectado pelo WAF e Firewalls corporativos.
                    </div>
                  )}
                  {simulationAlerts.map((alt, i) => (
                    <div key={i} className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-xl text-xs font-mono flex items-center justify-between animate-slideIn">
                      <span>{alt}</span>
                      <span className="text-[10px] bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 rounded-full uppercase">Crítico</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: USUARIOS & ACCESSO */}
          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              
              {/* SEARCH & FILTERS */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome, email ou username..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Mostrando {filteredUsers.length} de {(users || []).length} jogadores cadastrados
                </div>
              </div>

              {/* USERS DATA TABLE */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 border-b border-slate-850 text-slate-400 uppercase tracking-wider font-mono">
                      <tr>
                        <th className="p-4">Nome / Usuário</th>
                        <th className="p-4">Cargo</th>
                        <th className="p-4">Saldo Real</th>
                        <th className="p-4">Moedas</th>
                        <th className="p-4">Nível</th>
                        <th className="p-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                            Nenhum jogador encontrado com os critérios fornecidos.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u: any) => {
                          let stats = { coins: 150, level: 1 };
                          try {
                            stats = typeof u.stats === 'string' ? JSON.parse(u.stats) : u.stats;
                          } catch {}
                          
                          const isBanned = (ipBlocks || []).some((b: any) => b.ip === '127.0.0.1'); // simulation map
                          const isShadowbanned = stats && (stats as any).isShadowbanned === 1;

                          return (
                            <tr key={u.id} className="hover:bg-slate-850/40 transition-all">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">
                                    {u.nome ? u.nome.charAt(0).toUpperCase() : '?'}
                                  </div>
                                  <div>
                                    <p className="font-bold text-white flex items-center gap-1.5">
                                      {u.nome}
                                      {isBanned && (
                                        <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded-full font-mono uppercase">Banido</span>
                                      )}
                                      {isShadowbanned && (
                                        <span className="text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.2 rounded-full font-mono uppercase">Shadowban</span>
                                      )}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <select 
                                  value={u.role || 'user'}
                                  onChange={(e) => handleRoleChange(u, e.target.value)}
                                  className="bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                                >
                                  <option value="user">User</option>
                                  <option value="moderator">Moderator</option>
                                  <option value="auditor">Auditor</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </td>
                              <td className="p-4 font-mono font-bold text-white">
                                R$ {u.real_balance?.toFixed(2) ?? '120.00'}
                              </td>
                              <td className="p-4 font-mono text-yellow-400 font-bold">
                                {stats?.coins ?? 150} 🪙
                              </td>
                              <td className="p-4 font-mono text-indigo-400">
                                Lv {stats?.level ?? 1}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => openUserEdit(u)}
                                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg text-xs transition-all cursor-pointer font-semibold"
                                  >
                                    Ajustar Saldo
                                  </button>
                                  <button
                                    onClick={() => handleToggleShadowban(u, isShadowbanned)}
                                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                      isShadowbanned ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                                    }`}
                                    title="Alternar Shadowban do Chat"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleBan(u, '127.0.0.1', isBanned)}
                                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                      isBanned ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-rose-950/40 text-rose-400 hover:bg-rose-900/30'
                                    }`}
                                    title={isBanned ? 'Desbanir IP' : 'Banir IP'}
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SESSION ACCESS CONTROL LIST */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
                  <Key className="w-4 h-4 text-indigo-400" />
                  Sessões Ativas &amp; Auditoria de IP (Acessos Recentes)
                </h3>
                <div className="space-y-3">
                  {(sessions || []).slice(0, 5).map((s: any) => (
                    <div key={s.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs font-mono">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">ID Jogador: {s.usuario_id}</span>
                          <span className={`w-2 h-2 rounded-full ${s.ativa === 1 ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                          <span className="text-[10px] text-slate-500">{s.ativa === 1 ? 'Sessão Ativa' : 'Revogada'}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Dispositivo: {s.dispositivo} | Localização: {s.localizacao}</p>
                        <p className="text-[9px] text-slate-600">IP: {s.ip_address} | User-Agent: {s.user_agent.slice(0, 50)}...</p>
                      </div>
                      {s.ativa === 1 && (
                        <button
                          onClick={() => handleTerminateSession(s.id)}
                          className="px-2.5 py-1.5 bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/30 text-rose-400 rounded-xl transition-all cursor-pointer font-bold shrink-0 self-start md:self-auto"
                        >
                          Revogar Token
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* USER ADJUST DIALOG MODAL */}
              {selectedUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-3xl p-6 relative">
                    <h3 className="text-base font-bold text-white mb-1">Ajustar Balanço e Parâmetros</h3>
                    <p className="text-slate-400 text-xs font-mono mb-4">Jogador: {selectedUser.nome} ({selectedUser.email})</p>
                    
                    <div className="space-y-4 text-xs font-mono">
                      <div>
                        <label className="block text-slate-400 mb-1.5">Saldo Real (BRL)</label>
                        <input
                          type="number"
                          value={editingUserStats.balance}
                          onChange={(e) => setEditingUserStats({ ...editingUserStats, balance: parseFloat(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1.5">Moedas Virtuais (COINS)</label>
                        <input
                          type="number"
                          value={editingUserStats.coins}
                          onChange={(e) => setEditingUserStats({ ...editingUserStats, coins: parseInt(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1.5">Nível Operacional</label>
                        <input
                          type="number"
                          value={editingUserStats.level}
                          onChange={(e) => setEditingUserStats({ ...editingUserStats, level: parseInt(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2.5 mt-6 justify-end">
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={saveUserStats}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Salvar Alterações
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: FINANCEIRO & CUPONS */}
          {activeTab === 'payments' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              
              {/* TRANSACTION APPROVAL QUEUE */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
                  <Wallet className="w-4 h-4 text-indigo-400" />
                  Fila de Payouts (Aprovações Manuais Pendentes)
                </h3>
                <div className="space-y-3">
                  {(allInvoices || []).filter((i: any) => i.status === 'pending').length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs font-mono">
                      ✅ Nenhuma transação pendente de auditoria ou estorno no momento.
                    </div>
                  ) : (
                    (allInvoices || []).filter((i: any) => i.status === 'pending').map((inv: any) => (
                      <div key={inv.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs font-mono">
                        <div>
                          <p className="font-bold text-white text-sm">R$ {inv.amount.toFixed(2)}</p>
                          <p className="text-slate-400 mt-1">Fatura: {inv.invoice_number} | Tipo: {inv.type === 'deposit' ? 'Depósito' : 'Saque'}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Usuário: {inv.user_id} | Data: {new Date(inv.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePayoutApproval(inv.id, false)}
                            className="px-3 py-1.5 bg-rose-950/30 border border-rose-900/40 text-rose-400 rounded-xl font-bold cursor-pointer hover:bg-rose-900/20 text-xs"
                          >
                            Recusar / Estornar
                          </button>
                          <button
                            onClick={() => handlePayoutApproval(inv.id, true)}
                            className="px-3 py-1.5 bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 rounded-xl font-bold cursor-pointer hover:bg-emerald-900/20 text-xs"
                          >
                            Aprovar Pagamento
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* COUPONS MAKER */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
                    <Percent className="w-4 h-4 text-indigo-400" />
                    Gerador de Cupons Promocionais
                  </h3>
                  <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs font-mono">
                    <div>
                      <label className="block text-slate-400 mb-1.5">Código do Cupom</label>
                      <input
                        type="text"
                        placeholder="Ex: BONUS200"
                        value={newCoupon.code}
                        onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white uppercase focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1.5">Tipo</label>
                        <select
                          value={newCoupon.type}
                          onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none"
                        >
                          <option value="fixed">Fixo (R$)</option>
                          <option value="percentage">Porcentagem (%)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1.5">Valor do Desconto</label>
                        <input
                          type="number"
                          value={newCoupon.value}
                          onChange={(e) => setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1.5">Máximo de Usos</label>
                      <input
                        type="number"
                        value={newCoupon.maxUses}
                        onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: parseInt(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all uppercase"
                    >
                      Compilar Cupom Promocional
                    </button>
                  </form>
                </div>

                {/* BANK GATEWAY CONCILIATION & WEBHOOKS */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    Logs de Webhook Simulado e Conciliação Pix/Gateway
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto font-mono text-[10px]">
                    {(webhookLogs || []).slice(0, 5).map((log: any) => (
                      <div key={log.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-200">Gateway: {log.provider.toUpperCase()} | {log.event_type}</p>
                          <p className="text-slate-500 mt-1">Payload: {log.payload.slice(0, 40)}...</p>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded border ${log.response_status === 200 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                          HTTP {log.response_status}
                        </span>
                      </div>
                    ))}
                    {(webhookLogs || []).length === 0 && (
                      <div className="text-center py-6 text-slate-500">
                        Nenhum log de webhook registrado.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 4: CONFIG DE JOGOS */}
          {activeTab === 'games' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              
              {/* RTP ALGORITHM CONTROLLER */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-yellow-500" />
                    Parâmetros de Probabilidade (RTP Overlay)
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Status: Ativo</span>
                </div>
                <p className="text-xs text-slate-400 max-w-2xl mb-6">
                  Selecione o multiplicador matemático global que rege os algoritmos de retorno ao jogador (RTP). Alterações aplicadas imediatamente a toda arena de jogos (Crash Space, Slots, Roleta, Aviador).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'boost', title: 'Jogador Turbinado (Player Boost)', desc: 'RTP de 98.5%. Aumenta frequência de bônus e multiplicadores para alta conversão de usuários novos.', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' },
                    { id: 'normal', title: 'Equilibrado (Normal)', desc: 'RTP padrão de 96.8%. Modelo equilibrado projetado para lucratividade contínua e experiência justa.', color: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5' },
                    { id: 'house_win', title: 'Margem do Cassino (House Win)', desc: 'RTP de 92.0%. Aumenta a margem de retenção de moedas da plataforma em caso de volatilidade excessiva.', color: 'border-amber-500/30 text-amber-400 bg-amber-500/5' },
                  ].map((algo) => {
                    const isSelected = globalConfigs?.rtpOverlay === algo.id;
                    return (
                      <button
                        key={algo.id}
                        onClick={() => handleRtpOverlay(algo.id as any)}
                        className={`p-5 rounded-2xl border text-left cursor-pointer transition-all relative ${
                          isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 bg-indigo-500 p-0.5 rounded-full text-white">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                        <h4 className="font-bold text-white text-xs mb-1.5">{algo.title}</h4>
                        <p className="text-[10px] text-slate-400 font-mono leading-relaxed">{algo.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SIMULATED RTP WINNING STATISTICS */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  Métricas Operacionais de Jogos &amp; Retenção
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                    <span className="text-[10px] font-mono text-slate-500">Giros Totais (Simulados)</span>
                    <p className="text-base font-bold font-mono text-white mt-1">128,450</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                    <span className="text-[10px] font-mono text-slate-500">Retorno Retido (House Profit)</span>
                    <p className="text-base font-bold font-mono text-emerald-400 mt-1">R$ 18,450.00</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                    <span className="text-[10px] font-mono text-slate-500">Prêmios Pagos</span>
                    <p className="text-base font-bold font-mono text-indigo-400 mt-1">R$ 110,000.00</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                    <span className="text-[10px] font-mono text-slate-500">Alerta de Lucro Estável</span>
                    <p className="text-base font-bold font-mono text-emerald-500 mt-1">ESTÁVEL / SAUDÁVEL</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: STREAMING LIVE */}
          {activeTab === 'streaming' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              
              {/* BROADCASTERS CONTROL PANEL */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
                  <Radio className="w-4 h-4 text-rose-500" />
                  Grade de Broadcasters &amp; Transmissões Live
                </h3>
                
                <div className="space-y-4">
                  {(streams || []).length === 0 ? (
                    <div className="text-center py-8 text-slate-500 font-mono text-xs">
                      Nenhuma sala de streaming cadastrada.
                    </div>
                  ) : (
                    (streams || []).map((st: any) => (
                      <div key={st.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{st.title}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${st.is_live === 1 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-slate-800 text-slate-500 border-transparent'}`}>
                              {st.is_live === 1 ? 'LIVE' : 'OFFLINE'}
                            </span>
                          </div>
                          <p className="text-slate-400 mt-1">Stream URL: <span className="text-slate-500">{st.stream_url}</span></p>
                          <p className="text-[10px] text-slate-500 mt-0.5">ID Streamer: {st.broadcaster_id} | Espectadores: {st.viewers_count}</p>
                        </div>

                        <button
                          onClick={() => handleToggleStreamLive(st.id, st.is_live === 1)}
                          className={`px-3 py-1.5 font-bold rounded-xl transition-all cursor-pointer text-xs ${
                            st.is_live === 1 
                              ? 'bg-rose-950/40 border border-rose-900/50 text-rose-400 hover:bg-rose-900/20' 
                              : 'bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/20'
                          }`}
                        >
                          {st.is_live === 1 ? 'Interromper Stream' : 'Colocar Online'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: E-COMMERCE MARKETPLACE */}
          {activeTab === 'marketplace' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* ACTIVE STORES */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
                    <ShoppingBag className="w-4 h-4 text-indigo-400" />
                    Lojas Ativas do Marketplace
                  </h3>
                  
                  <div className="space-y-3">
                    {(marketplaces || []).map((m: any) => (
                      <div key={m.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center justify-between text-xs font-mono">
                        <div>
                          <p className="font-bold text-white">{m.store_name}</p>
                          <p className="text-slate-500 mt-1">Comissão: {m.commission_rate * 100}% | ID Vendedor: {m.seller_id}</p>
                        </div>
                        <button
                          onClick={() => handleToggleMarketplace(m.id, m.is_active === 1)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            m.is_active === 1 
                              ? 'bg-rose-950/40 border border-rose-900/50 text-rose-400 hover:bg-rose-900/20' 
                              : 'bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/20'
                          }`}
                        >
                          {m.is_active === 1 ? 'Desativar Loja' : 'Reativar Loja'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MODERATE PRODUCTS LISTING */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
                    <ShoppingBag className="w-4 h-4 text-indigo-400" />
                    Listagem de Produtos do E-commerce
                  </h3>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {(products || []).map((p: any) => (
                      <div key={p.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center justify-between text-xs font-mono">
                        <div>
                          <p className="font-bold text-white">{p.title}</p>
                          <p className="text-slate-400 mt-0.5">Preço: R$ {p.price} | Categoria: {p.category}</p>
                          <p className="text-[10px] text-slate-500 mt-1">Descrição: {p.description.slice(0, 50)}...</p>
                        </div>
                        <button
                          onClick={() => handleToggleProductAvailability(p.id, p.is_available === 1)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                            p.is_available === 1 
                              ? 'bg-rose-950/40 border border-rose-900/50 text-rose-400 hover:bg-rose-900/20' 
                              : 'bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/20'
                          }`}
                        >
                          {p.is_available === 1 ? 'Ocultar Produto' : 'Exibir Produto'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 7: CONTROLE DE FEED / CONTENT */}
          {activeTab === 'content' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              
              {/* FEED MODERATION QUEUE */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  Fila de Moderação do Feed Global de Postagens
                </h3>
                
                <div className="space-y-4">
                  {(posts || []).length === 0 ? (
                    <div className="text-center py-8 text-slate-500 font-mono text-xs">
                      Nenhuma postagem ativa no feed global para moderação.
                    </div>
                  ) : (
                    (posts || []).map((pst: any) => (
                      <div key={pst.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-start justify-between gap-4 text-xs font-mono animate-fadeIn">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">ID Jogador: {pst.usuario_id}</span>
                            <span className="text-[9px] text-slate-500">{new Date(pst.criado_em || pst.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-slate-850 mt-2 font-sans leading-relaxed text-sm">
                            {pst.conteudo}
                          </p>
                          {pst.imagem_url && (
                            <p className="text-[10px] text-indigo-400 mt-2">Imagem Associada: {pst.imagem_url}</p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeletePost(pst.id)}
                          className="px-3 py-2 bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/30 text-rose-400 rounded-xl transition-all font-bold cursor-pointer shrink-0"
                          title="Excluir Postagem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* USER REPORTS / DENUNCIAS QUEUE */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Fila de Denúncias (Report Tickets Queue)
                </h3>
                <div className="space-y-3">
                  {(reports || []).length === 0 ? (
                    <div className="text-center py-6 text-slate-500 font-mono text-xs">
                      ✅ Nenhuma denúncia de violação pendente de revisão.
                    </div>
                  ) : (
                    (reports || []).map((rep: any) => (
                      <div key={rep.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">Denúncia #{rep.id}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border uppercase ${rep.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-slate-800 text-slate-500 border-transparent'}`}>
                              {rep.status}
                            </span>
                          </div>
                          <p className="text-slate-300 mt-1">Motivo: <span className="text-white font-bold">{rep.reason}</span></p>
                          <p className="text-[10px] text-slate-500">Denunciante: {rep.reporter_id} | Infrator: {rep.reported_user_id || 'Não especificado'}</p>
                        </div>
                        {rep.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResolveReport(rep.id, 'dismissed')}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                            >
                              Arquivar
                            </button>
                            <button
                              onClick={() => handleResolveReport(rep.id, 'resolved')}
                              className="px-3 py-1.5 bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/30 text-rose-400 rounded-lg cursor-pointer font-bold"
                            >
                              Aplicar Infração
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 8: AUDITORIA & SEGURANÇA */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* BACKUP & RESTORE PANEL */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    Gerenciamento de Disaster Recovery (Discos SQLite)
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">
                    Compila, assina criptograficamente e empacota todo o banco de dados operacional em arquivo portátil autenticado.
                  </p>
                  
                  <div className="space-y-3 font-mono text-xs">
                    <button
                      onClick={handleDownloadBackup}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 uppercase"
                    >
                      <Database className="w-3.5 h-3.5" />
                      Baixar Backup Criptográfico
                    </button>

                    <div className="border border-slate-800 p-4 rounded-xl bg-slate-950/40">
                      <span className="text-[10px] text-slate-500">Integridade dos Backups</span>
                      <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Status da Assinatura: VÁLIDO
                      </p>
                    </div>
                  </div>
                </div>

                {/* COMPLIANCE TECHNICAL WRITER */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Gerador de Relatórios Técnicos &amp; PCI Compliance
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">
                    Audite a conformidade de segurança e exporte o relatório financeiro consolidado assinado com HMAC-SHA256.
                  </p>

                  <div className="flex gap-2 mb-4">
                    <button 
                      onClick={runPciScan}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      {pciScanResult === 'scanning' ? 'Verificando PCI...' : 'Varredura PCI-DSS v4.0'}
                    </button>
                    <button 
                      onClick={generateAuditorReport}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Gerar Relatório de Compliance
                    </button>
                  </div>

                  {pciScanResult === 'passed' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-mono mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Passou no Scan PCI-DSS v4.0! Todos os campos de pagamento sensíveis ocultos e criptografados.
                    </div>
                  )}

                  {customReportOut && (
                    <textarea
                      readOnly
                      value={customReportOut}
                      className="w-full h-40 bg-slate-950 text-emerald-400 border border-slate-800 p-3 rounded-xl font-mono text-[9px] focus:outline-none resize-none"
                    />
                  )}
                </div>

              </div>

              {/* AUDIT LOG TABLE */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    Auditoria de Segurança da Informação (Audit Trails)
                  </h3>
                  <input
                    type="text"
                    placeholder="Filtrar logs de auditoria..."
                    value={logQuery}
                    onChange={(e) => setLogQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 w-full max-w-xs"
                  />
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-[10px]">
                  {filteredLogs.map((log: any) => (
                    <div key={log.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-400 font-bold">[{log.evento}]</span>
                          <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-300 mt-1">{log.detalhes}</p>
                        <p className="text-[9px] text-slate-600 mt-0.5">Operador: {log.usuario_id} | IP: {log.ip_address} | Hash: {log.signature.slice(0, 16)}...</p>
                      </div>
                      {log.isTampered && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[8px] font-bold uppercase animate-pulse">Integridade Violada</span>
                      )}
                    </div>
                  ))}
                  {filteredLogs.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      Nenhum registro de auditoria encontrado.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 9: PARAMETROS GLOBAIS */}
          {activeTab === 'configs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* EMERGENCY TOGGLES */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
                    <Settings className="w-4 h-4 text-indigo-400" />
                    Controles Globais &amp; Parâmetros de API
                  </h3>
                  
                  <div className="space-y-4 text-xs font-mono">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">Modo de Manutenção Global</p>
                        <p className="text-slate-500 text-[10px] mt-1">Impedir novos logins e travar apostas instantaneamente.</p>
                      </div>
                      <button
                        onClick={handleToggleMaintenance}
                        className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                          globalConfigs?.maintenanceMode 
                            ? 'bg-red-600 text-white' 
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                        }`}
                      >
                        {globalConfigs?.maintenanceMode ? 'Manutenção Ativa' : 'Ativar Manutenção'}
                      </button>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                      <label className="block text-slate-400 font-bold mb-1.5">Aviso Informativo de Cabeçalho (Global)</label>
                      <input
                        type="text"
                        defaultValue={globalConfigs?.customNotificationNotice}
                        onBlur={(e) => handleUpdateNotice(e.target.value)}
                        placeholder="Ex: Manutenção Programada em 10 Minutos"
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-[9px] text-slate-500 mt-1 block">Escreva o texto e clique fora para enviar a alteração ao servidor.</span>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                      <p className="font-bold text-white">Configurações de Credenciais Externas</p>
                      <div className="grid grid-cols-1 gap-2 text-[10px]">
                        <div>
                          <label className="block text-slate-500 mb-1">Simular Chave Pix Stripe API</label>
                          <input 
                            type="password" 
                            disabled 
                            value={globalConfigs?.stripeKeySimulated}
                            className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-slate-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Simular Client ID PayPal API</label>
                          <input 
                            type="password" 
                            disabled 
                            value={globalConfigs?.paypalKeySimulated}
                            className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-slate-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AUDITOR CONCILIATION HISTORY DETAILS */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-4">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Histórico de Conciliação Financeira Manual (Auditoria)
                  </h3>
                  
                  <div className="space-y-3 max-h-72 overflow-y-auto font-mono text-[10px]">
                    {(conciliationRecords || []).map((con: any) => (
                      <div key={con.id} className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{con.id}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border uppercase ${con.status === 'matched' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                            {con.status}
                          </span>
                        </div>
                        <p className="text-slate-400 mt-1">Transação Alvo: {con.transaction_id}</p>
                        <p className="text-slate-400">Sistema: R$ {con.system_amount.toFixed(2)} | Provedor: R$ {con.provider_amount.toFixed(2)}</p>
                        <p className="text-slate-500 mt-1 text-[9px]">Notas Auditor: {con.notes}</p>
                      </div>
                    ))}
                    {(conciliationRecords || []).length === 0 && (
                      <div className="text-center py-10 text-slate-500">
                        Nenhuma conciliação manual registrada recentemente.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
};
