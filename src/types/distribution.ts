export interface DevProfile {
  id: string;
  userId: string;
  studioName: string;
  bio: string;
  logoUrl: string;
  bannerUrl: string;
  website: string;
  twitter?: string;
  youtube?: string;
  discord?: string;
  team: string[]; // member names
  followersCount: number;
}

export interface GameRequirement {
  os: string;
  processor: string;
  memory: string;
  graphics: string;
  storage: string;
}

export interface PublishedGame {
  id: string;
  devId: string;
  devName: string;
  title: string;
  subtitle: string;
  description: string;
  shortDescription: string;
  category: 'game' | 'dlc' | 'bundle' | 'extra';
  genre: 'Ação' | 'Aventura' | 'RPG' | 'Estratégia' | 'Esporte' | 'Simulação' | 'Corrida' | 'Indie';
  platform: ('Windows' | 'Mac' | 'Linux' | 'Web')[];
  language: string;
  ageRating: string; // 'Livre', '12+', '16+', '18+'
  requirementsMin: GameRequirement;
  requirementsRec: GameRequirement;
  publisher: string;
  releaseDate: string;
  price: number;
  discount: number; // percentage
  version: string;
  changelog: string;
  trailerUrl: string; // youtube embed or video file
  images: string[];
  bannerUrl: string;
  iconUrl: string;
  logoUrl: string;
  tags: string[];
  status: 'draft' | 'published' | 'under_review';
  downloadsCount: number;
  salesCount: number;
  ratingAverage: number;
  ratingCount: number;
}

export interface LibraryItem {
  id: string;
  gameId: string;
  gameTitle: string;
  gameIconUrl: string;
  purchasedAt: string;
  pricePaid: number;
  isFavorite: boolean;
  playTimeMinutes: number;
  isInstalled: boolean;
  lastPlayedAt?: string;
  achievements: { id: string; title: string; desc: string; unlocked: boolean; unlockedAt?: string }[];
  downloadProgress?: number; // 0-100 or null
  isUpdating?: boolean;
}

export interface GameReview {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  gameId: string;
  rating: number; // 1-5
  reviewText: string;
  screenshots: string[];
  upvotes: number;
  downvotes: number;
  createdAt: string;
  devResponse?: string;
}

export interface ShoppingCartItem {
  game: PublishedGame;
  quantity: number;
}

export interface DiscountCoupon {
  code: string;
  discountPercent: number;
  isActive: boolean;
}

export interface PlatformStats {
  onlineUsers: number;
  newSignups: number;
  revenueTotal: number;
  commissionEarned: number;
  totalDownloads: number;
  growthRate: number;
}
