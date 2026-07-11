import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Swords, 
  Tv, 
  ShoppingBag, 
  MessageSquare, 
  Award, 
  Trophy, 
  Sparkles, 
  User, 
  Settings, 
  Shield, 
  Wallet, 
  History, 
  Workflow, 
  Video, 
  Network, 
  LogOut, 
  LogIn, 
  Flame, 
  Coins, 
  Palette,
  Home,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '../utils/audio';
import { getLevelForPoints } from '../utils/levelManager';
import { AvatarRenderer } from './AvatarRenderer';

interface SidebarProps {
  stats: any;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  loggedInUser: any;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  unreadCount: number;
  gamerTheme: string;
  setGamerTheme: (theme: string) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onTriggerToast: (msg: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  adminOnly?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  stats,
  activeTab,
  setActiveTab,
  loggedInUser,
  onOpenAuthModal,
  onLogout,
  unreadCount,
  gamerTheme,
  setGamerTheme,
  isOpenMobile,
  setIsOpenMobile,
  onTriggerToast
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // Available themes definitions
  const THEMES_LIST = [
    { id: 'cyber-green', name: 'Cyber Green', color: 'bg-emerald-500', accent: '#10b981' },
    { id: 'neon-blue', name: 'Neon Blue', color: 'bg-cyan-500', accent: '#06b6d4' },
    { id: 'purple-tech', name: 'Purple Tech', color: 'bg-purple-500', accent: '#a855f7' },
    { id: 'red-inferno', name: 'Red Inferno', color: 'bg-red-500', accent: '#ef4444' },
    { id: 'dark-carbon', name: 'Dark Carbon', color: 'bg-slate-600', accent: '#94a3b8' },
    { id: 'midnight', name: 'Midnight White', color: 'bg-zinc-300', accent: '#ffffff' }
  ];

  // Menu links categorized
  const MENU_SECTIONS: MenuSection[] = [
    {
      title: 'Início',
      items: [
        { id: 'home', label: 'Painel Geral', icon: Home, badge: 'NOVO' },
        { id: 'modules', label: 'Painel do Ecossistema', icon: Workflow }
      ]
    },
    {
      title: 'Entretenimento',
      items: [
        { id: 'games', label: 'Arcade Gamer', icon: Swords },
        { id: 'cinema', label: 'Sessão Cinema', icon: Video },
        { id: 'gamehub', label: 'GameHub & LiveHub', icon: Network },
        { id: 'creatorhub', label: 'Creator Hub', icon: Tv }
      ]
    },
    {
      title: 'Social & Arena',
      items: [
        { id: 'feed', label: 'Feed da Arena', icon: MessageSquare },
        { id: 'chat', label: 'GameChat Coletivo', icon: MessageSquare, badge: unreadCount > 0 ? String(unreadCount) : undefined },
        { id: 'football', label: 'Palpites de Futebol', icon: Trophy },
        { id: 'events', label: 'Passe & Eventos', icon: Award, badge: '🏆' },
        { id: 'avatar', label: 'Customizar Avatar', icon: Sparkles }
      ]
    },
    {
      title: 'Mercado & Finanças',
      items: [
        { id: 'gamezoneshop', label: 'GamezoneShop E-commerce', icon: ShoppingBag },
        { id: 'shop', label: 'Loja VIP & Boosters', icon: ShoppingBag },
        { id: 'logs', label: 'Histórico & Extratos', icon: History },
        { id: 'finance', label: 'Portal Financeiro', icon: Wallet }
      ]
    },
    {
      title: 'Configurações',
      items: [
        { id: 'security', label: 'Segurança & LGPD', icon: Shield },
        { id: 'admin', label: 'Portal Admin', icon: Settings, adminOnly: true }
      ]
    }
  ];

  const handleLinkClick = (tabId: string) => {
    setActiveTab(tabId);
    playSound.click();
    setIsOpenMobile(false); // Close drawer on click for mobile
  };

  const handleThemeChange = (themeId: string) => {
    playSound.click();
    setGamerTheme(themeId);
    onTriggerToast(`🎨 Tema alterado para: ${themeId.replace('-', ' ').toUpperCase()}`);
  };

  // Filter links based on search query
  const filteredSections = MENU_SECTIONS.map(section => {
    const items = section.items.filter(item => {
      // Admin filter
      if (item.adminOnly && loggedInUser?.role !== 'admin') return false;
      return item.label.toLowerCase().includes(searchQuery.toLowerCase());
    });
    return { ...section, items };
  }).filter(section => section.items.length > 0);

  // Level computation helper
  const { level: currentLevel, currentLevelMinPoints: minPoints, nextLevelPoints: maxPoints } = getLevelForPoints(stats.points ?? 0);
  const levelRange = maxPoints - minPoints;
  const currentProgress = (stats.points ?? 0) - minPoints;
  const xpPercentage = levelRange > 0 ? Math.min(100, Math.max(0, (currentProgress / levelRange) * 100)) : 100;

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between select-none">
      
      {/* Top Brand Logo & Toggle */}
      <div>
        <div className="p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-md text-white shrink-0">
              <Swords className="w-5 h-5 animate-pulse" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="leading-none"
              >
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase font-display block">
                  GAME<span className="text-indigo-600">ZONE</span>
                </span>
                <span className="text-[9px] text-slate-400 font-mono">ESTÚDIO DE JOGOS</span>
              </motion.div>
            )}
          </div>

          {/* Collapsible toggle button - desktop only */}
          <button
            onClick={() => { playSound.click(); setIsCollapsed(!isCollapsed); }}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User profile compact section */}
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/10">
          <div className={`flex ${isCollapsed ? 'justify-center' : 'items-center gap-3'}`}>
            <div className="relative cursor-pointer" onClick={() => handleLinkClick('profile')}>
              <div className="p-0.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:scale-105 transition-transform">
                <AvatarRenderer config={stats.avatar} size="sm" animate={true} />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 animate-pulse" title="Online" />
            </div>

            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5 uppercase tracking-wide">
                  {loggedInUser ? loggedInUser.displayName || loggedInUser.email?.split('@')[0] : 'Convidado'}
                </p>
                
                {/* Level / XP display */}
                <div className="mt-1 space-y-0.5">
                  <div className="flex justify-between text-[8px] text-slate-500 font-bold">
                    <span>LVL {currentLevel}</span>
                    <span>{stats.points ?? 0} XP</span>
                  </div>
                  <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${xpPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Coins Indicator */}
                <div className="mt-1.5 flex items-center gap-1 text-[10px] font-black text-amber-500 font-mono">
                  <Coins className="w-3 h-3 text-amber-500 animate-bounce" style={{ animationDuration: '3s' }} />
                  <span>{stats.coins} COINS</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Integrated search filter - only visible when expanded */}
        {!isCollapsed && (
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar canais..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-medium"
              />
            </div>
          </div>
        )}

        {/* Menu Links Navigation Container */}
        <div className="px-2 py-3 space-y-4 max-h-[calc(100vh-340px)] overflow-y-auto scrollbar-none">
          {filteredSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <h4 className="px-3 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {section.title}
                </h4>
              )}

              <div className="space-y-0.5">
                {section.items.map(item => {
                  const LinkIcon = item.icon;
                  const isLinkActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleLinkClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer group ${
                        isLinkActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                          : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-900/60'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <LinkIcon className={`w-4 h-4 shrink-0 transition-transform ${isLinkActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                      
                      {!isCollapsed && (
                        <span className="truncate flex-1 text-left">{item.label}</span>
                      )}

                      {/* Optional badges */}
                      {item.badge && !isCollapsed && (
                        <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded-md leading-none">
                          {item.badge}
                        </span>
                      )}

                      {/* Collapsed Badge Dot indicator */}
                      {item.badge && isCollapsed && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Area: Login/Logout & Themes selector */}
      <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
        {/* Themes Palette Button */}
        <div className="relative">
          <button
            onClick={() => { playSound.click(); setShowThemeSelector(!showThemeSelector); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-900/60 ${isCollapsed ? 'justify-center' : ''}`}
            title="Escolher Tema Visual"
          >
            <Palette className="w-4 h-4 text-pink-500 animate-pulse" />
            {!isCollapsed && <span className="flex-1 text-left">Escolher Tema</span>}
          </button>

          {/* Dropup list of visual themes */}
          <AnimatePresence>
            {showThemeSelector && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-12 left-0 right-0 z-50 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl space-y-1 min-w-[160px]"
              >
                <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 px-1.5 pb-1 uppercase tracking-wider">
                  TEMAS DO SISTEMA
                </div>
                {THEMES_LIST.map(themeItem => (
                  <button
                    key={themeItem.id}
                    onClick={() => { handleThemeChange(themeItem.id); setShowThemeSelector(false); }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      gamerTheme === themeItem.id
                        ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 font-extrabold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${themeItem.color} shadow-sm border border-black/10`} />
                      <span>{themeItem.name}</span>
                    </div>
                    {gamerTheme === themeItem.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic LogIn/LogOut button */}
        {loggedInUser ? (
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate flex-1 text-left">Sair da Sessão</span>}
          </button>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className={`w-full flex items-center gap-3 px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold cursor-pointer transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogIn className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate flex-1 text-left">Fazer Login</span>}
          </button>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* Sidebar Desktop view container */}
      <aside 
        className={`hidden lg:flex flex-col border-r border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-950/80 backdrop-blur-md h-screen sticky top-0 z-30 transition-all duration-300 shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar Mobile Left Drawer (Hamburger menu) */}
      <AnimatePresence>
        {isOpenMobile && (
          <>
            {/* Dark blur backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpenMobile(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            />

            {/* Main drawer body */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-950 z-50 lg:hidden shadow-2xl flex flex-col border-r border-slate-200/50 dark:border-slate-850"
            >
              <div className="absolute top-4 right-4 z-50">
                <button
                  onClick={() => setIsOpenMobile(false)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="h-full pt-4">
                {sidebarContent}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
