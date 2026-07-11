import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Users, 
  Gamepad2, 
  MapPin, 
  Clock, 
  MessageSquare, 
  Tv, 
  Plus, 
  Check, 
  Activity, 
  Eye, 
  Send, 
  Sparkles, 
  Search, 
  AlertCircle, 
  UserPlus, 
  Volume2, 
  Sliders, 
  Flame, 
  ShieldAlert, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { playSound } from '../../utils/audio';

// All Presence statuses required
export type PresenceStatusType = 
  | 'jogando' 
  | 'assistindo' 
  | 'transmitindo' 
  | 'em-partida' 
  | 'no-menu' 
  | 'offline' 
  | 'ausente' 
  | 'dnd' 
  | 'online';

export interface PlayerPresence {
  id: string;
  name: string;
  avatarSeed: string;
  status: PresenceStatusType;
  gameName?: string;
  mapName?: string;
  gameMode?: string;
  playtimeSec: number;
  partyCurrent: number;
  partyMax: number;
  squadCode?: string;
  isStreamable?: boolean;
  level: number;
  xpProgress: number;
  bio: string;
  joinDate: string;
  achievements: { title: string; desc: string; icon: string }[];
}

const PRESET_FRIENDS: PlayerPresence[] = [
  {
    id: 'f-1',
    name: 'Lady_Gamer',
    avatarSeed: 'lady',
    status: 'transmitindo',
    gameName: 'Nave Espacial Arcade',
    mapName: 'Cinturão de Asteroides Zeta',
    gameMode: 'Frenesi Cooperativo',
    playtimeSec: 1450,
    partyCurrent: 2,
    partyMax: 4,
    squadCode: 'SQD-ARC-881',
    isStreamable: true,
    level: 42,
    xpProgress: 80,
    bio: 'Foco total no Top 10 Global! Streamer oficial GameZone.',
    joinDate: 'Janeiro 2026',
    achievements: [
      { title: 'Supernova', desc: 'Destruiu 10.000 meteoros', icon: '🌌' },
      { title: 'Lenda do Drift', desc: 'Fez 100 drifts sem bater', icon: '🏎️' }
    ]
  },
  {
    id: 'f-2',
    name: 'X-Sniper_Pro',
    avatarSeed: 'sniper',
    status: 'em-partida',
    gameName: 'Retro Speed Racer',
    mapName: 'Neo-Tokyo Neon',
    gameMode: 'Ranked 1v1 Arena',
    playtimeSec: 320,
    partyCurrent: 1,
    partyMax: 2,
    squadCode: 'SQD-RTR-102',
    isStreamable: false,
    level: 38,
    xpProgress: 45,
    bio: 'Mirando na sua cabeça. Se piscar, você perde.',
    joinDate: 'Março 2026',
    achievements: [
      { title: 'Olho de Águia', desc: 'Atingiu 50 acertos consecutivos', icon: '🎯' }
    ]
  },
  {
    id: 'f-3',
    name: 'Valkyrae_Pro',
    avatarSeed: 'rae',
    status: 'jogando',
    gameName: 'Space Raiders',
    mapName: 'Lobby de Sobrevivência',
    gameMode: 'Invasão Alienígena',
    playtimeSec: 2420,
    partyCurrent: 3,
    partyMax: 4,
    squadCode: 'SQD-SPC-990',
    isStreamable: false,
    level: 55,
    xpProgress: 92,
    bio: 'Só jogo pra ganhar. Parcerias por email.',
    joinDate: 'Novembro 2025',
    achievements: [
      { title: 'Soberano', desc: 'Venceu 5 campeonatos', icon: '🏆' },
      { title: 'Imortal', desc: 'Terminou o jogo sem morrer', icon: '💀' }
    ]
  },
  {
    id: 'f-4',
    name: 'Fallen_Angel',
    avatarSeed: 'angel',
    status: 'online',
    playtimeSec: 0,
    partyCurrent: 1,
    partyMax: 1,
    level: 15,
    xpProgress: 20,
    bio: 'Apenas relaxando no chat. Chame para jogar!',
    joinDate: 'Maio 2026',
    achievements: [
      { title: 'Calouro', desc: 'Completou o tutorial básico', icon: '🐣' }
    ]
  },
  {
    id: 'f-5',
    name: 'Mod_Z',
    avatarSeed: 'modz',
    status: 'no-menu',
    gameName: 'Nave Espacial Arcade',
    mapName: 'Menu de Seleção de Naves',
    gameMode: 'Solo Run Pro',
    playtimeSec: 180,
    partyCurrent: 1,
    partyMax: 4,
    squadCode: 'SQD-ARC-404',
    level: 29,
    xpProgress: 60,
    bio: 'Moderador oficial GameZone. Dúvidas? Mande DM.',
    joinDate: 'Dezembro 2025',
    achievements: [
      { title: 'Guardião', desc: 'Ajudou 500 jogadores no chat', icon: '🛡️' }
    ]
  },
  {
    id: 'f-6',
    name: 'Cyber_Samurai',
    avatarSeed: 'samurai',
    status: 'ausente',
    playtimeSec: 0,
    partyCurrent: 0,
    partyMax: 0,
    level: 22,
    xpProgress: 10,
    bio: 'AFK comendo pizza. Volto logo.',
    joinDate: 'Abril 2026',
    achievements: [
      { title: 'Aço Puro', desc: 'Desbloqueou espada lendária', icon: '⚔️' }
    ]
  },
  {
    id: 'f-7',
    name: 'Gamer_Premium',
    avatarSeed: 'premium',
    status: 'dnd',
    gameName: 'Football Pro 2026',
    mapName: 'Estádio Metropolitano',
    gameMode: 'Liga de Elite',
    playtimeSec: 5120,
    partyCurrent: 1,
    partyMax: 1,
    level: 60,
    xpProgress: 15,
    bio: 'Estudando táticas competitivas. Não perturbe.',
    joinDate: 'Setembro 2025',
    achievements: [
      { title: 'Artilheiro', desc: 'Fez 100 gols online', icon: '⚽' }
    ]
  },
  {
    id: 'f-8',
    name: 'Ghost_Rider',
    avatarSeed: 'ghost',
    status: 'offline',
    playtimeSec: 0,
    partyCurrent: 0,
    partyMax: 0,
    level: 18,
    xpProgress: 55,
    bio: 'Nos vemos no próximo reset. Desconectado.',
    joinDate: 'Fevereiro 2026',
    achievements: []
  },
  {
    id: 'f-9',
    name: 'Challenger_V8',
    avatarSeed: 'v8',
    status: 'assistindo',
    gameName: 'Live da Lady_Gamer',
    mapName: 'Lobby Principal do LiveHub',
    gameMode: 'Chat Assist',
    playtimeSec: 3600,
    partyCurrent: 1,
    partyMax: 1,
    level: 31,
    xpProgress: 75,
    bio: 'Fã de carteirinha dos melhores streamers da Arena.',
    joinDate: 'Janeiro 2026',
    achievements: [
      { title: 'Super Chat', desc: 'Enviou 100 mensagens em lives', icon: '🎙️' }
    ]
  }
];

export const PresenceTab: React.FC = () => {
  // User Personal Presence States
  const [myStatus, setMyStatus] = useState<PresenceStatusType>('online');
  const [myGame, setMyGame] = useState<string>('Nave Espacial Arcade');
  const [myMap, setMyMap] = useState<string>('Arena Principal');
  const [myMode, setMyMode] = useState<string>('Competitivo Solo');
  const [myPartyCurrent, setMyPartyCurrent] = useState<number>(1);
  const [myPartyMax, setMyPartyMax] = useState<number>(4);
  const [myPlaytime, setMyPlaytime] = useState<number>(120); // seconds elapsed
  const [isEditingMyStatus, setIsEditingMyStatus] = useState<boolean>(false);

  // Directory lists
  const [friends, setFriends] = useState<PlayerPresence[]>(PRESET_FRIENDS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'streams' | 'offline' | 'away'>('all');

  // Interactivity Modal/Overlay States
  const [selectedProfile, setSelectedProfile] = useState<PlayerPresence | null>(null);
  const [activeChatFriend, setActiveChatFriend] = useState<PlayerPresence | null>(null);
  const [chatHistories, setChatHistories] = useState<Record<string, { sender: string; text: string; time: string }[]>>({});
  const [chatInputText, setChatInputText] = useState<string>('');
  const [activeLiveStream, setActiveLiveStream] = useState<PlayerPresence | null>(null);
  const [streamChatLogs, setStreamChatLogs] = useState<{ user: string; text: string; isSub?: boolean }[]>([]);
  const [streamLikes, setStreamLikes] = useState<number>(342);

  // Custom UI notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Playtime ticking in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      // Tick my playtime
      setMyPlaytime(prev => prev + 1);

      // Tick playtimes for online active friends
      setFriends(prev => prev.map(f => {
        if (f.status !== 'offline' && f.status !== 'ausente' && f.playtimeSec > 0) {
          return { ...f, playtimeSec: f.playtimeSec + 1 };
        }
        return f;
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulating small organic changes in presence status in real-time
  useEffect(() => {
    const randomChanger = setInterval(() => {
      setFriends(prev => prev.map(f => {
        // Only simulate random activity for online folks occasionally
        if (f.status !== 'offline' && Math.random() > 0.85) {
          const potentialMaps = ['Cyber City Ruins', 'Neo-Tokyo Circuit', 'Vulkania Peak', 'Galáxia Perdida', 'Estádio Camp Nou', 'Deep Space Core'];
          const potentialModes = ['Aero Race Copa', 'Ranqueada 3v3', 'Sobrevivência Difícil', 'Custom Match 5v5', 'Campeonato Semanal'];
          
          let nextMap = f.mapName;
          let nextMode = f.gameMode;

          if (f.mapName) {
            nextMap = potentialMaps[Math.floor(Math.random() * potentialMaps.length)];
          }
          if (f.gameMode) {
            nextMode = potentialModes[Math.floor(Math.random() * potentialModes.length)];
          }

          // Random status switch (e.g., online <-> no-menu <-> jogando)
          let nextStatus = f.status;
          if (f.status === 'online' && Math.random() > 0.5) {
            nextStatus = 'no-menu';
            return {
              ...f,
              status: nextStatus,
              gameName: 'Retro Speed Racer',
              mapName: 'Lobby Principal',
              gameMode: 'Treino Livre',
              playtimeSec: 30
            };
          } else if (f.status === 'no-menu' && Math.random() > 0.5) {
            nextStatus = 'em-partida';
            return {
              ...f,
              status: nextStatus,
              mapName: 'Cyber Speedway',
              gameMode: 'Competitivo',
              playtimeSec: 10
            };
          }

          return {
            ...f,
            mapName: nextMap,
            gameMode: nextMode
          };
        }
        return f;
      }));
    }, 9000);

    return () => clearInterval(randomChanger);
  }, []);

  // Simulate active stream live chat scrolling
  useEffect(() => {
    if (!activeLiveStream) return;

    const mockStreamComments = [
      'MEU DEUS QUE JOGADA INSANA! 😱',
      'Lady_Gamer jogando o fino do fino hoje!',
      'Gostei muito dessa tática defensiva',
      'Dá pra passar sem perder vidas?',
      'Se bater o recorde eu mando sub VIP!',
      'GG WP demais!',
      'Alguém sabe qual é a nave dela?',
      'Manda salveeee pra galera de Sampa!',
      'Isso é nível internacional de jogo!',
      'Que reflexo absurdo nessas curvas!'
    ];

    const users = ['Ninja_Gamer', 'Chat_Arena', 'Valkyrae_Pro', 'Mod_Z', 'X-Sniper_Pro', 'Challenger_V8', 'Fallen_Angel'];

    const interval = setInterval(() => {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomText = mockStreamComments[Math.floor(Math.random() * mockStreamComments.length)];
      const isSub = Math.random() > 0.6;

      setStreamChatLogs(prev => [
        ...prev,
        { user: randomUser, text: randomText, isSub }
      ].slice(-10)); // Keep last 10 messages
    }, 2200);

    return () => clearInterval(interval);
  }, [activeLiveStream]);

  // Toast trigger helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Convert seconds to human readable clock string
  const formatTime = (totalSecs: number) => {
    if (!totalSecs || totalSecs <= 0) return '00:00';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  // Interactive Action Handlers
  const handleQuickInvite = (player: PlayerPresence) => {
    playSound.victory();
    triggerToast(`✉️ Convite de squad enviado com sucesso para ${player.name}!`);
    
    // Simulate auto-accept or feedback chat
    setTimeout(() => {
      setChatHistories(prev => {
        const current = prev[player.id] || [];
        return {
          ...prev,
          [player.id]: [
            ...current,
            { sender: player.name, text: 'Recebi seu convite! Deixa eu só terminar essa rodada e eu entro! 👍', time: new Date().toLocaleTimeString().slice(0, 5) }
          ]
        };
      });
    }, 4000);
  };

  const handleJoinParty = (player: PlayerPresence) => {
    if (!player.squadCode) {
      playSound.click();
      triggerToast(`⚠️ ${player.name} não está com um grupo público aberto.`);
      return;
    }

    playSound.jackpot();
    triggerToast(`🎉 Conectando ao Lobby de ${player.name} (${player.squadCode})...`);
    
    // Update local status to reflect group
    setMyStatus('em-partida');
    setMyGame(player.gameName || 'Jogo Co-op');
    setMyMap(player.mapName || 'Mapa Compartilhado');
    setMyMode(player.gameMode || 'Squad Battle');
    setMyPartyCurrent(player.partyCurrent + 1 > player.partyMax ? player.partyMax : player.partyCurrent + 1);
    setMyPartyMax(player.partyMax);
  };

  const handleWatchLive = (player: PlayerPresence) => {
    playSound.purchase();
    setActiveLiveStream(player);
    setStreamChatLogs([
      { user: 'Sistema', text: `Conectado à transmissão ao vivo de ${player.name}!` },
      { user: 'Mod_Z', text: 'Sejam bem-vindos! Deixem o like para apoiar a live.' }
    ]);
    setStreamLikes(Math.floor(Math.random() * 200) + 150);
  };

  const handleSendMessage = (player: PlayerPresence) => {
    playSound.click();
    setActiveChatFriend(player);
    if (!chatHistories[player.id]) {
      setChatHistories(prev => ({
        ...prev,
        [player.id]: [
          { sender: player.name, text: `Eai! Tudo bem? Estou marcado como [${player.status.toUpperCase()}].`, time: '11:40' }
        ]
      }));
    }
  };

  const handleSendChatMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !activeChatFriend) return;

    playSound.click();
    const friend = activeChatFriend;
    const userMessage = chatInputText.trim();
    const timeStr = new Date().toLocaleTimeString().slice(0, 5);

    setChatHistories(prev => {
      const history = prev[friend.id] || [];
      return {
        ...prev,
        [friend.id]: [...history, { sender: 'Você', text: userMessage, time: timeStr }]
      };
    });
    setChatInputText('');

    // Simulated Smart gaming-platform reply engine based on friend's status!
    setTimeout(() => {
      playSound.collect();
      let replyText = 'Opa! Beleza.';

      if (friend.status === 'dnd') {
        replyText = 'Estou no modo "Não Perturbe" estudando táticas competitivas. Respondo assim que terminar a partida! 🤫🛡️';
      } else if (friend.status === 'jogando' || friend.status === 'em-partida') {
        replyText = `Tô no meio de uma partida tensa no ${friend.gameName} (${friend.mapName})! Tempo jogado: ${formatTime(friend.playtimeSec)}. Te chamo assim que acabar o round! 🎮🔥`;
      } else if (friend.status === 'transmitindo') {
        replyText = `Estou transmitindo ao vivo agora! Mandei sua mensagem pro chat. Clica em "Assistir Live" pra acompanhar as jogadas! 🎙️🚀`;
      } else if (friend.status === 'ausente') {
        replyText = 'Estou ausente (AFK) no momento. Responderei assim que estiver de volta no teclado! 🍕';
      } else if (friend.status === 'offline') {
        replyText = '*(Mensagem enviada com sucesso. Usuário offline receberá uma notificação ao fazer login)*';
      } else {
        replyText = 'Bora fechar um squad hoje? O lobby tá aberto, só clicar em "Entrar na Party"! 🏆';
      }

      setChatHistories(prev => {
        const history = prev[friend.id] || [];
        return {
          ...prev,
          [friend.id]: [...history, { sender: friend.name, text: replyText, time: new Date().toLocaleTimeString().slice(0, 5) }]
        };
      });
    }, 1500);
  };

  const getStatusColorAndLabel = (status: PresenceStatusType) => {
    switch (status) {
      case 'jogando':
        return { dot: 'bg-rose-500 shadow-rose-500/50', text: 'text-rose-500 font-black', bg: 'bg-rose-500/10 border-rose-500/30', label: 'Jogando' };
      case 'assistindo':
        return { dot: 'bg-indigo-400 shadow-indigo-400/50', text: 'text-indigo-400 font-bold', bg: 'bg-indigo-500/10 border-indigo-500/20', label: 'Assistindo Live' };
      case 'transmitindo':
        return { dot: 'bg-purple-500 animate-pulse shadow-purple-500/50', text: 'text-purple-400 font-black tracking-wide', bg: 'bg-purple-500/15 border-purple-500/30', label: 'Transmitindo 🎙️' };
      case 'em-partida':
        return { dot: 'bg-red-600 animate-pulse shadow-red-600/50', text: 'text-red-500 font-black', bg: 'bg-red-600/10 border-red-600/30', label: 'Em Partida ⚔️' };
      case 'no-menu':
        return { dot: 'bg-cyan-400 shadow-cyan-400/50', text: 'text-cyan-400 font-semibold', bg: 'bg-cyan-500/10 border-cyan-500/20', label: 'No Menu' };
      case 'ausente':
        return { dot: 'bg-amber-500 shadow-amber-500/50', text: 'text-amber-500 font-bold', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Ausente (AFK)' };
      case 'dnd':
        return { dot: 'bg-rose-600 shadow-rose-600/50', text: 'text-rose-600 font-bold', bg: 'bg-rose-600/10 border-rose-600/20', label: 'Não Perturbe (DND)' };
      case 'online':
        return { dot: 'bg-emerald-400 shadow-emerald-400/50', text: 'text-emerald-400 font-bold', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Online' };
      case 'offline':
      default:
        return { dot: 'bg-slate-500 shadow-slate-500/40', text: 'text-slate-500 font-medium', bg: 'bg-slate-500/5 border-slate-500/20', label: 'Offline' };
    }
  };

  // Filter & Search Friends
  const filteredFriends = friends.filter(friend => {
    const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (friend.gameName && friend.gameName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (filterType === 'active') {
      return friend.status === 'jogando' || friend.status === 'em-partida' || friend.status === 'no-menu';
    }
    if (filterType === 'streams') {
      return friend.status === 'transmitindo';
    }
    if (filterType === 'away') {
      return friend.status === 'ausente' || friend.status === 'dnd';
    }
    if (filterType === 'offline') {
      return friend.status === 'offline';
    }
    return true; // 'all'
  });

  const getStatusSummaryCount = (statusGroup: 'all' | 'online' | 'playing' | 'streams') => {
    if (statusGroup === 'all') return friends.length;
    if (statusGroup === 'online') return friends.filter(f => f.status !== 'offline').length;
    if (statusGroup === 'playing') return friends.filter(f => f.status === 'jogando' || f.status === 'em-partida').length;
    if (statusGroup === 'streams') return friends.filter(f => f.status === 'transmitindo').length;
    return 0;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-4 z-[99] max-w-sm w-full p-4 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl shadow-indigo-950/40 flex items-center gap-3 backdrop-blur-md bg-slate-900/95"
          >
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <p className="text-xs font-black tracking-wide leading-relaxed">{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Your Status Command & Statistics */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* USER MAIN PRESENCE CONTROLLER */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4.5 h-4.5 text-indigo-500" />
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Meu Status de Presença
                </h3>
              </div>
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${getStatusColorAndLabel(myStatus).dot}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${getStatusColorAndLabel(myStatus).dot}`} />
              </span>
            </div>

            {/* Current Active Presence Display */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/70 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-base font-black uppercase ring-4 ring-indigo-500/10">
                  VC
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-850 dark:text-slate-100">Você (Challenger)</span>
                    <span className="text-[9px] bg-indigo-500 text-white font-black px-1.5 py-0.5 rounded uppercase">LVL 45</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-bold ${getStatusColorAndLabel(myStatus).text}`}>
                      {getStatusColorAndLabel(myStatus).label}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Tempo: {formatTime(myPlaytime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rich Presence Sub-details */}
              {(myStatus === 'jogando' || myStatus === 'em-partida' || myStatus === 'transmitindo' || myStatus === 'no-menu') && (
                <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/80 space-y-2 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-slate-500 font-bold">Jogo:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold">{myGame}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="text-slate-500 font-bold">Mapa:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{myMap}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-slate-500 font-bold">Modo:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{myMode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-slate-500 font-bold">Grupo:</span>
                    <span className="text-slate-850 dark:text-slate-200 font-bold">Squad ({myPartyCurrent}/{myPartyMax})</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Status Modifiers */}
            <div className="space-y-4">
              <button
                onClick={() => { playSound.click(); setIsEditingMyStatus(!isEditingMyStatus); }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-indigo-500/10"
              >
                <Sliders className="w-4 h-4" />
                {isEditingMyStatus ? 'Fechar Customizador' : 'Alterar Minha Presença'}
              </button>

              <AnimatePresence>
                {isEditingMyStatus && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-4 pt-1"
                  >
                    {/* Status Type Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Estado do Perfil</label>
                      <select
                        value={myStatus}
                        onChange={(e) => { playSound.click(); setMyStatus(e.target.value as PresenceStatusType); }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="online">🟢 Online</option>
                        <option value="jogando">🔴 Jogando Game</option>
                        <option value="em-partida">⚔️ Em partida Competitiva</option>
                        <option value="transmitindo">🎙️ Transmitindo ao Vivo</option>
                        <option value="no-menu">📱 No Menu / Lobby</option>
                        <option value="ausente">🟡 Ausente (AFK)</option>
                        <option value="dnd">⛔ Não Perturbe</option>
                        <option value="offline">⚪ Offline / Invisível</option>
                      </select>
                    </div>

                    {/* Rich Presence Fields */}
                    {(myStatus === 'jogando' || myStatus === 'em-partida' || myStatus === 'transmitindo' || myStatus === 'no-menu') && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="space-y-3.5 border-t border-slate-100 dark:border-slate-900 pt-3"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Nome do Jogo</label>
                          <select
                            value={myGame}
                            onChange={(e) => setMyGame(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Nave Espacial Arcade">Nave Espacial Arcade</option>
                            <option value="Retro Speed Racer">Retro Speed Racer</option>
                            <option value="Space Raiders">Space Raiders</option>
                            <option value="Football Pro 2026">Football Pro 2026</option>
                            <option value="Aviator Blast">Aviator Blast</option>
                            <option value="Lobby Chat Lounge">Lobby Chat Lounge</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Mapa Atual</label>
                          <input
                            type="text"
                            value={myMap}
                            onChange={(e) => setMyMap(e.target.value)}
                            placeholder="Ex: Cinturão Zeta, Neo-Tokyo"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Modo de Jogo</label>
                          <input
                            type="text"
                            value={myMode}
                            onChange={(e) => setMyMode(e.target.value)}
                            placeholder="Ex: Ranqueada Solo, Treinamento"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Membros Grupo</label>
                            <input
                              type="number"
                              min="1"
                              max={myPartyMax}
                              value={myPartyCurrent}
                              onChange={(e) => setMyPartyCurrent(parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Grupo Máximo</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={myPartyMax}
                              onChange={(e) => setMyPartyMax(parseInt(e.target.value) || 4)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <button
                      onClick={() => {
                        playSound.purchase();
                        setIsEditingMyStatus(false);
                        triggerToast('💾 Status de Presença Atualizado com sucesso!');
                      }}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer shadow-sm transition-all"
                    >
                      Salvar &amp; Aplicar Status
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* PRESENCE STATISTICS OVERVIEW */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
              Diretório da Comunidade
            </h4>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-center space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Online / Ativos</span>
                <div className="text-xl font-black text-emerald-400 font-mono">
                  {getStatusSummaryCount('online')}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-center space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Em Gameplay</span>
                <div className="text-xl font-black text-rose-500 font-mono">
                  {getStatusSummaryCount('playing')}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-center space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Transmissões</span>
                <div className="text-xl font-black text-purple-400 font-mono">
                  {getStatusSummaryCount('streams')}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-center space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Total Amigos</span>
                <div className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono">
                  {getStatusSummaryCount('all')}
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/40 rounded-xl flex items-start gap-2.5">
              <Info className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[10.5px] text-indigo-700 dark:text-indigo-400 leading-relaxed font-semibold">
                Sincronização em tempo real ativa. Status e playtimes de amigos são atualizados dinamicamente a cada segundo com latência ultra baixa.
              </p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Friend Directory Grid */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* SEARCH & FILTERS CONTROLLER HEADER */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar amigo ou jogo atual..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Switches */}
            <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto justify-start md:justify-end">
              <button
                onClick={() => { playSound.click(); setFilterType('all'); }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white font-black'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100'
                }`}
              >
                Todos ({friends.length})
              </button>

              <button
                onClick={() => { playSound.click(); setFilterType('active'); }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                  filterType === 'active'
                    ? 'bg-rose-500 text-white font-black'
                    : 'bg-slate-50 dark:bg-slate-900 text-rose-500 hover:bg-slate-100'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                Em Gameplay
              </button>

              <button
                onClick={() => { playSound.click(); setFilterType('streams'); }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                  filterType === 'streams'
                    ? 'bg-purple-600 text-white font-black'
                    : 'bg-slate-50 dark:bg-slate-900 text-purple-400 hover:bg-slate-100'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                Lives
              </button>

              <button
                onClick={() => { playSound.click(); setFilterType('away'); }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                  filterType === 'away'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-50 dark:bg-slate-900 text-amber-500 hover:bg-slate-100'
                }`}
              >
                Ausente/DND
              </button>

              <button
                onClick={() => { playSound.click(); setFilterType('offline'); }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                  filterType === 'offline'
                    ? 'bg-slate-500 text-white font-black'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100'
                }`}
              >
                Offline
              </button>
            </div>
          </div>

          {/* MAIN FRIENDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredFriends.length > 0 ? (
                filteredFriends.map((friend) => {
                  const statusInfo = getStatusColorAndLabel(friend.status);
                  return (
                    <motion.div
                      key={friend.id}
                      layoutId={`friend-card-${friend.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl shadow-sm flex flex-col justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-750"
                    >
                      
                      {/* Top Row: User Avatar and Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative cursor-pointer" onClick={() => setSelectedProfile(friend)}>
                            <div className="w-11 h-11 bg-gradient-to-tr from-slate-100 to-indigo-50 dark:from-slate-900 dark:to-slate-800 rounded-xl flex items-center justify-center text-slate-800 dark:text-white text-base font-black uppercase border border-slate-200 dark:border-slate-800 ring-2 ring-transparent hover:ring-indigo-500/40 transition-all">
                              {friend.name.charAt(0)}
                            </div>
                            <span className={`absolute -bottom-1 -right-1 flex h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-950 ${statusInfo.dot}`} />
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span 
                                onClick={() => setSelectedProfile(friend)}
                                className="text-xs font-black text-slate-850 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                              >
                                {friend.name}
                              </span>
                              <span className="text-[8px] bg-slate-100 dark:bg-slate-900 text-slate-500 px-1 py-0.5 rounded font-black">
                                LVL {friend.level}
                              </span>
                            </div>
                            <div className={`text-[10px] mt-0.5 px-2 py-0.5 rounded-md inline-block ${statusInfo.bg} ${statusInfo.text}`}>
                              {statusInfo.label}
                            </div>
                          </div>
                        </div>

                        {/* Quick View Profile shortcut */}
                        <button
                          onClick={() => { playSound.click(); setSelectedProfile(friend); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors"
                          title="Ver Perfil"
                        >
                          <User className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Middle Area: Rich Presence Context Details */}
                      {(friend.status !== 'offline' && friend.status !== 'ausente' && friend.gameName) ? (
                        <div className="p-3 bg-slate-50/70 dark:bg-slate-900/50 rounded-xl space-y-1.5 border border-slate-150 dark:border-slate-800/60">
                          <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-800 dark:text-slate-200">
                            <Gamepad2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>{friend.gameName}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                              <span className="truncate">{friend.mapName || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1 truncate">
                              <Activity className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate">{friend.gameMode || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1 col-span-2 mt-0.5 text-indigo-600 dark:text-indigo-400 font-mono">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>Tempo jogado: {formatTime(friend.playtimeSec)}</span>
                            </div>
                          </div>

                          {friend.squadCode && (
                            <div className="flex items-center justify-between text-[9px] pt-1.5 border-t border-slate-150 dark:border-slate-800/80 mt-1">
                              <span className="text-slate-400 font-bold uppercase">Grupo: Squad ({friend.partyCurrent}/{friend.partyMax})</span>
                              <span className="font-mono font-bold bg-indigo-50 dark:bg-indigo-950 px-1 py-0.2 rounded text-indigo-500 border border-indigo-100 dark:border-indigo-900">{friend.squadCode}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-[74px] flex items-center justify-center border border-dashed border-slate-150 dark:border-slate-850 rounded-xl text-center p-3 text-[10px] text-slate-400 italic">
                          {friend.status === 'offline' 
                            ? 'Este jogador está desconectado no momento.' 
                            : friend.status === 'ausente'
                            ? `Ausente. Nenhuma atividade rica detectada.`
                            : `Online. Nenhuma atividade rica no momento.`
                          }
                        </div>
                      )}

                      {/* Bottom Row: Direct Action Button Grid */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        
                        {/* Action 1: Invite or Join */}
                        {friend.status !== 'offline' && friend.squadCode ? (
                          <button
                            onClick={() => handleJoinParty(friend)}
                            className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-150 dark:bg-indigo-950/40 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="Entrar no lobby de squad"
                          >
                            <Users className="w-3 h-3" />
                            Entrar Party
                          </button>
                        ) : (
                          <button
                            disabled={friend.status === 'offline'}
                            onClick={() => handleQuickInvite(friend)}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-colors ${
                              friend.status === 'offline'
                                ? 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700 cursor-not-allowed border border-transparent'
                                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 cursor-pointer'
                            }`}
                            title="Convidar para seu squad"
                          >
                            <UserPlus className="w-3 h-3" />
                            Convite Rápido
                          </button>
                        )}

                        {/* Action 2: Watch Live (if streamable) */}
                        {friend.isStreamable ? (
                          <button
                            onClick={() => handleWatchLive(friend)}
                            className="px-2.5 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-colors cursor-pointer animate-pulse"
                            title="Assistir Transmissão Ao Vivo"
                          >
                            <Tv className="w-3 h-3 text-white" />
                            Assistir Live
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1 border border-transparent cursor-not-allowed"
                            title="Nenhuma live ativa no momento"
                          >
                            <Tv className="w-3 h-3" />
                            Assistir Live
                          </button>
                        )}

                        {/* Action 3: Send DM */}
                        <button
                          onClick={() => handleSendMessage(friend)}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Iniciar Conversa Direta"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Mensagem
                        </button>

                      </div>

                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-2 py-12 text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-3xl space-y-3">
                  <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Nenhum piloto encontrado</h5>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Tente ajustar os filtros ou digitar outro termo na barra de buscas rápida.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* MODAL 1: VIEW PROFILE COMPONENT */}
      <AnimatePresence>
        {selectedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Colored ambient glow */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider">
                  Perfil de Arena Corporativo
                </h4>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-6 space-y-5">
                
                {/* Header Avatar and Basic Status */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black">
                      {selectedProfile.name.charAt(0)}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-4.5 h-4.5 rounded-full border-3 border-white dark:border-slate-950 ${getStatusColorAndLabel(selectedProfile.status).dot}`} />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      {selectedProfile.name}
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-black border border-indigo-200 dark:border-indigo-900">
                        Nível {selectedProfile.level}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Registrado desde {selectedProfile.joinDate}</p>
                    <div className="text-[11px] font-bold text-slate-500">
                      Estado atual: <span className={getStatusColorAndLabel(selectedProfile.status).text}>{getStatusColorAndLabel(selectedProfile.status).label}</span>
                    </div>
                  </div>
                </div>

                {/* Level Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>XP Progress</span>
                    <span>{selectedProfile.xpProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600" style={{ width: `${selectedProfile.xpProgress}%` }} />
                  </div>
                </div>

                {/* Bio text */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">Biografia</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                    "{selectedProfile.bio || 'Sem biografia definida.'}"
                  </p>
                </div>

                {/* Achievements block */}
                {selectedProfile.achievements && selectedProfile.achievements.length > 0 && (
                  <div className="space-y-2.5">
                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Conquistas Desbloqueadas</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProfile.achievements.map((ach, idx) => (
                        <div key={idx} className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl flex items-center gap-2">
                          <span className="text-xl">{ach.icon}</span>
                          <div>
                            <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 block">{ach.title}</span>
                            <span className="text-[8px] text-slate-500 block leading-tight">{ach.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Presence Live Activity Details */}
                {selectedProfile.gameName && (
                  <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-indigo-500/20 space-y-1.5 shadow-md">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Atividade em Andamento (Rich Presence)</span>
                    <div className="text-xs font-black flex items-center gap-1.5 text-white">
                      <Gamepad2 className="w-4 h-4 text-rose-500" />
                      <span>{selectedProfile.gameName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-0.5 pl-5">
                      <div>Mapa: <span className="text-slate-200 font-bold">{selectedProfile.mapName}</span></div>
                      <div>Modo: <span className="text-slate-200 font-bold">{selectedProfile.gameMode}</span></div>
                      <div>Tempo de Partida: <span className="text-indigo-400 font-mono font-bold">{formatTime(selectedProfile.playtimeSec)}</span></div>
                    </div>
                  </div>
                )}

                {/* Dynamic Actions inside Profile */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => { setSelectedProfile(null); handleSendMessage(selectedProfile); }}
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Enviar Mensagem
                  </button>
                  {selectedProfile.squadCode && (
                    <button
                      onClick={() => { setSelectedProfile(null); handleJoinParty(selectedProfile); }}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      Entrar na Party
                    </button>
                  )}
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: INTERACTIVE ACTIVE CHAT BOX OVERLAY */}
      <AnimatePresence>
        {activeChatFriend && (
          <div className="fixed bottom-6 left-6 md:left-auto md:right-80 z-40 w-80 md:w-96">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col justify-between h-[420px] overflow-hidden"
            >
              
              {/* Chat Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-black">
                      {activeChatFriend.name.charAt(0)}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-950 ${getStatusColorAndLabel(activeChatFriend.status).dot}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black">{activeChatFriend.name}</h4>
                    <span className="text-[9px] text-slate-400 capitalize">Modo: {getStatusColorAndLabel(activeChatFriend.status).label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { playSound.click(); setSelectedProfile(activeChatFriend); }}
                    className="p-1 text-slate-400 hover:text-white rounded"
                    title="Ver Perfil Completo"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveChatFriend(null)}
                    className="p-1 text-slate-400 hover:text-white rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Chat Message Scrollable Container */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin bg-slate-50 dark:bg-slate-950">
                {(chatHistories[activeChatFriend.id] || []).map((msg, idx) => {
                  const isMe = msg.sender === 'Você';
                  return (
                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed font-semibold shadow-sm ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-850'
                      }`}>
                        <p>{msg.text}</p>
                      </div>
                      <span className="text-[8px] text-slate-400 font-mono mt-0.5 px-1">{msg.time}</span>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar Form */}
              <form onSubmit={handleSendChatMessageSubmit} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder={`Mandar mensagem para ${activeChatFriend.name}...`}
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: FLOATING INTERACTIVE LIVE STREAM SIMULATOR */}
      <AnimatePresence>
        {activeLiveStream && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 text-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[550px]"
            >
              
              {/* Stream Video Player Simulation (Left Side) */}
              <div className="flex-1 bg-black relative flex flex-col justify-between p-4">
                
                {/* Header indicators */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black uppercase rounded animate-pulse">AO VIVO</span>
                    <span className="text-xs font-bold text-slate-300 bg-black/60 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      {activeLiveStream.partyCurrent * 534} assistindo
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveLiveStream(null)}
                    className="p-1.5 bg-black/60 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white cursor-pointer md:hidden"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Central Canvas Screen representation */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/30 via-indigo-900/10 to-transparent animate-pulse" />
                  
                  {/* Virtual Game Screen visual elements */}
                  <div className="w-48 h-32 border-2 border-indigo-500/30 rounded-2xl flex flex-col items-center justify-center bg-indigo-950/20 p-4 space-y-2 animate-bounce shadow-xl">
                    <Gamepad2 className="w-10 h-10 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="text-[11px] font-mono font-black text-center text-indigo-300">STREAMING GAMEPLAY</span>
                    <span className="text-[9px] text-slate-400 font-bold">{activeLiveStream.gameName}</span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="z-10 bg-black/60 p-3 rounded-2xl backdrop-blur-sm border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black">{activeLiveStream.name} - {activeLiveStream.gameName}</h3>
                      <p className="text-[10px] text-slate-400 font-bold">{activeLiveStream.mapName} ({activeLiveStream.gameMode})</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { playSound.click(); setStreamLikes(l => l + 1); }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                      >
                        👍 Like ({streamLikes})
                      </button>
                      <button
                        onClick={() => { playSound.victory(); triggerToast('🎉 Inscrição VIP ativa enviada!'); }}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-[10px] font-black uppercase cursor-pointer"
                      >
                        Inscrever-se VIP
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Live Chat stream simulation (Right Side) */}
              <div className="w-full md:w-80 bg-slate-950 border-l border-slate-800 flex flex-col justify-between h-[200px] md:h-auto">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-purple-400 tracking-widest">Chat do Streamer</span>
                  <button
                    onClick={() => setActiveLiveStream(null)}
                    className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-white cursor-pointer hidden md:block"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Chat Message Lists */}
                <div className="flex-1 p-4 overflow-y-auto space-y-2 scrollbar-thin font-sans text-[11px]">
                  {streamChatLogs.map((msg, idx) => (
                    <div key={idx} className="leading-relaxed">
                      <span className={`font-mono font-black mr-1.5 ${
                        msg.isSub ? 'text-purple-400' : 'text-slate-400'
                      }`}>
                        {msg.isSub && '👑 '}{msg.user}:
                      </span>
                      <span className="text-slate-300 font-medium">{msg.text}</span>
                    </div>
                  ))}
                </div>

                {/* Quick Chat interaction form inside Stream */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const inputEl = e.currentTarget.elements.namedItem('chatMsg') as HTMLInputElement;
                    if (!inputEl || !inputEl.value.trim()) return;

                    playSound.click();
                    setStreamChatLogs(prev => [
                      ...prev,
                      { user: 'Você', text: inputEl.value.trim(), isSub: true }
                    ]);
                    inputEl.value = '';
                  }}
                  className="p-3 border-t border-slate-800 flex gap-2"
                >
                  <input
                    name="chatMsg"
                    type="text"
                    placeholder="Mande uma mensagem no chat..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] focus:outline-none focus:ring-1 focus:ring-purple-500 text-white font-medium"
                  />
                  <button
                    type="submit"
                    className="px-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-[10px] font-black uppercase cursor-pointer"
                  >
                    Mandar
                  </button>
                </form>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
