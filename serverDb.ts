import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

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
  evaluations?: Record<string, number>; // key: userId, value: rating
  comments?: FeedComment[];
  isAd?: boolean;
  adTitle?: string;
  adActionUrl?: string;
  adCategory?: 'movie' | 'game' | 'shop';
}

const DB_FILE_PATH = path.join(process.cwd(), 'database.sqlite');

// Initialize better-sqlite3 database
const db = new Database(DB_FILE_PATH);

// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    senha_criptografada TEXT
  );

  CREATE TABLE IF NOT EXISTS perfis (
    usuario_id TEXT PRIMARY KEY REFERENCES usuarios(id),
    nome TEXT NOT NULL,
    avatar TEXT,
    stats TEXT,
    real_balance REAL DEFAULT 120.0,
    withdraw_limit REAL DEFAULT 100.0
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    texto TEXT NOT NULL,
    url_midia TEXT,
    usuario_id TEXT,
    curtidas TEXT DEFAULT '[]',
    media_type TEXT DEFAULT 'image',
    username TEXT,
    user_avatar_url TEXT,
    created_at TEXT NOT NULL,
    evaluations TEXT DEFAULT '{}',
    comments TEXT DEFAULT '[]',
    is_ad INTEGER DEFAULT 0,
    ad_title TEXT,
    ad_action_url TEXT,
    ad_category TEXT
  );

  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    security_hash TEXT
  );
`);

// Insert initial welcome posts if DB is empty
const postCountRow = db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number };
if (postCountRow.count === 0) {
  const adminId = 'user_admin_gamezone';
  db.prepare(`
    INSERT OR IGNORE INTO usuarios (id, email, senha_criptografada)
    VALUES (?, ?, ?)
  `).run(adminId, 'admin@gamezone.com', '$2b$10$K9/N58zTepU6fC7Z68n0re/G9i3K7sPqshN4VqU3q1r2UvX1Tq1vW'); // dummy bcrypt password 'admin123'

  db.prepare(`
    INSERT OR IGNORE INTO perfis (usuario_id, nome, avatar, stats, real_balance, withdraw_limit)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    adminId,
    'Admin Gamezone',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150',
    JSON.stringify({
      coins: 9999,
      lives: 99,
      currentStage: 10,
      highScore: 100000,
      unlockedSkins: ['classic', 'neon', 'retro'],
      unlockedAccessories: ['none', 'headset', 'glasses'],
      unlockedAuras: ['none', 'fire', 'matrix'],
      avatar: { skin: 'classic', accessory: 'none', aura: 'none' },
      points: 5000,
      level: 10
    }),
    9999.0,
    9999.0
  );

  // Insert initial post
  db.prepare(`
    INSERT INTO posts (id, texto, url_midia, usuario_id, curtidas, media_type, username, user_avatar_url, created_at, evaluations, comments, is_ad, ad_title, ad_action_url, ad_category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'post-1',
    '🎮 BEM-VINDO AO NOVO ARENA FEED! 🚀 O ponto de encontro oficial dos gamers de elite da Gamezone! Compartilhe capturas de tela dos seus maiores recordes, setups de tirar o fôlego ou assista aos gameplays incríveis diretamente do nosso player integrado. Comente, avalie os setups dos colegas, receba prêmios de interação e conquiste o prestígio lendário na comunidade! Deixe seu like e comece agora!',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200',
    adminId,
    JSON.stringify(['admin@gamezone.com']),
    'image',
    'Admin Gamezone',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150',
    new Date(Date.now() - 3600000 * 2).toISOString(),
    JSON.stringify({ 'admin@gamezone.com': 5 }),
    JSON.stringify([
      {
        id: 'comment-1',
        userId: 'admin@gamezone.com',
        username: 'Admin Gamezone',
        userAvatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150',
        text: 'Sinta-se livre para postar suas próprias mídias e setups!',
        created_at: new Date(Date.now() - 3600000 * 1.8).toISOString(),
        likes: [],
        replies: []
      }
    ]),
    0,
    null,
    null,
    null
  );

  // Insert Ad post
  db.prepare(`
    INSERT INTO posts (id, texto, url_midia, usuario_id, curtidas, media_type, username, user_avatar_url, created_at, evaluations, comments, is_ad, ad_title, ad_action_url, ad_category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'ad-movie-1',
    '🎬 LANÇAMENTO EXCLUSIVO! Chegou aos cinemas o épico espacial mais aguardado do ano. Prepare-se para uma experiência imersiva com efeitos especiais revolucionários e som de última geração nas salas IMAX de todo o país! Garanta já o seu ingresso na nossa bilheteria digital com 20% de desconto usando o cupom GAMEZONE20.',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200',
    'promo_ad',
    JSON.stringify([]),
    'image',
    'Cinema Multiplex Promovido',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=150',
    new Date(Date.now() - 3600000 * 3).toISOString(),
    JSON.stringify({}),
    JSON.stringify([]),
    1,
    '🎟️ Ingressos Cinema IMAX - 20% OFF',
    '#cinema-tickets',
    'movie'
  );
}

// Database Methods backed by SQLite
export const serverDb = {
  // Get all users
  getUsers: (): Record<string, UserAccount> => {
    const rows = db.prepare('SELECT usuarios.*, perfis.nome, perfis.avatar FROM usuarios LEFT JOIN perfis ON usuarios.id = perfis.usuario_id').all() as any[];
    const users: Record<string, UserAccount> = {};
    rows.forEach(row => {
      users[row.id] = {
        email: row.email,
        name: row.nome || 'Jogador',
        avatarUrl: row.avatar || undefined,
        provider: 'email',
        uid: row.id
      };
    });
    return users;
  },

  // Get user by clean ID (e.g., email or uid based)
  getUser: (userId: string): UserAccount | undefined => {
    const row = db.prepare('SELECT usuarios.*, perfis.nome, perfis.avatar FROM usuarios LEFT JOIN perfis ON usuarios.id = perfis.usuario_id WHERE usuarios.id = ?').get(userId) as any;
    if (!row) return undefined;
    return {
      email: row.email,
      password: row.senha_criptografada || undefined,
      name: row.nome || 'Jogador',
      avatarUrl: row.avatar || undefined,
      provider: 'email',
      uid: row.id
    };
  },

  // Get user by email
  getUserByEmail: (email: string): UserAccount | undefined => {
    const row = db.prepare('SELECT usuarios.*, perfis.nome, perfis.avatar FROM usuarios LEFT JOIN perfis ON usuarios.id = perfis.usuario_id WHERE usuarios.email = ?').get(email.trim().toLowerCase()) as any;
    if (!row) return undefined;
    return {
      email: row.email,
      password: row.senha_criptografada || undefined,
      name: row.nome || 'Jogador',
      avatarUrl: row.avatar || undefined,
      provider: 'email',
      uid: row.id
    };
  },

  // Save/register user
  saveUser: (userId: string, user: UserAccount): void => {
    db.prepare(`
      INSERT INTO usuarios (id, email, senha_criptografada)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET email=excluded.email, senha_criptografada=COALESCE(excluded.senha_criptografada, senha_criptografada)
    `).run(userId, user.email, user.password || null);

    db.prepare(`
      INSERT INTO perfis (usuario_id, nome, avatar)
      VALUES (?, ?, ?)
      ON CONFLICT(usuario_id) DO UPDATE SET nome=excluded.nome, avatar=COALESCE(excluded.avatar, avatar)
    `).run(userId, user.name, user.avatarUrl || null);
  },

  // Get user profile (stats, balance, limits)
  getProfile: (userId: string): UserProfile | undefined => {
    const row = db.prepare('SELECT * FROM perfis WHERE usuario_id = ?').get(userId) as any;
    if (!row) return undefined;
    
    let statsObj = {
      coins: 150,
      lives: 3,
      currentStage: 1,
      highScore: 0,
      unlockedSkins: ['classic'],
      unlockedAccessories: ['none'],
      unlockedAuras: ['none'],
      avatar: { skin: 'classic', accessory: 'none', aura: 'none' },
      points: 0,
      level: 1
    };

    if (row.stats) {
      try {
        statsObj = JSON.parse(row.stats);
      } catch (e) {
        console.error('Error parsing stats JSON from DB:', e);
      }
    }

    return {
      userId: row.usuario_id,
      stats: statsObj,
      realBalance: row.real_balance ?? 120.0,
      withdrawLimit: row.withdraw_limit ?? 100.0
    };
  },

  // Save user profile
  saveProfile: (userId: string, profile: UserProfile): void => {
    db.prepare(`
      INSERT INTO perfis (usuario_id, nome, avatar, stats, real_balance, withdraw_limit)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(usuario_id) DO UPDATE SET
        stats=excluded.stats,
        real_balance=excluded.real_balance,
        withdraw_limit=excluded.withdraw_limit
    `).run(
      userId,
      profile.userId, // use profile ID as placeholder for name
      null,
      JSON.stringify(profile.stats),
      profile.realBalance,
      profile.withdrawLimit
    );
  },

  // Get transaction logs for user
  getLogs: (userId: string): TransactionLog[] => {
    const rows = db.prepare('SELECT * FROM logs WHERE usuario_id = ? ORDER BY timestamp DESC').all(userId) as any[];
    return rows.map(row => ({
      id: row.id,
      userId: row.usuario_id,
      timestamp: row.timestamp,
      type: row.type,
      description: row.description,
      amount: row.amount,
      currency: row.currency as 'coins' | 'real',
      status: row.status,
      securityHash: row.security_hash || undefined
    }));
  },

  // Append a transaction log
  addLog: (userId: string, log: TransactionLog): void => {
    db.prepare(`
      INSERT INTO logs (id, usuario_id, timestamp, type, description, amount, currency, status, security_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      log.id,
      userId,
      log.timestamp,
      log.type,
      log.description,
      log.amount,
      log.currency,
      log.status,
      log.securityHash || null
    );
  },

  // Get feed posts in reverse chronological order
  getPosts: (): FeedPost[] => {
    const rows = db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all() as any[];
    return rows.map(row => {
      let likesArr: string[] = [];
      let evalsObj: Record<string, number> = {};
      let commentsArr: FeedComment[] = [];

      try { if (row.curtidas) likesArr = JSON.parse(row.curtidas); } catch (e) {}
      try { if (row.evaluations) evalsObj = JSON.parse(row.evaluations); } catch (e) {}
      try { if (row.comments) commentsArr = JSON.parse(row.comments); } catch (e) {}

      return {
        id: row.id,
        userId: row.usuario_id || undefined,
        username: row.username || 'Visitante',
        userAvatarUrl: row.user_avatar_url || undefined,
        text: row.texto,
        media_url: row.url_midia || undefined,
        media_type: (row.media_type as 'image' | 'video') || 'image',
        created_at: row.created_at,
        likes: likesArr,
        evaluations: evalsObj,
        comments: commentsArr,
        isAd: row.is_ad === 1,
        adTitle: row.ad_title || undefined,
        adActionUrl: row.ad_action_url || undefined,
        adCategory: (row.ad_category as 'movie' | 'game' | 'shop') || undefined
      };
    });
  },

  // Create feed post
  addPost: (post: FeedPost): void => {
    db.prepare(`
      INSERT INTO posts (id, texto, url_midia, usuario_id, curtidas, media_type, username, user_avatar_url, created_at, evaluations, comments, is_ad, ad_title, ad_action_url, ad_category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      post.id,
      post.text,
      post.media_url || null,
      post.userId || null,
      JSON.stringify(post.likes || []),
      post.media_type || 'image',
      post.username,
      post.userAvatarUrl || null,
      post.created_at,
      JSON.stringify(post.evaluations || {}),
      JSON.stringify(post.comments || []),
      post.isAd ? 1 : 0,
      post.adTitle || null,
      post.adActionUrl || null,
      post.adCategory || null
    );
  },

  // Update complete posts array (used to update individual comments or ratings easily)
  savePosts: (posts: FeedPost[]): void => {
    // In order to perform updates securely, we can upsert each post or update them.
    // For simplicity, we can do an individual update query for modified posts,
    // or run a transaction to refresh the posts. Since we have standard better-sqlite3,
    // let's iterate and update/insert posts.
    const insertOrReplace = db.transaction((postsList: FeedPost[]) => {
      for (const p of postsList) {
        db.prepare(`
          INSERT INTO posts (id, texto, url_midia, usuario_id, curtidas, media_type, username, user_avatar_url, created_at, evaluations, comments, is_ad, ad_title, ad_action_url, ad_category)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            texto=excluded.texto,
            url_midia=excluded.url_midia,
            usuario_id=excluded.usuario_id,
            curtidas=excluded.curtidas,
            media_type=excluded.media_type,
            username=excluded.username,
            user_avatar_url=excluded.user_avatar_url,
            created_at=excluded.created_at,
            evaluations=excluded.evaluations,
            comments=excluded.comments,
            is_ad=excluded.is_ad,
            ad_title=excluded.ad_title,
            ad_action_url=excluded.ad_action_url,
            ad_category=excluded.ad_category
        `).run(
          p.id,
          p.text,
          p.media_url || null,
          p.userId || null,
          JSON.stringify(p.likes || []),
          p.media_type || 'image',
          p.username,
          p.userAvatarUrl || null,
          p.created_at,
          JSON.stringify(p.evaluations || {}),
          JSON.stringify(p.comments || []),
          p.isAd ? 1 : 0,
          p.adTitle || null,
          p.adActionUrl || null,
          p.adCategory || null
        );
      }
    });
    insertOrReplace(posts);
  }
};
