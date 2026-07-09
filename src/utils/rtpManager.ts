import { secureStorage } from './security';

// Secure user ID reference for RTP signatures
const getRtpUserId = (): string => {
  try {
    const cachedUser = localStorage.getItem('gamezone_logged_in_user');
    if (cachedUser) {
      const u = JSON.parse(cachedUser);
      return u.uid || u.email || 'guest';
    }
  } catch (e) {}
  return 'guest';
};

export const getCasinoStats = () => {
  const userId = getRtpUserId();
  const bet = Number(secureStorage.getItem('casino_total_bet', 100, userId)); // Start with a small seed to avoid division by zero
  const won = Number(secureStorage.getItem('casino_total_won', 10, userId));  // Exactly 10% initial seed
  return { bet, won };
};

export const registerBet = (amount: number) => {
  const userId = getRtpUserId();
  const { bet, won } = getCasinoStats();
  const newBet = bet + amount;
  secureStorage.setItem('casino_total_bet', newBet, userId);
  return { bet: newBet, won };
};

export const registerWin = (amount: number) => {
  const userId = getRtpUserId();
  const { bet, won } = getCasinoStats();
  const newWon = won + amount;
  secureStorage.setItem('casino_total_won', newWon, userId);
  return { bet, won: newWon };
};

/**
 * Verifica se um prêmio candidato respeita a taxa de retorno de 10%.
 * Se exceder 10% do total apostado historicamente, o prêmio deve ser barrado ou recalculado.
 */
export const checkRTPApproval = (candidatePayout: number, betAmount: number): boolean => {
  const { bet, won } = getCasinoStats();
  
  // Próximo total apostado incluindo a aposta corrente (se já não registrada)
  const nextBetTotal = bet; 
  const nextWonTotal = won + candidatePayout;
  
  const currentRTP = nextWonTotal / nextBetTotal;
  
  // Se ganhar este prêmio fará com que o RTP ultrapasse 10% (0.10)
  if (currentRTP > 0.10 && candidatePayout > 0) {
    return false; // Reprovado! Muito alto para a meta de 10%
  }
  
  return true; // Aprovado
};

/**
 * Retorna o RTP acumulado atual em formato de string percentual
 */
export const getFormattedRTP = (): string => {
  const { bet, won } = getCasinoStats();
  if (bet === 0) return '10.0%';
  return `${((won / bet) * 100).toFixed(1)}%`;
};
