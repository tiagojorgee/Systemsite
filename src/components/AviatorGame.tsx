import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats } from '../types';
import { Coins, Play, RefreshCw, Sparkles, HelpCircle, AlertCircle, TrendingUp, Navigation, CircleDot } from 'lucide-react';
import { playSound } from '../utils/audio';
import { registerBet, registerWin, checkRTPApproval, getFormattedRTP } from '../utils/rtpManager';
import { AdBanner } from './AdBanner';

interface AviatorGameProps {
  stats: PlayerStats;
  updateStats: (updater: (prev: PlayerStats) => PlayerStats) => void;
  addLog: (type: any, desc: string, amount: number, currency: 'coins' | 'real') => void;
  onExit: () => void;
}

export const AviatorGame: React.FC<AviatorGameProps> = ({
  stats,
  updateStats,
  addLog,
  onExit
}) => {
  const playerLevel = stats.level ?? 1;
  const [bet, setBet] = useState<number>(20);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [gameState, setGameState] = useState<'idle' | 'flying' | 'crashed' | 'cashed_out'>('idle');
  const [message, setMessage] = useState<string>('Faça sua aposta, inicie o voo e retire antes do avião decolar para sempre!');
  const [recentWin, setRecentWin] = useState<number | null>(null);
  const [isRoundBoosted, setIsRoundBoosted] = useState<boolean>(false);

  // References for managing the animation loop
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const crashPointRef = useRef<number>(2.0);
  const currentMultiplierRef = useRef<number>(1.00);

  const availableBets = [10, 20, 50, 100, 250];

  const getBetLevelReq = (amt: number): number => {
    if (amt <= 20) return 1;
    if (amt === 50) return 2;
    if (amt === 100) return 4;
    if (amt === 250) return 6;
    return 1;
  };

  const isBetLocked = (amt: number): boolean => {
    return playerLevel < getBetLevelReq(amt);
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleStartFlight = () => {
    if (isPlaying) return;
    if (stats.coins < bet) {
      setMessage('Saldo de Moedas insuficiente! Compre moedas na loja para decolar seu saldo no Aviãozinho.');
      playSound.click();
      return;
    }

    // Reset states
    setRecentWin(null);
    setMultiplier(1.00);
    currentMultiplierRef.current = 1.00;
    setGameState('flying');
    setIsPlaying(true);
    setMessage('O aviãozinho está subindo! Retire o saldo quando quiser.');

    const boosted = stats.rtpBoostSpins ? stats.rtpBoostSpins > 0 : false;
    setIsRoundBoosted(boosted);

    // Deduct bet coins
    updateStats((prev) => ({
      ...prev,
      coins: prev.coins - bet,
      rtpBoostSpins: prev.rtpBoostSpins && prev.rtpBoostSpins > 0 ? prev.rtpBoostSpins - 1 : prev.rtpBoostSpins
    }));
    addLog('purchase_booster', `Aposta no Aviãozinho`, bet, 'coins');
    registerBet(bet);

    // Calculate crash point
    // Default random crash between 1.10 and 8.00
    let calculatedCrash = 1.10 + Math.random() * 6.90;

    // STRICT 10% RTP COMPLIANCE
    // If giving them even a tiny profit of 1.2x would violate the RTP budget,
    // we force the plane to crash instantly or very close to start (between 1.00 and 1.08)
    const testProfit = bet * 1.2;
    const bypassOverride = boosted || (stats.isVip && Math.random() < 0.5);
    if (!bypassOverride && !checkRTPApproval(testProfit, bet)) {
      calculatedCrash = 1.00 + Math.random() * 0.08; // crashes immediately!
    }

    crashPointRef.current = calculatedCrash;

    // Start multiplier ticks
    intervalRef.current = setInterval(() => {
      currentMultiplierRef.current += 0.03 + (currentMultiplierRef.current * 0.01); // accelerates as it flies higher
      const displayMult = parseFloat(currentMultiplierRef.current.toFixed(2));
      setMultiplier(displayMult);

      // Trigger standard flight ticking sound
      playSound.tick();

      // Check for crash
      if (displayMult >= crashPointRef.current) {
        handleCrash();
      }
    }, 120);
  };

  const handleCrash = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setGameState('crashed');
    setIsPlaying(false);
    updateStats((prev) => ({
      ...prev,
      points: (prev.points ?? 0) + 10 // +10 XP for effort
    }));
    playSound.gameover();
    setMessage(`✈️ Decolou para o infinito! O avião sumiu a ${multiplier.toFixed(2)}x e você perdeu as moedas apostadas.`);
  };

  const handleCashOut = () => {
    if (gameState !== 'flying') return;

    // Final security RTP double-check:
    // If they click cashout, verify if this specific prize is allowed by our RTP budget
    const finalPayout = Math.floor(bet * multiplier);
    
    const bypassOverride = isRoundBoosted || (stats.isVip && Math.random() < 0.5);
    if (finalPayout > 0 && !bypassOverride && !checkRTPApproval(finalPayout, bet)) {
      // Force instant crash just before they could finish!
      handleCrash();
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Register actual win
    registerWin(finalPayout);
    updateStats((prev) => ({
      ...prev,
      coins: prev.coins + finalPayout,
      points: (prev.points ?? 0) + 30 // +30 XP for winning
    }));
    addLog('earn', `Lucro no Aviãozinho (${multiplier.toFixed(2)}x)`, finalPayout, 'coins');

    setRecentWin(finalPayout);
    setGameState('cashed_out');
    setIsPlaying(false);
    playSound.victory();
    setMessage(`🎉 SAQUE REALIZADO! Você retirou a ${multiplier.toFixed(2)}x e faturou 🪙 ${finalPayout} moedas com segurança!`);
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Flight Radar Screen */}
      <div className="bg-slate-900 border-2 border-rose-500/40 rounded-3xl overflow-hidden shadow-[0_0_25px_rgba(244,63,94,0.25)] relative">
        
        {/* Glow Header */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 p-4 border-b border-rose-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-rose-600/20 text-rose-400 p-2 rounded-lg border border-rose-500/30 text-xs">
              ✈️
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5">
                AVIATOR MULTIPLIER <span className="text-[10px] text-red-400">MULTIPLY</span>
              </h3>
              <p className="text-[10px] text-rose-300 font-mono flex items-center gap-1.5 flex-wrap">
                <span>RTP: <strong className="text-emerald-400">10.0% Max</strong></span>
                <span>•</span>
                <span>RTP Atual: {getFormattedRTP()}</span>
                {stats.isVip && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">👑 VIP (+50% RTP)</span>
                  </>
                )}
                {stats.rtpBoostSpins && stats.rtpBoostSpins > 0 ? (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold animate-pulse flex items-center gap-0.5">🍀 {stats.rtpBoostSpins} Giros com Super Sorte (+200%)</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
          
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-rose-400 font-bold">🪙 {stats.coins}</span>
          </div>
        </div>

        {/* Flight Line Area */}
        <div className="p-6 md:p-10 bg-slate-950 flex flex-col items-center justify-center relative min-h-[220px]">
          
          {/* Radar grids */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:24px_24px]" />
          
          {/* Multiplier Display */}
          <div className="z-10 text-center space-y-2">
            {gameState === 'flying' && (
              <div className="animate-pulse flex items-center justify-center gap-1.5">
                <CircleDot className="w-2.5 h-2.5 text-rose-500" />
                <span className="text-[10px] text-rose-400 font-mono tracking-widest uppercase">VOANDO ALTO</span>
              </div>
            )}
            
            <h1 className={`text-4xl md:text-6xl font-black font-mono tracking-tighter transition-all ${
              gameState === 'crashed' 
                ? 'text-red-500 scale-95' 
                : gameState === 'cashed_out' 
                ? 'text-emerald-400 scale-105' 
                : 'text-rose-500'
            }`}>
              {multiplier.toFixed(2)}x
            </h1>

            {gameState === 'crashed' && (
              <span className="inline-block bg-red-950/80 text-red-400 border border-red-500/30 px-3 py-1 text-xs font-extrabold rounded-lg uppercase tracking-wider animate-bounce mt-2">
                Decolou! (Crash)
              </span>
            )}
            {gameState === 'cashed_out' && (
              <span className="inline-block bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-extrabold rounded-lg uppercase tracking-wider animate-bounce mt-2">
                Vitória Garantida!
              </span>
            )}
          </div>

          {/* Simple Vector plane climbing indicator */}
          {gameState === 'flying' && (
            <div 
              className="absolute bottom-6 left-6 transition-all duration-100 ease-out flex items-center gap-2"
              style={{
                transform: `translate(${Math.min(multiplier * 20, 200)}px, -${Math.min(multiplier * 15, 120)}px)`,
              }}
            >
              <Navigation className="w-5 h-5 text-rose-500 transform rotate-45 animate-bounce" />
              <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-rose-500/40" />
            </div>
          )}

          {/* Information box */}
          <div className="w-full max-w-sm mt-8 bg-rose-950/20 border border-rose-500/10 p-3 rounded-xl text-center z-10 relative">
            <p className="text-[11px] text-rose-200 leading-relaxed font-sans">
              {message}
            </p>
          </div>
        </div>

        {/* Play control pads */}
        <div className="p-5 bg-slate-900/95 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="space-y-1.5 w-full sm:w-auto text-center sm:text-left">
            <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-widest">
              Definir Aposta do Voo
            </span>
            <div className="flex items-center gap-1.5 justify-center sm:justify-start">
              {availableBets.map((amount) => {
                const locked = isBetLocked(amount);
                const req = getBetLevelReq(amount);
                return (
                  <button
                    key={amount}
                    disabled={isPlaying}
                    onClick={() => {
                      if (locked) {
                        setMessage(`Aposta bloqueada! O valor 🪙 ${amount} requer Nível ${req}.`);
                        try {
                          playSound.gameover();
                        } catch (err) {}
                        return;
                      }
                      setBet(amount);
                      playSound.click();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                      bet === amount
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : locked
                        ? 'bg-slate-950/40 text-slate-600 border border-slate-950/60 cursor-not-allowed opacity-50'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                    title={locked ? `Requer Nível ${req}` : `Aposta de 🪙 ${amount}`}
                  >
                    {locked ? `🔒 ${amount}` : amount}
                  </button>
                );
              })}
            </div>
          </div>

          {gameState === 'flying' ? (
            <button
              onClick={handleCashOut}
              className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 hover:from-emerald-400 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer uppercase tracking-wider animate-pulse"
            >
              <TrendingUp className="w-5 h-5" />
              CASH OUT (🪙 {(bet * multiplier).toFixed(0)})
            </button>
          ) : (
            <button
              onClick={handleStartFlight}
              disabled={isPlaying}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg uppercase tracking-wide ${
                isPlaying
                  ? 'bg-slate-850 text-slate-500 cursor-not-allowed border border-slate-800'
                  : 'bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-400 shadow-rose-500/15 hover:scale-103'
              }`}
            >
              <Play className="w-4 h-4 fill-white" />
              Decolar Voo (🪙 {bet})
            </button>
          )}
        </div>
      </div>

      {/* Guide details */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-rose-400" />
          Como Funciona o Aviãozinho?
        </h4>
        <ul className="text-[11px] text-slate-400 space-y-1.5 leading-relaxed list-disc list-inside">
          <li>Insira uma aposta utilizando suas moedas do inventário da plataforma.</li>
          <li>Inicie o voo do avião. O multiplicador crescerá continuamente.</li>
          <li>Você deve retirar seus ganhos pressionando o botão verde de <strong>CASH OUT</strong> antes que a aeronave decole para longe de sua tela.</li>
          <li>Se o avião sumir de vista sem o Cash Out executado, a sua aposta é perdida integralmente!</li>
        </ul>
      </div>

      {/* Embedded Sponsored Ad Banner */}
      <AdBanner position="bottom" />
    </div>
  );
};
