import { MicroserviceInfo } from './types';

export const GAMEHUB_LIVEHUB_MICROSERVICES: MicroserviceInfo[] = [
  {
    id: 'gamehub-core',
    name: 'GameHub Core',
    description: 'Serviço central de registro, catálogo de jogos, controle de sementes RNG criptográficas e metadados de execução.',
    category: 'core',
    version: 'v1.2.0',
    sla: '99.99%',
    database: {
      engine: 'PostgreSQL Cluster (Multi-AZ)',
      description: 'Armazena o catálogo de jogos homologados, versões, sementes hash de integridade e configurações de ambiente.',
      schema: `CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  version VARCHAR(20) NOT NULL,
  rng_seed_salt VARCHAR(64) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`
    },
    endpoints: [
      { method: 'GET', path: '/api/v1/games', description: 'Recupera a lista de jogos ativos e configurados.' },
      { method: 'GET', path: '/api/v1/games/:id', description: 'Metadados e integridade de um jogo específico.' },
      { method: 'POST', path: '/api/v1/games/verify-rng', description: 'Valida se uma jogada foi gerada por sementes RNG legítimas.', input: '{ gameId, rollHash, seed }', output: '{ isValid: boolean }' }
    ],
    cleanArchitecture: {
      entities: ['Game', 'RngSeed', 'DeveloperCredentials'],
      useCases: ['FetchActiveGames', 'VerifyRngIntegrity', 'RegisterNewVersion'],
      adapters: ['GamesController', 'PostgresGamesRepository', 'EventBusPublisher']
    },
    telemetry: { status: 'ACTIVE', replicas: 8, rps: 4500, latencyMs: 6, cpu: 12, ram: 384 }
  },
  {
    id: 'livehub-core',
    name: 'LiveHub Core',
    description: 'Gerenciador de lives, indexador de canais, metadados de transmissões e controle de latência WebRTC/RTMP.',
    category: 'media',
    version: 'v2.1.0',
    sla: '99.95%',
    database: {
      engine: 'Redis Cluster (In-Memory Key-Value)',
      description: 'Indexa canais que estão ativamente transmitindo ao vivo para recuperação instantânea na vitrine.',
      schema: `// Redis Keys Structure
live_channels:active (Set of Active Channel IDs)
channel:<id>:metadata (Hash: broadcaster, title, viewers, bitrate, fps)
channel:<id>:viewers_count (Integer counter)`
    },
    endpoints: [
      { method: 'GET', path: '/api/v1/lives/active', description: 'Lista transmissões ao vivo ordenadas por espectadores.' },
      { method: 'POST', path: '/api/v1/lives/ingest-start', description: 'Autoriza e emite chave de stream (Stream Key).', input: '{ channelId, streamKey }', output: '{ streamUrl: string, authorized: boolean }' },
      { method: 'POST', path: '/api/v1/lives/heartbeat', description: 'Atualiza bitrate, fps e integridade da ingestão.', input: '{ channelId, bitrate, fps }', output: '{ ok: boolean }' }
    ],
    cleanArchitecture: {
      entities: ['LiveChannel', 'StreamKey', 'BitrateMetrics'],
      useCases: ['AuthorizeStreamIngest', 'ListLiveChannels', 'UpdateStreamHeartbeat'],
      adapters: ['IngestController', 'RedisChannelCache', 'StreamAuthService']
    },
    telemetry: { status: 'ACTIVE', replicas: 12, rps: 9800, latencyMs: 3, cpu: 22, ram: 768 }
  },
  {
    id: 'replay-service',
    name: 'Replay Service',
    description: 'Gravador de telemetria de frames de partidas de jogos, persistência de state snapshots e sessões de reprodução.',
    category: 'media',
    version: 'v1.0.1',
    sla: '99.90%',
    database: {
      engine: 'MongoDB Sharded Cluster',
      description: 'Armazena frames compactados de telemetria e entradas de comandos dos jogadores para reconstrução da partida.',
      schema: `// Document Structure
{
  "_id": ObjectId("..."),
  "game_id": "game-1234",
  "match_id": "match-5678",
  "total_frames": 18450,
  "frames": [
    { "tick": 0, "inputs": [ { "u": "p1", "cmd": "m_up" } ] },
    { "tick": 1, "inputs": [ { "u": "p2", "cmd": "fire" } ] }
  ],
  "duration_seconds": 307.5
}`
    },
    endpoints: [
      { method: 'POST', path: '/api/v1/replays/record', description: 'Registra blocos de frames e snapshots durante a partida.' },
      { method: 'GET', path: '/api/v1/replays/:id/frames', description: 'Carrega frames sequenciais para renderização do replay local.' },
      { method: 'POST', path: '/api/v1/replays/:id/process', description: 'Solicita exportação de vídeo MP4/HLS.', input: '{ quality: "1080p" }', output: '{ taskId: string }' }
    ],
    cleanArchitecture: {
      entities: ['ReplaySession', 'FrameTelemetry', 'StateSnapshot'],
      useCases: ['RecordFrameBlock', 'RetrieveReplayFrames', 'QueueVideoGeneration'],
      adapters: ['ReplayController', 'MongoTelemetryRepository', 'MediaProcessorClient']
    },
    telemetry: { status: 'ACTIVE', replicas: 6, rps: 1200, latencyMs: 14, cpu: 32, ram: 1024 }
  },
  {
    id: 'game-presence',
    name: 'Game Presence',
    description: 'Verificador de presença em tempo real de altíssima velocidade. Status de usuários (Online, Em Partida, Afastado).',
    category: 'core',
    version: 'v3.0.0',
    sla: '99.99%',
    database: {
      engine: 'Redis Cluster with Replication',
      description: 'Armazena o estado efêmero de presença de cada jogador, atualizado via ping constante de heartbeat.',
      schema: `// Key Structure with TTL expiration (60 seconds)
user:<id>:presence (String value: "online", "playing:<match_id>", "idle")
user:<id>:last_seen (Timestamp)
online_players_count (HyperLogLog for unique concurrent counts)`
    },
    endpoints: [
      { method: 'GET', path: '/api/v1/presence/:userId', description: 'Obtém status em tempo real e última atividade de um usuário.' },
      { method: 'POST', path: '/api/v1/presence/heartbeat', description: 'Renova a sessão de presença do usuário via websocket.', input: '{ userId, status }', output: '{ ok: boolean, nextHeartbeatInSec: 15 }' },
      { method: 'POST', path: '/api/v1/presence/batch', description: 'Busca presença em lote para listas de amigos.', input: '{ userIds: [] }', output: '{ statuses: {} }' }
    ],
    cleanArchitecture: {
      entities: ['UserPresence', 'HeartbeatPing'],
      useCases: ['RegisterHeartbeat', 'GetUserPresence', 'BatchGetFriendStatuses'],
      adapters: ['PresenceWSHandler', 'RedisPresenceRepository', 'StatusEventBroadcaster']
    },
    telemetry: { status: 'ACTIVE', replicas: 16, rps: 45000, latencyMs: 1, cpu: 18, ram: 512 }
  },
  {
    id: 'party-system',
    name: 'Party System',
    description: 'Sistema de grupos, lobbies de times, convites de membros, controle de prontidão e lobby matchmaking.',
    category: 'social',
    version: 'v1.4.2',
    sla: '99.95%',
    database: {
      engine: 'DynamoDB (NoSQL)',
      description: 'Salva os grupos ativos, donos do lobby, configurações e estado de membros.',
      schema: `// DynamoDB Table: active_parties
Partition Key: party_id (String)
Attributes:
  - leader_id (String)
  - members (List of Map: {userId, joinedAt, status})
  - settings (Map: gameSlug, isPrivate)
  - queue_status (String)`
    },
    endpoints: [
      { method: 'POST', path: '/api/v1/party/create', description: 'Inicia uma nova sala de squad/party.' },
      { method: 'POST', path: '/api/v1/party/invite', description: 'Gera convite ou notifica outro jogador.' },
      { method: 'POST', path: '/api/v1/party/join', description: 'Valida entrada de um usuário em um grupo existente.' },
      { method: 'POST', path: '/api/v1/party/ready', description: 'Altera o estado do jogador no grupo.', input: '{ isReady: boolean }', output: '{ partyState: {} }' }
    ],
    cleanArchitecture: {
      entities: ['Party', 'PartyInvitation', 'PartyMember'],
      useCases: ['CreateParty', 'JoinPartyGroup', 'ToggleMemberReadiness', 'DispatchPartyInvitation'],
      adapters: ['PartyController', 'DynamoPartyRepository', 'NotificationClient']
    },
    telemetry: { status: 'ACTIVE', replicas: 8, rps: 3400, latencyMs: 8, cpu: 15, ram: 256 }
  },
  {
    id: 'voice-service',
    name: 'Voice Service',
    description: 'Serviço de sinalização WebRTC, salas de voz de squad, compressão Opus e servidores de canal TURN/STUN.',
    category: 'media',
    version: 'v1.1.0',
    sla: '99.98%',
    database: {
      engine: 'Etcd (Distributed Key-Value for Mesh Topology)',
      description: 'Coordena a alocação de servidores SFU (Selective Forwarding Unit) de voz para cada sala de squad ativa.',
      schema: `// etcd distributed keys
/voice/sfu/servers/<ip> (Metadata: active_sessions, capacity)
/voice/rooms/<party_id> (Assigned SFU Server IP)`
    },
    endpoints: [
      { method: 'POST', path: '/api/v1/voice/room/allocate', description: 'Aloca um servidor de mídia SFU para a sala de squad.' },
      { method: 'POST', path: '/api/v1/voice/room/token', description: 'Gera token WebRTC com escopo seguro para autenticação do cliente.' },
      { method: 'GET', path: '/api/v1/voice/sfu/metrics', description: 'Métricas de jitter, packet loss e latência de voz.' }
    ],
    cleanArchitecture: {
      entities: ['VoiceRoom', 'SFUInstance', 'WebRtcToken'],
      useCases: ['AllocateSfuServer', 'GenerateAccessCredentials', 'MonitorQualityOfService'],
      adapters: ['SfuSignalingController', 'EtcdTopologyStore', 'OpusCodecService']
    },
    telemetry: { status: 'ACTIVE', replicas: 10, rps: 1800, latencyMs: 5, cpu: 45, ram: 512 }
  },
  {
    id: 'game-chat',
    name: 'Game Chat',
    description: 'Barramento de chat em tempo real de alta performance para canais globais, salas de partidas e mensagens diretas.',
    category: 'social',
    version: 'v2.5.0',
    sla: '99.99%',
    database: {
      engine: 'Cassandra DB (Distributed Column Store)',
      description: 'Persiste o histórico de mensagens, permitindo escrita de altíssima velocidade e leitura sequencial ordenada.',
      schema: `CREATE TABLE party_messages (
  party_id text,
  bucket_date text,
  timestamp timestamp,
  message_id uuid,
  sender_id text,
  text_content text,
  PRIMARY KEY ((party_id, bucket_date), timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC);`
    },
    endpoints: [
      { method: 'GET', path: '/api/v1/chat/history', description: 'Recupera histórico paginado por data/sala.' },
      { method: 'POST', path: '/api/v1/chat/broadcast', description: 'Envia mensagem para todos os membros da sala de partida.', input: '{ roomId, text }', output: '{ messageId, timestamp }' }
    ],
    cleanArchitecture: {
      entities: ['ChatMessage', 'ChatRoom', 'ChatFilterRules'],
      useCases: ['SendMessageToRoom', 'FetchRoomHistory', 'ApplyProfanityFilter'],
      adapters: ['ChatWebSocketHandler', 'CassandraChatRepository', 'ModerationMeshClient']
    },
    telemetry: { status: 'ACTIVE', replicas: 14, rps: 14000, latencyMs: 2, cpu: 26, ram: 512 }
  },
  {
    id: 'match-service',
    name: 'Match Service',
    description: 'Motor de pareamento (Matchmaker). Algoritmo Glicko/MMR para pareamento equilibrado e alocação de servidores dedicados.',
    category: 'gameplay',
    version: 'v2.2.0',
    sla: '99.99%',
    database: {
      engine: 'PostgreSQL DB + Redis Queues',
      description: 'Redis lida com a fila de matchmaking em memória via Sorted Sets (ZADD). Postgres armazena as estatísticas de partidas finalizadas.',
      schema: `// Redis Queue Sorted Set
Key: matchmaker:queue:<gameSlug>
Score: MMR (Matchmaking Rating)
Value: PlayerID / PartyID`
    },
    endpoints: [
      { method: 'POST', path: '/api/v1/matchmaking/ticket/create', description: 'Insere o jogador ou squad na fila de matchmaking.' },
      { method: 'DELETE', path: '/api/v1/matchmaking/ticket/:id', description: 'Remove o jogador da fila de matchmaking.' },
      { method: 'GET', path: '/api/v1/matchmaking/ticket/:id/status', description: 'Consulta andamento do pareamento.', input: 'ticketId', output: '{ status: "finding" | "matched", matchServerIp }' }
    ],
    cleanArchitecture: {
      entities: ['MatchmakingTicket', 'PlayerMmrBucket', 'DedicatedServerAllocation'],
      useCases: ['AddPlayerToQueue', 'ProcessMatchmakerBuckets', 'AllocateDedicatedGameServer'],
      adapters: ['MatchmakingController', 'RedisQueueRepository', 'GameServerScheduler']
    },
    telemetry: { status: 'ACTIVE', replicas: 12, rps: 11000, latencyMs: 4, cpu: 34, ram: 512 }
  },
  {
    id: 'ranking-service',
    name: 'Ranking Service',
    description: 'Classificações globais, tabelas de líderes de alta velocidade, histórico de temporadas de Esports.',
    category: 'gameplay',
    version: 'v1.5.0',
    sla: '99.99%',
    database: {
      engine: 'Redis Enterprise Active-Active',
      description: 'Lida com placares globais e de amigos em milissegundos utilizando estruturas Sorted Sets nativas.',
      schema: `// Redis Sorted Set para Leaderboards
Key: leaderboard:season_5:global
Score: RankPoints (MMR)
Value: PlayerID (Permite ordenação automática e consulta de ranks instantâneos)`
    },
    endpoints: [
      { method: 'GET', path: '/api/v1/rankings/global', description: 'Obtém top 100 líderes globais de uma temporada.' },
      { method: 'GET', path: '/api/v1/rankings/user/:userId', description: 'Retorna rank exato, classificação e vizinhos do jogador.' },
      { method: 'POST', path: '/api/v1/rankings/score/update', description: 'Notifica atualização de pontuação pós-partida.', input: '{ userId, scoreDelta }', output: '{ newRank, percentile }' }
    ],
    cleanArchitecture: {
      entities: ['LeaderboardRow', 'SeasonParameters', 'LeagueTier'],
      useCases: ['UpdateUserRankScore', 'RetrieveLeaderboardPage', 'CalculateUserPercentile'],
      adapters: ['RankingController', 'RedisLeaderboardRepository', 'HistoryLogger']
    },
    telemetry: { status: 'ACTIVE', replicas: 6, rps: 16000, latencyMs: 2, cpu: 11, ram: 256 }
  },
  {
    id: 'tournament-service',
    name: 'Tournament Service',
    description: 'Gerenciador de chaveamento de campeonatos (brackets), tabelas de jogos de Esports, cronograma de partidas e distribuição de recompensas.',
    category: 'gameplay',
    version: 'v1.8.0',
    sla: '99.95%',
    database: {
      engine: 'PostgreSQL Relational DB',
      description: 'Persiste chaves de torneios complexas de dupla eliminação, regras de elegibilidade, resultados oficiais e premiações.',
      schema: `CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  rules_json JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'registering',
  winner_id VARCHAR(50),
  prize_pool_coins INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE tournament_matches (
  id UUID PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id),
  bracket_round INT NOT NULL,
  player_1_id VARCHAR(50),
  player_2_id VARCHAR(50),
  winner_id VARCHAR(50)
);`
    },
    endpoints: [
      { method: 'GET', path: '/api/v1/tournaments', description: 'Recupera lista de torneios ativos e encerrados.' },
      { method: 'POST', path: '/api/v1/tournaments/register', description: 'Inscreve um squad no campeonato selecionado.' },
      { method: 'GET', path: '/api/v1/tournaments/:id/bracket', description: 'Obtém árvore estruturada de chaveamento e progresso.' },
      { method: 'POST', path: '/api/v1/tournaments/match/submit', description: 'Insere os resultados oficiais de um confronto.', input: '{ matchId, winnerId, scores }', output: '{ nextMatchLocked: boolean }' }
    ],
    cleanArchitecture: {
      entities: ['Tournament', 'TournamentBracketNode', 'EligibilityCriteria'],
      useCases: ['RegisterSquad', 'GenerateTournamentBrackets', 'ApplyConfrontationOutcome'],
      adapters: ['TournamentController', 'PostgresTournamentRepository', 'PayoutServiceClient']
    },
    telemetry: { status: 'ACTIVE', replicas: 6, rps: 850, latencyMs: 12, cpu: 14, ram: 192 }
  },
  {
    id: 'replay-storage',
    name: 'Replay Storage',
    description: 'Abstração e gateway de armazenamento em nuvem para arquivos brutos compactados de replays, blobs e mídias transcritas.',
    category: 'media',
    version: 'v1.0.0',
    sla: '99.999%',
    database: {
      engine: 'Google Cloud Storage / AWS S3 APIs',
      description: 'Repositório de objetos imutável com políticas de ciclo de vida para rebaixar replays antigos para Cold Storage após 30 dias.',
      schema: `// Object Storage Bucket Structure
/replays/raw/<match_id>.gzon (Raw binary telemetry blobs)
/replays/transcoded/<match_id>/stream.m3u8 (HLS Playlist)
/replays/transcoded/<match_id>/segment_0.ts (HLS video segments)`
    },
    endpoints: [
      { method: 'POST', path: '/api/v1/storage/upload-url', description: 'Gera URL pré-assinada de upload de telemetria diretamente do servidor de jogo.' },
      { method: 'GET', path: '/api/v1/storage/download-url/:id', description: 'Gera URL pré-assinada para baixar o replay no app cliente.' }
    ],
    cleanArchitecture: {
      entities: ['StorageMetadata', 'SignedUrlToken', 'LifecyclePolicy'],
      useCases: ['GeneratePresignedUploadUrl', 'GeneratePresignedDownloadUrl', 'ApplyRetentionRule'],
      adapters: ['StorageGatewayController', 'S3CompatibleAdapter', 'GcsCompatibleAdapter']
    },
    telemetry: { status: 'ACTIVE', replicas: 4, rps: 920, latencyMs: 9, cpu: 8, ram: 128 }
  },
  {
    id: 'media-processing',
    name: 'Media Processing',
    description: 'Fila de conversão de mídia em lote, codificação HLS de vídeos, cortes automáticos de jogadas (highlights) e thumb extraction.',
    category: 'media',
    version: 'v1.3.0',
    sla: '99.90%',
    database: {
      engine: 'RabbitMQ Message Broker + MongoDB',
      description: 'RabbitMQ gerencia as filas prioritárias de processamento ffmpeg. MongoDB armazena o histórico e logs de transcodificação.',
      schema: `// Task Queue Structure (RabbitMQ exchange)
Exchange: media:processing (Direct)
Queues:
  - media:high-priority (Clips / Highlights < 1min)
  - media:low-priority (Full Match Transcodes > 15min)`
    },
    endpoints: [
      { method: 'POST', path: '/api/v1/media/transcode', description: 'Envia um trabalho de conversão de vídeo para a fila assíncrona.' },
      { method: 'GET', path: '/api/v1/media/task/:taskId', description: 'Consulta progresso atual da renderização (percentage, phase).' }
    ],
    cleanArchitecture: {
      entities: ['TranscodingJob', 'MediaSegments', 'VideoMetadata'],
      useCases: ['QueueTranscodingJob', 'ProcessVideoChunk', 'ExtractVideoThumbnails'],
      adapters: ['MediaWorkerConsumer', 'FFmpegCliAdapter', 'MongoClientTracker']
    },
    telemetry: { status: 'ACTIVE', replicas: 10, rps: 340, latencyMs: 140, cpu: 75, ram: 2048 }
  },
  {
    id: 'notification-service',
    name: 'Notification Service',
    description: 'Consumidor de barramento de alta velocidade. Alertas de torneios, novos convites de squads, pings de lives de criadores de conteúdo.',
    category: 'social',
    version: 'v1.6.0',
    sla: '99.95%',
    database: {
      engine: 'Cassandra DB + Redis Stack',
      description: 'Redis armazena filas de push e canais de WebSockets ativos. Cassandra armazena o histórico permanente das notificações lidas e não lidas.',
      schema: `CREATE TABLE user_notifications (
  user_id text,
  notification_id uuid,
  title text,
  body text,
  category text,
  is_read boolean,
  created_at timestamp,
  PRIMARY KEY (user_id, notification_id)
) WITH CLUSTERING ORDER BY (notification_id DESC);`
    },
    endpoints: [
      { method: 'POST', path: '/api/v1/notifications/send', description: 'Dispara alerta interno de push baseado em evento.' },
      { method: 'GET', path: '/api/v1/notifications/history', description: 'Carrega o histórico de notificações de um usuário.', input: '{ userId, limit }', output: '{ notifications: [] }' }
    ],
    cleanArchitecture: {
      entities: ['NotificationPayload', 'TargetDevice', 'DeliveryChannel'],
      useCases: ['DispatchNotificationToGateways', 'FetchUserNotificationHistory', 'MarkNotificationAsRead'],
      adapters: ['PushApiController', 'ApnsDeliveryGateway', 'FirebaseCloudMessagingAdapter']
    },
    telemetry: { status: 'ACTIVE', replicas: 8, rps: 18000, latencyMs: 4, cpu: 14, ram: 256 }
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Agregador de logs analíticos globais de jogabilidade, comportamento e cliques. Otimizado para Big Data e IA analítica.',
    category: 'core',
    version: 'v2.0.0',
    sla: '99.90%',
    database: {
      engine: 'ClickHouse Column-Oriented Database',
      description: 'Projetado para ler e agregar bilhões de registros em segundos sem afetar o banco principal.',
      schema: `CREATE TABLE gameplay_telemetry (
  event_time DateTime,
  player_id String,
  game_slug String,
  match_id String,
  session_duration UInt32,
  bytes_sent UInt64,
  fps_avg UInt8,
  ping_avg UInt16
) ENGINE = MergeTree()
ORDER BY (game_slug, event_time);`
    },
    endpoints: [
      { method: 'POST', path: '/api/v1/analytics/ingest', description: 'Envia eventos de telemetria agregada e comportamento.' },
      { method: 'GET', path: '/api/v1/analytics/dashboard/summary', description: 'Gera métricas agregadas instantâneas para visualização administrativa.', input: '{ dateRange }', output: '{ totalMatches, avgSessionTime, latencyCurve: [] }' }
    ],
    cleanArchitecture: {
      entities: ['TelemetryEvent', 'AnalyticalAggregation', 'DataMetricCube'],
      useCases: ['IngestTelemetryPayload', 'GenerateAggregationReports', 'QueryClickStreamData'],
      adapters: ['AnalyticsIngestController', 'ClickHouseAdapter', 'GrafanaReporter']
    },
    telemetry: { status: 'ACTIVE', replicas: 6, rps: 28000, latencyMs: 5, cpu: 48, ram: 1536 }
  },
  {
    id: 'moderation',
    name: 'Moderation',
    description: 'Serviço de moderação em tempo real. Triagem de denúncias de comportamento tóxico e processamento de chat por IA.',
    category: 'security',
    version: 'v1.4.0',
    sla: '99.98%',
    database: {
      engine: 'PostgreSQL DB + Elasticsearch Index',
      description: 'Postgres mantém denúncias estruturadas e status de punições. Elasticsearch indexa conteúdos de chat textuais para busca de termos impróprios.',
      schema: `CREATE TABLE chat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id VARCHAR(50) NOT NULL,
  reported_id VARCHAR(50) NOT NULL,
  chat_log_excerpt TEXT,
  severity_score FLOAT,
  status VARCHAR(20) DEFAULT 'pending',
  moderator_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`
    },
    endpoints: [
      { method: 'POST', path: '/api/v1/moderation/report', description: 'Gera denúncia formal de infração comunitária.' },
      { method: 'POST', path: '/api/v1/moderation/chat/scan', description: 'Analisa conteúdo textual gerado em chats com regras e IA.', input: '{ text }', output: '{ isSafe, score, flags }' },
      { method: 'GET', path: '/api/v1/moderation/punishments/:userId', description: 'Busca sanções ativas de um jogador.' }
    ],
    cleanArchitecture: {
      entities: ['CommunityReport', 'ModerationAuditLog', 'SanctionDirective'],
      useCases: ['SubmitAbuseReport', 'ScanTextContentWithRules', 'ApplyAccountSanction'],
      adapters: ['ModerationApiController', 'PostgresReportRepository', 'ElasticsearchSearchIndex']
    },
    telemetry: { status: 'ACTIVE', replicas: 6, rps: 5200, latencyMs: 8, cpu: 18, ram: 384 }
  },
  {
    id: 'anti-cheat-integration',
    name: 'Anti Cheat Integration',
    description: 'Módulo de prevenção e detecção de cheats. Integração de assinaturas em tempo real, detecção de modificação de memória e telemetria de injeção.',
    category: 'security',
    version: 'v2.0.1',
    sla: '99.99%',
    database: {
      engine: 'Scattered Time-Series Database (InfluxDB)',
      description: 'Armazena logs estruturados em série temporal contendo batimentos do agente anti-cheat local para cruzamento de dados analíticos.',
      schema: `// InfluxDB Measurement: anti_cheat_telemetry
Tags: user_id, game_id, client_version, OS
Fields: memory_hashes, process_count, hook_detected (Boolean), integrity_compromised (Boolean)`
    },
    endpoints: [
      { method: 'POST', path: '/api/v1/anticheat/verify', description: 'Analisa sementes, processos de memória e assinaturas de integridade e retorna o status.' },
      { method: 'POST', path: '/api/v1/anticheat/report-violation', description: 'Força expulsão imediata do jogador (instant kick) e agenda o banimento.', input: '{ userId, matchId, violationDetails }', output: '{ kicked: true, banEnforced: true }' }
    ],
    cleanArchitecture: {
      entities: ['IntegrityPayload', 'SecurityViolationReport', 'SignatureDefinition'],
      useCases: ['VerifyClientIntegrity', 'EnforceViolationTriage', 'TweakAntiCheatRules'],
      adapters: ['AntiCheatController', 'InfluxTelemetryRepository', 'MatchEnforcerGateway']
    },
    telemetry: { status: 'ACTIVE', replicas: 14, rps: 34000, latencyMs: 2, cpu: 20, ram: 256 }
  }
];
