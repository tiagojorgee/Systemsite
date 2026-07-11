export interface AvatarConfig {
  skin: string;
  accessory: string;
  aura: string;
}

export type ItemCategory = 'booster' | 'avatar' | 'coins';
export type CurrencyType = 'coins' | 'real';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: CurrencyType;
  category: ItemCategory;
  subCategory?: 'skin' | 'accessory' | 'aura' | 'lives' | 'stage_skip' | 'pack';
  visualValue: string; // CSS color, emoji, or icon name for rendering
  value: number; // effect amount (e.g., 5 lives, 500 coins, 1 level skip)
}

export interface PlayerStats {
  coins: number;
  lives: number;
  currentStage: number;
  highScore: number;
  unlockedSkins: string[];
  unlockedAccessories: string[];
  unlockedAuras: string[];
  avatar: AvatarConfig;
  isVip?: boolean;
  rtpBoostSpins?: number;
  points?: number;
  level?: number;
  
  // 🏆 Global Event & Progression System Integration
  battlePassXp?: number;
  battlePassLevel?: number;
  battlePassPremiumUnlocked?: boolean;
  unlockedTitles?: string[];
  unlockedBadges?: string[];
  activeTitle?: string;
  activeBadges?: string[];
  boxesInventory?: { type: 'common' | 'rare' | 'legendary' | 'sponsored'; count: number }[];
  completedQuestIds?: string[];
  dailyCheckedInDays?: number[]; // list of days (e.g. [1, 2, 3]) checked in during the current monthly cycle
  lastDailyCheckInDate?: string; // ISO date string
}

export interface TransactionLog {
  id: string;
  timestamp: string;
  type: 'earn' | 'purchase_coins' | 'purchase_booster' | 'purchase_cosmetic' | 'stage_skip';
  description: string;
  amount: number;
  currency: CurrencyType;
  status: 'success' | 'failed';
  securityHash?: string; // secure transactions simulated hash
}
