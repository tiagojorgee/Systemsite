import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import crypto from 'crypto';

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
  
  // Advanced Profile Module additions
  bannerUrl?: string;
  links?: string[];
  location?: string;
  socialNetworks?: {
    twitter?: string;
    youtube?: string;
    instagram?: string;
    discord?: string;
  };
  badges?: string[];
  conquistas?: string[];
  inventario?: any[];
  historico?: any[];
  amigos?: string[];
  solicitacoesAmizade?: string[]; // Pending friend request userIds
  bloqueados?: string[]; // Blocked userIds
  denuncias?: any[]; // Report entries
  statusOnline?: string; // 'online' | 'busy' | 'offline'
  ultimaAtividade?: string;
  reputacao?: number;
  verificado?: boolean;
  premium?: boolean;
  reputacaoVotos?: Record<string, 'up' | 'down'>; // key: userId, value: 'up' | 'down'
  privacySettings?: {
    privateProfile: boolean;
    hideCoins: boolean;
    hideHistory: boolean;
    hideFollowers: boolean;
    hideFriends: boolean;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'text' | 'image' | 'audio' | 'video' | 'file' | 'gif' | 'sticker';
  created_at: string;
  deleted: boolean;
  hiddenFor: string[]; // Array of user_ids who hid this message
  reply_to_id?: string;
  reactions?: string; // JSON string of reactions: Array<{ userId: string, emoji: string, userName: string }>
  pinned?: boolean;
  is_encrypted?: boolean;
  expires_at?: string;
  group_id?: string;
  is_channel?: boolean;
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

export interface Story {
  id: string;
  usuario_id?: string;
  username: string;
  user_avatar_url?: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  bg_color?: string;
  text?: string;
  created_at: string;
  expires_at: string;
  is_flagged?: boolean;
  flag_reason?: string;
  ai_mod_verdict?: any;
}

export interface SocialGroup {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  avatar_url?: string;
  banner_url?: string;
  type?: 'group' | 'community';
  member_count?: number;
  created_at: string;
}

export interface SocialEvent {
  id: string;
  title: string;
  description?: string;
  creator_id: string;
  date: string;
  location?: string;
  avatar_url?: string;
  banner_url?: string;
  created_at: string;
}

export interface SocialPage {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  avatar_url?: string;
  banner_url?: string;
  category?: string;
  created_at: string;
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
  shared_post_id?: string;
  scoped_type?: string; // 'feed' | 'group' | 'community' | 'event' | 'page'
  scoped_id?: string;
  saved_by?: string[]; // array of userIds
  reactions?: Record<string, string[]>; // key: emoji reaction name, value: array of userIds
  is_flagged?: boolean;
  flag_reason?: string;
  ai_mod_verdict?: any;
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

  CREATE TABLE IF NOT EXISTS logs_auditoria (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    evento TEXT NOT NULL,
    detalhes TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TEXT NOT NULL,
    signature TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bloqueios_ip (
    ip TEXT PRIMARY KEY,
    tentativas INTEGER DEFAULT 0,
    bloqueado_ate TEXT
  );

  CREATE TABLE IF NOT EXISTS tokens_refresh (
    token TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    expira_em TEXT NOT NULL,
    revogado INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS lgpd_solicitacoes (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    tipo TEXT NOT NULL,
    status TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessoes_ativas (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    token_jti TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    dispositivo TEXT NOT NULL,
    localizacao TEXT NOT NULL,
    criado_em TEXT NOT NULL,
    ultimo_acesso TEXT NOT NULL,
    ativa INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS historico_login (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    dispositivo TEXT NOT NULL,
    localizacao TEXT NOT NULL,
    status TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    suspeito INTEGER DEFAULT 0,
    motivo_suspeito TEXT
  );

  CREATE TABLE IF NOT EXISTS gamezon_marketplace (
    id TEXT PRIMARY KEY,
    seller_id TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    currency TEXT NOT NULL,
    rarity TEXT DEFAULT 'common',
    created_at TEXT NOT NULL,
    status TEXT DEFAULT 'active'
  );
`);

// --- INITIALIZATION OF THE 22 HIGHLY NORMALIZED ENTERPRISE-GRADE SCHEMAS ---
db.exec(`
  -- 1. Users Table
  CREATE TABLE IF NOT EXISTS normalized_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT
  );

  -- 2. Profiles Table
  CREATE TABLE IF NOT EXISTS normalized_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    status TEXT DEFAULT 'offline',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT,
    FOREIGN KEY(user_id) REFERENCES normalized_users(id) ON DELETE CASCADE
  );

  -- 3. Friendships Table
  CREATE TABLE IF NOT EXISTS normalized_friendships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    friend_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT,
    FOREIGN KEY(user_id) REFERENCES normalized_users(id) ON DELETE CASCADE,
    FOREIGN KEY(friend_id) REFERENCES normalized_users(id) ON DELETE CASCADE,
    UNIQUE(user_id, friend_id)
  );

  -- 4. Followers Table
  CREATE TABLE IF NOT EXISTS normalized_followers (
    id TEXT PRIMARY KEY,
    follower_id TEXT NOT NULL,
    followed_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT,
    FOREIGN KEY(follower_id) REFERENCES normalized_users(id) ON DELETE CASCADE,
    FOREIGN KEY(followed_id) REFERENCES normalized_users(id) ON DELETE CASCADE,
    UNIQUE(follower_id, followed_id)
  );

  -- 5. Messages Table
  CREATE TABLE IF NOT EXISTS normalized_messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    text_content TEXT,
    media_url TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT,
    FOREIGN KEY(sender_id) REFERENCES normalized_users(id) ON DELETE CASCADE,
    FOREIGN KEY(receiver_id) REFERENCES normalized_users(id) ON DELETE CASCADE
  );

  -- 6. Comments Table
  CREATE TABLE IF NOT EXISTS normalized_comments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT,
    FOREIGN KEY(user_id) REFERENCES normalized_users(id) ON DELETE CASCADE
  );

  -- 7. Likes Table
  CREATE TABLE IF NOT EXISTS normalized_likes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT,
    FOREIGN KEY(user_id) REFERENCES normalized_users(id) ON DELETE CASCADE,
    UNIQUE(user_id, target_type, target_id)
  );

  -- 8. Notifications Table
  CREATE TABLE IF NOT EXISTS normalized_notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT,
    FOREIGN KEY(user_id) REFERENCES normalized_users(id) ON DELETE CASCADE
  );

  -- 9. Games Table
  CREATE TABLE IF NOT EXISTS normalized_games (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    genre TEXT NOT NULL,
    description TEXT,
    rtp_percentage REAL DEFAULT 96.5,
    cover_image_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT
  );

  -- 10. Items Table
  CREATE TABLE IF NOT EXISTS normalized_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    base_price_coins INTEGER NOT NULL,
    rarity TEXT DEFAULT 'common',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT
  );

  -- 11. Inventory Table
  CREATE TABLE IF NOT EXISTS normalized_inventory (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    equipped INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT,
    FOREIGN KEY(user_id) REFERENCES normalized_users(id) ON DELETE CASCADE,
    FOREIGN KEY(item_id) REFERENCES normalized_items(id) ON DELETE CASCADE
  );

  -- 12. Currencies Table
  CREATE TABLE IF NOT EXISTS normalized_currencies (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    coins_amount INTEGER DEFAULT 1000,
    real_balance_amount REAL DEFAULT 120.0,
    withdraw_limit REAL DEFAULT 100.0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT,
    FOREIGN KEY(user_id) REFERENCES normalized_users(id) ON DELETE CASCADE
  );

  -- 13. Payments Table
  CREATE TABLE IF NOT EXISTS normalized_payments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency_type TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL,
    description TEXT,
    transaction_hash TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT,
    FOREIGN KEY(user_id) REFERENCES normalized_users(id) ON DELETE CASCADE
  );

  -- 14. Subscriptions Table
  CREATE TABLE IF NOT EXISTS normalized_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    plan_name TEXT NOT NULL,
    price_per_month REAL NOT NULL,
    status TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT,
    FOREIGN KEY(user_id) REFERENCES normalized_users(id) ON DELETE CASCADE
  );

  -- 15. Streaming Table
  CREATE TABLE IF NOT EXISTS normalized_streaming (
    id TEXT PRIMARY KEY,
    broadcaster_id TEXT NOT NULL,
    title TEXT NOT NULL,
    game_id TEXT,
    stream_url TEXT,
    viewers_count INTEGER DEFAULT 0,
    is_live INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT,
    FOREIGN KEY(broadcaster_id) REFERENCES normalized_users(id) ON DELETE CASCADE,
    FOREIGN KEY(game_id) REFERENCES normalized_games(id) ON DELETE SET NULL
  );

  -- 16. Marketplace Table
  CREATE TABLE IF NOT EXISTS normalized_marketplace (
    id TEXT PRIMARY KEY,
    seller_id TEXT NOT NULL,
    store_name TEXT NOT NULL,
    commission_rate REAL DEFAULT 0.10,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT,
    FOREIGN KEY(seller_id) REFERENCES normalized_users(id) ON DELETE CASCADE
  );

  -- 17. Products Table
  CREATE TABLE IF NOT EXISTS normalized_products (
    id TEXT PRIMARY KEY,
    marketplace_id TEXT NOT NULL,
    title TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_available INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT,
    FOREIGN KEY(marketplace_id) REFERENCES normalized_marketplace(id) ON DELETE CASCADE
  );

  -- 18. Orders Table
  CREATE TABLE IF NOT EXISTS normalized_orders (
    id TEXT PRIMARY KEY,
    buyer_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    total_price REAL NOT NULL,
    commission_amount REAL NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT,
    FOREIGN KEY(buyer_id) REFERENCES normalized_users(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES normalized_products(id) ON DELETE CASCADE
  );

  -- 19. Reports Table
  CREATE TABLE IF NOT EXISTS normalized_reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL,
    reported_user_id TEXT,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT,
    FOREIGN KEY(reporter_id) REFERENCES normalized_users(id) ON DELETE CASCADE,
    FOREIGN KEY(reported_user_id) REFERENCES normalized_users(id) ON DELETE CASCADE
  );

  -- 20. Database Operation Logs Table
  CREATE TABLE IF NOT EXISTS normalized_db_operation_logs (
    id TEXT PRIMARY KEY,
    operator_id TEXT,
    table_name TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    payload_before TEXT,
    payload_after TEXT,
    security_signature TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT,
    FOREIGN KEY(operator_id) REFERENCES normalized_users(id) ON DELETE SET NULL
  );

  -- 21. Permissions Table
  CREATE TABLE IF NOT EXISTS normalized_permissions (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    is_granted INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT
  );

  -- 22. Audited History Table
  CREATE TABLE IF NOT EXISTS normalized_audited_history (
    id TEXT PRIMARY KEY,
    action_type TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    hmac_signature TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    audit_created_by TEXT,
    audit_updated_by TEXT
  );

  -- ----------------- HIGH PERFORMANCE RELATIONAL INDEXES -----------------
  CREATE INDEX IF NOT EXISTS idx_norm_users_email ON normalized_users(email);
  CREATE INDEX IF NOT EXISTS idx_norm_users_deleted_at ON normalized_users(deleted_at);

  CREATE INDEX IF NOT EXISTS idx_norm_profiles_user ON normalized_profiles(user_id);
  CREATE INDEX IF NOT EXISTS idx_norm_profiles_username ON normalized_profiles(username);
  CREATE INDEX IF NOT EXISTS idx_norm_profiles_deleted_at ON normalized_profiles(deleted_at);

  CREATE INDEX IF NOT EXISTS idx_norm_friendships_user ON normalized_friendships(user_id);
  CREATE INDEX IF NOT EXISTS idx_norm_friendships_friend ON normalized_friendships(friend_id);
  CREATE INDEX IF NOT EXISTS idx_norm_friendships_status ON normalized_friendships(status);

  CREATE INDEX IF NOT EXISTS idx_norm_followers_follower ON normalized_followers(follower_id);
  CREATE INDEX IF NOT EXISTS idx_norm_followers_followed ON normalized_followers(followed_id);

  CREATE INDEX IF NOT EXISTS idx_norm_messages_sender ON normalized_messages(sender_id);
  CREATE INDEX IF NOT EXISTS idx_norm_messages_receiver ON normalized_messages(receiver_id);
  CREATE INDEX IF NOT EXISTS idx_norm_messages_deleted_at ON normalized_messages(deleted_at);

  CREATE INDEX IF NOT EXISTS idx_norm_comments_user ON normalized_comments(user_id);
  CREATE INDEX IF NOT EXISTS idx_norm_comments_target ON normalized_comments(target_type, target_id);
  CREATE INDEX IF NOT EXISTS idx_norm_comments_deleted_at ON normalized_comments(deleted_at);

  CREATE INDEX IF NOT EXISTS idx_norm_likes_user ON normalized_likes(user_id);
  CREATE INDEX IF NOT EXISTS idx_norm_likes_target ON normalized_likes(target_type, target_id);

  CREATE INDEX IF NOT EXISTS idx_norm_notifications_user ON normalized_notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_norm_notifications_is_read ON normalized_notifications(is_read);

  CREATE INDEX IF NOT EXISTS idx_norm_inventory_user ON normalized_inventory(user_id);
  CREATE INDEX IF NOT EXISTS idx_norm_inventory_item ON normalized_inventory(item_id);

  CREATE INDEX IF NOT EXISTS idx_norm_payments_user ON normalized_payments(user_id);
  CREATE INDEX IF NOT EXISTS idx_norm_payments_status ON normalized_payments(status);

  CREATE INDEX IF NOT EXISTS idx_norm_products_market ON normalized_products(marketplace_id);
  CREATE INDEX IF NOT EXISTS idx_norm_products_category ON normalized_products(category);

  CREATE INDEX IF NOT EXISTS idx_norm_orders_buyer ON normalized_orders(buyer_id);
  CREATE INDEX IF NOT EXISTS idx_norm_orders_product ON normalized_orders(product_id);

  CREATE INDEX IF NOT EXISTS idx_norm_reports_reporter ON normalized_reports(reporter_id);
  CREATE INDEX IF NOT EXISTS idx_norm_reports_reported ON normalized_reports(reported_user_id);
  CREATE INDEX IF NOT EXISTS idx_norm_reports_status ON normalized_reports(status);

  CREATE INDEX IF NOT EXISTS idx_norm_db_op_logs_table ON normalized_db_operation_logs(table_name);
  CREATE INDEX IF NOT EXISTS idx_norm_db_op_logs_op ON normalized_db_operation_logs(operation_type);

  CREATE INDEX IF NOT EXISTS idx_norm_permissions_role ON normalized_permissions(role);
  CREATE INDEX IF NOT EXISTS idx_norm_audit_history_type ON normalized_audited_history(action_type);
`);

// Migrate existing tables if they don't have the new columns
const runMigration = (table: string, column: string, definition: string) => {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  } catch (e) {
    // Column already exists, ignore error
  }
};

runMigration('usuarios', 'role', "TEXT DEFAULT 'user'");
runMigration('usuarios', 'two_factor_secret', "TEXT");
runMigration('usuarios', 'two_factor_enabled', "INTEGER DEFAULT 0");
runMigration('usuarios', 'two_factor_backup_codes', "TEXT");
runMigration('usuarios', 'email_verificado', "INTEGER DEFAULT 0");
runMigration('usuarios', 'codigo_verificacao', "TEXT");
runMigration('usuarios', 'codigo_recuperacao', "TEXT");
runMigration('usuarios', 'recuperacao_expira', "TEXT");

runMigration('perfis', 'username', 'TEXT');
runMigration('perfis', 'biografia', 'TEXT');
runMigration('perfis', 'seguindo', "TEXT DEFAULT '[]'");
runMigration('perfis', 'seguidores', "TEXT DEFAULT '[]'");
runMigration('perfis', 'lojas', "TEXT DEFAULT '[]'");
runMigration('perfis', 'arquivos', "TEXT DEFAULT '[]'");
runMigration('perfis', 'avatar_gallery', "TEXT DEFAULT '[]'");
runMigration('perfis', 'perfil_privado', "INTEGER DEFAULT 0");
runMigration('perfis', 'esconder_moedas', "INTEGER DEFAULT 0");
runMigration('perfis', 'esconder_historico', "INTEGER DEFAULT 0");
runMigration('perfis', 'esconder_seguidores', "INTEGER DEFAULT 0");

// New columns for Advanced Profile Module
runMigration('perfis', 'banner', "TEXT DEFAULT ''");
runMigration('perfis', 'links', "TEXT DEFAULT '[]'");
runMigration('perfis', 'localizacao', "TEXT DEFAULT ''");
runMigration('perfis', 'redes_sociais', "TEXT DEFAULT '{}'");
runMigration('perfis', 'badges', "TEXT DEFAULT '[]'");
runMigration('perfis', 'conquistas', "TEXT DEFAULT '[]'");
runMigration('perfis', 'inventario', "TEXT DEFAULT '[]'");
runMigration('perfis', 'historico', "TEXT DEFAULT '[]'");
runMigration('perfis', 'amigos', "TEXT DEFAULT '[]'");
runMigration('perfis', 'solicitacoes_amizade', "TEXT DEFAULT '[]'");
runMigration('perfis', 'bloqueados', "TEXT DEFAULT '[]'");
runMigration('perfis', 'denuncias', "TEXT DEFAULT '[]'");
runMigration('perfis', 'status_online', "TEXT DEFAULT 'offline'");
runMigration('perfis', 'ultima_atividade', "TEXT DEFAULT ''");
runMigration('perfis', 'reputacao', "INTEGER DEFAULT 0");
runMigration('perfis', 'verificado', "INTEGER DEFAULT 0");
runMigration('perfis', 'premium', "INTEGER DEFAULT 0");
runMigration('perfis', 'reputacao_votos', "TEXT DEFAULT '{}'");

runMigration('posts', 'oculto_para', "TEXT DEFAULT '[]'");
runMigration('mensagens', 'oculta_para', "TEXT DEFAULT '[]'");

// --- ADVANCED E-COMMERCE / MARKETPLACE ENTERPRISE MIGRATIONS ---
runMigration('normalized_marketplace', 'custom_url', "TEXT");
runMigration('normalized_marketplace', 'logo_url', "TEXT");
runMigration('normalized_marketplace', 'banner_url', "TEXT");
runMigration('normalized_marketplace', 'theme', "TEXT DEFAULT 'default'");
runMigration('normalized_marketplace', 'description', "TEXT");
runMigration('normalized_marketplace', 'categories', "TEXT DEFAULT '[]'");
runMigration('normalized_marketplace', 'reputation', "REAL DEFAULT 5.0");

runMigration('normalized_products', 'type', "TEXT DEFAULT 'physical'");
runMigration('normalized_products', 'stock', "INTEGER DEFAULT 10");
runMigration('normalized_products', 'variations', "TEXT DEFAULT '[]'");
runMigration('normalized_products', 'sku', "TEXT");
runMigration('normalized_products', 'images', "TEXT DEFAULT '[]'");
runMigration('normalized_products', 'video_url', "TEXT");
runMigration('normalized_products', 'digital_file_url', "TEXT");
runMigration('normalized_products', 'subscription_plan', "TEXT DEFAULT '{}'");

runMigration('normalized_orders', 'quantity', "INTEGER DEFAULT 1");
runMigration('normalized_orders', 'shipping_address', "TEXT");
runMigration('normalized_orders', 'shipping_tracking_code', "TEXT");
runMigration('normalized_orders', 'variation_selected', "TEXT");

// Create reviews, questions, wishlist tables if they don't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS normalized_reviews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES normalized_users(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES normalized_products(id) ON DELETE CASCADE
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS normalized_questions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    answered_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES normalized_users(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES normalized_products(id) ON DELETE CASCADE
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS normalized_wishlist (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES normalized_users(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES normalized_products(id) ON DELETE CASCADE,
    UNIQUE(user_id, product_id)
  );
`).run();

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

// --- PAYMENTS INFRASTRUCTURE SCHEMAS ---
db.exec(`
  CREATE TABLE IF NOT EXISTS payment_coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, -- 'percent' | 'fixed'
    value REAL NOT NULL,
    active INTEGER DEFAULT 1,
    max_uses INTEGER DEFAULT 100,
    uses INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS payment_affiliates (
    id TEXT PRIMARY KEY,
    affiliate_id TEXT NOT NULL,
    referred_user_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payment_commissions (
    id TEXT PRIMARY KEY,
    affiliate_id TEXT NOT NULL,
    referred_user_id TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payment_invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL, -- 'pending' | 'paid' | 'cancelled' | 'refunded'
    issue_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'avulsa', -- 'avulsa' | 'recorrente' | 'futura'
    pdf_content TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payment_webhooks (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL,
    response_status INTEGER,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payment_conciliation (
    id TEXT PRIMARY KEY,
    transaction_id TEXT UNIQUE NOT NULL,
    is_reconciled INTEGER DEFAULT 0,
    reconciled_at TEXT,
    notes TEXT,
    system_amount REAL NOT NULL,
    provider_amount REAL NOT NULL,
    status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notificacoes_preferencias (
    user_id TEXT PRIMARY KEY,
    preferences TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notificacoes_emails_enviados (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at TEXT NOT NULL,
    status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    usuario_id TEXT,
    username TEXT,
    user_avatar_url TEXT,
    media_url TEXT,
    media_type TEXT DEFAULT 'image',
    bg_color TEXT,
    text TEXT,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    is_flagged INTEGER DEFAULT 0,
    flag_reason TEXT,
    ai_mod_verdict TEXT
  );

  CREATE TABLE IF NOT EXISTS social_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    creator_id TEXT NOT NULL,
    avatar_url TEXT,
    banner_url TEXT,
    type TEXT DEFAULT 'group', -- 'group' or 'community'
    member_count INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS social_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    creator_id TEXT NOT NULL,
    date TEXT NOT NULL,
    location TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS social_pages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    creator_id TEXT NOT NULL,
    avatar_url TEXT,
    banner_url TEXT,
    category TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS social_memberships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'group' | 'community' | 'event' | 'page'
    role TEXT DEFAULT 'member',
    created_at TEXT NOT NULL,
    UNIQUE(user_id, target_id, target_type)
  );
`);

// Table migrations for posts in SQLite
const alterQueries = [
  "ALTER TABLE posts ADD COLUMN shared_post_id TEXT;",
  "ALTER TABLE posts ADD COLUMN scoped_type TEXT DEFAULT 'feed';",
  "ALTER TABLE posts ADD COLUMN scoped_id TEXT;",
  "ALTER TABLE posts ADD COLUMN saved_by TEXT DEFAULT '[]';",
  "ALTER TABLE posts ADD COLUMN reactions TEXT DEFAULT '{}';",
  "ALTER TABLE posts ADD COLUMN is_flagged INTEGER DEFAULT 0;",
  "ALTER TABLE posts ADD COLUMN flag_reason TEXT;",
  "ALTER TABLE posts ADD COLUMN ai_mod_verdict TEXT;"
];
for (const q of alterQueries) {
  try {
    db.prepare(q).run();
  } catch (e) {
    // Column might already exist, safe to ignore
  }
}

// Table migrations for messages in SQLite
const alterMessagesQueries = [
  "ALTER TABLE mensagens ADD COLUMN reply_to_id TEXT;",
  "ALTER TABLE mensagens ADD COLUMN reactions TEXT DEFAULT '[]';",
  "ALTER TABLE mensagens ADD COLUMN pinned INTEGER DEFAULT 0;",
  "ALTER TABLE mensagens ADD COLUMN is_encrypted INTEGER DEFAULT 0;",
  "ALTER TABLE mensagens ADD COLUMN expires_at TEXT;",
  "ALTER TABLE mensagens ADD COLUMN group_id TEXT;",
  "ALTER TABLE mensagens ADD COLUMN is_channel INTEGER DEFAULT 0;"
];
for (const q of alterMessagesQueries) {
  try {
    db.prepare(q).run();
  } catch (e) {
    // Column might already exist, safe to ignore
  }
}

// Seed coupons if empty
const couponCountRow = db.prepare('SELECT COUNT(*) as count FROM payment_coupons').get() as { count: number };
if (couponCountRow.count === 0) {
  db.prepare(`INSERT INTO payment_coupons (id, code, type, value, active, max_uses, uses) VALUES ('cp-1', 'DESCONTO10', 'percent', 10.0, 1, 1000, 0)`).run();
  db.prepare(`INSERT INTO payment_coupons (id, code, type, value, active, max_uses, uses) VALUES ('cp-2', 'VIPCUPOM', 'fixed', 15.0, 1, 500, 0)`).run();
  db.prepare(`INSERT INTO payment_coupons (id, code, type, value, active, max_uses, uses) VALUES ('cp-3', 'CASHBACK50', 'percent', 50.0, 1, 200, 0)`).run();
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

    // Sync with normalized_users to avoid FOREIGN KEY constraint failures in notifications or audit logs
    const nowIso = new Date().toISOString();
    db.prepare(`
      INSERT INTO normalized_users (id, email, password_hash, role, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
      VALUES (?, ?, ?, 'user', ?, ?, NULL, 'system', 'system')
      ON CONFLICT(id) DO UPDATE SET email=excluded.email, updated_at=excluded.updated_at
    `).run(userId, user.email, user.password || 'social_auth', nowIso, nowIso);

    // Sync with normalized_profiles
    const profileId = 'p-' + userId.replace(/[^a-zA-Z0-9_\-]/g, '_');
    db.prepare(`
      INSERT INTO normalized_profiles (id, user_id, display_name, username, avatar_url, bio, status, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
      VALUES (?, ?, ?, ?, ?, '', 'offline', ?, ?, NULL, 'system', 'system')
      ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name, avatar_url=excluded.avatar_url, updated_at=excluded.updated_at
    `).run(profileId, userId, user.name, generatedUsername, user.avatarUrl || null, nowIso, nowIso);
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
    let linksArr: string[] = [];
    let socialNetworksObj: any = {};
    let badgesArr: string[] = [];
    let conquistasArr: string[] = [];
    let inventarioArr: any[] = [];
    let historicoArr: any[] = [];
    let amigosArr: string[] = [];
    let solicitacoesAmizadeArr: string[] = [];
    let bloqueadosArr: string[] = [];
    let denunciasArr: any[] = [];
    let reputacaoVotosObj: any = {};

    try { if (row.seguindo) followingArr = JSON.parse(row.seguindo); } catch(e) {}
    try { if (row.seguidores) followersArr = JSON.parse(row.seguidores); } catch(e) {}
    try { if (row.lojas) storesArr = JSON.parse(row.lojas); } catch(e) {}
    try { if (row.arquivos) filesArr = JSON.parse(row.arquivos); } catch(e) {}
    try { if (row.avatar_gallery) avatarGalleryArr = JSON.parse(row.avatar_gallery); } catch(e) {}
    
    try { if (row.links) linksArr = JSON.parse(row.links); } catch(e) {}
    try { if (row.redes_sociais) socialNetworksObj = JSON.parse(row.redes_sociais); } catch(e) {}
    try { if (row.badges) badgesArr = JSON.parse(row.badges); } catch(e) {}
    try { if (row.conquistas) conquistasArr = JSON.parse(row.conquistas); } catch(e) {}
    try { if (row.inventario) inventarioArr = JSON.parse(row.inventario); } catch(e) {}
    try { if (row.historico) historicoArr = JSON.parse(row.historico); } catch(e) {}
    try { if (row.amigos) amigosArr = JSON.parse(row.amigos); } catch(e) {}
    try { if (row.solicitacoes_amizade) solicitacoesAmizadeArr = JSON.parse(row.solicitacoes_amizade); } catch(e) {}
    try { if (row.bloqueados) bloqueadosArr = JSON.parse(row.bloqueados); } catch(e) {}
    try { if (row.denuncias) denunciasArr = JSON.parse(row.denuncias); } catch(e) {}
    try { if (row.reputacao_votos) reputacaoVotosObj = JSON.parse(row.reputacao_votos); } catch(e) {}

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
      files: filesArr,
      
      bannerUrl: row.banner || '',
      links: linksArr,
      location: row.localizacao || '',
      socialNetworks: socialNetworksObj,
      badges: badgesArr,
      conquistas: conquistasArr,
      inventario: inventarioArr,
      historico: historicoArr,
      amigos: amigosArr,
      solicitacoesAmizade: solicitacoesAmizadeArr,
      bloqueados: bloqueadosArr,
      denuncias: denunciasArr,
      statusOnline: row.status_online || 'offline',
      ultimaAtividade: row.ultima_atividade || '',
      reputacao: row.reputacao ?? 0,
      verificado: row.verificado === 1,
      premium: row.premium === 1,
      reputacaoVotos: reputacaoVotosObj,
      privacySettings: {
        privateProfile: row.perfil_privado === 1,
        hideCoins: row.esconder_moedas === 1,
        hideHistory: row.esconder_historico === 1,
        hideFollowers: row.esconder_seguidores === 1,
        hideFriends: row.esconder_seguidores === 1
      }
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

    const finalBanner = profile.bannerUrl !== undefined ? profile.bannerUrl : (existing ? existing.banner : '');
    const finalLinks = profile.links ? JSON.stringify(profile.links) : (existing ? existing.links : '[]');
    const finalLocalizacao = profile.location !== undefined ? profile.location : (existing ? existing.localizacao : '');
    const finalRedesSociais = profile.socialNetworks ? JSON.stringify(profile.socialNetworks) : (existing ? existing.redes_sociais : '{}');
    const finalBadges = profile.badges ? JSON.stringify(profile.badges) : (existing ? existing.badges : '[]');
    const finalConquistas = profile.conquistas ? JSON.stringify(profile.conquistas) : (existing ? existing.conquistas : '[]');
    const finalInventario = profile.inventario ? JSON.stringify(profile.inventario) : (existing ? existing.inventario : '[]');
    const finalHistorico = profile.historico ? JSON.stringify(profile.historico) : (existing ? existing.historico : '[]');
    const finalAmigos = profile.amigos ? JSON.stringify(profile.amigos) : (existing ? existing.amigos : '[]');
    const finalSolicitacoes = profile.solicitacoesAmizade ? JSON.stringify(profile.solicitacoesAmizade) : (existing ? existing.solicitacoes_amizade : '[]');
    const finalBloqueados = profile.bloqueados ? JSON.stringify(profile.bloqueados) : (existing ? existing.bloqueados : '[]');
    const finalDenuncias = profile.denuncias ? JSON.stringify(profile.denuncias) : (existing ? existing.denuncias : '[]');
    const finalStatusOnline = profile.statusOnline !== undefined ? profile.statusOnline : (existing ? existing.status_online : 'offline');
    const finalUltimaAtividade = profile.ultimaAtividade !== undefined ? profile.ultimaAtividade : (existing ? existing.ultima_atividade : '');
    const finalReputacao = profile.reputacao !== undefined ? profile.reputacao : (existing ? existing.reputacao : 0);
    const finalVerificado = profile.verificado !== undefined ? (profile.verificado ? 1 : 0) : (existing ? existing.verificado : 0);
    const finalPremium = profile.premium !== undefined ? (profile.premium ? 1 : 0) : (existing ? existing.premium : 0);
    const finalReputacaoVotos = profile.reputacaoVotos ? JSON.stringify(profile.reputacaoVotos) : (existing ? existing.reputacao_votos : '{}');

    const pSettings = profile.privacySettings || { privateProfile: false, hideCoins: false, hideHistory: false, hideFollowers: false };
    const finalPerfilPrivado = pSettings.privateProfile ? 1 : 0;
    const finalEsconderMoedas = pSettings.hideCoins ? 1 : 0;
    const finalEsconderHistorico = pSettings.hideHistory ? 1 : 0;
    const finalEsconderSeguidores = pSettings.hideFollowers ? 1 : 0;

    db.prepare(`
      INSERT INTO perfis (
        usuario_id, nome, username, avatar, biografia, stats, real_balance, withdraw_limit, 
        seguindo, seguidores, lojas, arquivos, avatar_gallery,
        banner, links, localizacao, redes_sociais, badges, conquistas, inventario, historico, amigos, solicitacoes_amizade, bloqueados, denuncias, status_online, ultima_atividade, reputacao, verificado, premium, reputacao_votos,
        perfil_privado, esconder_moedas, esconder_historico, esconder_seguidores
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        avatar_gallery=COALESCE(excluded.avatar_gallery, avatar_gallery),
        banner=excluded.banner,
        links=excluded.links,
        localizacao=excluded.localizacao,
        redes_sociais=excluded.redes_sociais,
        badges=excluded.badges,
        conquistas=excluded.conquistas,
        inventario=excluded.inventario,
        historico=excluded.historico,
        amigos=excluded.amigos,
        solicitacoes_amizade=excluded.solicitacoes_amizade,
        bloqueados=excluded.bloqueados,
        denuncias=excluded.denuncias,
        status_online=excluded.status_online,
        ultima_atividade=excluded.ultima_atividade,
        reputacao=excluded.reputacao,
        verificado=excluded.verificado,
        premium=excluded.premium,
        reputacao_votos=excluded.reputacao_votos,
        perfil_privado=excluded.perfil_privado,
        esconder_moedas=excluded.esconder_moedas,
        esconder_historico=excluded.esconder_historico,
        esconder_seguidores=excluded.esconder_seguidores
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
      finalAvatarGallery,
      
      finalBanner,
      finalLinks,
      finalLocalizacao,
      finalRedesSociais,
      finalBadges,
      finalConquistas,
      finalInventario,
      finalHistorico,
      finalAmigos,
      finalSolicitacoes,
      finalBloqueados,
      finalDenuncias,
      finalStatusOnline,
      finalUltimaAtividade,
      finalReputacao,
      finalVerificado,
      finalPremium,
      finalReputacaoVotos,
      finalPerfilPrivado,
      finalEsconderMoedas,
      finalEsconderHistorico,
      finalEsconderSeguidores
    );
  },

  // Update profile details specifically
  updateProfileDetails: (
    userId: string, 
    details: { 
      name?: string; 
      username?: string; 
      biography?: string; 
      avatar?: string; 
      stores?: any[]; 
      files?: any[]; 
      avatarGallery?: string[];
      
      // New optional properties
      banner?: string;
      links?: string[];
      location?: string;
      socialNetworks?: any;
      badges?: string[];
      conquistas?: string[];
      inventario?: any[];
      historico?: any[];
      amigos?: string[];
      solicitacoesAmizade?: string[];
      bloqueados?: string[];
      denuncias?: any[];
      statusOnline?: string;
      ultimaAtividade?: string;
      reputacao?: number;
      verificado?: boolean;
      premium?: boolean;
      reputacaoVotos?: any;
      privacySettings?: any;
    }
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
    
    // Advanced profile properties
    if (details.banner !== undefined) {
      db.prepare('UPDATE perfis SET banner = ? WHERE usuario_id = ?').run(details.banner, userId);
    }
    if (details.links !== undefined) {
      db.prepare('UPDATE perfis SET links = ? WHERE usuario_id = ?').run(JSON.stringify(details.links), userId);
    }
    if (details.location !== undefined) {
      db.prepare('UPDATE perfis SET localizacao = ? WHERE usuario_id = ?').run(details.location, userId);
    }
    if (details.socialNetworks !== undefined) {
      db.prepare('UPDATE perfis SET redes_sociais = ? WHERE usuario_id = ?').run(JSON.stringify(details.socialNetworks), userId);
    }
    if (details.badges !== undefined) {
      db.prepare('UPDATE perfis SET badges = ? WHERE usuario_id = ?').run(JSON.stringify(details.badges), userId);
    }
    if (details.conquistas !== undefined) {
      db.prepare('UPDATE perfis SET conquistas = ? WHERE usuario_id = ?').run(JSON.stringify(details.conquistas), userId);
    }
    if (details.inventario !== undefined) {
      db.prepare('UPDATE perfis SET inventario = ? WHERE usuario_id = ?').run(JSON.stringify(details.inventario), userId);
    }
    if (details.historico !== undefined) {
      db.prepare('UPDATE perfis SET historico = ? WHERE usuario_id = ?').run(JSON.stringify(details.historico), userId);
    }
    if (details.amigos !== undefined) {
      db.prepare('UPDATE perfis SET amigos = ? WHERE usuario_id = ?').run(JSON.stringify(details.amigos), userId);
    }
    if (details.solicitacoesAmizade !== undefined) {
      db.prepare('UPDATE perfis SET solicitacoes_amizade = ? WHERE usuario_id = ?').run(JSON.stringify(details.solicitacoesAmizade), userId);
    }
    if (details.bloqueados !== undefined) {
      db.prepare('UPDATE perfis SET bloqueados = ? WHERE usuario_id = ?').run(JSON.stringify(details.bloqueados), userId);
    }
    if (details.denuncias !== undefined) {
      db.prepare('UPDATE perfis SET denuncias = ? WHERE usuario_id = ?').run(JSON.stringify(details.denuncias), userId);
    }
    if (details.statusOnline !== undefined) {
      db.prepare('UPDATE perfis SET status_online = ? WHERE usuario_id = ?').run(details.statusOnline, userId);
    }
    if (details.ultimaAtividade !== undefined) {
      db.prepare('UPDATE perfis SET ultima_atividade = ? WHERE usuario_id = ?').run(details.ultimaAtividade, userId);
    }
    if (details.reputacao !== undefined) {
      db.prepare('UPDATE perfis SET reputacao = ? WHERE usuario_id = ?').run(details.reputacao, userId);
    }
    if (details.verificado !== undefined) {
      db.prepare('UPDATE perfis SET verificado = ? WHERE usuario_id = ?').run(details.verificado ? 1 : 0, userId);
    }
    if (details.premium !== undefined) {
      db.prepare('UPDATE perfis SET premium = ? WHERE usuario_id = ?').run(details.premium ? 1 : 0, userId);
    }
    if (details.reputacaoVotos !== undefined) {
      db.prepare('UPDATE perfis SET reputacao_votos = ? WHERE usuario_id = ?').run(JSON.stringify(details.reputacaoVotos), userId);
    }
    if (details.privacySettings !== undefined) {
      const ps = details.privacySettings;
      if (ps.privateProfile !== undefined) {
        db.prepare('UPDATE perfis SET perfil_privado = ? WHERE usuario_id = ?').run(ps.privateProfile ? 1 : 0, userId);
      }
      if (ps.hideCoins !== undefined) {
        db.prepare('UPDATE perfis SET esconder_moedas = ? WHERE usuario_id = ?').run(ps.hideCoins ? 1 : 0, userId);
      }
      if (ps.hideHistory !== undefined) {
        db.prepare('UPDATE perfis SET esconder_historico = ? WHERE usuario_id = ?').run(ps.hideHistory ? 1 : 0, userId);
      }
      if (ps.hideFollowers !== undefined) {
        db.prepare('UPDATE perfis SET esconder_seguidores = ? WHERE usuario_id = ?').run(ps.hideFollowers ? 1 : 0, userId);
      }
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

  // Get all transaction logs for ledger verification
  getAllLogs: (): TransactionLog[] => {
    const rows = db.prepare('SELECT * FROM logs ORDER BY timestamp ASC').all() as any[];
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
      let savedByArr: string[] = [];
      let reactionsObj: Record<string, string[]> = {};
      let aiModVerdictObj: any = null;

      try { if (row.curtidas) likesArr = JSON.parse(row.curtidas); } catch (e) {}
      try { if (row.evaluations) evalsObj = JSON.parse(row.evaluations); } catch (e) {}
      try { if (row.comments) commentsArr = JSON.parse(row.comments); } catch (e) {}
      try { if (row.oculto_para) hiddenArr = JSON.parse(row.oculto_para); } catch (e) {}
      try { if (row.saved_by) savedByArr = JSON.parse(row.saved_by); } catch (e) {}
      try { if (row.reactions) reactionsObj = JSON.parse(row.reactions); } catch (e) {}
      try { if (row.ai_mod_verdict) aiModVerdictObj = JSON.parse(row.ai_mod_verdict); } catch (e) {}

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
        hiddenFor: hiddenArr,
        shared_post_id: row.shared_post_id || undefined,
        scoped_type: row.scoped_type || 'feed',
        scoped_id: row.scoped_id || undefined,
        saved_by: savedByArr,
        reactions: reactionsObj,
        is_flagged: row.is_flagged === 1,
        flag_reason: row.flag_reason || undefined,
        ai_mod_verdict: aiModVerdictObj
      };
    });
  },

  // Create feed post
  addPost: (post: FeedPost): void => {
    db.prepare(`
      INSERT INTO posts (
        id, texto, url_midia, usuario_id, curtidas, media_type, username, user_avatar_url, created_at, 
        evaluations, comments, is_ad, ad_title, ad_action_url, ad_category, oculto_para,
        shared_post_id, scoped_type, scoped_id, saved_by, reactions, is_flagged, flag_reason, ai_mod_verdict
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      JSON.stringify(post.hiddenFor || []),
      post.shared_post_id || null,
      post.scoped_type || 'feed',
      post.scoped_id || null,
      JSON.stringify(post.saved_by || []),
      JSON.stringify(post.reactions || {}),
      post.is_flagged ? 1 : 0,
      post.flag_reason || null,
      post.ai_mod_verdict ? JSON.stringify(post.ai_mod_verdict) : null
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
          INSERT INTO posts (
            id, texto, url_midia, usuario_id, curtidas, media_type, username, user_avatar_url, created_at, 
            evaluations, comments, is_ad, ad_title, ad_action_url, ad_category, oculto_para,
            shared_post_id, scoped_type, scoped_id, saved_by, reactions, is_flagged, flag_reason, ai_mod_verdict
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            oculto_para=excluded.oculto_para,
            shared_post_id=excluded.shared_post_id,
            scoped_type=excluded.scoped_type,
            scoped_id=excluded.scoped_id,
            saved_by=excluded.saved_by,
            reactions=excluded.reactions,
            is_flagged=excluded.is_flagged,
            flag_reason=excluded.flag_reason,
            ai_mod_verdict=excluded.ai_mod_verdict
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
          JSON.stringify(p.hiddenFor || []),
          p.shared_post_id || null,
          p.scoped_type || 'feed',
          p.scoped_id || null,
          JSON.stringify(p.saved_by || []),
          JSON.stringify(p.reactions || {}),
          p.is_flagged ? 1 : 0,
          p.flag_reason || null,
          p.ai_mod_verdict ? JSON.stringify(p.ai_mod_verdict) : null
        );
      }
    });
    insertOrReplace(posts);
  },

  // WhatsApp-like Chat Methods
  getMessages: (userA: string, userB: string): ChatMessage[] => {
    const rows = db.prepare(`
      SELECT * FROM mensagens 
      WHERE ((remetente_id = ? AND destinatario_id = ?) 
         OR (remetente_id = ? AND destinatario_id = ?))
         AND (group_id IS NULL OR group_id = '')
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
        hiddenFor: hiddenForArr,
        reply_to_id: row.reply_to_id || undefined,
        reactions: row.reactions || '[]',
        pinned: row.pinned === 1,
        is_encrypted: row.is_encrypted === 1,
        expires_at: row.expires_at || undefined,
        group_id: row.group_id || undefined,
        is_channel: row.is_channel === 1
      };
    });
  },

  getGroupMessages: (groupId: string): ChatMessage[] => {
    const rows = db.prepare(`
      SELECT * FROM mensagens 
      WHERE group_id = ?
      ORDER BY created_at ASC
    `).all(groupId) as any[];

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
        hiddenFor: hiddenForArr,
        reply_to_id: row.reply_to_id || undefined,
        reactions: row.reactions || '[]',
        pinned: row.pinned === 1,
        is_encrypted: row.is_encrypted === 1,
        expires_at: row.expires_at || undefined,
        group_id: row.group_id || undefined,
        is_channel: row.is_channel === 1
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
        hiddenFor: hiddenForArr,
        reply_to_id: row.reply_to_id || undefined,
        reactions: row.reactions || '[]',
        pinned: row.pinned === 1,
        is_encrypted: row.is_encrypted === 1,
        expires_at: row.expires_at || undefined,
        group_id: row.group_id || undefined,
        is_channel: row.is_channel === 1
      };
    });
  },

  addMessage: (message: ChatMessage): void => {
    db.prepare(`
      INSERT INTO mensagens (
        id, remetente_id, destinatario_id, texto, url_midia, tipo_midia, 
        created_at, apagada, oculta_para, reply_to_id, reactions, pinned, 
        is_encrypted, expires_at, group_id, is_channel
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      message.id,
      message.senderId,
      message.receiverId,
      message.text || null,
      message.mediaUrl || null,
      message.mediaType || 'text',
      message.created_at,
      message.deleted ? 1 : 0,
      JSON.stringify(message.hiddenFor || []),
      message.reply_to_id || null,
      message.reactions || '[]',
      message.pinned ? 1 : 0,
      message.is_encrypted ? 1 : 0,
      message.expires_at || null,
      message.group_id || null,
      message.is_channel ? 1 : 0
    );
  },

  pinMessage: (messageId: string, pinned: boolean): void => {
    db.prepare('UPDATE mensagens SET pinned = ? WHERE id = ?').run(pinned ? 1 : 0, messageId);
  },

  reactToMessage: (messageId: string, userId: string, emoji: string, userName: string): void => {
    const row = db.prepare('SELECT reactions FROM mensagens WHERE id = ?').get(messageId) as any;
    if (!row) return;

    let reactionsList: Array<{ userId: string; emoji: string; userName: string }> = [];
    try {
      if (row.reactions) {
        reactionsList = JSON.parse(row.reactions);
      }
    } catch (e) {}

    // Remove existing reaction of same emoji by same user if clicked again, or toggle
    const existingIndex = reactionsList.findIndex(r => r.userId === userId && r.emoji === emoji);
    if (existingIndex !== -1) {
      reactionsList.splice(existingIndex, 1);
    } else {
      reactionsList.push({ userId, emoji, userName });
    }

    db.prepare('UPDATE mensagens SET reactions = ? WHERE id = ?').run(JSON.stringify(reactionsList), messageId);
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
  },

  // --- ENTERPRISE SECURITY MODULES ---

  // Get and set roles
  getUserRole: (userId: string): 'user' | 'moderator' | 'admin' | 'auditor' => {
    try {
      const row = db.prepare('SELECT role FROM usuarios WHERE id = ?').get(userId) as { role?: string };
      return (row?.role as any) || 'user';
    } catch {
      return 'user';
    }
  },

  setUserRole: (userId: string, role: 'user' | 'moderator' | 'admin' | 'auditor'): void => {
    db.prepare('UPDATE usuarios SET role = ? WHERE id = ?').run(role, userId);
  },

  // Audit Logging
  addAuditLog: (userId: string, event: string, details: string, ip: string, ua: string): void => {
    const id = `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();
    
    // Create tamper-proof HMAC signature of the audit record
    const recordStr = `${id}:${userId}:${event}:${details}:${ip}:${timestamp}`;
    const secret = process.env.COMPILER_SECRET_SALT || 'GZ_SECURE_SALT_9f31b8a6d25e4c7b80a1c2d3e4f5a6b7';
    const signature = crypto.createHmac('sha256', secret).update(recordStr).digest('hex');

    db.prepare(`
      INSERT INTO logs_auditoria (id, usuario_id, evento, detalhes, ip_address, user_agent, timestamp, signature)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, event, details, ip, ua, timestamp, signature);
  },

  getAuditLogs: (): any[] => {
    const rows = db.prepare('SELECT * FROM logs_auditoria ORDER BY timestamp DESC LIMIT 200').all() as any[];
    // Verify signatures of audit logs to check for log tampering!
    const secret = process.env.COMPILER_SECRET_SALT || 'GZ_SECURE_SALT_9f31b8a6d25e4c7b80a1c2d3e4f5a6b7';
    return rows.map(row => {
      const recordStr = `${row.id}:${row.usuario_id}:${row.evento}:${row.detalhes}:${row.ip_address}:${row.timestamp}`;
      const computedSignature = crypto.createHmac('sha256', secret).update(recordStr).digest('hex');
      const isTampered = computedSignature !== row.signature;
      
      return {
        id: row.id,
        userId: row.usuario_id,
        event: row.evento,
        details: row.detalhes,
        ipAddress: row.ip_address || 'unknown',
        userAgent: row.user_agent || 'unknown',
        timestamp: row.timestamp,
        isTampered
      };
    });
  },

  // Brute Force prevention & IP blocks
  getIpBlock: (ip: string): { tentativas: number; bloqueado_ate: string | null } | null => {
    const row = db.prepare('SELECT * FROM bloqueios_ip WHERE ip = ?').get(ip) as any;
    if (!row) return null;
    return {
      tentativas: row.tentativas,
      bloqueado_ate: row.bloqueado_ate
    };
  },

  incrementIpBlock: (ip: string): void => {
    db.prepare(`
      INSERT INTO bloqueios_ip (ip, tentativas, bloqueado_ate)
      VALUES (?, 1, NULL)
      ON CONFLICT(ip) DO UPDATE SET tentativas = tentativas + 1
    `).run(ip);
  },

  blockIp: (ip: string, durationSecs: number): void => {
    const blockUntil = new Date(Date.now() + durationSecs * 1000).toISOString();
    db.prepare(`
      INSERT INTO bloqueios_ip (ip, tentativas, bloqueado_ate)
      VALUES (?, 5, ?)
      ON CONFLICT(ip) DO UPDATE SET tentativas = 5, bloqueado_ate = ?
    `).run(ip, blockUntil, blockUntil);
  },

  clearIpBlock: (ip: string): void => {
    db.prepare('DELETE FROM bloqueios_ip WHERE ip = ?').run(ip);
  },

  // Refresh Tokens (JWT Hijack prevention)
  saveRefreshToken: (token: string, userId: string, expiraEm: string): void => {
    db.prepare(`
      INSERT INTO tokens_refresh (token, usuario_id, expira_em, revogado)
      VALUES (?, ?, ?, 0)
    `).run(token, userId, expiraEm);
  },

  revokeRefreshToken: (token: string): void => {
    db.prepare('UPDATE tokens_refresh SET revogado = 1 WHERE token = ?').run(token);
  },

  verifyRefreshToken: (token: string): { userId: string } | null => {
    const row = db.prepare('SELECT * FROM tokens_refresh WHERE token = ? AND revogado = 0').get(token) as any;
    if (!row) return null;
    const isExpired = new Date(row.expira_em).getTime() < Date.now();
    if (isExpired) {
      db.prepare('UPDATE tokens_refresh SET revogado = 1 WHERE token = ?').run(token);
      return null;
    }
    return { userId: row.usuario_id };
  },

  // 2-Factor Authentication (2FA) support
  save2faSecret: (userId: string, secret: string, backupCodes: string[]): void => {
    db.prepare('UPDATE usuarios SET two_factor_secret = ?, two_factor_backup_codes = ? WHERE id = ?')
      .run(secret, JSON.stringify(backupCodes), userId);
  },

  get2faSecret: (userId: string): { secret: string | null; backupCodes: string[] } => {
    const row = db.prepare('SELECT two_factor_secret, two_factor_backup_codes FROM usuarios WHERE id = ?').get(userId) as any;
    if (!row) return { secret: null, backupCodes: [] };
    let backupCodes: string[] = [];
    try {
      if (row.two_factor_backup_codes) backupCodes = JSON.parse(row.two_factor_backup_codes);
    } catch {}
    return {
      secret: row.two_factor_secret || null,
      backupCodes
    };
  },

  toggle2fa: (userId: string, enabled: boolean): void => {
    db.prepare('UPDATE usuarios SET two_factor_enabled = ? WHERE id = ?').run(enabled ? 1 : 0, userId);
  },

  get2faStatus: (userId: string): boolean => {
    const row = db.prepare('SELECT two_factor_enabled FROM usuarios WHERE id = ?').get(userId) as any;
    return row ? row.two_factor_enabled === 1 : false;
  },

  // --- SESSION MANAGEMENT ENGINE ---
  saveActiveSession: (id: string, userId: string, tokenJti: string, ipAddress: string, userAgent: string, dispositivo: string, localizacao: string): void => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO sessoes_ativas (id, usuario_id, token_jti, ip_address, user_agent, dispositivo, localizacao, criado_em, ultimo_acesso, ativa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET ultimo_acesso = excluded.ultimo_acesso, ativa = 1
    `).run(id, userId, tokenJti, ipAddress, userAgent, dispositivo, localizacao, now, now);
  },

  getActiveSessions: (userId: string): any[] => {
    return db.prepare('SELECT * FROM sessoes_ativas WHERE usuario_id = ? AND ativa = 1 ORDER BY ultimo_acesso DESC').all(userId);
  },

  terminateSession: (sessionId: string): void => {
    db.prepare('UPDATE sessoes_ativas SET ativa = 0 WHERE id = ?').run(sessionId);
  },

  terminateAllSessionsExcept: (userId: string, currentSessionId: string): void => {
    db.prepare('UPDATE sessoes_ativas SET ativa = 0 WHERE usuario_id = ? AND id != ?').run(userId, currentSessionId);
  },

  isSessionActive: (sessionId: string): boolean => {
    const row = db.prepare('SELECT ativa FROM sessoes_ativas WHERE id = ?').get(sessionId) as { ativa?: number };
    return row ? row.ativa === 1 : false;
  },

  // --- LOGIN HISTORY & SUSPICIOUS LOGIN DETECTION ENGINE ---
  saveLoginAttempt: (id: string, userId: string, ipAddress: string, userAgent: string, dispositivo: string, localizacao: string, status: string, suspeito: boolean, motivoSuspeito: string | null): void => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO historico_login (id, usuario_id, ip_address, user_agent, dispositivo, localizacao, status, timestamp, suspeito, motivo_suspeito)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, ipAddress, userAgent, dispositivo, localizacao, status, now, suspeito ? 1 : 0, motivoSuspeito);
  },

  getLoginHistory: (userId: string): any[] => {
    return db.prepare('SELECT * FROM historico_login WHERE usuario_id = ? ORDER BY timestamp DESC LIMIT 100').all(userId);
  },

  // --- PRIVACY SETTINGS ENGINE ---
  getPrivacySettings: (userId: string): any => {
    const row = db.prepare('SELECT perfil_privado, esconder_moedas, esconder_historico, esconder_seguidores FROM perfis WHERE usuario_id = ?').get(userId) as any;
    if (!row) {
      return { perfilPrivado: false, esconderMoedas: false, esconderHistorico: false, esconderSeguidores: false };
    }
    return {
      perfilPrivado: row.perfil_privado === 1,
      esconderMoedas: row.esconder_moedas === 1,
      esconderHistorico: row.esconder_historico === 1,
      esconderSeguidores: row.esconder_seguidores === 1
    };
  },

  savePrivacySettings: (userId: string, settings: { perfilPrivado: boolean; esconderMoedas: boolean; esconderHistorico: boolean; esconderSeguidores: boolean }): void => {
    db.prepare(`
      UPDATE perfis SET 
        perfil_privado = ?, 
        esconder_moedas = ?, 
        esconder_historico = ?, 
        esconder_seguidores = ?
      WHERE usuario_id = ?
    `).run(
      settings.perfilPrivado ? 1 : 0,
      settings.esconderMoedas ? 1 : 0,
      settings.esconderHistorico ? 1 : 0,
      settings.esconderSeguidores ? 1 : 0,
      userId
    );
  },

  // --- EMAIL VERIFICATION & PASSWORD RECOVERY ---
  getUserVerificationDetails: (userId: string): { emailVerificado: boolean; codigoVerificacao: string | null } => {
    const row = db.prepare('SELECT email_verificado, codigo_verificacao FROM usuarios WHERE id = ?').get(userId) as any;
    if (!row) return { emailVerificado: false, codigoVerificacao: null };
    return {
      emailVerificado: row.email_verificado === 1,
      codigoVerificacao: row.codigo_verificacao || null
    };
  },

  setEmailVerified: (userId: string, verified: boolean): void => {
    db.prepare('UPDATE usuarios SET email_verificado = ?, codigo_verificacao = NULL WHERE id = ?').run(verified ? 1 : 0, userId);
  },

  setEmailVerificationCode: (userId: string, code: string): void => {
    db.prepare('UPDATE usuarios SET codigo_verificacao = ? WHERE id = ?').run(code, userId);
  },

  setPasswordRecoveryCode: (userId: string, code: string, expiresAt: string): void => {
    db.prepare('UPDATE usuarios SET codigo_recuperacao = ?, recuperacao_expira = ? WHERE id = ?').run(code, expiresAt, userId);
  },

  getUserByRecoveryCode: (code: string): any => {
    return db.prepare('SELECT * FROM usuarios WHERE codigo_recuperacao = ?').get(code);
  },

  clearRecoveryCode: (userId: string): void => {
    db.prepare('UPDATE usuarios SET codigo_recuperacao = NULL, recuperacao_expira = NULL WHERE id = ?').run(userId);
  },

  // LGPD Privacy Actions
  addLgpdRequest: (userId: string, tipo: 'PORTABILIDADE' | 'EXCLUSAO'): void => {
    const id = `lgpd-${Date.now()}`;
    const timestamp = new Date().toISOString();
    db.prepare(`
      INSERT INTO lgpd_solicitacoes (id, usuario_id, tipo, status, timestamp)
      VALUES (?, ?, ?, 'PENDENTE', ?)
    `).run(id, userId, tipo, timestamp);
  },

  getLgpdRequests: (userId: string): any[] => {
    return db.prepare('SELECT * FROM lgpd_solicitacoes WHERE usuario_id = ? ORDER BY timestamp DESC').all(userId) as any[];
  },

  anonymizeUserAccount: (userId: string): void => {
    // LGPD "Direito de ser Esquecido" (The Right to be Forgotten)
    // Anonymize the profile data so that no personally identifiable information (PII) is kept
    db.prepare('UPDATE perfis SET nome = "Usuário Anônimo (LGPD)", username = "anonimo_lgpd", biografia = "Esta conta foi anonimizada a pedido do usuário em conformidade com as diretrizes da LGPD.", avatar = "https://api.dicebear.com/7.x/bottts/svg?seed=anonymized" WHERE usuario_id = ?').run(userId);
    db.prepare('UPDATE usuarios SET senha_criptografada = "LOCKED_LGPD_DELETED" WHERE id = ?').run(userId);
    // Delete any refresh tokens
    db.prepare('DELETE FROM tokens_refresh WHERE usuario_id = ?').run(userId);
  },

  // Automatic Backup & Recovery Snaps
  backupDatabase: (): string => {
    // Fetch records from tables
    const usuarios = db.prepare('SELECT id, email, role, two_factor_enabled FROM usuarios').all();
    const perfis = db.prepare('SELECT * FROM perfis').all();
    const posts = db.prepare('SELECT * FROM posts').all();
    const logs = db.prepare('SELECT * FROM logs').all();
    const logs_auditoria = db.prepare('SELECT * FROM logs_auditoria').all();

    const snapshot = {
      usuarios,
      perfis,
      posts,
      logs,
      logs_auditoria,
      timestamp: new Date().toISOString()
    };

    const payload = JSON.stringify(snapshot);
    // Cryptographically sign the backup to ensure zero tampering on restore
    const secret = process.env.COMPILER_SECRET_SALT || 'GZ_SECURE_SALT_9f31b8a6d25e4c7b80a1c2d3e4f5a6b7';
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    return JSON.stringify({ payload, signature });
  },

  restoreDatabase: (backupJson: string): boolean => {
    try {
      const { payload, signature } = JSON.parse(backupJson);
      const secret = process.env.COMPILER_SECRET_SALT || 'GZ_SECURE_SALT_9f31b8a6d25e4c7b80a1c2d3e4f5a6b7';
      const computed = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      
      if (computed !== signature) {
        console.error('[RESTORE ERROR] Cryptographic signature validation failed! Backup corrupted or tampered.');
        return false;
      }

      const snap = JSON.parse(payload);
      
      // Perform database atomic restore
      const restoreTx = db.transaction(() => {
        // Clear tables
        db.prepare('DELETE FROM perfis').run();
        db.prepare('DELETE FROM posts').run();
        db.prepare('DELETE FROM logs').run();
        db.prepare('DELETE FROM logs_auditoria').run();

        // Restore profiles
        for (const p of snap.perfis) {
          db.prepare(`
            INSERT INTO perfis (usuario_id, nome, username, avatar, biografia, stats, real_balance, withdraw_limit, seguindo, seguidores, lojas, arquivos, avatar_gallery)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(p.usuario_id, p.nome, p.username, p.avatar, p.biografia, p.stats, p.real_balance, p.withdraw_limit, p.seguindo, p.seguidores, p.lojas, p.arquivos, p.avatar_gallery);
        }

        // Restore posts
        for (const p of snap.posts) {
          db.prepare(`
            INSERT INTO posts (id, texto, url_midia, usuario_id, curtidas, media_type, username, user_avatar_url, created_at, evaluations, comments, is_ad, ad_title, ad_action_url, ad_category, oculto_para)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(p.id, p.texto, p.url_midia, p.usuario_id, p.curtidas, p.media_type, p.username, p.user_avatar_url, p.created_at, p.evaluations, p.comments, p.is_ad, p.ad_title, p.ad_action_url, p.ad_category, p.oculto_para);
        }

        // Restore logs
        for (const l of snap.logs) {
          db.prepare(`
            INSERT INTO logs (id, usuario_id, timestamp, type, description, amount, currency, status, security_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(l.id, l.usuario_id, l.timestamp, l.type, l.description, l.amount, l.currency, l.status, l.security_hash);
        }

        // Restore audit logs
        for (const a of snap.logs_auditoria) {
          db.prepare(`
            INSERT INTO logs_auditoria (id, usuario_id, evento, detalhes, ip_address, user_agent, timestamp, signature)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(a.id, a.usuario_id, a.evento, a.detalhes, a.ip_address, a.user_agent, a.timestamp, a.signature);
        }
      });

      restoreTx();
      return true;
    } catch (err) {
      console.error('[RESTORE CRITICAL ERROR]', err);
      return false;
    }
  },

  // Runs a SQL query from the Sandbox safely
  runGenericQuery: (sql: string, params: any[] = []): { success: boolean; rows?: any[]; info?: any; error?: string } => {
    try {
      const cleanSql = sql.trim();
      const isSelect = cleanSql.toLowerCase().startsWith('select') || cleanSql.toLowerCase().startsWith('pragma');
      
      if (isSelect) {
        const rows = db.prepare(sql).all(...params);
        return { success: true, rows };
      } else {
        const info = db.prepare(sql).run(...params);
        return { success: true, info };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Returns live metrics for all 22 normalized tables
  getNormalizedTablesTelemetry: (): any => {
    const tables = [
      'normalized_users', 'normalized_profiles', 'normalized_friendships', 'normalized_followers',
      'normalized_messages', 'normalized_comments', 'normalized_likes', 'normalized_notifications',
      'normalized_games', 'normalized_inventory', 'normalized_items', 'normalized_currencies',
      'normalized_payments', 'normalized_subscriptions', 'normalized_streaming', 'normalized_marketplace',
      'normalized_products', 'normalized_orders', 'normalized_reports', 'normalized_db_operation_logs',
      'normalized_permissions', 'normalized_audited_history'
    ];

    const stats: Record<string, number> = {};
    for (const t of tables) {
      try {
        const row = db.prepare(`SELECT COUNT(*) as count FROM ${t}`).get() as any;
        stats[t] = row ? row.count : 0;
      } catch (e) {
        stats[t] = -1; // table missing or error
      }
    }
    return stats;
  },

  // --- MARKETPLACE DB METHODS ---
  getMarketplaceListings: (): any[] => {
    return db.prepare("SELECT * FROM gamezon_marketplace WHERE status = 'active' ORDER BY created_at DESC").all();
  },

  listMarketplaceItem: (id: string, sellerId: string, sellerName: string, title: string, description: string, price: number, currency: string, rarity: string, createdAt: string): void => {
    db.prepare(`
      INSERT INTO gamezon_marketplace (id, seller_id, seller_name, title, description, price, currency, rarity, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(id, sellerId, sellerName, title, description, price, currency, rarity, createdAt);
  },

  buyMarketplaceItem: (id: string): void => {
    db.prepare("UPDATE gamezon_marketplace SET status = 'sold' WHERE id = ?").run(id);
  },

  // Seeds sample data into the 22 tables
  seedNormalizedRelationalData: (): { success: boolean; seededCount: number; error?: string } => {
    try {
      const tx = db.transaction(() => {
        // Only seed if users are empty to avoid duplicating keys
        const userCountRow = db.prepare('SELECT COUNT(*) as count FROM normalized_users').get() as { count: number };
        if (userCountRow.count > 0) {
          return { success: true, seededCount: 0, message: "Já possui dados semeados!" };
        }

        const now = new Date().toISOString();

        // 1. Users
        const users = [
          { id: 'u-1', email: 'vitor.gamer@gamezone.com', password_hash: '$2b$10$K9/N58zTepU6fC7Z68', role: 'admin' },
          { id: 'u-2', email: 'carla.stream@gamezone.com', password_hash: '$2b$10$K9/N58zTepU6fC7Z68', role: 'user' },
          { id: 'u-3', email: 'felipe.play@gamezone.com', password_hash: '$2b$10$K9/N58zTepU6fC7Z68', role: 'user' },
          { id: 'u-4', email: 'auditor.lgpd@gamezone.com', password_hash: '$2b$10$K9/N58zTepU6fC7Z68', role: 'auditor' }
        ];
        for (const u of users) {
          db.prepare(`
            INSERT INTO normalized_users (id, email, password_hash, role, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
            VALUES (?, ?, ?, ?, ?, ?, NULL, 'system_seeder', 'system_seeder')
          `).run(u.id, u.email, u.password_hash, u.role, now, now);
        }

        // 2. Profiles
        const profiles = [
          { id: 'p-1', user_id: 'u-1', display_name: 'Vitor Admin', username: 'vitor_admin', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150', bio: 'Administrador geral do banco relacional Gamezone.' },
          { id: 'p-2', user_id: 'u-2', display_name: 'Carla Streamer', username: 'carla_live', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150', bio: 'Jogadora profissional de FPS e Streamer parceira.' },
          { id: 'p-3', user_id: 'u-3', display_name: 'Felipe Play', username: 'felipe_play', avatar_url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150', bio: 'Gamer casual, colecionador de auras raras e skins.' },
          { id: 'p-4', user_id: 'u-4', display_name: 'Auditor Oficial', username: 'auditoria_lgpd', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150', bio: 'Auditor independente de conformidade regulatória.' }
        ];
        for (const p of profiles) {
          db.prepare(`
            INSERT INTO normalized_profiles (id, user_id, display_name, username, avatar_url, bio, status, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
            VALUES (?, ?, ?, ?, ?, ?, 'online', ?, ?, NULL, 'system_seeder', 'system_seeder')
          `).run(p.id, p.user_id, p.display_name, p.username, p.avatar_url, p.bio, now, now);
        }

        // 3. Friendships
        db.prepare(`
          INSERT INTO normalized_friendships (id, user_id, friend_id, status, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
          VALUES ('fr-1', 'u-1', 'u-3', 'accepted', ?, ?, NULL, 'system_seeder', 'system_seeder')
        `).run(now, now);

        // 4. Followers
        db.prepare(`
          INSERT INTO normalized_followers (id, follower_id, followed_id, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
          VALUES ('fol-1', 'u-3', 'u-2', ?, ?, NULL, 'system_seeder', 'system_seeder')
        `).run(now, now);

        // 5. Messages
        db.prepare(`
          INSERT INTO normalized_messages (id, sender_id, receiver_id, text_content, media_url, is_read, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
          VALUES ('msg-1', 'u-3', 'u-2', 'Olá Carla! Curti sua live de hoje de manhã! Parabéns pelo clutch!', NULL, 0, ?, ?, NULL, 'system_seeder', 'system_seeder')
        `).run(now, now);

        // 6. Comments
        db.prepare(`
          INSERT INTO normalized_comments (id, user_id, target_type, target_id, content, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
          VALUES ('com-1', 'u-2', 'game', 'g-1', 'Melhor jogo de slots virtuais estocásticos que já joguei!', ?, ?, NULL, 'system_seeder', 'system_seeder')
        `).run(now, now);

        // 7. Likes
        db.prepare(`
          INSERT INTO normalized_likes (id, user_id, target_type, target_id, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
          VALUES ('like-1', 'u-3', 'comment', 'com-1', ?, ?, NULL, 'system_seeder', 'system_seeder')
        `).run(now, now);

        // 8. Notifications
        db.prepare(`
          INSERT INTO normalized_notifications (id, user_id, title, body, type, is_read, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
          VALUES ('not-1', 'u-2', 'Nova Mensagem Privada', 'Felipe Play enviou uma mensagem para você.', 'social', 0, ?, ?, NULL, 'system_seeder', 'system_seeder')
        `).run(now, now);

        // 9. Games
        const games = [
          { id: 'g-1', name: 'Gzon Space Crash', genre: 'Crash/Multiplier', rtp: 97.2, desc: 'Decole ao infinito e multiplique seus ganhos antes do foguete explodir.' },
          { id: 'g-2', name: 'Neon Fruit Slot machine', genre: 'Slots/Cassino', rtp: 96.8, desc: 'Slots clássicos remodelados com neon e bônus de auras místicas.' }
        ];
        for (const g of games) {
          db.prepare(`
            INSERT INTO normalized_games (id, name, genre, description, rtp_percentage, cover_image_url, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
            VALUES (?, ?, ?, ?, ?, NULL, ?, ?, NULL, 'system_seeder', 'system_seeder')
          `).run(g.id, g.name, g.genre, g.desc, g.rtp, now, now);
        }

        // 10. Items
        const items = [
          { id: 'it-1', name: 'Cyberpunk Helmet 2026', type: 'accessory', price: 250, rarity: 'epic' },
          { id: 'it-2', name: 'Emerald Plasma Aura', type: 'aura', price: 600, rarity: 'legendary' }
        ];
        for (const it of items) {
          db.prepare(`
            INSERT INTO normalized_items (id, name, type, description, base_price_coins, rarity, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
            VALUES (?, ?, ?, 'Item de edição limitada de semeador', ?, ?, ?, ?, NULL, 'system_seeder', 'system_seeder')
          `).run(it.id, it.name, it.type, it.price, it.rarity, now, now);
        }

        // 11. Inventory
        db.prepare(`
          INSERT INTO normalized_inventory (id, user_id, item_id, quantity, equipped, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
          VALUES ('inv-1', 'u-3', 'it-1', 1, 1, ?, ?, NULL, 'system_seeder', 'system_seeder')
        `).run(now, now);

        // 12. Currencies
        const currencies = [
          { id: 'cur-1', user_id: 'u-1', coins: 9999, balance: 1500.0 },
          { id: 'cur-2', user_id: 'u-2', coins: 450, balance: 350.0 },
          { id: 'cur-3', user_id: 'u-3', coins: 1200, balance: 140.0 },
          { id: 'cur-4', user_id: 'u-4', coins: 0, balance: 0.0 }
        ];
        for (const c of currencies) {
          db.prepare(`
            INSERT INTO normalized_currencies (id, user_id, coins_amount, real_balance_amount, withdraw_limit, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
            VALUES (?, ?, ?, ?, 100.0, ?, ?, NULL, 'system_seeder', 'system_seeder')
          `).run(c.id, c.user_id, c.coins, c.balance, now, now);
        }

        // 13. Payments
        db.prepare(`
          INSERT INTO normalized_payments (id, user_id, amount, currency_type, payment_method, status, description, transaction_hash, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
          VALUES ('pay-1', 'u-3', 50.0, 'real', 'pix', 'completed', 'Recarga de Saldo Real de Semeador', 'tx_hash_pix_seeder_2026', ?, ?, NULL, 'system_seeder', 'system_seeder')
        `).run(now, now);

        // 14. Subscriptions
        db.prepare(`
          INSERT INTO normalized_subscriptions (id, user_id, plan_name, price_per_month, status, expires_at, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
          VALUES ('sub-1', 'u-2', 'vip_gamer', 29.90, 'active', '2026-12-31T23:59:59Z', ?, ?, NULL, 'system_seeder', 'system_seeder')
        `).run(now, now);

        // 15. Streaming
        db.prepare(`
          INSERT INTO normalized_streaming (id, broadcaster_id, title, game_id, stream_url, viewers_count, is_live, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
          VALUES ('strm-1', 'u-2', 'Carla Live: Rumo ao Rank Lendário!', 'g-1', 'rtmp://live.gamezone.com/u-2', 145, 1, ?, ?, NULL, 'system_seeder', 'system_seeder')
        `).run(now, now);

        // 16. Marketplace
        db.prepare(`
          INSERT INTO normalized_marketplace (id, seller_id, store_name, commission_rate, is_active, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
          VALUES ('mk-1', 'u-2', 'Carla Virtual Store', 0.10, 1, ?, ?, NULL, 'system_seeder', 'system_seeder')
        `).run(now, now);

        // 17. Products
        db.prepare(`
          INSERT INTO normalized_products (id, marketplace_id, title, price, description, category, is_available, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
          VALUES ('prod-1', 'mk-1', 'Caneca Personalizada Carla Streamer', 45.0, 'Uma caneca premium resistente com estampa exclusiva de pixel art!', 'merchandise', 1, ?, ?, NULL, 'system_seeder', 'system_seeder')
        `).run(now, now);

        // 18. Orders
        db.prepare(`
          INSERT INTO normalized_orders (id, buyer_id, product_id, total_price, commission_amount, status, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
          VALUES ('ord-1', 'u-3', 'prod-1', 45.0, 4.50, 'completed', ?, ?, NULL, 'system_seeder', 'system_seeder')
        `).run(now, now);

        // 19. Reports
        db.prepare(`
          INSERT INTO normalized_reports (id, reporter_id, reported_user_id, content_type, content_id, reason, status, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
          VALUES ('rep-1', 'u-3', 'u-1', 'chat', 'msg-99', 'Spam excessivo de canais no chat global', 'pending', ?, ?, NULL, 'system_seeder', 'system_seeder')
        `).run(now, now);

        // 20. Database Operation Logs
        db.prepare(`
          INSERT INTO normalized_db_operation_logs (id, operator_id, table_name, operation_type, payload_before, payload_after, security_signature, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
          VALUES ('dop-1', 'u-1', 'normalized_users', 'INSERT', NULL, '{"id": "u-1", "email": "vitor.gamer@gamezone.com"}', 'sha256_sig_sample', ?, ?, NULL, 'system_seeder', 'system_seeder')
        `).run(now, now);

        // 21. Permissions
        const permissions = [
          { id: 'perm-1', role: 'admin', resource: 'all', action: 'all' },
          { id: 'perm-2', role: 'user', resource: 'chat', action: 'write' },
          { id: 'perm-3', role: 'auditor', resource: 'financial', action: 'read' }
        ];
        for (const p of permissions) {
          db.prepare(`
            INSERT INTO normalized_permissions (id, role, resource, action, is_granted, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
            VALUES (?, ?, ?, ?, 1, ?, ?, NULL, 'system_seeder', 'system_seeder')
          `).run(p.id, p.role, p.resource, p.action, now, now);
        }

        // 22. Audited History
        db.prepare(`
          INSERT INTO normalized_audited_history (id, action_type, details, ip_address, user_agent, hmac_signature, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
          VALUES ('aud-1', 'DATA_EXPORT_LGPD', 'Exportação portátil de dados LGPD iniciada pelo usuário u-3.', '127.0.0.1', 'Mozilla/5.0 Seeder', 'hmac_sha256_signature_proof_2026', ?, ?, NULL, 'system_seeder', 'system_seeder')
        `).run(now, now);

        return { success: true, seededCount: 22 };
      });
      return tx();
    } catch (err: any) {
      console.error('[SEED RELATIONAL ERROR]', err);
      return { success: false, seededCount: 0, error: err.message };
    }
  },

  // --- PAYMENTS INFRASTRUCTURE METHODS ---
  getCoupons: () => {
    return db.prepare("SELECT * FROM payment_coupons").all();
  },
  getCouponByCode: (code: string) => {
    return db.prepare("SELECT * FROM payment_coupons WHERE code = ? AND active = 1").get(code);
  },
  useCoupon: (code: string) => {
    db.prepare("UPDATE payment_coupons SET uses = uses + 1 WHERE code = ?").run(code);
  },
  createCoupon: (id: string, code: string, type: string, value: number, maxUses: number) => {
    db.prepare("INSERT INTO payment_coupons (id, code, type, value, active, max_uses, uses) VALUES (?, ?, ?, ?, 1, ?, 0)").run(id, code, type, value, maxUses);
  },
  getAffiliateByReferredUser: (referredUserId: string) => {
    return db.prepare("SELECT * FROM payment_affiliates WHERE referred_user_id = ?").get(referredUserId);
  },
  getAffiliateReferrals: (affiliateId: string) => {
    return db.prepare("SELECT * FROM payment_affiliates WHERE affiliate_id = ?").all();
  },
  addAffiliateReferral: (id: string, affiliateId: string, referredUserId: string, status: string, createdAt: string) => {
    db.prepare("INSERT OR IGNORE INTO payment_affiliates (id, affiliate_id, referred_user_id, status, created_at) VALUES (?, ?, ?, ?, ?)").run(id, affiliateId, referredUserId, status, createdAt);
  },
  updateAffiliateReferralStatus: (referredUserId: string, status: string) => {
    db.prepare("UPDATE payment_affiliates SET status = ? WHERE referred_user_id = ?").run(status, referredUserId);
  },
  getAffiliateCommissions: (affiliateId: string) => {
    return db.prepare("SELECT * FROM payment_commissions WHERE affiliate_id = ?").all();
  },
  addCommission: (id: string, affiliateId: string, referredUserId: string, transactionId: string, amount: number, status: string, createdAt: string) => {
    db.prepare("INSERT INTO payment_commissions (id, affiliate_id, referred_user_id, transaction_id, amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, affiliateId, referredUserId, transactionId, amount, status, createdAt);
  },
  getInvoices: (userId: string) => {
    return db.prepare("SELECT * FROM payment_invoices WHERE user_id = ? ORDER BY created_at DESC").all();
  },
  getAllInvoices: () => {
    return db.prepare("SELECT * FROM payment_invoices ORDER BY created_at DESC").all();
  },
  createInvoice: (id: string, invoiceNumber: string, userId: string, amount: number, status: string, issueDate: string, dueDate: string, type: string, pdfContent: string, createdAt: string) => {
    db.prepare("INSERT INTO payment_invoices (id, invoice_number, user_id, amount, status, issue_date, due_date, type, pdf_content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, invoiceNumber, userId, amount, status, issueDate, dueDate, type, pdfContent, createdAt);
  },
  updateInvoiceStatus: (id: string, status: string) => {
    db.prepare("UPDATE payment_invoices SET status = ? WHERE id = ?").run(status, id);
  },
  getWebhookLogs: () => {
    return db.prepare("SELECT * FROM payment_webhooks ORDER BY timestamp DESC LIMIT 100").all();
  },
  addWebhookLog: (id: string, provider: string, eventType: string, payload: string, status: string, responseStatus: number, timestamp: string) => {
    db.prepare("INSERT INTO payment_webhooks (id, provider, event_type, payload, status, response_status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, provider, eventType, payload, status, responseStatus, timestamp);
  },
  getConciliationRecords: () => {
    return db.prepare("SELECT * FROM payment_conciliation ORDER BY reconciled_at DESC").all();
  },
  createOrUpdateConciliation: (id: string, transactionId: string, isReconciled: number, reconciledAt: string, notes: string, systemAmount: number, providerAmount: number, status: string) => {
    db.prepare(`
      INSERT INTO payment_conciliation (id, transaction_id, is_reconciled, reconciled_at, notes, system_amount, provider_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(transaction_id) DO UPDATE SET
        is_reconciled = excluded.is_reconciled,
        reconciled_at = excluded.reconciled_at,
        notes = excluded.notes,
        system_amount = excluded.system_amount,
        provider_amount = excluded.provider_amount,
        status = excluded.status
    `).run(id, transactionId, isReconciled, reconciledAt, notes, systemAmount, providerAmount, status);
  },

  // --- CORPORATE ADMIN PANEL EXPANSIONS ---
  getAdminUsers: () => {
    return db.prepare(`
      SELECT u.id, u.email, u.role, p.nome, p.username, p.avatar, p.biografia, p.stats, p.real_balance, p.withdraw_limit
      FROM usuarios u
      LEFT JOIN perfis p ON u.id = p.usuario_id
    `).all();
  },
  getAdminReports: () => {
    return db.prepare(`SELECT * FROM normalized_reports ORDER BY created_at DESC`).all();
  },
  updateReportStatus: (id: string, status: string) => {
    db.prepare(`UPDATE normalized_reports SET status = ?, updated_at = ? WHERE id = ?`).run(status, new Date().toISOString(), id);
  },
  getAdminStreams: () => {
    return db.prepare(`SELECT * FROM normalized_streaming ORDER BY created_at DESC`).all();
  },
  updateStreamStatus: (id: string, isLive: number, viewers: number) => {
    db.prepare(`UPDATE normalized_streaming SET is_live = ?, viewers_count = ?, updated_at = ? WHERE id = ?`).run(isLive, viewers, new Date().toISOString(), id);
  },
  getAdminMarketplaces: () => {
    return db.prepare(`SELECT * FROM normalized_marketplace ORDER BY created_at DESC`).all();
  },
  getAdminProducts: () => {
    return db.prepare(`SELECT * FROM normalized_products ORDER BY created_at DESC`).all();
  },
  updateMarketplaceStatus: (id: string, isActive: number) => {
    db.prepare(`UPDATE normalized_marketplace SET is_active = ?, updated_at = ? WHERE id = ?`).run(isActive, new Date().toISOString(), id);
  },
  updateProductAvailability: (id: string, isAvailable: number) => {
    db.prepare(`UPDATE normalized_products SET is_available = ?, updated_at = ? WHERE id = ?`).run(isAvailable, new Date().toISOString(), id);
  },
  getAdminPosts: () => {
    return db.prepare(`SELECT * FROM posts ORDER BY criado_em DESC`).all();
  },
  deletePostAdmin: (id: string) => {
    db.prepare(`DELETE FROM posts WHERE id = ?`).run(id);
  },
  getAdminActiveSessions: () => {
    return db.prepare(`SELECT * FROM sessoes_ativas ORDER BY ultimo_acesso DESC`).all();
  },
  terminateSessionAdmin: (id: string) => {
    db.prepare(`UPDATE sessoes_ativas SET ativa = 0 WHERE id = ?`).run(id);
  },
  getAdminIpBlocks: () => {
    return db.prepare(`SELECT * FROM bloqueios_ip`).all();
  },
  addIpBlockAdmin: (ip: string, blockUntil: string) => {
    db.prepare(`
      INSERT INTO bloqueios_ip (ip, tentativas, bloqueado_ate)
      VALUES (?, 5, ?)
      ON CONFLICT(ip) DO UPDATE SET tentativas = 5, bloqueado_ate = excluded.bloqueado_ate
    `).run(ip, blockUntil);
  },
  removeIpBlockAdmin: (ip: string) => {
    db.prepare(`DELETE FROM bloqueios_ip WHERE ip = ?`).run(ip);
  },
  updateUserStatsAndBalance: (userId: string, balance: number, coins: number, level: number) => {
    const profile = db.prepare(`SELECT * FROM perfis WHERE usuario_id = ?`).get(userId) as any;
    if (profile) {
      let statsObj = { coins, level, lives: 3, currentStage: 1, highScore: 0, unlockedSkins: ["classic"], unlockedAccessories: ["none"], unlockedAuras: ["none"], avatar: { skin: "classic", accessory: "none", aura: "none" } };
      if (profile.stats) {
        try {
          const parsed = JSON.parse(profile.stats);
          statsObj = { ...parsed, coins, level };
        } catch {}
      }
      db.prepare(`UPDATE perfis SET real_balance = ?, stats = ? WHERE usuario_id = ?`).run(
        balance,
        JSON.stringify(statsObj),
        userId
      );
    }
  },
  updateUserShadowban: (userId: string, shadowban: number) => {
    const profile = db.prepare(`SELECT * FROM perfis WHERE usuario_id = ?`).get(userId) as any;
    if (profile) {
      let statsObj: any = { isShadowbanned: shadowban };
      if (profile.stats) {
        try {
          statsObj = JSON.parse(profile.stats);
          statsObj.isShadowbanned = shadowban;
        } catch {}
      }
      db.prepare(`UPDATE perfis SET stats = ? WHERE usuario_id = ?`).run(JSON.stringify(statsObj), userId);
    }
  },
  getNotifications: (userId: string) => {
    return db.prepare(`SELECT * FROM normalized_notifications WHERE user_id = ? ORDER BY created_at DESC`).all(userId);
  },
  addNotification: (id: string, userId: string, title: string, body: string, type: string, createdAt: string) => {
    // Ensure user exists in normalized_users to prevent FOREIGN KEY constraint failed
    const userExists = db.prepare(`SELECT 1 FROM normalized_users WHERE id = ?`).get(userId);
    if (!userExists) {
      // Look them up in legacy usuarios/perfis table
      const legacyUser = db.prepare(`
        SELECT u.email, p.nome, p.avatar 
        FROM usuarios u 
        LEFT JOIN perfis p ON u.id = p.usuario_id 
        WHERE u.id = ?
      `).get(userId) as any;

      const email = legacyUser?.email || `${userId.replace(/[^a-zA-Z0-9_\-]/g, '_')}@gamezone.com`;
      const name = legacyUser?.nome || 'Jogador';
      const avatar = legacyUser?.avatar || null;
      const nowIso = new Date().toISOString();
      const generatedUsername = (name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'jogador') + '_' + Math.floor(1000 + Math.random() * 9000);

      db.prepare(`
        INSERT INTO normalized_users (id, email, password_hash, role, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
        VALUES (?, ?, 'social_auth', 'user', ?, ?, NULL, 'system', 'system')
        ON CONFLICT(id) DO UPDATE SET email=excluded.email, updated_at=excluded.updated_at
      `).run(userId, email, nowIso, nowIso);

      const profileId = 'p-' + userId.replace(/[^a-zA-Z0-9_\-]/g, '_');
      db.prepare(`
        INSERT INTO normalized_profiles (id, user_id, display_name, username, avatar_url, bio, status, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
        VALUES (?, ?, ?, ?, ?, '', 'offline', ?, ?, NULL, 'system', 'system')
        ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name, avatar_url=excluded.avatar_url, updated_at=excluded.updated_at
      `).run(profileId, userId, name, generatedUsername, avatar, nowIso, nowIso);
    }

    db.prepare(`
      INSERT INTO normalized_notifications (id, user_id, title, body, type, is_read, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?, NULL, 'system', 'system')
    `).run(id, userId, title, body, type, createdAt, createdAt);
  },
  markNotificationRead: (id: string, isRead: number) => {
    db.prepare(`UPDATE normalized_notifications SET is_read = ?, updated_at = ? WHERE id = ?`).run(isRead, new Date().toISOString(), id);
  },
  markAllNotificationsRead: (userId: string) => {
    db.prepare(`UPDATE normalized_notifications SET is_read = 1, updated_at = ? WHERE user_id = ? AND is_read = 0`).run(new Date().toISOString(), userId);
  },
  archiveNotification: (id: string, archivedAt: string) => {
    db.prepare(`UPDATE normalized_notifications SET deleted_at = ?, updated_at = ? WHERE id = ?`).run(archivedAt, archivedAt, id);
  },
  deleteNotification: (id: string) => {
    db.prepare(`DELETE FROM normalized_notifications WHERE id = ?`).run(id);
  },
  getNotificationPreferences: (userId: string) => {
    return db.prepare(`SELECT * FROM notificacoes_preferencias WHERE user_id = ?`).get(userId);
  },
  saveNotificationPreferences: (userId: string, preferencesJson: string, updatedAt: string) => {
    db.prepare(`
      INSERT INTO notificacoes_preferencias (user_id, preferences, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET preferences = excluded.preferences, updated_at = excluded.updated_at
    `).run(userId, preferencesJson, updatedAt);
  },
  getSentEmails: (userId: string) => {
    return db.prepare(`SELECT * FROM notificacoes_emails_enviados WHERE user_id = ? ORDER BY sent_at DESC`).all(userId);
  },
  addSentEmail: (id: string, userId: string, email: string, title: string, body: string, sentAt: string, status: string) => {
    db.prepare(`
      INSERT INTO notificacoes_emails_enviados (id, user_id, email, title, body, sent_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, email, title, body, sentAt, status);
  },

  // --- ADVANCED SOCIAL NETWORK MODULES ---
  // Stories
  getStories: (): Story[] => {
    return db.prepare("SELECT * FROM stories WHERE datetime(expires_at) > datetime('now') ORDER BY created_at DESC").all() as any[];
  },
  addStory: (story: Story) => {
    db.prepare(`
      INSERT INTO stories (id, usuario_id, username, user_avatar_url, media_url, media_type, bg_color, text, created_at, expires_at, is_flagged, flag_reason, ai_mod_verdict)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      story.id,
      story.usuario_id || null,
      story.username,
      story.user_avatar_url || null,
      story.media_url || null,
      story.media_type || 'image',
      story.bg_color || null,
      story.text || null,
      story.created_at,
      story.expires_at,
      story.is_flagged ? 1 : 0,
      story.flag_reason || null,
      story.ai_mod_verdict ? JSON.stringify(story.ai_mod_verdict) : null
    );
  },
  deleteStory: (storyId: string, userId: string) => {
    const result = db.prepare("DELETE FROM stories WHERE id = ? AND usuario_id = ?").run(storyId, userId);
    return result.changes > 0;
  },

  // Groups and Communities
  getSocialGroups: (): SocialGroup[] => {
    return db.prepare("SELECT * FROM social_groups ORDER BY created_at DESC").all() as any[];
  },
  addSocialGroup: (group: SocialGroup) => {
    db.prepare(`
      INSERT INTO social_groups (id, name, description, creator_id, avatar_url, banner_url, type, member_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      group.id,
      group.name,
      group.description || null,
      group.creator_id,
      group.avatar_url || null,
      group.banner_url || null,
      group.type || 'group',
      group.created_at
    );
    // Auto-join the creator as admin
    db.prepare(`
      INSERT OR IGNORE INTO social_memberships (id, user_id, target_id, target_type, role, created_at)
      VALUES (?, ?, ?, ?, 'admin', ?)
    `).run(`mem-${group.id}-${group.creator_id}`, group.creator_id, group.id, group.type || 'group', group.created_at);
  },
  joinGroup: (userId: string, targetId: string, targetType: string, createdAt: string) => {
    try {
      db.prepare(`
        INSERT INTO social_memberships (id, user_id, target_id, target_type, role, created_at)
        VALUES (?, ?, ?, ?, 'member', ?)
      `).run(`mem-${targetId}-${userId}`, userId, targetId, targetType, createdAt);
      // Update count
      if (targetType === 'group' || targetType === 'community') {
        db.prepare("UPDATE social_groups SET member_count = member_count + 1 WHERE id = ?").run(targetId);
      }
      return true;
    } catch {
      return false;
    }
  },
  leaveGroup: (userId: string, targetId: string, targetType: string) => {
    const result = db.prepare("DELETE FROM social_memberships WHERE user_id = ? AND target_id = ? AND target_type = ?").run(userId, targetId, targetType);
    if (result.changes > 0) {
      if (targetType === 'group' || targetType === 'community') {
        db.prepare("UPDATE social_groups SET member_count = MAX(0, member_count - 1) WHERE id = ?").run(targetId);
      }
      return true;
    }
    return false;
  },
  getMemberships: (userId: string) => {
    return db.prepare("SELECT * FROM social_memberships WHERE user_id = ?").all();
  },
  getGroupMembers: (groupId: string) => {
    return db.prepare(`
      SELECT m.user_id, m.role, p.nome, p.username, p.avatar 
      FROM social_memberships m
      LEFT JOIN perfis p ON m.user_id = p.usuario_id
      WHERE m.target_id = ?
    `).all(groupId);
  },

  // Events
  getSocialEvents: (): SocialEvent[] => {
    return db.prepare("SELECT * FROM social_events ORDER BY date ASC").all() as any[];
  },
  addSocialEvent: (event: SocialEvent) => {
    db.prepare(`
      INSERT INTO social_events (id, title, description, creator_id, date, location, avatar_url, banner_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.id,
      event.title,
      event.description || null,
      event.creator_id,
      event.date,
      event.location || null,
      event.avatar_url || null,
      event.banner_url || null,
      event.created_at
    );
    // Auto RSVP
    db.prepare(`
      INSERT OR IGNORE INTO social_memberships (id, user_id, target_id, target_type, role, created_at)
      VALUES (?, ?, ?, 'event', 'admin', ?)
    `).run(`mem-${event.id}-${event.creator_id}`, event.creator_id, event.id, event.created_at);
  },

  // Pages
  getSocialPages: (): SocialPage[] => {
    return db.prepare("SELECT * FROM social_pages ORDER BY name ASC").all() as any[];
  },
  addSocialPage: (page: SocialPage) => {
    db.prepare(`
      INSERT INTO social_pages (id, name, description, creator_id, avatar_url, banner_url, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      page.id,
      page.name,
      page.description || null,
      page.creator_id,
      page.avatar_url || null,
      page.banner_url || null,
      page.category || null,
      page.created_at
    );
    // Auto Follow/Like
    db.prepare(`
      INSERT OR IGNORE INTO social_memberships (id, user_id, target_id, target_type, role, created_at)
      VALUES (?, ?, ?, 'page', 'admin', ?)
    `).run(`mem-${page.id}-${page.creator_id}`, page.creator_id, page.id, page.created_at);
  },

  // Reports creation (User-facing report system)
  addReport: (id: string, reporterId: string, reportedUserId: string | null, contentType: string, contentId: string, reason: string, status: string, createdAt: string) => {
    db.prepare(`
      INSERT INTO normalized_reports (id, reporter_id, reported_user_id, content_type, content_id, reason, status, created_at, updated_at, audit_created_by, audit_updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, reporterId, reportedUserId, contentType, contentId, reason, status, createdAt, createdAt, reporterId, reporterId);
  }
};
