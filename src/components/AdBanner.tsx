import React, { useState, useEffect } from 'react';
import { Sparkles, X, ShieldAlert, ExternalLink, Coins } from 'lucide-react';
import { playSound } from '../utils/audio';

interface Ad {
  id: string;
  title: string;
  desc: string;
  cta: string;
  sponsor: string;
  bgClass: string;
  borderClass: string;
  textAccent: string;
  badge: string;
}

const ADS_POOL: Ad[] = [
  {
    id: 'tiger',
    title: '🐯 TIGRINHO DA SORTE',
    desc: 'O jogo que está mudando vidas! Deposite R$ 10 e fature rodadas grátis infinitas.',
    cta: 'JOGAR AGORA',
    sponsor: 'Fortune Tiger Corp',
    bgClass: 'from-amber-950 via-slate-900 to-amber-900/40',
    borderClass: 'border-amber-500/40',
    textAccent: 'text-amber-400',
    badge: '🔥 QUENTE'
  },
  {
    id: 'aviator',
    title: '✈️ AVIATOR CRASH',
    desc: 'Até onde o aviãozinho vai subir? Multiplique seu saldo em até 100x em segundos!',
    cta: 'DECOLAR SALDO',
    sponsor: 'GigaBet Studios',
    bgClass: 'from-rose-950 via-slate-900 to-rose-900/40',
    borderClass: 'border-rose-500/40',
    textAccent: 'text-rose-400',
    badge: '⚡ POPULAR'
  },
  {
    id: 'quantum',
    title: '🤖 ROBÔ QUÂNTICO DE IA',
    desc: 'Robô de sinais automatizados garante 98.7% de acerto. Copie e cole e fique rico!',
    cta: 'OBTER ROBÔ',
    sponsor: 'QuantumLabs',
    bgClass: 'from-emerald-950 via-slate-900 to-emerald-900/40',
    borderClass: 'border-emerald-500/40',
    textAccent: 'text-emerald-400',
    badge: '👑 EXCLUSIVO'
  },
  {
    id: 'glow',
    title: '🥤 NEON GLOW COLA',
    desc: 'A bebida oficial dos cyber-atletas! Sabor framboesa nuclear com taurina eletrizante.',
    cta: 'COMPRAR PACK',
    sponsor: 'Glow Beverages',
    bgClass: 'from-cyan-950 via-slate-900 to-cyan-900/40',
    borderClass: 'border-cyan-500/40',
    textAccent: 'text-cyan-400',
    badge: '🌟 NOVO'
  },
  {
    id: 'raposa',
    title: '🦊 RAPOSA BET VIP',
    desc: 'Receba bônus de boas-vindas de 200%. Saques via PIX em menos de 5 segundos garantidos.',
    cta: 'CADASTRAR JÁ',
    sponsor: 'FoxGaming Ltd',
    bgClass: 'from-orange-950 via-slate-900 to-orange-900/40',
    borderClass: 'border-orange-500/40',
    textAccent: 'text-orange-400',
    badge: '🍀 RECOMENDADO'
  }
];

export const AdBanner: React.FC<{ 
  position?: 'top' | 'bottom' | 'sidebar';
  size?: 'normal' | 'small';
}> = ({ position = 'bottom', size = 'normal' }) => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [adRevenue, setAdRevenue] = useState<number>(() => {
    return Number(localStorage.getItem('platform_ad_revenue') || '142.35');
  });

  // Cycle ads automatically every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ADS_POOL.length);
      // Simulate platform earning a fraction of cent for ad impressions
      setAdRevenue((prev) => {
        const next = prev + 0.05;
        localStorage.setItem('platform_ad_revenue', next.toFixed(2));
        return next;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    playSound.click();
    // Re-enable ad after 12 seconds to keep monetization active
    setTimeout(() => {
      setIsVisible(true);
      setCurrentAdIndex((prev) => (prev + 1) % ADS_POOL.length);
    }, 12000);
  };

  const handleCtaClick = () => {
    playSound.collect();
    // Click monetization bonus
    setAdRevenue((prev) => {
      const next = prev + 0.25;
      localStorage.setItem('platform_ad_revenue', next.toFixed(2));
      return next;
    });
    alert(`Redirecionando para patrocinador seguro. A plataforma faturou +R$ 0,25 com este clique!`);
  };

  if (!isVisible) {
    return (
      <div className="w-full flex justify-center py-1 animate-fadeIn">
        <p className="text-[9px] text-slate-500 font-mono italic">
          Anúncio minimizado. Recarregando patrocinador... (Faturamento: <span className="text-emerald-500 font-semibold">R$ {adRevenue.toFixed(2)}</span>)
        </p>
      </div>
    );
  }

  const ad = ADS_POOL[currentAdIndex];

  if (size === 'small') {
    return (
      <div className={`w-full bg-gradient-to-r ${ad.bgClass} border ${ad.borderClass} rounded-xl px-3 py-1.5 flex items-center justify-between gap-3 relative overflow-hidden shadow-md animate-fadeIn text-xs`}>
        {/* Compact banner contents */}
        <div className="flex items-center gap-2 max-w-[75%]">
          <span className="text-sm shrink-0">📢</span>
          <div className="truncate text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-white text-[11px] truncate leading-none">{ad.title}</span>
              <span className={`text-[7px] font-extrabold px-1 rounded bg-slate-950/80 ${ad.textAccent} shrink-0 leading-none py-0.5`}>
                {ad.badge}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">{ad.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right hidden xs:block font-mono text-[8px] text-slate-500">
            <span>Lucro: <strong className="text-emerald-400">R$ {adRevenue.toFixed(2)}</strong></span>
          </div>
          <button
            onClick={handleCtaClick}
            className={`px-2 py-1 bg-slate-950 hover:bg-slate-900 border ${ad.borderClass} ${ad.textAccent} font-bold text-[9px] rounded-lg transition-all cursor-pointer`}
          >
            {ad.cta}
          </button>
          <button 
            onClick={handleClose}
            className="p-1 hover:bg-slate-800 rounded-full text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  if (position === 'sidebar') {
    return (
      <div className={`bg-gradient-to-b ${ad.bgClass} border ${ad.borderClass} rounded-2xl p-3.5 relative overflow-hidden shadow-xl animate-fadeIn`}>
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <span className="text-[8px] bg-slate-950/80 px-1.5 py-0.5 rounded text-slate-500 font-mono uppercase tracking-widest">PATROCINADO</span>
          <button 
            onClick={handleClose}
            className="p-1 hover:bg-slate-800 rounded-full text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5 mt-2">
          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-950/80 ${ad.textAccent}`}>
            {ad.badge}
          </span>
          <div>
            <h4 className="text-sm font-black text-white tracking-wide">{ad.title}</h4>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Por {ad.sponsor}</p>
          </div>
          <p className="text-xs text-slate-300 leading-normal">
            {ad.desc}
          </p>
          
          <button
            onClick={handleCtaClick}
            className={`w-full py-1.5 bg-slate-950 hover:bg-slate-900 border ${ad.borderClass} ${ad.textAccent} font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] cursor-pointer`}
          >
            {ad.cta} <ExternalLink className="w-3 h-3" />
          </button>
          
          <div className="text-center">
            <span className="text-[8px] text-slate-500 font-mono">Arrecadado: <strong className="text-emerald-400 font-bold">R$ {adRevenue.toFixed(2)}</strong></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full bg-gradient-to-r ${ad.bgClass} border ${ad.borderClass} rounded-xl p-3 md:px-5 md:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 relative overflow-hidden shadow-lg animate-fadeIn`}>
      {/* Absolute Header Ribbon */}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5">
        <span className="text-[7px] bg-slate-950/80 px-1 py-0.5 rounded text-slate-500 font-mono uppercase tracking-widest">ANÚNCIO SEGURO</span>
        <button 
          onClick={handleClose}
          className="p-1 hover:bg-slate-800 rounded-full text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-start md:items-center gap-2.5 pr-8">
        <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-lg flex items-center justify-center shrink-0">
          📢
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-black text-white tracking-wide">{ad.title}</h4>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-950/80 ${ad.textAccent} leading-none`}>
              {ad.badge}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal mt-0.5">{ad.desc} <span className="text-[9px] text-slate-500 font-mono">• Patrocinado por {ad.sponsor}</span></p>
        </div>
      </div>

      <div className="flex items-center gap-3 min-w-fit self-end md:self-auto">
        <div className="text-right hidden sm:block">
          <span className="text-[8px] text-slate-500 font-mono block">PLATAFORMA FATUROU</span>
          <span className="text-xs font-bold text-emerald-400 font-mono">R$ {adRevenue.toFixed(2)}</span>
        </div>
        <button
          onClick={handleCtaClick}
          className={`px-4 py-2 bg-slate-950 hover:bg-slate-900 border ${ad.borderClass} ${ad.textAccent} font-extrabold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all hover:scale-102 cursor-pointer`}
        >
          {ad.cta}
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
