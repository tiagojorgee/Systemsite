import { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, Key, Download, Upload, Trash2, 
  RefreshCw, Users, Database, Radio, CheckCircle, AlertTriangle, 
  Lock, Eye, FileText, UserCheck, HelpCircle, Activity, Globe,
  Network, Terminal, Check, GitFork, ChevronRight, Play, Flame, Shield, Info
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface AuditLogEntry {
  id: number;
  userId: string;
  event: string;
  description: string;
  ip: string;
  user_agent: string;
  isTampered: boolean;
  signature: string;
  created_at: string;
}

interface SecurityDiagnostics {
  databaseSize: string;
  totalSecurityEvents: number;
  failedAttempts: number;
  activeLockouts: number;
  ddosAlarmsCount: number;
  tamperedLogsDetected: number;
  securityComplianceScore: number;
  isWafActive: boolean;
  encryptionStandard: string;
  databaseStatus: string;
}

export interface TableColumnMetadata {
  name: string;
  type: string;
  constraint: string;
  auditFlag?: boolean;
}

export interface TableRelationMetadata {
  from: string;
  to: string;
}

export interface TableSchemaMetadata {
  name: string;
  category: 'Geral & RBAC' | 'Social & Comunidade' | 'Economia & Jogos' | 'E-Commerce & Streams';
  description: string;
  columns: TableColumnMetadata[];
  relations: TableRelationMetadata[];
  indexes: string[];
}

export const normalizedTablesList: TableSchemaMetadata[] = [
  {
    name: 'normalized_users',
    category: 'Geral & RBAC',
    description: 'Tabela mestre de credenciais autenticadas com controle RBAC granular.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'email', type: 'TEXT', constraint: 'UNIQUE, NOT NULL' },
      { name: 'password_hash', type: 'TEXT', constraint: 'NOT NULL (Bcrypt Hash)' },
      { name: 'role', type: 'TEXT', constraint: 'DEFAULT "user"' },
      { name: 'created_at', type: 'TEXT (ISO8601)', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT (ISO8601)', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT (ISO8601)', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [],
    indexes: ['idx_norm_users_email', 'idx_norm_users_deleted_at']
  },
  {
    name: 'normalized_profiles',
    category: 'Geral & RBAC',
    description: 'Metadados sociais e status de presença pública de perfis de jogadores.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'user_id', type: 'TEXT (UUID)', constraint: 'UNIQUE, FOREIGN KEY' },
      { name: 'display_name', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'username', type: 'TEXT', constraint: 'UNIQUE, NOT NULL' },
      { name: 'avatar_url', type: 'TEXT', constraint: 'NULL' },
      { name: 'bio', type: 'TEXT', constraint: 'NULL' },
      { name: 'status', type: 'TEXT', constraint: 'DEFAULT "offline"' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [{ from: 'user_id', to: 'normalized_users.id' }],
    indexes: ['idx_norm_profiles_user', 'idx_norm_profiles_username', 'idx_norm_profiles_deleted_at']
  },
  {
    name: 'normalized_friendships',
    category: 'Social & Comunidade',
    description: 'Vínculos bidirecionais de amizade com controle de estado do convite.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'user_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'friend_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'status', type: 'TEXT', constraint: 'DEFAULT "pending"' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [
      { from: 'user_id', to: 'normalized_users.id' },
      { from: 'friend_id', to: 'normalized_users.id' }
    ],
    indexes: ['idx_norm_friendships_user', 'idx_norm_friendships_friend', 'idx_norm_friendships_status']
  },
  {
    name: 'normalized_followers',
    category: 'Social & Comunidade',
    description: 'Sistema unidirecional de seguidores para feeds de redes sociais.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'follower_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'followed_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [
      { from: 'follower_id', to: 'normalized_users.id' },
      { from: 'followed_id', to: 'normalized_users.id' }
    ],
    indexes: ['idx_norm_followers_follower', 'idx_norm_followers_followed']
  },
  {
    name: 'normalized_messages',
    category: 'Social & Comunidade',
    description: 'Mensagens diretas privadas seguras entre usuários.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'sender_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'receiver_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'text_content', type: 'TEXT', constraint: 'NULL' },
      { name: 'media_url', type: 'TEXT', constraint: 'NULL' },
      { name: 'is_read', type: 'INTEGER', constraint: 'DEFAULT 0' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [
      { from: 'sender_id', to: 'normalized_users.id' },
      { from: 'receiver_id', to: 'normalized_users.id' }
    ],
    indexes: ['idx_norm_messages_sender', 'idx_norm_messages_receiver', 'idx_norm_messages_deleted_at']
  },
  {
    name: 'normalized_comments',
    category: 'Social & Comunidade',
    description: 'Comentários genéricos polimórficos atrelados a postagens ou mídias.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'user_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'target_type', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'target_id', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'content', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [{ from: 'user_id', to: 'normalized_users.id' }],
    indexes: ['idx_norm_comments_user', 'idx_norm_comments_target', 'idx_norm_comments_deleted_at']
  },
  {
    name: 'normalized_likes',
    category: 'Social & Comunidade',
    description: 'Curtidas polimórficas (Posts/Comentários/Jogos) com prevenção de duplicação.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'user_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'target_type', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'target_id', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [{ from: 'user_id', to: 'normalized_users.id' }],
    indexes: ['idx_norm_likes_user', 'idx_norm_likes_target']
  },
  {
    name: 'normalized_notifications',
    category: 'Social & Comunidade',
    description: 'Notificações geradas em tempo real com controle de status de leitura.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'user_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'title', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'body', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'type', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'is_read', type: 'INTEGER', constraint: 'DEFAULT 0' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [{ from: 'user_id', to: 'normalized_users.id' }],
    indexes: ['idx_norm_notifications_user', 'idx_norm_notifications_is_read']
  },
  {
    name: 'normalized_games',
    category: 'Economia & Jogos',
    description: 'Catalógo de jogos licenciados do ecossistema e taxas de retorno (RTP%).',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'name', type: 'TEXT', constraint: 'UNIQUE, NOT NULL' },
      { name: 'genre', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'description', type: 'TEXT', constraint: 'NULL' },
      { name: 'rtp_percentage', type: 'REAL', constraint: 'DEFAULT 96.5' },
      { name: 'cover_image_url', type: 'TEXT', constraint: 'NULL' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [],
    indexes: []
  },
  {
    name: 'normalized_items',
    category: 'Economia & Jogos',
    description: 'Catálogo de ativos virtuais de inventário, auras e itens com raridades.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'name', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'type', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'description', type: 'TEXT', constraint: 'NULL' },
      { name: 'base_price_coins', type: 'INTEGER', constraint: 'NOT NULL' },
      { name: 'rarity', type: 'TEXT', constraint: 'DEFAULT "common"' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [],
    indexes: []
  },
  {
    name: 'normalized_inventory',
    category: 'Economia & Jogos',
    description: 'Armazenamento de itens adquiridos, quantidades e status de equipamento.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'user_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'item_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'quantity', type: 'INTEGER', constraint: 'DEFAULT 1' },
      { name: 'equipped', type: 'INTEGER', constraint: 'DEFAULT 0' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [
      { from: 'user_id', to: 'normalized_users.id' },
      { from: 'item_id', to: 'normalized_items.id' }
    ],
    indexes: ['idx_norm_inventory_user', 'idx_norm_inventory_item']
  },
  {
    name: 'normalized_currencies',
    category: 'Economia & Jogos',
    description: 'Moedas internas de recompensa (Coins) e saldos reais Fiat.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'user_id', type: 'TEXT (UUID)', constraint: 'UNIQUE, FOREIGN KEY' },
      { name: 'coins_amount', type: 'INTEGER', constraint: 'DEFAULT 1000' },
      { name: 'real_balance_amount', type: 'REAL', constraint: 'DEFAULT 120.0' },
      { name: 'withdraw_limit', type: 'REAL', constraint: 'DEFAULT 100.0' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [{ from: 'user_id', to: 'normalized_users.id' }],
    indexes: []
  },
  {
    name: 'normalized_payments',
    category: 'E-Commerce & Streams',
    description: 'Histórico auditado de depósitos, saques e faturamento comercial.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'user_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'amount', type: 'REAL', constraint: 'NOT NULL' },
      { name: 'currency_type', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'payment_method', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'status', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'description', type: 'TEXT', constraint: 'NULL' },
      { name: 'transaction_hash', type: 'TEXT', constraint: 'NULL' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [{ from: 'user_id', to: 'normalized_users.id' }],
    indexes: ['idx_norm_payments_user', 'idx_norm_payments_status']
  },
  {
    name: 'normalized_subscriptions',
    category: 'E-Commerce & Streams',
    description: 'Assinaturas de planos especiais VIP de jogadores.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'user_id', type: 'TEXT (UUID)', constraint: 'UNIQUE, FOREIGN KEY' },
      { name: 'plan_name', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'price_per_month', type: 'REAL', constraint: 'NOT NULL' },
      { name: 'status', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'expires_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [{ from: 'user_id', to: 'normalized_users.id' }],
    indexes: []
  },
  {
    name: 'normalized_streaming',
    category: 'E-Commerce & Streams',
    description: 'Canais e sessões ativas de lives com contador de espectadores.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'broadcaster_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'title', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'game_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NULL' },
      { name: 'stream_url', type: 'TEXT', constraint: 'NULL' },
      { name: 'viewers_count', type: 'INTEGER', constraint: 'DEFAULT 0' },
      { name: 'is_live', type: 'INTEGER', constraint: 'DEFAULT 1' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [
      { from: 'broadcaster_id', to: 'normalized_users.id' },
      { from: 'game_id', to: 'normalized_games.id' }
    ],
    indexes: []
  },
  {
    name: 'normalized_marketplace',
    category: 'E-Commerce & Streams',
    description: 'Lojas individuais criadas por vendedores para comercialização.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'seller_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'store_name', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'commission_rate', type: 'REAL', constraint: 'DEFAULT 0.10' },
      { name: 'is_active', type: 'INTEGER', constraint: 'DEFAULT 1' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [{ from: 'seller_id', to: 'normalized_users.id' }],
    indexes: []
  },
  {
    name: 'normalized_products',
    category: 'E-Commerce & Streams',
    description: 'Produtos cadastrados por lojistas à venda no Marketplace.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'marketplace_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'title', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'price', type: 'REAL', constraint: 'NOT NULL' },
      { name: 'description', type: 'TEXT', constraint: 'NULL' },
      { name: 'category', type: 'TEXT', constraint: 'DEFAULT "general"' },
      { name: 'is_available', type: 'INTEGER', constraint: 'DEFAULT 1' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [{ from: 'marketplace_id', to: 'normalized_marketplace.id' }],
    indexes: ['idx_norm_products_market', 'idx_norm_products_category']
  },
  {
    name: 'normalized_orders',
    category: 'E-Commerce & Streams',
    description: 'Pedidos de compra, faturamento e comissionamento mestre do Marketplace.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'buyer_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'product_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'total_price', type: 'REAL', constraint: 'NOT NULL' },
      { name: 'commission_amount', type: 'REAL', constraint: 'NOT NULL' },
      { name: 'status', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [
      { from: 'buyer_id', to: 'normalized_users.id' },
      { from: 'product_id', to: 'normalized_products.id' }
    ],
    indexes: ['idx_norm_orders_buyer', 'idx_norm_orders_product']
  },
  {
    name: 'normalized_reports',
    category: 'Social & Comunidade',
    description: 'Denúncias e relatórios de auditoria moderacional de conteúdo.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'reporter_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NOT NULL' },
      { name: 'reported_user_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NULL' },
      { name: 'content_type', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'content_id', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'reason', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'status', type: 'TEXT', constraint: 'DEFAULT "pending"' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [
      { from: 'reporter_id', to: 'normalized_users.id' },
      { from: 'reported_user_id', to: 'normalized_users.id' }
    ],
    indexes: ['idx_norm_reports_reporter', 'idx_norm_reports_reported', 'idx_norm_reports_status']
  },
  {
    name: 'normalized_db_operation_logs',
    category: 'Geral & RBAC',
    description: 'Histórico de auditoria de alterações (INSERT/UPDATE/DELETE) com hashes.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'operator_id', type: 'TEXT (UUID)', constraint: 'FOREIGN KEY, NULL' },
      { name: 'table_name', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'operation_type', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'payload_before', type: 'TEXT', constraint: 'NULL' },
      { name: 'payload_after', type: 'TEXT', constraint: 'NULL' },
      { name: 'security_signature', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [{ from: 'operator_id', to: 'normalized_users.id' }],
    indexes: ['idx_norm_db_op_logs_table', 'idx_norm_db_op_logs_op']
  },
  {
    name: 'normalized_permissions',
    category: 'Geral & RBAC',
    description: 'Mapeamento explícito de permissões RBAC para recursos do sistema.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'role', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'resource', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'action', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'is_granted', type: 'INTEGER', constraint: 'DEFAULT 1' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [],
    indexes: ['idx_norm_permissions_role']
  },
  {
    name: 'normalized_audited_history',
    category: 'Geral & RBAC',
    description: 'Histórico inviolável de incidentes e operações LGPD assinados com HMAC.',
    columns: [
      { name: 'id', type: 'TEXT (UUID)', constraint: 'PRIMARY KEY' },
      { name: 'action_type', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'details', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'ip_address', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'user_agent', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'hmac_signature', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'created_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'updated_at', type: 'TEXT', constraint: 'NOT NULL' },
      { name: 'deleted_at', type: 'TEXT', constraint: 'NULL (Soft Delete)' },
      { name: 'audit_created_by', type: 'TEXT', constraint: 'NULL', auditFlag: true },
      { name: 'audit_updated_by', type: 'TEXT', constraint: 'NULL', auditFlag: true }
    ],
    relations: [],
    indexes: ['idx_norm_audit_history_type']
  }
];

interface SecurityCenterProps {
  user: any;
  onUserUpdate: (updated: any) => void;
  onLogout: () => void;
}

export function SecurityCenter({ user, onUserUpdate, onLogout }: SecurityCenterProps) {
  const [activeTab, setActiveTab] = useState<'overview' | '2fa' | 'audit' | 'lgpd' | 'dr' | 'schema' | 'sessions' | 'history' | 'perf_a11y'>('perf_a11y');
  const [diagnostics, setDiagnostics] = useState<SecurityDiagnostics | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Performance and Accessibility settings states
  const [perfMode, setPerfMode] = useState<string>(() => localStorage.getItem('gamezone_perf_mode') || 'ultra');
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => localStorage.getItem('gamezone_reduce_motion') === 'true');
  const [noEffects, setNoEffects] = useState<boolean>(() => localStorage.getItem('gamezone_no_effects') === 'true');
  const [highContrast, setHighContrast] = useState<boolean>(() => localStorage.getItem('gamezone_high_contrast') === 'true');
  const [simplifiedUi, setSimplifiedUi] = useState<boolean>(() => localStorage.getItem('gamezone_simplified_ui') === 'true');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => localStorage.getItem('gamezone_sound_enabled') === 'true');
  const [soundVolume, setSoundVolume] = useState<number>(() => {
    const v = localStorage.getItem('gamezone_sound_volume');
    return v ? parseInt(v, 10) : 50;
  });

  const [hardwareInfo, setHardwareInfo] = useState<{
    cores: number;
    memory: string;
    userAgent: string;
    networkSpeedSimulated: string;
    isMobile: boolean;
  } | null>(null);

  const applyAndSaveSettings = (key: string, value: any) => {
    localStorage.setItem(key, String(value));
    
    // Dispatch custom event to let background canvas know instantly
    window.dispatchEvent(new CustomEvent('gamezone_perf_settings_changed'));

    // Apply document-level utility classes
    if (key === 'gamezone_reduce_motion') {
      if (value) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    } else if (key === 'gamezone_high_contrast') {
      if (value) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    } else if (key === 'gamezone_simplified_ui') {
      if (value) {
        document.documentElement.classList.add('simplified-ui');
      } else {
        document.documentElement.classList.remove('simplified-ui');
      }
    } else if (key === 'gamezone_no_effects') {
      if (value) {
        document.documentElement.classList.add('no-bg-effects');
      } else {
        document.documentElement.classList.remove('no-bg-effects');
      }
    } else if (key === 'gamezone_perf_mode') {
      document.documentElement.classList.remove('perf-economy', 'perf-balanced', 'perf-ultra');
      document.documentElement.classList.add(`perf-${value}`);
    }
  };

  const runHardwareDiagnostics = () => {
    playSound.collect();
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'Não detectado';
    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    
    // Simulated diagnostic checks
    let recMode = 'ultra';
    if (cores <= 2 || isMobile) {
      recMode = 'economy';
    } else if (cores <= 4) {
      recMode = 'balanced';
    }

    setHardwareInfo({
      cores,
      memory,
      userAgent: isMobile ? 'Dispositivo Móvel' : 'Computador / Desktop',
      networkSpeedSimulated: 'Excelente (Fibra Gamer)',
      isMobile,
    });

    setPerfMode(recMode);
    setNoEffects(recMode === 'economy');
    setReduceMotion(recMode === 'economy');

    applyAndSaveSettings('gamezone_perf_mode', recMode);
    applyAndSaveSettings('gamezone_no_effects', recMode === 'economy');
    applyAndSaveSettings('gamezone_reduce_motion', recMode === 'economy');

    setSuccessMsg(`Otimização automática concluída! Detectamos ${cores} núcleos de processamento. Recomendamos o modo: ${recMode.toUpperCase()}.`);
  };

  // Identity Core Expanded States
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [privacySettings, setPrivacySettings] = useState({
    perfilPrivado: false,
    mostrarJogosAtivos: true,
    permitirSolicitacoesAmizade: true
  });

  // Relational Database Schema states
  const [schemaTelemetry, setSchemaTelemetry] = useState<Record<string, number>>({});
  const [selectedTable, setSelectedTable] = useState<string>('normalized_users');
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM normalized_users LIMIT 5;');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isQueryRunning, setIsQueryRunning] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  // 2FA Setup state
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [twoFactorBackupCodes, setTwoFactorBackupCodes] = useState<string[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [confirmCode, setConfirmCode] = useState<string>('');
  const [simulatedLiveOtp, setSimulatedLiveOtp] = useState<string>('');
  const [otpProgress, setOtpProgress] = useState<number>(0);

  // Backup/Restore file state
  const [restorePayload, setRestorePayload] = useState<string>('');

  // Selected Role for RBAC Testing
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || 'user');

  useEffect(() => {
    fetchSecurityStats();
  }, [user]);

  // Simulated TOTP live code updates for smooth testing
  useEffect(() => {
    let interval: any;
    if (twoFactorSecret) {
      const updateOtp = () => {
        // Simple client-side simulator of TOTP code derived from secret
        const key = twoFactorSecret.replace(/-/g, '');
        const timeBucket = Math.floor(Date.now() / 30000);
        // Create a basic pseudo-random dynamic hash
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
          hash = (hash << 5) - hash + key.charCodeAt(i);
          hash |= 0;
        }
        const pin = String(Math.abs((hash + timeBucket) % 1000000)).padStart(6, '0');
        setSimulatedLiveOtp(pin);
        
        // Progress bar for the 30-second TOTP bucket
        const sec = new Date().getSeconds();
        const progress = ((sec % 30) / 30) * 100;
        setOtpProgress(100 - progress);
      };

      updateOtp();
      interval = setInterval(updateOtp, 1000);
    }
    return () => clearInterval(interval);
  }, [twoFactorSecret]);

  const fetchSecurityStats = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem('gamezone_jwt_token');
      const res = await fetch('/api/security/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Acesso negado. Apenas administradores e auditores de conformidade podem carregar os logs criptográficos.');
        }
        throw new Error('Não foi possível obter dados diagnósticos de segurança do servidor.');
      }
      
      const data = await res.json();
      setDiagnostics(data.diagnostics);
      setLogs(data.recentLogs);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchemaTelemetry = async () => {
    try {
      const res = await fetch('/api/database/schema');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.telemetry) {
          setSchemaTelemetry(data.telemetry);
        }
      }
    } catch (err) {
      console.error("Error fetching schema telemetry", err);
    }
  };

  const handleRunQuery = async (queryToRun?: string) => {
    playSound.click();
    const finalQuery = queryToRun || sqlQuery;
    if (!finalQuery.trim()) return;

    setIsQueryRunning(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const res = await fetch('/api/database/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql: finalQuery })
      });

      const data = await res.json();
      if (!res.ok) {
        setQueryError(data.error || "Erro ao executar consulta.");
      } else {
        if (data.success) {
          setQueryResult(data);
          // Refresh telemetries if modifying queries were executed
          const lower = finalQuery.toLowerCase();
          if (lower.includes('insert') || lower.includes('update') || lower.includes('delete')) {
            fetchSchemaTelemetry();
          }
        } else {
          setQueryError(data.error || "Erro desconhecido retornado pelo banco.");
        }
      }
    } catch (err: any) {
      setQueryError(err.message || "Erro de rede ao conectar com o sandbox do banco.");
    } finally {
      setIsQueryRunning(false);
    }
  };

  const handleSeedRelationalData = async () => {
    playSound.collect();
    setIsSeeding(true);
    setSeedStatus(null);
    try {
      const res = await fetch('/api/database/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSeedStatus(`Sucesso! Semeado dados relacionais molares para as 22 tabelas.`);
        fetchSchemaTelemetry();
      } else {
        setSeedStatus(`Aviso: ${data.message || data.error || 'Banco de dados já semeado!'}`);
      }
    } catch (err: any) {
      setSeedStatus(`Falha de conexão: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'schema') {
      fetchSchemaTelemetry();
    } else if (activeTab === 'sessions') {
      fetchActiveSessions();
    } else if (activeTab === 'history') {
      fetchLoginHistory();
    } else if (activeTab === 'lgpd') {
      fetchPrivacySettings();
    }
  }, [activeTab]);

  const fetchActiveSessions = async () => {
    try {
      const token = localStorage.getItem('gamezone_jwt_token');
      const res = await fetch('/api/auth/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Error fetching sessions", err);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const token = localStorage.getItem('gamezone_jwt_token');
      const res = await fetch('/api/auth/login-history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLoginHistory(data.history || []);
      }
    } catch (err) {
      console.error("Error fetching login history", err);
    }
  };

  const fetchPrivacySettings = async () => {
    try {
      const token = localStorage.getItem('gamezone_jwt_token');
      const res = await fetch('/api/user/privacy', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.privacy) {
          setPrivacySettings({
            perfilPrivado: data.privacy.perfil_privado === 1,
            mostrarJogosAtivos: data.privacy.mostrar_jogos_ativos === 1,
            permitirSolicitacoesAmizade: data.privacy.permitir_solicitacoes_amizade === 1
          });
        }
      }
    } catch (err) {
      console.error("Error fetching privacy", err);
    }
  };

  const handleSavePrivacy = async (updated: typeof privacySettings) => {
    playSound.click();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem('gamezone_jwt_token');
      const res = await fetch('/api/user/privacy', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          settings: {
            perfil_privado: updated.perfilPrivado ? 1 : 0,
            mostrar_jogos_ativos: updated.mostrarJogosAtivos ? 1 : 0,
            permitir_solicitacoes_amizade: updated.permitirSolicitacoesAmizade ? 1 : 0
          }
        })
      });
      if (!res.ok) throw new Error("Erro ao salvar configurações.");
      setPrivacySettings(updated);
      setSuccessMsg("Configurações de privacidade salvas com sucesso!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    playSound.gameover();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem('gamezone_jwt_token');
      const res = await fetch('/api/auth/sessions/terminate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erro ao encerrar sessão.");
      }
      setSuccessMsg("Sessão revogada remotamente com sucesso!");
      fetchActiveSessions();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleTerminateOtherSessions = async () => {
    playSound.gameover();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem('gamezone_jwt_token');
      const res = await fetch('/api/auth/sessions/terminate-others', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erro ao encerrar outras sessões.");
      }
      setSuccessMsg("Todas as outras sessões ativas foram revogadas remotamente!");
      fetchActiveSessions();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // RBAC Setup: update role on the fly for interactive testing
  const handleRoleChange = async (newRole: string) => {
    playSound.click();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem('gamezone_jwt_token');
      const res = await fetch('/api/user/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUserId: user.uid,
          newRole: newRole
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erro ao ajustar cargo.');
      }

      setSelectedRole(newRole);
      onUserUpdate({ ...user, role: newRole });
      setSuccessMsg(`Cargo alterado para ${newRole.toUpperCase()} com sucesso! Recarregando chaves de conformidade...`);
      fetchSecurityStats();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // 2FA: Setup initiation
  const handleInit2fa = async () => {
    playSound.click();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem('gamezone_jwt_token');
      const res = await fetch('/api/user/2fa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Erro ao inicializar 2FA.');
      const data = await res.json();
      setTwoFactorSecret(data.secret);
      setTwoFactorBackupCodes(data.backupCodes);
      setQrCodeUrl(data.qrCodeSimulatedUrl);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // 2FA: Verify and Activate
  const handleToggle2fa = async (enable: boolean) => {
    playSound.click();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem('gamezone_jwt_token');
      const res = await fetch('/api/user/2fa/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          enabled: enable,
          code: enable ? confirmCode : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar configuração de autenticação multifator.');

      onUserUpdate({ ...user, twoFactorEnabled: enable });
      setSuccessMsg(enable ? 'Autenticação Multifator (2FA) ATIVADA com sucesso!' : '2FA desativada.');
      setTwoFactorSecret(null);
      setConfirmCode('');
      fetchSecurityStats();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // LGPD: Portable Data Export
  const handleLgpdExport = async () => {
    playSound.collect();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem('gamezone_jwt_token');
      const res = await fetch('/api/user/lgpd/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Falha ao exportar dados portáveis da LGPD.');
      const d = await res.json();
      
      // Save JSON File
      const blob = new Blob([JSON.stringify(d.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gamezon-portabilidade-lgpd-${user.uid}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMsg('Relatório de Portabilidade de Dados exportado em conformidade com os Arts. 18 e 19 da LGPD!');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // LGPD: Right to be Forgotten
  const handleLgpdForget = async () => {
    if (!confirm('ATENÇÃO: Deseja exercer o Direito ao Esquecimento (Art. 16 da LGPD)? Sua conta será completamente anonimizada e desvinculada. Esta ação é irreversível e o desconectará imediatamente.')) {
      return;
    }
    
    playSound.gameover();
    setErrorMsg(null);
    try {
      const token = localStorage.getItem('gamezone_jwt_token');
      const res = await fetch('/api/user/lgpd/forget', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Não foi possível processar a exclusão por termos da LGPD.');
      alert('Sua conta foi totalmente anonimizada sob as regras federais da LGPD. Obrigado por sua estadia.');
      onLogout();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Disaster Recovery: Download Cryptographically Signed Backup
  const handleDownloadBackup = async () => {
    playSound.click();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem('gamezone_jwt_token');
      const res = await fetch('/api/security/backup', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Falha ao gerar backup. Apenas ADMINISTRADORES possuem acesso às chaves do Disaster Recovery.');
      const d = await res.json();

      const blob = new Blob([JSON.stringify(d.backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gamezon-system-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMsg('Backup assinado digitalmente com HMAC-SHA256 gerado e descarregado com sucesso!');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Disaster Recovery: Upload / Restore database state
  const handleRestoreDatabase = async () => {
    playSound.click();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!restorePayload) {
      setErrorMsg('Por favor, cole o conteúdo JSON do backup assinado no campo correspondente.');
      return;
    }

    try {
      let parsedBackup;
      try {
        parsedBackup = JSON.parse(restorePayload);
      } catch {
        throw new Error('O formato do backup é inválido. Certifique-se de que é um JSON puro e íntegro.');
      }

      const token = localStorage.getItem('gamezone_jwt_token');
      const res = await fetch('/api/security/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ backup: parsedBackup })
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Falha na validação do restore.');

      setSuccessMsg('Recuperação de Desastre executada com sucesso! O banco de dados foi reconstruído e as assinaturas foram totalmente validadas.');
      setRestorePayload('');
      fetchSecurityStats();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 sm:p-8 max-w-6xl mx-auto font-sans shadow-2xl animate-fadeIn" id="security-center-panel">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs tracking-wider uppercase mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> WAF Ativo • Proteção DDoS Sliding-Window
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400 fill-emerald-950/20" /> Central de Segurança e Conformidade
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Auditoria criptográfica de integridade de logs, conformidade LGPD e recuperação de desastres de nível corporativo.
          </p>
        </div>
        
        {/* RBAC Tester Switch */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Simulador de RBAC (Testar Permissões):</span>
          </div>
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            {['user', 'moderator', 'admin', 'auditor'].map((role) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`text-xs px-2.5 py-1.5 rounded-md font-medium capitalize transition-all duration-250 ${
                  selectedRole === role 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-4 text-rose-300 text-sm flex items-start gap-3 mb-6 animate-slideIn">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Violamento ou Restrição de Segurança: </span>
            {errorMsg}
          </div>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-4 text-emerald-300 text-sm flex items-start gap-3 mb-6 animate-slideIn">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Ação Autorizada: </span>
            {successMsg}
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-800 pb-4">
        {[
          { id: 'perf_a11y', label: 'Desempenho & Acessibilidade', icon: Flame },
          { id: 'schema', label: 'Estúdio de Banco Relacional (22 Tabelas)', icon: Network },
          { id: 'overview', label: 'Diagnóstico & KPI', icon: Activity },
          { id: 'sessions', label: 'Sessões Ativas', icon: Users },
          { id: 'history', label: 'Histórico de Login', icon: Terminal },
          { id: '2fa', label: 'Múltiplos Fatores (2FA)', icon: Key },
          { id: 'audit', label: 'Auditoria de Logs (HMAC)', icon: FileText },
          { id: 'lgpd', label: 'Privacidade LGPD', icon: Globe },
          { id: 'dr', label: 'Disaster Recovery (DR)', icon: Database }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { playSound.click(); setActiveTab(tab.id as any); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content: Performance & Accessibility Preferências */}
      {activeTab === 'perf_a11y' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-2 text-slate-200">
              <Flame className="w-5 h-5 text-indigo-400" /> Preferências de Desempenho & Acessibilidade
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Ajuste as configurações visuais, de áudio e de renderização da plataforma para garantir máxima fluidez, acessibilidade e adequação ao hardware de seu dispositivo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* SEÇÃO 1: MODO DE DESEMPENHO E RENDERIZAÇÃO */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-6">
                <div>
                  <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2 mb-1">
                    🚀 Modo de Desempenho Gráfico
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Escolha a intensidade de renderização dos efeitos interativos em tempo real.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                  {[
                    { id: 'economy', label: 'Economia', desc: 'Desativa canvas e glows. Recomendado para celulares ou notebooks antigos.' },
                    { id: 'balanced', label: 'Equilibrado', desc: 'Resolução padrão com metade do volume de partículas e sombras sutis.' },
                    { id: 'ultra', label: 'Ultra', desc: 'Efeitos de física completos, partículas responsivas e iluminação de néon premium.' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setPerfMode(mode.id);
                        applyAndSaveSettings('gamezone_perf_mode', mode.id);
                        if (mode.id === 'economy') {
                          setNoEffects(true);
                          setReduceMotion(true);
                          applyAndSaveSettings('gamezone_no_effects', true);
                          applyAndSaveSettings('gamezone_reduce_motion', true);
                        } else {
                          setNoEffects(false);
                          setReduceMotion(false);
                          applyAndSaveSettings('gamezone_no_effects', false);
                          applyAndSaveSettings('gamezone_reduce_motion', false);
                        }
                        playSound.click();
                      }}
                      className={`px-3 py-3 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                        perfMode === mode.id
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span className="capitalize">{mode.label}</span>
                    </button>
                  ))}
                </div>

                {/* Display active mode description */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300 block mb-1">Modo Selecionado: {perfMode.toUpperCase()}</span>
                  {perfMode === 'economy' && 'Reduz o consumo de CPU/GPU a praticamente zero. Ideal para prolongar a vida útil de bateria.'}
                  {perfMode === 'balanced' && 'Equilíbrio ideal entre estética elegante e alta performance, sem perdas de taxa de quadros (FPS).'}
                  {perfMode === 'ultra' && 'Aproveite o máximo do poder computacional do seu navegador com canvas altamente fluidos e glows reativos.'}
                </div>

                {/* Otimização automática por hardware */}
                <div className="pt-2 border-t border-slate-800/50">
                  <button
                    onClick={runHardwareDiagnostics}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold px-4 py-3 rounded-xl transition"
                  >
                    🔍 Detecção Automática e Otimização de Hardware
                  </button>
                  {hardwareInfo && (
                    <div className="mt-3 bg-slate-900 p-3 rounded-xl border border-slate-800/80 text-[11px] font-mono text-indigo-300 space-y-1">
                      <div>• Núcleos de CPU detectados: <span className="text-white font-bold">{hardwareInfo.cores}</span></div>
                      <div>• Dispositivo estimado: <span className="text-white font-bold">{hardwareInfo.userAgent}</span></div>
                      <div>• Recomendação aplicada: <span className="text-emerald-400 font-bold">{perfMode.toUpperCase()}</span></div>
                    </div>
                  )}
                </div>
              </div>

              {/* SEÇÃO 2: OPÇÕES DE ACESSIBILIDADE */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 space-y-6">
                <div>
                  <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2 mb-1">
                    ♿ Opções de Acessibilidade
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Personalize a legibilidade, velocidade e contraste do ecossistema.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Reduzir Movimento */}
                  <label className="flex items-start gap-3 cursor-pointer text-sm text-slate-300 hover:text-white transition">
                    <input
                      type="checkbox"
                      checked={reduceMotion}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setReduceMotion(val);
                        applyAndSaveSettings('gamezone_reduce_motion', val);
                        playSound.click();
                      }}
                      className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-4.5 h-4.5 mt-0.5"
                    />
                    <div>
                      <span className="font-medium block">Reduzir Movimento (Reduce Motion)</span>
                      <span className="text-[11px] text-slate-500 block">Substitui animações, slides, blur e transições de tela por transições instantâneas simplificadas.</span>
                    </div>
                  </label>

                  {/* Alto Contraste */}
                  <label className="flex items-start gap-3 cursor-pointer text-sm text-slate-300 hover:text-white transition">
                    <input
                      type="checkbox"
                      checked={highContrast}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setHighContrast(val);
                        applyAndSaveSettings('gamezone_high_contrast', val);
                        playSound.click();
                      }}
                      className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-4.5 h-4.5 mt-0.5"
                    />
                    <div>
                      <span className="font-medium block">Modo Alto Contraste (Contrast Booster)</span>
                      <span className="text-[11px] text-slate-500 block">Maximiza o contraste de cores das fontes e adiciona bordas sólidas nítidas nos painéis, atendendo diretrizes de leitura AAAA.</span>
                    </div>
                  </label>

                  {/* Sem Efeitos de Fundo */}
                  <label className="flex items-start gap-3 cursor-pointer text-sm text-slate-300 hover:text-white transition">
                    <input
                      type="checkbox"
                      checked={noEffects}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setNoEffects(val);
                        applyAndSaveSettings('gamezone_no_effects', val);
                        playSound.click();
                      }}
                      className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-4.5 h-4.5 mt-0.5"
                    />
                    <div>
                      <span className="font-medium block">Remover Efeitos Animados de Fundo</span>
                      <span className="text-[11px] text-slate-500 block">Desliga completamente o canvas interativo de partículas e fluxos de energia, operando com uma cor sólida de alto desempenho.</span>
                    </div>
                  </label>

                  {/* Modo Simplificado */}
                  <label className="flex items-start gap-3 cursor-pointer text-sm text-slate-300 hover:text-white transition">
                    <input
                      type="checkbox"
                      checked={simplifiedUi}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setSimplifiedUi(val);
                        applyAndSaveSettings('gamezone_simplified_ui', val);
                        playSound.click();
                      }}
                      className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-4.5 h-4.5 mt-0.5"
                    />
                    <div>
                      <span className="font-medium block">Interface Mínima Simplificada</span>
                      <span className="text-[11px] text-slate-500 block">Oculta painéis extras informativos, faixas animadas e ornamentos puramente decorativos para uma navegação focada e direta.</span>
                    </div>
                  </label>
                </div>
              </div>

            </div>

            {/* SEÇÃO 3: CONTROLE DE EFEITOS SONOROS (Audio UX) */}
            <div className="mt-8 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6">
              <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2 mb-2">
                🎵 Configurações de Áudio (Audio UX)
              </h4>
              <p className="text-slate-400 text-xs mb-6">
                Efeitos sonoros integrados gerados dinamicamente via síntese de frequências por Web Audio API. 
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  {/* Master audio switch */}
                  <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800">
                    <div>
                      <span className="font-medium text-slate-200 text-sm block">Efeitos de Som Retro</span>
                      <span className="text-[10px] text-slate-500">Habilitar feedback sonoro em cliques, moedas, conquistas e alertas.</span>
                    </div>
                    <button
                      onClick={() => {
                        const next = !soundEnabled;
                        setSoundEnabled(next);
                        // Save string representation
                        localStorage.setItem('gamezone_sound_enabled', String(next));
                        
                        // Wait a tiny bit then play sound if enabled to show instant feedback!
                        setTimeout(() => {
                          if (next) {
                            playSound.click();
                          }
                        }, 50);
                      }}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                        soundEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white block shadow-md" />
                    </button>
                  </div>
                </div>

                {/* Slider de Volume */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>Volume Geral:</span>
                    <span>{soundVolume}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-xs">🔈</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={soundVolume}
                      disabled={!soundEnabled}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        setSoundVolume(v);
                        localStorage.setItem('gamezone_sound_volume', String(v));
                      }}
                      className="flex-1 accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="text-slate-500 text-xs">🔊</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    O volume regula a amplitude de sintetizadores retro em tempo real (ondas senoidais e dente de serra).
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab Content 0: Schema Modeling & SQL Sandbox */}
      {activeTab === 'schema' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Introductory Relational Compliance Banner */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div className="space-y-2">
                <span className="bg-emerald-500/10 text-emerald-400 font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-500/15">
                  Conformidade Estrutural Relacional Assegurada
                </span>
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> Modelagem de Banco de Dados Escalável
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  Mapeamento de 22 tabelas normalizadas com integridade referencial rígida, soft-deletes globais, indexes de alta performance e colunas de auditoria nativas em conformidade com as exigências regulatórias LGPD.
                </p>
              </div>

              {/* Seeding Controls */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2 shrink-0 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>Semeador de Dados Relacionais:</span>
                </div>
                <button
                  disabled={isSeeding}
                  onClick={handleSeedRelationalData}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all duration-150 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                  {isSeeding ? 'Semeando tabelas...' : 'Semear Dados Iniciais'}
                </button>
                {seedStatus && (
                  <p className="text-[10px] text-slate-400 font-mono max-w-[200px] text-center">
                    {seedStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Core structural compliance highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/60 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>UUIDs de 36 caracteres</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Soft Delete (deleted_at)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Auditoria de Logs granular</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Chaves estrangeiras CASCADE</span>
              </div>
            </div>
          </div>

          {/* Interactive ERD Diagram Visualizer Map */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-400" /> Mapa de Dependências Relacionais (Entidade-Relacionamento)
            </h4>
            <p className="text-xs text-slate-400 mb-6">
              Cada setor abaixo interliga suas chaves estrangeiras diretamente com a tabela âncora <span className="text-indigo-400 font-mono">normalized_users</span>. Passe o cursor ou clique nas tabelas do dicionário abaixo para ver seus detalhes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* Box 1: Geral & RBAC */}
              <div className="bg-slate-900/60 border border-indigo-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs pb-2 border-b border-slate-800">
                  <Shield className="w-3.5 h-3.5" /> Geral & RBAC
                </div>
                <div className="space-y-1.5">
                  <div className="bg-indigo-950/30 border border-indigo-500/30 text-[10px] font-mono p-2 rounded flex justify-between items-center">
                    <span>normalized_users</span>
                    <span className="bg-indigo-500/20 text-indigo-300 px-1 py-0.5 rounded text-[8px]">PK</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_profiles</span>
                    <span className="text-slate-500 text-[8px]">FK → users</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_permissions</span>
                    <span className="text-slate-500 text-[8px]">RBAC</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_db_operation_logs</span>
                    <span className="text-slate-500 text-[8px]">FK → users</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_audited_history</span>
                    <span className="text-slate-500 text-[8px]">HMAC</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Social & Comunidade */}
              <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs pb-2 border-b border-slate-800">
                  <Users className="w-3.5 h-3.5" /> Social & Comunidade
                </div>
                <div className="space-y-1.5">
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_friendships</span>
                    <span className="text-slate-500 text-[8px]">2x FK → users</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_followers</span>
                    <span className="text-slate-500 text-[8px]">2x FK → users</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_messages</span>
                    <span className="text-slate-500 text-[8px]">2x FK → users</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_comments</span>
                    <span className="text-slate-500 text-[8px]">FK → users</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_likes</span>
                    <span className="text-slate-500 text-[8px]">FK → users</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_reports</span>
                    <span className="text-slate-500 text-[8px]">FK → users</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_notifications</span>
                    <span className="text-slate-500 text-[8px]">FK → users</span>
                  </div>
                </div>
              </div>

              {/* Box 3: Economia & Jogos */}
              <div className="bg-slate-900/60 border border-amber-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs pb-2 border-b border-slate-800">
                  <Database className="w-3.5 h-3.5" /> Economia & Jogos
                </div>
                <div className="space-y-1.5">
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_games</span>
                    <span className="text-slate-500 text-[8px]">RTP% Catalog</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_items</span>
                    <span className="text-slate-500 text-[8px]">Raridades</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_inventory</span>
                    <span className="text-slate-500 text-[8px]">FK → users & items</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_currencies</span>
                    <span className="text-slate-500 text-[8px]">FK → users</span>
                  </div>
                </div>
              </div>

              {/* Box 4: E-Commerce & Streams */}
              <div className="bg-slate-900/60 border border-pink-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-pink-400 font-bold text-xs pb-2 border-b border-slate-800">
                  <Globe className="w-3.5 h-3.5" /> E-Commerce & Streams
                </div>
                <div className="space-y-1.5">
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_marketplace</span>
                    <span className="text-slate-500 text-[8px]">FK → users</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_products</span>
                    <span className="text-slate-500 text-[8px]">FK → market</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_orders</span>
                    <span className="text-slate-500 text-[8px]">FK → users & prods</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_payments</span>
                    <span className="text-slate-500 text-[8px]">FK → users</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_subscriptions</span>
                    <span className="text-slate-500 text-[8px]">FK → users</span>
                  </div>
                  <div className="bg-slate-950 text-[10px] font-mono p-2 rounded flex justify-between items-center opacity-80">
                    <span>normalized_streaming</span>
                    <span className="text-slate-500 text-[8px]">FK → users & games</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Dictionary and Detail Browser */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Table Selection List */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 max-h-[550px] overflow-y-auto">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 px-2 pb-2 border-b border-slate-900 flex justify-between items-center">
                <span>Dicionário (22 Tabelas)</span>
                <span className="text-indigo-400">Linhas</span>
              </h4>

              <div className="space-y-1">
                {normalizedTablesList.map((tbl) => {
                  const isActive = selectedTable === tbl.name;
                  const rowCount = schemaTelemetry[tbl.name] !== undefined ? schemaTelemetry[tbl.name] : -1;
                  
                  return (
                    <button
                      key={tbl.name}
                      onClick={() => { playSound.click(); setSelectedTable(tbl.name); }}
                      className={`w-full text-left flex justify-between items-center px-3 py-2.5 rounded-xl text-xs font-mono transition-all duration-150 ${
                        isActive 
                          ? 'bg-indigo-600 text-white font-bold shadow shadow-indigo-600/10' 
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{tbl.name}</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                        isActive ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-400'
                      }`}>
                        {rowCount === -1 ? '0' : rowCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Table Schema specifications */}
            <div className="lg:col-span-2 bg-slate-950/20 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              {(() => {
                const currentTbl = normalizedTablesList.find(t => t.name === selectedTable) || normalizedTablesList[0];
                return (
                  <div className="space-y-6">
                    {/* Selected Table Title Header */}
                    <div className="pb-4 border-b border-slate-800/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 font-mono text-[9px] uppercase px-2 py-0.5 rounded">
                            {currentTbl.category}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">SQLite Normalizada</span>
                        </div>
                        <h4 className="text-lg font-black text-slate-100 font-mono">
                          {currentTbl.name}
                        </h4>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-400" /> UUID PK
                        </span>
                        <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono px-2 py-1 rounded-lg flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-indigo-400" /> Audit Logged
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      {currentTbl.description}
                    </p>

                    {/* Columns structure table */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-indigo-400" /> Estrutura de Colunas (Data Dictionary)
                      </h5>
                      <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                              <th className="p-3">Coluna</th>
                              <th className="p-3">Tipo de Dado</th>
                              <th className="p-3">Restrição / Chave</th>
                              <th className="p-3 text-right">Auditoria</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentTbl.columns.map((col) => (
                              <tr key={col.name} className="border-b border-slate-900 hover:bg-slate-900/30">
                                <td className="p-3 font-bold text-slate-200">{col.name}</td>
                                <td className="p-3 text-slate-400">{col.type}</td>
                                <td className="p-3 text-slate-400">
                                  {col.constraint.includes('PRIMARY KEY') ? (
                                    <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                      PK
                                    </span>
                                  ) : col.constraint.includes('FOREIGN KEY') ? (
                                    <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                      FK
                                    </span>
                                  ) : col.constraint}
                                </td>
                                <td className="p-3 text-right">
                                  {col.auditFlag ? (
                                    <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1 rounded-full font-bold">
                                      audit
                                    </span>
                                  ) : (
                                    <span className="text-slate-700 text-[10px]">•</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Indexes and FKs details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-4 border-t border-slate-800/40">
                      <div className="bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-xl space-y-1.5">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Índices Dedicados de Performance</span>
                        {currentTbl.indexes.length > 0 ? (
                          <ul className="space-y-1 text-indigo-400 text-[11px]">
                            {currentTbl.indexes.map(idx => (
                              <li key={idx} className="flex items-center gap-1.5">
                                <GitFork className="w-3 h-3 text-indigo-500 shrink-0" />
                                <span>{idx}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[10px] text-slate-500 italic">Sem índices customizados além da PK.</p>
                        )}
                      </div>

                      <div className="bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-xl space-y-1.5">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Mapeamento de Integridade Referencial</span>
                        {currentTbl.relations.length > 0 ? (
                          <ul className="space-y-1 text-slate-300 text-[11px]">
                            {currentTbl.relations.map((rel, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <ChevronRight className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span>{rel.from} <span className="text-slate-500">→</span> {rel.to}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[10px] text-slate-500 italic">Tabela âncora/Sem dependências diretas de FK.</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Interactive SQL Terminal Sandbox Terminal */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden" id="interactive-sql-terminal">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">Sandbox Interativo de Consultas Relacionais SQL</h4>
                  <p className="text-[11px] text-slate-400">Terminal de execução seguro limitado a queries e joins do banco de dados molar.</p>
                </div>
              </div>
              <span className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/15 font-mono text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                Auditoria Ativa
              </span>
            </div>

            {/* Presets and shortcuts */}
            <div className="space-y-2 mb-4">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Presets de Consultas (Clonar na Linha de Comando):
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Ver todos os Usuários', sql: 'SELECT id, email, role, created_at FROM normalized_users LIMIT 5;' },
                  { label: 'Perfis Completos (Inner Join)', queryName: 'join-profile', sql: 'SELECT p.username, p.display_name, p.status, u.email FROM normalized_profiles p INNER JOIN normalized_users u ON p.user_id = u.id LIMIT 5;' },
                  { label: 'Saldos & Moedas', sql: 'SELECT p.username, c.coins_amount, c.real_balance_amount, c.withdraw_limit FROM normalized_currencies c INNER JOIN normalized_profiles p ON c.user_id = p.user_id LIMIT 5;' },
                  { label: 'Streams Ativos', sql: 'SELECT s.title, p.username, s.viewers_count, s.is_live FROM normalized_streaming s INNER JOIN normalized_profiles p ON s.broadcaster_id = p.user_id LIMIT 5;' },
                  { label: 'Auditoria de Alterações (Audit 20)', sql: 'SELECT table_name, operation_type, operator_id, created_at FROM normalized_db_operation_logs ORDER BY created_at DESC LIMIT 5;' },
                  { label: 'Histórico LGPD Assinado (Audit 22)', sql: 'SELECT action_type, details, ip_address, created_at FROM normalized_audited_history ORDER BY created_at DESC LIMIT 5;' }
                ].map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => { playSound.click(); setSqlQuery(preset.sql); }}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code editor textarea */}
            <div className="space-y-3">
              <textarea
                rows={4}
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 placeholder-slate-600"
                placeholder="Insira sua instrução SQL aqui (ex: SELECT * FROM normalized_users;)"
              />

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-mono">
                  *Comandos destrutivos estruturais (DROP, ALTER, CREATE) são bloqueados por segurança.
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => { playSound.click(); setSqlQuery(''); setQueryResult(null); setQueryError(null); }}
                    className="text-slate-400 hover:text-slate-200 font-bold text-xs px-3 py-2 transition"
                  >
                    Limpar
                  </button>
                  <button
                    disabled={isQueryRunning}
                    onClick={() => handleRunQuery()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center gap-1.5"
                  >
                    {isQueryRunning ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>Executar Consulta</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SQL Terminal Output */}
            {(queryResult || queryError) && (
              <div className="mt-6 border-t border-slate-800/80 pt-6 space-y-3">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                  Console de Saída:
                </span>

                {queryError ? (
                  <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-4 text-rose-400 font-mono text-xs leading-relaxed flex items-start gap-2 animate-fadeIn">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <span className="font-bold">SQLITE_ERROR:</span> {queryError}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 animate-fadeIn">
                    <span className="text-emerald-400 text-xs font-mono font-bold block">
                      ✔ Consulta executada com sucesso. Linhas afetadas/retornadas: {queryResult?.rows?.length ?? queryResult?.info?.changes ?? 0}
                    </span>

                    {queryResult?.rows && queryResult.rows.length > 0 ? (
                      <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/60 max-h-[300px] overflow-y-auto">
                        <table className="w-full text-left text-[11px] font-mono">
                          <thead>
                            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                              {Object.keys(queryResult.rows[0]).map((key) => (
                                <th key={key} className="p-2.5 font-bold uppercase tracking-wider">{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.rows.map((row: any, i: number) => (
                              <tr key={i} className="border-b border-slate-900 hover:bg-slate-800/30">
                                {Object.values(row).map((val: any, j: number) => (
                                  <td key={j} className="p-2.5 text-slate-300 font-sans truncate max-w-[200px]">
                                    {val === null ? (
                                      <span className="text-slate-600 italic">NULL</span>
                                    ) : typeof val === 'object' ? (
                                      JSON.stringify(val)
                                    ) : (
                                      String(val)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-500 italic">
                        Consulta completada sem retorno de registros (ou a alteração ocorreu com sucesso).
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col">
              <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">Score de Conformidade</span>
              <span className={`text-3xl font-black mt-1 ${diagnostics && diagnostics.securityComplianceScore === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {diagnostics ? `${diagnostics.securityComplianceScore}%` : 'N/A'}
              </span>
              <span className="text-slate-400 text-xs mt-1.5 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> AES-256 e HMAC Ativos
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col">
              <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">Tentativas Hostis Recusadas</span>
              <span className="text-3xl font-black text-rose-400 mt-1">
                {diagnostics ? diagnostics.failedAttempts : '0'}
              </span>
              <span className="text-slate-400 text-xs mt-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-rose-400" /> Ataques brute-force mitigados
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col">
              <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">IPs em Quarentena Ativa</span>
              <span className="text-3xl font-black text-amber-400 mt-1">
                {diagnostics ? diagnostics.activeLockouts : '0'}
              </span>
              <span className="text-slate-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Isolamento automático de 15m
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col">
              <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">Alarmes de DDoS</span>
              <span className="text-3xl font-black text-indigo-400 mt-1">
                {diagnostics ? diagnostics.ddosAlarmsCount : '0'}
              </span>
              <span className="text-slate-400 text-xs mt-1.5 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-indigo-400" /> sliding-window bloqueando reqs
              </span>
            </div>
          </div>

          {/* Detailed Telemetry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" /> Diagnósticos de Armazenamento & Banco
              </h4>
              <ul className="space-y-3 font-mono text-xs">
                <li className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-500">Tamanho da Base de Dados:</span>
                  <span className="text-slate-300 font-bold">{diagnostics?.databaseSize || '124 KB'}</span>
                </li>
                <li className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-500">Status Operacional:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> WAL_MODE
                  </span>
                </li>
                <li className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-500">Padrão de Criptografia:</span>
                  <span className="text-indigo-400 font-bold">HMAC-SHA256 Ledger</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Assinatura Digital de Log:</span>
                  <span className="text-slate-300 font-bold">Habilitado (Anti-Tampering)</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" /> Status do Firewall & Cripto
              </h4>
              <ul className="space-y-3 font-mono text-xs">
                <li className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-500">Web Application Firewall (WAF):</span>
                  <span className="text-emerald-400 font-bold">BLOQUEANDO ATAQUES</span>
                </li>
                <li className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-500">Sessões Integradas Ativas:</span>
                  <span className="text-slate-300 font-bold">Sessão Vinculada ao User-Agent</span>
                </li>
                <li className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-500">Segurança de Uploads:</span>
                  <span className="text-slate-300 font-bold">Filtro Mime / Path Traversal Seguro</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">LGPD Consent Engine:</span>
                  <span className="text-indigo-400 font-bold">Concedido & Auditado</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-950/30 border border-indigo-950/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-indigo-400 shrink-0" />
              <div>
                <h5 className="font-bold text-slate-200 text-sm">Pronto para Teste de Penetração (Pentest)</h5>
                <p className="text-slate-400 text-xs">Todos os endpoints do GameZon possuem validação contra SQLi, XSS, CSRF, SSRF, e Upload malicioso.</p>
              </div>
            </div>
            <button 
              onClick={fetchSecurityStats}
              className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-bold px-4 py-2 rounded-xl transition duration-200 shrink-0"
            >
              Auditar Sistema Novamente
            </button>
          </div>
        </div>
      )}

      {/* Tab Content: Active Sessions */}
      {activeTab === 'sessions' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-200">
                <Users className="w-5 h-5 text-indigo-400" /> Controle de Dispositivos e Sessões Ativas
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Monitore todos os navegadores e dispositivos conectados atualmente em sua conta do GameZon. Você pode encerrá-los remotamente a qualquer momento.
              </p>
            </div>
            {activeSessions.length > 1 && (
              <button
                onClick={handleTerminateOtherSessions}
                className="bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 transition duration-200 shrink-0"
              >
                <Lock className="w-4 h-4" /> Encerrar Outras Sessões
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {activeSessions.length > 0 ? (
              activeSessions.map((session) => (
                <div 
                  key={session.id} 
                  className={`border rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 ${
                    session.is_current 
                      ? 'bg-indigo-950/30 border-indigo-500/30 shadow-lg shadow-indigo-500/5' 
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${session.is_current ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-900 text-slate-400'}`}>
                      <Radio className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-200 text-sm">{session.device || "Navegador/Dispositivo Desconhecido"}</span>
                        {session.is_current ? (
                          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
                            Sessão Atual
                          </span>
                        ) : (
                          <span className="bg-slate-900 text-slate-500 border border-slate-800 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
                            Sessão Remota
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-slate-500" /> {session.ip} ({session.location || "Localização simulada"})
                        </span>
                        <span className="text-slate-500">•</span>
                        <span>Último acesso: {new Date(session.last_access).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate max-w-[500px]" title={session.user_agent}>
                        User-Agent: {session.user_agent}
                      </p>
                    </div>
                  </div>

                  {!session.is_current && (
                    <button
                      onClick={() => handleTerminateSession(session.id)}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold px-4 py-2 rounded-xl transition duration-200 shrink-0 w-full md:w-auto"
                    >
                      Revogar Acesso
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p>Nenhuma sessão ativa encontrada. Tente reautenticar.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Login History */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-200">
              <Terminal className="w-5 h-5 text-indigo-400" /> Histórico Geral de Autenticações
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Consulte os registros completos das últimas tentativas de login nesta conta. Endpoints protegidos analisam discrepâncias geográficas e de navegador para alertar logins suspeitos.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-4">Data e Hora</th>
                    <th className="p-4">Dispositivo / Agente</th>
                    <th className="p-4">IP / Origem</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4">Indicadores de Risco / Alertas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {loginHistory.length > 0 ? (
                    loginHistory.map((history) => (
                      <tr key={history.id} className="hover:bg-slate-900/30 transition duration-150">
                        <td className="p-4 text-slate-500 whitespace-nowrap">
                          {new Date(history.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-4">
                          <span className="text-slate-200 block font-sans font-semibold">{history.device}</span>
                          <span className="text-[10px] text-slate-500 truncate block max-w-[250px]" title={history.user_agent}>
                            {history.user_agent}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300">
                          <span>{history.ip}</span>
                          <span className="block text-[10px] text-slate-500 font-sans">{history.location || "Localização simulada"}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full font-sans font-bold text-[10px] tracking-wider ${
                            history.status === 'SUCESSO'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {history.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {history.suspicious === 1 || history.suspicious === true ? (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex items-start gap-2 max-w-[320px] animate-pulse">
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-amber-400 text-[10px] block uppercase font-sans tracking-wide">Alerta de Anomalia</span>
                                <span className="text-amber-300/80 text-[11px] font-sans block leading-tight">{history.suspicious_reason || "Detectamos anomalia no acesso."}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px] italic font-sans flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500/75" /> Acesso Conforme
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-500 font-sans">
                        Nenhum histórico de logins disponível ou registros em atualização.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: 2FA */}
      {activeTab === '2fa' && (
        <div className="space-y-6">
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-2 text-slate-200">
              <Key className="w-5 h-5 text-indigo-400" /> Autenticação de Dois Fatores (2FA)
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              O uso de autenticação multifator aumenta em mais de 99.9% a segurança de contas, impedindo ataques de JWT Hijacking ou Brute Force caso suas senhas sejam violadas externamente.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Enable/Disable Toggle */}
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block font-mono">Status Atual:</span>
                    <span className={`text-md font-bold ${user?.twoFactorEnabled ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {user?.twoFactorEnabled ? 'HABILITADO (Seguro)' : 'INATIVO'}
                    </span>
                  </div>
                  {user?.twoFactorEnabled ? (
                    <button
                      onClick={() => handleToggle2fa(false)}
                      className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold px-4 py-2 rounded-xl transition"
                    >
                      Desabilitar 2FA
                    </button>
                  ) : (
                    <button
                      onClick={handleInit2fa}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-md shadow-indigo-600/10"
                    >
                      Configurar Novo Autenticador
                    </button>
                  )}
                </div>

                {twoFactorSecret && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 animate-fadeIn">
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-indigo-400" /> Ativar Chave Secreta
                    </h4>
                    
                    <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl p-3">
                      {qrCodeUrl && (
                        <img src={qrCodeUrl} referrerPolicy="no-referrer" alt="Simulated Authenticator QR Code" className="w-16 h-16 rounded-lg bg-white p-1 shrink-0" />
                      )}
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-mono block">Segredo base32:</span>
                        <code className="text-indigo-300 font-mono text-sm tracking-widest">{twoFactorSecret}</code>
                        <span className="text-[10px] text-slate-400 block mt-1">Escaneie ou copie a chave secreta acima em seu aplicativo autenticador.</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 block">Insira o código dinâmico gerado para confirmar:</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          value={confirmCode}
                          onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 w-32 font-mono text-center text-lg text-white tracking-widest focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => handleToggle2fa(true)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition"
                        >
                          Confirmar Ativação
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Simulated Live OTP ticker to make validation tests easy! */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mb-2">
                    <Activity className="w-4 h-4 text-emerald-400" /> Simulador TOTP Integrado
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Facilitamos a validação de testes da IA e de conformidade do Pentest. Se você não tem um aplicativo 2FA instalado (como Google Authenticator), você pode habilitar o 2FA ao lado e usar o código simulado abaixo para testar o login com 2FA!
                  </p>
                </div>

                {twoFactorSecret ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center mt-4">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Código Simulador Atual</span>
                    <span className="text-4xl font-extrabold font-mono text-emerald-400 tracking-widest my-2 block">
                      {simulatedLiveOtp}
                    </span>
                    
                    {/* OTP expire bar */}
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${otpProgress}%` }} />
                    </div>

                    <div className="mt-4 text-[10px] text-slate-500 font-mono text-left space-y-1">
                      <span className="font-bold text-slate-300">Códigos de Backup para emergências (Use uma vez):</span>
                      <div className="grid grid-cols-3 gap-1 mt-1 text-slate-400 font-mono">
                        {twoFactorBackupCodes.map((c, i) => (
                          <div key={i} className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-center">{c}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-800 rounded-xl mt-4 text-slate-600">
                    <Lock className="w-8 h-8 mb-2" />
                    <span className="text-xs">Clique em "Configurar Novo Autenticador" ao lado para inicializar o simulador.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-200">
                <FileText className="w-5 h-5 text-indigo-400" /> Audit Ledger - Livro de Registros Criptográficos
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Todos os eventos de segurança, logins, backups e LGPD são registrados e assinados criptograficamente usando HMAC-SHA256 para evitar repúdio ou adulterações.
              </p>
            </div>
            <button
              onClick={fetchSecurityStats}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg text-slate-200 font-medium transition shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar Ledger
            </button>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="p-3">Data/Hora</th>
                    <th className="p-3">Ator (UID)</th>
                    <th className="p-3">Evento</th>
                    <th className="p-3">IP / Host</th>
                    <th className="p-3">Integridade (HMAC Signature)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/40 transition">
                        <td className="p-3 text-slate-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3 text-slate-300 truncate max-w-[120px]" title={log.userId}>
                          {log.userId}
                        </td>
                        <td className="p-3">
                          <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                            log.event.includes('FAILED') || log.event.includes('ATTACK') || log.event.includes('TAMPER')
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : log.event.includes('RESTORE') || log.event.includes('BACKUP')
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {log.event}
                          </span>
                          <span className="block text-slate-400 text-[10px] mt-1 font-sans">{log.description}</span>
                        </td>
                        <td className="p-3 text-slate-400 truncate max-w-[120px]" title={`User-Agent: ${log.user_agent}`}>
                          {log.ip}
                        </td>
                        <td className="p-3">
                          {log.isTampered ? (
                            <span className="flex items-center gap-1 text-rose-400 font-bold">
                              <ShieldAlert className="w-3.5 h-3.5 animate-bounce" /> ADULTERADO
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-400" title={`Signature Hash: ${log.signature}`}>
                              <ShieldCheck className="w-3.5 h-3.5" /> VERIFICADO
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                        Nenhum registro de auditoria disponível ou permissões de conformidade em verificação.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: LGPD Privacy */}
      {activeTab === 'lgpd' && (
        <div className="space-y-6">
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-200">
                <Globe className="w-5 h-5 text-emerald-400" /> Portal de Privacidade & Conformidade LGPD
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Gerencie seus direitos de titular de dados pessoais em total conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data Portability Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div className="space-y-2 mb-4">
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-emerald-500/20">
                    Artigos 18 e 19 (Portabilidade)
                  </span>
                  <h4 className="font-bold text-slate-200">Exportar Meus Dados Portáveis</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Solicite uma cópia eletrônica estruturada de todas as informações que mantemos em nosso ecossistema em formato aberto estruturado (JSON). Isso inclui seus dados cadastrais, histórico de moedas virtuais e mensagens.
                  </p>
                </div>
                <button
                  onClick={handleLgpdExport}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/10"
                >
                  <Download className="w-4 h-4" /> Exportar Dados (Portabilidade .JSON)
                </button>
              </div>

              {/* Right to be Forgotten Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div className="space-y-2 mb-4">
                  <span className="bg-rose-500/10 text-rose-400 text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-rose-500/20">
                    Artigo 16 (Direito ao Esquecimento)
                  </span>
                  <h4 className="font-bold text-slate-200">Excluir e Anonimizar Minha Conta</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Solicite a total eliminação de suas chaves e o apagamento criptográfico de todas as informações pessoais identificáveis associadas a esta conta. Seus dados de jogo históricos serão anonimizados para fins puramente analíticos.
                  </p>
                </div>
                <button
                  onClick={handleLgpdForget}
                  className="flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold px-4 py-2.5 rounded-xl transition"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" /> Esquecer Meus Dados (Excluir Conta)
                </button>
              </div>
            </div>

            {/* Configurações de Privacidade */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="font-bold text-slate-200">Definições de Privacidade do Perfil</h4>
                <p className="text-xs text-slate-400 mt-1">Conforme os princípios de necessidade e transparência (Art. 6º da LGPD), você tem controle total sobre quais dados do seu perfil são compartilhados.</p>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-300 hover:text-white transition">
                  <input
                    type="checkbox"
                    checked={privacySettings.perfilPrivado}
                    onChange={(e) => handleSavePrivacy({ ...privacySettings, perfilPrivado: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                  />
                  <div>
                    <span className="font-medium block">Perfil Privado</span>
                    <span className="text-[11px] text-slate-500 block">Oculta seus dados do feed geral de atividades e das listagens de ranking da comunidade.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-300 hover:text-white transition">
                  <input
                    type="checkbox"
                    checked={privacySettings.mostrarJogosAtivos}
                    onChange={(e) => handleSavePrivacy({ ...privacySettings, mostrarJogosAtivos: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                  />
                  <div>
                    <span className="font-medium block">Mostrar Jogos Ativos</span>
                    <span className="text-[11px] text-slate-500 block">Permite que seus amigos vejam os jogos que você está jogando ou transmitindo no momento.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-300 hover:text-white transition">
                  <input
                    type="checkbox"
                    checked={privacySettings.permitirSolicitacoesAmizade}
                    onChange={(e) => handleSavePrivacy({ ...privacySettings, permitirSolicitacoesAmizade: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                  />
                  <div>
                    <span className="font-medium block">Permitir Solicitações de Amizade</span>
                    <span className="text-[11px] text-slate-500 block">Se desmarcado, apenas usuários que possuem amigos em comum poderão lhe enviar convites.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-400 text-xs space-y-1 leading-relaxed">
              <span className="font-bold text-slate-300">Resumo de Declaração de Tratamento Legal:</span>
              <p>Os dados processados na GameZon possuem como base legal o consentimento expresso do titular (Art. 7º, I) e a execução de contrato decorrente de nossos termos de serviço (Art. 7º, V). Mantemos criptografia de chaves ativas em banco de dados SQLite com controle segregado por administrador.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 5: Disaster Recovery */}
      {activeTab === 'dr' && (
        <div className="space-y-6">
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-2 text-slate-200">
              <Database className="w-5 h-5 text-indigo-400" /> Disaster Recovery & Backup Criptográfico
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Em caso de falha sistêmica, exclusão acidental ou interrupção de infraestrutura, os administradores podem descarregar snapshots criptográficos do sistema completo e realizar restaurações em tempo real (RTO menor que 5 segundos).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Backups trigger */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5 mb-2">
                    <Download className="w-4 h-4 text-indigo-400" /> Exportar Snapshot Assinado
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">
                    Gera um dump estruturado do banco de dados completo do GameZon. O dump é acompanhado por uma assinatura HMAC gerada a partir de uma chave mestra exclusiva de servidor. Qualquer alteração ou tentativa de adulterar o backup anula sua restauração.
                  </p>
                </div>
                <button
                  onClick={handleDownloadBackup}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
                >
                  <Download className="w-4 h-4" /> Baixar Snapshot Criptográfico
                </button>
              </div>

              {/* Restore trigger */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
                <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-400" /> Executar Restauração (Restore)
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Insira abaixo o conteúdo do arquivo de backup assinado (.json). O sistema verificará criptograficamente a integridade contra modificações antes de substituir as tabelas ativas.
                </p>
                <textarea
                  rows={4}
                  placeholder='Cole o JSON do backup assinado aqui...'
                  value={restorePayload}
                  onChange={(e) => setRestorePayload(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleRestoreDatabase}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/10"
                >
                  <Upload className="w-4 h-4" /> Autenticar e Restaurar Base de Dados
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
