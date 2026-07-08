// RTP Manager - Garante que a cada 10 moedas/créditos apostados, retorne no máximo 1 moeda em vitórias (RTP máximo de 10%)
// Isso cumpre perfeitamente a exigência: "a cada 10 reais investido pelo jogador volte apenas 1 real em vitórias nos jogos"

export const getCasinoStats = () => {
  const bet = Number(localStorage.getItem('casino_total_bet') || '100'); // start with a small seed to avoid division by zero
  const won = Number(localStorage.getItem('casino_total_won') || '10');  // exactly 10% initial seed
  return { bet, won };
};

export const registerBet = (amount: number) => {
  const { bet, won } = getCasinoStats();
  const newBet = bet + amount;
  localStorage.setItem('casino_total_bet', String(newBet));
  return { bet: newBet, won };
};

export const registerWin = (amount: number) => {
  const { bet, won } = getCasinoStats();
  const newWon = won + amount;
  localStorage.setItem('casino_total_won', String(newWon));
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
