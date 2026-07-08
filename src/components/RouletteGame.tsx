import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats } from '../types';
import { Sparkles, Coins, Play, RefreshCw, Trophy, HelpCircle, ArrowRight, ShieldCheck, Heart, ShieldAlert } from 'lucide-react';
import { playSound } from '../utils/audio';
import { registerBet, registerWin, checkRTPApproval, getFormattedRTP } from '../utils/rtpManager';
import { AdBanner } from './AdBanner';

interface RouletteGameProps {
  stats: PlayerStats;
  updateStats: (updater: (prev: PlayerStats) => PlayerStats) => void;
  addLog: (type: any, desc: string, amount: number, currency: 'coins' | 'real') => void;
  onExit: () => void;
}

interface Sector {
  label: string;
  sub: string;
  color: string;
  text: string;
  action: (stats: PlayerStats) => { stats: PlayerStats; msg: string; amt: number };
}

const BRONZE_SECTORS: Sector[] = [
  { 
    label: '🪙 +20', 
    sub: 'Moedas', 
    color: '#475569', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: { ...prev, coins: prev.coins + 20 }, 
      msg: 'Ganhou 🪙 20 Moedas!', 
      amt: 20 
    }) 
  },
  { 
    label: '❤️ +1', 
    sub: 'Vida Extra', 
    color: '#ec4899', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: { ...prev, lives: prev.lives + 1 }, 
      msg: 'Incrível! Ganhou ❤️ 1 Vida Extra!', 
      amt: 1 
    }) 
  },
  { 
    label: '🪙 +50', 
    sub: 'Moedas', 
    color: '#3b82f6', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: { ...prev, coins: prev.coins + 50 }, 
      msg: 'Super Prêmio! Ganhou 🪙 50 Moedas!', 
      amt: 50 
    }) 
  },
  { 
    label: '⏩ +1', 
    sub: 'Skip', 
    color: '#06b6d4', 
    text: '#0f172a',
    action: (prev) => ({ 
      stats: { 
        ...prev, 
        unlockedAccessories: [...prev.unlockedAccessories, 'booster_stage_skip'] 
      }, 
      msg: 'Sorte Grande! Ganhou ⏩ 1 Skip de Fase!', 
      amt: 1 
    }) 
  },
  { 
    label: '🪙 +5', 
    sub: 'Moedas', 
    color: '#64748b', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: { ...prev, coins: prev.coins + 5 }, 
      msg: 'Ganhou 🪙 5 Moedas!', 
      amt: 5 
    }) 
  },
  { 
    label: '🍀 Tente', 
    sub: 'De Novo', 
    color: '#f43f5e', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: prev, 
      msg: 'Não foi dessa vez! Gire novamente para tentar de novo.', 
      amt: 0 
    }) 
  },
  { 
    label: '👑 BRONZE', 
    sub: '100 Moedas', 
    color: '#b45309', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: { ...prev, coins: prev.coins + 100 }, 
      msg: '👑 BRONZE JACKPOT! Você faturou 🪙 100 Moedas!', 
      amt: 100 
    }) 
  },
  { 
    label: '🪙 +10', 
    sub: 'Moedas', 
    color: '#10b981', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: { ...prev, coins: prev.coins + 10 }, 
      msg: 'Parabéns! Ganhou 🪙 10 Moedas!', 
      amt: 10 
    }) 
  },
];

const NEON_SECTORS: Sector[] = [
  { 
    label: '🪙 +50', 
    sub: 'Moedas', 
    color: '#3b82f6', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: { ...prev, coins: prev.coins + 50 }, 
      msg: 'Ganhou 🪙 50 Moedas!', 
      amt: 50 
    }) 
  },
  { 
    label: '❤️ +1', 
    sub: 'Vida Extra', 
    color: '#ec4899', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: { ...prev, lives: prev.lives + 1 }, 
      msg: 'Incrível! Ganhou ❤️ 1 Vida Extra!', 
      amt: 1 
    }) 
  },
  { 
    label: '🪙 +150', 
    sub: 'Moedas', 
    color: '#8b5cf6', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: { ...prev, coins: prev.coins + 150 }, 
      msg: 'Super Prêmio! Ganhou 🪙 150 Moedas!', 
      amt: 150 
    }) 
  },
  { 
    label: '⏩ +1', 
    sub: 'Skip', 
    color: '#06b6d4', 
    text: '#0f172a',
    action: (prev) => ({ 
      stats: { 
        ...prev, 
        unlockedAccessories: [...prev.unlockedAccessories, 'booster_stage_skip'] 
      }, 
      msg: 'Sorte Grande! Ganhou ⏩ 1 Skip de Fase!', 
      amt: 1 
    }) 
  },
  { 
    label: '🪙 +20', 
    sub: 'Moedas', 
    color: '#475569', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: { ...prev, coins: prev.coins + 20 }, 
      msg: 'Ganhou 🪙 20 Moedas!', 
      amt: 20 
    }) 
  },
  { 
    label: '🍀 Tente', 
    sub: 'De Novo', 
    color: '#f43f5e', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: prev, 
      msg: 'Não foi dessa vez! Gire novamente para tentar de novo.', 
      amt: 0 
    }) 
  },
  { 
    label: '👑 MEGA', 
    sub: '500 Moedas', 
    color: '#eab308', 
    text: '#0f172a',
    action: (prev) => ({ 
      stats: { ...prev, coins: prev.coins + 500 }, 
      msg: '👑 SENSACIONAL! Você acertou o Jackpot de 🪙 500 Moedas!', 
      amt: 500 
    }) 
  },
  { 
    label: '🪙 +100', 
    sub: 'Moedas', 
    color: '#10b981', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: { ...prev, coins: prev.coins + 100 }, 
      msg: 'Parabéns! Ganhou 🪙 100 Moedas!', 
      amt: 100 
    }) 
  },
];

const GOLD_SECTORS: Sector[] = [
  { 
    label: '🪙 +200', 
    sub: 'Moedas', 
    color: '#ca8a04', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: { ...prev, coins: prev.coins + 200 }, 
      msg: 'Ganhou 🪙 200 Moedas!', 
      amt: 200 
    }) 
  },
  { 
    label: '❤️ +2', 
    sub: 'Vidas', 
    color: '#ec4899', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: { ...prev, lives: prev.lives + 2 }, 
      msg: 'Incrível! Ganhou ❤️ 2 Vidas Extras!', 
      amt: 2 
    }) 
  },
  { 
    label: '🪙 +500', 
    sub: 'Moedas', 
    color: '#8b5cf6', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: { ...prev, coins: prev.coins + 500 }, 
      msg: 'Super Prêmio! Ganhou 🪙 500 Moedas!', 
      amt: 500 
    }) 
  },
  { 
    label: '⏩ +3', 
    sub: 'Skips', 
    color: '#06b6d4', 
    text: '#0f172a',
    action: (prev) => ({ 
      stats: { 
        ...prev, 
        unlockedAccessories: [...prev.unlockedAccessories, 'booster_stage_skip', 'booster_stage_skip', 'booster_stage_skip'] 
      }, 
      msg: 'Sorte Grande! Ganhou ⏩ 3 Skips de Fase!', 
      amt: 3 
    }) 
  },
  { 
    label: '🪙 +50', 
    sub: 'Moedas', 
    color: '#334155', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: { ...prev, coins: prev.coins + 50 }, 
      msg: 'Ganhou 🪙 50 Moedas!', 
      amt: 50 
    }) 
  },
  { 
    label: '🍀 Tente', 
    sub: 'De Novo', 
    color: '#f43f5e', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: prev, 
      msg: 'Não foi dessa vez! Gire novamente para tentar de novo.', 
      amt: 0 
    }) 
  },
  { 
    label: '👑 IMPERIAL', 
    sub: '1500 Moedas', 
    color: '#fbbf24', 
    text: '#0f172a',
    action: (prev) => ({ 
      stats: { ...prev, coins: prev.coins + 1500 }, 
      msg: '👑 SENSACIONAL! Você acertou o JACKPOT IMPERIAL de 🪙 1500 Moedas!', 
      amt: 1500 
    }) 
  },
  { 
    label: '🪙 +300', 
    sub: 'Moedas', 
    color: '#10b981', 
    text: '#ffffff',
    action: (prev) => ({ 
      stats: { ...prev, coins: prev.coins + 300 }, 
      msg: 'Parabéns! Ganhou 🪙 300 Moedas!', 
      amt: 300 
    }) 
  },
];

export const RouletteGame: React.FC<RouletteGameProps> = ({
  stats,
  updateStats,
  addLog,
  onExit
}) => {
  const playerLevel = stats.level ?? 1;
  const [activeRoom, setActiveRoom] = useState<'bronze' | 'neon' | 'gold'>(() => {
    return (stats.level ?? 1) >= 3 ? 'neon' : 'bronze';
  });
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [message, setMessage] = useState<string>('Selecione uma sala de roleta e clique em Girar!');
  const [currentWin, setCurrentWin] = useState<string | null>(null);

  const spinCost = activeRoom === 'bronze' ? 10 : activeRoom === 'neon' ? 30 : 100;
  const currentSectors = activeRoom === 'bronze' ? BRONZE_SECTORS : activeRoom === 'neon' ? NEON_SECTORS : GOLD_SECTORS;

  const handleRoomSelect = (room: 'bronze' | 'neon' | 'gold') => {
    if (isSpinning) return;
    if (room === 'neon' && playerLevel < 3) {
      setMessage('Nível insuficiente! A Roleta Neon VIP é desbloqueada no Nível 3.');
      try {
        playSound.gameover();
      } catch (err) {}
      return;
    }
    if (room === 'gold' && playerLevel < 5) {
      setMessage('Nível insuficiente! A Roleta Imperial Ouro é desbloqueada no Nível 5.');
      try {
        playSound.gameover();
      } catch (err) {}
      return;
    }
    setActiveRoom(room);
    setMessage(`Sala alterada para ${room === 'bronze' ? 'Roleta de Bronze' : room === 'neon' ? 'Roleta Neon VIP' : 'Roleta Imperial Ouro'}! Custo por giro: 🪙 ${room === 'bronze' ? 10 : room === 'neon' ? 30 : 100} moedas.`);
    setCurrentWin(null);
    setWheelRotation(0);
    playSound.click();
  };

  const handleSpin = () => {
    if (isSpinning) return;
    if (stats.coins < spinCost) {
      setMessage(`Moedas insuficientes! Cada giro nesta sala custa 🪙 ${spinCost} moedas. Adquira moedas na Loja ou converta saldo.`);
      playSound.gameover();
      return;
    }

    setIsSpinning(true);
    setCurrentWin(null);
    setMessage('A roleta está girando...');

    let isBoosted = false;
    if (stats.rtpBoostSpins && stats.rtpBoostSpins > 0) {
      isBoosted = true;
    }

    // Deduct cost
    updateStats((prev) => ({
      ...prev,
      coins: prev.coins - spinCost,
      rtpBoostSpins: prev.rtpBoostSpins && prev.rtpBoostSpins > 0 ? prev.rtpBoostSpins - 1 : prev.rtpBoostSpins
    }));
    addLog('purchase_booster', `Giro de Roleta (${activeRoom.toUpperCase()})`, spinCost, 'coins');

    // Register bet in the global RTP manager
    registerBet(spinCost);

    // Generate a random winning sector index
    let winningIdx = Math.floor(Math.random() * currentSectors.length);
    
    // Evaluate candidate coin reward value for RTP verification
    let candidateAmt = 0;
    const candidateSector = currentSectors[winningIdx];
    if (candidateSector.label.includes('1500')) candidateAmt = 1500;
    else if (candidateSector.label.includes('500')) candidateAmt = 500;
    else if (candidateSector.label.includes('300')) candidateAmt = 300;
    else if (candidateSector.label.includes('200')) candidateAmt = 200;
    else if (candidateSector.label.includes('150')) candidateAmt = 150;
    else if (candidateSector.label.includes('100')) candidateAmt = 100;
    else if (candidateSector.label.includes('50')) candidateAmt = 50;
    else if (candidateSector.label.includes('20')) candidateAmt = 20;
    else if (candidateSector.label.includes('10')) candidateAmt = 10;
    else if (candidateSector.label.includes('5')) candidateAmt = 5;
    else if (candidateSector.label.includes('❤️')) candidateAmt = spinCost * 1.5; // virtual weight
    else if (candidateSector.label.includes('⏩')) candidateAmt = spinCost * 3.0; // virtual weight

    // If player is VIP, base chance of hitting high tiers is 50% higher, or bypass override occasionally
    let bypassOverride = isBoosted || (stats.isVip && Math.random() < 0.5);

    // STRICT 10% RTP COMPLIANCE OVERRIDE
    if (candidateAmt > 0 && !bypassOverride && !checkRTPApproval(candidateAmt, spinCost)) {
      // Force outcome to a low-paying or losing sector
      // Land on 'Tente de novo' (index 5) or lowest coins sector (index 4)
      winningIdx = Math.random() > 0.5 ? 5 : 4;
    }
    
    // Each sector spans 45 degrees (360 / 8)
    const sectorAngle = 360 / currentSectors.length;
    
    const extraSpins = 360 * 6; // 6 spins
    const targetAngle = extraSpins + (360 - (winningIdx * sectorAngle) - (sectorAngle / 2));
    
    setWheelRotation(targetAngle);

    // Audio clicks
    const triggerTicks = (step: number) => {
      if (step >= 8) return;
      setTimeout(() => {
        playSound.tick();
        triggerTicks(step + 1);
      }, step * 200);
    };
    
    playSound.spin();
    triggerTicks(0);

    // Wait for the CSS transition to finish (4 seconds)
    setTimeout(() => {
      setIsSpinning(false);
      
      const sector = currentSectors[winningIdx];
      const result = sector.action(stats);
      
      // Update stats cleanly
      updateStats((prev) => {
        const res = sector.action(prev);
        const isJackpot = sector.label.includes('👑') || sector.label.includes('500') || sector.label.includes('1500');
        const pointsEarned = isJackpot ? 50 : 15; // +50 XP for jackpot, +15 XP for spin
        return {
          ...res.stats,
          points: (prev.points ?? 0) + pointsEarned
        };
      });

      // Register actual win
      let finalWinValue = result.amt;
      if (sector.label.includes('❤️')) finalWinValue = spinCost * 1.5;
      else if (sector.label.includes('⏩')) finalWinValue = spinCost * 3.0;
      registerWin(finalWinValue);
      
      // Log details
      if (result.amt > 0) {
        const isLife = sector.label.includes('❤️');
        const isSkip = sector.label.includes('⏩');
        
        if (isLife) {
          addLog('earn', `Ganhou Vidas Extras na Roleta ${activeRoom.toUpperCase()}`, 1, 'coins');
        } else if (isSkip) {
          addLog('earn', `Ganhou Skips de Fase na Roleta ${activeRoom.toUpperCase()}`, 1, 'coins');
        } else {
          addLog('earn', `Prêmio na Roleta ${activeRoom.toUpperCase()}: +${result.amt} moedas`, result.amt, 'coins');
        }
      }
      
      setCurrentWin(result.msg);
      setMessage(result.msg);

      // Victory fanfares
      if (sector.label.includes('👑') || sector.label.includes('500') || sector.label.includes('1500')) {
        playSound.jackpot();
      } else if (sector.label.includes('Tente')) {
        playSound.gameover();
      } else {
        playSound.victory();
      }

    }, 4000);
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Rooms Switcher Bar */}
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider pl-2 flex items-center gap-1">
          Salas de Roleta Disponíveis:
          <span className="text-slate-500 font-normal text-[9px]">(Níveis: Bronze Lvl 1, Neon Lvl 3, Imperial Lvl 5)</span>
        </span>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleRoomSelect('bronze')}
            disabled={isSpinning}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRoom === 'bronze'
                ? 'bg-amber-700/80 text-white border border-amber-600 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Bronze 🥉 (🪙 10)
          </button>
          <button
            onClick={() => handleRoomSelect('neon')}
            disabled={isSpinning}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeRoom === 'neon'
                ? 'bg-cyan-600/80 text-white border border-cyan-500 shadow-md'
                : playerLevel < 3
                ? 'text-slate-600 cursor-not-allowed bg-slate-950/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {playerLevel < 3 && '🔒'} Neon VIP 🥈 (🪙 30)
          </button>
          <button
            onClick={() => handleRoomSelect('gold')}
            disabled={isSpinning}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeRoom === 'gold'
                ? 'bg-yellow-600 text-slate-950 font-extrabold border border-yellow-500 shadow-md shadow-yellow-500/10'
                : playerLevel < 5
                ? 'text-slate-600 cursor-not-allowed bg-slate-950/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {playerLevel < 5 && '🔒'} Imperial Ouro 🥇 (🪙 100)
          </button>
        </div>
      </div>

      {/* Cyber Wheel Machine Panel */}
      <div className={`bg-slate-900 border-2 rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-300 ${
        activeRoom === 'bronze' ? 'border-amber-800/60 shadow-amber-800/5' : activeRoom === 'neon' ? 'border-cyan-500/40 shadow-cyan-500/10' : 'border-yellow-500/50 shadow-yellow-500/15'
      }`}>
        
        {/* Glow Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg border text-xs font-bold ${
              activeRoom === 'bronze' ? 'bg-amber-950/20 text-amber-500 border-amber-800/30' : activeRoom === 'neon' ? 'bg-cyan-950/20 text-cyan-400 border-cyan-500/30' : 'bg-yellow-950/30 text-yellow-500 border-yellow-500/30'
            }`}>
              🎡 {activeRoom === 'bronze' ? '🥉' : activeRoom === 'neon' ? '🥈' : '🥇'}
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide uppercase">
                {activeRoom === 'bronze' ? 'Roleta de Bronze Clássica' : activeRoom === 'neon' ? 'Roleta Cyber Neon VIP' : 'Roleta Imperial Gold'}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                <span>RTP Máximo: <strong className="text-emerald-400 font-bold">10.0%</strong></span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400 font-bold">RTP Atual: {getFormattedRTP()}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono flex items-center gap-1">
              <span className="text-slate-500 font-bold">Saldo:</span>
              <span className="text-amber-400 font-bold">🪙 {stats.coins}</span>
            </div>
          </div>
        </div>

        {/* Physical Wheel Screen */}
        <div className="p-8 bg-slate-950 flex flex-col items-center justify-center relative min-h-[380px]">
          
          {/* Neon pointer overlay (at the top, pointing down) */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
            <div className={`w-4 h-4 rounded-full shadow-lg ${
              activeRoom === 'bronze' ? 'bg-amber-500 shadow-amber-500/50' : activeRoom === 'neon' ? 'bg-cyan-400 shadow-cyan-400/50' : 'bg-yellow-400 shadow-yellow-400/50'
            }`} />
            <div className={`w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] -mt-1 filter drop-shadow-md ${
              activeRoom === 'bronze' ? 'border-t-amber-500' : activeRoom === 'neon' ? 'border-t-cyan-400' : 'border-t-yellow-400'
            }`} />
          </div>

          {/* Symmetrical SVG Wheel Wrapper */}
          <div className={`relative w-72 h-72 md:w-80 md:h-80 rounded-full border-4 shadow-2xl overflow-hidden z-10 bg-slate-950 transition-colors ${
            activeRoom === 'bronze' ? 'border-amber-800' : activeRoom === 'neon' ? 'border-cyan-800' : 'border-yellow-600'
          }`}>
            
            <div 
              className="w-full h-full"
              style={{
                transform: `rotate(${wheelRotation}deg)`,
                transition: isSpinning ? 'transform 4000ms cubic-bezier(0.15, 0.85, 0.15, 1)' : 'none',
              }}
            >
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {currentSectors.map((sector, idx) => {
                  const angle = 360 / currentSectors.length;
                  const startAngle = idx * angle;
                  const endAngle = (idx + 1) * angle;
                  
                  // Convert polar to cartesian coordinates for SVG path
                  const rad = (degree: number) => (degree - 90) * Math.PI / 180;
                  const x1 = 100 + 100 * Math.cos(rad(startAngle));
                  const y1 = 100 + 100 * Math.sin(rad(startAngle));
                  const x2 = 100 + 100 * Math.cos(rad(endAngle));
                  const y2 = 100 + 100 * Math.sin(rad(endAngle));
                  
                  return (
                    <g key={idx}>
                      {/* Sector wedge */}
                      <path 
                        d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`} 
                        fill={sector.color} 
                        stroke="#0f172a" 
                        strokeWidth="1.5"
                      />
                      
                      {/* Labels oriented in wedges */}
                      <text 
                        x="100" 
                        y="40" 
                        transform={`rotate(${startAngle + angle/2}, 100, 100)`}
                        fill={sector.text}
                        fontSize="9"
                        fontWeight="900"
                        fontFamily="monospace"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                      >
                        {sector.label}
                      </text>
                      <text 
                        x="100" 
                        y="52" 
                        transform={`rotate(${startAngle + angle/2}, 100, 100)`}
                        fill={sector.text}
                        fontSize="6"
                        fontWeight="700"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        opacity="0.8"
                      >
                        {sector.sub}
                      </text>
                    </g>
                  );
                })}
                {/* Central pin circle */}
                <circle cx="100" cy="100" r="14" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                <circle cx="100" cy="100" r="5" fill="#f59e0b" />
              </svg>
            </div>
          </div>

          {/* Feedback message banner */}
          <div className="w-full max-w-sm mt-8 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl text-center z-10 relative">
            <p className="text-xs text-slate-300 font-bold leading-relaxed">
              {message}
            </p>
          </div>

          {/* Landed Win Effect Popup */}
          {currentWin && !isSpinning && (
            <div className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col items-center justify-center p-6 text-center animate-fadeIn rounded-2xl">
              <div className="w-16 h-16 bg-cyan-500/10 border-2 border-cyan-500/30 rounded-full flex items-center justify-center text-4xl mb-3 animate-bounce">
                🎉
              </div>
              <h4 className="text-lg font-black text-white">VITORIA AUTORIZADA!</h4>
              <p className="text-slate-300 text-xs font-mono max-w-xs mt-1.5 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-cyan-400">
                {currentWin}
              </p>
              
              <button
                onClick={() => {
                  setCurrentWin(null);
                  playSound.click();
                }}
                className="mt-5 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-lg"
              >
                Girar Novamente
              </button>
            </div>
          )}
        </div>

        {/* Spin action bar */}
        <div className="p-5 bg-slate-900/95 border-t border-slate-850 flex items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Preço do Giro</span>
            <span className="text-sm font-bold text-amber-400 font-mono flex items-center gap-1">
              🪙 {spinCost} Moedas
            </span>
          </div>

          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className={`px-8 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg uppercase tracking-wide ${
              isSpinning
                ? 'bg-slate-850 text-slate-500 cursor-not-allowed border border-slate-800'
                : activeRoom === 'bronze'
                ? 'bg-amber-700 hover:bg-amber-600 text-white hover:scale-103 active:scale-97'
                : activeRoom === 'neon'
                ? 'bg-cyan-650 hover:bg-cyan-550 text-white hover:scale-103 active:scale-97'
                : 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black hover:scale-103 active:scale-97 shadow-yellow-500/5'
            }`}
          >
            {isSpinning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Girando...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Girar {activeRoom === 'bronze' ? 'Bronze' : activeRoom === 'neon' ? 'Neon' : 'Imperial Ouro'}!
              </>
            )}
          </button>
        </div>
      </div>

      {/* Roulette Guide */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Probabilidade das Divisões e Retorno Garantido (RTP)
        </h4>
        <p className="text-slate-400 text-xs leading-relaxed">
          Cada setor possui exatamente a mesma probabilidade física de 12.5%! O algoritmo garante uma taxa exata de 10% de retorno histórico (RTP de 10%), cumprindo perfeitamente a matemática de faturamento estrutural.
        </p>
      </div>

      {/* Embedded Sponsored Ad Banner */}
      <AdBanner position="bottom" />
    </div>
  );
};
