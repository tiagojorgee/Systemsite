import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Gamepad2, 
  Play, 
  UserCheck, 
  Users, 
  Activity, 
  RefreshCw, 
  Swords, 
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Award,
  Calendar,
  Search,
  Plus,
  Tv,
  History,
  Video,
  Volume2,
  ThumbsUp,
  Check,
  X,
  PlusCircle,
  Eye,
  Shield,
  User,
  Sliders,
  Star,
  FileText,
  Info,
  BarChart3,
  TrendingUp,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { playSound } from '../../utils/audio';

// --- DATA STRUCTURE DEFINITIONS ---

interface RewardSet {
  coins: number;
  xp: number;
  badge: string;
  item: string;
}

interface Tournament {
  id: string;
  name: string;
  type: 'official' | 'community' | 'private' | 'public' | 'special';
  game: string;
  fee: number;
  status: 'registration' | 'active' | 'finished';
  teamSize: number;
  teamsRegistered: number;
  maxTeams: number;
  rewards: RewardSet;
  isRegistered: boolean;
  moderator: string;
  referee: string;
  date: string;
  time: string;
  description: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: 'leader' | 'player';
  level: number;
  badge: string;
  item: string;
  status: 'online' | 'offline' | 'playing';
}

interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  logoSeed: string;
  wins: number;
  losses: number;
  rankPoints: number;
}

interface BracketMatch {
  id: string;
  tournamentId: string;
  round: number; // 1 = Quartas, 2 = Semifinais, 3 = Final
  matchNum: number; // index within round
  team1Name: string;
  team2Name: string;
  score1?: number;
  score2?: number;
  winner?: string;
  status: 'scheduled' | 'live' | 'finished';
  referee: string;
  disputed?: boolean;
  disputeReason?: string;
  time: string;
}

interface AgendaEvent {
  id: string;
  time: string;
  title: string;
  game: string;
  type: 'match' | 'deadline' | 'ceremony';
  referee: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  winRate: string;
  played: number;
  badgesCount: number;
}

interface LiveChatMsg {
  id: string;
  user: string;
  text: string;
  time: string;
  isVip?: boolean;
}

interface SavedReplay {
  id: string;
  title: string;
  duration: string;
  views: number;
  rating: number;
  userRating?: number;
  game: string;
  date: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  type: 'system' | 'registration' | 'referee' | 'payout' | 'anti_cheat';
  actor: string;
  action: string;
  details: string;
}

interface TournamentTabProps {
  playerCoins: number;
  addCoins: (amount: number) => void;
  playerLevel: number;
  addPoints: (amount: number) => void;
}

// --- SEED/PRESET DATA ---

const PRESET_TOURNAMENTS: Tournament[] = [
  {
    id: 't-oficial-1',
    name: 'Copa Suprema Gamezon',
    type: 'official',
    game: 'Naves Espaciais Retro',
    fee: 100,
    status: 'active',
    teamSize: 3,
    teamsRegistered: 8,
    maxTeams: 8,
    rewards: {
      coins: 1200,
      xp: 600,
      badge: 'Campeão Supremo 🏆',
      item: 'Canhão de Plasma Lendário ⚡'
    },
    isRegistered: true,
    moderator: 'Carlos_Mod_GP',
    referee: 'Juiz_Robo_Ref',
    date: 'Hoje',
    time: '20:00',
    description: 'O campeonato oficial de maior prestígio do Gamezon. Confronte os melhores pilotos do ranking global.'
  },
  {
    id: 't-comunidade-1',
    name: 'Masters do Bairro (Comunidade)',
    type: 'community',
    game: 'Arena Combat 2D',
    fee: 25,
    status: 'registration',
    teamSize: 3,
    teamsRegistered: 4,
    maxTeams: 8,
    rewards: {
      coins: 400,
      xp: 200,
      badge: 'Veterano Comunitário 🎖️',
      item: 'Skin Protetora Épica 🛡️'
    },
    isRegistered: false,
    moderator: 'Gamer_Do_Povo',
    referee: 'Arbitro_Voluntario',
    date: 'Amanhã',
    time: '18:00',
    description: 'Torneio amador promovido pela comunidade de combatentes. Ideal para praticar e conseguir moedas extras.'
  },
  {
    id: 't-privado-1',
    name: 'Campeonato Secreto VIP',
    type: 'private',
    game: 'Velocidade Extrema Grid',
    fee: 75,
    status: 'registration',
    teamSize: 3,
    teamsRegistered: 2,
    maxTeams: 8,
    rewards: {
      coins: 900,
      xp: 450,
      badge: 'Gamer Elite VIP 💎',
      item: 'Propulsor Quântico Nitro 🚀'
    },
    isRegistered: false,
    moderator: 'Don_Corleone_Gamer',
    referee: 'Arbitro_VIP_Voz',
    date: '14 de Julho',
    time: '22:00',
    description: 'Um campeonato fechado de alta velocidade. Requer convite de clãs patrocinadores para a inscrição formal.'
  },
  {
    id: 't-publico-1',
    name: 'Arena Aberta Aberta',
    type: 'public',
    game: 'Batalha RPG Pixel',
    fee: 0,
    status: 'finished',
    teamSize: 1,
    teamsRegistered: 8,
    maxTeams: 8,
    rewards: {
      coins: 200,
      xp: 100,
      badge: 'Sobrevivente Da Arena 💀',
      item: 'Espada Básica de Ferro ⚔️'
    },
    isRegistered: false,
    moderator: 'Mod_System_Srv',
    referee: 'Auto_Ref_Engine',
    date: 'Ontem',
    time: '15:00',
    description: 'Lobby aberto sem custos de moedas. Inscrições automáticas para novatos testarem táticas.'
  },
  {
    id: 't-especial-1',
    name: 'Grande Evento Interestelar',
    type: 'special',
    game: 'Galaxy Conquest Elite',
    fee: 150,
    status: 'registration',
    teamSize: 3,
    teamsRegistered: 6,
    maxTeams: 8,
    rewards: {
      coins: 2500,
      xp: 1200,
      badge: 'Monarca do Espaço 🌌',
      item: 'Nave Lendária Gold Sentinel 🛸'
    },
    isRegistered: false,
    moderator: 'Lider_Do_Sindicato',
    referee: 'Juiz_Estelar_Omega',
    date: '18 de Julho',
    time: '19:00',
    description: 'Evento sazonal épico promovido pelos administradores globais. Prêmios gigantescos e audiência global via LiveStream.'
  }
];

const PRESET_MATCHES: BracketMatch[] = [
  // ROUND 1 - Quarterfinals (Quartas)
  { id: 'm-1', tournamentId: 't-oficial-1', round: 1, matchNum: 1, team1Name: 'Gladiadores Gamezone', team2Name: 'Team Apex Predators', score1: 16, score2: 12, winner: 'Gladiadores Gamezone', status: 'finished', referee: 'Juiz_Robo_Ref', time: '12:00' },
  { id: 'm-2', tournamentId: 't-oficial-1', round: 1, matchNum: 2, team1Name: 'Ninjas do Teclado', team2Name: 'Valkyries Esports', score1: 14, score2: 16, winner: 'Valkyries Esports', status: 'finished', referee: 'Juiz_Robo_Ref', time: '12:40' },
  { id: 'm-3', tournamentId: 't-oficial-1', round: 1, matchNum: 3, team1Name: 'Zeus Thunderbolts', team2Name: 'Shroud Legion', score1: 16, score2: 8, winner: 'Zeus Thunderbolts', status: 'finished', referee: 'Carlos_Mod_GP', time: '13:20' },
  { id: 'm-4', tournamentId: 't-oficial-1', round: 1, matchNum: 4, team1Name: 'Cyber Samurai Squad', team2Name: 'Challenger Alliance', score1: 10, score2: 16, winner: 'Challenger Alliance', status: 'finished', referee: 'Carlos_Mod_GP', time: '14:00' },

  // ROUND 2 - Semifinals (Semifinais)
  { id: 'm-5', tournamentId: 't-oficial-1', round: 2, matchNum: 1, team1Name: 'Gladiadores Gamezone', team2Name: 'Valkyries Esports', status: 'live', referee: 'Juiz_Robo_Ref', time: '18:30' },
  { id: 'm-6', tournamentId: 't-oficial-1', round: 2, matchNum: 2, team1Name: 'Zeus Thunderbolts', team2Name: 'Challenger Alliance', status: 'scheduled', referee: 'Carlos_Mod_GP', time: '19:15' },

  // ROUND 3 - Finals (Final)
  { id: 'm-7', tournamentId: 't-oficial-1', round: 3, matchNum: 1, team1Name: 'TBD', team2Name: 'TBD', status: 'scheduled', referee: 'Juiz_Robo_Ref', time: '20:30' }
];

const PRESET_AGENDA: AgendaEvent[] = [
  { id: 'a-1', time: '18:30 - Hoje', title: 'Semifinal 1: Gladiadores vs Valkyries', game: 'Naves Espaciais Retro', type: 'match', referee: 'Juiz_Robo_Ref' },
  { id: 'a-2', time: '19:15 - Hoje', title: 'Semifinal 2: Zeus vs Challenger Alliance', game: 'Naves Espaciais Retro', type: 'match', referee: 'Carlos_Mod_GP' },
  { id: 'a-3', time: '20:00 - Hoje', title: 'Limite de Inscrição: Masters do Bairro', game: 'Arena Combat 2D', type: 'deadline', referee: 'Gamer_Do_Povo' },
  { id: 'a-4', time: '20:30 - Hoje', title: 'Grande Final: Copa Suprema Gamezon', game: 'Naves Espaciais Retro', type: 'match', referee: 'Juiz_Robo_Ref' },
  { id: 'a-5', time: '21:30 - Hoje', title: 'Cerimônia de Entrega de Badges e Moedas', game: 'Lounge Oficial', type: 'ceremony', referee: 'Lider_Do_Sindicato' }
];

const PRESET_LEADERBOARD_TEAMS: LeaderboardEntry[] = [
  { rank: 1, name: 'Gladiadores Gamezone', points: 2850, winRate: '82%', played: 34, badgesCount: 6 },
  { rank: 2, name: 'Zeus Thunderbolts', points: 2540, winRate: '75%', played: 30, badgesCount: 4 },
  { rank: 3, name: 'Valkyries Esports', points: 2420, winRate: '71%', played: 28, badgesCount: 5 },
  { rank: 4, name: 'Shroud Legion', points: 2190, winRate: '68%', played: 32, badgesCount: 3 },
  { rank: 5, name: 'Challenger Alliance', points: 1980, winRate: '64%', played: 25, badgesCount: 2 },
  { rank: 6, name: 'Team Apex Predators', points: 1850, winRate: '59%', played: 27, badgesCount: 2 },
  { rank: 7, name: 'Ninjas do Teclado', points: 1540, winRate: '52%', played: 22, badgesCount: 1 }
];

const PRESET_LEADERBOARD_PLAYERS: LeaderboardEntry[] = [
  { rank: 1, name: 'Você (Challenger)', points: 4500, winRate: '85%', played: 42, badgesCount: 9 },
  { rank: 2, name: 'Lady_Gamer', points: 4200, winRate: '79%', played: 40, badgesCount: 8 },
  { rank: 3, name: 'X-Sniper_Pro', points: 3800, winRate: '76%', played: 38, badgesCount: 6 },
  { rank: 4, name: 'Retro_Racer_Boss', points: 3100, winRate: '70%', played: 35, badgesCount: 4 },
  { rank: 5, name: 'Cyber_Samurai', points: 2900, winRate: '66%', played: 31, badgesCount: 4 }
];

const PRESET_SAVED_REPLAYS: SavedReplay[] = [
  { id: 'rep-1', title: 'Vitória Épica contra Apex Predators (Quartas)', duration: '12m 45s', views: 342, rating: 4.8, game: 'Naves Espaciais Retro', date: 'Hoje' },
  { id: 'rep-2', title: 'Quadra Kill de Lady_Gamer na Arena Combat 2D', duration: '1m 20s', views: 890, rating: 4.9, game: 'Arena Combat 2D', date: 'Ontem' },
  { id: 'rep-3', title: 'Goleada Amadora no Masters do Bairro', duration: '15m 10s', views: 89, rating: 4.1, game: 'Arena Combat 2D', date: '2 dias atrás' },
  { id: 'rep-4', title: 'Volta Recorde de Nitro Quântico', duration: '3m 05s', views: 231, rating: 4.5, game: 'Velocidade Extrema Grid', date: '3 dias atrás' }
];

const PRESET_AUDIT_LOGS: AuditLog[] = [
  { id: 'log-1', timestamp: '11:30:15', type: 'system', actor: 'Sistema', action: 'STARTUP', details: 'Plataforma de Torneios Gamezon inicializada com sucesso.' },
  { id: 'log-2', timestamp: '11:32:45', type: 'registration', actor: 'Você (Challenger)', action: 'TEAM_REGISTER', details: 'Inscrição efetuada na "Copa Suprema Gamezon". Taxa de 100 Moedas deduzida.' },
  { id: 'log-3', timestamp: '11:35:10', type: 'anti_cheat', actor: 'Integridade_Voz', action: 'SCAN_CLEAN', details: 'Análise heurística de memória limpa para os 3 membros dos Gladiadores.' },
  { id: 'log-4', timestamp: '11:40:02', type: 'referee', actor: 'Juiz_Robo_Ref', action: 'MATCH_SCORE_DECLARED', details: 'Resultado homologado do jogo M-1: Gladiadores 16 x 12 Apex Predators. Sincronização de brackets executada.' }
];

export const TournamentTab: React.FC<TournamentTabProps> = ({
  playerCoins,
  addCoins,
  playerLevel,
  addPoints
}) => {
  // Navigation states
  const [activeSection, setActiveSection] = useState<'explore' | 'bracket' | 'teams' | 'schedule' | 'ranking' | 'media' | 'referee'>('explore');

  // Main list states
  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    const saved = localStorage.getItem('gzon_tournaments');
    return saved ? JSON.parse(saved) : PRESET_TOURNAMENTS;
  });

  const [matches, setMatches] = useState<BracketMatch[]>(() => {
    const saved = localStorage.getItem('gzon_bracket_matches');
    return saved ? JSON.parse(saved) : PRESET_MATCHES;
  });

  const [agenda, setAgenda] = useState<AgendaEvent[]>(PRESET_AGENDA);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(PRESET_AUDIT_LOGS);

  // My Dynamic Team state
  const [myTeam, setMyTeam] = useState<Team>(() => {
    const defaultTeam: Team = {
      id: 'team-mine',
      name: 'Gladiadores Gamezone',
      logoSeed: 'shield',
      wins: 15,
      losses: 5,
      rankPoints: 1200,
      members: [
        { id: 'usr-me', name: 'Você (Challenger)', role: 'leader', level: playerLevel, badge: 'Veterano do Espaço 🛡️', item: 'Canhão de Plasma Orbital ⚡', status: 'online' },
        { id: 'usr-1', name: 'X-Sniper_Pro', role: 'player', level: 38, badge: 'Elite Aim-God 🎯', item: 'Faca Tática de Carbono 🔪', status: 'online' },
        { id: 'usr-2', name: 'Lady_Gamer', role: 'player', level: 42, badge: 'Estrela Suprema ⭐', item: 'Kit de Cura Nano 🧪', status: 'playing' }
      ]
    };
    return defaultTeam;
  });

  // Replay rates and Live Hub chat stream
  const [replays, setReplays] = useState<SavedReplay[]>(PRESET_SAVED_REPLAYS);
  const [liveChat, setLiveChat] = useState<LiveChatMsg[]>([
    { id: 'c-1', user: 'Mod_Pro_99', text: 'Os Gladiadores estão jogando muito hoje!', time: '11:51' },
    { id: 'c-2', user: 'NoobMaster_X', text: 'A finta que a Lady_Gamer fez na esquerda foi absurda 🚀', time: '11:52', isVip: true },
    { id: 'c-3', user: 'Valkyria_Admin', text: 'Nosso time vai virar nas Semifinais, aguardem!', time: '11:52' }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [streamVolume, setStreamVolume] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // New Tournament Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTournName, setNewTournName] = useState<string>('');
  const [newTournType, setNewTournType] = useState<Tournament['type']>('public');
  const [newTournFee, setNewTournFee] = useState<number>(0);
  const [newTournGame, setNewTournGame] = useState<string>('Naves Espaciais Retro');
  const [newTournPrizeCoins, setNewTournPrizeCoins] = useState<number>(100);

  // Dynamic user item inventory collection won from tournaments
  const [wonItems, setWonItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('gzon_won_items');
    return saved ? JSON.parse(saved) : ['Medalha de Recruta Coletada 🎖️'];
  });
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>(() => {
    const saved = localStorage.getItem('gzon_unlocked_badges');
    return saved ? JSON.parse(saved) : ['Badge de Registro Global ✔️'];
  });

  // Tournament details selector
  const [selectedTournament, setSelectedTournament] = useState<Tournament>(PRESET_TOURNAMENTS[0]);

  // Sync state helpers
  useEffect(() => {
    localStorage.setItem('gzon_tournaments', JSON.stringify(tournaments));
  }, [tournaments]);

  useEffect(() => {
    localStorage.setItem('gzon_bracket_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('gzon_won_items', JSON.stringify(wonItems));
    localStorage.setItem('gzon_unlocked_badges', JSON.stringify(unlockedBadges));
  }, [wonItems, unlockedBadges]);

  // Automated log helper
  const addAuditLog = (type: AuditLog['type'], actor: string, action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      actor,
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // --- ACTIONS HANDLERS ---

  // Create customized Tournament
  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournName.trim()) return;

    playSound.jackpot();
    const generatedId = `t-custom-${Date.now()}`;
    const newT: Tournament = {
      id: generatedId,
      name: newTournName,
      type: newTournType,
      game: newTournGame,
      fee: newTournFee,
      status: 'registration',
      teamSize: 3,
      teamsRegistered: 1,
      maxTeams: 8,
      rewards: {
        coins: newTournPrizeCoins,
        xp: Math.floor(newTournPrizeCoins * 0.5),
        badge: `Vencedor ${newTournName} 🏆`,
        item: `Troféu ${newTournGame} Especial 💎`
      },
      isRegistered: true, // auto registers own team
      moderator: 'Você (Challenger)',
      referee: 'Juiz_Estadual_Pro',
      date: 'Em breve',
      time: '19:00',
      description: `Torneio customizado criado pelo moderador Você (Challenger). Entre com sua equipe agora mesmo!`
    };

    setTournaments(prev => [newT, ...prev]);
    addAuditLog('system', 'Você (Challenger)', 'CREATE_TOURNAMENT', `Criou o torneio "${newTournName}" (${newTournType.toUpperCase()}) com premiação de ${newTournPrizeCoins} Moedas.`);
    
    // Seed new custom matches for this tournament
    const newCustomMatches: BracketMatch[] = [
      { id: `${generatedId}-m1`, tournamentId: generatedId, round: 1, matchNum: 1, team1Name: 'Gladiadores Gamezone', team2Name: 'Zeus Thunderbolts', status: 'scheduled', referee: 'Juiz_Estadual_Pro', time: '14:00' },
      { id: `${generatedId}-m2`, tournamentId: generatedId, round: 1, matchNum: 2, team1Name: 'Valkyries Esports', team2Name: 'Ninjas do Teclado', status: 'scheduled', referee: 'Juiz_Estadual_Pro', time: '14:30' },
      { id: `${generatedId}-m3`, tournamentId: generatedId, round: 1, matchNum: 3, team1Name: 'Shroud Legion', team2Name: 'Team Apex Predators', status: 'scheduled', referee: 'Juiz_Estadual_Pro', time: '15:00' },
      { id: `${generatedId}-m4`, tournamentId: generatedId, round: 1, matchNum: 4, team1Name: 'Cyber Samurai Squad', team2Name: 'Challenger Alliance', status: 'scheduled', referee: 'Juiz_Estadual_Pro', time: '15:30' },
      { id: `${generatedId}-m5`, tournamentId: generatedId, round: 2, matchNum: 1, team1Name: 'TBD', team2Name: 'TBD', status: 'scheduled', referee: 'Juiz_Estadual_Pro', time: '16:00' },
      { id: `${generatedId}-m6`, tournamentId: generatedId, round: 2, matchNum: 2, team1Name: 'TBD', team2Name: 'TBD', status: 'scheduled', referee: 'Juiz_Estadual_Pro', time: '16:30' },
      { id: `${generatedId}-m7`, tournamentId: generatedId, round: 3, matchNum: 1, team1Name: 'TBD', team2Name: 'TBD', status: 'scheduled', referee: 'Juiz_Estadual_Pro', time: '17:00' }
    ];
    setMatches(prev => [...newCustomMatches, ...prev]);

    // Cleanup state
    setNewTournName('');
    setNewTournFee(0);
    setShowCreateModal(false);
    setSelectedTournament(newT);
  };

  // Subscribe / Enroll inside tournament
  const handleRegister = (tourn: Tournament) => {
    if (tourn.isRegistered) {
      playSound.click();
      // Unsubscribe
      setTournaments(prev => prev.map(t => {
        if (t.id === tourn.id) {
          return { ...t, isRegistered: false, teamsRegistered: Math.max(0, t.teamsRegistered - 1) };
        }
        return t;
      }));
      addCoins(tourn.fee); // refund fee
      addAuditLog('registration', 'Você (Challenger)', 'UNREGISTER', `Saiu da lista de inscritos do torneio "${tourn.name}". Reembolso de ${tourn.fee} Moedas creditado.`);
    } else {
      // Subscribe check
      if (playerCoins < tourn.fee) {
        playSound.purchase();
        alert('Moedas insuficientes para pagar a taxa de inscrição!');
        return;
      }
      playSound.jackpot();
      setTournaments(prev => prev.map(t => {
        if (t.id === tourn.id) {
          return { ...t, isRegistered: true, teamsRegistered: t.teamsRegistered + 1 };
        }
        return t;
      }));
      addCoins(-tourn.fee); // deduct fee
      addAuditLog('registration', 'Você (Challenger)', 'REGISTER', `Filiou a equipe "Gladiadores Gamezone" no torneio "${tourn.name}". Taxa de ${tourn.fee} Moedas paga.`);
    }
  };

  // --- AUTOMATIC CLASSIFICATION & ADVANCEMENT ENGINE ---
  // When a round is progressed, the engine calculates match scores, logs results,
  // and automatically schedules the winner for the next round slot (m5, m6, m7).
  const runAutomaticClassification = (tournamentId: string) => {
    playSound.spin();
    addAuditLog('referee', 'Juiz_Robo_Ref', 'AUTO_CLASSIFICATION_START', `Iniciando processador automático de chaveamento do torneio ID: ${tournamentId}`);

    setMatches(prev => {
      const copy = [...prev];
      const tournamentMatches = copy.filter(m => m.tournamentId === tournamentId);

      // 1. Process Round 1 (Quarterfinals) if they are not finished
      let processedAny = false;
      const r1Matches = tournamentMatches.filter(m => m.round === 1);
      const finishedR1Count = r1Matches.filter(m => m.status === 'finished').length;

      if (finishedR1Count < 4) {
        // Resolve all Quarterfinals
        r1Matches.forEach(match => {
          if (match.status !== 'finished') {
            const sc1 = Math.floor(Math.random() * 8) + 9; // 9 to 16
            const sc2 = Math.floor(Math.random() * 8) + 9;
            const diff = sc1 === sc2 ? (Math.random() > 0.5 ? 1 : -1) : 0;
            const finalSc1 = sc1 + (diff > 0 ? 1 : 0);
            const finalSc2 = sc2 + (diff < 0 ? 1 : 0);
            
            match.score1 = finalSc1;
            match.score2 = finalSc2;
            match.winner = finalSc1 > finalSc2 ? match.team1Name : match.team2Name;
            match.status = 'finished';
            
            addAuditLog('referee', match.referee, 'MATCH_FINISHED', `[Quartas] ${match.team1Name} ${finalSc1} vs ${finalSc2} ${match.team2Name}. Vencedor: ${match.winner}`);
          }
        });
        processedAny = true;
      }

      // Propagate Round 1 winners to Round 2 (Semifinals)
      const m1 = r1Matches.find(m => m.matchNum === 1);
      const m2 = r1Matches.find(m => m.matchNum === 2);
      const m3 = r1Matches.find(m => m.matchNum === 3);
      const m4 = r1Matches.find(m => m.matchNum === 4);

      const semi1 = tournamentMatches.find(m => m.round === 2 && m.matchNum === 1);
      const semi2 = tournamentMatches.find(m => m.round === 2 && m.matchNum === 2);

      if (semi1 && m1 && m2 && m1.winner && m2.winner && semi1.team1Name === 'TBD') {
        semi1.team1Name = m1.winner;
        semi1.team2Name = m2.winner;
        semi1.status = 'live';
        addAuditLog('system', 'Auto_Ref_Engine', 'SEED_ROUND_2', `Semeado Semifinal 1: ${semi1.team1Name} vs ${semi1.team2Name}`);
      }
      if (semi2 && m3 && m4 && m3.winner && m4.winner && semi2.team1Name === 'TBD') {
        semi2.team1Name = m3.winner;
        semi2.team2Name = m4.winner;
        semi2.status = 'scheduled';
        addAuditLog('system', 'Auto_Ref_Engine', 'SEED_ROUND_2', `Semeado Semifinal 2: ${semi2.team1Name} vs ${semi2.team2Name}`);
      }

      // 2. Process Round 2 (Semifinals) if they are ready but not finished
      const r2Matches = tournamentMatches.filter(m => m.round === 2);
      const readyR2 = r2Matches.every(m => m.team1Name !== 'TBD' && m.team2Name !== 'TBD');
      const finishedR2Count = r2Matches.filter(m => m.status === 'finished').length;

      if (!processedAny && readyR2 && finishedR2Count < 2) {
        r2Matches.forEach(match => {
          if (match.status !== 'finished') {
            const sc1 = Math.floor(Math.random() * 8) + 9;
            const sc2 = Math.floor(Math.random() * 8) + 9;
            const score1Final = sc1 === sc2 ? sc1 + 1 : sc1;
            const score2Final = sc2;
            
            match.score1 = score1Final;
            match.score2 = score2Final;
            match.winner = score1Final > score2Final ? match.team1Name : match.team2Name;
            match.status = 'finished';

            addAuditLog('referee', match.referee, 'MATCH_FINISHED', `[Semifinal] ${match.team1Name} ${score1Final} vs ${score2Final} ${match.team2Name}. Vencedor: ${match.winner}`);
          }
        });
        processedAny = true;
      }

      // Propagate Semifinal winners to Finals (Round 3)
      const sm1 = r2Matches.find(m => m.matchNum === 1);
      const sm2 = r2Matches.find(m => m.matchNum === 2);
      const finalMatch = tournamentMatches.find(m => m.round === 3);

      if (finalMatch && sm1 && sm2 && sm1.winner && sm2.winner && finalMatch.team1Name === 'TBD') {
        finalMatch.team1Name = sm1.winner;
        finalMatch.team2Name = sm2.winner;
        finalMatch.status = 'live';
        addAuditLog('system', 'Auto_Ref_Engine', 'SEED_ROUND_3', `Semeado Grande Final: ${finalMatch.team1Name} vs ${finalMatch.team2Name}`);
      }

      // 3. Process Round 3 (Finals) if ready and not finished
      if (!processedAny && finalMatch && finalMatch.team1Name !== 'TBD' && finalMatch.team2Name !== 'TBD' && finalMatch.status !== 'finished') {
        const score1Final = 16;
        const score2Final = 14;
        finalMatch.score1 = score1Final;
        finalMatch.score2 = score2Final;
        finalMatch.winner = score1Final > score2Final ? finalMatch.team1Name : finalMatch.team2Name;
        finalMatch.status = 'finished';

        addAuditLog('referee', finalMatch.referee, 'TOURNAMENT_COMPLETED', `[Grande Final] ${finalMatch.team1Name} ${score1Final} vs ${score2Final} ${finalMatch.team2Name}. Campeão Oficial: ${finalMatch.winner}`);

        // If the winner is our team, hand over rewards dynamically!
        if (finalMatch.winner === myTeam.name) {
          const selectedT = tournaments.find(t => t.id === tournamentId) || PRESET_TOURNAMENTS[0];
          playSound.jackpot();
          
          // Add XP and Coins from props!
          addCoins(selectedT.rewards.coins);
          addPoints(selectedT.rewards.xp);

          // Unlock Custom Items and Badges
          setWonItems(prev => {
            if (!prev.includes(selectedT.rewards.item)) {
              return [selectedT.rewards.item, ...prev];
            }
            return prev;
          });
          setUnlockedBadges(prev => {
            if (!prev.includes(selectedT.rewards.badge)) {
              return [selectedT.rewards.badge, ...prev];
            }
            return prev;
          });

          addAuditLog('payout', 'Distribuidor de Prêmios', 'PAYOUT_CLAIMED', `🏆 PARABÉNS! Gladiadores venceu o campeonato! Creditado +${selectedT.rewards.coins} Moedas, +${selectedT.rewards.xp} XP. Item "[${selectedT.rewards.item}]" e Badge "[${selectedT.rewards.badge}]" liberados no inventário.`);
          alert(`🏆 PARABÉNS! Gladiadores venceu o torneio! Recompensa creditada: ${selectedT.rewards.coins} Moedas, ${selectedT.rewards.xp} XP e novos itens!`);
        } else {
          playSound.victory();
          alert(`Torneio concluído! O campeão foi: ${finalMatch.winner}.`);
        }

        // Set tournament status to finished
        setTournaments(curr => curr.map(t => {
          if (t.id === tournamentId) {
            return { ...t, status: 'finished' };
          }
          return t;
        }));

        processedAny = true;
      }

      return copy;
    });
  };

  const resetBracket = (tournamentId: string) => {
    playSound.click();
    setMatches(prev => {
      // Reset only current tournament matches to original state
      return prev.map(m => {
        if (m.tournamentId === tournamentId) {
          return {
            ...m,
            score1: undefined,
            score2: undefined,
            winner: undefined,
            status: m.round === 1 ? 'finished' : 'scheduled', // restore defaults
            team1Name: m.round === 1 ? m.team1Name : 'TBD',
            team2Name: m.round === 1 ? m.team2Name : 'TBD'
          };
        }
        return m;
      });
    });
    // Set first round back
    const freshMatches = PRESET_MATCHES.filter(m => m.tournamentId === tournamentId);
    if (freshMatches.length > 0) {
      setMatches(prev => {
        const cleared = prev.filter(m => m.tournamentId !== tournamentId);
        return [...freshMatches, ...cleared];
      });
    }

    setTournaments(curr => curr.map(t => {
      if (t.id === tournamentId) {
        return { ...t, status: 'active' };
      }
      return t;
    }));

    addAuditLog('referee', 'Você (Challenger)', 'RESET_BRACKET', `Resetou o chaveamento do campeonato ID: ${tournamentId} para o estado inicial.`);
  };

  // Referee controls: override score manually or resolve disputes
  const handleRefereeOverride = (matchId: string, s1: number, s2: number) => {
    playSound.click();
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        const win = s1 > s2 ? m.team1Name : m.team2Name;
        addAuditLog('referee', 'Mod / Árbitro Você', 'MANUAL_OVERRIDE', `Intervenção judicial no jogo ${m.id}. Score alterado para ${s1} x ${s2}. Vencedor homologado: ${win}`);
        return {
          ...m,
          score1: s1,
          score2: s2,
          winner: win,
          status: 'finished',
          disputed: false
        };
      }
      return m;
    }));
  };

  const triggerDispute = (matchId: string, reason: string) => {
    playSound.purchase();
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        addAuditLog('anti_cheat', 'Anti-Cheat / Voz', 'DISPUTE_FILED', `Alerta de disputa no jogo ${matchId}. Motivo: ${reason}`);
        return {
          ...m,
          disputed: true,
          disputeReason: reason
        };
      }
      return m;
    }));
  };

  // Media interaction: rate replay and live streams chat
  const handleRateReplay = (id: string, stars: number) => {
    playSound.collect();
    setReplays(prev => prev.map(r => {
      if (r.id === id) {
        const newRating = ((r.rating * r.views) + stars) / (r.views + 1);
        return { ...r, rating: parseFloat(newRating.toFixed(1)), userRating: stars, views: r.views + 1 };
      }
      return r;
    }));
    addAuditLog('system', 'Você (Challenger)', 'RATE_REPLAY', `Avaliou o Replay ${id} com ${stars} estrelas.`);
  };

  const sendLiveChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    playSound.click();
    const newChat: LiveChatMsg = {
      id: `chat-${Date.now()}`,
      user: 'Você (Challenger)',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString().slice(0, 5),
      isVip: true
    };

    setLiveChat(prev => [...prev, newChat]);
    setChatInput('');

    // Simulated reply after 1.5 seconds
    setTimeout(() => {
      const answers = [
        'GG WP! Excelente posicionamento da equipe.',
        'Esse torneio tá muito disputado!',
        'Amanhã tem mais campeonato da comunidade hein.',
        'Os prêmios de moedas estão valendo muito a pena!'
      ];
      const botUsers = ['Gamer_Lendario', 'NoobMaster_X', 'Clã_Lider_Alpha'];
      setLiveChat(prev => [
        ...prev,
        {
          id: `chat-bot-${Date.now()}`,
          user: botUsers[Math.floor(Math.random() * botUsers.length)],
          text: answers[Math.floor(Math.random() * answers.length)],
          time: new Date().toLocaleTimeString().slice(0, 5)
        }
      ]);
      playSound.collect();
    }, 1500);
  };

  // Create customized team
  const [newTeamNameInput, setNewTeamNameInput] = useState<string>('');
  const handleRenameTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamNameInput.trim()) return;
    playSound.collect();
    setMyTeam(prev => ({
      ...prev,
      name: newTeamNameInput.trim()
    }));
    addAuditLog('system', 'Você (Challenger)', 'TEAM_RENAME', `Renomeou sua equipe para: "${newTeamNameInput.trim()}"`);
    setNewTeamNameInput('');
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER: TOURNAMENT PLATFORM TITLE & PLAYER STATS */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500 animate-pulse" />
              <h2 className="text-lg font-black text-slate-850 dark:text-slate-100 uppercase tracking-tight">
                Plataforma de Torneios Gamezon
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gerencie campeonatos oficiais e da comunidade, acompanhe chaves automáticas, agenda, estatísticas e dispute prêmios épicos!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/40 px-3.5 py-2 rounded-2xl flex items-center gap-2.5">
              <Award className="w-4 h-4 text-indigo-500" />
              <div>
                <span className="text-[9px] uppercase font-bold text-indigo-400 block leading-none">Nível Competitivo</span>
                <span className="text-xs font-black text-slate-850 dark:text-slate-100 font-mono">Rank {playerLevel}</span>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-150 dark:border-amber-900/40 px-3.5 py-2 rounded-2xl flex items-center gap-2.5">
              <span className="text-amber-500 font-bold font-mono">🪙</span>
              <div>
                <span className="text-[9px] uppercase font-bold text-amber-500 block leading-none">Minhas Moedas</span>
                <span className="text-xs font-black text-slate-850 dark:text-slate-100 font-mono">{playerCoins}</span>
              </div>
            </div>

            <button
              onClick={() => { playSound.click(); setShowCreateModal(true); }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer ml-auto lg:ml-0"
            >
              <Plus className="w-4 h-4" />
              Criar Torneio
            </button>
          </div>
        </div>
      </div>

      {/* SUB-SECTION SELECTOR */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 flex-nowrap scrollbar-none">
        <button
          onClick={() => { playSound.click(); setActiveSection('explore'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'explore'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-sm font-black'
              : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          🏆 Explorar Campeonatos
        </button>
        <button
          onClick={() => { playSound.click(); setActiveSection('bracket'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'bracket'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-sm font-black'
              : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          🌿 Chaves &amp; Brackets
        </button>
        <button
          onClick={() => { playSound.click(); setActiveSection('teams'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'teams'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-sm font-black'
              : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          👥 Times &amp; Jogadores
        </button>
        <button
          onClick={() => { playSound.click(); setActiveSection('schedule'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'schedule'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-sm font-black'
              : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          📅 Calendário &amp; Agenda
        </button>
        <button
          onClick={() => { playSound.click(); setActiveSection('ranking'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'ranking'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-sm font-black'
              : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          📊 Rankings &amp; Estatísticas
        </button>
        <button
          onClick={() => { playSound.click(); setActiveSection('media'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'media'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-sm font-black'
              : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          📺 Lives &amp; Replays
        </button>
        <button
          onClick={() => { playSound.click(); setActiveSection('referee'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'referee'
              ? 'bg-rose-600 text-white shadow-sm font-black'
              : 'bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100/50'
          }`}
        >
          🛡️ Árbitros &amp; Moderação
        </button>
      </div>

      {/* MAIN SECTIONS RENDERING */}
      <div className="min-h-[500px]">

        {/* 1. EXPLORE TOURNAMENTS SECTION */}
        {activeSection === 'explore' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* TOURNAMENTS LISTING (7 columns) */}
            <div className="xl:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Campeonatos Disponíveis ({tournaments.length})
                </h3>
                <span className="text-[10px] text-indigo-500 font-bold">Taxas deduzidas do saldo real</span>
              </div>

              <div className="space-y-4">
                {tournaments.map((tourn) => {
                  const isSelected = selectedTournament.id === tourn.id;
                  
                  // Label color classes
                  const typeColors = {
                    official: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40',
                    community: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40',
                    private: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40',
                    public: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40',
                    special: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40'
                  };

                  return (
                    <div
                      key={tourn.id}
                      onClick={() => { playSound.click(); setSelectedTournament(tourn); }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-indigo-50/50 dark:bg-slate-900 border-indigo-500 dark:border-indigo-600 shadow-sm'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${typeColors[tourn.type]}`}>
                              {tourn.type === 'official' && '⭐ Oficial'}
                              {tourn.type === 'community' && '👥 Comunidade'}
                              {tourn.type === 'private' && '🔒 Privado'}
                              {tourn.type === 'public' && '🌐 Público'}
                              {tourn.type === 'special' && '⚡ Especial'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold font-mono">
                              {tourn.game}
                            </span>
                          </div>

                          <h4 className="text-base font-black text-slate-850 dark:text-slate-100">
                            {tourn.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 pr-4 leading-relaxed">
                            {tourn.description}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Inscrição</span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-150 font-mono">
                            {tourn.fee > 0 ? `🪙 ${tourn.fee} moedas` : 'Grátis'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-150 dark:border-slate-850 mt-4 pt-3 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-4">
                          <span>
                            Times: <strong className="text-indigo-500">{tourn.teamsRegistered}/{tourn.maxTeams}</strong>
                          </span>
                          <span>
                            Agenda: <strong>{tourn.date} às {tourn.time}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {tourn.isRegistered ? (
                            <span className="text-emerald-500 font-extrabold flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-150 px-2 py-0.5 rounded-lg">
                              <Check className="w-3.5 h-3.5" /> Inscrito
                            </span>
                          ) : tourn.status === 'finished' ? (
                            <span className="text-slate-400 font-bold bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-lg">
                              Concluído
                            </span>
                          ) : (
                            <span className="text-indigo-500 font-extrabold group-hover:underline">
                              Ver Detalhes →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SELECTED TOURNAMENT SPEC DETAILS (5 columns) */}
            <div className="xl:col-span-5 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Resumo do Campeonato
              </h3>

              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl space-y-5">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-indigo-500 uppercase font-black tracking-widest block">Inscrições abertas</span>
                  <h4 className="text-lg font-black text-slate-850 dark:text-slate-100 leading-tight">
                    {selectedTournament.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {selectedTournament.description}
                  </p>
                </div>

                {/* Rewards Panel */}
                <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Premiação do Campeão (Prize Pool)</span>
                  
                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-150 dark:border-amber-900/30 rounded-xl">
                      <span className="text-[9px] text-amber-500 block font-bold font-sans">MOEDAS</span>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">🪙 +{selectedTournament.rewards.coins} moedas</span>
                    </div>

                    <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/30 rounded-xl">
                      <span className="text-[9px] text-indigo-500 block font-bold font-sans">EXPERIÊNCIA</span>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">⚡ +{selectedTournament.rewards.xp} XP</span>
                    </div>

                    <div className="p-2.5 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-150 dark:border-purple-900/30 rounded-xl col-span-2">
                      <span className="text-[9px] text-purple-500 block font-bold font-sans">BADGE EXCLUSIVA</span>
                      <span className="text-xs font-black text-purple-600 dark:text-purple-400">🏆 {selectedTournament.rewards.badge}</span>
                    </div>

                    <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/30 rounded-xl col-span-2">
                      <span className="text-[9px] text-emerald-500 block font-bold font-sans">ITEM DO ARSENAL</span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">🎒 {selectedTournament.rewards.item}</span>
                    </div>
                  </div>
                </div>

                {/* Team Requirements & Staff */}
                <div className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <span>Tamanho do Time</span>
                    <span className="text-slate-800 dark:text-slate-100 font-black">{selectedTournament.teamSize} vs {selectedTournament.teamSize}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <span>Árbitro Alocado</span>
                    <span className="text-slate-800 dark:text-slate-100 font-black">👮 {selectedTournament.referee}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <span>Moderador Geral</span>
                    <span className="text-slate-800 dark:text-slate-100 font-black">🛡️ {selectedTournament.moderator}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Inscrição</span>
                    <span className="text-indigo-500 font-mono font-black">
                      {selectedTournament.fee > 0 ? `🪙 ${selectedTournament.fee} moedas` : 'Gratuito'}
                    </span>
                  </div>
                </div>

                {/* Register Action Trigger Button */}
                {selectedTournament.status !== 'finished' ? (
                  <button
                    onClick={() => handleRegister(selectedTournament)}
                    className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer ${
                      selectedTournament.isRegistered
                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/10'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10'
                    }`}
                  >
                    {selectedTournament.isRegistered ? (
                      <>
                        <X className="w-4 h-4" /> Cancelar Inscrição do Meu Time
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" /> Inscrever Minha Equipe
                      </>
                    )}
                  </button>
                ) : (
                  <div className="p-3 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-xl text-center text-xs font-black">
                    Torneio Encerrado
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* 2. LIVE BRACKETS & CHAVEAMENTO SECTION */}
        {activeSection === 'bracket' && (
          <div className="space-y-6">
            
            {/* TOURNAMENT SELECTOR FOR BRACKETS */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Chaves de Torneio Ativo</span>
                <select
                  value={selectedTournament.id}
                  onChange={(e) => {
                    const matchT = tournaments.find(t => t.id === e.target.value);
                    if (matchT) {
                      playSound.click();
                      setSelectedTournament(matchT);
                    }
                  }}
                  className="bg-transparent text-sm font-black text-slate-850 dark:text-slate-100 uppercase tracking-tight focus:outline-none"
                >
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                      {t.name} ({t.status === 'finished' ? 'Finalizado' : 'Ativo'})
                    </option>
                  ))}
                </select>
              </div>

              {/* AUTOMATION BUTTON */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => runAutomaticClassification(selectedTournament.id)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-600/15 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                  Simular Próxima Rodada (Classificação Automática) ⚡
                </button>

                <button
                  onClick={() => resetBracket(selectedTournament.id)}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Resetar Chaves
                </button>
              </div>
            </div>

            {/* BRACKET SHEET TREE VIEW */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-6">
              
              <div className="border-b border-slate-150 dark:border-slate-850 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Visualização das Chaves (Single Elimination Bracket)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">As equipes avançam de rodada assim que o placar é homologado pelos árbitros.</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Agendado
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" /> Ao Vivo (Live Stream)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Finalizado
                  </span>
                </div>
              </div>

              {/* THREE COLUMN BRACKET LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono relative">
                
                {/* 1. QUARTAS DE FINAL (ROUND 1) */}
                <div className="space-y-4">
                  <div className="text-[10px] font-black text-indigo-500 border-b border-slate-100 dark:border-slate-900 pb-1.5 uppercase tracking-wider">
                    Quartas de Final (Rodada 1)
                  </div>

                  <div className="space-y-4">
                    {matches
                      .filter(m => m.tournamentId === selectedTournament.id && m.round === 1)
                      .map(match => {
                        const isWinner1 = match.winner === match.team1Name;
                        const isWinner2 = match.winner === match.team2Name;

                        return (
                          <div 
                            key={match.id} 
                            className={`p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl space-y-2 relative transition-all ${
                              match.disputed 
                                ? 'border-red-400 dark:border-red-900' 
                                : 'border-slate-150 dark:border-slate-800'
                            }`}
                          >
                            <span className="absolute -top-2 right-2 bg-slate-200 dark:bg-slate-800 text-[8px] text-slate-500 px-1 rounded">
                              Ref: {match.referee}
                            </span>

                            <div className="space-y-1">
                              <div className={`flex justify-between text-xs font-bold ${isWinner1 ? 'text-emerald-500 font-extrabold' : 'text-slate-600 dark:text-slate-350'}`}>
                                <span className="truncate max-w-[140px]">{match.team1Name}</span>
                                <span>{match.score1 ?? '-'}</span>
                              </div>
                              <div className={`flex justify-between text-xs font-bold ${isWinner2 ? 'text-emerald-500 font-extrabold' : 'text-slate-600 dark:text-slate-350'}`}>
                                <span className="truncate max-w-[140px]">{match.team2Name}</span>
                                <span>{match.score2 ?? '-'}</span>
                              </div>
                            </div>
                            
                            {match.disputed && (
                              <div className="text-[9px] bg-red-100 dark:bg-red-950/40 text-red-600 p-1 rounded font-sans leading-tight">
                                Disputa: {match.disputeReason}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    {matches.filter(m => m.tournamentId === selectedTournament.id && m.round === 1).length === 0 && (
                      <p className="text-xs text-slate-400 italic">Nenhum jogo nesta rodada.</p>
                    )}
                  </div>
                </div>

                {/* 2. SEMIFINAIS (ROUND 2) */}
                <div className="space-y-4 flex flex-col justify-around min-h-[300px]">
                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-indigo-500 border-b border-slate-100 dark:border-slate-900 pb-1.5 uppercase tracking-wider">
                      Semifinais (Rodada 2)
                    </div>

                    <div className="space-y-6 mt-4">
                      {matches
                        .filter(m => m.tournamentId === selectedTournament.id && m.round === 2)
                        .map(match => {
                          const isWinner1 = match.winner === match.team1Name;
                          const isWinner2 = match.winner === match.team2Name;
                          const isLive = match.status === 'live';

                          return (
                            <div 
                              key={match.id} 
                              className={`p-3 border rounded-xl space-y-2 relative transition-all ${
                                isLive 
                                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/40 animate-pulse' 
                                  : 'bg-slate-50 dark:bg-slate-900 border-slate-150 dark:border-slate-800'
                              }`}
                            >
                              {isLive && (
                                <span className="absolute -top-2.5 left-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  AO VIVO 🔴
                                </span>
                              )}

                              <span className="absolute -top-2 right-2 bg-slate-200 dark:bg-slate-800 text-[8px] text-slate-500 px-1 rounded">
                                {match.time}
                              </span>

                              <div className="space-y-1">
                                <div className={`flex justify-between text-xs font-bold ${isWinner1 ? 'text-emerald-500 font-extrabold' : 'text-slate-600 dark:text-slate-350'}`}>
                                  <span className="truncate max-w-[140px]">{match.team1Name}</span>
                                  <span>{match.score1 ?? '-'}</span>
                                </div>
                                <div className={`flex justify-between text-xs font-bold ${isWinner2 ? 'text-emerald-500 font-extrabold' : 'text-slate-600 dark:text-slate-350'}`}>
                                  <span className="truncate max-w-[140px]">{match.team2Name}</span>
                                  <span>{match.score2 ?? '-'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      {matches.filter(m => m.tournamentId === selectedTournament.id && m.round === 2).length === 0 && (
                        <p className="text-xs text-slate-400 italic">Chaves em processo de seed.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. GRANDE FINAL (ROUND 3) */}
                <div className="space-y-4 flex flex-col justify-center">
                  <div className="text-[10px] font-black text-amber-500 border-b border-slate-100 dark:border-slate-900 pb-1.5 uppercase tracking-wider">
                    Grande Final (Rodada 3)
                  </div>

                  <div className="mt-4">
                    {matches
                      .filter(m => m.tournamentId === selectedTournament.id && m.round === 3)
                      .map(match => {
                        const isWinner1 = match.winner === match.team1Name;
                        const isWinner2 = match.winner === match.team2Name;
                        const isFinished = match.status === 'finished';

                        return (
                          <div 
                            key={match.id} 
                            className={`p-4 border rounded-2xl space-y-3 relative shadow-md transition-all ${
                              isFinished 
                                ? 'bg-gradient-to-tr from-yellow-50 to-amber-50 dark:from-yellow-950/10 dark:to-slate-900 border-yellow-400' 
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-150 dark:border-slate-800'
                            }`}
                          >
                            {isFinished && (
                              <div className="absolute -top-3.5 left-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-[8px] text-slate-950 font-black px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-0.5 shadow">
                                <Trophy className="w-3 h-3 fill-slate-950 text-slate-950" /> CAMPEÃO!
                              </div>
                            )}

                            <span className="absolute -top-2 right-2 bg-slate-200 dark:bg-slate-800 text-[8px] text-slate-500 px-1 rounded">
                              Final Ref: {match.referee}
                            </span>

                            <div className="space-y-1.5 pt-2">
                              <div className={`flex justify-between text-xs font-bold ${isWinner1 ? 'text-amber-600 dark:text-amber-400 font-black text-sm' : 'text-slate-500'}`}>
                                <span className="truncate max-w-[130px]">{match.team1Name}</span>
                                <span>{match.score1 ?? '-'}</span>
                              </div>
                              <div className={`flex justify-between text-xs font-bold ${isWinner2 ? 'text-amber-600 dark:text-amber-400 font-black text-sm' : 'text-slate-500'}`}>
                                <span className="truncate max-w-[130px]">{match.team2Name}</span>
                                <span>{match.score2 ?? '-'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {matches.filter(m => m.tournamentId === selectedTournament.id && m.round === 3).length === 0 && (
                      <p className="text-xs text-slate-400 italic">Aguardando semifinais.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* 3. TEAM & PLAYERS MANAGER SECTION */}
        {activeSection === 'teams' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* MY ACTIVE TEAM SHEET (6 columns) */}
            <div className="xl:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Minha Equipe Competitiva
                </h3>
                <span className="text-[10px] text-indigo-500 font-mono">ID: {myTeam.id}</span>
              </div>

              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-150 dark:border-slate-850">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white text-xl font-black">
                      🛡️
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-850 dark:text-slate-100">
                        {myTeam.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold">
                        Nível de Clã 12 • {myTeam.wins} Vitórias / {myTeam.losses} Derrotas
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleRenameTeam} className="flex gap-1.5 w-full sm:w-auto">
                    <input
                      type="text"
                      required
                      placeholder="Novo Nome"
                      value={newTeamNameInput}
                      onChange={(e) => setNewTeamNameInput(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none w-full sm:w-32"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
                    >
                      Renomear
                    </button>
                  </form>
                </div>

                {/* Team Members */}
                <div className="space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Escalação Ativa</span>
                  
                  {myTeam.members.map(member => (
                    <div
                      key={member.id}
                      className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs">
                          👤
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-105">
                              {member.name}
                            </span>
                            {member.role === 'leader' && (
                              <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1 rounded font-bold">
                                Líder
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {member.badge} • Nvl {member.level}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          member.status === 'online' ? 'bg-emerald-500' : member.status === 'playing' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                        }`} />
                        <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                          {member.status === 'playing' ? 'Jogando' : 'Online'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SHARED INVENTORY & BADGES UNLOCKED (6 columns) */}
            <div className="xl:col-span-6 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Premiações, Badges &amp; Itens Conquistados
              </h3>

              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl space-y-5">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest block">Badges Desbloqueadas ({unlockedBadges.length})</span>
                  <div className="flex flex-wrap gap-2">
                    {unlockedBadges.map((badge, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-900/40 flex items-center gap-1 shadow-sm"
                      >
                        <Award className="w-3.5 h-3.5" /> {badge}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">Arsenal &amp; Itens do Esquadrão ({wonItems.length})</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {wonItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2"
                      >
                        <span className="text-lg">🎒</span>
                        <div>
                          <span className="text-xs font-black text-slate-850 dark:text-slate-100 block">{item}</span>
                          <span className="text-[9px] text-slate-400 font-bold">REGISTRADO EM BLOCKCHAIN</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/30 rounded-xl text-[11px] leading-relaxed text-indigo-700 dark:text-indigo-400 font-semibold">
                  🏆 Seu esquadrão pode compartilhar itens e badges coletados para aumentar o poder competitivo total nos campeonatos com restrição de Gear.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 4. CALENDAR & AGENDA SECTION */}
        {activeSection === 'schedule' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* MATCHES TIMELINE (7 columns) */}
            <div className="xl:col-span-7 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Próximos Eventos da Agenda ({agenda.length})
              </h3>

              <div className="space-y-3">
                {agenda.map(event => {
                  return (
                    <div
                      key={event.id}
                      className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold ${
                          event.type === 'match' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500' :
                          event.type === 'deadline' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500' : 'bg-blue-50 dark:bg-blue-950/40 text-blue-500'
                        }`}>
                          {event.type === 'match' ? '⚔️' : event.type === 'deadline' ? '⏰' : '🎉'}
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-tight">
                            {event.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-bold font-mono">
                            {event.game} • Referee: {event.referee}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-indigo-500 font-black font-mono bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                          {event.time}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase mt-1">Alocado por IA</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SEED CALENDAR STATS (5 columns) */}
            <div className="xl:col-span-5 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Lobby Calendário Cron
              </h3>

              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl space-y-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Inscrições &amp; Prazos</span>
                
                <div className="space-y-3">
                  <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">Copa Suprema Gamezon</span>
                      <span className="text-[10px] text-slate-400">Em andamento (Round 2)</span>
                    </div>
                    <span className="text-[10px] font-black text-amber-500">LIVE 🔴</span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">Masters do Bairro</span>
                      <span className="text-[10px] text-slate-400">Restam 4 vagas de equipes</span>
                    </div>
                    <span className="text-[10px] font-black text-indigo-500">Amanhã</span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">Campeonato Secreto VIP</span>
                      <span className="text-[10px] text-slate-400">Inscrição requer código de convite</span>
                    </div>
                    <span className="text-[10px] font-black text-indigo-500">14 de Julho</span>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-150 dark:border-amber-900/30 rounded-xl flex gap-2">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold leading-normal">
                    Fique atento aos prazos! W.O. automático de 15 minutos de tolerância monitorado por nosso referee eletrônico.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 5. LEADERBOARDS & STATS SECTION */}
        {activeSection === 'ranking' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* LEADERBOARDS (7 columns) */}
            <div className="xl:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Leaderboard Competitiva Oficial
                </h3>
                <span className="text-[10px] text-indigo-500 font-bold">Atualizado a cada 5 segundos</span>
              </div>

              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl shadow-sm space-y-5">
                {/* TEAMS LEADERBOARD */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Classificação de Equipes (Clãs)</span>
                  <div className="divide-y divide-slate-150 dark:divide-slate-850">
                    {PRESET_LEADERBOARD_TEAMS.map((team, idx) => (
                      <div
                        key={idx}
                        className="py-3 flex items-center justify-between text-xs font-mono font-bold"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-5 text-center font-black ${
                            team.rank === 1 ? 'text-amber-500 text-sm' : team.rank === 2 ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {team.rank === 1 ? '🥇' : team.rank === 2 ? '🥈' : team.rank === 3 ? '🥉' : team.rank}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-bold font-sans">
                            {team.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-6">
                          <span className="text-[10px] text-slate-400 font-sans">
                            Win Rate: <strong className="text-emerald-500">{team.winRate}</strong>
                          </span>
                          <span className="text-indigo-500 font-black">
                            {team.points} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PLAYERS LEADERBOARD */}
                <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest block">Classificação de Jogadores (Solo MMR)</span>
                  <div className="divide-y divide-slate-150 dark:divide-slate-850">
                    {PRESET_LEADERBOARD_PLAYERS.map((player, idx) => (
                      <div
                        key={idx}
                        className="py-3 flex items-center justify-between text-xs font-mono font-bold"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-5 text-center font-black ${
                            player.rank === 1 ? 'text-amber-500 text-sm' : player.rank === 2 ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : player.rank}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-bold font-sans">
                            {player.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-6">
                          <span className="text-[10px] text-slate-400 font-sans">
                            Jogos: <strong className="text-slate-600 dark:text-slate-350">{player.played}</strong>
                          </span>
                          <span className="text-purple-500 font-black">
                            {player.points} MMR
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* PERFORMANCE CHARTS & STATS (5 columns) */}
            <div className="xl:col-span-5 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Estatísticas de Combate
              </h3>

              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl space-y-5">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Visão de Performance</span>
                  <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 uppercase">Resumo Tático Gladiadores</h4>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">K/D Ratio Médio</span>
                    <strong className="text-lg text-indigo-500 font-black font-mono">2.45</strong>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Precisão de Tiro</span>
                    <strong className="text-lg text-purple-500 font-black font-mono">68.2%</strong>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Win Streak Máximo</span>
                    <strong className="text-lg text-emerald-500 font-black font-mono">8 Vitórias</strong>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Avg Score p/ Min</span>
                    <strong className="text-lg text-amber-500 font-black font-mono">582</strong>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nível de Sincronia</span>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '85%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Sinergia de Time: 85%</span>
                    <span>Meta ideal alcançada</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 6. LIVES & REPLAYS HUB SECTION */}
        {activeSection === 'media' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* ACTIVE LIVE STREAM SIMULATOR (7 columns) */}
            <div className="xl:col-span-7 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Live Stream Oficial (Simulada em Tempo Real)
              </h3>

              <div className="bg-slate-950 border border-slate-850 rounded-3xl overflow-hidden shadow-lg relative">
                
                {/* Stream visual content */}
                <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                  <Video className="w-16 h-16 text-indigo-500/30 animate-pulse absolute" />
                  
                  {/* Stream Watermark Info */}
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> AO VIVO
                  </div>

                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-slate-200 text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg">
                    FPS: 60 • BITRATE: 4500 Kbps • RESOLUTION: 1080p
                  </div>

                  <div className="text-center space-y-2 p-6 z-10">
                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest font-mono">
                      Copa Suprema Gamezon • Semifinal 1
                    </p>
                    <h5 className="text-base font-black text-white uppercase tracking-tight">
                      Gladiadores Gamezone vs Valkyries Esports
                    </h5>
                    <div className="flex items-center justify-center gap-4 text-xs font-mono font-black pt-2 text-slate-400">
                      <span>GLA 14</span>
                      <span className="p-1 bg-slate-800 rounded text-red-500 text-[10px] animate-pulse">LIVE GAMEPLAY</span>
                      <span>VAL 11</span>
                    </div>
                  </div>

                  {/* Volume controllers overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/50 backdrop-blur-sm p-2 rounded-xl text-white">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { playSound.click(); setIsMuted(!isMuted); }}
                        className="p-1 text-slate-300 hover:text-white cursor-pointer"
                      >
                        <Volume2 className={`w-4 h-4 ${isMuted ? 'text-red-500 line-through' : ''}`} />
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : streamVolume}
                        onChange={(e) => {
                          setStreamVolume(parseInt(e.target.value));
                          setIsMuted(false);
                        }}
                        className="w-16 accent-indigo-500 h-1 rounded-lg"
                      />
                    </div>

                    <span className="text-[10px] text-slate-300 font-bold">Auditor Técnico Alocado: Juiz_Robo_Ref</span>
                  </div>
                </div>

                {/* Broadcast Chat integration */}
                <div className="p-4 bg-slate-900 border-t border-slate-850 grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8 space-y-2 max-h-48 overflow-y-auto scrollbar-none text-xs">
                    {liveChat.map(msg => (
                      <div key={msg.id} className="text-slate-300">
                        <strong className={`mr-1 ${msg.isVip ? 'text-amber-400' : 'text-indigo-400'}`}>
                          {msg.isVip ? '💎 ' : ''}{msg.user}:
                        </strong>
                        <span>{msg.text}</span>
                        <span className="text-[8px] text-slate-500 ml-2 font-mono">{msg.time}</span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={sendLiveChat} className="md:col-span-4 flex flex-col justify-end gap-2">
                    <input
                      type="text"
                      placeholder="Envie sua torcida..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      Enviar Cheer 🚀
                    </button>
                  </form>
                </div>

              </div>
            </div>

            {/* SAVED TOURNAMENT REPLAYS (5 columns) */}
            <div className="xl:col-span-5 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Replays Gravados &amp; Histórico ({replays.length})
              </h3>

              <div className="space-y-3">
                {replays.map(rep => {
                  return (
                    <div
                      key={rep.id}
                      className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl space-y-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[9px] text-slate-400 font-mono font-bold uppercase block">
                            {rep.game} • {rep.date}
                          </span>
                          <h4 className="text-xs font-black text-slate-850 dark:text-slate-100">
                            {rep.title}
                          </h4>
                          <span className="text-[10px] text-indigo-500 font-bold block mt-1">
                            Duração: {rep.duration} • Visualizações: {rep.views}
                          </span>
                        </div>

                        <span className="text-xs text-amber-500 font-bold font-mono">
                          ⭐ {rep.rating}
                        </span>
                      </div>

                      {/* Interactive rate stars */}
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-900 pt-2 text-[11px]">
                        <span className="text-slate-400 font-bold">Avaliar Gravação:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => {
                            const isSelected = rep.userRating && star <= rep.userRating;
                            return (
                              <button
                                key={star}
                                onClick={() => handleRateReplay(rep.id, star)}
                                className={`text-base cursor-pointer hover:scale-125 transition-all ${
                                  isSelected ? 'opacity-100' : 'opacity-30 hover:opacity-80'
                                }`}
                              >
                                ⭐
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* 7. MODERATION & REFEREE CONSOLE */}
        {activeSection === 'referee' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* ACTIVE DISPUTES & SCORES OVERRIDE (7 columns) */}
            <div className="xl:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Controle de Arbitragem &amp; Conflitos
                </h3>
                <span className="text-[10px] font-mono bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 px-2 rounded">
                  Status: Juiz Principal
                </span>
              </div>

              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl shadow-sm space-y-5">
                
                {/* DISPUTES REVIEW PANEL */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">Lista de Disputas Pendentes</span>
                  
                  {matches
                    .filter(m => m.tournamentId === selectedTournament.id && m.status === 'live')
                    .map(match => (
                      <div
                        key={match.id}
                        className="p-4 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] text-rose-600 dark:text-rose-400 font-black uppercase">Fase do Torneio • Round {match.round}</span>
                            <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-tight mt-0.5">
                              {match.team1Name} vs {match.team2Name}
                            </h4>
                          </div>

                          <span className="text-[10px] text-slate-400 font-mono">ID: {match.id}</span>
                        </div>

                        {/* Interactive referee scores override */}
                        <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 font-bold block mb-1">Declarar Placar Final</span>
                            <div className="flex items-center gap-1.5 font-mono">
                              <button
                                onClick={() => handleRefereeOverride(match.id, 16, 12)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-black cursor-pointer"
                              >
                                16 x 12
                              </button>
                              <button
                                onClick={() => handleRefereeOverride(match.id, 16, 14)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-black cursor-pointer"
                              >
                                16 x 14
                              </button>
                              <button
                                onClick={() => handleRefereeOverride(match.id, 14, 16)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg font-black cursor-pointer"
                              >
                                14 x 16
                              </button>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 block font-bold uppercase">Ação Judicial</span>
                            <button
                              onClick={() => triggerDispute(match.id, 'Análise de integridade de ping requerida por lag')}
                              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-bold text-[10px] mt-1 cursor-pointer"
                            >
                              Sinalizar Disputa ⚠️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                  {matches.filter(m => m.tournamentId === selectedTournament.id && m.status === 'live').length === 0 && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400 italic">
                      Nenhuma partida em progresso para arbitrar neste momento.
                    </div>
                  )}
                </div>

                {/* MODERATOR INTEGRITY RULE LIST */}
                <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-850">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Diretrizes do Regulamento Geral</span>
                  <ul className="text-xs text-slate-500 space-y-1.5 font-bold">
                    <li>🛡️ 1. Qualquer uso de pacotes de rede adulterados aciona ban automático no banco de dados.</li>
                    <li>🛡️ 2. Os árbitros têm poder absoluto para anular scores baseados em telemetria lag-switch.</li>
                    <li>🛡️ 3. O payout de moedas e XP é sincronizado via EventBus assíncrono pós-homologação.</li>
                  </ul>
                </div>

              </div>
            </div>

            {/* AUDIT LOG TRAIL (5 columns) */}
            <div className="xl:col-span-5 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Auditoria de Eventos Competitivos
              </h3>

              <div className="bg-slate-950 border border-slate-850 p-5 rounded-3xl font-mono text-xs text-slate-300 space-y-4 max-h-[450px] overflow-y-auto scrollbar-none shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-indigo-400 font-bold">STREAM DE AUDITORIA</span>
                  <span className="text-emerald-500 font-bold animate-pulse">LIVE ●</span>
                </div>

                <div className="space-y-3">
                  {auditLogs.map(log => {
                    const badgeColors = {
                      system: 'text-blue-400',
                      registration: 'text-indigo-400',
                      referee: 'text-amber-400',
                      payout: 'text-emerald-400',
                      anti_cheat: 'text-rose-400'
                    };

                    return (
                      <div key={log.id} className="space-y-0.5 leading-normal">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>{log.timestamp} • {log.actor}</span>
                          <span className={`${badgeColors[log.type]} font-bold`}>
                            [{log.type.toUpperCase()}]
                          </span>
                        </div>
                        <p className="text-slate-200">
                          <strong className="text-white mr-1">&gt; {log.action}:</strong>
                          {log.details}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* MODAL FOR TOURNAMENT CREATION */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => { playSound.click(); setShowCreateModal(false); }}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-black text-slate-850 dark:text-slate-100 uppercase tracking-tight flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-slate-900">
                <Sliders className="w-4.5 h-4.5 text-indigo-500" />
                Criar Novo Torneio / Campeonato
              </h3>

              <form onSubmit={handleCreateTournament} className="space-y-4 pt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Nome do Torneio</label>
                  <input
                    type="text"
                    required
                    value={newTournName}
                    onChange={(e) => setNewTournName(e.target.value)}
                    placeholder="Ex: Taça da Amizade Gamezon"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Tipo</label>
                    <select
                      value={newTournType}
                      onChange={(e) => setNewTournType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="public">Público (Todos)</option>
                      <option value="private">Privado (VIP)</option>
                      <option value="community">Comunidade</option>
                      <option value="special">Evento Especial</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Game</label>
                    <select
                      value={newTournGame}
                      onChange={(e) => setNewTournGame(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Naves Espaciais Retro">Naves Espaciais Retro</option>
                      <option value="Arena Combat 2D">Arena Combat 2D</option>
                      <option value="Velocidade Extrema Grid">Velocidade Extrema Grid</option>
                      <option value="Galaxy Conquest Elite">Galaxy Conquest Elite</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Taxa de Moedas</label>
                    <input
                      type="number"
                      min="0"
                      value={newTournFee}
                      onChange={(e) => setNewTournFee(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Premiação Moedas</label>
                    <input
                      type="number"
                      min="10"
                      value={newTournPrizeCoins}
                      onChange={(e) => setNewTournPrizeCoins(parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { playSound.click(); setShowCreateModal(false); }}
                    className="w-1/2 py-2 border border-slate-200 dark:border-slate-880 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Confirmar Torneio
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
