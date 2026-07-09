import React, { useState } from 'react';
import { PlayerStats } from '../types';
import { AvatarRenderer } from './AvatarRenderer';
import { 
  Shield, 
  Sparkles, 
  Heart, 
  Trophy, 
  ShoppingBag, 
  Coins, 
  Swords, 
  History, 
  Wallet, 
  Award,
  LogIn,
  LogOut,
  User,
  ChevronDown,
  Chrome,
  Facebook,
  Video,
  Database,
  MessageSquare
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { getLevelForPoints } from '../utils/levelManager';
import { AppUser } from './AuthModal';

interface HeaderProps {
  stats: PlayerStats;
  activeTab: 'games' | 'avatar' | 'shop' | 'logs' | 'football' | 'cinema' | 'gamezoneshop' | 'feed' | 'profile' | 'chat';
  setActiveTab: (tab: 'games' | 'avatar' | 'shop' | 'logs' | 'football' | 'cinema' | 'gamezoneshop' | 'feed' | 'profile' | 'chat') => void;
  openCheckoutForQuickBuy: (itemId: string) => void;
  realBalance?: number;
  loggedInUser: AppUser | null;
  onLogout: () => void;
  onOpenAuthModal: () => void;
  onPrefetchTab?: (tab: 'games' | 'avatar' | 'shop' | 'logs' | 'football' | 'cinema' | 'gamezoneshop' | 'feed' | 'profile' | 'chat') => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  activeTab,
  setActiveTab,
  openCheckoutForQuickBuy,
  realBalance,
  loggedInUser,
  onLogout,
  onOpenAuthModal,
  onPrefetchTab,
  unreadCount = 0,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleTabClick = (tab: 'games' | 'avatar' | 'shop' | 'logs' | 'football' | 'cinema' | 'gamezoneshop' | 'feed' | 'profile' | 'chat') => {
    setActiveTab(tab);
    playSound.click();
  };

  const handleQuickBuyClick = (itemId: string) => {
    openCheckoutForQuickBuy(itemId);
    playSound.click();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 py-2.5 md:px-6 md:py-3.5 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        
        {/* Logo and Brand */}
        <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/10 hover:scale-105 transition-transform duration-300">
              <Swords className="w-5.5 h-5.5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg md:text-xl font-black tracking-tight text-slate-850 font-sans uppercase flex items-center gap-1">
                  GAME<span className="text-indigo-600 bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">ZONE</span>
                </h1>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100 font-bold">
                  v2.6
                </span>
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Arcade &amp; Customização Premium</p>
            </div>
          </div>

          {/* Profile & Personal Login Menu */}
          <div className="relative flex items-center gap-2">
            {loggedInUser ? (
              <div className="relative">
                {/* Clickable Profile Badge */}
                <button
                  onClick={() => {
                    playSound.click();
                    setShowUserDropdown(!showUserDropdown);
                  }}
                  className="flex items-center gap-2 p-1 md:p-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 rounded-xl transition-all cursor-pointer shadow-sm select-none group"
                >
                  {loggedInUser.avatarUrl ? (
                    <img 
                      src={loggedInUser.avatarUrl} 
                      alt={loggedInUser.name} 
                      className="w-5 h-5 md:w-6 md:h-6 rounded-lg object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] md:text-xs font-black">
                      {loggedInUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[11px] font-black text-slate-700 hidden sm:inline-block max-w-[90px] truncate">
                    {loggedInUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-500 group-hover:text-slate-700 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Overlay */}
                {showUserDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setShowUserDropdown(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xl shadow-slate-300/30 z-50 animate-scaleIn space-y-3.5 text-left">
                      
                      {/* User Main Bio */}
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                        {loggedInUser.avatarUrl ? (
                          <img 
                            src={loggedInUser.avatarUrl} 
                            alt={loggedInUser.name} 
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/10"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-base font-black ring-2 ring-indigo-500/10">
                            {loggedInUser.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-800 truncate leading-tight">{loggedInUser.name}</h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{loggedInUser.email}</p>
                        </div>
                      </div>

                      {/* Connection Provider Indicator */}
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Provedor de Acesso</span>
                        {loggedInUser.provider === 'google' && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold">
                            <Chrome className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                            <span>Conta do Google</span>
                          </div>
                        )}
                        {loggedInUser.provider === 'facebook' && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg text-[10px] font-bold">
                            <Facebook className="w-3.5 h-3.5 text-blue-500" />
                            <span>Conta do Facebook</span>
                          </div>
                        )}
                        {loggedInUser.provider === 'tiktok' && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-[10px] font-bold">
                            <Video className="w-3.5 h-3.5 text-[#fe2c55]" />
                            <span>Conta do TikTok</span>
                          </div>
                        )}
                        {loggedInUser.provider === 'email' && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg text-[10px] font-bold">
                            <User className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Cadastro Local</span>
                          </div>
                        )}
                      </div>

                      {/* Summary Stats info inside card */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150 text-[10px] font-mono space-y-1 text-slate-500">
                        <div className="flex justify-between">
                          <span>🪙 Moedas Arena:</span>
                          <span className="text-amber-500 font-bold">{stats.coins}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>❤️ Vidas Restantes:</span>
                          <span className="text-slate-800 font-bold">{stats.lives}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🏆 Nível Atual:</span>
                          <span className="text-indigo-600 font-bold">Lvl {stats.level}</span>
                        </div>
                      </div>

                      {/* Profile Settings shortcut trigger */}
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          handleTabClick('profile');
                        }}
                        className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 hover:text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Configurar Perfil 👤</span>
                      </button>

                      {/* Logout Action */}
                      <button
                        onClick={() => {
                          playSound.click();
                          onLogout();
                          setShowUserDropdown(false);
                        }}
                        className="w-full py-2 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Desconectar Conta</span>
                      </button>

                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  playSound.click();
                  onOpenAuthModal();
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-[10px] md:text-xs font-black tracking-wide cursor-pointer transition-all flex items-center gap-1 shadow-md shadow-indigo-600/10 uppercase"
                id="btn-login-trigger"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>
            )}

            {/* Quick Mini Avatar badge on desktop next to profile */}
            <div 
              className="p-1 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer hidden md:block shrink-0"
              onClick={() => handleTabClick('avatar')}
              title="Ir para Customização"
            >
              <AvatarRenderer config={stats.avatar} size="xs" animate={true} />
            </div>
          </div>
        </div>
         {/* Player Stats Panel */}
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto scrollbar-none pb-1 md:pb-0 -mx-3 px-3 md:mx-0 md:px-0 w-auto max-w-full flex-nowrap shrink-0">
          
          {/* SALDO REAL (Simulado) */}
          {realBalance !== undefined && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-150 rounded-lg shadow-[0_2px_12px_rgba(16,185,129,0.04)] shrink-0">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <div className="text-left">
                <div className="text-[8px] text-emerald-600 leading-none font-extrabold uppercase tracking-wider">Saldo de Compras</div>
                <div className="text-xs md:text-sm font-bold text-emerald-700 font-mono leading-tight">R$ {realBalance.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* VIP BADGE */}
          {stats.isVip ? (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-250 rounded-lg shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-black text-amber-600 font-mono tracking-tight">VIP</span>
            </div>
          ) : (
            <button
              onClick={() => handleQuickBuyClick('vip_all_access')}
              className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-slate-800 to-indigo-900 hover:to-indigo-800 border border-indigo-200 text-indigo-50 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all hover:scale-105 shrink-0 shadow-sm"
            >
              <Sparkles className="w-3 h-3 text-indigo-200" />
              <span>VIP</span>
            </button>
          )}

          {/* LUCKY BOOST SPINS */}
          {stats.rtpBoostSpins !== undefined && stats.rtpBoostSpins > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-cyan-50 border border-cyan-200 rounded-lg text-cyan-600 font-mono text-[10px] shrink-0 font-bold">
              <span className="animate-pulse">🍀 Sorte+</span>
              <span className="font-bold text-cyan-700">{stats.rtpBoostSpins}x</span>
            </div>
          )}

          {/* LIVES */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg shrink-0 shadow-sm">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
            <div className="text-left">
              <div className="text-[8px] text-slate-400 leading-none font-bold">Vidas</div>
              <div className="text-xs md:text-sm font-bold text-slate-800 font-mono leading-tight">{stats.lives}</div>
            </div>
            {stats.lives <= 1 && (
              <button
                onClick={() => handleQuickBuyClick('pack_lives_5')}
                className="ml-1 text-[9px] px-1.5 py-0.5 bg-rose-600 hover:bg-rose-550 text-white font-bold rounded cursor-pointer transition-colors shadow-sm"
                id="btn-quick-buy-lives"
              >
                + Vidas
              </button>
            )}
          </div>

          {/* COINS / POINTS */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg shrink-0 shadow-sm">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <div className="text-left">
              <div className="text-[8px] text-slate-400 leading-none font-bold">Moedas</div>
              <div className="text-xs md:text-sm font-bold text-amber-600 font-mono leading-tight">{stats.coins}</div>
            </div>
            <button
              onClick={() => handleQuickBuyClick('coins_500')}
              className="ml-1 text-[9px] px-1.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded cursor-pointer transition-colors shadow-sm"
              id="btn-quick-buy-coins"
            >
              + Moedas
            </button>
          </div>

          {/* PLAYER LEVEL PROGRESS */}
          {(() => {
            const currentPoints = stats.points ?? 0;
            const currentLevel = stats.level ?? 1;
            const { nextLevelPoints, currentLevelMinPoints } = getLevelForPoints(currentPoints);
            const levelRange = nextLevelPoints - currentLevelMinPoints;
            const currentProgress = currentPoints - currentLevelMinPoints;
            const percentage = Math.min(100, Math.max(0, (currentProgress / levelRange) * 100));

            return (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg shadow-inner group relative shrink-0" title={`${currentPoints} XP acumulados`}>
                <Award className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="text-[8px] text-indigo-600 font-extrabold leading-none uppercase flex items-center gap-1">
                    Lvl {currentLevel}
                  </div>
                  <div className="w-10 h-1 bg-slate-200 rounded-full overflow-hidden mt-1 border border-slate-100">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* STAGE LEVEL */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg shrink-0 shadow-sm">
            <Trophy className="w-3.5 h-3.5 text-cyan-600" />
            <div className="text-left">
              <div className="text-[8px] text-slate-400 leading-none font-bold">Estágio</div>
              <div className="text-xs md:text-sm font-bold text-cyan-600 font-mono leading-tight font-extrabold">Fase {stats.currentStage}</div>
            </div>
            <button
              onClick={() => handleQuickBuyClick('pack_skips_3')}
              className="text-[9px] px-1.5 py-0.5 bg-cyan-600 hover:bg-cyan-550 text-white font-bold rounded cursor-pointer transition-colors shadow-sm"
              id="btn-quick-skip"
            >
              Pular
            </button>
          </div>

          {/* AVATAR BADGE */}
          <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-2 shrink-0">
            <div className="p-0.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => handleTabClick('avatar')}>
              <AvatarRenderer config={stats.avatar} size="sm" animate={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-100 flex items-center justify-start gap-1.5 overflow-x-auto scrollbar-none -mx-3 px-3 md:mx-0 md:px-0 flex-nowrap w-auto max-w-full">
        <button
          onClick={() => handleTabClick('feed')}
          onMouseEnter={() => onPrefetchTab?.('feed')}
          onTouchStart={() => onPrefetchTab?.('feed')}
          className={`flex items-center gap-1.5 px-4 py-2.5 sm:px-3.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'feed'
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white border border-indigo-500/30 shadow-lg shadow-indigo-600/15 scale-[1.02]'
              : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100/50 border border-transparent'
          }`}
          id="tab-feed"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Feed da Arena 💬
        </button>

        <button
          onClick={() => handleTabClick('chat')}
          onMouseEnter={() => onPrefetchTab?.('chat')}
          onTouchStart={() => onPrefetchTab?.('chat')}
          className={`flex items-center gap-1.5 px-4 py-2.5 sm:px-3.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 relative ${
            activeTab === 'chat'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border border-emerald-500/30 shadow-lg shadow-emerald-600/15 scale-[1.02]'
              : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-100/50 border border-transparent'
          }`}
          id="tab-chat"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>GameChat 💬</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white ring-2 ring-white animate-bounce shadow">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabClick('profile')}
          onMouseEnter={() => onPrefetchTab?.('profile')}
          onTouchStart={() => onPrefetchTab?.('profile')}
          className={`flex items-center gap-1.5 px-4 py-2.5 sm:px-3.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white border border-indigo-500/30 shadow-lg shadow-indigo-600/15 scale-[1.02]'
              : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100/50 border border-transparent'
          }`}
          id="tab-profile"
        >
          <User className="w-3.5 h-3.5" />
          Meu Perfil 👤
        </button>
        <button
          onClick={() => handleTabClick('games')}
          onMouseEnter={() => onPrefetchTab?.('games')}
          onTouchStart={() => onPrefetchTab?.('games')}
          className={`flex items-center gap-1.5 px-4 py-2.5 sm:px-3.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'games'
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white border border-indigo-500/30 shadow-lg shadow-indigo-600/15 scale-[1.02]'
              : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100/50 border border-transparent'
          }`}
          id="tab-games"
        >
          <Swords className="w-3.5 h-3.5" />
          Jogar Arcade
        </button>
        <button
          onClick={() => handleTabClick('cinema')}
          onMouseEnter={() => onPrefetchTab?.('cinema')}
          onTouchStart={() => onPrefetchTab?.('cinema')}
          className={`flex items-center gap-1.5 px-4 py-2.5 sm:px-3.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'cinema'
              ? 'bg-gradient-to-r from-red-600 via-[#E50914] to-red-700 text-white border border-red-500/30 shadow-lg shadow-red-600/15 scale-[1.02]'
              : 'text-slate-500 hover:text-red-600 hover:bg-slate-100/50 border border-transparent'
          }`}
          id="tab-cinema"
        >
          <Video className="w-3.5 h-3.5 animate-pulse" />
          Sessão Cinema 🍿
        </button>
        <button
          onClick={() => handleTabClick('gamezoneshop')}
          onMouseEnter={() => onPrefetchTab?.('gamezoneshop')}
          onTouchStart={() => onPrefetchTab?.('gamezoneshop')}
          className={`flex items-center gap-1.5 px-4 py-2.5 sm:px-3.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'gamezoneshop'
              ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 text-slate-950 border border-yellow-300 shadow-lg shadow-yellow-400/20 scale-[1.02]'
              : 'text-slate-500 hover:text-amber-500 hover:bg-slate-100/50 border border-transparent'
          }`}
          id="tab-gamezoneshop"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          GamezoneShop 🛍️
        </button>
        <button
          onClick={() => handleTabClick('football')}
          onMouseEnter={() => onPrefetchTab?.('football')}
          onTouchStart={() => onPrefetchTab?.('football')}
          className={`flex items-center gap-1.5 px-4 py-2.5 sm:px-3.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'football'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border border-emerald-500/30 shadow-lg shadow-emerald-600/15 scale-[1.02]'
              : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-100/50 border border-transparent'
          }`}
          id="tab-football"
        >
          <Trophy className="w-3.5 h-3.5" />
          Palpites de Futebol
        </button>
        <button
          onClick={() => handleTabClick('avatar')}
          onMouseEnter={() => onPrefetchTab?.('avatar')}
          onTouchStart={() => onPrefetchTab?.('avatar')}
          className={`flex items-center gap-1.5 px-4 py-2.5 sm:px-3.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'avatar'
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white border border-indigo-500/30 shadow-lg shadow-indigo-600/15 scale-[1.02]'
              : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100/50 border border-transparent'
          }`}
          id="tab-avatar"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Customizar Avatar
        </button>
        <button
          onClick={() => handleTabClick('shop')}
          onMouseEnter={() => onPrefetchTab?.('shop')}
          onTouchStart={() => onPrefetchTab?.('shop')}
          className={`flex items-center gap-1.5 px-4 py-2.5 sm:px-3.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'shop'
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white border border-indigo-500/30 shadow-lg shadow-indigo-600/15 scale-[1.02]'
              : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100/50 border border-transparent'
          }`}
          id="tab-shop"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Loja Segura
        </button>
        <button
          onClick={() => handleTabClick('logs')}
          onMouseEnter={() => onPrefetchTab?.('logs')}
          onTouchStart={() => onPrefetchTab?.('logs')}
          className={`flex items-center gap-1.5 px-4 py-2.5 sm:px-3.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'logs'
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white border border-indigo-500/30 shadow-lg shadow-indigo-600/15 scale-[1.02]'
              : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100/50 border border-transparent'
          }`}
          id="tab-logs"
        >
          <History className="w-3.5 h-3.5" />
          Extrato Seguro
        </button>
      </div>
    </header>
  );
};
