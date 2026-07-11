import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Users, Code, Gamepad2, Settings, Percent, Activity, Trash2, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { PublishedGame, DevProfile, DiscountCoupon } from '../../types/distribution';
import { playSound } from '../../utils/audio';

interface AdminPortalExtProps {
  games: PublishedGame[];
  setGames: React.Dispatch<React.SetStateAction<PublishedGame[]>>;
  developers: DevProfile[];
  setDevelopers: React.Dispatch<React.SetStateAction<DevProfile[]>>;
  coupons: DiscountCoupon[];
  setCoupons: React.Dispatch<React.SetStateAction<DiscountCoupon[]>>;
  logs: { id: string; type: string; desc: string; amount: number; date: string }[];
  onTriggerToast: (msg: string) => void;
}

export const AdminPortalExt: React.FC<AdminPortalExtProps> = ({
  games,
  setGames,
  developers,
  setDevelopers,
  coupons,
  setCoupons,
  logs,
  onTriggerToast
}) => {
  const [activeTab, setActiveTab] = useState<'games' | 'studios' | 'coupons' | 'logs'>('games');
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponPct, setNewCouponPct] = useState(10);

  const toggleGameStatus = (gameId: string) => {
    playSound.click();
    setGames(prev => prev.map(game => {
      if (game.id === gameId) {
        const nextStatus = game.status === 'published' ? 'draft' : 'published';
        onTriggerToast(`✓ Status do jogo alterado para: ${nextStatus.toUpperCase()}`);
        return { ...game, status: nextStatus };
      }
      return game;
    }));
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    playSound.click();
    const code = newCouponCode.trim().toUpperCase();
    if (!code) return;
    if (coupons.some(c => c.code === code)) {
      onTriggerToast('❌ Código de cupom já existe no sistema.');
      return;
    }
    setCoupons(prev => [...prev, { code, discountPercent: Number(newCouponPct) || 10, isActive: true }]);
    setNewCouponCode('');
    onTriggerToast(`🎉 Cupom "${code}" criado com ${newCouponPct}% de desconto!`);
  };

  const deleteCoupon = (code: string) => {
    playSound.click();
    setCoupons(prev => prev.filter(c => c.code !== code));
    onTriggerToast('✓ Cupom deletado do banco de dados.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* Sidebar controls for admin features */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl h-fit space-y-3.5">
        <h4 className="text-[10px] font-black tracking-wider text-slate-400 font-mono flex items-center gap-1.5 text-rose-400">
          <ShieldAlert className="w-4 h-4" />
          <span>SISTEMA DE AUDITORIA</span>
        </h4>

        <div className="flex flex-col gap-1">
          {[
            { id: 'games', name: 'Curadoria de Jogos', icon: Gamepad2 },
            { id: 'studios', name: 'Estúdios Licenciados', icon: Code },
            { id: 'coupons', name: 'Códigos de Cupons', icon: Percent },
            { id: 'logs', name: 'Logs da Plataforma', icon: Activity }
          ].map(tab => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { playSound.click(); setActiveTab(tab.id as any); }}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                  activeTab === tab.id 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/20'
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main detailed panels */}
      <div className="lg:col-span-3 bg-slate-900 border border-slate-800 p-5 rounded-3xl min-h-[420px] flex flex-col justify-between">
        
        {/* TAB 1: Curadoria de jogos */}
        {activeTab === 'games' && (
          <div className="space-y-4 flex-1">
            <h4 className="text-xs font-black text-slate-200 border-b border-slate-800 pb-2">Controle Geral de Títulos de Jogos</h4>
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {games.map(game => (
                <div key={game.id} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{game.iconUrl}</span>
                    <div>
                      <h5 className="font-bold text-slate-200 text-xs">{game.title}</h5>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {game.id} | Por: {game.devName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      game.status === 'published' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {game.status.toUpperCase()}
                    </span>

                    <button
                      onClick={() => toggleGameStatus(game.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer border transition-all ${
                        game.status === 'published' 
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      {game.status === 'published' ? 'Suspender' : 'Aprovar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Estúdios de desenvolvedores */}
        {activeTab === 'studios' && (
          <div className="space-y-4 flex-1">
            <h4 className="text-xs font-black text-slate-200 border-b border-slate-800 pb-2">Estúdios Digitais sob Licença</h4>
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {developers.map(dev => (
                <div key={dev.id} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl h-9 w-9 bg-slate-900 border border-slate-850 rounded flex items-center justify-center">{dev.logoUrl}</span>
                    <div>
                      <h5 className="font-bold text-slate-200 text-xs">{dev.studioName}</h5>
                      <span className="text-[10px] text-slate-500 font-mono">Seguidores: {dev.followersCount} | Website: {dev.website}</span>
                    </div>
                  </div>

                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-black">
                    VERIFICADO
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Coupons management */}
        {activeTab === 'coupons' && (
          <div className="space-y-4 flex-1">
            <h4 className="text-xs font-black text-slate-200 border-b border-slate-800 pb-2">Controle de Códigos de Desconto</h4>
            
            {/* Create coupon form */}
            <form onSubmit={handleCreateCoupon} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-mono">CÓDIGO DO CUPOM</label>
                <input
                  type="text"
                  placeholder="Ex: SPECIAL50"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-100 outline-none w-36 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-mono">DESCONTO (%)</label>
                <input
                  type="number"
                  placeholder="50"
                  value={newCouponPct}
                  onChange={(e) => setNewCouponPct(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-100 outline-none w-20"
                />
              </div>

              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black py-2 px-4 rounded-lg cursor-pointer"
              >
                Gerar Código
              </button>
            </form>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {coupons.map(c => (
                <div key={c.code} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex gap-4">
                    <span>CUPOM: <strong className="text-emerald-400">{c.code}</strong></span>
                    <span className="text-slate-500">Desconto: {c.discountPercent}%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteCoupon(c.code)}
                    className="text-slate-500 hover:text-rose-500 cursor-pointer p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: System activity audit logs */}
        {activeTab === 'logs' && (
          <div className="space-y-4 flex-1">
            <h4 className="text-xs font-black text-slate-200 border-b border-slate-800 pb-2">Logs do Sistema da Distribuidora</h4>
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 font-mono text-[10px] space-y-2 max-h-[300px] overflow-y-auto leading-relaxed">
              {logs.map(log => (
                <div key={log.id} className="border-b border-slate-900 pb-1.5 text-slate-400 flex justify-between items-start gap-3">
                  <div>
                    <span className="text-slate-500">[{log.date}]</span>{' '}
                    <span className="text-slate-200">{log.desc}</span>
                  </div>
                  {log.amount > 0 && (
                    <span className="text-emerald-400 font-bold shrink-0">R$ {log.amount.toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
