import React, { useState, useEffect } from 'react';
import { PlayerStats, TransactionLog } from '../types';
import { playSound } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Swords, Heart, Coins, Play, RefreshCw, CheckCircle2, 
  CreditCard, QrCode, Sparkles, TrendingUp, AlertTriangle, ShieldCheck, HelpCircle, 
  ChevronRight, Calendar, Users, Zap, Check, Flame, Tv, Activity, PlusCircle, RotateCcw, BadgePercent, Award
} from 'lucide-react';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  league: 'Copa do Mundo' | 'Copa do Brasil' | 'Champions Arena' | 'Amistoso de Elite';
  status: 'AO VIVO' | 'ENCERRADO' | 'AGUARDANDO';
  possession: [number, number];
  shots: [number, number];
  corners: [number, number];
  isCustom?: boolean;
}

interface Bet {
  id: string;
  matchId: string;
  homePredict: number;
  awayPredict: number;
  wager: number;
  paymentMethod: 'pix' | 'card';
  timestamp: string;
  status: 'PENDENTE' | 'VENCEU_EXATO' | 'VENCEU_VENCEDOR' | 'PERDEU';
  claimed: boolean;
  teamsLabel: string;
  isCustom?: boolean;
  rewardClaimedDesc?: string;
  isMulti?: boolean;
  predictions?: {
    matchId: string;
    teamsLabel: string;
    homePredict: number;
    awayPredict: number;
    status?: 'PENDENTE' | 'VENCEU_EXATO' | 'VENCEU_VENCEDOR' | 'PERDEU';
  }[];
}

interface FootballBetsProps {
  stats: PlayerStats;
  updateStats: (updater: (prev: PlayerStats) => PlayerStats) => void;
  addLog: (
    type: 'earn' | 'purchase_coins' | 'purchase_booster' | 'purchase_cosmetic' | 'stage_skip',
    desc: string,
    amount: number,
    currency: 'coins' | 'real'
  ) => void;
  realBalance: number;
  setRealBalance: React.Dispatch<React.SetStateAction<number>>;
  withdrawLimit: number;
  setWithdrawLimit: React.Dispatch<React.SetStateAction<number>>;
}

const INITIAL_MATCHES: Match[] = [
  {
    id: 'match-1',
    homeTeam: 'Brasil',
    awayTeam: 'Argentina',
    homeFlag: '🇧🇷',
    awayFlag: '🇦🇷',
    homeScore: 1,
    awayScore: 0,
    minute: 34,
    league: 'Copa do Mundo',
    status: 'AO VIVO',
    possession: [55, 45],
    shots: [6, 4],
    corners: [3, 2]
  },
  {
    id: 'match-2',
    homeTeam: 'Flamengo',
    awayTeam: 'Palmeiras',
    homeFlag: '🔴',
    awayFlag: '🟢',
    homeScore: 0,
    awayScore: 1,
    minute: 68,
    league: 'Copa do Brasil',
    status: 'AO VIVO',
    possession: [58, 42],
    shots: [8, 5],
    corners: [4, 1]
  },
  {
    id: 'match-3',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeFlag: '🇪🇸',
    awayFlag: '🔵',
    homeScore: 2,
    awayScore: 2,
    minute: 82,
    league: 'Champions Arena',
    status: 'AO VIVO',
    possession: [50, 50],
    shots: [12, 11],
    corners: [6, 5]
  },
  {
    id: 'match-4',
    homeTeam: 'São Paulo',
    awayTeam: 'Corinthians',
    homeFlag: '⚪',
    awayFlag: '⚫',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    league: 'Copa do Brasil',
    status: 'AGUARDANDO',
    possession: [50, 50],
    shots: [0, 0],
    corners: [0, 0]
  }
];

const PRESET_EMOJIS = ['🇧🇷', '🇦🇷', '🇪🇸', '🇫🇷', '🇮🇹', '🇩🇪', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇯🇵', '🇺🇸', '🇲🇽', '🟢', '🔴', '⚪', '⚫', '🔵', '🟡', '🏆', '⚽'];

export const FootballBets: React.FC<FootballBetsProps> = ({
  stats,
  updateStats,
  addLog,
  realBalance,
  setRealBalance,
  withdrawLimit,
  setWithdrawLimit
}) => {
  // Navigation tabs: 'live_matches' | 'create_custom' | 'history'
  const [activeTab, setActiveTab] = useState<'live_matches' | 'create_custom' | 'history'>('live_matches');

  // Real-time matches state
  const [matches, setMatches] = useState<Match[]>(() => {
    const cached = localStorage.getItem('gamezone_football_matches');
    return cached ? JSON.parse(cached) : INITIAL_MATCHES;
  });

  const [bets, setBets] = useState<Bet[]>(() => {
    const cached = localStorage.getItem('gamezone_football_bets');
    return cached ? JSON.parse(cached) : [];
  });

  // Goal celebration banner notification
  const [goalAlert, setGoalAlert] = useState<{ team: string; matchId: string } | null>(null);

  // Quick Betting form on live matches
  const [selectedMatchId, setSelectedMatchId] = useState<string>('match-1');
  const [homePredict, setHomePredict] = useState<number>(2);
  const [awayPredict, setAwayPredict] = useState<number>(1);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');

  // Upgraded Multi-bet systems
  const [betMode, setBetMode] = useState<'simples' | 'multipla'>('simples');
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>(['match-1']);
  const [predictionsMap, setPredictionsMap] = useState<Record<string, { home: number; away: number }>>({
    'match-1': { home: 2, away: 1 },
    'match-2': { home: 1, away: 0 },
    'match-3': { home: 2, away: 2 },
    'match-4': { home: 0, away: 0 }
  });

  // Checkout Payment Modal Simulation
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'paying' | 'success'>('idle');
  const [checkoutCallback, setCheckoutCallback] = useState<(() => void) | null>(null);

  // Credit Card Form states
  const [cardName, setCardName] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');

  // CUSTOM MATCH CREATOR FORM STATES
  const [customHome, setCustomHome] = useState<string>('Brasil');
  const [customHomeFlag, setCustomHomeFlag] = useState<string>('🇧🇷');
  const [customAway, setCustomAway] = useState<string>('França');
  const [customAwayFlag, setCustomAwayFlag] = useState<string>('🇫🇷');
  const [customHomePredict, setCustomHomePredict] = useState<number>(3);
  const [customAwayPredict, setCustomAwayPredict] = useState<number>(1);
  const [customWager, setCustomWager] = useState<number>(15);
  const [customPayMethod, setCustomPayMethod] = useState<'pix' | 'card'>('pix');

  // LIVE CUSTOM MATCH SIMULATOR STATE
  const [simulatedCustomMatch, setSimulatedCustomMatch] = useState<{
    homeTeam: string;
    homeFlag: string;
    awayTeam: string;
    awayFlag: string;
    homeScore: number;
    awayScore: number;
    minute: number;
    commentaries: string[];
    status: 'IDLE' | 'PLAYING' | 'WON' | 'LOST';
    homePredict: number;
    awayPredict: number;
    wager: number;
  } | null>(null);

  // Save states to local storage
  useEffect(() => {
    localStorage.setItem('gamezone_football_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('gamezone_football_bets', JSON.stringify(bets));
  }, [bets]);

  // Global automatic simulator ticker for pre-placed live games
  useEffect(() => {
    const interval = setInterval(() => {
      setMatches((prevMatches) => {
        let changed = false;
        const updated = prevMatches.map((match) => {
          if (match.status !== 'AO VIVO') return match;

          changed = true;
          const nextMinute = match.minute + 2;
          const isGameOver = nextMinute >= 90;

          // Check for random goal (e.g. 2% chance per tick)
          const homeGoal = Math.random() < 0.022;
          const awayGoal = Math.random() < 0.018;
          let nextHomeScore = match.homeScore;
          let nextAwayScore = match.awayScore;

          if (homeGoal && !isGameOver) {
            nextHomeScore += 1;
            triggerGoalCelebration(match.homeTeam, match.id);
          } else if (awayGoal && !isGameOver) {
            nextAwayScore += 1;
            triggerGoalCelebration(match.awayTeam, match.id);
          }

          const randomShots = [
            match.shots[0] + (Math.random() < 0.2 ? 1 : 0),
            match.shots[1] + (Math.random() < 0.18 ? 1 : 0),
          ] as [number, number];

          const randomCorners = [
            match.corners[0] + (Math.random() < 0.1 ? 1 : 0),
            match.corners[1] + (Math.random() < 0.08 ? 1 : 0),
          ] as [number, number];

          return {
            ...match,
            minute: isGameOver ? 90 : nextMinute,
            status: isGameOver ? 'ENCERRADO' : 'AO VIVO',
            homeScore: nextHomeScore,
            awayScore: nextAwayScore,
            shots: randomShots,
            corners: randomCorners,
            possession: [
              Math.min(75, Math.max(25, match.possession[0] + Math.floor(Math.random() * 5) - 2)),
              0
            ].map((v, i, arr) => (i === 0 ? v : 100 - arr[0])) as [number, number]
          };
        });

        if (changed) {
          setTimeout(() => evaluateLiveBets(), 100);
        }

        return updated;
      });
    }, 15000); // Ticks every 15 seconds to keep it dynamic

    return () => clearInterval(interval);
  }, [matches]);

  const triggerGoalCelebration = (teamName: string, matchId: string) => {
    try {
      playSound.collect();
    } catch (e) {}
    setGoalAlert({ team: teamName, matchId });
    setTimeout(() => {
      setGoalAlert(null);
    }, 4500);
  };

  // Evaluate pre-placed live bets automatically when match is ENCERRADO
  const evaluateLiveBets = () => {
    setBets((prevBets) => {
      let isUpdated = false;
      const updated = prevBets.map((bet) => {
        if (bet.status !== 'PENDENTE') return bet;

        // Multi-bet evaluation
        if (bet.isMulti && bet.predictions) {
          const allFinished = bet.predictions.every((pred) => {
            const m = matches.find((x) => x.id === pred.matchId);
            return m && m.status === 'ENCERRADO';
          });

          if (!allFinished) return bet;

          isUpdated = true;
          let hasLoss = false;
          let allExact = true;

          const updatedPredictions = bet.predictions.map((pred) => {
            const m = matches.find((x) => x.id === pred.matchId);
            if (!m) {
              hasLoss = true;
              allExact = false;
              return { ...pred, status: 'PERDEU' as const };
            }

            const realH = m.homeScore;
            const realA = m.awayScore;
            const guessedExact = pred.homePredict === realH && pred.awayPredict === realA;
            const realWinner = realH > realA ? 'home' : (realH < realA ? 'away' : 'draw');
            const guessWinner = pred.homePredict > pred.awayPredict ? 'home' : (pred.homePredict < pred.awayPredict ? 'away' : 'draw');
            const guessedWinner = realWinner === guessWinner;

            let predStatus: 'VENCEU_EXATO' | 'VENCEU_VENCEDOR' | 'PERDEU' = 'PERDEU';
            if (guessedExact) {
              predStatus = 'VENCEU_EXATO';
            } else if (guessedWinner) {
              predStatus = 'VENCEU_VENCEDOR';
              allExact = false;
            } else {
              hasLoss = true;
              allExact = false;
            }

            return { ...pred, status: predStatus };
          });

          let finalStatus: 'VENCEU_EXATO' | 'VENCEU_VENCEDOR' | 'PERDEU' = 'PERDEU';
          if (!hasLoss) {
            finalStatus = allExact ? 'VENCEU_EXATO' : 'VENCEU_VENCEDOR';
          }

          return {
            ...bet,
            predictions: updatedPredictions,
            status: finalStatus
          };
        }

        // Standard single bet evaluation
        const match = matches.find((m) => m.id === bet.matchId);
        if (!match || match.status !== 'ENCERRADO') return bet;

        isUpdated = true;
        const realHome = match.homeScore;
        const realAway = match.awayScore;

        const guessedExact = (bet.homePredict === realHome && bet.awayPredict === realAway);
        const realWinner = realHome > realAway ? 'home' : (realHome < realAway ? 'away' : 'draw');
        const guessWinner = bet.homePredict > bet.awayPredict ? 'home' : (bet.homePredict < bet.awayPredict ? 'away' : 'draw');
        const guessedWinner = (realWinner === guessWinner);

        let finalStatus: 'VENCEU_EXATO' | 'VENCEU_VENCEDOR' | 'PERDEU' = 'PERDEU';
        if (guessedExact) {
          finalStatus = 'VENCEU_EXATO';
        } else if (guessedWinner) {
          finalStatus = 'VENCEU_VENCEDOR';
        }

        return {
          ...bet,
          status: finalStatus
        };
      });

      return updated;
    });
  };

  // Reset live pool
  const handleResetMatches = () => {
    playSound.click();
    setMatches(INITIAL_MATCHES);
    triggerGoalCelebration('Servidor IA', 'all');
  };

  // Skip match immediately to 90' and resolve the bet
  const handleFastForwardMatch = (matchId: string) => {
    playSound.click();
    setMatches((prev) =>
      prev.map((match) => {
        if (match.id !== matchId) return match;
        return {
          ...match,
          minute: 90,
          status: 'ENCERRADO',
          shots: [match.shots[0] + 4, match.shots[1] + 3],
          corners: [match.corners[0] + 2, match.corners[1] + 2]
        };
      })
    );

    setTimeout(() => {
      setBets((prevBets) => {
        const match = matches.find((m) => m.id === matchId);
        if (!match) return prevBets;

        const finalHome = match.homeScore + (Math.random() < 0.3 ? 1 : 0);
        const finalAway = match.awayScore + (Math.random() < 0.3 ? 1 : 0);

        return prevBets.map((bet) => {
          if (bet.matchId !== matchId || bet.status !== 'PENDENTE') return bet;

          const guessedExact = (bet.homePredict === finalHome && bet.awayPredict === finalAway);
          const realWinner = finalHome > finalAway ? 'home' : (finalHome < finalAway ? 'away' : 'draw');
          const guessWinner = bet.homePredict > bet.awayPredict ? 'home' : (bet.homePredict < bet.awayPredict ? 'away' : 'draw');
          const guessedWinner = (realWinner === guessWinner);

          let finalStatus: 'VENCEU_EXATO' | 'VENCEU_VENCEDOR' | 'PERDEU' = 'PERDEU';
          if (guessedExact) {
            finalStatus = 'VENCEU_EXATO';
          } else if (guessedWinner) {
            finalStatus = 'VENCEU_VENCEDOR';
          }

          return {
            ...bet,
            status: finalStatus
          };
        });
      });

      setMatches((prev) =>
        prev.map((match) => {
          if (match.id !== matchId) return match;
          return {
            ...match,
            homeScore: match.homeScore + (Math.random() < 0.3 ? 1 : 0),
            awayScore: match.awayScore + (Math.random() < 0.3 ? 1 : 0),
            minute: 90,
            status: 'ENCERRADO'
          };
        })
      );
    }, 200);
  };

  const handleStartWaitingMatch = (matchId: string) => {
    playSound.click();
    setMatches((prev) =>
      prev.map((match) => {
        if (match.id !== matchId) return match;
        return { ...match, status: 'AO VIVO', minute: 1 };
      })
    );
  };

  // Submit quick bet for active matches
  const handleQuickBetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (betAmount < 1) {
      playSound.gameover();
      alert('O valor mínimo de palpite é de R$ 1,00.');
      return;
    }
    playSound.click();

    const isMulti = betMode === 'multipla' && selectedMatchIds.length > 1;
    const finalPrice = isMulti ? parseFloat((betAmount * 1.2).toFixed(2)) : betAmount;
    
    // Set checkout action
    setCheckoutCallback(() => () => {
      if (isMulti) {
        // Prepare multiple predictions
        const predictions = selectedMatchIds.map((mId) => {
          const m = matches.find((x) => x.id === mId);
          const pred = predictionsMap[mId] || { home: 2, away: 1 };
          return {
            matchId: mId,
            teamsLabel: m ? `${m.homeFlag} ${m.homeTeam} vs ${m.awayTeam} ${m.awayFlag}` : 'Jogo Desconhecido',
            homePredict: pred.home,
            awayPredict: pred.away,
            status: 'PENDENTE' as const
          };
        });

        const betId = `BET-${Math.floor(100000 + Math.random() * 900000)}`;
        const newBet: Bet = {
          id: betId,
          matchId: 'multi',
          homePredict: 0,
          awayPredict: 0,
          wager: finalPrice,
          paymentMethod,
          timestamp: new Date().toLocaleString('pt-BR'),
          status: 'PENDENTE',
          claimed: false,
          teamsLabel: `Múltipla (${selectedMatchIds.length} Jogos) 📈`,
          isMulti: true,
          predictions
        };

        setBets((prev) => [newBet, ...prev]);
        addLog('purchase_booster', `Aposta Múltipla Registrada: Combo com ${selectedMatchIds.length} palpites`, finalPrice, 'real');
        setWithdrawLimit((prev) => prev + finalPrice);
      } else {
        // Single prediction
        const mId = selectedMatchIds[0] || selectedMatchId;
        const match = matches.find((m) => m.id === mId);
        if (!match) return;

        const pred = predictionsMap[mId] || { home: homePredict, away: awayPredict };
        const betId = `BET-${Math.floor(100000 + Math.random() * 900000)}`;
        const newBet: Bet = {
          id: betId,
          matchId: mId,
          homePredict: pred.home,
          awayPredict: pred.away,
          wager: finalPrice,
          paymentMethod,
          timestamp: new Date().toLocaleString('pt-BR'),
          status: 'PENDENTE',
          claimed: false,
          teamsLabel: `${match.homeFlag} ${match.homeTeam} vs ${match.awayTeam} ${match.awayFlag}`
        };

        setBets((prev) => [newBet, ...prev]);
        addLog('purchase_booster', `Palpite Registrado: ${match.homeTeam} ${pred.home}x${pred.away} ${match.awayTeam}`, finalPrice, 'real');
        setWithdrawLimit((prev) => prev + finalPrice);
      }
    });

    setShowPayModal(true);
    setPaymentStep('idle');
  };

  // CUSTOM MATCH INTEGRATION - IA STADIUM SIMULATION FLOW
  const handleCreateCustomMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customHome.trim() || !customAway.trim()) {
      alert('Por favor, informe os nomes de ambos os times.');
      return;
    }
    if (customWager < 1) {
      alert('O valor mínimo de aposta é R$ 1,00.');
      return;
    }
    playSound.click();

    // Set checkout action to launch the custom IA simulation
    setCheckoutCallback(() => () => {
      startCustomIaMatchSimulation();
    });

    setShowPayModal(true);
    setPaymentStep('idle');
  };

  const startCustomIaMatchSimulation = () => {
    playSound.click();
    // Initialize custom simulated match
    setSimulatedCustomMatch({
      homeTeam: customHome,
      homeFlag: customHomeFlag,
      awayTeam: customAway,
      awayFlag: customAwayFlag,
      homeScore: 0,
      awayScore: 0,
      minute: 0,
      commentaries: ['🏟️ Bem-vindo à Arena Virtual! O juiz de IA está pronto para o apito inicial!'],
      status: 'PLAYING',
      homePredict: customHomePredict,
      awayPredict: customAwayPredict,
      wager: customWager
    });

    // We will run a step-by-step game clock simulator
    let curMinute = 0;
    let curHomeScore = 0;
    let curAwayScore = 0;
    const teamHome = customHome;
    const teamAway = customAway;

    // Determine the simulated final score (predetermined by IA probabilities but hidden from user until 90')
    // We make it dynamic. A random score is generated:
    const finalHome = Math.floor(Math.random() * 4); // 0 to 3
    const finalAway = Math.floor(Math.random() * 4); // 0 to 3

    const commentaryTemplates = [
      (min: number) => `⏱️ ${min}': Bola rolando! O meio-campo do ${teamHome} troca passes com muita inteligência.`,
      (min: number) => `⏱️ ${min}': Pressão alta! O ${teamAway} tenta roubar a bola na zona de perigo.`,
      (min: number) => `⏱️ ${min}': Chute venenoso de fora da área! O goleiro voa para mandar para escanteio!`,
      (min: number) => `⏱️ ${min}': Falta perigosa! O técnico de IA gesticula bastante à beira do gramado.`,
      (min: number) => `⏱️ ${min}': Cruzamento na área! A zaga do ${teamAway} se antecipa e afasta o perigo.`,
      (min: number) => `⏱️ ${min}': Cartão amarelo mostrado pelo juiz virtual por entrada dura no círculo central.`,
      (min: number) => `⏱️ ${min}': Substituição estratégica! A IA renova o fôlego do ataque.`,
      (min: number) => `⏱️ ${min}': Incrível! O travessão balança após uma cabeçada espetacular!`
    ];

    const simInterval = setInterval(() => {
      curMinute += 15;
      
      // Update scores progressively towards final results
      if (curMinute === 30 && finalHome > 0) {
        curHomeScore = Math.min(finalHome, Math.max(1, Math.floor(finalHome / 2)));
        playSound.collect();
      }
      if (curMinute === 45 && finalAway > 0) {
        curAwayScore = Math.min(finalAway, Math.max(1, Math.floor(finalAway / 2)));
        playSound.collect();
      }
      if (curMinute === 75) {
        curHomeScore = finalHome;
        curAwayScore = finalAway;
        if (finalHome > curHomeScore || finalAway > curAwayScore) {
          playSound.collect();
        }
      }

      // Generate funny dynamic commentary
      let commentary = '';
      if (curMinute === 45) {
        commentary = `⏱️ 45': Fim do primeiro tempo! O placar parcial é ${teamHome} ${curHomeScore} x ${curAwayScore} ${teamAway}.`;
      } else if (curMinute === 90) {
        curHomeScore = finalHome;
        curAwayScore = finalAway;
        commentary = `🏁 90': Apito final! Jogo encerrado! O placar final na IA é ${teamHome} ${finalHome} x ${finalAway} ${teamAway}.`;
      } else {
        // Random narrative
        const randTemplate = commentaryTemplates[Math.floor(Math.random() * commentaryTemplates.length)];
        commentary = randTemplate(curMinute);
        
        // Add goal narrative if score just changed
        if (curMinute === 30 && finalHome > 0) {
          commentary += ` ⚽ GOL do ${teamHome}!`;
        }
        if (curMinute === 45 && finalAway > 0) {
          commentary += ` ⚽ GOL do ${teamAway}!`;
        }
      }

      setSimulatedCustomMatch((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          minute: curMinute,
          homeScore: curHomeScore,
          awayScore: curAwayScore,
          commentaries: [...prev.commentaries, commentary]
        };
      });

      if (curMinute >= 90) {
        clearInterval(simInterval);
        
        // EVALUATE WIN OR LOSS IMMEDIATELY!
        const winExact = (finalHome === customHomePredict && finalAway === customAwayPredict);
        const winWinner = (finalHome > finalAway && customHomePredict > customAwayPredict) || 
                          (finalHome < finalAway && customHomePredict < customAwayPredict) || 
                          (finalHome === finalAway && customHomePredict === customAwayPredict);

        // Add to historical bets
        const betId = `BET-CUST-${Math.floor(100000 + Math.random() * 900000)}`;
        const outcomeStatus = winExact ? 'VENCEU_EXATO' : (winWinner ? 'VENCEU_VENCEDOR' : 'PERDEU');

        let rewardDesc = '';
        if (winExact) {
          rewardDesc = `Unlocked Skin 'Manto Sagrado', Lives +${Math.round(customWager * 2)}, Coins +${Math.round(customWager * 15)}`;
        } else if (winWinner) {
          rewardDesc = `Lives +${Math.round(customWager)}, Coins +${Math.round(customWager * 5)}`;
        }

        const customBet: Bet = {
          id: betId,
          matchId: 'custom-match',
          homePredict: customHomePredict,
          awayPredict: customAwayPredict,
          wager: customWager,
          paymentMethod: customPayMethod,
          timestamp: new Date().toLocaleString('pt-BR'),
          status: outcomeStatus,
          claimed: false,
          teamsLabel: `⭐ ${customHomeFlag} ${customHome} vs ${customAway} ${customAwayFlag}`,
          isCustom: true,
          rewardClaimedDesc: rewardDesc
        };

        setBets((prev) => [customBet, ...prev]);
        addLog('purchase_booster', `Partida IA Customizada: ${teamHome} x ${teamAway} (Aposta R$ ${customWager})`, customWager, 'real');
        setWithdrawLimit((prev) => prev + customWager);

        // Finish state
        setSimulatedCustomMatch((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            status: winExact || winWinner ? 'WON' : 'LOST'
          };
        });

        if (winExact || winWinner) {
          playSound.jackpot();
        } else {
          playSound.gameover();
        }
      }

    }, 1800); // Fast pacing simulation (each block 1.8 seconds)
  };

  // Close Simulated custom match modal
  const handleCloseCustomSim = () => {
    setSimulatedCustomMatch(null);
    setActiveTab('history');
  };

  // Confirms simulated payment in checkout portal
  const handleConfirmPayment = () => {
    setPaymentStep('paying');
    playSound.click();

    setTimeout(() => {
      playSound.purchase();
      setPaymentStep('success');

      setTimeout(() => {
        setShowPayModal(false);
        setPaymentStep('idle');
        // Execute the action (place bet or trigger custom simulator)
        if (checkoutCallback) checkoutCallback();
      }, 1500);

    }, 2000);
  };

  // Claim awards from Won Bets
  const handleClaimReward = (bet: Bet) => {
    if (bet.claimed || (bet.status !== 'VENCEU_EXATO' && bet.status !== 'VENCEU_VENCEDOR')) return;
    playSound.jackpot();

    let livesReward = 0;
    let pointsReward = 0;
    let coinsReward = 0;
    let unlockedDesc = '';

    // Scale rewards dynamically with the wager value!
    if (bet.status === 'VENCEU_EXATO') {
      const scale = bet.isMulti ? 2.0 : 1.0;
      livesReward = Math.max(5, Math.round(bet.wager * 2.5 * scale));
      pointsReward = Math.max(150, Math.round(bet.wager * 25 * scale));
      coinsReward = Math.max(200, Math.round(bet.wager * 30 * scale));
      
      // Unlock premium shop objects!
      updateStats((prev) => {
        const skins = [...prev.unlockedSkins];
        const accessories = [...prev.unlockedAccessories];
        if (!skins.includes('manto_sagrado')) skins.push('manto_sagrado');
        if (!accessories.includes('chuteira_ouro')) accessories.push('chuteira_ouro');
        return {
          ...prev,
          unlockedSkins: skins,
          unlockedAccessories: accessories
        };
      });
      unlockedDesc = bet.isMulti 
        ? '🏆 COMBO DE PLACAR EXATO! Desbloqueou Manto Sagrado da Seleção, Chuteira Lendária e bônus gigante! '
        : '🏆 PLACAR EXATO! Desbloqueou Manto Sagrado da Seleção (Skin) e Chuteira Lendária (Acessório)! ';
    } else {
      const scale = bet.isMulti ? 1.4 : 1.0;
      livesReward = Math.max(2, Math.round(bet.wager * 1.2 * scale));
      pointsReward = Math.max(50, Math.round(bet.wager * 10 * scale));
      coinsReward = Math.max(55, Math.round(bet.wager * 12 * scale));
      unlockedDesc = bet.isMulti
        ? '⚽ COMBO DE VENCEDOR ACERTADO! Prêmio especial de múltipla! '
        : '⚽ ACERTOU O VENDEDOR! Prêmio de Consolação! ';
    }

    // Apply inside-the-game prizes directly
    updateStats((prev) => ({
      ...prev,
      lives: prev.lives + livesReward,
      points: (prev.points ?? 0) + pointsReward,
      coins: prev.coins + coinsReward
    }));

    // Mark as claimed
    setBets((prev) =>
      prev.map((b) => (b.id === bet.id ? { ...b, claimed: true } : b))
    );

    alert(`${unlockedDesc}Você faturou +${livesReward} Vidas, +${pointsReward} Pontos e +${coinsReward} Moedas do Bolão Futebol Jogue e Ganhe!`);
  };

  // Estimate rewards for display
  const estimateRewards = (wager: number, isExact: boolean, isMulti = false) => {
    const scale = isMulti ? (isExact ? 2.0 : 1.4) : 1.0;
    if (isExact) {
      return {
        lives: Math.max(5, Math.round(wager * 2.5 * scale)),
        points: Math.max(150, Math.round(wager * 25 * scale)),
        coins: Math.max(200, Math.round(wager * 30 * scale)),
        items: 'Manto Sagrado + Chuteira de Ouro'
      };
    } else {
      return {
        lives: Math.max(2, Math.round(wager * 1.2 * scale)),
        points: Math.max(50, Math.round(wager * 10 * scale)),
        coins: Math.max(55, Math.round(wager * 12 * scale)),
        items: 'Moedas Adicionais'
      };
    }
  };

  const isMultiActive = betMode === 'multipla' && selectedMatchIds.length > 1;
  const currentWagerValue = activeTab === 'create_custom' ? customWager : betAmount;
  const estimatedExact = estimateRewards(currentWagerValue, true, isMultiActive);
  const estimatedWinner = estimateRewards(currentWagerValue, false, isMultiActive);

  return (
    <div className="bg-slate-900/60 border border-emerald-500/20 rounded-3xl p-4 md:p-6 space-y-6 backdrop-blur-xl relative overflow-hidden" id="palpites-futebol-jogue-ganhe-portal">
      
      {/* Decorative grass-pitch soccer lines overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-slate-900/40 to-slate-950 pointer-events-none select-none z-0"></div>

      {/* Goal celebration banner overlay */}
      {goalAlert && (
        <div className="absolute inset-0 bg-emerald-950/95 rounded-3xl flex flex-col items-center justify-center text-center p-6 z-30 border-2 border-emerald-500 animate-fadeIn">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 mb-2 animate-bounce">
            <Trophy className="w-12 h-12" />
          </div>
          <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest">🚨 Transmissão em Tempo Real (IA) 🚨</span>
          <h2 className="text-3xl md:text-5xl font-black text-white font-sans tracking-tight animate-pulse uppercase">
            GOOOOOOL! ⚽
          </h2>
          <p className="text-emerald-200 text-sm md:text-lg font-bold mt-2">
            Maratona Arena Futebol: Gol de <span className="text-yellow-400 underline font-black">{goalAlert.team}</span>!
          </p>
          <p className="text-[10px] text-emerald-400/80 font-mono mt-2">O painel de palpites foi sincronizado e atualizado instantaneamente.</p>
        </div>
      )}

      {/* Header section with brand */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              MULTIPLICADORES DA ARENA ATIVOS
            </span>
            <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-300 px-2 py-1 text-[10px] rounded-full font-bold">
              ⚡ IA Engine
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 font-sans">
            ⚽ Palpites futebol jogue e ganhe!
          </h2>
          <p className="text-slate-300 text-xs leading-relaxed max-w-2xl">
            Bem-vindo ao portal definitivo de futebol com Inteligência Artificial! Faça palpites nos jogos ativos ao vivo ou <strong className="text-emerald-400 font-extrabold">inicie sua própria partida customizada no estádio virtual</strong>. Ganhe vidas, pontos e itens exclusivos para turbinar seu piloto!
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center">
          <button
            onClick={handleResetMatches}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer border border-slate-700"
            title="Reiniciar Simulação de Jogos"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset IA
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="relative z-10 flex border-b border-slate-800 p-1 bg-slate-950/80 rounded-2xl max-w-md">
        <button
          onClick={() => { playSound.click(); setActiveTab('live_matches'); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'live_matches'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tv className="w-3.5 h-3.5" /> Jogos da IA
        </button>
        <button
          onClick={() => { playSound.click(); setActiveTab('create_custom'); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'create_custom'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" /> Criar Partida
        </button>
        <button
          onClick={() => { playSound.click(); setActiveTab('history'); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" /> Histórico ({bets.length})
        </button>
      </div>

      {/* TAB 1: LIVE ONGOING AI MATCHES */}
      {activeTab === 'live_matches' && (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Matches column list */}
          <div className="lg:col-span-2 space-y-4">
            <span className="block text-[10px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> Transmissões de Jogos Ativos da IA
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match) => {
                const isSelected = selectedMatchId === match.id;
                const hasActiveBet = bets.some(b => b.matchId === match.id && b.status === 'PENDENTE');

                return (
                  <div
                    key={match.id}
                    onClick={() => { playSound.click(); setSelectedMatchId(match.id); }}
                    className={`bg-slate-950/90 border rounded-2xl p-4 transition-all hover:border-emerald-500/30 cursor-pointer relative group ${
                      isSelected 
                        ? 'border-emerald-500 shadow-md shadow-emerald-950/20' 
                        : 'border-slate-800'
                    }`}
                  >
                    {/* Pulsing indicator */}
                    {isSelected && (
                      <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}

                    <div className="flex items-center justify-between text-[9px] font-mono border-b border-slate-900 pb-2 mb-3 text-slate-400">
                      <span>🏆 {match.league}</span>
                      
                      <div className="flex items-center gap-1.5">
                        {hasActiveBet && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded text-[8px] font-extrabold">
                            Palpite Ativo
                          </span>
                        )}
                        {match.status === 'AO VIVO' && (
                          <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 animate-pulse">
                            AO VIVO ({match.minute}')
                          </span>
                        )}
                        {match.status === 'AGUARDANDO' && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                            Aguardando
                          </span>
                        )}
                        {match.status === 'ENCERRADO' && (
                          <span className="bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                            Final
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Team display */}
                    <div className="flex items-center justify-between px-2 py-1">
                      <div className="flex flex-col items-center text-center space-y-1">
                        <span className="text-2xl">{match.homeFlag}</span>
                        <span className="text-xs font-extrabold text-white truncate max-w-[80px]">{match.homeTeam}</span>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-lg font-black text-white">
                        <span>{match.homeScore}</span>
                        <span className="text-xs text-slate-500">-</span>
                        <span>{match.awayScore}</span>
                      </div>

                      <div className="flex flex-col items-center text-center space-y-1">
                        <span className="text-2xl">{match.awayFlag}</span>
                        <span className="text-xs font-extrabold text-white truncate max-w-[80px]">{match.awayTeam}</span>
                      </div>
                    </div>

                    {/* Stats miniature progress bar */}
                    {match.status !== 'AGUARDANDO' && (
                      <div className="mt-3.5 pt-2 border-t border-slate-900 text-[8px] font-mono text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Chutes: {match.shots[0]}x{match.shots[1]}</span>
                          <span>Posse: {match.possession[0]}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-500 h-full" style={{ width: `${match.possession[0]}%` }} />
                          <div className="bg-slate-700 h-full flex-1" />
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex justify-between gap-1.5">
                      <span className="text-[10px] text-emerald-400 font-bold group-hover:underline">Palpitar</span>
                      {match.status === 'AO VIVO' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleFastForwardMatch(match.id); }}
                          className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-[8px] font-bold rounded"
                        >
                          Acelerar Fim ⏩
                        </button>
                      )}
                      {match.status === 'AGUARDANDO' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartWaitingMatch(match.id); }}
                          className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold rounded"
                        >
                          Apitar Início ⚡
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Bet Form */}
          <div className="bg-slate-950/95 border border-slate-800 rounded-2xl p-4 space-y-4">
            <span className="block text-[10px] font-mono text-slate-400 font-extrabold uppercase tracking-widest">📝 Registrar Seu Palpite</span>

            {(() => {
              const match = matches.find((m) => m.id === selectedMatchId);
              if (!match) return <p className="text-xs text-slate-500">Selecione uma partida ao lado para registrar seu palpite.</p>;

              const isLocked = match.status === 'ENCERRADO';

              return (
                <form onSubmit={handleQuickBetSubmit} className="space-y-4">
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/10 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400">Selecionado:</span>
                    <span className="text-white font-extrabold text-xs">{match.homeFlag} {match.homeTeam} x {match.awayTeam} {match.awayFlag}</span>
                  </div>

                  {/* Core Guess Input */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase font-black">Placar do Seu Palpite:</label>
                    <div className="flex items-center justify-center gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-bold">{match.homeTeam}</span>
                        <input
                          type="number"
                          min="0"
                          max="15"
                          disabled={isLocked}
                          value={homePredict}
                          onChange={(e) => setHomePredict(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-12 bg-slate-950 border border-slate-850 rounded-lg text-center py-1.5 text-base text-white font-black font-mono outline-none focus:border-emerald-500"
                        />
                      </div>
                      <span className="text-slate-600 font-black font-mono text-xs mt-4">x</span>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-bold">{match.awayTeam}</span>
                        <input
                          type="number"
                          min="0"
                          max="15"
                          disabled={isLocked}
                          value={awayPredict}
                          onChange={(e) => setAwayPredict(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-12 bg-slate-950 border border-slate-850 rounded-lg text-center py-1.5 text-base text-white font-black font-mono outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bet Value */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase font-black">Valor do Palpite:</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-xs">R$</span>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        disabled={isLocked}
                        value={betAmount}
                        onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-sm text-emerald-400 font-black font-mono outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {[5, 10, 20, 50, 100].map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          disabled={isLocked}
                          onClick={() => { setBetAmount(preset); playSound.click(); }}
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                            betAmount === preset
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                          }`}
                        >
                          R$ {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rewards Estimation */}
                  <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-850 text-[10px] font-mono space-y-1.5 text-slate-400">
                    <span className="block font-bold text-white mb-1">🎁 Estimativa de Prêmios se Acertar:</span>
                    <div className="flex justify-between">
                      <span>🎯 Placar Exato:</span>
                      <span className="text-emerald-400 font-black">+{estimatedExact.lives} Vidas, +{estimatedExact.points}pts, +{estimatedExact.coins} moedas</span>
                    </div>
                    <div className="flex justify-between">
                      <span>⚽ Acertar Vencedor:</span>
                      <span className="text-yellow-400 font-bold">+{estimatedWinner.lives} Vidas, +{estimatedWinner.points}pts</span>
                    </div>
                    <div className="text-[9px] text-slate-500 italic text-center pt-1 border-t border-slate-900">
                      Além de liberar Skins lendárias de uniforme do Brasil!
                    </div>
                  </div>

                  {/* Payment method selection */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono text-slate-400 uppercase font-black">Forma de Pagamento:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => { setPaymentMethod('pix'); playSound.click(); }}
                        className={`flex items-center justify-center gap-1.5 py-1.5 border rounded-xl font-bold transition-all text-xs cursor-pointer ${
                          paymentMethod === 'pix'
                            ? 'bg-emerald-600/15 border-emerald-500 text-emerald-400'
                            : 'bg-slate-900/50 border-slate-850 text-slate-400'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" /> PIX
                      </button>
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => { setPaymentMethod('card'); playSound.click(); }}
                        className={`flex items-center justify-center gap-1.5 py-1.5 border rounded-xl font-bold transition-all text-xs cursor-pointer ${
                          paymentMethod === 'card'
                            ? 'bg-emerald-600/15 border-emerald-500 text-emerald-400'
                            : 'bg-slate-900/50 border-slate-850 text-slate-400'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" /> CARTÃO
                      </button>
                    </div>
                  </div>

                  {isLocked ? (
                    <div className="p-2.5 bg-red-950/20 border border-red-500/20 text-red-400 text-center text-[10px] rounded-lg">
                      ⚠️ Esta partida já encerrou. Por favor, selecione outro jogo.
                    </div>
                  ) : (
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trophy className="w-4 h-4" /> Registrar Palpite R$ {betAmount.toFixed(2)}
                    </button>
                  )}
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 2: CREATE CUSTOM IA MATCH */}
      {activeTab === 'create_custom' && (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Creator form */}
          <div className="lg:col-span-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 md:p-6 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500"></div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                🏟️ Iniciar Minha Própria Partida Customizada
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Preencha os dados da partida que você quer iniciar no estádio virtual. O juiz de Inteligência Artificial apitará e jogará o confronto em tempo real! Escolha o palpite exato, pague a aposta e acompanhe a simulação ao vivo.
              </p>
            </div>

            <form onSubmit={handleCreateCustomMatch} className="space-y-4">
              {/* Teams setup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Home Team */}
                <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-850">
                  <span className="block text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">⚽ Time de Casa (Home)</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1 space-y-1">
                      <label className="block text-[9px] text-slate-400">Emoji/Bandeira</label>
                      <select 
                        value={customHomeFlag} 
                        onChange={(e) => setCustomHomeFlag(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white text-sm outline-none"
                      >
                        {PRESET_EMOJIS.map(em => <option key={em} value={em}>{em}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="block text-[9px] text-slate-400">Nome do Time</label>
                      <input
                        type="text"
                        value={customHome}
                        onChange={(e) => setCustomHome(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-xs font-black outline-none"
                        placeholder="Ex: São Paulo"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 pt-2">
                    <label className="block text-[9px] text-slate-400">Previsão do Placar (Para Ganhar):</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={customHomePredict}
                      onChange={(e) => setCustomHomePredict(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-center text-white font-mono font-extrabold text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Away Team */}
                <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-850">
                  <span className="block text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">⚽ Time de Fora (Away)</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1 space-y-1">
                      <label className="block text-[9px] text-slate-400">Emoji/Bandeira</label>
                      <select 
                        value={customAwayFlag} 
                        onChange={(e) => setCustomAwayFlag(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white text-sm outline-none"
                      >
                        {PRESET_EMOJIS.map(em => <option key={em} value={em}>{em}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="block text-[9px] text-slate-400">Nome do Time</label>
                      <input
                        type="text"
                        value={customAway}
                        onChange={(e) => setCustomAway(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-xs font-black outline-none"
                        placeholder="Ex: Flamengo"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 pt-2">
                    <label className="block text-[9px] text-slate-400">Previsão do Placar (Para Ganhar):</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={customAwayPredict}
                      onChange={(e) => setCustomAwayPredict(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-center text-white font-mono font-extrabold text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

              </div>

              {/* Wager and checkout preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-2 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-black">Valor do Palpite (A partir de R$ 1,00):</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-xs">R$</span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={customWager}
                      onChange={(e) => setCustomWager(Math.max(1, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-sm text-emerald-400 font-black font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    {[5, 10, 25, 50, 100].map(p => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => { setCustomWager(p); playSound.click(); }}
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                          customWager === p ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        R$ {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-black">Forma de Pagamento:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setCustomPayMethod('pix'); playSound.click(); }}
                      className={`flex items-center justify-center gap-1 py-2 border rounded-xl font-bold transition-all text-xs cursor-pointer ${
                        customPayMethod === 'pix' ? 'bg-emerald-600/15 border-emerald-500 text-emerald-400' : 'bg-slate-950 text-slate-400'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" /> Pix Seguro
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCustomPayMethod('card'); playSound.click(); }}
                      className={`flex items-center justify-center gap-1 py-2 border rounded-xl font-bold transition-all text-xs cursor-pointer ${
                        customPayMethod === 'card' ? 'bg-emerald-600/15 border-emerald-500 text-emerald-400' : 'bg-slate-950 text-slate-400'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Cartão
                    </button>
                  </div>
                </div>

              </div>

              {/* Interactive payment submit button */}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white animate-pulse" /> Pagar Aposta &amp; Iniciar Jogo na IA 🏟️
              </button>

            </form>
          </div>

          {/* Rules and reward breakdown column */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="block text-[10px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest">💰 Estimador de Prêmios Dinâmicos</span>
              
              <div className="space-y-3">
                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Trophy className="w-4 h-4 text-emerald-400" /> Placar Exato (Super Multiplicador)
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Se a IA encerrar o jogo exatamente com o placar que você definiu (<strong className="text-white">{customHomePredict}x{customAwayPredict}</strong>):
                  </p>
                  <div className="text-[11px] font-mono font-bold text-emerald-400 space-y-1">
                    <div>🔥 +{estimatedExact.lives} Vidas Extras</div>
                    <div>⭐ +{estimatedExact.points} Pontos para Nível</div>
                    <div>🪙 +{estimatedExact.coins} Moedas</div>
                    <div className="text-[9px] text-yellow-400 bg-yellow-950/20 px-2 py-0.5 rounded mt-1 border border-yellow-900/30">
                      🎁 Libera Skin Manto Sagrado + Chuteira de Ouro!
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Award className="w-4 h-4 text-yellow-400" /> Acerto de Vencedor (Prêmio Consolação)
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Se você errou o placar exato, mas acertou quem venceu ou o empate:
                  </p>
                  <div className="text-[11px] font-mono font-bold text-yellow-400 space-y-1">
                    <div>💚 +{estimatedWinner.lives} Vidas Extras</div>
                    <div>⭐ +{estimatedWinner.points} Pontos</div>
                    <div>🪙 +{estimatedWinner.coins} Moedas</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-900 space-y-1.5 text-[10px] text-slate-400 font-mono">
              <div className="flex items-center gap-1 text-emerald-500 font-bold">
                <ShieldCheck className="w-4 h-4" /> Licença Arena Arcade Ativa
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed">
                As simulações da partida utilizam a IA de futebol virtual da plataforma, gerando estatísticas competitivas fiéis às habilidades virtuais das equipes.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: BETTING HISTORY */}
      {activeTab === 'history' && (
        <div className="relative z-10 bg-slate-950 border border-slate-850 rounded-2xl p-4 md:p-6 space-y-4 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-900 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              📋 Seus Palpites &amp; Status de Resgate
            </h3>
            <span className="text-xs text-slate-400 font-mono">Total de Apostas Efetuadas: <strong className="text-emerald-400 font-black">{bets.length}</strong></span>
          </div>

          {bets.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Você ainda não efetuou palpites nesta sessão. Faça seu primeiro palpite nos jogos ativos da IA ou crie uma partida customizada!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 text-[9px] uppercase tracking-wider">
                    <th className="py-3 px-4">ID do Palpite</th>
                    <th className="py-3 px-4">Partida Simulações</th>
                    <th className="py-3 px-4 text-center">Seu Palpite</th>
                    <th className="py-3 px-4 text-emerald-400">Wager</th>
                    <th className="py-3 px-4">Forma</th>
                    <th className="py-3 px-4">Resultado</th>
                    <th className="py-3 px-4 text-right">Ação / Resgatar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {bets.map((bet) => {
                    return (
                      <tr key={bet.id} className="hover:bg-slate-900/30 transition-all">
                        <td className="py-3.5 px-4 font-bold text-slate-400 text-[10px]">{bet.id}</td>
                        <td className="py-3.5 px-4 text-white font-sans font-black flex items-center gap-1 text-[11px]">
                          {bet.isCustom && <span className="bg-indigo-600 text-white text-[8px] font-mono font-bold px-1 py-0.5 rounded">CUSTOM</span>}
                          {bet.teamsLabel}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 bg-slate-900 rounded-lg text-white font-black text-xs border border-slate-800">
                            {bet.homePredict} x {bet.awayPredict}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-emerald-400 font-black text-xs">R$ {bet.wager.toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-[9px] uppercase">{bet.paymentMethod === 'pix' ? '🟢 PIX' : '🟣 CARTÃO'}</td>
                        <td className="py-3.5 px-4">
                          {bet.status === 'PENDENTE' && (
                            <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[9px] font-black animate-pulse uppercase">
                              ⏳ Simulando...
                            </span>
                          )}
                          {bet.status === 'VENCEU_EXATO' && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-black uppercase">
                              🏆 Placar Exato!
                            </span>
                          )}
                          {bet.status === 'VENCEU_VENCEDOR' && (
                            <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded text-[9px] font-black uppercase">
                              ⚽ Venceu Vendedor
                            </span>
                          )}
                          {bet.status === 'PERDEU' && (
                            <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[9px] font-black uppercase">
                              ❌ Não foi desta vez
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {bet.status !== 'PENDENTE' && !bet.claimed && bet.status !== 'PERDEU' && (
                            <button
                              onClick={() => handleClaimReward(bet)}
                              className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-yellow-500 hover:opacity-90 text-slate-950 font-black rounded-lg text-[10px] uppercase tracking-wide cursor-pointer shadow-sm shadow-emerald-500/20 animate-bounce"
                            >
                              Resgatar Prêmio 🎁
                            </button>
                          )}
                          {bet.status === 'PERDEU' && (
                            <span className="text-[10px] text-slate-500 italic block">Sem prêmio</span>
                          )}
                          {bet.claimed && (
                            <span className="text-[10px] text-emerald-400 font-black flex items-center gap-1 justify-end">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Resgatado
                            </span>
                          )}
                          {bet.status === 'PENDENTE' && (
                            <span className="text-[9px] text-slate-500 italic">Simulando...</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DETAILED IA STADIUM CUSTOM LIVE COMMENTARY DISPLAY OVERLAY */}
      {simulatedCustomMatch && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-lg w-full p-6 relative space-y-4 shadow-2xl shadow-emerald-950/40">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500"></div>

            <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-black">
              <span>🏟️ Estádio Virtual: Arena de IA</span>
              <span className="animate-pulse">● TRANSMISSÃO AO VIVO</span>
            </div>

            {/* Scoreboard */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-center relative overflow-hidden">
              {/* Field overlay texture */}
              <div className="absolute inset-y-0 left-1/2 w-[1px] bg-slate-800 pointer-events-none"></div>
              
              <div className="flex flex-col items-center space-y-1 w-28">
                <span className="text-4xl">{simulatedCustomMatch.homeFlag}</span>
                <span className="text-xs font-black text-white uppercase tracking-tight">{simulatedCustomMatch.homeTeam}</span>
                <span className="text-[9px] text-slate-400 font-mono">Palpite: {simulatedCustomMatch.homePredict}</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-4 bg-emerald-950/30 border border-emerald-500/20 px-4 py-2 rounded-xl text-3xl font-black text-white font-mono">
                  <span>{simulatedCustomMatch.homeScore}</span>
                  <span className="text-xs text-slate-500">X</span>
                  <span>{simulatedCustomMatch.awayScore}</span>
                </div>
                <div className="mt-2 text-[9px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                  Tempo: {simulatedCustomMatch.minute}'
                </div>
              </div>

              <div className="flex flex-col items-center space-y-1 w-28">
                <span className="text-4xl">{simulatedCustomMatch.awayFlag}</span>
                <span className="text-xs font-black text-white uppercase tracking-tight">{simulatedCustomMatch.awayTeam}</span>
                <span className="text-[9px] text-slate-400 font-mono">Palpite: {simulatedCustomMatch.awayPredict}</span>
              </div>
            </div>

            {/* Wager notification bar */}
            <div className="p-2 bg-slate-950/50 rounded-xl border border-slate-850 text-center text-[10px] font-mono">
              Sua aposta ativa: <strong className="text-emerald-400">R$ {simulatedCustomMatch.wager.toFixed(2)}</strong> para o palpite <strong className="text-white">{simulatedCustomMatch.homePredict} x {simulatedCustomMatch.awayPredict}</strong>
            </div>

            {/* Simulated commentaries timeline box */}
            <div className="bg-slate-950 rounded-xl p-4 h-48 overflow-y-auto space-y-2.5 border border-slate-850 text-xs font-mono scrollbar-thin">
              {simulatedCustomMatch.commentaries.map((com, idx) => (
                <div key={idx} className="text-slate-300 animate-slideUp border-b border-slate-900 pb-1.5 last:border-b-0 leading-relaxed">
                  {com}
                </div>
              ))}
            </div>

            {/* Simulation finished screen overlays */}
            {simulatedCustomMatch.minute >= 90 && (
              <div className="p-4 rounded-xl border animate-scaleIn text-center space-y-3">
                {simulatedCustomMatch.status === 'WON' ? (
                  <div className="bg-emerald-950/40 border-emerald-500/30 text-emerald-400 p-4 rounded-xl space-y-2">
                    <Trophy className="w-10 h-10 mx-auto text-yellow-400 animate-bounce" />
                    <h4 className="font-extrabold text-sm uppercase">🎉 VOCÊ GANHOU O PALPITE!</h4>
                    <p className="text-[10px] text-slate-300">
                      O placar final bateu e você faturou vidas extras, moedas e o uniforme lendário de piloto! Resgate seu prêmio no histórico.
                    </p>
                  </div>
                ) : (
                  <div className="bg-rose-950/40 border-rose-500/30 text-rose-400 p-4 rounded-xl space-y-2">
                    <AlertTriangle className="w-10 h-10 mx-auto text-rose-500 animate-pulse" />
                    <h4 className="font-extrabold text-sm uppercase">Não foi desta vez, faça uma nova aposta</h4>
                    <p className="text-[10px] text-slate-300">
                      O placar simulado pela IA foi {simulatedCustomMatch.homeScore}x{simulatedCustomMatch.awayScore}. Tente novamente e mude o placar ou aposte em outra rodada!
                    </p>
                  </div>
                )}

                <button
                  onClick={handleCloseCustomSim}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:from-emerald-500 hover:to-indigo-500 cursor-pointer"
                >
                  Continuar para Histórico 🏟️
                </button>
              </div>
            )}

            {simulatedCustomMatch.minute < 90 && (
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-400 py-2">
                <div className="w-3.5 h-3.5 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
                <span>IA está jogando o confronto virtual de futebol...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive payment checkout modal portal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 relative space-y-4">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500"></div>

            {paymentStep === 'idle' && (
              <>
                <h4 className="text-sm font-black text-white uppercase tracking-wider text-center flex items-center justify-center gap-1.5 pt-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" /> Gateway Checkout Seguro
                </h4>
                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  Confirme o pagamento de <strong className="text-emerald-400 font-black">R$ {(activeTab === 'create_custom' ? customWager : betAmount).toFixed(2)}</strong> para registrar sua aposta com absoluta segurança.
                </p>

                {((activeTab === 'create_custom' ? customPayMethod : paymentMethod) === 'pix') ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                      <QrCode className="w-28 h-28 text-emerald-400" />
                      <div className="space-y-1 w-full">
                        <span className="block text-[8px] font-mono text-slate-500 uppercase font-black">Chave Copia e Cola PIX</span>
                        <input
                          type="text"
                          readOnly
                          value={`00020101021126580014br.gov.bcb.pix0136arena-arcade-futebol-jogue-ganhe-pix-${(activeTab === 'create_custom' ? customWager : betAmount).toFixed(0)}`}
                          className="w-full bg-slate-900/50 border border-slate-800 text-[8px] font-mono text-slate-300 rounded px-2 py-1 text-center"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 text-xs">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono text-slate-400 uppercase font-bold">Nome impresso no Cartão</label>
                      <input
                        type="text"
                        placeholder="Ex: TIAGO JORGE"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-white font-bold text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono text-slate-400 uppercase font-bold">Número do Cartão</label>
                      <input
                        type="text"
                        placeholder="4532 9012 3456 7890"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-white font-mono font-bold text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-mono text-slate-400 uppercase font-bold">Validade</label>
                        <input
                          type="text"
                          placeholder="09/30"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-white font-mono font-bold text-center text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-mono text-slate-400 uppercase font-bold">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-white font-mono font-bold text-center text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl cursor-pointer"
                  >
                    Confirmar Transação ⚡
                  </button>
                </div>
              </>
            )}

            {paymentStep === 'paying' && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">Processando Transação...</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Aguardando liquidação junto ao banco parceiro. Por favor, mantenha esta janela aberta.
                  </p>
                </div>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center animate-scaleIn">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 animate-bounce">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-emerald-400 uppercase tracking-wider">Pagamento Confirmado!</h4>
                  <p className="text-[10px] text-slate-300 leading-normal">
                    Seu Pix/Cartão foi liquidado com sucesso. O palpite foi anexado ao servidor de Inteligência Artificial. Boa sorte!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
