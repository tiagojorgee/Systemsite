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
  // Extended configuration fields
  username?: string;
  biography?: string;
  avatarUrl?: string;
  avatarGallery?: string[];
  following?: string[]; // Array of user_ids followed
  followers?: string[]; // Array of user_ids following this profile
  stores?: any[];       // User's customized virtual stores
  files?: any[];        // File uploads meta-registry
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'text' | 'image' | 'audio';
  created_at: string;
  deleted: boolean;
  hiddenFor: string[]; // Array of user_ids who hid this message
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
  hiddenFor?: string[]; // Array of user_ids who hid this post
}

const DB_FILE_PATH = path.join(process.cwd(), 'database.sqlite');

// Initialize better-sqlite3 database
const db = new Database(DB_FILE_PATH);

// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');

// Create tables supporting profile settings, follows, stores, files and WhatsApp chat
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    senha_criptografada TEXT
  );

  CREATE TABLE IF NOT EXISTS perfis (
    usuario_id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    username TEXT,
    avatar TEXT,
    biografia TEXT,
    stats TEXT,
    real_balance REAL DEFAULT 120.0,
    withdraw_limit REAL DEFAULT 100.0,
    seguindo TEXT DEFAULT '[]',
    seguidores TEXT DEFAULT '[]',
    lojas TEXT DEFAULT '[]',
    arquivos TEXT DEFAULT '[]'
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
    ad_category TEXT,
    oculto_para TEXT DEFAULT '[]'
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

  CREATE TABLE IF NOT EXISTS mensagens (
    id TEXT PRIMARY KEY,
    remetente_id TEXT NOT NULL,
    destinatario_id TEXT NOT NULL,
    texto TEXT,
    url_midia TEXT,
    tipo_midia TEXT DEFAULT 'text',
    created_at TEXT NOT NULL,
    apagada INTEGER DEFAULT 0,
    oculta_para TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS filmes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    year INTEGER NOT NULL,
    rating TEXT NOT NULL,
    duration TEXT NOT NULL,
    match_score INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    youtube_id TEXT,
    tags TEXT NOT NULL,
    uploader_id TEXT NOT NULL,
    uploader_name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

// Migrate existing tables if they don't have the new columns
const runMigration = (table: string, column: string, definition: string) => {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  } catch (e) {
    // Column already exists, ignore error
  }
};

runMigration('perfis', 'username', 'TEXT');
runMigration('perfis', 'biografia', 'TEXT');
runMigration('perfis', 'seguindo', "TEXT DEFAULT '[]'");
runMigration('perfis', 'seguidores', "TEXT DEFAULT '[]'");
runMigration('perfis', 'lojas', "TEXT DEFAULT '[]'");
runMigration('perfis', 'arquivos', "TEXT DEFAULT '[]'");
runMigration('perfis', 'avatar_gallery', "TEXT DEFAULT '[]'");
runMigration('posts', 'oculto_para', "TEXT DEFAULT '[]'");
runMigration('mensagens', 'oculta_para', "TEXT DEFAULT '[]'");

// Insert initial welcome posts if DB is empty
const postCountRow = db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number };
if (postCountRow.count === 0) {
  const adminId = 'user_admin_gamezone';
  db.prepare(`
    INSERT OR IGNORE INTO usuarios (id, email, senha_criptografada)
    VALUES (?, ?, ?)
  `).run(adminId, 'admin@gamezone.com', '$2b$10$K9/N58zTepU6fC7Z68n0re/G9i3K7sPqshN4VqU3q1r2UvX1Tq1vW'); // dummy bcrypt password 'admin123'

  db.prepare(`
    INSERT OR IGNORE INTO perfis (usuario_id, nome, username, avatar, biografia, stats, real_balance, withdraw_limit, seguindo, seguidores, lojas, arquivos)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    adminId,
    'Admin Gamezone',
    'admin_gamezone',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150',
    'Conta de administração oficial da Gamezone. Junte-se à nossa comunidade!',
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
    9999.0,
    '[]',
    '[]',
    '[]',
    '[]'
  );

  // Insert initial post
  db.prepare(`
    INSERT INTO posts (id, texto, url_midia, usuario_id, curtidas, media_type, username, user_avatar_url, created_at, evaluations, comments, is_ad, ad_title, ad_action_url, ad_category, oculto_para)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    null,
    '[]'
  );

  // Insert Ad post
  db.prepare(`
    INSERT INTO posts (id, texto, url_midia, usuario_id, curtidas, media_type, username, user_avatar_url, created_at, evaluations, comments, is_ad, ad_title, ad_action_url, ad_category, oculto_para)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    'movie',
    '[]'
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

  // Get user by clean ID
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

    // Generate a clean, unique username if they don't have one
    const cleanName = user.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'jogador';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedUsername = `${cleanName}_${randomSuffix}`;

    db.prepare(`
      INSERT INTO perfis (usuario_id, nome, avatar, username)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(usuario_id) DO UPDATE SET nome=excluded.nome, avatar=COALESCE(excluded.avatar, avatar), username=COALESCE(username, excluded.username)
    `).run(userId, user.name, user.avatarUrl || null, generatedUsername);
  },

  // Get user profile (stats, balance, limits, biography, following, followers, stores, files)
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

    let followingArr: string[] = [];
    let followersArr: string[] = [];
    let storesArr: any[] = [];
    let filesArr: any[] = [];
    let avatarGalleryArr: string[] = [];

    try { if (row.seguindo) followingArr = JSON.parse(row.seguindo); } catch(e) {}
    try { if (row.seguidores) followersArr = JSON.parse(row.seguidores); } catch(e) {}
    try { if (row.lojas) storesArr = JSON.parse(row.lojas); } catch(e) {}
    try { if (row.arquivos) filesArr = JSON.parse(row.arquivos); } catch(e) {}
    try { if (row.avatar_gallery) avatarGalleryArr = JSON.parse(row.avatar_gallery); } catch(e) {}

    return {
      userId: row.usuario_id,
      stats: statsObj,
      realBalance: row.real_balance ?? 120.0,
      withdrawLimit: row.withdraw_limit ?? 100.0,
      username: row.username || undefined,
      biography: row.biografia || undefined,
      avatarUrl: row.avatar || undefined,
      avatarGallery: avatarGalleryArr,
      following: followingArr,
      followers: followersArr,
      stores: storesArr,
      files: filesArr
    };
  },

  // Save user profile
  saveProfile: (userId: string, profile: UserProfile): void => {
    // Ensure parent user row exists as a failsafe
    db.prepare(`
      INSERT OR IGNORE INTO usuarios (id, email, senha_criptografada)
      VALUES (?, ?, NULL)
    `).run(userId, userId.includes('@') ? userId : `${userId}@local.gamezone.com`);

    // Merge-update rather than overwrite details to preserve extended properties
    const existing = db.prepare('SELECT * FROM perfis WHERE usuario_id = ?').get(userId) as any;
    
    const finalUsername = profile.username || (existing ? existing.username : null);
    const finalBiografia = profile.biography || (existing ? existing.biografia : null);
    const finalSeguindo = profile.following ? JSON.stringify(profile.following) : (existing ? existing.seguindo : '[]');
    const finalSeguidores = profile.followers ? JSON.stringify(profile.followers) : (existing ? existing.seguidores : '[]');
    const finalLojas = profile.stores ? JSON.stringify(profile.stores) : (existing ? existing.lojas : '[]');
    const finalArquivos = profile.files ? JSON.stringify(profile.files) : (existing ? existing.arquivos : '[]');
    const finalAvatarGallery = profile.avatarGallery ? JSON.stringify(profile.avatarGallery) : (existing ? existing.avatar_gallery : '[]');

    db.prepare(`
      INSERT INTO perfis (usuario_id, nome, username, avatar, biografia, stats, real_balance, withdraw_limit, seguindo, seguidores, lojas, arquivos, avatar_gallery)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(usuario_id) DO UPDATE SET
        stats=excluded.stats,
        real_balance=excluded.real_balance,
        withdraw_limit=excluded.withdraw_limit,
        username=COALESCE(excluded.username, username),
        biografia=COALESCE(excluded.biografia, biografia),
        seguindo=COALESCE(excluded.seguindo, seguindo),
        seguidores=COALESCE(excluded.seguidores, seguidores),
        lojas=COALESCE(excluded.lojas, lojas),
        arquivos=COALESCE(excluded.arquivos, arquivos),
        avatar_gallery=COALESCE(excluded.avatar_gallery, avatar_gallery)
    `).run(
      userId,
      userId.includes('@') ? userId.split('@')[0] : userId,
      finalUsername,
      profile.avatarUrl || (existing ? existing.avatar : null),
      finalBiografia,
      JSON.stringify(profile.stats),
      profile.realBalance,
      profile.withdrawLimit,
      finalSeguindo,
      finalSeguidores,
      finalLojas,
      finalArquivos,
      finalAvatarGallery
    );
  },

  // Update profile details specifically
  updateProfileDetails: (
    userId: string, 
    details: { name?: string; username?: string; biography?: string; avatar?: string; stores?: any[]; files?: any[]; avatarGallery?: string[] }
  ): void => {
    // Ensure parent user row exists
    db.prepare(`
      INSERT OR IGNORE INTO usuarios (id, email, senha_criptografada)
      VALUES (?, ?, NULL)
    `).run(userId, userId.includes('@') ? userId : `${userId}@local.gamezone.com`);

    // Ensure profile row exists
    db.prepare(`
      INSERT OR IGNORE INTO perfis (usuario_id, nome, username, avatar, biografia)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      userId, 
      details.name || (userId.includes('@') ? userId.split('@')[0] : userId),
      details.username || null,
      details.avatar || null,
      details.biography || null
    );

    if (details.name !== undefined) {
      db.prepare('UPDATE perfis SET nome = ? WHERE usuario_id = ?').run(details.name, userId);
    }
    if (details.username !== undefined) {
      db.prepare('UPDATE perfis SET username = ? WHERE usuario_id = ?').run(details.username, userId);
    }
    if (details.biography !== undefined) {
      db.prepare('UPDATE perfis SET biografia = ? WHERE usuario_id = ?').run(details.biography, userId);
    }
    if (details.avatar !== undefined) {
      db.prepare('UPDATE perfis SET avatar = ? WHERE usuario_id = ?').run(details.avatar, userId);
    }
    if (details.stores !== undefined) {
      db.prepare('UPDATE perfis SET lojas = ? WHERE usuario_id = ?').run(JSON.stringify(details.stores), userId);
    }
    if (details.files !== undefined) {
      db.prepare('UPDATE perfis SET arquivos = ? WHERE usuario_id = ?').run(JSON.stringify(details.files), userId);
    }
    if (details.avatarGallery !== undefined) {
      db.prepare('UPDATE perfis SET avatar_gallery = ? WHERE usuario_id = ?').run(JSON.stringify(details.avatarGallery), userId);
    }

    // Sync posts display username and avatar URL instantly!
    const current = db.prepare('SELECT nome, username, avatar FROM perfis WHERE usuario_id = ?').get(userId) as any;
    if (current) {
      const finalDisplayName = current.username ? `@${current.username}` : current.nome;
      const finalAvatarUrl = current.avatar || '';
      db.prepare('UPDATE posts SET username = ?, user_avatar_url = ? WHERE usuario_id = ?').run(
        finalDisplayName,
        finalAvatarUrl,
        userId
      );
    }
  },

  // Check if a username is already taken by another user
  checkUsernameExists: (username: string, excludeUserId?: string): boolean => {
    try {
      const row = db.prepare('SELECT 1 FROM perfis WHERE username = ? AND usuario_id != ?').get(username, excludeUserId || '') as any;
      return !!row;
    } catch (e) {
      return false;
    }
  },

  // Follow/Unfollow user operation
  toggleFollow: (senderId: string, targetId: string): { following: string[]; followers: string[] } => {
    // Fetch sender profile
    let senderProf = serverDb.getProfile(senderId);
    if (!senderProf) {
      // Create lazy profile
      serverDb.saveProfile(senderId, {
        userId: senderId,
        stats: { coins: 150, lives: 3, currentStage: 1, highScore: 0, unlockedSkins: ['classic'], unlockedAccessories: ['none'], unlockedAuras: ['none'], avatar: { skin: 'classic', accessory: 'none', aura: 'none' } },
        realBalance: 120,
        withdrawLimit: 100
      });
      senderProf = serverDb.getProfile(senderId)!;
    }

    // Fetch target profile
    let targetProf = serverDb.getProfile(targetId);
    if (!targetProf) {
      serverDb.saveProfile(targetId, {
        userId: targetId,
        stats: { coins: 150, lives: 3, currentStage: 1, highScore: 0, unlockedSkins: ['classic'], unlockedAccessories: ['none'], unlockedAuras: ['none'], avatar: { skin: 'classic', accessory: 'none', aura: 'none' } },
        realBalance: 120,
        withdrawLimit: 100
      });
      targetProf = serverDb.getProfile(targetId)!;
    }

    const currentFollowing = senderProf.following || [];
    const currentFollowers = targetProf.followers || [];

    const followingIndex = currentFollowing.indexOf(targetId);
    if (followingIndex > -1) {
      // Unfollow
      currentFollowing.splice(followingIndex, 1);
      const followerIndex = currentFollowers.indexOf(senderId);
      if (followerIndex > -1) {
        currentFollowers.splice(followerIndex, 1);
      }
    } else {
      // Follow
      currentFollowing.push(targetId);
      if (!currentFollowers.includes(senderId)) {
        currentFollowers.push(senderId);
      }
    }

    db.prepare('UPDATE perfis SET seguindo = ? WHERE usuario_id = ?').run(JSON.stringify(currentFollowing), senderId);
    db.prepare('UPDATE perfis SET seguidores = ? WHERE usuario_id = ?').run(JSON.stringify(currentFollowers), targetId);

    return { following: currentFollowing, followers: currentFollowers };
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
      let hiddenArr: string[] = [];

      try { if (row.curtidas) likesArr = JSON.parse(row.curtidas); } catch (e) {}
      try { if (row.evaluations) evalsObj = JSON.parse(row.evaluations); } catch (e) {}
      try { if (row.comments) commentsArr = JSON.parse(row.comments); } catch (e) {}
      try { if (row.oculto_para) hiddenArr = JSON.parse(row.oculto_para); } catch (e) {}

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
        adCategory: (row.ad_category as 'movie' | 'game' | 'shop') || undefined,
        hiddenFor: hiddenArr
      };
    });
  },

  // Create feed post
  addPost: (post: FeedPost): void => {
    db.prepare(`
      INSERT INTO posts (id, texto, url_midia, usuario_id, curtidas, media_type, username, user_avatar_url, created_at, evaluations, comments, is_ad, ad_title, ad_action_url, ad_category, oculto_para)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      post.adCategory || null,
      JSON.stringify(post.hiddenFor || [])
    );
  },

  // Delete post
  deletePost: (postId: string, userId: string): boolean => {
    const result = db.prepare('DELETE FROM posts WHERE id = ? AND usuario_id = ?').run(postId, userId);
    return result.changes > 0;
  },

  // Hide post for a specific user
  hidePost: (postId: string, userId: string): boolean => {
    const row = db.prepare('SELECT oculto_para FROM posts WHERE id = ?').get(postId) as any;
    if (!row) return false;

    let hiddenArr: string[] = [];
    try {
      if (row.oculto_para) {
        hiddenArr = JSON.parse(row.oculto_para);
      }
    } catch(e) {}

    if (!hiddenArr.includes(userId)) {
      hiddenArr.push(userId);
    }

    db.prepare('UPDATE posts SET oculto_para = ? WHERE id = ?').run(JSON.stringify(hiddenArr), postId);
    return true;
  },

  // Update complete posts array
  savePosts: (posts: FeedPost[]): void => {
    const insertOrReplace = db.transaction((postsList: FeedPost[]) => {
      for (const p of postsList) {
        db.prepare(`
          INSERT INTO posts (id, texto, url_midia, usuario_id, curtidas, media_type, username, user_avatar_url, created_at, evaluations, comments, is_ad, ad_title, ad_action_url, ad_category, oculto_para)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            ad_category=excluded.ad_category,
            oculto_para=excluded.oculto_para
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
          p.adCategory || null,
          JSON.stringify(p.hiddenFor || [])
        );
      }
    });
    insertOrReplace(posts);
  },

  // WhatsApp-like Chat Methods
  getMessages: (userA: string, userB: string): ChatMessage[] => {
    const rows = db.prepare(`
      SELECT * FROM mensagens 
      WHERE (remetente_id = ? AND destinatario_id = ?) 
         OR (remetente_id = ? AND destinatario_id = ?)
      ORDER BY created_at ASC
    `).all(userA, userB, userB, userA) as any[];

    return rows.map(row => {
      let hiddenForArr: string[] = [];
      try {
        if (row.oculta_para) {
          hiddenForArr = JSON.parse(row.oculta_para);
        }
      } catch (e) {}

      return {
        id: row.id,
        senderId: row.remetente_id,
        receiverId: row.destinatario_id,
        text: row.texto || undefined,
        mediaUrl: row.url_midia || undefined,
        mediaType: row.tipo_midia as any,
        created_at: row.created_at,
        deleted: row.apagada === 1,
        hiddenFor: hiddenForArr
      };
    });
  },

  getNewMessagesForReceiver: (userId: string, lastChecked: string): ChatMessage[] => {
    const rows = db.prepare(`
      SELECT * FROM mensagens 
      WHERE destinatario_id = ? AND created_at > ? AND apagada = 0
      ORDER BY created_at ASC
    `).all(userId, lastChecked) as any[];

    return rows.map(row => {
      let hiddenForArr: string[] = [];
      try {
        if (row.oculta_para) {
          hiddenForArr = JSON.parse(row.oculta_para);
        }
      } catch (e) {}

      return {
        id: row.id,
        senderId: row.remetente_id,
        receiverId: row.destinatario_id,
        text: row.texto || undefined,
        mediaUrl: row.url_midia || undefined,
        mediaType: row.tipo_midia as any,
        created_at: row.created_at,
        deleted: row.apagada === 1,
        hiddenFor: hiddenForArr
      };
    });
  },

  addMessage: (message: ChatMessage): void => {
    db.prepare(`
      INSERT INTO mensagens (id, remetente_id, destinatario_id, texto, url_midia, tipo_midia, created_at, apagada, oculta_para)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      message.id,
      message.senderId,
      message.receiverId,
      message.text || null,
      message.mediaUrl || null,
      message.mediaType || 'text',
      message.created_at,
      message.deleted ? 1 : 0,
      JSON.stringify(message.hiddenFor || [])
    );
  },

  deleteMessage: (messageId: string): boolean => {
    const result = db.prepare('UPDATE mensagens SET apagada = 1, texto = "🚫 Esta mensagem foi apagada" WHERE id = ?').run(messageId);
    return result.changes > 0;
  },

  hideMessage: (messageId: string, userId: string): boolean => {
    const row = db.prepare('SELECT oculta_para FROM mensagens WHERE id = ?').get(messageId) as any;
    if (!row) return false;

    let hiddenForArr: string[] = [];
    try {
      if (row.oculta_para) {
        hiddenForArr = JSON.parse(row.oculta_para);
      }
    } catch(e) {}

    if (!hiddenForArr.includes(userId)) {
      hiddenForArr.push(userId);
    }

    db.prepare('UPDATE mensagens SET oculta_para = ? WHERE id = ?').run(JSON.stringify(hiddenForArr), messageId);
    return true;
  },

  getMovies: (): any[] => {
    const rows = db.prepare('SELECT * FROM filmes ORDER BY created_at DESC').all() as any[];
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      category: row.category,
      year: row.year,
      rating: row.rating,
      duration: row.duration,
      match_score: row.match_score,
      image_url: row.image_url,
      youtube_id: row.youtube_id || undefined,
      tags: JSON.parse(row.tags || '[]'),
      uploaderId: row.uploader_id,
      uploaderName: row.uploader_name,
      createdAt: row.created_at
    }));
  },

  addMovie: (movie: any): void => {
    db.prepare(`
      INSERT OR REPLACE INTO filmes (id, title, description, category, year, rating, duration, match_score, image_url, youtube_id, tags, uploader_id, uploader_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      movie.id,
      movie.title,
      movie.description || '',
      movie.category,
      movie.year,
      movie.rating,
      movie.duration,
      movie.match_score,
      movie.image_url,
      movie.youtube_id || null,
      JSON.stringify(movie.tags || []),
      movie.uploaderId,
      movie.uploaderName,
      movie.createdAt || new Date().toISOString()
    );
  },

  getProfilesWithStores: (): any[] => {
    return db.prepare('SELECT usuario_id, nome, avatar, lojas FROM perfis').all() as any[];
  }
};
