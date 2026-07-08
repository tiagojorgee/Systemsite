export interface LevelInfo {
  level: number;
  nextLevelPoints: number;
  currentLevelMinPoints: number;
}

// XP/Points thresholds for levels 1 to 12
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  150,    // Level 2
  350,    // Level 3
  650,    // Level 4
  1000,   // Level 5
  1450,   // Level 6
  2000,   // Level 7
  2650,   // Level 8
  3400,   // Level 9
  4250,   // Level 10
  5200,   // Level 11
  6250    // Level 12
];

/**
 * Returns level and points progress details for a given point total
 */
export function getLevelForPoints(points: number): LevelInfo {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  const currentLevelMinPoints = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextLevelPoints = LEVEL_THRESHOLDS[level] || (currentLevelMinPoints + 1500);
  return { level, nextLevelPoints, currentLevelMinPoints };
}

// Points awarded for different actions
export const ACTION_POINTS = {
  PLAY_ATTEMPT: 10,        // Effort points for playing
  STAGE_CLEAR: 60,         // Clearing an arcade level
  STAGE_SKIP: 30,          // Skipping an arcade level
  ROULETTE_SPIN: 15,       // Spinning roulette
  ROULETTE_JACKPOT: 50,    // Hitting jackpot in roulette
  TIGER_SPIN: 12,          // Spinning Fortune Tiger
  TIGER_BIG_WIN: 40,       // Big win in Fortune Tiger
  AVIATOR_LAUNCH: 10,      // Launching Aviator
  AVIATOR_CASHOUT: 25,     // Successful cashout in Aviator
};

// Item level requirements
export const SKIN_LEVELS: Record<string, number> = {
  'classic': 1,
  'plasma-slime': 2,      // Slime Ácido
  'matrix-hacker': 3,     // Matrix Glitch
  'phantom-shadow': 4,    // Sombra Fantasma
  'cyber-purple': 5,      // Cyber Neon
  'golden-warrior': 6,    // Guerreiro de Ouro
};

export const ACCESSORY_LEVELS: Record<string, number> = {
  'none': 1,
  'shades': 2,            // Óculos Futuristas
  'headset': 3,           // Headset Gamer
  'viking': 4,            // Elmo Viking
  'wizard': 5,            // Chapéu de Mago
  'crown': 6,             // Coroa Imperial
};

export const AURA_LEVELS: Record<string, number> = {
  'none': 1,
  'cyber-grid': 2,        // Grelha Retro
  'stardust': 3,          // Pó de Estrelas
  'fire-shield': 4,       // Escudo de Fogo
  'matrix-rain': 5,       // Chuva Cósmica
};

// Feature level requirements
export const ROULETTE_ROOM_LEVELS: Record<string, number> = {
  'bronze': 1,
  'neon': 3,
  'gold': 5,
};

export const TIGER_BET_LEVELS: Record<number, number> = {
  10: 1,
  20: 1,
  50: 2,
  100: 4,
  250: 6,
};
