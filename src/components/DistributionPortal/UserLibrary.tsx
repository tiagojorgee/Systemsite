import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, Play, Award, Star, Heart, CheckCircle2, RefreshCw, Clock, Gamepad2, Info, X, ShieldCheck
} from 'lucide-react';
import { PublishedGame, LibraryItem } from '../../types/distribution';
import { playSound } from '../../utils/audio';

interface UserLibraryProps {
  library: LibraryItem[];
  setLibrary: React.Dispatch<React.SetStateAction<LibraryItem[]>>;
  wishlistGames: PublishedGame[];
  onSelectGame: (game: PublishedGame) => void;
  onTriggerToast: (msg: string) => void;
}

export const UserLibrary: React.FC<UserLibraryProps> = ({
  library,
  setLibrary,
  wishlistGames,
  onSelectGame,
  onTriggerToast
}) => {
  const [activeTab, setActiveTab] = useState<'owned' | 'wishlist'>('owned');
  const [playingItem, setPlayingItem] = useState<LibraryItem | null>(null);
  const [playTimeElapsed, setPlayTimeElapsed] = useState(0);

  // Play session tick simulation
  useEffect(() => {
    let interval: any;
    if (playingItem) {
      interval = setInterval(() => {
        setPlayTimeElapsed(prev => {
          const next = prev + 1;
          
          // Randomly unlock achievement during simulation
          if (next === 5) {
            unlockAchievement(playingItem.gameId, 'ach-first-boot', 'Primeiro Boot', 'Iniciou o jogo com sucesso na GameZon.');
          } else if (next === 15) {
            unlockAchievement(playingItem.gameId, 'ach-pro-drifter', 'Drifter Elite', 'Alcançou 15 minutos simulados de sessão.');
          }
          
          return next;
        });

        // Increment actual play time in state
        setLibrary(prev => prev.map(item => {
          if (item.gameId === playingItem.gameId) {
            return { ...item, playTimeMinutes: item.playTimeMinutes + 1, lastPlayedAt: new Date().toISOString() };
          }
          return item;
        }));
      }, 3000); // simulate 1 minute of play every 3 seconds
    }
    return () => clearInterval(interval);
  }, [playingItem]);

  const unlockAchievement = (gameId: string, achId: string, title: string, desc: string) => {
    setLibrary(prev => prev.map(item => {
      if (item.gameId === gameId) {
        const achs = item.achievements.map(a => {
          if (a.id === achId && !a.unlocked) {
            onTriggerToast(`🏆 CONQUISTA DESBLOQUEADA: "${title}" em seu jogo!`);
            return { ...a, unlocked: true, unlockedAt: new Date().toLocaleTimeString() };
          }
          return a;
        });
        return { ...item, achievements: achs };
      }
      return item;
    }));
  };

  const startDownload = (itemId: string) => {
    playSound.click();
    
    // Animate download progress
    setLibrary(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, downloadProgress: 1 };
      }
      return item;
    }));

    const interval = setInterval(() => {
      setLibrary(prev => {
        let finished = false;
        const nextLib = prev.map(item => {
          if (item.id === itemId && item.downloadProgress !== undefined && item.downloadProgress !== null) {
            const current = item.downloadProgress;
            if (current >= 100) {
              finished = true;
              return { ...item, downloadProgress: null, isInstalled: true };
            }
            // Dynamic increments
            return { ...item, downloadProgress: Math.min(100, current + Math.floor(Math.random() * 15 + 5)) };
          }
          return item;
        });

        if (finished) {
          clearInterval(interval);
          onTriggerToast('💾 Jogo instalado e verificado! Verificação de hash SHA-256 concluída.');
        }
        return nextLib;
      });
    }, 400);
  };

  const verifyIntegrity = (itemId: string) => {
    playSound.click();
    onTriggerToast('🔍 Iniciando verificação de integridade estrutural (SHA-256)...');
    
    setLibrary(prev => prev.map(item => {
      if (item.id === itemId) return { ...item, isUpdating: true };
      return item;
    }));

    setTimeout(() => {
      setLibrary(prev => prev.map(item => {
        if (item.id === itemId) return { ...item, isUpdating: false };
        return item;
      }));
      onTriggerToast('✓ Verificação concluída. Todos os 128 chunks de arquivos estão consistentes.');
    }, 2000);
  };

  const toggleFavorite = (itemId: string) => {
    playSound.click();
    setLibrary(prev => prev.map(item => {
      if (item.id === itemId) return { ...item, isFavorite: !item.isFavorite };
      return item;
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* Sub tabs switcher */}
      <div className="flex gap-4 border-b border-slate-800 pb-3">
        <button
          onClick={() => { playSound.click(); setActiveTab('owned'); }}
          className={`py-1 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'owned' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Meus Jogos Comprados ({library.length})
        </button>
        <button
          onClick={() => { playSound.click(); setActiveTab('wishlist'); }}
          className={`py-1 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'wishlist' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Minha Lista de Desejos ({wishlistGames.length})
        </button>
      </div>

      {activeTab === 'owned' && (
        <div className="space-y-6">
          {library.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl py-12 text-center text-slate-500 space-y-2">
              <Gamepad2 className="w-12 h-12 text-slate-700 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">Sua Biblioteca está vazia</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Explore a GameZon Store, adquira títulos gratuitos ou pagos e veja-os listados aqui permanentemente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {library.map(item => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-4"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-3 min-w-0">
                      <span className="text-3xl h-12 w-12 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-center shrink-0">
                        {item.gameIconUrl}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-slate-100 font-bold text-xs truncate">{item.gameTitle}</h4>
                        <span className="text-[9px] text-slate-500 font-mono block">Adquirido em: {new Date(item.purchasedAt).toLocaleDateString()}</span>
                        
                        {/* Playtime widget */}
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.playTimeMinutes} min jogados</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        item.isFavorite ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>

                  {/* Achievements overview panel */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 space-y-2">
                    <span className="text-[9px] font-black tracking-wider text-slate-400 font-mono flex justify-between items-center">
                      <span>CONQUISTAS DO SISTEMA</span>
                      <span className="text-emerald-400">{item.achievements.filter(a => a.unlocked).length} / {item.achievements.length} UNLOCKED</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
                      {item.achievements.map(ach => (
                        <div key={ach.id} className={`flex items-center gap-1.5 p-1 rounded ${ach.unlocked ? 'bg-emerald-500/5 border border-emerald-500/10 text-emerald-400' : 'text-slate-500'}`}>
                          <Award className="w-3 h-3 shrink-0" />
                          <span className="truncate" title={ach.desc}>{ach.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Download Progress / Play control */}
                  <div className="border-t border-slate-800/60 pt-3.5 flex items-center justify-between gap-2.5">
                    
                    {/* If downloading */}
                    {item.downloadProgress !== undefined && item.downloadProgress !== null ? (
                      <div className="flex-1 space-y-1.5">
                        <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                          <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Baixando arquivos versionados...</span>
                          <span>{item.downloadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                          <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${item.downloadProgress}%` }} />
                        </div>
                      </div>
                    ) : item.isInstalled ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex gap-2">
                          <button
                            onClick={() => { playSound.click(); setPlayingItem(item); setPlayTimeElapsed(0); }}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                          >
                            <Play className="w-4 h-4 fill-slate-950" />
                            <span>Jogar</span>
                          </button>

                          <button
                            onClick={() => verifyIntegrity(item.id)}
                            className="bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-mono py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            disabled={item.isUpdating}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${item.isUpdating ? 'animate-spin text-emerald-400' : ''}`} />
                            <span>Integridade</span>
                          </button>
                        </div>

                        <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>LATEST V.</span>
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => startDownload(item.id)}
                        className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-emerald-400" />
                        <span>Baixar Versão Oficial</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'wishlist' && (
        <div className="space-y-4">
          {wishlistGames.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl py-12 text-center text-slate-500">
              <p className="text-xs">Sua lista de desejos está vazia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlistGames.map(g => (
                <div
                  key={g.id}
                  onClick={() => onSelectGame(g)}
                  className="bg-slate-900 border border-slate-800/80 hover:border-emerald-500/20 p-3.5 rounded-xl flex gap-3 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                >
                  <span className="text-3xl h-11 w-11 bg-slate-950 border border-slate-850 rounded-lg flex items-center justify-center shrink-0">
                    {g.iconUrl}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-slate-200 text-xs truncate">{g.title}</h5>
                    <span className="text-[9px] text-slate-500 block font-mono">{g.genre}</span>
                    <span className="text-[11px] text-emerald-400 font-black font-mono mt-1 block">R$ {(g.price * (1 - (g.discount / 100))).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Play Session Modal Overlay simulation */}
      <AnimatePresence>
        {playingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-lg">
            <div className="max-w-md w-full text-center space-y-6">
              
              {/* Game graphics box simulation */}
              <div className="relative w-40 h-40 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-6xl shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-float border border-emerald-400/20">
                {playingItem.gameIconUrl}
                <div className="absolute inset-2 border-2 border-dashed border-emerald-400/30 rounded-2xl animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-emerald-400 tracking-wider font-mono">EXECUTANDO SESSÃO SIMULADA</span>
                <h3 className="text-xl font-black text-white">{playingItem.gameTitle}</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  A GameZon está alimentando os logs de conquistas de jogo de forma segura em segundo plano.
                </p>
              </div>

              {/* Simulated active stats */}
              <div className="grid grid-cols-2 gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl font-mono text-xs text-slate-300">
                <div className="text-left space-y-1">
                  <span className="text-[9px] text-slate-500 block">SESSÃO DE JOGO ATIVA</span>
                  <p className="text-slate-100 font-bold">{playTimeElapsed} minutos simulados</p>
                </div>
                <div className="text-left space-y-1">
                  <span className="text-[9px] text-slate-500 block">STATUS DE CONEXÃO</span>
                  <p className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> ONLINE
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg text-[9px] text-slate-500 font-mono flex items-center justify-center gap-2">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mantenha esta tela aberta para coletar moedas e desbloquear conquistas adicionais!</span>
              </div>

              <button
                onClick={() => {
                  playSound.click();
                  setPlayingItem(null);
                  onTriggerToast(` Sair da sessão de ${playingItem.gameTitle}. Playtime total atualizado.`);
                }}
                className="w-full max-w-xs bg-rose-600 hover:bg-rose-500 text-white font-black text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg mx-auto"
              >
                <X className="w-4 h-4" />
                <span>Fechar Sessão de Jogo</span>
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
