import React, { useState } from 'react';
import { PlayerStats, AvatarConfig } from '../types';
import { SKINS, ACCESSORIES, AURAS } from '../data/shopItems';
import { AvatarRenderer } from './AvatarRenderer';
import { Sparkles, Check, Lock, Coins, Shuffle, HelpCircle } from 'lucide-react';
import { playSound } from '../utils/audio';
import { SKIN_LEVELS, ACCESSORY_LEVELS, AURA_LEVELS } from '../utils/levelManager';

interface AvatarCustomizerProps {
  stats: PlayerStats;
  updateStats: (updater: (prev: PlayerStats) => PlayerStats) => void;
  addLog: (type: 'earn' | 'purchase_coins' | 'purchase_booster' | 'purchase_cosmetic' | 'stage_skip', desc: string, amount: number, currency: 'coins' | 'real') => void;
  openCheckoutForCoins: () => void;
}

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  stats,
  updateStats,
  addLog,
  openCheckoutForCoins
}) => {
  const [activeTab, setActiveTab] = useState<'skin' | 'accessory' | 'aura'>('skin');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const playerLevel = stats.level ?? 1;

  const equipItem = (category: 'skin' | 'accessory' | 'aura', id: string) => {
    const levels = category === 'skin' ? SKIN_LEVELS : category === 'accessory' ? ACCESSORY_LEVELS : AURA_LEVELS;
    const reqLevel = levels[id] ?? 1;
    const unlockedField = category === 'skin' ? 'unlockedSkins' : category === 'accessory' ? 'unlockedAccessories' : 'unlockedAuras';
    if (playerLevel < reqLevel && !stats[unlockedField]?.includes(id)) {
      triggerMessage(`Item bloqueado! Este item requer nível ${reqLevel}.`, 'error');
      return;
    }

    updateStats((prev) => ({
      ...prev,
      avatar: {
        ...prev.avatar,
        [category]: id
      }
    }));
    playSound.click();
    triggerMessage(`Equipado com sucesso!`, 'success');
  };

  const triggerMessage = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setErrorMsg(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(msg);
      setSuccessMsg(null);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  const buyCosmetic = (category: 'skin' | 'accessory' | 'aura', id: string, name: string, price: number) => {
    const levels = category === 'skin' ? SKIN_LEVELS : category === 'accessory' ? ACCESSORY_LEVELS : AURA_LEVELS;
    const reqLevel = levels[id] ?? 1;
    if (playerLevel < reqLevel) {
      triggerMessage(`Bloqueado! Adquirir este cosmético requer nível ${reqLevel}.`, 'error');
      return;
    }

    if (stats.coins < price) {
      playSound.click();
      triggerMessage(`Moedas insuficientes! Você precisa de mais ${price - stats.coins} moedas.`, 'error');
      return;
    }

    updateStats((prev) => {
      const field =
        category === 'skin'
          ? 'unlockedSkins'
          : category === 'accessory'
          ? 'unlockedAccessories'
          : 'unlockedAuras';

      return {
        ...prev,
        coins: prev.coins - price,
        [field]: [...prev[field], id],
        avatar: {
          ...prev.avatar,
          [category]: id
        }
      };
    });

    playSound.purchase();
    addLog('purchase_cosmetic', `Desbloqueou cosmético: ${name}`, price, 'coins');
    triggerMessage(`Adquirido e equipado: ${name}!`, 'success');
  };

  const randomizeAvatar = () => {
    // Pick from unlocked items
    const randomSkin = stats.unlockedSkins[Math.floor(Math.random() * stats.unlockedSkins.length)];
    const randomAccessory = stats.unlockedAccessories[Math.floor(Math.random() * stats.unlockedAccessories.length)];
    const randomAura = stats.unlockedAuras[Math.floor(Math.random() * stats.unlockedAuras.length)];

    updateStats((prev) => ({
      ...prev,
      avatar: {
        skin: randomSkin || 'classic',
        accessory: randomAccessory || 'none',
        aura: randomAura || 'none'
      }
    }));
    playSound.collect();
    triggerMessage('Visual aleatório equipado!', 'success');
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="text-center md:text-left mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center justify-center md:justify-start gap-2">
          <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
          Personalização do Avatar
        </h2>
        <p className="text-slate-600 text-sm mt-1 font-medium">
          Crie sua identidade para as arenas! Desbloqueie cores raras, chapéus estilosos e auras holográficas incríveis.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Preview & Randomizer */}
        <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[350px] relative shadow-2xl overflow-hidden group">
          {/* Neon decorative grids */}
          <div className="absolute inset-0 bg-slate-950/20 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-25" />
          
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-xs uppercase font-mono text-slate-500 tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800/80 mb-6">
              Visualização 3D Simulada
            </span>

            {/* Render Huge Avatar */}
            <div className="my-4 transition-transform duration-500 group-hover:scale-105">
              <AvatarRenderer config={stats.avatar} size="lg" animate={true} />
            </div>

            {/* Quick Stats of equipped */}
            <div className="mt-6 flex flex-wrap justify-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800/60 w-full max-w-sm">
              <span className="bg-slate-900 px-2 py-0.5 rounded text-cyan-400">
                Pele: {SKINS.find((s) => s.id === stats.avatar.skin)?.name}
              </span>
              <span className="bg-slate-900 px-2 py-0.5 rounded text-indigo-400">
                Acessório: {ACCESSORIES.find((a) => a.id === stats.avatar.accessory)?.name}
              </span>
              <span className="bg-slate-900 px-2 py-0.5 rounded text-yellow-400">
                Aura: {AURAS.find((au) => au.id === stats.avatar.aura)?.name}
              </span>
            </div>

            {/* Randomize button */}
            <button
              onClick={randomizeAvatar}
              className="mt-6 flex items-center gap-2 px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl border border-slate-755 hover:border-slate-700 transition-all shadow-md cursor-pointer"
              id="btn-randomize-avatar"
            >
              <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
              Mistura Aleatória
            </button>
          </div>
        </div>

        {/* Right column: Tabs and Customizer Panels */}
        <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl relative">
          
          {/* Feedback toasts inside panel */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/80 text-red-300 rounded-xl text-xs border border-red-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={openCheckoutForCoins}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] rounded transition-colors cursor-pointer"
              >
                Comprar Moedas
              </button>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-950/80 text-emerald-300 rounded-xl text-xs border border-emerald-800/60 flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Sub-tabs */}
          <div className="flex border-b border-slate-800 mb-6 gap-1">
            {(['skin', 'accessory', 'aura'] as const).map((tab) => {
              const label = { skin: 'Peles', accessory: 'Acessórios', aura: 'Auras' }[tab];
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setErrorMsg(null);
                  }}
                  className={`px-4 py-2.5 text-xs md:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                  id={`tab-sub-${tab}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Render Items Grid */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {activeTab === 'skin' &&
              SKINS.map((item) => {
                const isUnlocked = stats.unlockedSkins.includes(item.id) || item.price === 0;
                const isEquipped = stats.avatar.skin === item.id;
                const reqLevel = SKIN_LEVELS[item.id] ?? 1;
                const isLevelLocked = playerLevel < reqLevel;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isEquipped
                        ? 'bg-indigo-950/20 border-indigo-500/40'
                        : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl border-2 ${item.color}`}>
                        {item.emoji}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          {item.name}
                          {reqLevel > 1 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 font-mono">
                              Lvl {reqLevel}
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                    </div>

                    <div>
                      {isEquipped ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/20">
                          <Check className="w-3.5 h-3.5" /> Equipado
                        </span>
                      ) : isLevelLocked && !isUnlocked ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-red-405 bg-red-950/40 px-2.5 py-1.5 rounded-xl border border-red-900/40 font-mono">
                          🔒 Nível {reqLevel}
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => equipItem('skin', item.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-700 cursor-pointer transition-colors"
                        >
                          Usar
                        </button>
                      ) : (
                        <button
                          onClick={() => buyCosmetic('skin', item.id, item.name, item.price)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-lg cursor-pointer transition-all hover:scale-102"
                        >
                          <Coins className="w-3.5 h-3.5" /> {item.price}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            {activeTab === 'accessory' &&
              ACCESSORIES.map((item) => {
                const isUnlocked = stats.unlockedAccessories.includes(item.id) || item.price === 0;
                const isEquipped = stats.avatar.accessory === item.id;
                const reqLevel = ACCESSORY_LEVELS[item.id] ?? 1;
                const isLevelLocked = playerLevel < reqLevel;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isEquipped
                        ? 'bg-indigo-950/20 border-indigo-500/40'
                        : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl text-2xl">
                        {item.emoji}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          {item.name}
                          {reqLevel > 1 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 font-mono">
                              Lvl {reqLevel}
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                    </div>

                    <div>
                      {isEquipped ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/20">
                          <Check className="w-3.5 h-3.5" /> Equipado
                        </span>
                      ) : isLevelLocked && !isUnlocked ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-red-405 bg-red-950/40 px-2.5 py-1.5 rounded-xl border border-red-900/40 font-mono">
                          🔒 Nível {reqLevel}
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => equipItem('accessory', item.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-700 cursor-pointer transition-colors"
                        >
                          Usar
                        </button>
                      ) : (
                        <button
                          onClick={() => buyCosmetic('accessory', item.id, item.name, item.price)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-lg cursor-pointer transition-all hover:scale-102"
                        >
                          <Coins className="w-3.5 h-3.5" /> {item.price}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            {activeTab === 'aura' &&
              AURAS.map((item) => {
                const isUnlocked = stats.unlockedAuras.includes(item.id) || item.price === 0;
                const isEquipped = stats.avatar.aura === item.id;
                const reqLevel = AURA_LEVELS[item.id] ?? 1;
                const isLevelLocked = playerLevel < reqLevel;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isEquipped
                        ? 'bg-indigo-950/20 border-indigo-500/40'
                        : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl text-xs relative overflow-hidden">
                        {item.id !== 'none' && (
                          <div className={`absolute inset-1.5 rounded-full ${item.effectClass}`} />
                        )}
                        <span className="relative z-10 text-slate-500">✨</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          {item.name}
                          {reqLevel > 1 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 font-mono">
                              Lvl {reqLevel}
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                    </div>

                    <div>
                      {isEquipped ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/20">
                          <Check className="w-3.5 h-3.5" /> Equipado
                        </span>
                      ) : isLevelLocked && !isUnlocked ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-red-405 bg-red-950/40 px-2.5 py-1.5 rounded-xl border border-red-900/40 font-mono">
                          🔒 Nível {reqLevel}
                        </span>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => equipItem('aura', item.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-700 cursor-pointer transition-colors"
                        >
                          Usar
                        </button>
                      ) : (
                        <button
                          onClick={() => buyCosmetic('aura', item.id, item.name, item.price)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-lg cursor-pointer transition-all hover:scale-102"
                        >
                          <Coins className="w-3.5 h-3.5" /> {item.price}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Quick Tip Footer */}
          <div className="mt-6 p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 flex items-start gap-2.5 text-xs text-slate-400">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              Itens gratuitos estão desbloqueados por padrão. Adquira itens lendários jogando nos minijogos e acumulando pontuações, ou compre moedas instantaneamente na Loja Segura!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
