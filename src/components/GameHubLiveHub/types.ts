export interface MicroserviceInfo {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'gameplay' | 'social' | 'media' | 'security';
  version: string;
  sla: string;
  database: {
    engine: string;
    description: string;
    schema: string;
  };
  endpoints: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    description: string;
    input?: string;
    output?: string;
  }[];
  cleanArchitecture: {
    entities: string[];
    useCases: string[];
    adapters: string[];
  };
  telemetry: {
    status: 'ACTIVE' | 'DEGRADED' | 'MAINTENANCE';
    replicas: number;
    rps: number;
    latencyMs: number;
    cpu: number;
    ram: number;
  };
}

export interface EventLog {
  id: string;
  timestamp: string;
  source: string;
  target: string;
  eventName: string;
  payload: Record<string, any>;
  status: 'PROCESSED' | 'QUEUED' | 'FAILED';
}

export interface TournamentPlayer {
  id: string;
  name: string;
  mmr: number;
  status: 'searching' | 'playing' | 'idle';
  winRate?: number;
}

export interface TournamentMatch {
  id: string;
  round: number;
  player1: string;
  player2: string;
  score1?: number;
  score2?: number;
  winner?: string;
  status: 'scheduled' | 'live' | 'finished';
}

export interface StreamChannel {
  id: string;
  broadcaster: string;
  game: string;
  viewers: number;
  bitrateKbps: number;
  fps: number;
  status: 'live' | 'offline';
  title: string;
}

export interface ReplayBlob {
  id: string;
  gameId: string;
  players: string[];
  durationSec: number;
  sizeMb: number;
  status: 'raw' | 'processed';
  resolution: string;
  title?: string;
  broadcaster?: string;
  peakViewers?: number;
  likes?: number;
  reactions?: Record<string, number>;
  shares?: number;
  commentsCount?: number;
  chatLogs?: { id: string; user: string; text: string; timeSec: number; isSub?: boolean; isVip?: boolean }[];
  clips?: StreamClipData[];
  highlights?: { id: string; timeSec: number; title: string; type: string }[];
  thumbnail?: string;
  chapters?: { timeSec: number; title: string }[];
  events?: { timeSec: number; title: string; type: string }[];
  markers?: { timeSec: number; note: string }[];
  analyticsData?: {
    viewersHistory: number[];
    chatSpeedHistory: number[];
    likesTimeline: number[];
  };
  isFavorite?: boolean;
  playlists?: string[];
  playbackProgressSec?: number;
}

export interface StreamClipData {
  id: string;
  title: string;
  game: string;
  durationSec: number;
  timestamp: string;
}

export interface PartyMember {
  id: string;
  name: string;
  avatarSeed: string;
  isLeader: boolean;
  isSpeaking: boolean;
  status: 'idle' | 'ready' | 'in-game';
}

export interface AntiCheatLog {
  id: string;
  timestamp: string;
  userId: string;
  gameId: string;
  scanType: 'HEURISTIC' | 'MEMORY_SIGNATURE' | 'INTEGRITY_CHECK';
  result: 'CLEAN' | 'FLAGGED' | 'BANNED';
  confidence: number;
  details: string;
}
