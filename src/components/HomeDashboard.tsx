import React, { useState, useEffect } from 'react';
import { 
  Swords, 
  Tv, 
  ShoppingBag, 
  MessageSquare, 
  Award, 
  Trophy, 
  Star, 
  Sparkles, 
  Heart, 
  Coins, 
  User, 
  Bell, 
  ChevronRight, 
  Plus, 
  EyeOff, 
  Eye, 
  Move, 
  Maximize2, 
  Minimize2, 
  Settings, 
  Compass, 
  Search, 
  Calendar, 
  Users, 
  Flame, 
  Zap, 
  X,
  RefreshCw,
  Gift,
  Grid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '../utils/audio';

// Dynamic sliding banner item definitions
interface BannerSlide {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  bgGradient: string;
  image: string;
  cta: string;
}

const HERO_SLIDES: BannerSlide[] = [
  {
    id: 1,
    title: "TORNEIO ARENA SUPREMA 2026",
    subtitle: "Inscreva-se hoje e dispute R$ 50.000 em prêmios no Jumper Pro!",
    badge: "INSCRICÕES ABERTAS",
    bgGradient: "from-indigo-600 via-purple-600 to-pink-600",
    image: "🏆",
    cta: "Inscrever-se Agora"
  },
  {
    id: 2,
    title: "NOVO PASSE DE BATALHA ATIVO",
    subtitle: "Complete missões diárias no Arcade para desbloquear skins lendárias.",
    badge: "TEMPORADA 4",
    bgGradient: "from-emerald-600 via-teal-600 to-cyan-600",
    image: "🎁",
    cta: "Ver Passe de Batalha"
  },
  {
    id: 3,
    title: "CINE LOUNGE EXCLUSIVO",
    subtitle: "Assista a trailers épicos e gameplays ao vivo com áudio imersivo.",
    badge: "STREAMING LIVE",
    bgGradient: "from-rose-600 via-red-600 to-amber-600",
    image: "🍿",
    cta: "Abrir Cine Lounge"
  }
];

// Interactive Widgets definitions
interface DashboardWidget {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  visible: boolean;
  size: 'small' | 'medium' | 'large';
  category: string;
}

interface HomeDashboardProps {
  stats: any;
  updateStats: (updater: (prev: any) => any) => void;
  addLog: (type: string, desc: string, amount: number, currency: string) => void;
  setActiveTab: (tab: any) => void;
  loggedInUser: any;
  onOpenAuthModal: () => void;
  realBalance: number;
  setRealBalance: React.Dispatch<React.SetStateAction<number>>;
  onTriggerToast: (msg: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  stats,
  updateStats,
  addLog,
  setActiveTab,
  loggedInUser,
  onOpenAuthModal,
  realBalance,
  setRealBalance,
  onTriggerToast
}) => {
  // Theme and UI States
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Rotating Slide interval
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, []);

  // Personalized Customizable Widgets State
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    const cached = localStorage.getItem('gamezone_dashboard_widgets_v2');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return [
      { id: 'recent_games', title: 'Jogos Recentes & Arcade', icon: Swords, visible: true, size: 'large', category: 'games' },
      { id: 'lives', title: 'Lives em Destaque', icon: Tv, visible: true, size: 'medium', category: 'media' },
      { id: 'marketplace', title: 'Marketplace Destaques', icon: ShoppingBag, visible: true, size: 'medium', category: 'shop' },
      { id: 'chat_quick', title: 'Mensagens Rápidas', icon: MessageSquare, visible: true, size: 'small', category: 'social' },
      { id: 'events', title: 'Eventos Ativos & Passes', icon: Award, visible: true, size: 'medium', category: 'events' },
      { id: 'tournaments', title: 'Torneios Globais', icon: Trophy, visible: true, size: 'medium', category: 'events' },
      { id: 'achievements', title: 'Conquistas Desbloqueadas', icon: Star, visible: true, size: 'small', category: 'social' },
      { id: 'inventory', title: 'Meu Inventário Gamer', icon: Sparkles, visible: true, size: 'small', category: 'profile' },
      { id: 'missions', title: 'Missões Diárias', icon: Flame, visible: true, size: 'medium', category: 'profile' },
      { id: 'stats_economy', title: 'Moedas & Progresso XP', icon: Coins, visible: true, size: 'small', category: 'profile' },
      { id: 'friends', title: 'Amigos Online', icon: Users, visible: true, size: 'small', category: 'social' },
      { id: 'notifications', title: 'Notificações Rápidas', icon: Bell, visible: true, size: 'small', category: 'social' },
      { id: 'creators', title: 'Criadores Favoritos', icon: User, visible: true, size: 'small', category: 'media' },
      { id: 'stores', title: 'Lojas Favoritas', icon: ShoppingBag, visible: true, size: 'small', category: 'shop' },
    ];
  });

  const saveWidgets = (updatedWidgets: DashboardWidget[]) => {
    setWidgets(updatedWidgets);
    localStorage.setItem('gamezone_dashboard_widgets_v2', JSON.stringify(updatedWidgets));
  };

  // Toggle visible widget
  const toggleWidgetVisibility = (id: string) => {
    playSound.click();
    const updated = widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    saveWidgets(updated);
  };

  // Toggle size of a widget
  const rotateWidgetSize = (id: string) => {
    playSound.click();
    const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
    const updated = widgets.map(w => {
      if (w.id === id) {
        const currentIndex = sizes.indexOf(w.size);
        const nextSize = sizes[(currentIndex + 1) % sizes.length];
        return { ...w, size: nextSize };
      }
      return w;
    });
    saveWidgets(updated);
  };

  // Move widget position
  const moveWidget = (index: number, direction: 'up' | 'down') => {
    playSound.click();
    const newWidgets = [...widgets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newWidgets.length) {
      const temp = newWidgets[index];
      newWidgets[index] = newWidgets[targetIndex];
      newWidgets[targetIndex] = temp;
      saveWidgets(newWidgets);
    }
  };

  // Reset customizer layout
  const handleResetLayout = () => {
    playSound.click();
    localStorage.removeItem('gamezone_dashboard_widgets_v2');
    setWidgets([
      { id: 'recent_games', title: 'Jogos Recentes & Arcade', icon: Swords, visible: true, size: 'large', category: 'games' },
      { id: 'lives', title: 'Lives em Destaque', icon: Tv, visible: true, size: 'medium', category: 'media' },
      { id: 'marketplace', title: 'Marketplace Destaques', icon: ShoppingBag, visible: true, size: 'medium', category: 'shop' },
      { id: 'chat_quick', title: 'Mensagens Rápidas', icon: MessageSquare, visible: true, size: 'small', category: 'social' },
      { id: 'events', title: 'Eventos Ativos & Passes', icon: Award, visible: true, size: 'medium', category: 'events' },
      { id: 'tournaments', title: 'Torneios Globais', icon: Trophy, visible: true, size: 'medium', category: 'events' },
      { id: 'achievements', title: 'Conquistas Desbloqueadas', icon: Star, visible: true, size: 'small', category: 'social' },
      { id: 'inventory', title: 'Meu Inventário Gamer', icon: Sparkles, visible: true, size: 'small', category: 'profile' },
      { id: 'missions', title: 'Missões Diárias', icon: Flame, visible: true, size: 'medium', category: 'profile' },
      { id: 'stats_economy', title: 'Moedas & Progresso XP', icon: Coins, visible: true, size: 'small', category: 'profile' },
      { id: 'friends', title: 'Amigos Online', icon: Users, visible: true, size: 'small', category: 'social' },
      { id: 'notifications', title: 'Notificações Rápidas', icon: Bell, visible: true, size: 'small', category: 'social' },
      { id: 'creators', title: 'Criadores Favoritos', icon: User, visible: true, size: 'small', category: 'media' },
      { id: 'stores', title: 'Lojas Favoritas', icon: ShoppingBag, visible: true, size: 'small', category: 'shop' },
    ]);
    onTriggerToast('⚡ Layout padrão do painel redefinido com sucesso.');
  };

  // Simulated daily mission claims
  const [missions, setMissions] = useState([
    { id: 1, text: "Jogar Jumper Arcade por 2 rodadas", coinsReward: 50, xpReward: 100, completed: false },
    { id: 2, text: "Enviar uma mensagem no GameChat", coinsReward: 30, xpReward: 50, completed: false },
    { id: 3, text: "Ver 1 trailer na Sessão Cinema", coinsReward: 40, xpReward: 80, completed: false },
  ]);

  const claimMission = (id: number) => {
    playSound.collect();
    setMissions(prev => prev.map(m => m.id === id ? { ...m, completed: true } : m));
    const target = missions.find(m => m.id === id);
    if (target) {
      updateStats(prev => ({
        ...prev,
        coins: prev.coins + target.coinsReward,
        points: (prev.points ?? 0) + target.xpReward
      }));
      addLog('earn', `Missão diária concluída: ${target.text}`, target.coinsReward, 'coins');
      onTriggerToast(`🎁 Parabéns! Você ganhou +${target.coinsReward} Moedas e +${target.xpReward} XP!`);
    }
  };

  // Filter widgets by search query
  const filteredWidgets = widgets.filter(w => 
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 select-none">
      
      {/* Dynamic Animated Carousel Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-2xl h-64 sm:h-80 md:h-96">
        <AnimatePresence mode="wait">
          {HERO_SLIDES.map((slide, index) => {
            if (index !== currentSlide) return null;
            return (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5, cubicBezier: [0.16, 1, 0.3, 1] }}
                className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} p-6 sm:p-12 flex flex-col justify-center text-white relative`}
              >
                {/* Visual grid decor overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-30" />
                
                <div className="relative z-10 max-w-xl space-y-4">
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-[10px] tracking-widest font-black rounded-full uppercase">
                    {slide.badge}
                  </span>
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none uppercase">
                    {slide.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-100 font-medium">
                    {slide.subtitle}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        playSound.click();
                        if (slide.id === 1) setActiveTab('events');
                        else if (slide.id === 2) setActiveTab('events');
                        else if (slide.id === 3) setActiveTab('cinema');
                      }}
                      className="px-6 py-3 bg-white text-slate-900 text-xs font-bold rounded-2xl shadow-lg shadow-black/10 hover:bg-slate-100 cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                      <Zap className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
                      {slide.cta}
                    </button>
                    <button
                      onClick={() => {
                        playSound.click();
                        setActiveTab('games');
                      }}
                      className="px-6 py-3 bg-transparent border border-white/30 hover:border-white/60 hover:bg-white/10 text-white text-xs font-bold rounded-2xl cursor-pointer transition-all flex items-center gap-2"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      Jogar Jumper
                    </button>
                  </div>
                </div>

                {/* Ambient dynamic float representation */}
                <div className="absolute right-8 md:right-16 bottom-6 md:bottom-12 text-[100px] sm:text-[150px] md:text-[200px] opacity-20 pointer-events-none animate-float select-none">
                  {slide.image}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Manual Slides Dot Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-slate-950/40 backdrop-blur-md px-3 py-1.5 rounded-full">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { playSound.click(); setCurrentSlide(i); }}
              className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                i === currentSlide ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Control Area: Customize Dashboard Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl backdrop-blur-md shadow-xl">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Grid className="w-5 h-5 text-indigo-500 animate-pulse" />
            Painel Gamer Inteligente
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Personalize seu dashboard ativo. Reorganize, oculte ou redimensione os widgets de jogo em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Search */}
          <div className="relative min-w-[180px] sm:min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar componentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-medium"
            />
          </div>

          <button
            onClick={() => { playSound.click(); setIsCustomizing(!isCustomizing); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isCustomizing
                ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-md animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
            }`}
          >
            <Settings className="w-3.5 h-3.5 animate-spin-slow" />
            {isCustomizing ? 'Salvar Configuração 💾' : 'Customizar Painel 🛠️'}
          </button>

          {isCustomizing && (
            <button
              onClick={handleResetLayout}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1"
              title="Redefinir Layout"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout containing customizable widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWidgets.map((widget, idx) => {
          // If not customizing and the widget is hidden, don't show it!
          if (!isCustomizing && !widget.visible) return null;

          const IconComponent = widget.icon;
          
          // Class width calculation based on size
          let sizeClass = 'col-span-1';
          if (widget.size === 'medium') sizeClass = 'md:col-span-1 lg:col-span-2';
          if (widget.size === 'large') sizeClass = 'md:col-span-2 lg:col-span-3';

          return (
            <motion.div
              layout
              key={widget.id}
              className={`${sizeClass} rounded-2xl bg-white dark:bg-slate-900 border ${
                widget.visible 
                  ? 'border-slate-200/70 dark:border-slate-800/80 shadow-md' 
                  : 'border-dashed border-slate-300 dark:border-slate-700 opacity-60 bg-slate-50/50 dark:bg-slate-950/50'
              } flex flex-col overflow-hidden relative group`}
            >
              {/* Widget Header */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${
                    widget.visible 
                      ? 'bg-indigo-500/10 text-indigo-500' 
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                    {widget.title}
                  </h3>
                </div>

                {/* Customizable Controls visible ONLY when customizing */}
                {isCustomizing ? (
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl">
                    {/* Hide Toggle */}
                    <button
                      onClick={() => toggleWidgetVisibility(widget.id)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      title={widget.visible ? 'Ocultar Widget' : 'Exibir Widget'}
                    >
                      {widget.visible ? <Eye className="w-3.5 h-3.5 text-indigo-500" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    {/* Size Toggle */}
                    <button
                      onClick={() => rotateWidgetSize(widget.id)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-0.5"
                      title={`Tamanho: ${widget.size.toUpperCase()}`}
                    >
                      <Maximize2 className="w-3 h-3 text-emerald-500" />
                      <span className="text-[9px] font-mono font-bold uppercase">{widget.size[0]}</span>
                    </button>
                    {/* Position Move */}
                    <button
                      disabled={idx === 0}
                      onClick={() => moveWidget(idx, 'up')}
                      className="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                    >
                      ▲
                    </button>
                    <button
                      disabled={idx === widgets.length - 1}
                      onClick={() => moveWidget(idx, 'down')}
                      className="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                    >
                      ▼
                    </button>
                  </div>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>

              {/* Widget Body Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                
                {/* 1. Jogos Recentes Content */}
                {widget.id === 'recent_games' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Inicie e jogue instantaneamente os minijogos do arcade e tente bater o seu recorde!
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'jumper', name: 'Jumper Jogo', icon: '🏃', color: 'from-blue-500 to-indigo-600', tab: 'games' },
                        { id: 'tiger', name: 'Tiger Fortuna', icon: '🐯', color: 'from-amber-500 to-red-600', tab: 'games' },
                        { id: 'roulette', name: 'Roleta Royale', icon: '🎰', color: 'from-emerald-500 to-teal-600', tab: 'games' },
                        { id: 'aviator', name: 'Aviator Express', icon: '✈️', color: 'from-rose-500 to-purple-600', tab: 'games' },
                      ].map(g => (
                        <button
                          key={g.id}
                          onClick={() => { playSound.click(); setActiveTab(g.tab); }}
                          className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800/80 rounded-xl text-center space-y-1.5 cursor-pointer transition-all hover:-translate-y-0.5"
                        >
                          <span className="text-2xl block">{g.icon}</span>
                          <span className="text-[10px] font-black uppercase tracking-tight block text-slate-800 dark:text-slate-200">{g.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Lives em Destaque Content */}
                {widget.id === 'lives' && (
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 h-32 bg-slate-900 group/video">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                      <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-rose-600 text-[9px] font-black tracking-widest px-2 py-0.5 rounded-md text-white animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                        LIVE
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between text-white">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold truncate">Copa Pro Jumper - Semifinal ao Vivo</p>
                          <p className="text-[8px] text-slate-300 font-mono">3.402 assistindo • speed_gamer</p>
                        </div>
                        <button
                          onClick={() => { playSound.click(); setActiveTab('creatorhub'); }}
                          className="p-1.5 bg-indigo-600 rounded-full hover:bg-indigo-500 cursor-pointer transition-all"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="absolute inset-0 flex items-center justify-center text-4xl opacity-40 group-hover/video:scale-110 transition-transform">🎮</span>
                    </div>
                  </div>
                )}

                {/* 3. Marketplace Content */}
                {widget.id === 'marketplace' && (
                  <div className="space-y-3">
                    <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
                      {[
                        { id: '1', name: 'Kit VIP Ouro', price: 'R$ 29,90', bonus: '+2.000 moedas', icon: '👑' },
                        { id: '2', name: 'Aura Chama Neon', price: 'R$ 14,90', bonus: 'Cosmético Lendário', icon: '🔥' },
                        { id: '3', name: 'Pack Iniciante', price: 'R$ 9,90', bonus: '+500 moedas', icon: '📦' },
                      ].map(item => (
                        <div key={item.id} className="min-w-[130px] p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-xl space-y-2 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-[9px] font-bold text-indigo-500 font-mono">{item.price}</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-black truncate text-slate-800 dark:text-slate-100">{item.name}</p>
                            <p className="text-[8px] text-slate-500 dark:text-slate-400 font-medium">{item.bonus}</p>
                          </div>
                          <button
                            onClick={() => { playSound.click(); setActiveTab('shop'); }}
                            className="w-full py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black rounded-lg cursor-pointer transition-all"
                          >
                            COMPRAR
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Chat Quick Preview */}
                {widget.id === 'chat_quick' && (
                  <div className="space-y-2.5">
                    {[
                      { user: 'felipe_joga', msg: 'Alguém para o torneio de amanhã?', time: '2m' },
                      { user: 'luna_neon', msg: 'Roleta tá pagando muito hoje kkk', time: '5m' },
                    ].map((c, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                          {c.user[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-bold text-indigo-500">{c.user}</p>
                            <span className="text-[8px] text-slate-400">{c.time}</span>
                          </div>
                          <p className="text-[9px] text-slate-600 dark:text-slate-300 font-medium truncate">{c.msg}</p>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => { playSound.click(); setActiveTab('chat'); }}
                      className="w-full text-center text-[10px] font-black text-indigo-500 hover:underline pt-1 cursor-pointer"
                    >
                      ABRIR CHAT DA ARENA 💬
                    </button>
                  </div>
                )}

                {/* 5. Eventos Content */}
                {widget.id === 'events' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/15 border border-amber-500/20 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 tracking-tight">PASSE DE BATALHA ATIVO</p>
                        <p className="text-[8px] text-slate-500 dark:text-slate-400 font-bold">Nível 12 / 100 XP Restante</p>
                      </div>
                      <button
                        onClick={() => { playSound.click(); setActiveTab('events'); }}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9px] font-black rounded-lg cursor-pointer transition-all"
                      >
                        REIVINDICAR
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. Torneios Globais */}
                {widget.id === 'tournaments' && (
                  <div className="space-y-2.5">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 bg-indigo-500/15 text-indigo-500 text-[8px] font-black rounded">DOMINGO, 16H</span>
                        <span className="text-[8px] text-slate-400 font-mono">1.204 inscritos</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-800 dark:text-slate-100">CUP AMADOR: JUMPER RUNNER</p>
                      <button
                        onClick={() => { playSound.click(); setActiveTab('events'); }}
                        className="w-full py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[9px] font-black rounded-lg cursor-pointer transition-all"
                      >
                        INSCREVER-SE GRÁTIS
                      </button>
                    </div>
                  </div>
                )}

                {/* 7. Conquistas */}
                {widget.id === 'achievements' && (
                  <div className="space-y-2">
                    {[
                      { title: 'Primeiro Salto', desc: 'Sua primeira pontuação', unlocked: true, icon: '🌟' },
                      { title: 'Mestre da Roleta', desc: 'Ganhar 5 vezes seguidas', unlocked: false, icon: '👑' },
                    ].map((ac, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/30 dark:border-slate-800/60 rounded-xl">
                        <span className="text-base">{ac.icon}</span>
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-slate-800 dark:text-slate-100">{ac.title}</p>
                          <p className="text-[8px] text-slate-500 dark:text-slate-400">{ac.desc}</p>
                        </div>
                        <span className={`text-[8px] font-black ml-auto px-1.5 py-0.5 rounded ${
                          ac.unlocked ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 text-slate-400'
                        }`}>
                          {ac.unlocked ? 'FÉRTIL' : 'BLOQ'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 8. Inventário */}
                {widget.id === 'inventory' && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Total de itens desbloqueados: {stats.unlockedSkins?.length + stats.unlockedAccessories?.length}</p>
                    <div className="flex gap-2">
                      <span className="p-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-lg text-xs" title="Skins">👕 {stats.unlockedSkins?.length || 1}</span>
                      <span className="p-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 rounded-lg text-xs" title="Acessórios">🕶️ {stats.unlockedAccessories?.length || 1}</span>
                    </div>
                    <button
                      onClick={() => { playSound.click(); setActiveTab('avatar'); }}
                      className="w-full py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black rounded-lg cursor-pointer transition-all"
                    >
                      EQUIPAR ITENS 👤
                    </button>
                  </div>
                )}

                {/* 9. Missões Diárias */}
                {widget.id === 'missions' && (
                  <div className="space-y-2.5">
                    {missions.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-800/60 rounded-xl">
                        <div className="space-y-0.5 max-w-[70%]">
                          <p className="text-[9px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{m.text}</p>
                          <p className="text-[8px] text-amber-500 font-mono">+{m.coinsReward} Moedas • +{m.xpReward} XP</p>
                        </div>
                        <button
                          disabled={m.completed}
                          onClick={() => claimMission(m.id)}
                          className={`px-2.5 py-1 text-[9px] font-black rounded-lg cursor-pointer transition-all ${
                            m.completed
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          {m.completed ? 'CONCLUÍDO' : 'CONCLUIR'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 10. Coins & XP Progresso */}
                {widget.id === 'stats_economy' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">CARTEIRA COINS</span>
                      </div>
                      <span className="text-xs font-black font-mono text-amber-600 dark:text-amber-400">{stats.coins} COINS</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase">
                        <span>NÍVEL {stats.level ?? 1}</span>
                        <span>{stats.points ?? 0} / 1000 XP</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${((stats.points ?? 0) % 1000) / 10}%` }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. Amigos Online */}
                {widget.id === 'friends' && (
                  <div className="space-y-2">
                    {[
                      { name: 'rodrigo_pro', active: 'Jogando Jumper', avatar: '👾' },
                      { name: 'aline_stream', active: 'Assistindo Cinema', avatar: '⭐' },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-sm">{f.avatar}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-black text-slate-800 dark:text-slate-100 truncate">{f.name}</p>
                          <p className="text-[8px] text-emerald-500 font-semibold">{f.active}</p>
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 12. Notificações Rápidas */}
                {widget.id === 'notifications' && (
                  <div className="space-y-2">
                    {[
                      { text: 'Sua transferência Pix de R$ 50 foi processada!', type: 'success' },
                      { text: 'Novo evento de Jumper inicia neste domingo.', type: 'info' }
                    ].map((n, i) => (
                      <div key={i} className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl text-[9px] font-medium text-slate-600 dark:text-slate-300">
                        {n.text}
                      </div>
                    ))}
                  </div>
                )}

                {/* 13. Criadores Favoritos */}
                {widget.id === 'creators' && (
                  <div className="space-y-2">
                    {[
                      { name: 'speed_gamer', streams: 'Arcade', likes: 120 },
                      { name: 'neon_rider', streams: 'Cinema', likes: 98 }
                    ].map((cr, i) => (
                      <div key={i} className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl">
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-slate-800 dark:text-slate-100">{cr.name}</p>
                          <p className="text-[8px] text-slate-500">{cr.streams}</p>
                        </div>
                        <button
                          onClick={() => { playSound.click(); onTriggerToast(`Favoritado: ${cr.name}!`); }}
                          className="p-1 text-pink-500 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Heart className="w-3 h-3 fill-pink-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 14. Lojas Favoritas */}
                {widget.id === 'stores' && (
                  <div className="space-y-2">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1 text-center">
                      <p className="text-[10px] font-black text-slate-800 dark:text-slate-100">LOJA SPEEDY NEON VIP</p>
                      <button
                        onClick={() => { playSound.click(); setActiveTab('gamezoneshop'); }}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black rounded-lg cursor-pointer transition-all"
                      >
                        VISITAR LOJA 🛍️
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
};
