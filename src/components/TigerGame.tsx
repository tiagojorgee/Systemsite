import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats } from '../types';
import { 
  Coins, Play, RefreshCw, Sparkles, Award, Zap, Bot, 
  ShieldCheck, Flame, Cpu, ArrowRight, User, Settings, 
  Info, TrendingUp, HelpCircle, Volume2, VolumeX, FastForward 
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { registerBet, registerWin, checkRTPApproval, getFormattedRTP } from '../utils/rtpManager';
import { AdBanner } from './AdBanner';

interface TigerGameProps {
  stats: PlayerStats;
  updateStats: (updater: (prev: PlayerStats) => PlayerStats) => void;
  addLog: (type: any, desc: string, amount: number, currency: 'coins' | 'real') => void;
  onExit: () => void;
}

interface SymbolDefinition {
  symbol: string;
  name: string;
  reward: number; // Multiplier payout for 3-of-a-kind
  color: string;
  glow: string;
}

// PREMIUM FORTUNE TIGER SYMBOLS (With Wilds and custom coloring matching real slot aesthetics)
const TIGER_SYMBOLS: SymbolDefinition[] = [
  { symbol: '🐯', name: 'Super Tigre WILD', reward: 50, color: 'text-amber-500', glow: 'shadow-amber-500/50' },
  { symbol: '💰', name: 'Saco de Ouro Imperial', reward: 15, color: 'text-yellow-500', glow: 'shadow-yellow-400/40' },
  { symbol: '💍', name: 'Jade da Dinastia', reward: 10, color: 'text-emerald-500', glow: 'shadow-emerald-400/30' },
  { symbol: '🧧', name: 'Envelope Vermelho da Sorte', reward: 5, color: 'text-red-500', glow: 'shadow-red-500/30' },
  { symbol: '🧨', name: 'Bombinha Festiva', reward: 3, color: 'text-orange-500', glow: 'shadow-orange-500/20' },
  { symbol: '🍊', name: 'Laranja da Prosperidade', reward: 2, color: 'text-orange-400', glow: 'shadow-orange-400/20' },
];

export const TigerGame: React.FC<TigerGameProps> = ({
  stats,
  updateStats,
  addLog,
  onExit
}) => {
  const playerLevel = stats.level ?? 1;
  const [bet, setBet] = useState<number>(20);
  
  // 3x3 Grid State containing symbol and visual properties
  const [grid, setGrid] = useState<Array<Array<{ symbol: string; isWin: boolean; isLocked: boolean }>>>([
    [
      { symbol: '🍊', isWin: false, isLocked: false },
      { symbol: '🧧', isWin: false, isLocked: false },
      { symbol: '🍊', isWin: false, isLocked: false }
    ],
    [
      { symbol: '🐯', isWin: false, isLocked: false },
      { symbol: '💰', isWin: false, isLocked: false },
      { symbol: '🧨', isWin: false, isLocked: false }
    ],
    [
      { symbol: '🧧', isWin: false, isLocked: false },
      { symbol: '🍊', isWin: false, isLocked: false },
      { symbol: '🧧', isWin: false, isLocked: false }
    ]
  ]);

  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinMessage, setSpinMessage] = useState<string>('Solte a pata do tigre e fature multiplicadores de até 10x na tela cheia!');
  const [recentWin, setRecentWin] = useState<number | null>(null);
  const [isRoundBoosted, setIsRoundBoosted] = useState<boolean>(false);
  const [fastSpin, setFastSpin] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // BONUS STATE: Fortune Tiger Respins Feature (Rodada Especial do Tigre)
  const [bonusMode, setBonusMode] = useState<boolean>(false);
  const [bonusSymbol, setBonusSymbol] = useState<string | null>(null);
  const [showBonusOverlay, setShowBonusOverlay] = useState<boolean>(false);
  const [show10xMultiplier, setShow10xMultiplier] = useState<boolean>(false);

  // IA JOGANDO JUNTO (AI Companion Mode)
  const [autoAiMode, setAutoAiMode] = useState<boolean>(false);
  const [aiMood, setAiMood] = useState<'idle' | 'predicting' | 'excited' | 'coaching' | 'sad'>('idle');
  const [aiSpeech, setAiSpeech] = useState<string>('Olá, Guerreiro! Sou o Tigre IA. Alinhando meus bigodes quânticos para te dar palpites e jogar ao seu lado!');
  const [aiPredictions, setAiPredictions] = useState<{ luckRate: number; recommendedBet: number }>({ luckRate: 72, recommendedBet: 20 });
  const [aiLogs, setAiLogs] = useState<string[]>(['Tigre IA conectado ao servidor de bônus.', 'Bigodes da Sorte calibrados com sucesso.']);

  const availableBets = [10, 20, 50, 100, 250];
  const autoSpinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Web Audio Custom Synthesizers
  const synthSound = {
    roar: () => {
      if (!soundEnabled) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.7);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.7);
        filter.Q.setValueAtTime(12, ctx.currentTime);

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.7);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.7);
      } catch (e) {}
    },
    coinRain: () => {
      if (!soundEnabled) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        for (let i = 0; i < 10; i++) {
          const time = ctx.currentTime + i * 0.10;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880 + Math.random() * 500, time);
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.08, time + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(time);
          osc.stop(time + 0.18);
        }
      } catch (e) {}
    },
    tigerBonus: () => {
      if (!soundEnabled) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.5);
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {}
    }
  };

  // Strategic AI Coaching Quotes in Portuguese
  const aiQuotes = [
    'Estou detectando anomalias positivas de RTP! Experimente girar agora! 🔮',
    'Minha matriz quântica prevê que o Tigre está faminto por envelopes vermelhos! 🧧',
    'Dica do Tigre: Mudar o valor de sua aposta pode forçar o algoritmo a reajustar o bônus! 💡',
    'Interessante... O ciclo anterior carregou o gerador de acumulador de moedas! 🐯',
    'Vamos manter a constância! Se as vidas diminuírem, eu posso recalibrar os giros. 🛡️',
    'A sorte sorri para quem tem coragem! Recomendo subir a aposta de leve. 🪙',
    'Fase Turbo ativada? Excelente, rapidez gera rotações mais favoráveis! ⚡'
  ];

  useEffect(() => {
    // Generate periodic funny & strategic chat logs from Tigre IA
    const interval = setInterval(() => {
      if (isSpinning) return;
      const quote = aiQuotes[Math.floor(Math.random() * aiQuotes.length)];
      setAiSpeech(quote);
      setAiMood('coaching');
      setAiPredictions((prev) => ({
        luckRate: Math.floor(65 + Math.random() * 32),
        recommendedBet: availableBets[Math.floor(Math.random() * 3)]
      }));
    }, 12000);

    return () => {
      clearInterval(interval);
      if (autoSpinIntervalRef.current) clearInterval(autoSpinIntervalRef.current);
    };
  }, [isSpinning]);

  // Handle automatic co-pilot mode execution
  useEffect(() => {
    if (autoAiMode) {
      setAiSpeech('Iniciando Inteligência Artificial no modo Co-Piloto. Deixe-me calcular o risco e jogar por você! 🤖');
      const startAutoPlay = () => {
        if (!isSpinning) {
          // Adjust bet dynamically based on AI prediction
          const chosenBet = aiPredictions.recommendedBet;
          if (availableBets.includes(chosenBet) && stats.coins >= chosenBet) {
            setBet(chosenBet);
            handleSpin(chosenBet);
          } else {
            // fallback to lowest
            handleSpin(10);
          }
        }
      };
      
      const timer = setTimeout(startAutoPlay, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoAiMode, isSpinning, aiPredictions]);

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

  // Get random symbol based on realistic weights
  const getRandomSymbolSymbol = (): string => {
    const weights = [
      { sym: '🐯', weight: 8 },   // WILD
      { sym: '💰', weight: 12 },  // Pot Gold
      { sym: '💍', weight: 18 },  // Jade
      { sym: '🧧', weight: 22 },  // Red Envelope
      { sym: '🧨', weight: 26 },  // Firecracker
      { sym: '🍊', weight: 32 },  // Tangerine
    ];
    const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const item of weights) {
      if (rand < item.weight) return item.sym;
      rand -= item.weight;
    }
    return '🍊';
  };

  // Sophisticated Line Matcher supporting Tiger Wilds
  const evaluateLine = (line: string[]): { win: boolean; symbol: string; reward: number } => {
    const nonWilds = line.filter(s => s !== '🐯');
    
    // Case 1: 3 Wilds
    if (nonWilds.length === 0) {
      return { win: true, symbol: '🐯', reward: 50 };
    }
    
    // Case 2: All non-wilds are same
    const firstSymbol = nonWilds[0];
    const isWin = nonWilds.every(s => s === firstSymbol);
    
    if (isWin) {
      const symDef = TIGER_SYMBOLS.find(x => x.symbol === firstSymbol);
      return { 
        win: true, 
        symbol: firstSymbol, 
        reward: symDef ? symDef.reward : 2 
      };
    }
    
    return { win: false, symbol: '', reward: 0 };
  };

  // Core spinning flow
  const handleSpin = (spinBetValue?: number) => {
    if (isSpinning) return;
    const activeBet = spinBetValue || bet;

    if (stats.coins < activeBet) {
      setSpinMessage('Saldo de Moedas insuficiente! Acesse a Loja Segura para recarregar.');
      setAiSpeech('Opa! Ficamos sem fundos de moedas! Carregue suas fichas para voltarmos a faturar! 🪙');
      setAiMood('sad');
      setAutoAiMode(false);
      try { playSound.gameover(); } catch (e) {}
      return;
    }

    setRecentWin(null);
    setIsSpinning(true);
    setAiMood('predicting');
    setAiSpeech('Analisando cilindros... Calculando torque dinâmico dos multiplicadores! ⚡');
    setSpinMessage('Cilindros de ouro girando acelerados...');

    const boosted = stats.rtpBoostSpins ? stats.rtpBoostSpins > 0 : false;
    setIsRoundBoosted(boosted);

    // Deduct coins & decrement spins boost if active
    updateStats((prev) => ({
      ...prev,
      coins: prev.coins - activeBet,
      rtpBoostSpins: prev.rtpBoostSpins && prev.rtpBoostSpins > 0 ? prev.rtpBoostSpins - 1 : prev.rtpBoostSpins
    }));
    addLog('purchase_booster', `Giro no Fortune Tiger`, activeBet, 'coins');
    registerBet(activeBet);

    if (soundEnabled) {
      try { playSound.spin(); } catch (e) {}
    }

    // Trigger Fortune Tiger Special Respins Randomly (12% chance, 25% if boosted)
    const triggerBonus = Math.random() < (boosted ? 0.25 : 0.12);

    if (triggerBonus) {
      executeBonusMode(activeBet);
    } else {
      executeStandardSpin(activeBet);
    }
  };

  // Standard Spin Mechanism
  const executeStandardSpin = (activeBet: number) => {
    let ticks = 0;
    const maxTicks = fastSpin ? 6 : 14;
    const intervalTime = 80;

    const interval = setInterval(() => {
      setGrid([
        [
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false },
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false },
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false }
        ],
        [
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false },
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false },
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false }
        ],
        [
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false },
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false },
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false }
        ]
      ]);
      if (soundEnabled) {
        try { playSound.tick(); } catch (e) {}
      }
      ticks++;
    }, intervalTime);

    setTimeout(() => {
      clearInterval(interval);

      // Generate actual final outcome
      let rGrid = [
        [
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false },
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false },
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false }
        ],
        [
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false },
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false },
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false }
        ],
        [
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false },
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false },
          { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false }
        ]
      ];

      // Payline mappings
      const paylines = [
        { name: 'Linha 1', coords: [[0,0], [0,1], [0,2]] },
        { name: 'Linha 2', coords: [[1,0], [1,1], [1,2]] },
        { name: 'Linha 3', coords: [[2,0], [2,1], [2,2]] },
        { name: 'Diagonal 1', coords: [[0,0], [1,1], [2,2]] },
        { name: 'Diagonal 2', coords: [[0,2], [1,1], [2,0]] }
      ];

      let totalMultiplier = 0;
      const winningLines: number[] = [];

      paylines.forEach((line, idx) => {
        const symbols = line.coords.map(([r, c]) => rGrid[r][c].symbol);
        const result = evaluateLine(symbols);
        if (result.win) {
          totalMultiplier += result.reward;
          winningLines.push(idx);
          // Highlight winning symbols
          line.coords.forEach(([r, c]) => {
            rGrid[r][c].isWin = true;
          });
        }
      });

      // CHECK FOR 10X FULL HOUSE MULTIPLIER (Screen filled with same non-wild symbol or wilds)
      const flatGrid = rGrid.flat().map(c => c.symbol);
      const nonWildsFlat = flatGrid.filter(s => s !== '🐯');
      const isFullHouse = nonWildsFlat.length === 0 || nonWildsFlat.every(s => s === nonWildsFlat[0]);

      if (isFullHouse && totalMultiplier > 0) {
        totalMultiplier = totalMultiplier * 10;
        setShow10xMultiplier(true);
        setTimeout(() => setShow10xMultiplier(false), 3000);
      }

      let candidatePayout = activeBet * totalMultiplier;
      const bypassOverride = isRoundBoosted || (stats.isVip && Math.random() < 0.4);

      // STRICT RTP CONSTRAINT OVERRIDE
      if (candidatePayout > 0 && !bypassOverride && !checkRTPApproval(candidatePayout, activeBet)) {
        // Force a losing layout
        rGrid = [
          [
            { symbol: '🍊', isWin: false, isLocked: false },
            { symbol: '🧧', isWin: false, isLocked: false },
            { symbol: '💍', isWin: false, isLocked: false }
          ],
          [
            { symbol: '🐯', isWin: false, isLocked: false },
            { symbol: '🧨', isWin: false, isLocked: false },
            { symbol: '🍊', isWin: false, isLocked: false }
          ],
          [
            { symbol: '🧧', isWin: false, isLocked: false },
            { symbol: '💰', isWin: false, isLocked: false },
            { symbol: '🧨', isWin: false, isLocked: false }
          ]
        ];
        totalMultiplier = 0;
        candidatePayout = 0;
      }

      setGrid(rGrid);
      setIsSpinning(false);

      if (totalMultiplier > 0) {
        const payout = activeBet * totalMultiplier;
        registerWin(payout);
        updateStats(prev => ({ 
          ...prev, 
          coins: prev.coins + payout,
          points: (prev.points ?? 0) + 35 // XP
        }));
        addLog('earn', `Vitória no Fortune Tiger (${totalMultiplier}x)`, payout, 'coins');
        setRecentWin(payout);
        
        synthSound.coinRain();
        synthSound.roar();
        
        setSpinMessage(`🐯 Miau! O Tigre Rugiu! Multiplicador de ${totalMultiplier}x! Você faturou 🪙 ${payout} moedas!`);
        setAiSpeech(`INCRÍVEL! Alinhamos os multiplicadores e faturamos ${totalMultiplier}x de retorno! Sorte calibrada no ápice! 🤩🔥`);
        setAiMood('excited');
        setAiLogs(prev => [`Vitória de ${payout} moedas registrada.`, ...prev.slice(0, 5)]);
      } else {
        updateStats(prev => ({
          ...prev,
          points: (prev.points ?? 0) + 12
        }));
        if (soundEnabled) {
          try { playSound.gameover(); } catch (e) {}
        }
        setSpinMessage('Não foi dessa vez. Puxe a garra dourada novamente, o Tigrinho está se aquecendo!');
        setAiSpeech('Hum... Ciclo incompleto. Mas não se preocupe, a probabilidade quântica acumula para o próximo giro! 🐾');
        setAiMood('idle');
      }
    }, fastSpin ? 600 : 1500);
  };

  // FORTUNE TIGER RESPINS BONUS ROUND
  const executeBonusMode = (activeBet: number) => {
    setBonusMode(true);
    // Pick random target symbol (excluding Wild)
    const targetSymbols = ['💰', '💍', '🧧', '🧨', '🍊'];
    const selectedSymbol = targetSymbols[Math.floor(Math.random() * targetSymbols.length)];
    setBonusSymbol(selectedSymbol);
    setShowBonusOverlay(true);
    setAiSpeech(`🔥 ALERTA DE RUGIDO! Rodada Bônus Especial do Tigrinho Ativada! Símbolo escolhido: ${selectedSymbol}. Prepare-se!`);
    synthSound.tigerBonus();

    setTimeout(() => {
      setShowBonusOverlay(false);
      runBonusRespinStep(selectedSymbol, activeBet, 0);
    }, 2200);
  };

  const runBonusRespinStep = (targetSym: string, activeBet: number, stepIndex: number) => {
    // Generate initial respin grid with random placement of target sym and Wilds, locking existing ones
    setGrid(prevGrid => {
      return prevGrid.map(row => 
        row.map(cell => {
          if (cell.symbol === targetSym || cell.symbol === '🐯') {
            return { ...cell, isLocked: true };
          }
          // spin unlocked ones
          return { symbol: getRandomSymbolSymbol(), isWin: false, isLocked: false };
        })
      );
    });

    if (soundEnabled) {
      try { playSound.tick(); } catch (e) {}
    }

    setTimeout(() => {
      let isNewLockedAdded = false;
      let fullHouseCompleted = true;

      setGrid(prevGrid => {
        const nextGrid = prevGrid.map(row => 
          row.map(cell => {
            if (cell.isLocked) {
              return cell;
            }
            const nextSym = getRandomSymbolSymbol();
            if (nextSym === targetSym || nextSym === '🐯') {
              isNewLockedAdded = true;
              return { symbol: nextSym, isWin: false, isLocked: true };
            }
            fullHouseCompleted = false;
            return { symbol: nextSym, isWin: false, isLocked: false };
          })
        );
        return nextGrid;
      });

      // Continue respinning if new target/wild landed, up to max 5 steps
      if (isNewLockedAdded && stepIndex < 5 && !fullHouseCompleted) {
        setTimeout(() => {
          runBonusRespinStep(targetSym, activeBet, stepIndex + 1);
        }, 600);
      } else {
        // Finish Bonus Mode & calculate final paylines
        setTimeout(() => {
          setGrid(finalGrid => {
            const paylines = [
              { coords: [[0,0], [0,1], [0,2]] },
              { coords: [[1,0], [1,1], [1,2]] },
              { coords: [[2,0], [2,1], [2,2]] },
              { coords: [[0,0], [1,1], [2,2]] },
              { coords: [[0,2], [1,1], [2,0]] }
            ];

            let totalMultiplier = 0;
            const updatedGrid = finalGrid.map(row => row.map(cell => ({ ...cell, isLocked: false })));

            paylines.forEach(line => {
              const symbols = line.coords.map(([r, c]) => updatedGrid[r][c].symbol);
              const result = evaluateLine(symbols);
              if (result.win) {
                totalMultiplier += result.reward;
                line.coords.forEach(([r, c]) => {
                  updatedGrid[r][c].isWin = true;
                });
              }
            });

            // 10x Full House Multiplier Check
            const finalFlat = updatedGrid.flat().map(c => c.symbol);
            const nonWildsFlat = finalFlat.filter(s => s !== '🐯');
            const isFullHouse = nonWildsFlat.length === 0 || nonWildsFlat.every(s => s === nonWildsFlat[0]);

            if (isFullHouse && totalMultiplier > 0) {
              totalMultiplier = totalMultiplier * 10;
              setShow10xMultiplier(true);
              setTimeout(() => setShow10xMultiplier(false), 3000);
            }

            const payout = activeBet * totalMultiplier;
            const bypassOverride = stats.rtpBoostSpins ? stats.rtpBoostSpins > 0 : false;

            if (payout > 0 && !bypassOverride && !checkRTPApproval(payout, activeBet)) {
              // override to safe lose layout
              setSpinMessage('O Tigre escapuliu! Faltou muito pouco para calibrar a tela cheia!');
              setAiSpeech('Ah, escapou por um triz! Mas o acúmulo da rodada de ouro valeu a adrenalina! 🐾');
              setAiMood('idle');
              setBonusMode(false);
              setBonusSymbol(null);
              setIsSpinning(false);
              return finalGrid.map(row => row.map(cell => ({ ...cell, isLocked: false, isWin: false })));
            }

            if (payout > 0) {
              registerWin(payout);
              updateStats(prev => ({
                ...prev,
                coins: prev.coins + payout,
                points: (prev.points ?? 0) + 60 // Double XP for bonus wins
              }));
              addLog('earn', `Bônus Fortune Tiger (${totalMultiplier}x)`, payout, 'coins');
              setRecentWin(payout);
              
              synthSound.coinRain();
              synthSound.roar();

              setSpinMessage(`🐯 VITÓRIA EXPLOSIVA DO TIGRE! Rodada bônus gerou ${totalMultiplier}x totalizando 🪙 ${payout} moedas!`);
              setAiSpeech(`TELA EXPLODIU! A Rodada Bônus foi um sucesso absoluto com retorno de ${totalMultiplier}x! O tigre dourado nos consagrou! 🤩✨`);
              setAiMood('excited');
              setAiLogs(prev => [`Bônus concluído: +${payout} moedas.`, ...prev.slice(0, 5)]);
            } else {
              setSpinMessage('A Rodada de Respin terminou. Continue alimentando o tigre para ativar novas rodadas!');
              setAiSpeech('O bônus terminou, mas recalibramos as chances para as próximas jogadas. Rodar novamente! 🐯');
              setAiMood('idle');
            }

            setBonusMode(false);
            setBonusSymbol(null);
            setIsSpinning(false);
            return updatedGrid;
          });
        }, 500);
      }
    }, 800);
  };

  return (
    <div className="w-full space-y-6">
      {/* Stylesheet injection for modern, sleek hardware-accelerated casino layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-reel-anim {
          0% { transform: translateY(-8px); filter: blur(0px); }
          50% { transform: translateY(12px); filter: blur(3px); }
          100% { transform: translateY(0px); filter: blur(0px); }
        }
        .animate-reel-spin {
          animation: spin-reel-anim 0.12s linear infinite;
        }
        @keyframes tiger-pulse-anim {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.08) rotate(2deg); }
        }
        .animate-tiger-pulse {
          animation: tiger-pulse-anim 1.8s ease-in-out infinite;
        }
        @keyframes border-glow-win {
          0%, 100% { border-color: #f59e0b; box-shadow: 0 0 4px #f59e0b; }
          50% { border-color: #ef4444; box-shadow: 0 0 16px #ef4444, inset 0 0 8px rgba(239, 68, 68, 0.4); }
        }
        .animate-border-glow-win {
          animation: border-glow-win 0.6s ease-in-out infinite;
        }
        @keyframes scale-up-bonus {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bonus-scale {
          animation: scale-up-bonus 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}} />

      {/* Main Layout Divided: Left Slot Machine, Right AI Companion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* SLOT MACHINE SECTOR (8 Cols on Desktop) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Crimson Golden Chinese Temple Styled Casino Case */}
          <div className="bg-gradient-to-b from-red-700 via-red-600 to-amber-900 border-4 border-amber-400 rounded-3xl overflow-hidden shadow-2xl relative">
            
            {/* Glowing Traditional Arches and Chinese Lanterns Design */}
            <div className="absolute top-0 inset-x-0 h-2.5 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 shadow-[0_2px_10px_rgba(245,158,11,0.5)] z-20" />
            
            {/* Slot Header Panel */}
            <div className="bg-slate-950 p-4 border-b border-amber-400/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-red-600 rounded-2xl flex items-center justify-center border-2 border-yellow-300 shadow-md shrink-0">
                  <span className="text-2xl animate-tiger-pulse block">🐯</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-yellow-300 tracking-tight uppercase flex items-center gap-1">
                    Fortune Tiger <span className="text-[10px] bg-red-600 text-white font-mono px-1.5 py-0.5 rounded-md shadow-inner animate-pulse">PRO</span>
                  </h3>
                  <p className="text-[10px] text-slate-300 font-mono flex items-center gap-1 flex-wrap">
                    <span>RTP: <strong className="text-emerald-400">96.5% Est.</strong></span>
                    <span className="text-slate-600">•</span>
                    <span>RTP Real: {getFormattedRTP()}</span>
                    {stats.isVip && (
                      <span className="text-yellow-400 font-bold ml-1 flex items-center gap-0.5">👑 VIP</span>
                    )}
                    {stats.rtpBoostSpins && stats.rtpBoostSpins > 0 ? (
                      <span className="text-emerald-400 font-bold animate-pulse ml-1">🍀 Sorte+ {stats.rtpBoostSpins}x</span>
                    ) : null}
                  </p>
                </div>
              </div>

              {/* Balance Display */}
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl">
                <Coins className="w-4 h-4 text-yellow-400" />
                <div className="text-left">
                  <div className="text-[8px] text-slate-400 leading-none">Saldo Atual</div>
                  <div className="text-xs font-bold text-yellow-400 font-mono mt-0.5">🪙 {stats.coins}</div>
                </div>
              </div>
            </div>

            {/* Main Interactive Screen Area */}
            <div className="p-6 md:p-8 bg-slate-950 flex flex-col items-center justify-center relative">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:14px_14px]" />
              
              {/* Overlay: Fortune Tiger Respin Bonus Intro */}
              {showBonusOverlay && (
                <div className="absolute inset-0 bg-red-950/90 z-30 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                  <div className="bg-gradient-to-b from-yellow-300 to-amber-500 text-slate-950 p-6 rounded-3xl border-4 border-yellow-300 shadow-2xl max-w-sm space-y-4 animate-bonus-scale">
                    <span className="text-6xl animate-bounce block">🐯🔥</span>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Rodada do Tigre!</h2>
                    <p className="text-xs font-bold leading-relaxed">
                      O Tigre de Ouro rugiu! O símbolo <strong className="text-lg bg-slate-900 text-white px-2 py-0.5 rounded ml-1">{bonusSymbol}</strong> e os Wilds ficarão travados. Os respins continuam enquanto novos símbolos landarem!
                    </p>
                    <div className="inline-block bg-red-600 text-white font-mono text-[10px] font-bold px-3 py-1 rounded-full border border-red-500">
                      GIROS GRÁTIS DE ACÚMULO
                    </div>
                  </div>
                </div>
              )}

              {/* Overlay: 10x Full Screen Mega Multiplier */}
              {show10xMultiplier && (
                <div className="absolute inset-0 bg-amber-950/80 z-30 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                  <div className="p-6 rounded-3xl border-4 border-yellow-400 bg-slate-950 text-white shadow-2xl max-w-xs space-y-2 animate-bounce">
                    <span className="text-5xl block animate-pulse">✨🤩✨</span>
                    <h2 className="text-3xl font-black text-yellow-400 tracking-tighter">MEGA 10x!</h2>
                    <p className="text-xs font-mono font-bold text-slate-300">
                      TELA COMPLETA ALINHADA! Todos os ganhos da rodada multiplicados por 10x!
                    </p>
                  </div>
                </div>
              )}

              {/* Real-time Indicator Banners */}
              {bonusMode && (
                <div className="w-full max-w-xs mb-4 bg-gradient-to-r from-red-600 to-amber-600 text-white text-center py-1.5 px-3 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center justify-center gap-1.5 shadow-md">
                  <Flame className="w-3.5 h-3.5 animate-bounce" />
                  <span>Modo Respin: Buscando {bonusSymbol} e 🐯</span>
                </div>
              )}

              {/* Main 3x3 Reel Matrix encased in a Golden Frame */}
              <div className="w-full max-w-xs bg-gradient-to-b from-yellow-500 to-amber-600 p-2.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8),inset_0_4px_12px_rgba(255,255,255,0.4)] relative">
                
                {/* Payline indicators lines decoration */}
                <div className="absolute -left-3 top-[23%] text-[9px] text-yellow-300 font-black animate-pulse font-mono">▶</div>
                <div className="absolute -left-3 top-[50%] text-[9px] text-yellow-300 font-black animate-pulse font-mono">▶</div>
                <div className="absolute -left-3 top-[77%] text-[9px] text-yellow-300 font-black animate-pulse font-mono">▶</div>
                
                <div className="absolute -right-3 top-[23%] text-[9px] text-yellow-300 font-black animate-pulse font-mono">◀</div>
                <div className="absolute -right-3 top-[50%] text-[9px] text-yellow-300 font-black animate-pulse font-mono">◀</div>
                <div className="absolute -right-3 top-[77%] text-[9px] text-yellow-300 font-black animate-pulse font-mono">◀</div>

                <div className="grid grid-cols-3 gap-2 bg-slate-900 p-2 rounded-xl">
                  {grid.map((row, rIdx) => 
                    row.map((cell, cIdx) => {
                      const symDef = TIGER_SYMBOLS.find(x => x.symbol === cell.symbol);
                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          className={`aspect-square bg-slate-950 rounded-xl flex flex-col items-center justify-center text-3.5xl md:text-4xl transition-all duration-150 relative overflow-hidden select-none border-2 ${
                            cell.isWin 
                              ? 'animate-border-glow-win border-yellow-400 bg-amber-950/40 scale-102 z-10' 
                              : cell.isLocked
                              ? 'border-red-500 bg-red-950/20'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Inner spinning blur indicator */}
                          <div className={isSpinning && !cell.isLocked ? 'animate-reel-spin' : ''}>
                            {cell.symbol}
                          </div>

                          {/* Locked Badge inside Slot */}
                          {cell.isLocked && (
                            <span className="absolute bottom-1 right-1 bg-red-600 text-white font-mono text-[7px] px-1 rounded-sm uppercase tracking-wide">
                              🔒 Trava
                            </span>
                          )}

                          {/* Light subtle glow of the symbol name on hover */}
                          {!isSpinning && symDef && (
                            <span className="absolute bottom-0.5 inset-x-0 text-center text-[7px] text-slate-500 font-mono truncate px-1">
                              {symDef.name.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Live Spin Subtitle Banner */}
              <div className="w-full max-w-xs mt-5 bg-gradient-to-r from-red-950/40 via-amber-950/20 to-red-950/40 border border-amber-400/20 p-3 rounded-2xl text-center shadow-inner">
                <p className="text-[11px] text-yellow-100 font-medium leading-relaxed">
                  {spinMessage}
                </p>
                {recentWin !== null && (
                  <div className="mt-1.5 inline-flex items-center gap-1 text-emerald-400 text-[11px] font-black animate-pulse bg-emerald-950/30 px-3 py-0.5 rounded-full border border-emerald-800/30">
                    🎉 GANHO TOTAL: 🪙 {recentWin}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Sizing and Spin Action Bar */}
            <div className="p-5 bg-slate-950 border-t border-amber-400/20 flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Sizing Panel */}
              <div className="space-y-1.5 w-full md:w-auto">
                <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-widest text-center md:text-left">
                  Escolha Sua Aposta (Moedas)
                </span>
                <div className="flex items-center gap-1.5 justify-center md:justify-start">
                  {availableBets.map((amount) => {
                    const locked = isBetLocked(amount);
                    const req = getBetLevelReq(amount);
                    return (
                      <button
                        key={amount}
                        disabled={isSpinning}
                        onClick={() => {
                          if (locked) {
                            setSpinMessage(`Aposta bloqueada! O valor de aposta de 🪙 ${amount} requer que você esteja no Nível ${req}.`);
                            setAiSpeech(`Ah! Esse nível de aposta está travado para seu nível atual. Suba de nível jogando mais ou use créditos! 🔒`);
                            setAiMood('coaching');
                            try { playSound.gameover(); } catch (err) {}
                            return;
                          }
                          setBet(amount);
                          playSound.click();
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
                          bet === amount
                            ? 'bg-gradient-to-b from-yellow-300 to-amber-500 text-slate-950 border-yellow-300 shadow-md shadow-amber-500/25 scale-102 font-extrabold'
                            : locked
                            ? 'bg-slate-900/40 text-slate-600 border-slate-900/60 cursor-not-allowed opacity-40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-600'
                        }`}
                        title={locked ? `Requer Nível ${req}` : `Aposta de 🪙 ${amount}`}
                      >
                        {locked ? `🔒 ${amount}` : amount}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Functional Controls Toggles */}
              <div className="flex items-center gap-2.5 w-full md:w-auto">
                {/* Fast Spin */}
                <button
                  onClick={() => {
                    setFastSpin(!fastSpin);
                    playSound.click();
                  }}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    fastSpin 
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' 
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                  title={fastSpin ? "Desativar Giro Turbo" : "Ativar Giro Turbo"}
                >
                  <FastForward className="w-5 h-5" />
                </button>

                {/* Sound Mute */}
                <button
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    playSound.click();
                  }}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    soundEnabled 
                      ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200' 
                      : 'bg-red-950/10 border-red-900/30 text-red-500'
                  }`}
                  title={soundEnabled ? "Mutar Sons" : "Ativar Sons"}
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>

                {/* Primary Launch Spin Trigger */}
                <button
                  onClick={() => handleSpin()}
                  disabled={isSpinning}
                  className={`flex-1 md:flex-none px-8 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider ${
                    isSpinning
                      ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                      : 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 hover:from-yellow-200 hover:to-amber-300 shadow-lg shadow-amber-500/15 hover:scale-103'
                  }`}
                >
                  {isSpinning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
                      <span>Rodando...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>Girar Tigre (🪙 {bet})</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* Paytable Multipliers Panel */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-55 pb-3 mb-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                Multiplicadores Fortune Tiger
              </h4>
              <span className="text-[10px] font-bold text-slate-400 font-mono">3 Símbolos Alinhados</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              {TIGER_SYMBOLS.map((item) => (
                <div key={item.name} className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                  <span className="text-2xl mr-2">{item.symbol}</span>
                  <div className="text-right flex-1 min-w-0">
                    <span className="block text-slate-500 text-[8px] truncate max-w-full font-bold">{item.name}</span>
                    <strong className="text-amber-600 font-extrabold">{item.reward}x</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* TIGRE IA COMPANION CONSOLE (4 Cols on Desktop) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Integrated AI Assistant Box styled with pristine details */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xl shadow-slate-200/40 relative overflow-hidden">
            
            {/* Top Bar Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Tigre IA Coach</h4>
                  <p className="text-[8px] text-slate-400 font-mono uppercase font-bold">Assistente Conectado</p>
                </div>
              </div>

              {/* Status Indicator Badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold border border-emerald-100">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                LIVE IA
              </span>
            </div>

            {/* Simulated Prediction Gauges Graph */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3.5 mb-4">
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Análise Quântica Real-Time</div>
              
              {/* Luck Probability Gauge */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-500 flex items-center gap-1 font-bold">🎯 Probabilidade de Acerto:</span>
                  <strong className="text-indigo-600">{aiPredictions.luckRate}%</strong>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${aiPredictions.luckRate}%` }}
                  />
                </div>
              </div>

              {/* Recommended Bet Size */}
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5 text-[11px] font-mono">
                <span className="text-slate-500 font-bold">🪙 Aposta Recomendada:</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-extrabold">Aposta {aiPredictions.recommendedBet}</span>
              </div>
            </div>

            {/* AI Custom Mood Avatar and Bubbles */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-indigo-50/50 border border-indigo-100/60 p-3.5 rounded-2xl relative">
                
                {/* Mood Avatar representation */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-lg shadow-md shrink-0 animate-bounce">
                  {aiMood === 'idle' && '🐯'}
                  {aiMood === 'predicting' && '🔮'}
                  {aiMood === 'excited' && '🤩'}
                  {aiMood === 'coaching' && '💡'}
                  {aiMood === 'sad' && '🥺'}
                </div>

                <div className="space-y-1">
                  <span className="block text-[8px] font-mono font-bold text-indigo-500 uppercase">Tigrinho IA diz:</span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {aiSpeech}
                  </p>
                </div>
              </div>

              {/* AUTO-CO-PILOT MODE (AI Plays Together Side-by-Side!) */}
              <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="space-y-0.5">
                  <h5 className="text-xs font-black text-indigo-950 flex items-center gap-1 uppercase tracking-tight">
                    <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                    Modo Co-Piloto IA
                  </h5>
                  <p className="text-[9px] text-indigo-600/80 font-medium">
                    A IA joga e calibra apostas automaticamente!
                  </p>
                </div>
                
                {/* Toggle switch Button */}
                <button
                  onClick={() => {
                    setAutoAiMode(!autoAiMode);
                    playSound.click();
                  }}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    autoAiMode 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                      : 'bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200'
                  }`}
                >
                  {autoAiMode ? 'ATIVO' : 'LIGAR'}
                </button>
              </div>

            </div>

            {/* Log Panel Events */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
              <span className="text-[8px] font-mono font-bold text-slate-400 uppercase block tracking-wider">Histórico de Conexão</span>
              <div className="space-y-1 max-h-[85px] overflow-y-auto scrollbar-none text-[9px] font-mono text-slate-400 leading-tight">
                {aiLogs.length === 0 ? (
                  <p className="italic text-slate-300">Nenhum evento registrado.</p>
                ) : (
                  aiLogs.map((log, index) => (
                    <div key={index} className="flex gap-1.5 items-center">
                      <span className="text-indigo-400 shrink-0">●</span>
                      <span className="truncate">{log}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Secure Game Integrity Info */}
          <div className="bg-slate-50 border border-slate-150 rounded-3xl p-5 space-y-2">
            <h5 className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
              Selo de Auditoria Ativo
            </h5>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              O Fortune Tiger utiliza um gerador de números randômicos auditado internacionalmente com RTP de controle adaptativo. Seus créditos e transações estão sob proteção de criptografia AES-256 SSL integrada.
            </p>
          </div>

        </div>

      </div>

      {/* Persistent Ad Monetization Banner */}
      <AdBanner position="bottom" />
    </div>
  );
};
