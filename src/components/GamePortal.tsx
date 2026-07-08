import React, { useState } from 'react';
import { PlayerStats, ShopItem } from '../types';
import { GameRunner } from './GameRunner';
import { RouletteGame } from './RouletteGame';
import { TigerGame } from './TigerGame';
import { AviatorGame } from './AviatorGame';
import { FootballBets } from './FootballBets';
import { playSound } from '../utils/audio';
import { Swords, Zap, Trophy, Heart, Coins, ArrowRight, ShieldCheck, PlayCircle, Star, Sparkles, Flame, Plane, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdBanner } from './AdBanner';
import { AppUser } from './AuthModal';

interface GamePortalProps {
  stats: PlayerStats;
  updateStats: (updater: (prev: PlayerStats) => PlayerStats) => void;
  addLog: (type: 'earn' | 'purchase_coins' | 'purchase_booster' | 'purchase_cosmetic' | 'stage_skip', desc: string, amount: number, currency: 'coins' | 'real') => void;
  openShop: () => void;
  openCheckoutForQuickBuy: (itemId: string) => void;
  loggedInUser: AppUser | null;
  onOpenAuthModal: () => void;
  realBalance: number;
  setRealBalance: React.Dispatch<React.SetStateAction<number>>;
  withdrawLimit: number;
  setWithdrawLimit: React.Dispatch<React.SetStateAction<number>>;
  setActiveTab?: (tab: 'games' | 'avatar' | 'shop' | 'logs' | 'football') => void;
}

export const GamePortal: React.FC<GamePortalProps> = ({
  stats,
  updateStats,
  addLog,
  openShop,
  openCheckoutForQuickBuy,
  loggedInUser,
  onOpenAuthModal,
  realBalance,
  setRealBalance,
  withdrawLimit,
  setWithdrawLimit,
  setActiveTab
}) => {
  const [activeGame, setActiveGame] = useState<'jumper' | 'clicker' | 'roulette' | 'tiger' | 'aviator' | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'action' | 'luck'>('all');

  const handlePlayGame = (gameId: 'jumper' | 'clicker' | 'roulette' | 'tiger' | 'aviator') => {
    if (!loggedInUser) {
      playSound.gameover();
      onOpenAuthModal();
      return;
    }
    setActiveGame(gameId);
    playSound.click();
  };

  // Helper to count active stage skips owned by counting 'booster_stage_skip' in stats.unlockedAccessories
  const stageSkipsOwned = stats.unlockedAccessories.filter(x => x === 'booster_stage_skip').length;

  if (activeGame === 'roulette') {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-black text-white">🎡 Roleta da Sorte</h2>
          <button
            onClick={() => setActiveGame(null)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Voltar ao Lobby
          </button>
        </div>
        <RouletteGame
          stats={stats}
          updateStats={updateStats}
          addLog={addLog}
          onExit={() => setActiveGame(null)}
        />
      </div>
    );
  }

  if (activeGame === 'tiger') {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-black text-white">🐯 Fortune Tiger VIP</h2>
          <button
            onClick={() => setActiveGame(null)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Voltar ao Lobby
          </button>
        </div>
        <TigerGame
          stats={stats}
          updateStats={updateStats}
          addLog={addLog}
          onExit={() => setActiveGame(null)}
        />
      </div>
    );
  }

  if (activeGame === 'aviator') {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-black text-white">✈️ Aviator Crash</h2>
          <button
            onClick={() => setActiveGame(null)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Voltar ao Lobby
          </button>
        </div>
        <AviatorGame
          stats={stats}
          updateStats={updateStats}
          addLog={addLog}
          onExit={() => setActiveGame(null)}
        />
      </div>
    );
  }

  if (activeGame) {
    return (
      <GameRunner
        gameId={activeGame}
        stats={stats}
        updateStats={updateStats}
        addLog={addLog}
        openShop={openShop}
        onExit={() => setActiveGame(null)}
      />
    );
  }

  // Carousel Slides Definitions
  const carouselSlides = [
    {
      id: 'tiger' as const,
      title: 'Fortune Tiger VIP 🐯',
      description: 'O caça-níquel de maior conversão do país! Alinhe envelopes da sorte, pata de ouro e fogos na grade 3x3 para multiplicar seus ganhos em até 20 vezes instantaneamente.',
      badge: 'Multiplicadores até 20x',
      cost: 'Sua Aposta',
      color: 'from-amber-500 to-yellow-600',
      textAccent: 'text-amber-600 bg-amber-50 border-amber-100',
      bgGraphic: 'bg-amber-500/10',
      actionText: 'Soltar o Tigre'
    },
    {
      id: 'aviator' as const,
      title: 'Aviator Crash Real-Time ✈️',
      description: 'Decole o aviãozinho multiplicador e decida quando sacar seu saldo acumulado. Acelere seus ganhos antes que o avião decole longe do radar!',
      badge: 'Decolagem Instantânea',
      cost: 'Sua Aposta',
      color: 'from-rose-500 to-red-600',
      textAccent: 'text-rose-600 bg-rose-50 border-rose-100',
      bgGraphic: 'bg-rose-500/10',
      actionText: 'Decolar Saldo'
    },
    {
      id: 'football' as const,
      title: 'Palpites de Futebol Ao Vivo ⚽',
      description: 'Dê palpites nos principais confrontos mundiais e nacionais ou inicie partidas customizadas no estádio virtual a partir de R$ 1,00 para faturar vidas extras!',
      badge: 'Copa do Mundo & Brasil',
      cost: 'Mínimo R$ 1,00',
      color: 'from-emerald-500 to-teal-600',
      textAccent: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      bgGraphic: 'bg-emerald-500/10',
      actionText: 'Dar Palpites'
    }
  ];

  const nextSlide = () => {
    playSound.click();
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const prevSlide = () => {
    playSound.click();
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  const activeSlide = carouselSlides[currentSlide];

  return (
    <div className="p-3 md:p-6 max-w-5xl mx-auto space-y-7 animate-fadeIn">
      
      {/* Hero Welcome Banner */}
      <div className="relative bg-white border border-slate-100 rounded-3xl p-5 md:p-8 overflow-hidden shadow-xl shadow-slate-200/40 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Soft light decorative glows */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-200/20 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-72 h-72 bg-purple-200/15 rounded-full filter blur-2xl pointer-events-none" />
        
        <div className="space-y-3 relative z-10 text-center md:text-left max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] md:text-xs font-black font-mono rounded-full border border-indigo-100">
            <Zap className="w-3.5 h-3.5 text-indigo-500 animate-bounce" /> ARENA ARCADE ATIVA
          </span>
          <h2 className="text-xl md:text-3xl font-black text-slate-800 leading-tight tracking-tight">
            Entre na Arena, Supere as Etapas e Colecione Troféus!
          </h2>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
            Seu personagem customizado participa ativamente de todos os jogos do portal. Ganhe moedas de ouro batendo recordes de pontuação!
          </p>
        </div>

        {/* Quick metrics visual with real glassmorphism feel */}
        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-150 flex flex-col gap-2 min-w-[220px] text-xs font-mono text-slate-600 relative z-10 w-full md:w-auto shadow-sm shadow-slate-100">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest text-center border-b border-slate-200 pb-1.5 mb-1 font-bold">
            Status do Piloto
          </div>
          <div className="flex justify-between">
            <span>❤️ Vidas Restantes:</span>
            <span className="text-rose-600 font-extrabold">{stats.lives}</span>
          </div>
          <div className="flex justify-between">
            <span>🪙 Moedas do Jogo:</span>
            <span className="text-amber-600 font-extrabold">{stats.coins}</span>
          </div>
          <div className="flex justify-between">
            <span>⏩ Fase Atual:</span>
            <span className="text-indigo-600 font-extrabold">Nível {stats.currentStage}</span>
          </div>
          <div className="flex justify-between">
            <span>🚀 Skips de Fase:</span>
            <span className="text-purple-600 font-extrabold">{stageSkipsOwned}</span>
          </div>
        </div>
      </div>

      {/* STUNNING SLIDES CAROUSEL (Destaques da Arena) */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          Destaques em Foco
        </h3>
        
        <div className="relative bg-gradient-to-tr from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl transition-all duration-500 min-h-[220px] flex flex-col justify-between group">
          {/* Active Graphic Glow */}
          <div className="absolute right-0 top-0 w-96 h-full bg-radial-gradient from-indigo-500/10 to-transparent filter blur-3xl pointer-events-none" />
          
          <div className="absolute top-4 right-4 z-20 flex gap-1.5">
            <button 
              onClick={prevSlide}
              className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button 
              onClick={nextSlide}
              className="p-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="space-y-4 max-w-xl relative z-10">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider text-white bg-white/10 border border-white/10`}>
              ⭐ Destaque Recomendado
            </span>
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight group-hover:scale-[1.01] transition-transform duration-300">
                {activeSlide.title}
              </h2>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                {activeSlide.description}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/10 z-10 relative">
            <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
              <span className="flex items-center gap-1">
                🏆 <span className="text-slate-400">Badge:</span> <strong className="text-amber-400">{activeSlide.badge}</strong>
              </span>
              <span className="flex items-center gap-1">
                🪙 <span className="text-slate-400">Entrada:</span> <strong className="text-indigo-300">{activeSlide.cost}</strong>
              </span>
            </div>

            <button
              onClick={() => {
                playSound.click();
                if (activeSlide.id === 'football') {
                  if (setActiveTab) setActiveTab('football');
                } else {
                  handlePlayGame(activeSlide.id);
                }
              }}
              className="px-5 py-2 bg-white text-slate-900 hover:bg-indigo-50 font-black text-xs rounded-xl shadow-lg shadow-white/5 hover:scale-105 active:scale-95 transition-all cursor-pointer uppercase tracking-wide flex items-center justify-center gap-1.5"
            >
              <PlayCircle className="w-4 h-4 text-indigo-600" />
              <span>{activeSlide.actionText}</span>
            </button>
          </div>

          {/* Slide Indicator Dots */}
          <div className="absolute bottom-4 left-6 flex gap-1.5 z-20">
            {carouselSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  playSound.click();
                  setCurrentSlide(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'w-4 bg-indigo-400' : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CATEGORY SELECTOR & GAME GRID (Minimized blocks by Category) */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-indigo-500 animate-pulse" />
            Minijogos do Portal
          </h3>

          {/* Minimalist Category Selectors */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => { playSound.click(); setSelectedCategory('all'); }}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                selectedCategory === 'all' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => { playSound.click(); setSelectedCategory('action'); }}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                selectedCategory === 'action' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🕹️ Arcade
            </button>
            <button
              onClick={() => { playSound.click(); setSelectedCategory('luck'); }}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                selectedCategory === 'luck' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🎰 Sorte & Esportes
            </button>
          </div>
        </div>

        {/* Minimized Bento Layout Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Palpites de Futebol */}
          {(selectedCategory === 'all' || selectedCategory === 'luck') && (
            <div className="group bg-white border border-slate-100 rounded-2xl p-4.5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-slate-200/50 hover:border-emerald-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between gap-4 md:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600 shrink-0 self-start group-hover:scale-105 transition-transform">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-800 group-hover:text-emerald-600 transition-colors tracking-tight">
                        Palpites de Futebol Ao Vivo
                      </h4>
                      <span className="text-[8px] font-mono font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 uppercase">Aposta</span>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed max-w-2xl">
                      Aposte em partidas reais da Copa do Brasil e ligas mundiais ou lance o simulador do estádio virtual. Retornos em vidas extras e pontos lendários!
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono sm:text-right shrink-0">
                  Palpites a partir de: <strong className="text-emerald-600">R$ 1,00</strong>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                  🟢 Sistema de Cobertura Ativo
                </span>
                <button
                  onClick={() => {
                    playSound.click();
                    if (setActiveTab) setActiveTab('football');
                  }}
                  className="flex items-center gap-1 px-4 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-600 text-emerald-600 hover:text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                  id="btn-nav-football"
                >
                  Abrir Estádio <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Card 2: Super Mario 2D */}
          {(selectedCategory === 'all' || selectedCategory === 'action') && (
            <div className="group bg-white border border-slate-100 rounded-2xl p-4.5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between gap-4">
              <div className="flex gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-600 shrink-0 self-start group-hover:scale-105 transition-transform">
                  <Swords className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tight">
                      Super Mario Arcade 2D
                    </h4>
                    <span className="text-[8px] font-mono font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 uppercase">Habilidade</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Nostálgica aventura de plataforma 2D side-scrolling com profundidade. Sobreviva a Goombas, colete moedas em caixas surpresa e suba no mastro!
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                <div className="text-[10px] text-slate-400 font-mono">
                  Perda: <strong className="text-rose-500">1 Vida</strong>
                </div>
                <button
                  onClick={() => handlePlayGame('jumper')}
                  className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
                  id="btn-play-jumper"
                >
                  Jogar Mario 2D
                </button>
              </div>
            </div>
          )}

          {/* Card 3: Neon Portal Clicker */}
          {(selectedCategory === 'all' || selectedCategory === 'action') && (
            <div className="group bg-white border border-slate-100 rounded-2xl p-4.5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-slate-200/50 hover:border-purple-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between gap-4">
              <div className="flex gap-3">
                <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100 text-purple-600 shrink-0 self-start group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-800 group-hover:text-purple-600 transition-colors tracking-tight">
                      Neon Portal Clicker
                    </h4>
                    <span className="text-[8px] font-mono font-bold bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100 uppercase">Reflexo</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Estoure as esferas de energia de neon que aparecem de surpresa no painel antes de sumirem. Seja rápido para vencer no tempo limite!
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                <div className="text-[10px] text-slate-400 font-mono">
                  Perda: <strong className="text-rose-500">1 Vida</strong>
                </div>
                <button
                  onClick={() => handlePlayGame('clicker')}
                  className="flex items-center gap-1 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/10 transition-all cursor-pointer"
                  id="btn-play-clicker"
                >
                  Jogar Clicker
                </button>
              </div>
            </div>
          )}

          {/* Card 4: Roleta Cyber da Sorte */}
          {(selectedCategory === 'all' || selectedCategory === 'luck') && (
            <div className="group bg-white border border-slate-100 rounded-2xl p-4.5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-slate-200/50 hover:border-cyan-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between gap-4">
              <div className="flex gap-3">
                <div className="p-2.5 bg-cyan-50 rounded-xl border border-cyan-100 text-cyan-600 shrink-0 self-start group-hover:scale-105 transition-transform">
                  <Star className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-800 group-hover:text-cyan-600 transition-colors tracking-tight">
                      Roleta Cyber da Sorte
                    </h4>
                    <span className="text-[8px] font-mono font-bold bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded border border-cyan-100 uppercase">Sorte</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Gire a roleta de 8 posições equiprováveis por prêmios diretos. Ganhe vidas extras, moedas de ouro ou skips automáticos de fase!
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                <div className="text-[10px] text-slate-400 font-mono">
                  Giro: <strong className="text-cyan-600">🪙 30 Moedas</strong>
                </div>
                <button
                  onClick={() => handlePlayGame('roulette')}
                  className="flex items-center gap-1 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-600/10 transition-all cursor-pointer"
                  id="btn-play-roulette"
                >
                  Girar Roleta
                </button>
              </div>
            </div>
          )}

          {/* Card 5: Fortune Tiger */}
          {(selectedCategory === 'all' || selectedCategory === 'luck') && (
            <div className="group bg-white border border-slate-100 rounded-2xl p-4.5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-slate-200/50 hover:border-amber-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between gap-4">
              <div className="flex gap-3">
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-amber-600 shrink-0 self-start group-hover:scale-105 transition-transform">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-800 group-hover:text-amber-600 transition-colors tracking-tight">
                      Fortune Tiger VIP 🐯
                    </h4>
                    <span className="text-[8px] font-mono font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 uppercase">Cassino</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Ative a pata da fortuna dourada no clássico jogo do tigrinho 3x3. Alinhe os símbolos idênticos para multiplicar o saldo da rodada!
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                <div className="text-[10px] text-slate-400 font-mono">
                  Entrada: <strong className="text-amber-600">Moedas (Giro)</strong>
                </div>
                <button
                  onClick={() => handlePlayGame('tiger')}
                  className="flex items-center gap-1 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/10 transition-all cursor-pointer"
                  id="btn-play-tiger"
                >
                  Girar Tigre
                </button>
              </div>
            </div>
          )}

          {/* Card 6: Aviator Crash */}
          {(selectedCategory === 'all' || selectedCategory === 'luck') && (
            <div className="group bg-white border border-slate-100 rounded-2xl p-4.5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-slate-200/50 hover:border-rose-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between gap-4">
              <div className="flex gap-3">
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 text-rose-600 shrink-0 self-start group-hover:scale-105 transition-transform">
                  <Plane className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-800 group-hover:text-rose-600 transition-colors tracking-tight">
                      Aviator Crash ✈️
                    </h4>
                    <span className="text-[8px] font-mono font-bold bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-100 uppercase">Crash</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Decole o aviãozinho do multiplicador de moedas. Tenha nervos de aço e faça o resgate seguro antes que ele voe longe!
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                <div className="text-[10px] text-slate-400 font-mono">
                  Giro: <strong className="text-rose-600">Sua Aposta</strong>
                </div>
                <button
                  onClick={() => handlePlayGame('aviator')}
                  className="flex items-center gap-1 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-rose-600/10 transition-all cursor-pointer"
                  id="btn-play-aviator"
                >
                  Decolar Aviator
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Persistent Ad Monetization Banner */}
      <AdBanner position="bottom" />

      {/* Guide Footer Info */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm shadow-slate-200/30">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
          Como avançar se as fases estiverem difíceis?
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-500">
          <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-150">
            <h5 className="font-extrabold text-slate-700 flex items-center gap-1">
              ❤️ Comprar Vidas
            </h5>
            <p className="leading-relaxed text-[11px]">
              Ficou sem vidas? Adquira pacotes de vidas na Loja Segura por Pix/Cartão para reiniciar suas jogadas imediatamente de onde parou.
            </p>
          </div>

          <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-150">
            <h5 className="font-extrabold text-slate-700 flex items-center gap-1">
              ⏩ Avançar de Fase
            </h5>
            <p className="leading-relaxed text-[11px]">
              Algum estágio com dificuldade de alta frequência? Use um crédito de Pulo de Fase (Stage Skip) para transicionar ao próximo nível e ainda receber moedas de bônus!
            </p>
          </div>

          <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-150">
            <h5 className="font-extrabold text-slate-700 flex items-center gap-1">
              🪙 Loja Integrada Segura
            </h5>
            <p className="leading-relaxed text-[11px]">
              Todos os checkouts na nossa loja integrada simulam os principais gateways de pagamento do mercado, protegendo dados com SSL ativo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
