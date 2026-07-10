import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, X, Check, CheckCheck, Archive, Trash2, Settings, Mail, 
  Layers, Send, Smartphone, History, Sparkles, Filter, Info, 
  AlertTriangle, ShieldCheck, Heart, MessageSquare, ShoppingBag, 
  Gamepad, Tv, Coins, Trophy, Calendar, Crown, RefreshCw
} from 'lucide-react';
import { playSound } from '../utils/audio';

// Custom Type declarations
export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface NotificationPreferences {
  system: { inApp: boolean; push: boolean; email: boolean };
  friendship: { inApp: boolean; push: boolean; email: boolean };
  messages: { inApp: boolean; push: boolean; email: boolean };
  marketplace: { inApp: boolean; push: boolean; email: boolean };
  games: { inApp: boolean; push: boolean; email: boolean };
  streaming: { inApp: boolean; push: boolean; email: boolean };
  finance: { inApp: boolean; push: boolean; email: boolean };
  achievements: { inApp: boolean; push: boolean; email: boolean };
  events: { inApp: boolean; push: boolean; email: boolean };
  subscriptions: { inApp: boolean; push: boolean; email: boolean };
}

export interface SentEmailLog {
  id: string;
  user_id: string;
  email: string;
  title: string;
  body: string;
  sent_at: string;
  status: string;
}

interface NotificationCenterProps {
  user: any; // Logged-in user from App
  onTriggerToast: (msg: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

const CATEGORIES_META: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  system: { label: 'Sistema', icon: ShieldCheck, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  friendship: { label: 'Amizades', icon: Heart, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
  messages: { label: 'Mensagens', icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  marketplace: { label: 'Marketplace', icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  games: { label: 'Jogos', icon: Gamepad, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  streaming: { label: 'Streaming', icon: Tv, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-100' },
  finance: { label: 'Financeiro', icon: Coins, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
  achievements: { label: 'Conquistas', icon: Trophy, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
  events: { label: 'Eventos', icon: Calendar, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' },
  subscriptions: { label: 'Assinaturas', icon: Crown, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
};

export function NotificationCenter({
  user,
  onTriggerToast,
  isOpen,
  onClose,
  onUnreadCountChange
}: NotificationCenterProps) {
  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'preferences' | 'emails' | 'simulator'>('notifications');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'archived'>('unread');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [groupingMode, setGroupingMode] = useState<'none' | 'date' | 'category'>('date');
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // States loaded from Server
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [emailLogs, setEmailLogs] = useState<SentEmailLog[]>([]);

  // Simulation Form States
  const [simTitle, setSimTitle] = useState('');
  const [simBody, setSimBody] = useState('');
  const [simType, setSimType] = useState<keyof NotificationPreferences>('system');
  const [simulating, setSimulating] = useState(false);

  const fetchNotificationState = async (showRefreshIndicator = false) => {
    if (!user) return;
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch(`/api/notifications?userId=${encodeURIComponent(user.uid)}`);
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setPreferences(data.preferences || null);
        setEmailLogs(data.emails || []);

        const unread = (data.notifications || []).filter((n: any) => !n.is_read && !n.deleted_at).length;
        if (onUnreadCountChange) {
          onUnreadCountChange(unread);
        }
      }
    } catch (error) {
      console.error('Failed to load notification state', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Poll notifications every 5 seconds for Real-Time Notification delivery
  useEffect(() => {
    if (isOpen && user) {
      fetchNotificationState();
      const interval = setInterval(() => {
        fetchNotificationState(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, user]);

  const handleMarkAsRead = async (id: string | 'all') => {
    if (!user) return;
    playSound.click();
    try {
      const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userId: user.uid })
      });
      const data = await res.json();
      if (data.success) {
        onTriggerToast(id === 'all' ? '✅ Todas marcadas como lidas!' : '✅ Notificação marcada como lida.');
        fetchNotificationState();
      }
    } catch (e) {
      onTriggerToast('❌ Erro ao atualizar status de leitura.');
    }
  };

  const handleArchive = async (id: string) => {
    playSound.click();
    try {
      const res = await fetch('/api/notifications/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        onTriggerToast('📦 Notificação arquivada.');
        fetchNotificationState();
      }
    } catch (e) {
      onTriggerToast('❌ Erro ao arquivar.');
    }
  };

  const handleDelete = async (id: string) => {
    playSound.click();
    try {
      const res = await fetch('/api/notifications/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        onTriggerToast('🗑️ Notificação excluída permanentemente.');
        fetchNotificationState();
      }
    } catch (e) {
      onTriggerToast('❌ Erro ao excluir.');
    }
  };

  const handleTogglePreference = async (category: keyof NotificationPreferences, channel: 'inApp' | 'push' | 'email') => {
    if (!user || !preferences) return;
    playSound.click();

    const updatedPrefs = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [channel]: !preferences[category][channel]
      }
    };

    setPreferences(updatedPrefs);

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, preferences: updatedPrefs })
      });
      const data = await res.json();
      if (data.success) {
        onTriggerToast('⚙️ Preferências atualizadas e sincronizadas!');
      }
    } catch (e) {
      onTriggerToast('❌ Falha ao salvar preferências no servidor.');
    }
  };

  const handleTriggerSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !simTitle || !simBody) {
      onTriggerToast('⚠️ Preencha todos os campos da simulação!');
      return;
    }
    setSimulating(true);
    playSound.click();

    try {
      const res = await fetch('/api/notifications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          title: simTitle,
          body: simBody,
          type: simType
        })
      });

      const data = await res.json();
      if (data.success) {
        let outcomeMsg = '✨ Notificação criada!';
        if (data.inAppSaved) outcomeMsg += ' [Feed de Apps ✔️]';
        if (data.pushSent) {
          outcomeMsg += ' [Browser Push ✔️]';
          // Fire browser push fallback in frontend context
          try {
            if (Notification.permission === 'granted') {
              new Notification(simTitle, { body: simBody });
            }
          } catch(err){}
        }
        if (data.emailSent) outcomeMsg += ' [E-mail Enviado ✔️]';

        onTriggerToast(outcomeMsg);
        setSimTitle('');
        setSimBody('');
        fetchNotificationState();
      }
    } catch (e) {
      onTriggerToast('❌ Falha ao simular disparo.');
    } finally {
      setSimulating(false);
    }
  };

  // Helper date formatter
  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    }
  };

  // Filter and Group notifications
  const getProcessedNotifications = () => {
    let filtered = [...notifications];

    // Filter by type: 'unread' | 'archived' | 'all'
    if (filterType === 'unread') {
      filtered = filtered.filter(n => !n.is_read && !n.deleted_at);
    } else if (filterType === 'archived') {
      filtered = filtered.filter(n => n.deleted_at !== null);
    } else {
      // 'all' gets everything that is not archived, unless category filters select archived
      filtered = filtered.filter(n => n.deleted_at === null);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(n => n.type === categoryFilter);
    }

    return filtered;
  };

  const processedList = getProcessedNotifications();

  // Smart Grouping Engine
  const groupNotifications = (list: AppNotification[]) => {
    if (groupingMode === 'none') {
      return [{ title: 'Todas as Notificações', items: list }];
    }

    if (groupingMode === 'category') {
      const groups: Record<string, AppNotification[]> = {};
      list.forEach(n => {
        const catLabel = CATEGORIES_META[n.type]?.label || 'Outros';
        if (!groups[catLabel]) groups[catLabel] = [];
        groups[catLabel].push(n);
      });
      return Object.entries(groups).map(([title, items]) => ({ title, items }));
    }

    if (groupingMode === 'date') {
      const groups: Record<string, AppNotification[]> = {};
      list.forEach(n => {
        const dateLabel = formatDateLabel(n.created_at);
        if (!groups[dateLabel]) groups[dateLabel] = [];
        groups[dateLabel].push(n);
      });
      return Object.entries(groups).map(([title, items]) => ({ title, items }));
    }

    return [];
  };

  const groupedNotifications = groupNotifications(processedList);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end font-sans">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs cursor-pointer"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 24, stiffness: 220 }}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-100 dark:border-slate-800 z-10"
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/40 via-purple-50/20 to-white dark:from-slate-800/40 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/10">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                Central de Notificações
                {refreshing && <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />}
              </h2>
              <p className="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400 font-mono tracking-tight">
                Sincronização Ativa • Alta Performance
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-1">
          <button
            onClick={() => { playSound.click(); setActiveSubTab('notifications'); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'notifications' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Alertas</span>
            {notifications.filter(n => !n.is_read && !n.deleted_at).length > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] rounded-full font-black">
                {notifications.filter(n => !n.is_read && !n.deleted_at).length}
              </span>
            )}
          </button>

          <button
            onClick={() => { playSound.click(); setActiveSubTab('preferences'); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'preferences' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Preferências</span>
          </button>

          <button
            onClick={() => { playSound.click(); setActiveSubTab('emails'); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'emails' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Auditoria E-mails</span>
            {emailLogs.length > 0 && (
              <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] rounded-full font-black">
                {emailLogs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { playSound.click(); setActiveSubTab('simulator'); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'simulator' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Simulador</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 dark:bg-slate-900">
          
          {/* TAB 1: NOTIFICATIONS LIST */}
          {activeSubTab === 'notifications' && (
            <div className="space-y-4">
              
              {/* Quick Filters */}
              <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => { playSound.click(); setFilterType('unread'); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                      filterType === 'unread' 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Não Lidas
                  </button>
                  <button
                    onClick={() => { playSound.click(); setFilterType('all'); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                      filterType === 'all' 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Lidas / Histórico
                  </button>
                  <button
                    onClick={() => { playSound.click(); setFilterType('archived'); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                      filterType === 'archived' 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Arquivadas
                  </button>
                </div>

                <div className="flex items-center gap-2 justify-between sm:ml-auto">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Agrupamento:</span>
                  <select
                    value={groupingMode}
                    onChange={(e) => { playSound.click(); setGroupingMode(e.target.value as any); }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="none">Sem Agrupar</option>
                    <option value="date">Por Data</option>
                    <option value="category">Por Categoria</option>
                  </select>
                </div>
              </div>

              {/* Category filters */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
                <button
                  onClick={() => { playSound.click(); setCategoryFilter('all'); }}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md border whitespace-nowrap cursor-pointer transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  Todas categorias
                </button>
                {Object.entries(CATEGORIES_META).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => { playSound.click(); setCategoryFilter(key); }}
                    className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md border whitespace-nowrap cursor-pointer transition-colors ${
                      categoryFilter === key
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {meta.label}
                  </button>
                ))}
              </div>

              {/* Action Header */}
              {processedList.length > 0 && filterType === 'unread' && (
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {processedList.length} {processedList.length === 1 ? 'alerta pendente' : 'alertas pendentes'}
                  </span>
                  <button
                    onClick={() => handleMarkAsRead('all')}
                    className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Marcar todas como lidas
                  </button>
                </div>
              )}

              {/* Main List */}
              {loading ? (
                <div className="py-20 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Carregando canal de dados sincronizado...</p>
                </div>
              ) : processedList.length === 0 ? (
                <div className="py-20 text-center space-y-3 border-2 border-dashed border-slate-100 dark:border-slate-800/80 rounded-2xl">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 w-fit rounded-full mx-auto text-slate-400 dark:text-slate-500">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">Tudo limpo por aqui!</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    Nenhuma notificação encontrada no momento para este filtro.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedNotifications.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-2">
                      <h3 className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-2">
                        <span>{group.title}</span>
                        <span className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full" />
                        <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[9px] font-mono">{group.items.length}</span>
                      </h3>

                      <div className="space-y-2">
                        {group.items.map((notif) => {
                          const meta = CATEGORIES_META[notif.type] || { label: 'Geral', icon: Bell, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
                          const IconComp = meta.icon;

                          return (
                            <motion.div
                              layoutId={notif.id}
                              key={notif.id}
                              className={`p-3.5 rounded-xl border flex gap-3.5 transition-all bg-white dark:bg-slate-800/40 relative group ${
                                notif.is_read 
                                  ? 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400' 
                                  : 'border-indigo-100 dark:border-indigo-950/60 shadow-xs'
                              }`}
                            >
                              {/* Left unread bar indicator */}
                              {!notif.is_read && (
                                <span className="absolute left-0 top-3.5 bottom-3.5 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-md" />
                              )}

                              {/* Category Icon */}
                              <div className={`p-2.5 rounded-xl h-fit shadow-xs ${meta.bg} ${meta.color}`}>
                                <IconComp className="w-4.5 h-4.5" />
                              </div>

                              {/* Content block */}
                              <div className="flex-1 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className={`text-xs leading-snug ${notif.is_read ? 'font-semibold text-slate-700 dark:text-slate-300' : 'font-black text-slate-900 dark:text-white'}`}>
                                    {notif.title}
                                  </h4>
                                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap mt-0.5">
                                    {new Date(notif.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                  {notif.body}
                                </p>

                                {/* Action bar underneath */}
                                <div className="flex items-center gap-3 pt-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black border ${meta.bg} ${meta.color} ${meta.border}`}>
                                    {meta.label}
                                  </span>

                                  <div className="ml-auto flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Mark Read/Unread */}
                                    {!notif.is_read && (
                                      <button
                                        onClick={() => handleMarkAsRead(notif.id)}
                                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer transition-colors"
                                        title="Marcar como lida"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {/* Archive */}
                                    {notif.deleted_at === null && (
                                      <button
                                        onClick={() => handleArchive(notif.id)}
                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer transition-colors"
                                        title="Arquivar"
                                      >
                                        <Archive className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {/* Delete */}
                                    <button
                                      onClick={() => handleDelete(notif.id)}
                                      className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                                      title="Excluir permanentemente"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PREFERENCES GRID */}
          {activeSubTab === 'preferences' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex gap-3">
                <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Gerenciamento de Canais Sincronizados</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Escolha de quais fontes e por quais canais você deseja receber os alertas da plataforma. Suas preferências são salvas em nuvem e replicadas em todos os seus aparelhos ativos em tempo real!
                  </p>
                </div>
              </div>

              {!preferences ? (
                <div className="py-10 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  <span>Carregando preferências de notificação...</span>
                </div>
              ) : (
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="p-3">Categoria</th>
                        <th className="p-3 text-center">No App</th>
                        <th className="p-3 text-center">Push Web</th>
                        <th className="p-3 text-center">E-mail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {Object.entries(CATEGORIES_META).map(([key, meta]) => {
                        const catKey = key as keyof NotificationPreferences;
                        const catPrefs = preferences[catKey] || { inApp: true, push: true, email: true };

                        return (
                          <tr key={key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-3 flex items-center gap-2">
                              <span className={`p-1.5 rounded-lg ${meta.bg} ${meta.color}`}>
                                <meta.icon className="w-3.5 h-3.5" />
                              </span>
                              <span className="font-extrabold text-slate-800 dark:text-slate-200">{meta.label}</span>
                            </td>

                            {/* In-App Channel */}
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox"
                                checked={catPrefs.inApp}
                                onChange={() => handleTogglePreference(catKey, 'inApp')}
                                className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:ring-1 cursor-pointer"
                              />
                            </td>

                            {/* Push Channel */}
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox"
                                checked={catPrefs.push}
                                onChange={() => handleTogglePreference(catKey, 'push')}
                                className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:ring-1 cursor-pointer"
                              />
                            </td>

                            {/* Email Channel */}
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox"
                                checked={catPrefs.email}
                                onChange={() => handleTogglePreference(catKey, 'email')}
                                className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:ring-1 cursor-pointer"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT EMAIL LOGS */}
          {activeSubTab === 'emails' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex gap-3">
                <History className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Auditoria de Disparos de E-mail</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Histórico detalhado de notificações disparadas por e-mail no servidor para a conta <strong className="text-slate-700 dark:text-slate-300">{user?.email || 'usuario@gamezone.com'}</strong>. Simula o tráfego SMTP de entrega do serviço.
                  </p>
                </div>
              </div>

              {emailLogs.length === 0 ? (
                <div className="py-16 text-center space-y-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Mail className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto animate-bounce" />
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-300">Sem e-mails enviados</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Nenhum e-mail foi disparado para esta conta. Ative o canal de E-mail nas Preferências e simule um alerta!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emailLogs.map((log) => (
                    <div 
                      key={log.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-indigo-500" />
                          {log.title}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-md font-mono text-[9px] font-black border border-emerald-100 dark:border-emerald-900/50">
                          {log.status}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex flex-col gap-0.5 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80">
                        <div><strong>Destinatário:</strong> {log.email}</div>
                        <div><strong>Enviado em:</strong> {new Date(log.sent_at).toLocaleString('pt-BR')}</div>
                        <div><strong>ID Transacional:</strong> {log.id}</div>
                      </div>

                      <p className="text-[10.5px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed font-medium">
                        {log.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SIMULATOR TRIGGER */}
          {activeSubTab === 'simulator' && (
            <div className="space-y-5">
              <div className="p-4 bg-gradient-to-tr from-amber-500/10 to-indigo-500/10 rounded-xl border border-amber-200/40 dark:border-indigo-950/40 flex gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Disparador Instantâneo de Alertas</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Preencha o formulário para forçar a criação de um evento transacional na plataforma. O sistema irá consultar suas regras de preferência ativas para decidir em quais canais enviar (In-App, Push Web ou E-mail)!
                  </p>
                </div>
              </div>

              <form onSubmit={handleTriggerSimulation} className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl space-y-4">
                
                {/* Notification Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Tipo de Notificação</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(CATEGORIES_META).map(([key, meta]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => { playSound.click(); setSimType(key as keyof NotificationPreferences); }}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                          simType === key
                            ? 'bg-white dark:bg-slate-800 border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-600/5'
                            : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <span className={`p-1.5 rounded-lg ${meta.bg} ${meta.color}`}>
                          <meta.icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-extrabold text-[11px] truncate">{meta.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notification Title */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Título do Alerta</label>
                  <input
                    type="text"
                    required
                    value={simTitle}
                    onChange={(e) => setSimTitle(e.target.value)}
                    placeholder="ex: 🚀 Bônus Especial Creditado!"
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white font-semibold focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
                  />
                </div>

                {/* Notification Body */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Corpo / Mensagem</label>
                  <textarea
                    required
                    rows={3}
                    value={simBody}
                    onChange={(e) => setSimBody(e.target.value)}
                    placeholder="ex: Você recebeu +100 moedas de cashback por participar das rodadas noturnas do simulador Aviador. Aproveite!"
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white font-semibold focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={simulating}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 disabled:from-indigo-400 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-95 transition-all shadow-md shadow-indigo-600/10"
                >
                  <Send className="w-4 h-4" />
                  <span>{simulating ? 'Despachando transações...' : 'Disparar Notificação Unificada'}</span>
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Footer info banner */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center justify-between">
          <span>GameZone NotifService v1.2</span>
          <span>SQLite Sync OK • SSL Encrypted</span>
        </div>
      </motion.div>
    </div>
  );
}
