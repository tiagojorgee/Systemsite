import React, { useState, useEffect, useRef } from 'react';
import { StreamChannel, ReplayBlob } from './types';
import { ReplayStudio } from './ReplayStudio';
import { 
  Tv, 
  Video, 
  Play, 
  Eye, 
  Sliders, 
  Database, 
  RefreshCw, 
  Sparkles, 
  Heart, 
  MessageSquare,
  Clock,
  History,
  ArrowRight,
  HardDrive,
  Share2,
  Star,
  Users,
  Shield,
  ShieldAlert,
  BarChart2,
  Trash2,
  Calendar,
  Lock,
  Send,
  SlidersHorizontal,
  Volume2,
  Settings,
  Bell,
  Activity,
  AlertTriangle,
  UserCheck,
  Download,
  Flame,
  CheckCircle2,
  XCircle,
  Copy
} from 'lucide-react';
import { playSound } from '../../utils/audio';

// Dynamic type for clips
interface StreamClip {
  id: string;
  title: string;
  game: string;
  durationSec: number;
  timestamp: string;
}

// Dynamic type for moderation logs
interface ModLog {
  id: string;
  timestamp: string;
  targetUser: string;
  action: 'BAN' | 'TIMEOUT' | 'SPAM_FILTER' | 'BAD_WORD_CENSOR';
  details: string;
}

// Preset games on the platform
const PLATFORM_GAMES = [
  'Nave Espacial Arcade',
  'Retro Speed Racer',
  'Dungeon Crawler 2D',
  'Mines Blitz',
  'Aviator Flight',
  'Plinko Drop',
  'Fruit Crush Slots'
];

const PRESET_CHANNELS: StreamChannel[] = [
  { id: 'ch-ninja', broadcaster: 'Ninja_Gamer', game: 'Nave Espacial Arcade', viewers: 12450, bitrateKbps: 6450, fps: 60, status: 'live', title: 'SPEEDRUN MUNDIAL COM A NOVA NAVE ESPACIAL! 🚀' },
  { id: 'ch-valk', broadcaster: 'Valkyrae_Pro', game: 'Retro Speed Racer', viewers: 8420, bitrateKbps: 5900, fps: 60, status: 'live', title: 'Dicas de Drift e Curvas Perfeitas na Copa Neon! 🏎️💨' },
  { id: 'ch-shroud', broadcaster: 'Shroud_God', game: 'Dungeon Crawler 2D', viewers: 21900, bitrateKbps: 8200, fps: 120, status: 'live', title: 'SOLANDO BOSS ULTRA HARD CORE SEM EQUIPAMENTO' }
];

const CHAT_SIMULATOR_NAMES = [
  'GamerX_99', 'Lara_Pro', 'Pedro_Arena', 'Sniper_Master', 'Klaus_Zero', 
  'Vicky_W', 'ShadowGamer', 'CyberCavalier', 'PixelHeart', 'GlitchQueen', 
  'HyperSlayer', 'NostalgiaGamer', 'SpeedrunnerX', 'LootGoblin'
];

const CHAT_SIMULATOR_PHRASES = [
  'MEU DEUS QUE ABSURDO!!',
  'Isso foi incrível demais',
  'O FPS tá cravadinho aqui, top dms',
  'Me manda um salve por favor!!',
  'Que live fluida e de qualidade',
  'Qual é a build de hoje?',
  'GG WP! Joga muito',
  'Rumo ao topo do ranking',
  'Esse delay de baixa latência tá sensacional',
  'Uia, o mod tá brabo hoje kkkk',
  'Alguém quer montar squad depois?',
  'Que jogada épica!'
];

export const StreamingTab: React.FC = () => {
  // Navigation: 'viewer' | 'dashboard'
  const [activeMode, setActiveMode] = useState<'viewer' | 'dashboard' | 'replays'>('viewer');

  // --- GENERAL STATE ---
  const [channels, setChannels] = useState<StreamChannel[]>(PRESET_CHANNELS);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('ch-ninja');
  
  // Live Stream Engagement Metric Accumulators
  const [liveLikes, setLiveLikes] = useState<number>(0);
  const [liveShares, setLiveShares] = useState<number>(0);
  const [liveReactions, setLiveReactions] = useState<Record<string, number>>({ '🔥': 0, '😮': 0, '👍': 0, '❤️': 0 });
  const [liveChatLogs, setLiveChatLogs] = useState<{ id: string; user: string; text: string; timeSec: number; isSub?: boolean; isVip?: boolean }[]>([]);
  
  // Crash Protection / Recovery State
  const [crashBackup, setCrashBackup] = useState<{
    title: string;
    game: string;
    durationSec: number;
    peakViewers: number;
    likes: number;
    shares: number;
    chatLogs: { id: string; user: string; text: string; timeSec: number; isSub?: boolean; isVip?: boolean }[];
    reactions: Record<string, number>;
    thumb: string;
  } | null>(null);

  const [replays, setReplays] = useState<ReplayBlob[]>([
    { 
      id: 'rep-1', 
      gameId: 'nave-espacial-arcade', 
      players: ['Ninja_Gamer', 'Chat Arena'], 
      durationSec: 360, 
      sizeMb: 45.5, 
      status: 'processed', 
      resolution: '1080p60 HLS Stream (.m3u8)',
      title: 'CAMPANHA ARCADE - RUMO AO TOP 1 GLOBAL! 🚀',
      broadcaster: 'Ninja_Gamer',
      peakViewers: 1420,
      likes: 854,
      shares: 64,
      isFavorite: true,
      playlists: ['Nave Espacial Pro Runs', 'Campeonatos Retro'],
      chatLogs: [
        { id: 'c-rc1', user: 'Valkyrae_Pro', text: 'Nossa, que desvio perfeito!', timeSec: 10, isVip: true },
        { id: 'c-rc2', user: 'Fallen_Angel', text: 'GG WP, melhor piloto!', timeSec: 45, isSub: true },
        { id: 'c-rc3', user: 'Mod_Z', text: 'Incrível o desempenho da nave hoje.', timeSec: 120, isSub: true },
        { id: 'c-rc4', user: 'Gamer_Premium', text: 'Pega o boss final agora!', timeSec: 240, isSub: true, isVip: true },
        { id: 'c-rc5', user: 'Fallen_Angel', text: 'Recorde batido de novo!', timeSec: 320, isSub: true }
      ],
      chapters: [
        { timeSec: 0, title: 'Início & Escolha da Nave 🎮' },
        { timeSec: 60, title: 'Primeira Onda de Invasores 👾' },
        { timeSec: 180, title: 'Frenesi Intergaláctico 🔥' },
        { timeSec: 280, title: 'Combate Decisivo (Boss) 👹' },
        { timeSec: 360, title: 'Vitória e Placar Final 🏆' }
      ],
      events: [
        { timeSec: 15, title: 'Desvio Crítico Multiplicador 5x', type: 'reaction' },
        { timeSec: 125, title: 'Super Combo Destruidor', type: 'kill' },
        { timeSec: 295, title: 'Solo Perfeito contra Boss', type: 'boss' }
      ],
      markers: [
        { timeSec: 90, note: 'Análise de tática defensiva' }
      ],
      analyticsData: {
        viewersHistory: [600, 850, 1100, 1340, 1420, 1280],
        chatSpeedHistory: [5, 12, 28, 42, 35, 15],
        likesTimeline: [100, 250, 480, 690, 854, 854]
      }
    },
    { 
      id: 'rep-2', 
      gameId: 'retro-speed-racer', 
      players: ['Valkyrae_Pro', 'Fallen_Angel'], 
      durationSec: 180, 
      sizeMb: 24.2, 
      status: 'processed', 
      resolution: '1080p60 HLS Stream (.m3u8)',
      title: 'DRIFT INFINITO RETRO RACER! RÁPIDO E FURIOSO 🏎️',
      broadcaster: 'Valkyrae_Pro',
      peakViewers: 950,
      likes: 540,
      shares: 32,
      isFavorite: false,
      playlists: ['Campeonatos Retro'],
      chatLogs: [
        { id: 'c-sp1', user: 'Ninja_Gamer', text: 'Esse drift foi absurdo!', timeSec: 5, isVip: true },
        { id: 'c-sp2', user: 'Chat Arena', text: 'Cuidado com a curva fechada!', timeSec: 60 },
        { id: 'c-sp3', user: 'Valkyrae_Pro', text: 'Usando nitro em 3, 2, 1...', timeSec: 100, isVip: true },
        { id: 'c-sp4', user: 'Mod_Z', text: 'Velocidade máxima atingida 299km/h!', timeSec: 150, isSub: true }
      ],
      chapters: [
        { timeSec: 0, title: 'Largada & Aquecimento de Pneus 🏎️' },
        { timeSec: 50, title: 'Drifts nas Curvas do Vulcão 🌋' },
        { timeSec: 120, title: 'Sprint Final & Nitro Ativado 🚀' },
        { timeSec: 180, title: 'Linha de Chegada e Pódio 🏆' }
      ],
      events: [
        { timeSec: 8, title: 'Liderança Conquistada', type: 'kill' },
        { timeSec: 105, title: 'Uso de Nitro Estratégico', type: 'reaction' }
      ],
      markers: [
        { timeSec: 75, note: 'Melhor ponto de tangência da curva' }
      ],
      analyticsData: {
        viewersHistory: [400, 620, 850, 950, 910, 890],
        chatSpeedHistory: [8, 18, 25, 32, 20, 10],
        likesTimeline: [80, 180, 320, 480, 540, 540]
      }
    }
  ]);
  const [isTranscoding, setIsTranscoding] = useState<string | null>(null);
  const [transcodingProgress, setTranscodingProgress] = useState<number>(0);
  const [clips, setClips] = useState<StreamClip[]>([
    { id: 'clip-1', title: 'QUADRA KILL INSANO!', game: 'Nave Espacial Arcade', durationSec: 15, timestamp: '14:20' }
  ]);
  const [favorites, setFavorites] = useState<string[]>(['ch-ninja']);
  const [notifications, setNotifications] = useState<{ id: string; title: string; desc: string; type: 'success' | 'info' | 'alert' }[]>([]);

  // --- INTERACTIVE CHAT & POLL STATE ---
  const [comments, setComments] = useState<{ id: string; user: string; text: string; isSub?: boolean; isVip?: boolean; isMod?: boolean }[]>([
    { id: 'c1', user: 'Mod_Z', text: 'Bem-vindos à transmissão oficial! Respeitem as regras e moderadores.', isMod: true }
  ]);
  const [myCommentText, setMyCommentText] = useState<string>('');
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; type: string; x: number; y: number }[]>([]);
  
  // Goals (Dynamic progress)
  const [followerGoal, setFollowerGoal] = useState({ current: 842, target: 1000 });
  const [subscriberGoal, setSubscriberGoal] = useState({ current: 124, target: 200 });

  // Interactive Poll (Enquete)
  const [activePoll, setActivePoll] = useState<{ question: string; options: { text: string; votes: number }[]; totalVotes: number; hasVoted: boolean; userVote: number | null } | null>({
    question: 'Será que o streamer bate o recorde hoje?',
    options: [
      { text: 'Com certeza! (Foco total)', votes: 142 },
      { text: 'Acho difícil, mas apoio', votes: 68 }
    ],
    totalVotes: 210,
    hasVoted: false,
    userVote: null
  });

  // Share & copy
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // --- STREAMER DASHBOARD CONFIG STATE ---
  const [liveTitle, setLiveTitle] = useState<string>('LIVE DE SÁBADO - CLAN COMPETITIVO GAMEZON 🔥');
  const [liveDesc, setLiveDesc] = useState<string>('Jogando todos os títulos do Arcade com bônus e metas especiais para inscritos!');
  const [liveGame, setLiveGame] = useState<string>('Nave Espacial Arcade');
  const [liveTags, setLiveTags] = useState<string>('competitivo, arcade, pro-player, livehub');
  const [liveLang, setLiveLang] = useState<string>('Português');
  const [liveThumb, setLiveThumb] = useState<string>('cyberpunk');
  const [liveDelay, setLiveDelay] = useState<number>(3); // seconds
  const [liveQuality, setLiveQuality] = useState<'auto' | '1080p' | '720p'>('auto');
  const [liveLowLatency, setLiveLowLatency] = useState<boolean>(true);

  // Scheduling State
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean>(false);
  const [scheduleTimerSec, setScheduleTimerSec] = useState<number>(30); // auto-start in 30s for demo
  const [autoEndEnabled, setAutoEndEnabled] = useState<boolean>(false);
  const [autoEndSec, setAutoEndSec] = useState<number>(180); // auto-stop in 180s for testing
  const [autoReplayEnabled, setAutoReplayEnabled] = useState<boolean>(true);

  // Stream Session Active State
  const [isLive, setIsLive] = useState<boolean>(false);
  const [streamTime, setStreamTime] = useState<number>(0);
  const [streamViewers, setStreamViewers] = useState<number>(0);
  const [streamFollowersGained, setStreamFollowersGained] = useState<number>(0);
  const [streamSubscribersGained, setStreamSubscribersGained] = useState<number>(0);
  const [analyticsHistory, setAnalyticsHistory] = useState<number[]>([150, 320, 480, 620, 850, 940, 1100]);

  // --- MODERATION ROOM STATE ---
  const [slowModeDelay, setSlowModeDelay] = useState<number>(0); // 0s, 3s, 5s, 10s
  const [badWordsFilter, setBadWordsFilter] = useState<boolean>(true);
  const [antiSpamActive, setAntiSpamActive] = useState<boolean>(true);
  const [bannedUsers, setBannedUsers] = useState<string[]>(['CheaterNoob', 'BotSpam_99']);
  const [modLogs, setModLogs] = useState<ModLog[]>([
    { id: 'ml-1', timestamp: '11:15', targetUser: 'CheaterNoob', action: 'BAN', details: 'Banido por divulgar cheats ou exploits de memória.' },
    { id: 'ml-2', timestamp: '11:22', targetUser: 'BotSpam_99', action: 'BAN', details: 'Disparo de spam massivo repetitivo detectado.' }
  ]);

  // Upcoming scheduled streams list
  const [upcomingStreams, setUpcomingStreams] = useState([
    { id: 'up-1', streamer: 'Shroud_God', title: 'Torneio Final de Dungeon Crawler', time: '18:00', countdown: '06h 25m', notified: false },
    { id: 'up-2', streamer: 'Valkyrae_Pro', title: 'Copa de Drift com Inscritos', time: '21:30', countdown: '09h 55m', notified: true }
  ]);

  const activeChannel = channels.find(c => c.id === selectedChannelId) || channels[0];

  // Toast Notification helper
  const addNotification = (title: string, desc: string, type: 'success' | 'info' | 'alert' = 'info') => {
    const id = `notif-${Date.now()}`;
    setNotifications(prev => [...prev, { id, title, desc, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // --- TIMERS AND EFFECTS ---

  // Ref for chat spam timing
  const lastSentTimeRef = useRef<number>(0);

  // Dynamic comment simulation ticker (simulates real audience chat)
  useEffect(() => {
    const interval = setInterval(() => {
      // Determine streamer currently watched
      let currentBroadcasterName = 'Ninja_Gamer';
      if (isLive && activeMode === 'dashboard') {
        currentBroadcasterName = 'Você';
      } else if (activeMode === 'viewer') {
        currentBroadcasterName = activeChannel.broadcaster;
      }

      // Skip chat update if we are watching offline/no stream
      if (activeMode === 'dashboard' && !isLive) return;

      const randomUser = CHAT_SIMULATOR_NAMES[Math.floor(Math.random() * CHAT_SIMULATOR_NAMES.length)];
      
      // Safety skip if user is banned
      if (bannedUsers.includes(randomUser)) return;

      let text = CHAT_SIMULATOR_PHRASES[Math.floor(Math.random() * CHAT_SIMULATOR_PHRASES.length)];
      
      // Adapt text depending on current active game
      if (Math.random() > 0.5) {
        const gameTerm = activeMode === 'dashboard' ? liveGame : activeChannel.game;
        text = `Incrível essa transmissão de ${gameTerm}! 💥`;
      }

      const isSub = Math.random() > 0.7;
      const isVip = Math.random() > 0.85;

      setComments(prev => {
        const commentId = `c-${Date.now()}`;
        
        // Save to active live recording chat logs
        if (isLive && activeMode === 'dashboard') {
          setLiveChatLogs(currLogs => [
            ...currLogs,
            { id: `live-${commentId}`, user: randomUser, text, timeSec: streamTime, isSub, isVip }
          ]);
        }

        const updated = [
          ...prev,
          { id: commentId, user: randomUser, text, isSub, isVip }
        ];
        return updated.slice(-18); // keep last 18 messages
      });

      // Fluctuate viewers slightly
      if (activeMode === 'viewer') {
        setChannels(curr => curr.map(ch => {
          if (ch.id === selectedChannelId) {
            const variance = Math.floor((Math.random() - 0.5) * 50);
            return { ...ch, viewers: Math.max(100, ch.viewers + variance) };
          }
          return ch;
        }));
      }

    }, 3000);

    return () => clearInterval(interval);
  }, [activeChannel, isLive, activeMode, liveGame, bannedUsers]);

  // Scheduler Countdown & Stream Duration Timer
  useEffect(() => {
    let secondInterval: NodeJS.Timeout;

    if (isLive || scheduleEnabled) {
      secondInterval = setInterval(() => {
        // Handle Auto-Start Scheduling countdown
        if (scheduleEnabled && scheduleTimerSec > 0 && !isLive) {
          setScheduleTimerSec(prev => {
            if (prev <= 1) {
              // Trigger Auto Start Live
              setIsLive(true);
              setStreamTime(0);
              setStreamViewers(350);
              addNotification(
                'Transmissão Agendada Iniciada!',
                `Sua live de "${liveTitle}" foi iniciada de forma automática pelo agendador.`,
                'success'
              );
              playSound.victory();
              return 0;
            }
            return prev - 1;
          });
        }

        // Handle Active Stream stats
        if (isLive) {
          setStreamTime(prev => {
            const nextTime = prev + 1;
            
            // Handle Auto-End Timer
            if (autoEndEnabled && nextTime >= autoEndSec) {
              // Trigger Auto Stop Live
              handleStopStream();
              return 0;
            }
            return nextTime;
          });

          // Fluctuate streamer metrics over time
          setStreamViewers(prev => {
            const variance = Math.floor((Math.random() - 0.45) * 8);
            const nextViewers = Math.max(10, prev + variance);
            
            // Add to analytics history every 10 seconds
            if (streamTime % 10 === 0) {
              setAnalyticsHistory(arr => [...arr.slice(-10), nextViewers]);
            }
            return nextViewers;
          });

          // Accumulate likes & shares in real-time
          setLiveLikes(curr => curr + (Math.random() > 0.6 ? Math.floor(Math.random() * 3) + 1 : 0));
          if (Math.random() > 0.85) {
            setLiveShares(curr => curr + 1);
          }

          // Accumulate random reactions
          if (Math.random() > 0.75) {
            const keys = ['🔥', '😮', '👍', '❤️'];
            const randKey = keys[Math.floor(Math.random() * keys.length)];
            setLiveReactions(curr => ({
              ...curr,
              [randKey]: (curr[randKey] || 0) + 1
            }));
          }

          // Anti-Crash Realtime backup routine
          const backupData = {
            liveTitle,
            liveGame,
            liveThumb,
            streamTime,
            streamViewers,
            likes: liveLikes,
            shares: liveShares,
            chatLogs: liveChatLogs,
            reactions: liveReactions
          };
          localStorage.setItem('gamezone_active_live_backup', JSON.stringify(backupData));

          // Random followers gain
          if (Math.random() > 0.85) {
            setStreamFollowersGained(g => {
              const gained = g + 1;
              setFollowerGoal(goal => ({ ...goal, current: Math.min(goal.target, goal.current + 1) }));
              return gained;
            });
            if (Math.random() > 0.5) {
              addNotification(
                'Novo Seguidor! 🎉',
                `Alguém acabou de seguir o seu canal durante a transmissão de ${liveGame}!`,
                'info'
              );
              playSound.collect();
            }
          }

          // Random subscribers gain
          if (Math.random() > 0.96) {
            setStreamSubscribersGained(s => {
              const gained = s + 1;
              setSubscriberGoal(goal => ({ ...goal, current: Math.min(goal.target, goal.current + 1) }));
              return gained;
            });
            addNotification(
              'Novo Assinante do Canal! 👑',
              `Gamer_Premium acaba de se inscrever! Meta de subs atualizada.`,
              'success'
            );
            playSound.jackpot();
          }
        }
      }, 1000);
    }

    return () => clearInterval(secondInterval);
  }, [isLive, scheduleEnabled, scheduleTimerSec, autoEndEnabled, autoEndSec, streamTime, liveTitle, liveGame]);

  // Reaction float simulation cleaner
  useEffect(() => {
    if (floatingReactions.length > 0) {
      const timeout = setTimeout(() => {
        setFloatingReactions(prev => prev.slice(1));
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [floatingReactions]);

  // Mount-time Crash Protection Detection
  useEffect(() => {
    const cachedBackup = localStorage.getItem('gamezone_active_live_backup');
    if (cachedBackup) {
      try {
        const parsed = JSON.parse(cachedBackup);
        if (parsed.streamTime > 3) {
          setCrashBackup({
            title: parsed.liveTitle || 'Live de Emergência',
            game: parsed.liveGame || 'Nave Espacial Arcade',
            durationSec: parsed.streamTime,
            peakViewers: Math.max(parsed.streamViewers || 150, 150),
            likes: parsed.likes || 0,
            shares: parsed.shares || 0,
            chatLogs: parsed.chatLogs || [],
            reactions: parsed.reactions || { '🔥': 0, '😮': 0, '👍': 0, '❤️': 0 },
            thumb: parsed.liveThumb || 'cyberpunk'
          });
        }
      } catch (err) {
        console.error("Erro ao ler backup de live interrompida:", err);
      }
    }
  }, []);

  // --- INTERACTIVE ACTIONS ---

  const handleStartStream = () => {
    playSound.click();
    setIsLive(true);
    setStreamTime(0);
    setStreamViewers(150); // initial seed viewers
    setStreamFollowersGained(0);
    setStreamSubscribersGained(0);
    setScheduleEnabled(false); // remove pre-schedule
    
    // Reset accumulators
    setLiveLikes(0);
    setLiveShares(0);
    setLiveReactions({ '🔥': 0, '😮': 0, '👍': 0, '❤️': 0 });
    setLiveChatLogs([]);

    // Append our user channel to lists for viewers to discover!
    const myChannel: StreamChannel = {
      id: 'ch-me',
      broadcaster: 'Você (Streamer)',
      game: liveGame,
      viewers: 150,
      bitrateKbps: liveQuality === '1080p' ? 8000 : liveQuality === '720p' ? 4500 : 6000,
      fps: 60,
      status: 'live',
      title: liveTitle
    };

    setChannels(prev => [myChannel, ...prev.filter(c => c.id !== 'ch-me')]);
    addNotification('Live Iniciada!', `Você agora está transmitindo ${liveGame} ao vivo com latência ultrabaixa.`, 'success');
  };

  const handleStopStream = () => {
    if (!isLive) return;
    playSound.gameover();
    setIsLive(false);

    // Save Replay Automatically with rich metadata!
    const replayId = `rep-${Date.now()}`;
    
    // Auto-generate Chapters chronologically based on duration
    const chaptersList = [
      { timeSec: 0, title: 'Início da Transmissão & Aquecimento 🎬' },
      { timeSec: Math.max(5, Math.floor(streamTime * 0.25)), title: 'Início da Gameplay & Análise Inicial 🎮' },
      { timeSec: Math.max(10, Math.floor(streamTime * 0.5)), title: 'Foco Total & Meta de Inscritos Atingida 📈' },
      { timeSec: Math.max(15, Math.floor(streamTime * 0.75)), title: 'Combate Decisivo (Bento-Boss) 👹' },
      { timeSec: streamTime, title: 'Encerramento e Agradecimentos 👋' }
    ].filter(ch => ch.timeSec <= streamTime);

    // Auto-generate Events timeline based on highlights
    const eventsList = [
      { timeSec: Math.max(4, Math.floor(streamTime * 0.15)), title: 'Pico de Audiência Registrado 📊', type: 'chat' },
      { timeSec: Math.max(12, Math.floor(streamTime * 0.45)), title: 'Jogada Épica Capturada (Highlight) 🎬', type: 'kill' },
      { timeSec: Math.max(18, Math.floor(streamTime * 0.65)), title: 'Onda de Reações no Chat 🔥', type: 'reaction' }
    ].filter(ev => ev.timeSec <= streamTime);

    // Generate simulated clip data associated with this replay
    const generatedClips: StreamClip[] = [
      {
        id: `clip-${Date.now()}-1`,
        title: `CLIPE AUTO - MELHOR MOMENTO ${liveTitle.slice(0, 15)}`,
        game: liveGame,
        durationSec: Math.min(streamTime, 15),
        timestamp: new Date().toLocaleTimeString().slice(0, 5)
      }
    ];

    // Merge manual comments and automated chat logs
    const finalChatLogs = liveChatLogs.length > 0 ? liveChatLogs : [
      { id: 'mc-1', user: 'Mod_Z', text: 'Boa sorte na transmissão!', timeSec: 2 },
      { id: 'mc-2', user: 'Fallen_Angel', text: 'Acelera que hoje tem recorde!', timeSec: Math.max(1, Math.floor(streamTime * 0.3)) },
      { id: 'mc-3', user: 'Ninja_Gamer', text: 'Que drift insano foi esse?! 🔥', timeSec: Math.max(2, Math.floor(streamTime * 0.6)) },
      { id: 'mc-4', user: 'Gamer_Premium', text: 'GG WP, stream espetacular!', timeSec: Math.max(3, Math.floor(streamTime * 0.95)) }
    ].filter(msg => msg.timeSec <= streamTime);

    const finalPeak = Math.max(streamViewers, 150);

    const newReplay: ReplayBlob = {
      id: replayId,
      gameId: liveGame.toLowerCase().replace(/\s+/g, '-'),
      players: ['Você (Streamer)', 'Chat Arena'],
      durationSec: streamTime,
      sizeMb: parseFloat((10 + (streamTime * 0.15) + Math.random() * 5).toFixed(1)),
      status: autoReplayEnabled ? 'processed' : 'raw',
      resolution: `${liveQuality === 'auto' ? '1080p' : liveQuality}60 ${autoReplayEnabled ? 'HLS Stream (.m3u8)' : 'Telemetry File'}`,
      title: liveTitle,
      broadcaster: 'Você (Streamer)',
      peakViewers: finalPeak,
      likes: liveLikes > 0 ? liveLikes : Math.floor(streamTime * 0.7) + 12,
      shares: liveShares > 0 ? liveShares : Math.floor(streamTime * 0.05) + 2,
      commentsCount: finalChatLogs.length,
      chatLogs: finalChatLogs,
      clips: generatedClips,
      highlights: [
        { id: `hl-${Date.now()}-1`, timeSec: Math.max(1, Math.floor(streamTime * 0.45)), title: 'Melhor Jogada da Partida', type: 'kill' }
      ],
      thumbnail: liveThumb === 'cyberpunk' ? 'from-purple-600 to-pink-600' : liveThumb === 'retro' ? 'from-amber-500 to-red-600' : 'from-indigo-600 to-purple-800',
      chapters: chaptersList,
      events: eventsList,
      markers: [
        { timeSec: 0, note: 'Início da Gravação Auto' }
      ],
      analyticsData: {
        viewersHistory: analyticsHistory.length > 5 ? analyticsHistory : [150, 180, 240, 290, 320, finalPeak],
        chatSpeedHistory: [5, 12, 24, 30, 22, 12],
        likesTimeline: [20, 60, 140, 220, 290, liveLikes || 310]
      },
      isFavorite: false,
      playlists: []
    };

    setReplays(prev => [newReplay, ...prev]);
    setClips(curr => [...generatedClips, ...curr]);

    // Update channels list
    setChannels(prev => prev.filter(c => c.id !== 'ch-me'));

    // Clear Local Storage crash backup
    localStorage.removeItem('gamezone_active_live_backup');

    addNotification(
      'Live Encerrada & Gravada! 💾',
      `Transmissão encerrada. Replay completo, clipes e timelines gravados no seu Estúdio!`,
      'success'
    );
  };

  const handleRestoreBackup = () => {
    if (!crashBackup) return;
    playSound.victory();

    const replayId = `rep-recov-${Date.now()}`;
    const chaptersList = [
      { timeSec: 0, title: 'Início (Sessão Auto-Recuperada) 🎬' },
      { timeSec: Math.max(1, Math.floor(crashBackup.durationSec * 0.5)), title: 'Gameplay de Emergência Preservada 🎮' },
      { timeSec: crashBackup.durationSec, title: 'Momento da Falha de Ingress ⚠️' }
    ].filter(ch => ch.timeSec <= crashBackup.durationSec);

    const generatedClips: StreamClip[] = [
      {
        id: `clip-recov-${Date.now()}`,
        title: `CLIPE RECUPERADO - ${crashBackup.title.slice(0, 15)}`,
        game: crashBackup.game,
        durationSec: Math.min(crashBackup.durationSec, 15),
        timestamp: new Date().toLocaleTimeString().slice(0, 5)
      }
    ];

    const finalChatLogs = crashBackup.chatLogs.length > 0 ? crashBackup.chatLogs : [
      { id: 'mc-rec-1', user: 'Mod_Z', text: 'Live restaurada!', timeSec: 2 },
      { id: 'mc-rec-2', user: 'Fallen_Angel', text: 'Graças ao anti-crash do LiveHub!', timeSec: Math.max(1, Math.floor(crashBackup.durationSec * 0.6)) }
    ];

    const newReplay: ReplayBlob = {
      id: replayId,
      gameId: crashBackup.game.toLowerCase().replace(/\s+/g, '-'),
      players: ['Você (Streamer)', 'Chat Arena'],
      durationSec: crashBackup.durationSec,
      sizeMb: parseFloat((10 + (crashBackup.durationSec * 0.15) + Math.random() * 5).toFixed(1)),
      status: 'processed',
      resolution: '1080p60 HLS Stream (.m3u8)',
      title: `${crashBackup.title} [RECUPERADA]`,
      broadcaster: 'Você (Streamer)',
      peakViewers: crashBackup.peakViewers,
      likes: crashBackup.likes,
      shares: crashBackup.shares,
      commentsCount: finalChatLogs.length,
      chatLogs: finalChatLogs,
      clips: generatedClips,
      highlights: [
        { id: `hl-${Date.now()}-recov`, timeSec: Math.max(1, Math.floor(crashBackup.durationSec * 0.5)), title: 'Sessão Salva contra Queda', type: 'reaction' }
      ],
      thumbnail: crashBackup.thumb === 'cyberpunk' ? 'from-purple-600 to-pink-600' : crashBackup.thumb === 'retro' ? 'from-amber-500 to-red-600' : 'from-indigo-600 to-purple-800',
      chapters: chaptersList,
      events: [{ timeSec: crashBackup.durationSec, title: 'Interrupção / Auto-Recuperado ⚠️', type: 'reaction' }],
      markers: [{ timeSec: 0, note: 'Recuperado com Sucesso' }],
      analyticsData: {
        viewersHistory: [150, crashBackup.peakViewers],
        chatSpeedHistory: [12, 18],
        likesTimeline: [20, crashBackup.likes]
      },
      isFavorite: false,
      playlists: []
    };

    setReplays(prev => [newReplay, ...prev]);
    setClips(curr => [...generatedClips, ...curr]);
    localStorage.removeItem('gamezone_active_live_backup');
    setCrashBackup(null);
    addNotification(
      'Sessão Recuperada! 🛡️',
      'A transmissão interrompida foi processada e salva integralmente na sua biblioteca.',
      'success'
    );
  };

  // Switch channel as a viewer
  const changeChannel = (id: string) => {
    playSound.click();
    setSelectedChannelId(id);
    setComments([
      { id: `c-change-${Date.now()}`, user: 'Sistema', text: `Conectando ao chat de transmissão ao vivo de ${id}...`, isMod: true }
    ]);
  };

  // Submit chat comment
  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myCommentText.trim()) return;

    const now = Date.now();
    // Anti Spam Filter validation
    if (antiSpamActive && now - lastSentTimeRef.current < (slowModeDelay * 1000 || 1200)) {
      playSound.gameover();
      addNotification(
        'Moderação Automática 🛡️',
        `Por favor, envie mensagens mais devagar. Modo lento ou anti-spam ativo (${slowModeDelay || 1.2}s Cooldown).`,
        'alert'
      );
      return;
    }
    lastSentTimeRef.current = now;

    let processedText = myCommentText;

    // Bad words filters
    if (badWordsFilter) {
      const bannedWords = ['lixo', 'hack', 'merda', 'inútil', 'fdp'];
      bannedWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        if (regex.test(processedText)) {
          processedText = processedText.replace(regex, '****');
          
          // Log inside moderation action logs
          const logId = `ml-${Date.now()}`;
          setModLogs(prev => [
            { id: logId, timestamp: new Date().toLocaleTimeString().slice(0, 5), targetUser: 'Você', action: 'BAD_WORD_CENSOR', details: `Uso censurado da palavra proibida: "${word}"` },
            ...prev
          ]);
        }
      });
    }

    playSound.click();
    const commentId = `c-my-${Date.now()}`;

    if (isLive && activeMode === 'dashboard') {
      setLiveChatLogs(currLogs => [
        ...currLogs,
        { id: `live-${commentId}`, user: 'Você', text: processedText, timeSec: streamTime, isSub: true, isVip: true }
      ]);
    }

    setComments(prev => [
      ...prev,
      { id: commentId, user: 'Você', text: processedText, isSub: true, isVip: true }
    ].slice(-18));
    setMyCommentText('');

    // Trigger dynamic viewer automated followups for immersion
    if (Math.random() > 0.4) {
      setTimeout(() => {
        const randUser = CHAT_SIMULATOR_NAMES[Math.floor(Math.random() * CHAT_SIMULATOR_NAMES.length)];
        setComments(prev => [
          ...prev,
          { id: `c-resp-${Date.now()}`, user: randUser, text: 'Concordo plenamente com você @Você!', isSub: Math.random() > 0.5 }
        ].slice(-18));
      }, 1500);
    }
  };

  // Emoji picker quick reaction inserter
  const insertEmoji = (emoji: string) => {
    playSound.click();
    setMyCommentText(curr => curr + emoji);
  };

  // Floating Reaction animator
  const handleReact = (type: string) => {
    playSound.click();
    const id = `react-${Date.now()}-${Math.random()}`;
    const x = 30 + Math.random() * 50; // percentage inside video screen
    const y = 80; // starts at bottom
    setFloatingReactions(prev => [...prev, { id, type, x, y }]);
  };

  // Toggle Favorite
  const toggleFavoriteChannel = (channelId: string) => {
    playSound.collect();
    if (favorites.includes(channelId)) {
      setFavorites(prev => prev.filter(id => id !== channelId));
      addNotification('Favorito Removido', 'A stream foi removida da sua lista de favoritos.', 'info');
    } else {
      setFavorites(prev => [...prev, channelId]);
      addNotification('Canal Favoritado! ⭐', 'Você será notificado sempre que este criador iniciar uma transmissão.', 'success');
    }
  };

  // Take Stream Highlight Clip
  const createClip = () => {
    playSound.jackpot();
    const gameName = activeMode === 'dashboard' ? liveGame : activeChannel.game;
    const streamTitleName = activeMode === 'dashboard' ? liveTitle : activeChannel.title;

    const newClip: StreamClip = {
      id: `clip-${Date.now()}`,
      title: `Clip de ${streamTitleName.slice(0, 20)}... 🎬`,
      game: gameName,
      durationSec: Math.floor(10 + Math.random() * 15),
      timestamp: new Date().toLocaleTimeString().slice(0, 5)
    };

    setClips(prev => [newClip, ...prev]);
    addNotification('Clip Salvo com Sucesso! 🎥', 'Seu clipe foi gravado nos arquivos de melhores momentos da comunidade.', 'success');
  };

  // Poll voting handler
  const handleVotePoll = (optionIndex: number) => {
    if (!activePoll || activePoll.hasVoted) return;
    playSound.click();

    const updatedOptions = activePoll.options.map((opt, idx) => {
      if (idx === optionIndex) {
        return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });

    setActivePoll({
      ...activePoll,
      options: updatedOptions,
      totalVotes: activePoll.totalVotes + 1,
      hasVoted: true,
      userVote: optionIndex
    });

    addNotification('Voto Computado! 📊', 'Obrigado por participar da enquete ativa.', 'success');
  };

  // Create a new poll as streamer / moderator
  const handleCreatePoll = (question: string, opt1: string, opt2: string) => {
    playSound.click();
    setActivePoll({
      question,
      options: [
        { text: opt1, votes: 0 },
        { text: opt2, votes: 0 }
      ],
      totalVotes: 0,
      hasVoted: false,
      userVote: null
    });
    addNotification('Nova Enquete Criada!', 'Seus espectadores já podem votar em tempo real.', 'success');
  };

  // Trigger transcode of a replay
  const triggerTranscoding = (id: string) => {
    playSound.click();
    setIsTranscoding(id);
    setTranscodingProgress(0);

    const interval = setInterval(() => {
      setTranscodingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTranscoding(null);
          playSound.victory();
          
          setReplays(curr => curr.map(rep => {
            if (rep.id === id) {
              return {
                ...rep,
                status: 'processed',
                sizeMb: parseFloat((rep.sizeMb * 3.5).toFixed(1)),
                resolution: '1080p60 HLS Adaptive Stream (.m3u8)'
              };
            }
            return rep;
          }));
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  // Moderation room manual actions
  const handleTimeoutUserInChat = (username: string) => {
    playSound.click();
    addNotification('Usuário Silenciado ⏳', `${username} recebeu um timeout temporário de 60 segundos por spam.`, 'alert');
    setModLogs(prev => [
      { id: `ml-${Date.now()}`, timestamp: new Date().toLocaleTimeString().slice(0, 5), targetUser: username, action: 'TIMEOUT', details: 'Timeout temporário de 60s aplicado automaticamente.' },
      ...prev
    ]);
  };

  const handleBanUserInChat = (username: string) => {
    playSound.gameover();
    setBannedUsers(prev => [...prev, username]);
    addNotification('Usuário Banido! 🛡️', `${username} foi banido e impedido de acessar o chat definitivamente.`, 'alert');
    setModLogs(prev => [
      { id: `ml-${Date.now()}`, timestamp: new Date().toLocaleTimeString().slice(0, 5), targetUser: username, action: 'BAN', details: 'Banimento permanente da conta por assédio no chat.' },
      ...prev
    ]);
  };

  const handleUnbanUser = (username: string) => {
    playSound.click();
    setBannedUsers(prev => prev.filter(u => u !== username));
    addNotification('Usuário Desbanido', `${username} foi removido da lista de bloqueios.`, 'info');
  };

  // Copy shareable link simulated action
  const copyStreamLink = () => {
    playSound.click();
    navigator.clipboard?.writeText(`https://gamezon.live/stream/${activeChannel.broadcaster.toLowerCase()}`);
    addNotification('Link Copiado! 🔗', 'O link da transmissão foi copiado para a sua área de transferência.', 'success');
  };

  // Pre-configured Thumbnail options
  const THUMB_PRESETS = [
    { id: 'cyberpunk', name: 'Cyberpunk Neon', color: 'from-purple-600 to-pink-600' },
    { id: 'retro', name: 'Vaporwave Retro', color: 'from-indigo-600 to-cyan-500' },
    { id: 'arena', name: 'Gladiador Arena', color: 'from-amber-500 to-red-600' },
    { id: 'space', name: 'Estrelas Espaciais', color: 'from-blue-700 to-slate-900' }
  ];

  const activeThumbColor = THUMB_PRESETS.find(t => t.id === liveThumb)?.color || 'from-indigo-600 to-purple-600';

  return (
    <div className="space-y-6">

      {/* STACK TOAST NOTIFICATIONS */}
      <div className="fixed top-20 right-6 z-50 space-y-2 pointer-events-none w-80">
        {notifications.map(notif => (
          <div 
            key={notif.id}
            className={`p-3.5 rounded-xl border shadow-xl flex items-start gap-3 animate-slideIn backdrop-blur-md pointer-events-auto transition-all ${
              notif.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' :
              notif.type === 'alert' ? 'bg-red-500/90 border-red-400 text-white' :
              'bg-slate-900/95 border-slate-800 text-white'
            }`}
          >
            {notif.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />}
            {notif.type === 'alert' && <AlertTriangle className="w-5 h-5 shrink-0 text-white" />}
            {notif.type === 'info' && <Bell className="w-5 h-5 shrink-0 text-indigo-400" />}

            <div className="space-y-0.5">
              <h4 className="text-xs font-black uppercase tracking-tight">{notif.title}</h4>
              <p className="text-[10px] opacity-90 font-medium leading-normal">{notif.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* HEADER CONTROL AND MODE TOGGLE */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-150 dark:border-slate-850">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-indigo-500 animate-pulse" />
            <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white">
              LiveHub: Estúdio de Transmissões Profissionais
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Transmita seus jogos favoritos da plataforma, agende horários, modere conversas e acesse métricas em tempo real.
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-950/80 rounded-xl border border-slate-300/40 dark:border-slate-850 self-start sm:self-center">
          <button
            onClick={() => { playSound.click(); setActiveMode('viewer'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'viewer'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Tv className="w-4 h-4" />
            Assistir Streams
          </button>
          <button
            onClick={() => { playSound.click(); setActiveMode('dashboard'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 relative ${
              activeMode === 'dashboard'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Painel do Streamer
            {isLive && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
          </button>
          <button
            onClick={() => { playSound.click(); setActiveMode('replays'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'replays'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Estúdio de Replays & Gravações
            <span className="ml-1 px-1.5 py-0.5 text-[9px] font-black rounded-full bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-indigo-400">
              {replays.length}
            </span>
          </button>
        </div>
      </div>

      {/* CRASH PROTECTION EMERGENCY RECOVERY BANNER */}
      {crashBackup && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-scaleIn">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 md:mt-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase text-amber-800 dark:text-amber-400 tracking-wider flex items-center gap-1">
                Gravação de Emergência Detectada! 🛡️
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                Detectamos que uma live de <span className="font-bold">"{crashBackup.game}"</span> ({crashBackup.durationSec}s) foi interrompida inesperadamente. 
                Nossos mecanismos de tolerância a falhas preservaram 100% dos dados de timeline, chat logs e engajamento.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            <button
              onClick={() => { playSound.click(); localStorage.removeItem('gamezone_active_live_backup'); setCrashBackup(null); }}
              className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
            >
              Descartar
            </button>
            <button
              onClick={handleRestoreBackup}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Recuperar Gravação
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: VIEW LIVE STREAMS SPACE */}
      {activeMode === 'viewer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main area: Video Player and details */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Dynamic Stream Player Frame */}
            <div className="relative aspect-video bg-slate-950 rounded-3xl overflow-hidden border border-slate-850 shadow-2xl flex flex-col justify-between p-5 text-white group">
              
              {/* Floating Reaction Animation Overlay layer */}
              <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                {floatingReactions.map(rect => (
                  <div 
                    key={rect.id}
                    className="absolute text-3xl animate-floatUp select-none opacity-0"
                    style={{ 
                      left: `${rect.x}%`, 
                      bottom: '20px',
                      animation: 'floatUp 1.5s ease-out forwards'
                    }}
                  >
                    {rect.type}
                  </div>
                ))}
              </div>

              {/* Top Bar Indicators */}
              <div className="z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white font-mono text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1.5 shadow-md shadow-red-950/40">
                    <span className="w-2 h-2 bg-white rounded-full animate-ping" /> AO VIVO
                  </span>
                  
                  <span className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-tight text-white border border-white/5 uppercase">
                    {activeChannel.broadcaster}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-emerald-400 border border-emerald-500/10">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono font-black">{activeChannel.viewers.toLocaleString()}</span> espectando
                </div>
              </div>

              {/* Simulated active streaming simulation content based on the active game */}
              <div className="absolute inset-0 flex flex-col justify-center items-center p-6 text-center select-none bg-slate-950/80">
                
                {/* Visual game background graphic simulation */}
                <div className="absolute inset-0 opacity-15 overflow-hidden flex items-center justify-center">
                  <div className="w-full h-full bg-grid-pattern animate-pulse" />
                  {activeChannel.game.includes('Espacial') && (
                    <div className="w-full h-full bg-radial-dots animate-spin" style={{ animationDuration: '100s' }} />
                  )}
                  {activeChannel.game.includes('Racer') && (
                    <div className="w-full h-full bg-linear-stripes animate-pulse" />
                  )}
                </div>

                <div className="space-y-4 z-10 max-w-lg">
                  {/* Virtual glowing screen brand */}
                  <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center animate-bounce shadow-xl shadow-indigo-500/20 mx-auto">
                    <Tv className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-white drop-shadow-md">
                      {activeChannel.title}
                    </h2>
                    <p className="text-xs text-indigo-300 font-mono font-black uppercase tracking-wider">
                      Transmitindo: {activeChannel.game}
                    </p>
                  </div>
                  
                  {/* Floating quality parameters */}
                  <div className="flex items-center justify-center gap-2 text-[9px] font-mono text-slate-400 uppercase tracking-widest font-black">
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">BAIXA LATÊNCIA</span>
                    <span>•</span>
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">1080P PRO</span>
                    <span>•</span>
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">DELAY: 3S</span>
                  </div>
                </div>
              </div>

              {/* Bottom Interactive Frame Controls */}
              <div className="z-10 flex flex-wrap items-center justify-between bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/5 gap-3">
                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-300 font-bold">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>QUALIDADE: AUTO (1080p60)</span>
                  </div>
                  <div className="hidden sm:block">FPS: {activeChannel.fps}</div>
                  <div className="hidden md:block">BITRATE: {activeChannel.bitrateKbps} KBPS</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFavoriteChannel(activeChannel.id)}
                    className={`p-2 rounded-xl transition-all border cursor-pointer ${
                      favorites.includes(activeChannel.id)
                        ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md'
                        : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-amber-400'
                    }`}
                    title="Favoritar Canal"
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    onClick={() => setShowShareModal(true)}
                    className="p-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-xl cursor-pointer"
                    title="Compartilhar Canal"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={createClip}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 text-white font-black rounded-xl text-[10px] uppercase cursor-pointer flex items-center gap-1.5"
                    title="Capturar Clip de 15 segundos"
                  >
                    <Video className="w-4 h-4" /> Rec Clip 🎬
                  </button>
                </div>
              </div>
            </div>

            {/* CHANNEL METADATA AND INFO */}
            <div className="p-5 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 border border-indigo-150 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 rounded font-black tracking-wider">
                    {activeChannel.game}
                  </span>
                  <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded font-bold">
                    PORTUGUÊS (PT-BR)
                  </span>
                  <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded font-bold">
                    BAIXA LATÊNCIA ATIVA
                  </span>
                </div>

                <h1 className="text-base md:text-lg font-black text-slate-800 dark:text-white leading-tight uppercase">
                  {activeChannel.title}
                </h1>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500 text-white font-black rounded-lg flex items-center justify-center text-xs uppercase">
                    {activeChannel.broadcaster.charAt(0)}
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">{activeChannel.broadcaster}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Parceiro Oficial LiveHub • Verificado</span>
                  </div>
                </div>
              </div>

              {/* Metas / Milestone Tracker Goals widgets */}
              <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-850 rounded-xl min-w-0 md:min-w-[220px]">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>META DE SEGUIDORES</span>
                    <span className="font-mono text-indigo-500">{followerGoal.current}/{followerGoal.target}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(followerGoal.current / followerGoal.target) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>META DE SUBS (APOIO)</span>
                    <span className="font-mono text-purple-500">{subscriberGoal.current}/{subscriberGoal.target}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(subscriberGoal.current / subscriberGoal.target) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CHANNEL SELECTOR LIST (WHO IS ONLINE) */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" />
                Criadores Ao Vivo Agora
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {channels.map(ch => {
                  const isWatching = ch.id === selectedChannelId;
                  const isFav = favorites.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      onClick={() => changeChannel(ch.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-[100px] ${
                        isWatching 
                          ? 'bg-gradient-to-b from-indigo-50/50 to-indigo-100/10 dark:from-indigo-950/20 dark:to-slate-950 border-indigo-400 dark:border-indigo-850 shadow-md shadow-indigo-600/5' 
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 w-full">
                        <span className="text-[9px] font-black text-slate-400 group-hover:text-slate-500 transition-colors uppercase tracking-wider">{ch.broadcaster}</span>
                        {isFav && <Star className="w-3 h-3 text-amber-500 fill-current" />}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate w-full group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                          {ch.title}
                        </h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{ch.game}</p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-900 w-full">
                        <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> AO VIVO
                        </span>
                        <span className="text-[10px] font-mono font-black text-slate-800 dark:text-slate-300">
                          {ch.viewers >= 1000 ? `${(ch.viewers / 1000).toFixed(1)}k` : ch.viewers} spects
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SCHEDULED CHANNELS SECTION */}
            <div className="p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-150 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  Transmissões Agendadas da Comunidade (Upcoming)
                </h3>
                <span className="text-[9px] font-mono bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-bold uppercase border border-purple-150">
                  Sincronizado
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {upcomingStreams.map(up => (
                  <div 
                    key={up.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-purple-500 uppercase block tracking-wider">Streamer: {up.streamer}</span>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase truncate">{up.title}</h4>
                      <p className="text-[10px] text-slate-400">Hoje às {up.time} ({up.countdown})</p>
                    </div>

                    <button
                      onClick={() => {
                        playSound.click();
                        setUpcomingStreams(curr => curr.map(item => item.id === up.id ? { ...item, notified: !item.notified } : item));
                        addNotification(
                          up.notified ? 'Notificação Cancelada' : 'Lembrete Ativado! 🔔',
                          up.notified 
                            ? 'Você não receberá alertas para esta live.' 
                            : `Avisaremos você assim que ${up.streamer} iniciar a live às ${up.time}!`,
                          'info'
                        );
                      }}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer transition-all border ${
                        up.notified
                          ? 'bg-purple-100 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-400'
                          : 'bg-white hover:bg-slate-100 dark:bg-slate-950 border-slate-200 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {up.notified ? 'Avisar: SIM ✓' : 'Avisar-me'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right sidebar area: Live Chat room feed, emojis, Poll widget and Clips */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Live Chat Box */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4.5 rounded-2xl shadow-sm flex flex-col justify-between h-[360px] relative">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-150 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-tight">Chat da Transmissão</span>
                  </div>
                  <span className="text-[8px] font-mono text-emerald-500 font-bold uppercase tracking-widest border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    Moderado por IA
                  </span>
                </div>

                {/* Live Comments Feed */}
                <div className="h-48 overflow-y-auto font-sans text-xs space-y-2 py-1 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-850">
                  {comments.map((c) => (
                    <div key={c.id} className="leading-relaxed animate-fadeIn">
                      <strong className={`font-mono text-[10px] mr-1.5 uppercase ${
                        c.user === 'Você' ? 'text-indigo-600 dark:text-indigo-400 font-black' :
                        c.isMod ? 'text-red-500 font-black flex-inline items-center gap-0.5' :
                        c.isSub ? 'text-purple-600 dark:text-purple-400 font-bold' :
                        c.isVip ? 'text-amber-500 font-bold' : 'text-slate-500'
                      }`}>
                        {c.isMod && '🛡️ '}{c.user}:
                      </strong>
                      <span className="text-slate-600 dark:text-slate-200 font-medium">{c.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat action form and emoji tools */}
              <div className="space-y-2.5 pt-2 border-t border-slate-150 dark:border-slate-800">
                {/* Emojis bar & floating reactions panel */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {['🔥', '😮', '👑', '🚀', '❤️', '👍'].map(em => (
                      <button
                        key={em}
                        onClick={() => insertEmoji(em)}
                        className="text-xs p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded cursor-pointer transition-colors"
                      >
                        {emoji => emoji}{em}
                      </button>
                    ))}
                  </div>

                  {/* Quick video overlay reactions trigger */}
                  <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                    <span className="text-[8px] font-bold text-slate-400 uppercase mr-1">Reagir:</span>
                    {['❤️', '🔥', '👍', '🎉'].map(type => (
                      <button
                        key={type}
                        onClick={() => handleReact(type)}
                        className="text-xs hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                        title="Enviar reação na tela da live"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Send Form */}
                <form onSubmit={submitComment} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder={slowModeDelay > 0 ? `Chat em modo lento (${slowModeDelay}s)...` : "Escrever mensagem no chat..."} 
                    value={myCommentText}
                    onChange={(e) => setMyCommentText(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                  <button 
                    type="submit" 
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* LIVE POLL (ENQUETE) INTERACTIVE WIDGET */}
            {activePoll && (
              <div className="p-4.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm space-y-3.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-900">
                  <span className="text-[9px] text-indigo-500 font-black uppercase tracking-wider">Enquete Ativa na Live</span>
                  <span className="text-[9px] font-mono text-slate-400">{activePoll.totalVotes} votos</span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase leading-normal">
                    {activePoll.question}
                  </h4>

                  <div className="space-y-2 text-xs">
                    {activePoll.options.map((opt, idx) => {
                      const percentage = activePoll.totalVotes > 0 
                        ? Math.round((opt.votes / activePoll.totalVotes) * 100) 
                        : 0;
                      const isWinner = idx === activePoll.userVote;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleVotePoll(idx)}
                          disabled={activePoll.hasVoted}
                          className={`w-full p-2.5 rounded-xl text-left border relative overflow-hidden transition-all text-xs flex items-center justify-between ${
                            activePoll.hasVoted 
                              ? 'border-slate-150 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/40 cursor-default'
                              : 'bg-white hover:bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 cursor-pointer'
                          }`}
                        >
                          {/* Progress slider bar under text */}
                          {activePoll.hasVoted && (
                            <div 
                              className="absolute top-0 bottom-0 left-0 bg-indigo-500/10 transition-all duration-700"
                              style={{ width: `${percentage}%` }}
                            />
                          )}

                          <span className={`font-bold uppercase tracking-tight z-10 relative flex items-center gap-1.5 ${
                            isWinner ? 'text-indigo-600 dark:text-indigo-400 font-black' : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {opt.text}
                            {isWinner && '✓'}
                          </span>
                          <span className="font-mono font-black z-10 relative text-slate-500">
                            {percentage}% ({opt.votes})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* MEUS CLIPS STUDIO */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4.5 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-150 dark:border-slate-800">
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-pink-500" />
                  Galeria de Clips Gravados ({clips.length})
                </span>
                <span className="text-[8px] font-mono text-slate-400 uppercase font-black">Comunidade</span>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin">
                {clips.map(clip => (
                  <div 
                    key={clip.id}
                    className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase">{clip.game} • {clip.timestamp}</span>
                      <span className="font-black text-slate-800 dark:text-slate-200 block uppercase tracking-tight mt-0.5">{clip.title}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono font-bold text-pink-500 bg-pink-50 dark:bg-pink-950/40 px-1.5 py-0.5 rounded border border-pink-200 dark:border-pink-900">
                        {clip.durationSec}s Clip
                      </span>
                    </div>
                  </div>
                ))}

                {clips.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs font-medium">
                    Nenhum clip capturado ainda. Clique em "Rec Clip" no player acima!
                  </div>
                )}
              </div>
            </div>

            {/* REPLAYS RECONVERSIONS PORTAL */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4.5 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-150 dark:border-slate-800">
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-indigo-500" />
                  Gravações &amp; Replays Salvos ({replays.length})
                </span>
                <span className="text-[8px] font-mono text-emerald-500 font-bold uppercase">Automático</span>
              </div>

              <div className="space-y-2.5 max-h-[180px] overflow-y-auto scrollbar-thin">
                {replays.map((rep) => {
                  const isRepTranscoding = isTranscoding === rep.id;
                  return (
                    <div key={rep.id} className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center justify-between text-xs gap-3">
                      <div className="min-w-0">
                        <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase">{rep.gameId}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5 uppercase tracking-tight">
                          {rep.players.join(' vs ')}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500 font-mono">
                          <span>{rep.durationSec >= 60 ? `${Math.floor(rep.durationSec / 60)}m` : `${rep.durationSec}s`}</span>
                          <span>•</span>
                          <span>{rep.sizeMb} MB</span>
                          <span>•</span>
                          <span className={rep.status === 'processed' ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
                            {rep.resolution}
                          </span>
                        </div>
                      </div>

                      {rep.status === 'raw' ? (
                        <button
                          onClick={() => triggerTranscoding(rep.id)}
                          disabled={isTranscoding !== null}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-850 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          {isRepTranscoding ? `${transcodingProgress}%` : 'Transcodificar'}
                        </button>
                      ) : (
                        <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/60 shrink-0 uppercase flex items-center gap-0.5">
                          Pronto ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: STREAMER CREATOR SUITE (DASHBOARD) */}
      {activeMode === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: Stream Control Panel & Forms */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Live Controller Status panel */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 border border-indigo-500/20 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`} />
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300">Painel de Transmissão</h4>
                </div>

                <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded font-bold border border-slate-750">
                  LATENCY: {liveLowLatency ? '1.5s' : '5.2s'}
                </span>
              </div>

              {/* Major Action Buttons */}
              <div className="space-y-2">
                {!isLive ? (
                  <button
                    onClick={handleStartStream}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-red-950/40 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-4 h-4 fill-current" /> Iniciar Transmissão Ao Vivo ⚡
                  </button>
                ) : (
                  <button
                    onClick={handleStopStream}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-red-950/40 cursor-pointer flex items-center justify-center gap-1.5 animate-pulse"
                  >
                    <XCircle className="w-4 h-4" /> Encerrar Transmissão Agora
                  </button>
                )}

                {/* Scheduled Countdown trigger indicator */}
                {scheduleEnabled && !isLive && (
                  <div className="p-3 bg-slate-800/80 border border-indigo-500/20 rounded-xl text-center space-y-1">
                    <span className="text-[9px] text-indigo-400 font-mono block font-black uppercase">AGENDADOR AUTOMÁTICO ATIVO</span>
                    <span className="text-xs font-mono font-black text-white">Início automático em {scheduleTimerSec} segundos</span>
                    <button
                      onClick={() => { playSound.click(); setScheduleEnabled(false); }}
                      className="text-[9px] text-red-400 hover:underline cursor-pointer block mx-auto pt-0.5 font-bold uppercase"
                    >
                      Cancelar Agendamento
                    </button>
                  </div>
                )}
              </div>

              {/* Stream Stats in real-time when live */}
              {isLive ? (
                <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Tempo de Live</span>
                    <span className="font-mono text-xs font-black">
                      {Math.floor(streamTime / 60).toString().padStart(2, '0')}:{(streamTime % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Espectadores</span>
                    <span className="font-mono text-xs font-black text-emerald-400">{streamViewers.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed">
                  Configure os detalhes da transmissão abaixo antes de dar o pontapé inicial em sua live.
                </p>
              )}
            </div>

            {/* LIVE STREAM SETUP FORM */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-150 dark:border-slate-800">
                <Settings className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Configurações da Live</span>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Título da Transmissão</label>
                  <input
                    type="text"
                    value={liveTitle}
                    onChange={(e) => setLiveTitle(e.target.value)}
                    placeholder="Ex: Jogando torneio de arcade hoje!"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Descrição</label>
                  <textarea
                    value={liveDesc}
                    onChange={(e) => setLiveDesc(e.target.value)}
                    placeholder="Descrição para os espectadores..."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 resize-none"
                  />
                </div>

                {/* Category Game selector */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Categoria (Jogo da Plataforma)</label>
                  <select
                    value={liveGame}
                    onChange={(e) => { playSound.click(); setLiveGame(e.target.value); }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100"
                  >
                    {PLATFORM_GAMES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Tags and Language in columns */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Idioma</label>
                    <select
                      value={liveLang}
                      onChange={(e) => setLiveLang(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="Português">Português</option>
                      <option value="Inglês">Inglês</option>
                      <option value="Espanhol">Espanhol</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Tags (Pills)</label>
                    <input
                      type="text"
                      value={liveTags}
                      onChange={(e) => setLiveTags(e.target.value)}
                      placeholder="competitivo, pro"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Thumbnail Preset */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Miniatura / Wallpaper da Live</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {THUMB_PRESETS.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => { playSound.click(); setLiveThumb(t.id); }}
                        className={`py-2 rounded-lg border text-[8px] font-black uppercase text-center cursor-pointer transition-all ${
                          liveThumb === t.id
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-500'
                        }`}
                      >
                        {t.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delay & Quality config */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-900">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Delay de Transmissão</label>
                    <select
                      value={liveDelay}
                      onChange={(e) => { playSound.click(); setLiveDelay(parseInt(e.target.value)); }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100"
                    >
                      <option value="0">Sem delay (0s)</option>
                      <option value="3">Normal (3s)</option>
                      <option value="5">Seguro (5s)</option>
                      <option value="10">Estratégico (10s)</option>
                      <option value="30">Torneios (30s)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Qualidade Máxima</label>
                    <select
                      value={liveQuality}
                      onChange={(e) => { playSound.click(); setLiveQuality(e.target.value as any); }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100"
                    >
                      <option value="auto">Automática (Adap.)</option>
                      <option value="1080p">1080p60 FHD</option>
                      <option value="720p">720p60 HD</option>
                    </select>
                  </div>
                </div>

                {/* Low Latency Option */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 block">Modo Baixa Latência</span>
                    <span className="text-[9px] text-slate-400">Garante interações de chat ultra rápidas</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={liveLowLatency}
                    onChange={(e) => { playSound.click(); setLiveLowLatency(e.target.checked); }}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Center area: Live Broadcast Monitor, Analytics graphs and Scheduling */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Stream Monitor (Webcam & stream feedback frame simulator) */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-3.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-150 dark:border-slate-800">
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-indigo-500" />
                  Monitor Retorno do Streamer (Live Sandbox)
                </span>
                <span className={`text-[9px] font-mono font-black uppercase ${isLive ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                  {isLive ? 'ONLINE FEED' : 'SIGNAL OFFLINE'}
                </span>
              </div>

              {/* Monitor Display */}
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden flex flex-col justify-between p-3.5">
                {isLive ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/20 to-black/30 animate-pulse" />
                    
                    {/* Webcam simulator pip */}
                    <div className="absolute right-3.5 top-3.5 w-18 h-14 bg-slate-900 border-2 border-indigo-500 rounded-lg overflow-hidden flex items-center justify-center z-10 shadow">
                      <span className="text-[8px] text-indigo-400 font-mono font-black uppercase tracking-widest animate-pulse">WEBCAM CAM-1</span>
                    </div>

                    <div className="z-10 flex justify-between items-start w-full">
                      <span className="bg-red-600 text-white text-[8px] font-mono px-2 py-0.5 rounded uppercase font-black">
                        LIVE ENCODER OK
                      </span>
                    </div>

                    {/* Simulation graphics */}
                    <div className="text-center space-y-1 select-none z-10 pointer-events-none">
                      <h4 className="text-sm font-black text-white uppercase tracking-tight drop-shadow">{liveTitle}</h4>
                      <p className="text-[9px] text-indigo-300 font-mono font-bold uppercase tracking-wider">Jogando: {liveGame}</p>
                    </div>

                    <div className="z-10 flex justify-between items-end w-full text-[8px] font-mono text-slate-400">
                      <span>FPS: 60/60 • CODES: NVENC H.264</span>
                      <span>AUDIO: 48KHZ 160KBPS</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 space-y-2">
                    <SlidersHorizontal className="w-8 h-8 text-slate-600 animate-pulse" />
                    <span className="text-xs font-black text-slate-500 uppercase">Aguardando início do Encoder...</span>
                    <span className="text-[9px] text-slate-600 uppercase font-mono">Clique em "Iniciar Transmissão" para alimentar o feed</span>
                  </div>
                )}
              </div>
            </div>

            {/* AUTOMATIC SCHEDULING (AGENDAMENTO AVANÇADO) */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-150 dark:border-slate-800">
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  Agendamento Automático (Smart Timers)
                </span>
                <span className="text-[8px] font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold uppercase">
                  Cron Engine
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Auto Start Timer */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 block">Início Automático em Breve</span>
                    <span className="text-[9px] text-slate-400">Inicia live automaticamente em {scheduleTimerSec}s</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={scheduleEnabled}
                    disabled={isLive}
                    onChange={(e) => { playSound.click(); setScheduleEnabled(e.target.checked); }}
                    className="w-4 h-4 text-purple-600 rounded cursor-pointer disabled:opacity-50"
                  />
                </div>

                {/* Auto End Timer */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 block">Fim Automático de Proteção</span>
                    <span className="text-[9px] text-slate-400">Fecha a live automaticamente após 3 minutos (180s)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoEndEnabled}
                    onChange={(e) => { playSound.click(); setAutoEndEnabled(e.target.checked); }}
                    className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                  />
                </div>

                {/* Auto Replay Save */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 block">Replay Automático pós Encerramento</span>
                    <span className="text-[9px] text-slate-400">Grava, codifica e publica replay de forma imediata ao fechar live</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoReplayEnabled}
                    onChange={(e) => { playSound.click(); setAutoReplayEnabled(e.target.checked); }}
                    className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* STREAMER ANALYTICS (MÉTRICAS DA LIVE) */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-150 dark:border-slate-800">
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-indigo-500" />
                  Analytics em Tempo Real (Live Analytics)
                </span>
                <span className="text-[9px] font-mono text-slate-400">MÉTRICA ATIVA</span>
              </div>

              {/* Grid indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850">
                  <span className="text-[8px] text-slate-400 block uppercase font-bold">Pico de Espectadores</span>
                  <span className="text-xs font-black font-mono text-slate-800 dark:text-white">
                    {isLive ? Math.max(...analyticsHistory).toLocaleString() : '1,100'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850">
                  <span className="text-[8px] text-slate-400 block uppercase font-bold">Inscritos Ganhos</span>
                  <span className="text-xs font-black font-mono text-purple-500">
                    +{streamSubscribersGained} subs
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850">
                  <span className="text-[8px] text-slate-400 block uppercase font-bold">Seguidores Ganhos</span>
                  <span className="text-xs font-black font-mono text-indigo-500">
                    +{streamFollowersGained} segs
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850">
                  <span className="text-[8px] text-slate-400 block uppercase font-bold">Engajamento de Chat</span>
                  <span className="text-xs font-black font-mono text-emerald-500">98.4%</span>
                </div>
              </div>

              {/* Simulated visual bar graph of viewer retention */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Histórico de Audiência (Retenção)</span>
                <div className="h-16 flex items-end gap-1 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-150 dark:border-slate-850">
                  {analyticsHistory.map((val, idx) => {
                    const maxVal = Math.max(...analyticsHistory) || 100;
                    const heightPercent = Math.max(10, Math.round((val / maxVal) * 100));
                    return (
                      <div 
                        key={idx}
                        className="flex-1 bg-indigo-500 rounded-t transition-all duration-500 hover:bg-indigo-400 relative group cursor-help"
                        style={{ height: `${heightPercent}%` }}
                      >
                        {/* Hover tooltip for metrics */}
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {val} spects
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* Right panel: Moderation Room and filters */}
          <div className="lg:col-span-3 space-y-5">
            
            {/* Live Chat Moderation settings */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4.5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-150 dark:border-slate-800">
                <Shield className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider font-sans">Sala de Moderação do Chat</span>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Slow Mode config */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Modo Lento (Delay entre Msgs)</label>
                  <select
                    value={slowModeDelay}
                    onChange={(e) => { playSound.click(); setSlowModeDelay(parseInt(e.target.value)); }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="0">Desativado (Sem limite)</option>
                    <option value="3">Modo Lento Suave (3s)</option>
                    <option value="5">Modo Lento Forte (5s)</option>
                    <option value="10">Modo Lento Máximo (10s)</option>
                  </select>
                </div>

                {/* Filters toggle */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 block">Filtro de Palavrões/Ofensas</span>
                    <span className="text-[9px] text-slate-400">Auto censura com asteriscos</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={badWordsFilter}
                    onChange={(e) => { playSound.click(); setBadWordsFilter(e.target.checked); }}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                </div>

                {/* Anti Spam block */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 block">Proteção Anti-Spam</span>
                    <span className="text-[9px] text-slate-400">Impede mensagens duplicadas rápidas</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={antiSpamActive}
                    onChange={(e) => { playSound.click(); setAntiSpamActive(e.target.checked); }}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Quick Poll Creator */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4.5 rounded-2xl shadow-sm space-y-3.5">
              <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                Criar Enquete no Chat
              </span>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  const question = target.question.value;
                  const opt1 = target.opt1.value;
                  const opt2 = target.opt2.value;
                  if (!question || !opt1 || !opt2) return;
                  handleCreatePoll(question, opt1, opt2);
                  target.reset();
                }}
                className="space-y-2.5 text-xs"
              >
                <div className="space-y-1">
                  <input 
                    name="question" 
                    placeholder="Pergunta da Enquete..." 
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-850 dark:text-slate-100"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    name="opt1" 
                    placeholder="Opção A" 
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-850 dark:text-slate-100"
                    required
                  />
                  <input 
                    name="opt2" 
                    placeholder="Opção B" 
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-850 dark:text-slate-100"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-[10px] uppercase font-black tracking-wider cursor-pointer"
                >
                  Publicar Enquete ⚡
                </button>
              </form>
            </div>

            {/* BANNED PLAYERS LIST */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4.5 rounded-2xl shadow-sm space-y-3">
              <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider block">
                Contas Bloqueadas / Banned ({bannedUsers.length})
              </span>

              <div className="space-y-1.5 max-h-[110px] overflow-y-auto scrollbar-thin">
                {bannedUsers.map(user => (
                  <div 
                    key={user}
                    className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase">{user}</span>
                    <button
                      onClick={() => handleUnbanUser(user)}
                      className="text-[9px] font-black text-indigo-500 hover:underline uppercase cursor-pointer"
                    >
                      Desbanir
                    </button>
                  </div>
                ))}

                {bannedUsers.length === 0 && (
                  <div className="text-center py-4 text-slate-400 text-[10px] font-bold uppercase">
                    Lista de bans vazia.
                  </div>
                )}
              </div>
            </div>

            {/* LIVE MODERATION LOGS */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4.5 rounded-2xl shadow-sm space-y-3">
              <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Histórico de Ações de Moderação (Logs)
              </span>

              <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-thin font-mono text-[10px]">
                {modLogs.map(log => (
                  <div 
                    key={log.id} 
                    className="p-2.5 bg-slate-900 border border-slate-850 rounded-xl text-slate-300 space-y-1 text-[9px]"
                  >
                    <div className="flex items-center justify-between text-slate-500 font-bold">
                      <span>[{log.timestamp}] {log.action}</span>
                      <span className="text-indigo-400">Target: {log.targetUser}</span>
                    </div>
                    <p className="font-sans text-slate-400 leading-normal">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: REPLAYS AND AUTOMATIC RECORDINGS STUDIO */}
      {activeMode === 'replays' && (
        <ReplayStudio 
          replays={replays}
          setReplays={setReplays}
          clips={clips}
          setClips={setClips}
          addNotification={addNotification}
        />
      )}

      {/* SHARE MODAL DIALOG POPUP */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-850 p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-150 dark:border-slate-800">
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white">
                Compartilhar Transmissão Ao Vivo
              </h3>
              <button 
                onClick={() => { playSound.click(); setShowShareModal(false); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Copie o link exclusivo de transmissão para convidar seus amigos e companheiros de equipe do ecossistema <strong className="text-indigo-500 uppercase">GameZon</strong> para assistirem com você.
            </p>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 font-mono text-xs text-slate-600 dark:text-slate-300">
              <span className="truncate">https://gamezon.live/stream/{activeChannel.broadcaster.toLowerCase()}</span>
              
              <button
                onClick={copyStreamLink}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 cursor-pointer shrink-0"
                title="Copiar Link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => { playSound.click(); setShowShareModal(false); }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold uppercase cursor-pointer border border-slate-200 dark:border-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
