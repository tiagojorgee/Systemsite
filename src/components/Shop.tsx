import React, { useState } from 'react';
import { ShopItem, PlayerStats } from '../types';
import { SHOP_ITEMS } from '../data/shopItems';
import { ShieldCheck, Heart, Sparkles, Trophy, ShoppingBag, Coins, ShieldAlert, BadgeInfo } from 'lucide-react';
import { playSound } from '../utils/audio';

interface ShopProps {
  stats: PlayerStats;
  updateStats: (updater: (prev: PlayerStats) => PlayerStats) => void;
  addLog: (type: 'earn' | 'purchase_coins' | 'purchase_booster' | 'purchase_cosmetic' | 'stage_skip', desc: string, amount: number, currency: 'coins' | 'real') => void;
  openCheckout: (item: ShopItem) => void;
}

export const Shop: React.FC<ShopProps> = ({
  stats,
  updateStats,
  addLog,
  openCheckout
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'booster' | 'coins'>('all');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const buyWithCoins = (item: ShopItem) => {
    if (stats.coins < item.price) {
      showToast(`Moedas insuficientes! Você precisa de ${item.price - stats.coins} moedas adicionais.`, 'error');
      return;
    }

    updateStats((prev) => {
      let extraLives = prev.lives;
      let extraStage = prev.currentStage;
      let extraSkips = prev.unlockedAccessories; // Wait, skips are not stored as array but let's check.
      // Ah, wait! In PlayerStats:
      // stats.lives, stats.coins, stats.currentStage, etc.
      // We should support stage skips count. Let's make sure our state has "stageSkips" or we can store stage skips count in unlockedAccessories or custom property. Wait, let's look at PlayerStats:
      // unlockedAccessories is string[]. We can store "booster_stage_skip" there, or add a custom field. Let's look at /src/types.ts:
      // PropertyDefinition on stats:
      // export interface PlayerStats {
      //   coins: number;
      //   lives: number;
      //   currentStage: number;
      //   highScore: number;
      //   unlockedSkins: string[];
      //   unlockedAccessories: string[];
      //   unlockedAuras: string[];
      //   avatar: AvatarConfig;
      // }
      // Oh! In `types.ts`, we don't have a direct `stageSkips` field, but we can store stage skips by adding a custom item into unlockedAccessories (e.g. `booster_stage_skip`) or we can update `PlayerStats` dynamically in the state in App.tsx! Since JavaScript allows dynamic fields, we can just track `stageSkips` in stats too! But to remain perfectly typed, we can treat "stage_skips" as items in `unlockedAccessories` (e.g. adding 'booster_stage_skip' to the array for each skip owned, or just adding a `stageSkips` property in `App.tsx` and casting it, or modifying `types.ts` later if needed. Actually, let's keep track of stage skips count inside our React state directly.
      // Let's check how many stage skips the player has: we can store them by counting how many times "stage_skip" or similar is in a list, or simply add a custom field `stageSkips: number` to stats in React and cast it or add it to types.ts.
      // Wait, let's look at /src/types.ts. We can edit types.ts to add `stageSkips: number`! That's clean and safe!
      
      const newCoins = prev.coins - item.price;
      
      if (item.subCategory === 'lives') {
        extraLives = prev.lives + item.value;
      }

      // If they buy stage skip with coins, let's add item.value to their skips count!
      // To do this, let's store skip counts by adding a string or we can update types.ts to include `stageSkips: number`! Let's do that!
      return {
        ...prev,
        coins: newCoins,
        lives: extraLives,
        // We will store skips in unlockedAccessories as 'booster_stage_skip'
        unlockedAccessories: item.subCategory === 'stage_skip' 
          ? [...prev.unlockedAccessories, ...Array(item.value).fill('booster_stage_skip')]
          : prev.unlockedAccessories
      };
    });

    playSound.purchase();
    addLog('purchase_booster', `Comprou: ${item.name}`, item.price, 'coins');
    showToast(`Adquirido com sucesso: ${item.name}!`, 'success');
  };

  const handlePurchase = (item: ShopItem) => {
    playSound.click();
    if (item.currency === 'real') {
      openCheckout(item);
    } else {
      buyWithCoins(item);
    }
  };

  const filteredItems = SHOP_ITEMS.filter(
    (item) => filterCategory === 'all' || item.category === filterCategory
  );

  // Count active stage skips owned by counting 'booster_stage_skip' in stats.unlockedAccessories
  const stageSkipsOwned = stats.unlockedAccessories.filter(x => x === 'booster_stage_skip').length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="text-center md:text-left mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center justify-center md:justify-start gap-2">
            <ShoppingBag className="w-6 h-6 text-amber-400" />
            Loja Oficial &amp; Segura
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Compre vidas adicionais, pacotes de moedas e boosters para superar recordes. Transações protegidas por SSL.
          </p>
        </div>

        {/* Secure seal banner */}
        <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl self-center">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-300">
            Ambiente 100% Protegido
          </span>
        </div>
      </div>

      {/* Floating toast */}
      {toastMsg && (
        <div
          className={`mb-6 p-3 rounded-xl border text-xs flex items-center gap-2 animate-fadeIn max-w-md mx-auto ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
              : 'bg-red-950/80 border-red-800 text-red-300'
          }`}
        >
          {toastMsg.type === 'success' ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-red-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Filter and balance indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800 mb-6">
        {/* Categories Tab */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit self-center sm:self-auto">
          <button
            onClick={() => { setFilterCategory('all'); playSound.click(); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filterCategory === 'all' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tudo
          </button>
          <button
            onClick={() => { setFilterCategory('booster'); playSound.click(); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filterCategory === 'booster' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vidas &amp; Boosters
          </button>
          <button
            onClick={() => { setFilterCategory('coins'); playSound.click(); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filterCategory === 'coins' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Moedas
          </button>
        </div>

        {/* Balance Status */}
        <div className="flex items-center gap-3 justify-center text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
            ❤️ <strong className="text-white ml-1">{stats.lives} Vidas</strong>
          </span>
          <span className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
            🪙 <strong className="text-amber-400 ml-1">{stats.coins} Moedas</strong>
          </span>
          <span className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
            ⏩ <strong className="text-indigo-400 ml-1">{stageSkipsOwned} Skips</strong>
          </span>
        </div>
      </div>

      {/* Grid of items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredItems.map((item) => {
          const isVip = item.id === 'vip_all_access';
          const isReal = item.currency === 'real';

          return (
            <div
              key={item.id}
              className={`relative flex flex-col justify-between bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                isVip
                  ? 'border-indigo-500/50 shadow-indigo-500/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-900 to-slate-900'
                  : 'border-slate-800 hover:border-indigo-500/50'
              }`}
            >
              {/* Premium Ribbon */}
              {isVip && (
                <span className="absolute top-3 right-3 text-[9px] font-mono font-bold tracking-widest text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-500/30 animate-pulse">
                  PREMIUM VIP
                </span>
              )}

              {/* Visual Asset representation */}
              <div className="mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl font-bold border-2 mb-3 bg-slate-950 shadow-inner ${
                  isVip ? 'border-indigo-500/30' : 'border-slate-800'
                }`}>
                  {item.id.includes('lives') 
                    ? '❤️' 
                    : item.id.includes('skip') 
                    ? '⏩' 
                    : item.id.includes('coin') 
                    ? '🪙' 
                    : item.id.includes('luck') 
                    ? '🍀' 
                    : item.id.includes('limit') 
                    ? '📈' 
                    : '👑'}
                </div>

                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-md tracking-tight">{item.name}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed min-h-[48px]">
                  {item.description}
                </p>
              </div>

              {/* Button & Price Footer */}
              <div className="pt-4 border-t border-slate-850 flex items-center justify-between gap-2 mt-2">
                <div className="text-left">
                  <span className="text-[10px] text-slate-500 font-mono block">Preço</span>
                  <span className={`text-md font-black font-mono leading-none ${
                    isReal ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {isReal ? `R$ ${item.price.toFixed(2)}` : `${item.price} Moedas`}
                  </span>
                </div>

                <button
                  onClick={() => handlePurchase(item)}
                  className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all hover:scale-103 cursor-pointer ${
                    isVip
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-650 text-white shadow-md shadow-indigo-500/10 hover:from-indigo-500 hover:to-purple-550'
                      : isReal
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                  }`}
                  id={`btn-buy-${item.id}`}
                >
                  {isReal ? 'Comprar' : 'Adquirir'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust guarantees footer */}
      <div className="mt-10 p-5 bg-slate-950/40 rounded-2xl border border-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">Segurança de Ponta</h4>
            <p className="text-[10px] text-slate-500 leading-tight">Handshake SSL criptografado e chaves protegidas.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
            <BadgeInfo className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">Entrega Instantânea</h4>
            <p className="text-[10px] text-slate-500 leading-tight">Ativos digitais creditados imediatamente no perfil.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
            <Coins className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">Economia Inteligente</h4>
            <p className="text-[10px] text-slate-500 leading-tight">Ganhe moedas grátis jogando e avance sem custo real.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
