import fs from 'fs';
import path from 'path';

export interface UserAccount {
  email: string;
  password?: string;
  name: string;
  provider: 'email' | 'google';
  avatarUrl?: string;
  uid?: string;
}

export interface UserProfile {
  userId: string;
  stats: {
    coins: number;
    lives: number;
    currentStage: number;
    highScore: number;
    unlockedSkins: string[];
    unlockedAccessories: string[];
    unlockedAuras: string[];
    avatar: {
      skin: string;
      accessory: string;
      aura: string;
    };
    points?: number;
    level?: number;
    isVip?: boolean;
    rtpBoostSpins?: number;
  };
  realBalance: number;
  withdrawLimit: number;
}

export interface TransactionLog {
  id: string;
  userId: string;
  timestamp: string;
  type: string;
  description: string;
  amount: number;
  currency: 'coins' | 'real';
  status: string;
  securityHash?: string;
}

export interface FeedReply {
  id: string;
  userId: string;
  username: string;
  userAvatarUrl?: string;
  text: string;
  created_at: string;
  likes?: string[]; // userIds
}

export interface FeedComment {
  id: string;
  userId: string;
  username: string;
  userAvatarUrl?: string;
  text: string;
  created_at: string;
  likes?: string[]; // userIds
  replies?: FeedReply[];
}

export interface FeedPost {
  id: string;
  userId?: string;
  username: string;
  userAvatarUrl?: string;
  text: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  created_at: string;
  likes?: string[]; // array of userIds
  evaluations?: Record<string, number>; // key: userId, value: rating (e.g. 1-5 or gamer score)
  comments?: FeedComment[];
  isAd?: boolean;
  adTitle?: string;
  adActionUrl?: string;
  adCategory?: 'movie' | 'game' | 'shop';
}

export interface ServerDatabaseSchema {
  users: Record<string, UserAccount>; // key: clean userId or email
  profiles: Record<string, UserProfile>; // key: userId
  logs: Record<string, TransactionLog[]>; // key: userId -> logs
  posts: FeedPost[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'gamezone_db.json');

// Helper to ensure database file and directory exist
function initDatabase(): ServerDatabaseSchema {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const defaultSchema: ServerDatabaseSchema = {
    users: {},
    profiles: {},
    logs: {},
    posts: [
      {
        id: "post-1",
        username: "Admin Gamezone",
        userAvatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150",
        text: "🎮 BEM-VINDO AO NOVO ARENA FEED! 🚀 O ponto de encontro oficial dos gamers de elite da Gamezone! Compartilhe capturas de tela dos seus maiores recordes, setups de tirar o fôlego ou assista aos gameplays incríveis diretamente do nosso player integrado. Comente, avalie os setups dos colegas, receba prêmios de interação e conquiste o prestígio lendário na comunidade! Deixe seu like e comece agora!",
        media_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200",
        media_type: "image",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        likes: ["user_admin", "user_gamerpro99"],
        evaluations: { "user_admin": 5, "user_gamerpro99": 5 },
        comments: [
          {
            id: "comment-1",
            userId: "user_gamerpro99",
            username: "GamerPro99",
            userAvatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150",
            text: "O feed ficou sensacional! Design extremamente limpo e super rápido. Já vou postar meu setup!",
            created_at: new Date(Date.now() - 3600000 * 1.8).toISOString(),
            likes: ["user_admin"],
            replies: [
              {
                id: "reply-1",
                userId: "user_admin",
                username: "Admin Gamezone",
                userAvatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150",
                text: "Valeu demais, GamerPro! Estamos ansiosos para ver suas jogadas lendárias de Tigrinho e Space Arena! 🚀🔥",
                created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
                likes: ["user_gamerpro99"]
              }
            ]
          }
        ]
      },
      {
        id: "ad-movie-1",
        username: "Cinema Multiplex Promovido",
        userAvatarUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=150",
        text: "🎬 LANÇAMENTO EXCLUSIVO! Chegou aos cinemas o épico espacial mais aguardado do ano. Prepare-se para uma experiência imersiva com efeitos especiais revolucionários e som de última geração nas salas IMAX de todo o país! Garanta já o seu ingresso na nossa bilheteria digital com 20% de desconto usando o cupom GAMEZONE20.",
        media_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200",
        media_type: "image",
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        likes: ["user_gamerpro99"],
        evaluations: {},
        comments: [],
        isAd: true,
        adTitle: "🎟️ Ingressos Cinema IMAX - 20% OFF",
        adActionUrl: "#cinema-tickets",
        adCategory: "movie"
      },
      {
        id: "post-2",
        username: "GamerPro99",
        userAvatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150",
        text: "🏆 ALERTA DE RECORDE! Consegui faturar 15.000 moedas no modo ultra do Tigrinho da Fortuna hoje à tarde! Ativei o multiplicador místico na hora certa e os bônus vieram sem parar. Quem consegue bater esse recorde? Deixem suas avaliações aqui embaixo!",
        media_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200",
        media_type: "image",
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        likes: ["user_admin"],
        evaluations: { "user_admin": 4 },
        comments: []
      },
      {
        id: "ad-game-1",
        username: "Destaques da Semana Arena",
        userAvatarUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=150",
        text: "🔥 JOGO EM ALTA: Space Arena Retro! Pilote naves estilizadas com lasers neon, enfrente chefões colossais e suba no ranking global da Gamezone Arena. Desbloqueie a aura mística roxa exclusiva completando o estágio 5 sem perder vidas. Jogue agora mesmo clicando no link abaixo e garanta o dobro de bônus nas próximas 2 horas!",
        media_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200",
        media_type: "image",
        created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
        likes: [],
        evaluations: {},
        comments: [],
        isAd: true,
        adTitle: "🚀 Jogar Space Arena - XP em Dobro!",
        adActionUrl: "#play-arcade",
        adCategory: "game"
      },
      {
        id: "ad-shop-1",
        username: "Tiago Jorge Setup & Hardware Store",
        userAvatarUrl: "https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=150",
        text: "🖥️ SETUP GAMER COMPLETO COM DESCONTO REAL! Visite a minha loja oficial integrada na Gamezone. Temos teclados mecânicos RGB, mouses de alta precisão 16000 DPI e cadeiras ergonômicas premium para elevar sua gameplay. Clientes VIP Gamezone recebem frete grátis e parcelamento em até 12x sem juros! Confira!",
        media_url: "https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=1200",
        media_type: "image",
        created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
        likes: ["user_admin", "user_gamerpro99"],
        evaluations: { "user_admin": 5, "user_gamerpro99": 5 },
        comments: [],
        isAd: true,
        adTitle: "🛒 Visitar Loja Tiago Jorge Hardware",
        adActionUrl: "#user-store",
        adCategory: "shop"
      }
    ]
  };

  if (!fs.existsSync(DB_FILE_PATH)) {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(defaultSchema, null, 2), 'utf-8');
    return defaultSchema;
  }

  try {
    const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    // Ensure comments and evaluations have structure in existing DB
    if (!parsed.posts || parsed.posts.length === 0 || !parsed.posts[0].likes) {
      parsed.posts = defaultSchema.posts;
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch (err) {
    console.error('[SERVER DB] Error parsing database file, regenerating defaults:', err);
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(defaultSchema, null, 2), 'utf-8');
    return defaultSchema;
  }
}

// Memory cache of DB
let dbCache: ServerDatabaseSchema = initDatabase();

// Persist cache to disk
function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dbCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('[SERVER DB] Failed to persist database to disk:', err);
  }
}

// Database Methods
export const serverDb = {
  // Get all users
  getUsers: (): Record<string, UserAccount> => {
    return dbCache.users;
  },

  // Get user by clean ID (e.g., email or uid based)
  getUser: (userId: string): UserAccount | undefined => {
    return dbCache.users[userId];
  },

  // Save/register user
  saveUser: (userId: string, user: UserAccount): void => {
    dbCache.users[userId] = user;
    saveDatabase();
  },

  // Get user profile (stats, balance, limits)
  getProfile: (userId: string): UserProfile | undefined => {
    return dbCache.profiles[userId];
  },

  // Save user profile
  saveProfile: (userId: string, profile: UserProfile): void => {
    dbCache.profiles[userId] = profile;
    saveDatabase();
  },

  // Get transaction logs for user
  getLogs: (userId: string): TransactionLog[] => {
    return dbCache.logs[userId] || [];
  },

  // Append a transaction log
  addLog: (userId: string, log: TransactionLog): void => {
    if (!dbCache.logs[userId]) {
      dbCache.logs[userId] = [];
    }
    dbCache.logs[userId].push(log);
    // Sort descending by timestamp
    dbCache.logs[userId].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    saveDatabase();
  },

  // Get feed posts
  getPosts: (): FeedPost[] => {
    return dbCache.posts;
  },

  // Create feed post
  addPost: (post: FeedPost): void => {
    dbCache.posts.unshift(post);
    saveDatabase();
  },

  // Update complete posts array
  savePosts: (posts: FeedPost[]): void => {
    dbCache.posts = posts;
    saveDatabase();
  }
};
