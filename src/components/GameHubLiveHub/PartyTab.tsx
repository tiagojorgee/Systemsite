import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Plus, 
  CheckCircle2, 
  Sparkles, 
  Lock, 
  Activity, 
  Send, 
  Shield, 
  ShieldAlert, 
  LogOut, 
  Tv, 
  Monitor, 
  Play, 
  Flame, 
  UserPlus, 
  Search, 
  Compass, 
  Trash2, 
  History, 
  UserCheck, 
  FileText, 
  Code, 
  Share2, 
  Heart, 
  Award, 
  Briefcase, 
  Layers, 
  Video,
  X,
  Radio,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { playSound } from '../../utils/audio';

// Custom structure for a member in our Party Gamezon
export interface GamezonMember {
  id: string;
  name: string;
  avatarSeed: string;
  isLeader: boolean;
  isModerator: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  status: 'idle' | 'ready' | 'in-game';
  level: number;
  roleClass: 'Tank' | 'Sniper' | 'Healer' | 'DPS' | 'Lobby Host';
  bio: string;
  achievementsCount: number;
  sharedScreenActive: boolean;
  sharedLiveActive: boolean;
  sharedReplayActive: boolean;
  inventory: { name: string; rarity: 'Lendário' | 'Épico' | 'Raro' | 'Comum'; icon: string; power: number }[];
}

export interface PartyInvite {
  id: string;
  squadName: string;
  senderName: string;
  squadCode: string;
  avatarSeed: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  action: string;
  details: string;
  payload: Record<string, any>;
  severity: 'info' | 'warning' | 'security' | 'success';
}

const PRESET_INVENTORY_ME = [
  { name: 'Canhão de Plasma Orbital', rarity: 'Lendário' as const, icon: '⚡', power: 95 },
  { name: 'Escudo Protetor Magnético', rarity: 'Épico' as const, icon: '🛡️', power: 82 },
  { name: 'Bota Holográfica de Drift', rarity: 'Raro' as const, icon: '🏎️', power: 65 }
];

const PRESET_INVENTORY_FRIEND1 = [
  { name: 'Rifle de Sniper Quântico', rarity: 'Lendário' as const, icon: '🎯', power: 98 },
  { name: 'Faca Tática de Carbono', rarity: 'Raro' as const, icon: '🔪', power: 50 }
];

const PRESET_INVENTORY_FRIEND2 = [
  { name: 'Propulsor de Matéria Escura', rarity: 'Épico' as const, icon: '🚀', power: 88 },
  { name: 'Kit de Cura Nano-Robótico', rarity: 'Lendário' as const, icon: '🧪', power: 94 }
];

export const PartyTab: React.FC = () => {
  // Party state
  const [squadCode, setSquadCode] = useState<string>('SQD-884');
  const [squadName, setSquadName] = useState<string>('Gladiadores Gamezone');
  const [squadMaxMembers, setSquadMaxMembers] = useState<number>(4);
  const [squadPrivacy, setSquadPrivacy] = useState<'public' | 'private'>('public');
  const [isLobbyActive, setIsLobbyActive] = useState<boolean>(true);

  // Members state
  const [members, setMembers] = useState<GamezonMember[]>(() => {
    const saved = localStorage.getItem('gamezon_party_members');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [
      {
        id: 'usr-me',
        name: 'Você (Challenger)',
        avatarSeed: 'me',
        isLeader: true,
        isModerator: true,
        isSpeaking: false,
        isMuted: false,
        status: 'idle',
        level: 45,
        roleClass: 'Tank',
        bio: 'Buscando recordes mundiais na arena de naves.',
        achievementsCount: 24,
        sharedScreenActive: false,
        sharedLiveActive: false,
        sharedReplayActive: false,
        inventory: PRESET_INVENTORY_ME
      },
      {
        id: 'usr-1',
        name: 'X-Sniper_Pro',
        avatarSeed: '1',
        isLeader: false,
        isModerator: true,
        isSpeaking: false,
        isMuted: false,
        status: 'ready',
        level: 38,
        roleClass: 'Sniper',
        bio: 'Sniper de elite da guilda principal.',
        achievementsCount: 15,
        sharedScreenActive: false,
        sharedLiveActive: false,
        sharedReplayActive: false,
        inventory: PRESET_INVENTORY_FRIEND1
      },
      {
        id: 'usr-2',
        name: 'Lady_Gamer',
        avatarSeed: '2',
        isLeader: false,
        isModerator: false,
        isSpeaking: false,
        isMuted: false,
        status: 'idle',
        level: 42,
        roleClass: 'DPS',
        bio: 'Streamer oficial do LiveHub Gamezone.',
        achievementsCount: 31,
        sharedScreenActive: false,
        sharedLiveActive: false,
        sharedReplayActive: false,
        inventory: PRESET_INVENTORY_FRIEND2
      }
    ];
  });

  // Local device media control settings
  const [isMicMuted, setIsMicMuted] = useState<boolean>(true);
  const [isDeafened, setIsDeafened] = useState<boolean>(false);
  const [voiceQuality, setVoiceQuality] = useState<'ultra' | 'high' | 'normal'>('high');

  // Party chat room log
  const [partyChat, setPartyChat] = useState<{ id: string; sender: string; text: string; time: string; type?: 'system' | 'chat' }[]>([
    { id: 'm1', sender: 'Lady_Gamer', text: 'Eai pessoal! Preparados para faturar moedas no torneio?', time: '11:48', type: 'chat' },
    { id: 'm2', sender: 'X-Sniper_Pro', text: 'Sempre! Só falta o líder começar a partida!', time: '11:49', type: 'chat' },
    { id: 'sys-1', sender: 'Sistema', text: 'Lady_Gamer entrou no canal de voz por SFU.', time: '11:49', type: 'system' }
  ]);
  const [chatInput, setChatInput] = useState<string>('');

  // Media Theatre Shares State
  const [activeScreenShare, setActiveScreenShare] = useState<{ owner: string; url: string; fps: number; resolution: string } | null>(null);
  const [activeLiveShare, setActiveLiveShare] = useState<{ owner: string; title: string; viewers: number } | null>(null);
  const [activeReplayShare, setActiveReplayShare] = useState<{ owner: string; gameTitle: string; sizeMb: number; rating: number } | null>(null);

  // Profile modal viewing state
  const [selectedProfile, setSelectedProfile] = useState<GamezonMember | null>(null);

  // Invite Smart AI Recommender State
  const [friendsOnline, setFriendsOnline] = useState<{ id: string; name: string; avatarSeed: string; game: string; level: number; matchPercent: number; recommendedRole: string }[]>([
    { id: 'fo-1', name: 'Cyber_Samurai', avatarSeed: 'samurai', game: 'Nave Espacial Arcade', level: 22, matchPercent: 95, recommendedRole: 'DPS' },
    { id: 'fo-2', name: 'Valkyrae_Pro', avatarSeed: 'rae', game: 'Lobby Chat Lounge', level: 55, matchPercent: 88, recommendedRole: 'Healer' },
    { id: 'fo-3', name: 'Mod_Z', avatarSeed: 'modz', game: 'Retro Speed Racer', level: 29, matchPercent: 74, recommendedRole: 'Tank' },
    { id: 'fo-4', name: 'Fallen_Angel', avatarSeed: 'angel', game: 'Inativo', level: 15, matchPercent: 62, recommendedRole: 'DPS' }
  ]);

  const [receivedInvites, setReceivedInvites] = useState<PartyInvite[]>([
    { id: 'inv-1', squadName: 'Vingadores do Arcade', senderName: 'Cyber_Samurai', squadCode: 'SQD-771', avatarSeed: 'samurai' },
    { id: 'inv-2', squadName: 'Fórmula Velocidade 1', senderName: 'Retro_Racer_Boss', squadCode: 'SQD-909', avatarSeed: 'racer' }
  ]);

  const [customSquadCodeInput, setCustomSquadCodeInput] = useState<string>('');

  // Gameplay actions states
  const [isMatchmaking, setIsMatchmaking] = useState<boolean>(false);
  const [matchmakingTimer, setMatchmakingTimer] = useState<number>(0);
  const [registeredTournament, setRegisteredTournament] = useState<string | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('gamezon_party_audit_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [
      {
        id: 'log-1',
        timestamp: '11:45:10',
        actorName: 'Você (Challenger)',
        action: 'PARTY_CREATE',
        details: 'Criou a party Gladiadores Gamezone com ID SQD-884.',
        payload: { squadId: 'SQD-884', maxMembers: 4, privacy: 'public' },
        severity: 'success'
      },
      {
        id: 'log-2',
        timestamp: '11:46:22',
        actorName: 'X-Sniper_Pro',
        action: 'MEMBER_JOIN',
        details: 'Entrou no lobby via link de convite rápido.',
        payload: { method: 'quick_invite', device: 'Linux Desktop' },
        severity: 'info'
      },
      {
        id: 'log-3',
        timestamp: '11:47:05',
        actorName: 'Você (Challenger)',
        action: 'PROMOTE_MODERATOR',
        details: 'Promoveu X-Sniper_Pro a Moderador do grupo.',
        payload: { targetUserId: 'usr-1', targetRole: 'Moderador' },
        severity: 'success'
      },
      {
        id: 'log-4',
        timestamp: '11:48:40',
        actorName: 'Lady_Gamer',
        action: 'MEMBER_JOIN',
        details: 'Entrou no lobby da equipe de forma pública.',
        payload: { code: 'SQD-884' },
        severity: 'info'
      }
    ];
  });

  // Form for custom party creation
  const [creationForm, setCreationForm] = useState({
    name: 'Gladiadores Gamezone',
    maxMembers: 4,
    privacy: 'public' as 'public' | 'private'
  });
  const [showCreationModal, setShowCreationModal] = useState<boolean>(false);

  // Sound & local storage sync
  useEffect(() => {
    localStorage.setItem('gamezon_party_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('gamezon_party_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Push an audit log
  const pushAuditLog = (actorName: string, action: string, details: string, payload: Record<string, any>, severity: 'info' | 'warning' | 'security' | 'success' = 'info') => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      actorName,
      action,
      details,
      payload,
      severity
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 100)); // Limit to last 100 logs
  };

  // Automated Real-time Simulation: Auto-detection of online friends joining & voice cues
  useEffect(() => {
    const friendTimer = setInterval(() => {
      // 15% chance of simulating a friend logging in or changing game
      if (Math.random() > 0.8 && isLobbyActive) {
        const actionDecider = Math.random();
        if (actionDecider > 0.6) {
          // Friend auto-detection simulation
          const names = ['Samurai_Gold', 'Sniper_V8', 'Kerrigan_Pro', 'Zero_Cool', 'Racer_X'];
          const newFriendName = names[Math.floor(Math.random() * names.length)];
          pushAuditLog(
            'Serviço Social',
            'AUTO_FRIEND_DETECTION',
            `Detecção Inteligente: ${newFriendName} acabou de ficar online e está disponível para convite.`,
            { detectedUser: newFriendName, latencyMs: 12, matchRate: '92%' },
            'success'
          );

          // Add to recommended list temporarily or update recommendation
          setFriendsOnline(prev => {
            const exists = prev.some(f => f.name === newFriendName);
            if (!exists) {
              return [
                {
                  id: `fo-new-${Date.now()}`,
                  name: newFriendName,
                  avatarSeed: 'auto',
                  game: 'Procurando Equipe',
                  level: Math.floor(Math.random() * 30) + 15,
                  matchPercent: Math.floor(Math.random() * 25) + 75,
                  recommendedRole: ['DPS', 'Tank', 'Healer'][Math.floor(Math.random() * 3)] as any
                },
                ...prev
              ];
            }
            return prev;
          });
        } else if (actionDecider > 0.3) {
          // Received invite simulation
          const inviteSquads = ['Arcade Titans', 'Retro Speed Masters', 'Glitch Hunters'];
          const randSquadName = inviteSquads[Math.floor(Math.random() * inviteSquads.length)];
          const randSender = ['GamerPro_99', 'Turbo_Charged', 'Matrix_Ne0'][Math.floor(Math.random() * 3)];
          const randCode = `SQD-${Math.floor(Math.random() * 900) + 100}`;
          
          setReceivedInvites(prev => {
            if (prev.length < 5) {
              return [...prev, {
                id: `inv-${Date.now()}`,
                squadName: randSquadName,
                senderName: randSender,
                squadCode: randCode,
                avatarSeed: 'rand'
              }];
            }
            return prev;
          });

          pushAuditLog(
            randSender,
            'INVITATION_RECEIVED',
            `Recebeu convite inteligente para entrar na equipe "${randSquadName}" (${randCode}).`,
            { fromUser: randSender, targetSquad: randSquadName, code: randCode },
            'info'
          );
        }
      }
    }, 12000);

    return () => clearInterval(friendTimer);
  }, [isLobbyActive]);

  // Voice signal simulation
  useEffect(() => {
    const voiceInterval = setInterval(() => {
      if (!isLobbyActive) return;
      setMembers(curr => curr.map(m => {
        if (m.id === 'usr-me') {
          return { ...m, isSpeaking: !isMicMuted && Math.random() > 0.4 };
        }
        if (m.id === 'usr-1' && !m.isMuted) {
          return { ...m, isSpeaking: !isDeafened && Math.random() > 0.65 };
        }
        if (m.id === 'usr-2' && !m.isMuted) {
          return { ...m, isSpeaking: !isDeafened && Math.random() > 0.3 };
        }
        return m;
      }));
    }, 1100);

    return () => clearInterval(voiceInterval);
  }, [isMicMuted, isDeafened, isLobbyActive]);

  // Matchmaking simulation countdown ticker
  useEffect(() => {
    let interval: any;
    if (isMatchmaking) {
      interval = setInterval(() => {
        setMatchmakingTimer(prev => {
          // Auto find match after 12 seconds
          if (prev >= 11) {
            setIsMatchmaking(false);
            playSound.victory();
            pushAuditLog(
              'Matchmaking SFU',
              'MATCH_FOUND',
              'Partida encontrada! Servidor dedicado Gamezone Arena-Tokyo Alocado.',
              { serverId: 'GZA-771-WEST', playersMatchedCount: 8, pingMs: 14 },
              'success'
            );

            // Set everyone to in-game
            setMembers(curr => curr.map(m => ({ ...m, status: 'in-game' })));
            
            setPartyChat(p => [
              ...p,
              { id: `sys-matched-${Date.now()}`, sender: 'Sistema', text: '🏆 PARTIDA ENCONTRADA! Todos os membros foram sincronizados no servidor GZA-771-WEST. Boa sorte!', time: new Date().toLocaleTimeString().slice(0, 5), type: 'system' }
            ]);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setMatchmakingTimer(0);
    }
    return () => clearInterval(interval);
  }, [isMatchmaking]);

  // Interaction Handlers
  const toggleMic = () => {
    playSound.click();
    setIsMicMuted(!isMicMuted);
    pushAuditLog(
      'Você (Challenger)',
      'VOICE_MIC_TOGGLE',
      `Alterou estado do microfone para: ${!isMicMuted ? 'MUDADO / SILENCIOSO' : 'ATIVO'}`,
      { previousState: !isMicMuted, newState: isMicMuted },
      'info'
    );
  };

  const toggleDeaf = () => {
    playSound.click();
    setIsDeafened(!isDeafened);
    if (!isDeafened) {
      setIsMicMuted(true);
    }
    pushAuditLog(
      'Você (Challenger)',
      'VOICE_DEAF_TOGGLE',
      `Alterou silenciamento de áudio para: ${!isDeafened ? 'MUTADO' : 'ESCUTANDO'}`,
      { previousState: !isDeafened, newState: isDeafened },
      'info'
    );
  };

  const toggleMemberReady = (id: string) => {
    playSound.click();
    setMembers(curr => curr.map(m => {
      if (m.id === id) {
        const nextStatus = m.status === 'ready' ? 'idle' : 'ready';
        pushAuditLog(
          m.name,
          'STATUS_TOGGLE',
          `Alterou status de preparação para: ${nextStatus === 'ready' ? 'PRONTO ✓' : 'AGUARDANDO'}`,
          { memberId: id, status: nextStatus },
          'info'
        );
        return { ...m, status: nextStatus };
      }
      return curr.map(x => x)[0] === m ? m : m; // Keep immutable
    }));
  };

  // Create party action
  const handleCreateParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creationForm.name.trim()) return;

    playSound.jackpot();
    const generatedCode = `SQD-${Math.floor(Math.random() * 800) + 100}`;
    setSquadCode(generatedCode);
    setSquadName(creationForm.name);
    setSquadMaxMembers(creationForm.maxMembers);
    setSquadPrivacy(creationForm.privacy);
    setIsLobbyActive(true);
    setShowCreationModal(false);

    // Reset members to just me
    const meOnly: GamezonMember[] = [{
      id: 'usr-me',
      name: 'Você (Challenger)',
      avatarSeed: 'me',
      isLeader: true,
      isModerator: true,
      isSpeaking: false,
      isMuted: false,
      status: 'idle',
      level: 45,
      roleClass: 'Tank',
      bio: 'Buscando recordes mundiais na arena de naves.',
      achievementsCount: 24,
      sharedScreenActive: false,
      sharedLiveActive: false,
      sharedReplayActive: false,
      inventory: PRESET_INVENTORY_ME
    }];
    setMembers(meOnly);
    setPartyChat([
      { id: 'sys-init', sender: 'Sistema', text: `Equipe "${creationForm.name}" criada com sucesso! Compartilhe o código ${generatedCode} para convidar amigos.`, time: new Date().toLocaleTimeString().slice(0, 5), type: 'system' }
    ]);

    pushAuditLog(
      'Você (Challenger)',
      'PARTY_CREATE',
      `Criou com sucesso uma nova equipe: "${creationForm.name}" com o código de acesso ${generatedCode}.`,
      { name: creationForm.name, maxMembers: creationForm.maxMembers, privacy: creationForm.privacy, code: generatedCode },
      'success'
    );
  };

  // Exit party
  const handleLeaveParty = () => {
    playSound.purchase();
    setIsLobbyActive(false);
    pushAuditLog(
      'Você (Challenger)',
      'PARTY_LEAVE',
      `Saiu da equipe Gladiadores Gamezone e desativou o canal de áudio.`,
      { squadCode },
      'warning'
    );
    setMembers([]);
    setPartyChat([{ id: 'sys-left', sender: 'Sistema', text: 'Você saiu da equipe. Crie uma nova ou digite um código para entrar!', time: new Date().toLocaleTimeString().slice(0, 5), type: 'system' }]);
    
    // Clear media sharing
    setActiveScreenShare(null);
    setActiveLiveShare(null);
    setActiveReplayShare(null);
  };

  // Join party with code
  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSquadCodeInput.trim()) return;

    playSound.jackpot();
    const cleanCode = customSquadCodeInput.trim().toUpperCase();
    setSquadCode(cleanCode);
    setSquadName('Esquadrão Conectado');
    setSquadMaxMembers(4);
    setSquadPrivacy('public');
    setIsLobbyActive(true);

    // Simulate joining an online squad
    const joinedMembers: GamezonMember[] = [
      {
        id: 'usr-me',
        name: 'Você (Challenger)',
        avatarSeed: 'me',
        isLeader: false,
        isModerator: false,
        isSpeaking: false,
        isMuted: false,
        status: 'idle',
        level: 45,
        roleClass: 'Tank',
        bio: 'Buscando recordes mundiais na arena de naves.',
        achievementsCount: 24,
        sharedScreenActive: false,
        sharedLiveActive: false,
        sharedReplayActive: false,
        inventory: PRESET_INVENTORY_ME
      },
      {
        id: 'usr-3',
        name: 'Host_Master',
        avatarSeed: 'master',
        isLeader: true,
        isModerator: true,
        isSpeaking: false,
        isMuted: false,
        status: 'ready',
        level: 52,
        roleClass: 'Lobby Host',
        bio: 'Líder do clã Alfa.',
        achievementsCount: 50,
        sharedScreenActive: false,
        sharedLiveActive: false,
        sharedReplayActive: false,
        inventory: PRESET_INVENTORY_FRIEND2
      }
    ];

    setMembers(joinedMembers);
    setPartyChat([
      { id: 'sys-joined', sender: 'Sistema', text: `Você entrou na equipe "${cleanCode}" com sucesso!`, time: new Date().toLocaleTimeString().slice(0, 5), type: 'system' }
    ]);
    setCustomSquadCodeInput('');

    pushAuditLog(
      'Você (Challenger)',
      'PARTY_JOIN',
      `Iniciou login e autenticação na equipe com o código de acesso ${cleanCode}.`,
      { code: cleanCode, ipMatched: '192.168.12.112', sfuNode: 'sfu-node-4' },
      'success'
    );
  };

  // Manage member actions
  const handlePromoteToLeader = (member: GamezonMember) => {
    playSound.collect();
    setMembers(curr => curr.map(m => {
      if (m.id === member.id) {
        return { ...m, isLeader: true, isModerator: true };
      }
      if (m.id === 'usr-me') {
        return { ...m, isLeader: false }; // Pass leadership
      }
      return m;
    }));

    pushAuditLog(
      'Você (Challenger)',
      'LEADER_PROMOTION',
      `Passou a liderança da equipe para ${member.name}.`,
      { newLeaderId: member.id, newLeaderName: member.name },
      'warning'
    );

    setPartyChat(prev => [
      ...prev,
      { id: `sys-leader-${Date.now()}`, sender: 'Sistema', text: `👑 ${member.name} é o novo líder do grupo!`, time: new Date().toLocaleTimeString().slice(0, 5), type: 'system' }
    ]);
  };

  const handleToggleModerator = (member: GamezonMember) => {
    playSound.click();
    const nextModState = !member.isModerator;
    setMembers(curr => curr.map(m => {
      if (m.id === member.id) {
        return { ...m, isModerator: nextModState };
      }
      return m;
    }));

    pushAuditLog(
      'Você (Challenger)',
      'MODERATOR_TOGGLE',
      `Alterou privilégios de moderador de ${member.name} para: ${nextModState ? 'HABILITADO' : 'DESABILITADO'}.`,
      { targetUserId: member.id, isModerator: nextModState },
      'info'
    );

    setPartyChat(prev => [
      ...prev,
      { id: `sys-mod-${Date.now()}`, sender: 'Sistema', text: `🛡️ ${member.name} teve seus direitos de moderador ${nextModState ? 'concedidos' : 'revogados'}!`, time: new Date().toLocaleTimeString().slice(0, 5), type: 'system' }
    ]);
  };

  const handleMuteMember = (member: GamezonMember) => {
    playSound.click();
    const nextMuteState = !member.isMuted;
    setMembers(curr => curr.map(m => {
      if (m.id === member.id) {
        return { ...m, isMuted: nextMuteState, isSpeaking: nextMuteState ? false : m.isSpeaking };
      }
      return m;
    }));

    pushAuditLog(
      'Administração',
      'MEMBER_MUTE_TOGGLE',
      `Silenciou localmente áudio do jogador ${member.name}: ${nextMuteState ? 'MUTADO' : 'DESMUTADO'}.`,
      { targetId: member.id, isMuted: nextMuteState },
      'warning'
    );
  };

  const handleKickMember = (member: GamezonMember) => {
    playSound.purchase();
    setMembers(curr => curr.filter(m => m.id !== member.id));

    pushAuditLog(
      'Você (Challenger)',
      'MEMBER_KICK',
      `Expulsou o jogador ${member.name} da equipe por violação de protocolo ou espaço cheio.`,
      { kickedUserId: member.id, kickedUserName: member.name },
      'security'
    );

    setPartyChat(prev => [
      ...prev,
      { id: `sys-kick-${Date.now()}`, sender: 'Sistema', text: `🚪 ${member.name} foi expulso da equipe pelo administrador.`, time: new Date().toLocaleTimeString().slice(0, 5), type: 'system' }
    ]);
  };

  // Direct Team Chat Send
  const sendPartyMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !isLobbyActive) return;
    playSound.click();

    const userMessage = chatInput.trim();
    const currentTimeStr = new Date().toLocaleTimeString().slice(0, 5);

    setPartyChat(prev => [
      ...prev,
      { id: `msg-${Date.now()}`, sender: 'Você', text: userMessage, time: currentTimeStr, type: 'chat' }
    ]);
    setChatInput('');

    pushAuditLog(
      'Você (Challenger)',
      'CHAT_MESSAGE_SENT',
      `Enviou mensagem no chat do grupo: "${userMessage}".`,
      { length: userMessage.length },
      'info'
    );

    // Dynamic Mock Replies from squad members
    setTimeout(() => {
      if (!isLobbyActive) return;
      const responseDecider = Math.random();
      let replier = 'X-Sniper_Pro';
      let replyText = 'Entendido! Vamos pro play.';

      if (responseDecider > 0.5) {
        replier = 'Lady_Gamer';
        replyText = 'Boa! Já vou ligar minha live pra mostrar pra galera.';
      }

      setPartyChat(prev => [
        ...prev,
        { id: `msg-resp-${Date.now()}`, sender: replier, text: replyText, time: new Date().toLocaleTimeString().slice(0, 5), type: 'chat' }
      ]);
      playSound.collect();
    }, 1200);
  };

  // Media Share Triggers
  const handleShareScreen = () => {
    playSound.purchase();
    if (activeScreenShare) {
      setActiveScreenShare(null);
      setMembers(curr => curr.map(m => m.id === 'usr-me' ? { ...m, sharedScreenActive: false } : m));
      pushAuditLog(
        'Você (Challenger)',
        'SCREEN_SHARE_STOP',
        'Parou de compartilhar tela na Party.',
        {},
        'info'
      );
    } else {
      setActiveScreenShare({
        owner: 'Você (Challenger)',
        url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60',
        fps: 60,
        resolution: '1920x1080'
      });
      setMembers(curr => curr.map(m => m.id === 'usr-me' ? { ...m, sharedScreenActive: true } : m));
      pushAuditLog(
        'Você (Challenger)',
        'SCREEN_SHARE_START',
        'Iniciou transmissão de tela (Gameplay local) com codificação H.264 acelerada por GPU.',
        { bitrateKbps: 4500, fps: 60, resolution: '1080p' },
        'success'
      );
      setPartyChat(p => [...p, { id: `sys-ss-${Date.now()}`, sender: 'Sistema', text: '🖥️ Você começou a compartilhar sua tela para a equipe.', time: new Date().toLocaleTimeString().slice(0, 5), type: 'system' }]);
    }
  };

  const handleShareLive = () => {
    playSound.purchase();
    if (activeLiveShare) {
      setActiveLiveShare(null);
      setMembers(curr => curr.map(m => m.id === 'usr-me' ? { ...m, sharedLiveActive: false } : m));
      pushAuditLog(
        'Você (Challenger)',
        'LIVE_SHARE_STOP',
        'Encerrou compartilhamento do canal de transmissão ao vivo.',
        {},
        'info'
      );
    } else {
      setActiveLiveShare({
        owner: 'Você (Challenger)',
        title: 'Campanha de Naves Lendárias - Rumo ao Top 10',
        viewers: 1420
      });
      setMembers(curr => curr.map(m => m.id === 'usr-me' ? { ...m, sharedLiveActive: true } : m));
      pushAuditLog(
        'Você (Challenger)',
        'LIVE_SHARE_START',
        'Vinculou a transmissão do LiveHub oficial à sala da equipe.',
        { streamingServer: 'west-live-sfu', viewersCount: 1420 },
        'success'
      );
      setPartyChat(p => [...p, { id: `sys-sl-${Date.now()}`, sender: 'Sistema', text: '🎙️ Transmissão oficial compartilhada na equipe! Todos podem assistir agora.', time: new Date().toLocaleTimeString().slice(0, 5), type: 'system' }]);
    }
  };

  const handleShareReplay = () => {
    playSound.purchase();
    if (activeReplayShare) {
      setActiveReplayShare(null);
      setMembers(curr => curr.map(m => m.id === 'usr-me' ? { ...m, sharedReplayActive: false } : m));
      pushAuditLog(
        'Você (Challenger)',
        'REPLAY_SHARE_STOP',
        'Parou de transmitir o replay histórico do torneio.',
        {},
        'info'
      );
    } else {
      setActiveReplayShare({
        owner: 'Você (Challenger)',
        gameTitle: 'Nave Espacial Arcade - Recorde 120.000 pts',
        sizeMb: 42.4,
        rating: 9.8
      });
      setMembers(curr => curr.map(m => m.id === 'usr-me' ? { ...m, sharedReplayActive: true } : m));
      pushAuditLog(
        'Você (Challenger)',
        'REPLAY_SHARE_START',
        'Transmitiu arquivo de replay de partida gravada para análise de tática.',
        { replayBlobId: 'REP-ARC-102', sizeMb: 42.4, videoBitrateMbps: 8 },
        'success'
      );
      setPartyChat(p => [...p, { id: `sys-sr-${Date.now()}`, sender: 'Sistema', text: '📼 Replay histórico "Recorde 120k pts" compartilhado no painel da equipe.', time: new Date().toLocaleTimeString().slice(0, 5), type: 'system' }]);
    }
  };

  // Matchmaking & Tournaments Queue Triggers
  const handleStartMatchmaking = () => {
    playSound.victory();
    const nonReady = members.filter(m => m.status !== 'ready' && m.id !== 'usr-me');
    if (nonReady.length > 0) {
      pushAuditLog(
        'Matchmaking',
        'MATCHMAKING_BLOCKED',
        'Falha ao enfileirar: Há membros que não confirmaram preparação (status ready).',
        { nonReadyList: nonReady.map(m => m.name) },
        'warning'
      );
      setPartyChat(p => [...p, { id: `sys-fail-${Date.now()}`, sender: 'Sistema', text: '⚠️ Matchmaking cancelado: Lady_Gamer precisa dar "Pronto".', time: new Date().toLocaleTimeString().slice(0, 5), type: 'system' }]);
      return;
    }

    setIsMatchmaking(true);
    setMatchmakingTimer(0);
    pushAuditLog(
      'Você (Challenger)',
      'MATCHMAKING_ENQUEUE',
      'Iniciou enfileiramento inteligente de equipe na liga competitiva.',
      { squadSize: members.length, mmrAverage: 1250, regions: ['us-west', 'sa-east'] },
      'success'
    );
    setPartyChat(p => [...p, { id: `sys-queue-${Date.now()}`, sender: 'Sistema', text: '⚡ Buscando oponentes equilibrados para a equipe... Aguarde na fila.', time: new Date().toLocaleTimeString().slice(0, 5), type: 'system' }]);
  };

  const handleCancelMatchmaking = () => {
    playSound.click();
    setIsMatchmaking(false);
    pushAuditLog(
      'Você (Challenger)',
      'MATCHMAKING_DEQUEUE',
      'Cancelou busca de partida.',
      {},
      'warning'
    );
  };

  const handleRegisterTournament = (tournamentName: string) => {
    playSound.jackpot();
    setRegisteredTournament(tournamentName);
    pushAuditLog(
      'Você (Challenger)',
      'TOURNAMENT_REGISTER',
      `Inscreveu a equipe no campeonato oficial: ${tournamentName}.`,
      { teamName: squadName, squadCode, feePaidCoins: 25 },
      'success'
    );

    setPartyChat(p => [
      ...p,
      { id: `sys-tourn-${Date.now()}`, sender: 'Sistema', text: `🏆 INSCRIÇÃO EXECUTADA! Sua equipe está confirmada no torneio "${tournamentName}". Chaves alocadas.`, time: new Date().toLocaleTimeString().slice(0, 5), type: 'system' }
    ]);
  };

  const handleLeaveTournament = () => {
    playSound.click();
    setRegisteredTournament(null);
    pushAuditLog(
      'Você (Challenger)',
      'TOURNAMENT_LEAVE',
      'Removeu a equipe da tabela do campeonato.',
      { teamName: squadName },
      'warning'
    );
  };

  // Invite online friends action (intelligent recommendation helper)
  const handleInviteFriend = (friend: typeof friendsOnline[0]) => {
    playSound.victory();
    pushAuditLog(
      'Você (Challenger)',
      'SQUAD_INVITE_SENT',
      `Enviou convite inteligente de squad para ${friend.name} baseado no sistema de compatibilidade (${friend.matchPercent}% compatível).`,
      { friendId: friend.id, friendName: friend.name, roleClass: friend.recommendedRole, compatibility: `${friend.matchPercent}%` },
      'success'
    );

    setPartyChat(p => [...p, { id: `sys-invite-sent-${Date.now()}`, sender: 'Sistema', text: `✉️ Convite de squad enviado com inteligência artificial para ${friend.name}.`, time: new Date().toLocaleTimeString().slice(0, 5), type: 'system' }]);

    // Simulated accept invitation after 5 seconds!
    setTimeout(() => {
      if (members.length >= squadMaxMembers) {
        pushAuditLog(
          'Serviço de Grupo',
          'INVITATION_DECLINED',
          `Convite aceito por ${friend.name} falhou porque o lobby está completamente cheio.`,
          { maxMembers: squadMaxMembers },
          'warning'
        );
        return;
      }

      setMembers(curr => {
        const alreadyJoined = curr.some(m => m.name === friend.name);
        if (alreadyJoined) return curr;

        const newMember: GamezonMember = {
          id: `usr-gen-${Date.now()}`,
          name: friend.name,
          avatarSeed: friend.avatarSeed,
          isLeader: false,
          isModerator: false,
          isSpeaking: false,
          isMuted: false,
          status: 'idle',
          level: friend.level,
          roleClass: friend.recommendedRole as any,
          bio: 'Adicionado via recomendação inteligente.',
          achievementsCount: Math.floor(Math.random() * 20) + 10,
          sharedScreenActive: false,
          sharedLiveActive: false,
          sharedReplayActive: false,
          inventory: [
            { name: 'Rifle Avançado de Plasma', rarity: 'Épico', icon: '🌌', power: 75 }
          ]
        };
        return [...curr, newMember];
      });

      pushAuditLog(
        friend.name,
        'MEMBER_JOIN',
        `${friend.name} aceitou seu convite inteligente e juntou-se ao lobby do squad.`,
        { recommendedRole: friend.recommendedRole, level: friend.level },
        'success'
      );

      setPartyChat(p => [
        ...p,
        { id: `sys-joined-${Date.now()}`, sender: 'Sistema', text: `🤝 ${friend.name} aceitou o convite e entrou na equipe como classe [${friend.recommendedRole}]!`, time: new Date().toLocaleTimeString().slice(0, 5), type: 'system' }
      ]);
      playSound.collect();
    }, 4500);
  };

  // Accept incoming invite
  const handleAcceptIncomingInvite = (invite: PartyInvite) => {
    playSound.jackpot();
    setSquadCode(invite.squadCode);
    setSquadName(invite.squadName);
    setSquadMaxMembers(4);
    setSquadPrivacy('public');
    setIsLobbyActive(true);

    const presetJoined: GamezonMember[] = [
      {
        id: 'usr-me',
        name: 'Você (Challenger)',
        avatarSeed: 'me',
        isLeader: false,
        isModerator: false,
        isSpeaking: false,
        isMuted: false,
        status: 'idle',
        level: 45,
        roleClass: 'Tank',
        bio: 'Buscando recordes mundiais na arena de naves.',
        achievementsCount: 24,
        sharedScreenActive: false,
        sharedLiveActive: false,
        sharedReplayActive: false,
        inventory: PRESET_INVENTORY_ME
      },
      {
        id: `usr-${invite.id}`,
        name: invite.senderName,
        avatarSeed: invite.avatarSeed,
        isLeader: true,
        isModerator: true,
        isSpeaking: false,
        isMuted: false,
        status: 'ready',
        level: 42,
        roleClass: 'DPS',
        bio: `Líder da equipe ${invite.squadName}`,
        achievementsCount: 30,
        sharedScreenActive: false,
        sharedLiveActive: false,
        sharedReplayActive: false,
        inventory: PRESET_INVENTORY_FRIEND2
      }
    ];

    setMembers(presetJoined);
    setReceivedInvites(prev => prev.filter(inv => inv.id !== invite.id));

    setPartyChat([
      { id: 'sys-joined-inc', sender: 'Sistema', text: `Você aceitou o convite de ${invite.senderName} e entrou na equipe "${invite.squadName}"!`, time: new Date().toLocaleTimeString().slice(0, 5), type: 'system' }
    ]);

    pushAuditLog(
      'Você (Challenger)',
      'ACCEPT_INCOMING_INVITE',
      `Aceitou convite de ${invite.senderName} para entrar na equipe "${invite.squadName}".`,
      { invitedBy: invite.senderName, targetSquadCode: invite.squadCode },
      'success'
    );
  };

  const handleDeclineIncomingInvite = (id: string, senderName: string) => {
    playSound.click();
    setReceivedInvites(prev => prev.filter(inv => inv.id !== id));
    pushAuditLog(
      'Você (Challenger)',
      'DECLINE_INCOMING_INVITE',
      `Rejeitou convite de squad vindo de ${senderName}.`,
      { inviteId: id, senderName },
      'info'
    );
  };

  // Helper to share your profile card with group
  const handleShareProfileToChat = (member: GamezonMember) => {
    playSound.collect();
    setPartyChat(prev => [
      ...prev,
      { 
        id: `sys-share-profile-${Date.now()}`, 
        sender: 'Sistema', 
        text: `📰 PERFIL COMPARTILHADO por ${member.name} - Classe: [${member.roleClass}], Nível: [${member.level}], Conquistas desbloqueadas: [${member.achievementsCount}🏆]`, 
        time: new Date().toLocaleTimeString().slice(0, 5), 
        type: 'system' 
      }
    ]);
    pushAuditLog(
      member.name,
      'PROFILE_SHARE_CHAT',
      'Compartilhou resumo do perfil gamer no chat principal da Party.',
      { level: member.level, role: member.roleClass, achievements: member.achievementsCount },
      'info'
    );
  };

  const handleShareInventoryToChat = (member: GamezonMember) => {
    playSound.collect();
    const primaryItem = member.inventory[0]?.name || 'Kit Básico';
    setPartyChat(prev => [
      ...prev,
      { 
        id: `sys-share-inv-${Date.now()}`, 
        sender: 'Sistema', 
        text: `🎒 INVENTÁRIO COMPARTILHADO por ${member.name} - Equipamento Principal: [${primaryItem}] com poder total acumulado de [${member.inventory.reduce((acc, curr) => acc + curr.power, 0)} CP]!`, 
        time: new Date().toLocaleTimeString().slice(0, 5), 
        type: 'system' 
      }
    ]);
    pushAuditLog(
      member.name,
      'INVENTORY_SHARE_CHAT',
      'Compartilhou seu arsenal de itens lendários com os companheiros de equipe.',
      { totalPowerRating: member.inventory.reduce((acc, curr) => acc + curr.power, 0), primaryItem },
      'info'
    );
  };

  return (
    <div className="space-y-6">

      {/* TOP HEADER CONTROLLER: Create or join squad, show active settings */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isLobbyActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <h2 className="text-base font-black text-slate-850 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Gamezon Party Center
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isLobbyActive 
                ? `Lobby ativo: "${squadName}" • Máximo ${squadMaxMembers} jogadores • Privacidade: ${squadPrivacy === 'public' ? 'Lobby Público 🌐' : 'Lobby Privado 🔒'}`
                : 'Você não está em nenhuma equipe de jogo no momento.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {isLobbyActive ? (
              <>
                <div className="text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-1.5">
                  <span className="text-slate-400 font-sans font-bold">LOBBY CODE:</span>
                  {squadCode}
                </div>

                <button
                  onClick={() => setShowCreationModal(true)}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Configurar Party
                </button>

                <button
                  onClick={handleLeaveParty}
                  className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair da Party
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => { playSound.click(); setShowCreationModal(true); }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Criar Nova Party
                </button>

                <form onSubmit={handleJoinWithCode} className="flex items-center gap-1.5 w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="Código (Ex: SQD-123)"
                    value={customSquadCodeInput}
                    onChange={(e) => setCustomSquadCodeInput(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full md:w-44 font-mono font-bold"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-750 text-white rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer transition-all"
                  >
                    Entrar
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* SQUAD CREATION / EDITING MODAL */}
      <AnimatePresence>
        {showCreationModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => { playSound.click(); setShowCreationModal(false); }}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-black text-slate-850 dark:text-slate-100 uppercase tracking-tight flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-slate-900">
                <Sliders className="w-4.5 h-4.5 text-indigo-500" />
                Configuração de Party Gamezon
              </h3>

              <form onSubmit={handleCreateParty} className="space-y-4 pt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Nome do Esquadrão / Lobby</label>
                  <input
                    type="text"
                    required
                    value={creationForm.name}
                    onChange={(e) => setCreationForm({ ...creationForm, name: e.target.value })}
                    placeholder="Ex: Gladiadores Lendários"
                    className="w-full px-3, py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 p-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Limite Jogadores</label>
                    <select
                      value={creationForm.maxMembers}
                      onChange={(e) => setCreationForm({ ...creationForm, maxMembers: parseInt(e.target.value) || 4 })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="2">2 Jogadores</option>
                      <option value="4">4 Jogadores (Padrão)</option>
                      <option value="6">6 Jogadores</option>
                      <option value="8">8 Jogadores (Clã)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Privacidade</label>
                    <select
                      value={creationForm.privacy}
                      onChange={(e) => setCreationForm({ ...creationForm, privacy: e.target.value as 'public' | 'private' })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="public">Público (Todos entram)</option>
                      <option value="private">Privado (Apenas convite)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/40 rounded-xl flex items-start gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-indigo-700 dark:text-indigo-400 leading-relaxed font-semibold">
                    A criação de equipe gera um canal dedicado no servidor de áudio SFU com criptografia ponta-a-ponta e latência zero.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { playSound.click(); setShowCreationModal(false); }}
                    className="w-1/2 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Criar &amp; Entrar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* LEFT COLUMN: ACTIVE LOBBY MEMBERS (5 columns) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl shadow-sm space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4.5 h-4.5 text-indigo-500" />
                Membros da Equipe ({members.length}/{squadMaxMembers})
              </h3>
              {isLobbyActive && (
                <span className="text-[9px] font-mono bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-150">
                  Criptografia Ativa 🔐
                </span>
              )}
            </div>

            {/* Members List */}
            <div className="space-y-3">
              {isLobbyActive ? (
                members.map((member) => {
                  const amILeader = members.find(m => m.id === 'usr-me')?.isLeader;
                  const amIMod = members.find(m => m.id === 'usr-me')?.isModerator;

                  return (
                    <div 
                      key={member.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 flex flex-col gap-3 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {/* Avatar representation */}
                          <div className="relative">
                            <div 
                              onClick={() => { playSound.click(); setSelectedProfile(member); }}
                              className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-base font-black uppercase ring-2 ring-indigo-500/10 hover:ring-indigo-500 cursor-pointer transition-all"
                            >
                              {member.name.charAt(0)}
                            </div>
                            
                            {/* Speaking indicator overlay */}
                            {member.isSpeaking && (
                              <span className="absolute -bottom-1 -right-1 bg-indigo-500 text-white rounded-full p-0.5 border border-white">
                                <Mic className="w-3 h-3 animate-bounce" />
                              </span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span 
                                onClick={() => { playSound.click(); setSelectedProfile(member); }}
                                className="text-xs font-black text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-all"
                              >
                                {member.name}
                              </span>
                              
                              {/* Custom badges */}
                              {member.isLeader && (
                                <span className="text-[8px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                                  Líder 👑
                                </span>
                              )}
                              {!member.isLeader && member.isModerator && (
                                <span className="text-[8px] bg-indigo-500 text-white font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                                  Mod 🛡️
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[9px] text-slate-500 font-mono font-bold">Nível {member.level}</span>
                              <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
                              <span className="text-[9px] bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 rounded font-black tracking-wide uppercase">
                                {member.roleClass}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status prep badges */}
                        <div className="flex items-center gap-1.5">
                          {member.id === 'usr-me' ? (
                            <button
                              onClick={() => toggleMemberReady(member.id)}
                              className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-sm transition-all ${
                                member.status === 'ready'
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {member.status === 'ready' ? 'PRONTO ✓' : 'DAR PRONTO'}
                            </button>
                          ) : (
                            <span className={`text-[9px] font-mono font-black px-2.5 py-1 rounded-xl border uppercase tracking-wide ${
                              member.status === 'in-game'
                                ? 'bg-indigo-500 text-white border-indigo-400 animate-pulse'
                                : member.status === 'ready'
                                ? 'bg-emerald-50 border-emerald-150 text-emerald-600 dark:bg-emerald-950 dark:border-emerald-900'
                                : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-950 dark:border-slate-850'
                            }`}>
                              {member.status === 'in-game' ? 'Jogando' : member.status === 'ready' ? 'Pronto' : 'idle'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Speaking / Audio simulation row */}
                      {member.isSpeaking ? (
                        <div className="bg-white dark:bg-slate-950/40 p-2 rounded-xl border border-slate-100 dark:border-slate-850 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Radio className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest animate-pulse">Transmitindo Voz</span>
                          </div>
                          
                          {/* Animated voice bar representation */}
                          <div className="flex items-center gap-0.5 h-3">
                            <div className="w-1 bg-indigo-500 h-2 rounded animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-1 bg-indigo-500 h-3 rounded animate-bounce" style={{ animationDelay: '0.3s' }} />
                            <div className="w-1 bg-indigo-500 h-1.5 rounded animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-1 bg-indigo-500 h-2.5 rounded animate-bounce" style={{ animationDelay: '0.5s' }} />
                          </div>
                        </div>
                      ) : (
                        <div className="text-[9px] text-slate-400 italic px-1 font-semibold">
                          {member.isMuted ? '🔇 Mutado pela administração' : '🎙️ Microfone ocioso'}
                        </div>
                      )}

                      {/* Interactive Moderation & Sharing tools for team leaders and moderators */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/60">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => { playSound.click(); setSelectedProfile(member); }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-[10px] text-slate-700 dark:text-slate-300 rounded-lg font-bold cursor-pointer transition-colors"
                          >
                            Ver Perfil
                          </button>
                          
                          {/* Share profile/inventory shortcuts */}
                          <button
                            onClick={() => handleShareProfileToChat(member)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 cursor-pointer"
                            title="Compartilhar resumo de perfil no chat"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleShareInventoryToChat(member)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 cursor-pointer"
                            title="Compartilhar armas e inventário no chat"
                          >
                            <Briefcase className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Admin command list */}
                        {member.id !== 'usr-me' && (amILeader || amIMod) && (
                          <div className="flex items-center gap-1.5">
                            {/* Mute member */}
                            <button
                              onClick={() => handleMuteMember(member)}
                              className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                                member.isMuted
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
                              }`}
                              title={member.isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
                            >
                              {member.isMuted ? 'Mutado' : 'Mutar'}
                            </button>

                            {/* Promote Leader (leader only) */}
                            {amILeader && (
                              <button
                                onClick={() => handlePromoteToLeader(member)}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[9px] font-black uppercase cursor-pointer"
                                title="Passar liderança do grupo"
                              >
                                Coroar 👑
                              </button>
                            )}

                            {/* Promote Mod (leader only) */}
                            {amILeader && (
                              <button
                                onClick={() => handleToggleModerator(member)}
                                className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                                  member.isModerator
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800'
                                }`}
                                title="Alternar status de moderador"
                              >
                                {member.isModerator ? 'Remover Mod' : 'Add Mod'}
                              </button>
                            )}

                            {/* Kick Member */}
                            <button
                              onClick={() => handleKickMember(member)}
                              className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer"
                              title="Banir/Expulsar do Lobby"
                            >
                              Expulsar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-850 rounded-2xl text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Você não possui uma equipe ativa. Comece criando um esquadrão ou digitando um código de convite rápido!
                  </p>
                </div>
              )}
            </div>

            {/* Quick action triggers for active squad */}
            {isLobbyActive && members.length < squadMaxMembers && (
              <button 
                onClick={() => { playSound.click(); }}
                className="w-full py-3 border-2 border-dashed border-indigo-200 dark:border-indigo-900 hover:border-indigo-400 text-indigo-600 hover:text-indigo-500 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 animate-pulse" /> Convidar mais Amigos
              </button>
            )}
          </div>

          {/* SOCIAL & INTELLIGENT MATCHMAKING RECOMMENDATIONS */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-850 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4.5 h-4.5 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
              Recomendação Inteligente (AI Friend Assist)
            </h4>

            <p className="text-[10.5px] text-slate-500 leading-relaxed font-semibold">
              Analisando histórico competitivo de jogo, níveis de matchmaking e lacunas de funções no esquadrão. Recomendação automática:
            </p>

            <div className="space-y-2.5">
              {friendsOnline.slice(0, 3).map((friend) => (
                <div 
                  key={friend.id} 
                  className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gradient-to-tr from-slate-200 to-indigo-100 text-slate-800 rounded-lg flex items-center justify-center text-xs font-black">
                      {friend.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-850 dark:text-slate-100">{friend.name}</span>
                        <span className="text-[9px] text-emerald-500 font-extrabold font-mono">{friend.matchPercent}% compatível</span>
                      </div>
                      <p className="text-[9px] text-slate-500">Jogo: {friend.game} • Classe: <span className="font-extrabold text-indigo-500">{friend.recommendedRole}</span></p>
                    </div>
                  </div>

                  <button
                    disabled={!isLobbyActive || members.length >= squadMaxMembers}
                    onClick={() => handleInviteFriend(friend)}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900 rounded-lg text-[9px] font-black uppercase cursor-pointer"
                  >
                    Mandar Convite
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: VOICE CHAT ROOM + TEAM THEATRE + ENCRYPTED CONSOLE (7 columns) */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* MEDIA SHARE THEATRE SCREEN */}
          <div className="bg-slate-900 border border-indigo-500/20 rounded-3xl p-5 text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400">Teatro do Esquadrão (Media Share Arena)</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleShareScreen}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer ${
                    activeScreenShare ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-indigo-400'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  Tela
                </button>
                <button
                  onClick={handleShareLive}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer ${
                    activeLiveShare ? 'bg-purple-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-purple-400'
                  }`}
                >
                  <Tv className="w-3 h-3" />
                  Live
                </button>
                <button
                  onClick={handleShareReplay}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer ${
                    activeReplayShare ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-amber-500'
                  }`}
                >
                  <Video className="w-3 h-3" />
                  Replay
                </button>
              </div>
            </div>

            {/* Media rendering display screen */}
            {activeScreenShare || activeLiveShare || activeReplayShare ? (
              <div className="space-y-3">
                {activeScreenShare && (
                  <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800">
                    <img 
                      src={activeScreenShare.url} 
                      alt="Screen Share Feed" 
                      className="w-full h-full object-cover opacity-80"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wide">
                      Compartilhamento de Tela Ativo • {activeScreenShare.owner}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/80 text-slate-300 text-[9px] font-mono px-2 py-0.5 rounded">
                      Frequência: {activeScreenShare.fps} FPS • Resolução: {activeScreenShare.resolution}
                    </div>
                  </div>
                )}

                {activeLiveShare && (
                  <div className="relative aspect-video bg-gradient-to-br from-indigo-950 to-slate-900 rounded-2xl flex flex-col items-center justify-center p-6 border border-purple-500/20">
                    <Radio className="w-12 h-12 text-purple-400 animate-pulse mb-3" />
                    <p className="text-xs font-black text-center text-purple-200 tracking-wide uppercase">{activeLiveShare.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Transmissão Compartilhada por {activeLiveShare.owner}</p>
                    <div className="mt-3 flex items-center gap-1.5 text-[9px] bg-black/60 px-2.5 py-1 rounded-full text-slate-300">
                      <Users className="w-3 h-3 text-purple-400" />
                      {activeLiveShare.viewers} Assistindo ao vivo
                    </div>
                  </div>
                )}

                {activeReplayShare && (
                  <div className="relative aspect-video bg-gradient-to-tr from-slate-950 to-amber-950 rounded-2xl flex flex-col items-center justify-center p-6 border border-amber-500/20">
                    <Play className="w-12 h-12 text-amber-500 animate-ping absolute mb-3" />
                    <Play className="w-12 h-12 text-amber-500 mb-3 relative" />
                    <p className="text-xs font-black text-center text-amber-200 tracking-wide">{activeReplayShare.gameTitle}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Gravação compartilhada por {activeReplayShare.owner}</p>
                    <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                      Tática {activeReplayShare.rating}★ Rating
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video bg-slate-950/80 rounded-2xl flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800">
                <Monitor className="w-10 h-10 text-slate-600 mb-3 animate-pulse" />
                <p className="text-xs font-black text-slate-300 uppercase tracking-wider">Teatro do Esquadrão Ocioso</p>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                  Os membros do esquadrão podem usar os botões acima para iniciar compartilhamento de tela de alta taxa de frames, transmissões do LiveHub ou arquivos de replay.
                </p>
              </div>
            )}
          </div>

          {/* AUDIO SFU & CHAT CONTROL HUB */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className={`w-2.5 h-2.5 rounded-full animate-ping ${isLobbyActive && !isMicMuted ? 'bg-indigo-500' : 'bg-rose-500'}`} />
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">Canal de Áudio Global (SFU Voice Engine)</h4>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Codec Opus @48kHz estéreo • Buffer dinâmico: 5ms • Servidor: sa-east-sfu-4</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Mic state */}
              <button
                disabled={!isLobbyActive}
                onClick={toggleMic}
                className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                  !isLobbyActive 
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : isMicMuted 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-md shadow-rose-950/20' 
                    : 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-950/40'
                }`}
                title={isMicMuted ? 'Ativar Microfone' : 'Mutar Microfone'}
              >
                {isMicMuted ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5 animate-pulse" />}
              </button>

              {/* Deafen state */}
              <button
                disabled={!isLobbyActive}
                onClick={toggleDeaf}
                className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                  !isLobbyActive 
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : isDeafened 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-md shadow-rose-950/20' 
                    : 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-950/40'
                }`}
                title={isDeafened ? 'Escutar Áudio' : 'Desativar Áudio'}
              >
                {isDeafened ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
              </button>

              <select
                disabled={!isLobbyActive}
                value={voiceQuality}
                onChange={(e) => { playSound.click(); setVoiceQuality(e.target.value as any); }}
                className="bg-slate-900 border border-slate-800 rounded-xl text-[10px] px-2 py-1 focus:outline-none"
              >
                <option value="ultra">Ultra (96kbps)</option>
                <option value="high">Alta (64kbps)</option>
                <option value="normal">Normal (32kbps)</option>
              </select>
            </div>
          </div>

          {/* SQUAD TEAM CHAT */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl shadow-sm flex flex-col justify-between h-[320px]">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-150 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-tight">
                  <MessageSquare className="w-4.5 h-4.5 text-indigo-500" />
                  Mensagens da Equipe (Party Chat)
                </div>
                <span className="text-[9px] font-mono text-emerald-500 flex items-center gap-0.5 uppercase tracking-widest font-black">
                  <Lock className="w-3 h-3 text-emerald-500" /> Criptografado ponta-a-ponta
                </span>
              </div>

              {/* Chat list */}
              <div className="h-48 overflow-y-auto font-sans text-xs space-y-2.5 py-1 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
                {partyChat.map(msg => (
                  <div key={msg.id} className="leading-relaxed">
                    {msg.type === 'system' ? (
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-[10px] text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-1.5 font-semibold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{msg.text}</span>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className={`font-mono text-[10.5px] mr-1.5 ${
                            msg.sender === 'Você' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-500'
                          }`}>
                            {msg.sender}:
                          </strong>
                          <span className="text-slate-700 dark:text-slate-300">{msg.text}</span>
                        </div>
                        <span className="text-[8.5px] text-slate-400 font-mono mt-0.5">{msg.time}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={sendPartyMessage} className="flex gap-2 border-t border-slate-100 dark:border-slate-900 pt-3">
              <input 
                type="text" 
                disabled={!isLobbyActive}
                placeholder={isLobbyActive ? "Digite mensagens para a equipe..." : "Crie ou entre em uma equipe para enviar mensagens"}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button 
                type="submit" 
                disabled={!isLobbyActive}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer shrink-0 transition-all"
              >
                Enviar
              </button>
            </form>
          </div>

          {/* MATCHMAKING & TORNEIOS CENTER */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-850 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4.5 h-4.5 text-indigo-500 animate-bounce" />
              Sincronização de Partidas e Torneios Co-op
            </h4>

            {isMatchmaking ? (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest animate-pulse flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
                    Enfileirando Esquadrão... ({matchmakingTimer}s)
                  </span>
                  <button
                    onClick={handleCancelMatchmaking}
                    className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold uppercase rounded-lg transition-all"
                  >
                    Cancelar Busca
                  </button>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full animate-pulse" style={{ width: `${(matchmakingTimer/12)*100}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 font-semibold italic text-center">Buscando oponentes do mesmo MMR médio (1250 MMR)...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Custom Matchmaking card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <h5 className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300">Jogar Arena Competitiva</h5>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">Busca automática de clãs adversários. Todos os membros devem estar marcados como "PRONTO".</p>
                  
                  <button
                    disabled={!isLobbyActive}
                    onClick={handleStartMatchmaking}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Iniciar Matchmaking
                  </button>
                </div>

                {/* Tournament card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <h5 className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300">Inscrição em Torneios</h5>
                  
                  {registeredTournament ? (
                    <div className="space-y-2">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-900 rounded-lg text-[10px] font-black uppercase tracking-wide text-center">
                        Confirmado no {registeredTournament}
                      </div>
                      <button
                        onClick={handleLeaveTournament}
                        className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold uppercase rounded-xl transition-all cursor-pointer"
                      >
                        Cancelar Inscrição
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">Registre sua equipe nos campeonatos globais com prêmios em moedas Gamezone.</p>
                      <button
                        disabled={!isLobbyActive}
                        onClick={() => handleRegisterTournament('Copa Master de Naves 2026')}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Inscrever em Torneio
                      </button>
                    </>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* INCOMING INVITES INBOX */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-850 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4.5 h-4.5 text-indigo-500" />
              Caixa de Convites Recebidos ({receivedInvites.length})
            </h4>

            {receivedInvites.length > 0 ? (
              <div className="space-y-2">
                {receivedInvites.map((invite) => (
                  <div 
                    key={invite.id} 
                    className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-xs font-black">
                        {invite.senderName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-850 dark:text-slate-100">{invite.senderName}</span>
                          <span className="text-[8px] bg-indigo-50 dark:bg-indigo-950 text-indigo-500 font-bold px-1 rounded font-mono">{invite.squadCode}</span>
                        </div>
                        <p className="text-[9px] text-slate-500">Squad: "{invite.squadName}"</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAcceptIncomingInvite(invite)}
                        className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-[9px] font-black uppercase cursor-pointer"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => handleDeclineIncomingInvite(invite.id, invite.senderName)}
                        className="px-2.5 py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-lg text-[9px] font-bold uppercase cursor-pointer"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic font-semibold text-center py-2">
                Nenhum convite pendente. Seus amigos podem enviar convites usando seu código.
              </p>
            )}
          </div>

          {/* AUDIT LOGS & Microservices TELEMETRY TERMINAL */}
          <div className="bg-slate-950 border border-slate-850 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4.5 h-4.5 text-indigo-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 font-mono">Consola de Auditoria &amp; Eventos de Presença</h4>
              </div>
              <span className="text-[9px] font-mono text-indigo-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                MICROSERVICES LIVE
              </span>
            </div>

            {/* Microservices metrics bar */}
            <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-mono">
              <div className="p-2 bg-slate-900 rounded-xl border border-slate-850">
                <p className="text-slate-500 font-bold uppercase">SLA TELEMETRIA</p>
                <p className="text-emerald-400 font-black mt-0.5">99.99% • Estável</p>
              </div>
              <div className="p-2 bg-slate-900 rounded-xl border border-slate-850">
                <p className="text-slate-500 font-bold uppercase">LATÊNCIA SFU</p>
                <p className="text-indigo-400 font-black mt-0.5">7.2ms (Média)</p>
              </div>
              <div className="p-2 bg-slate-900 rounded-xl border border-slate-850">
                <p className="text-slate-500 font-bold uppercase">CRIPTOGRAFIA</p>
                <p className="text-emerald-400 font-black mt-0.5">AES-256 (Ativo)</p>
              </div>
            </div>

            {/* Audit Logs Stream List */}
            <div className="h-44 overflow-y-auto font-mono text-[10px] space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {auditLogs.map((log) => {
                const colors = {
                  success: 'text-emerald-400 border-emerald-950/40 bg-emerald-950/10',
                  warning: 'text-amber-400 border-amber-950/40 bg-amber-950/10',
                  security: 'text-rose-400 border-rose-950/40 bg-rose-950/10',
                  info: 'text-indigo-400 border-indigo-950/40 bg-indigo-950/10'
                };

                return (
                  <div 
                    key={log.id} 
                    className={`p-2.5 rounded-xl border ${colors[log.severity || 'info']} space-y-1.5`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-[9px]">{log.action}</span>
                      <span className="text-slate-500">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-300 font-semibold">{log.details}</p>
                    <details className="mt-1">
                      <summary className="text-[9px] text-slate-500 hover:text-slate-400 cursor-pointer select-none font-bold">Ver Payload de Transação</summary>
                      <pre className="mt-1 p-2 bg-black rounded text-[9px] text-indigo-300 overflow-x-auto">
                        {JSON.stringify({ actor: log.actorName, payload: log.payload }, null, 2)}
                      </pre>
                    </details>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
              <span>Sincronizado com LocalStorage</span>
              <button 
                onClick={() => {
                  playSound.click();
                  setAuditLogs([]);
                  localStorage.removeItem('gamezon_party_audit_logs');
                }}
                className="hover:text-rose-400 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Limpar Logs
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* DETAILED PLAYER PROFILE OVERLAY MODAL */}
      <AnimatePresence>
        {selectedProfile && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl w-full max-w-lg shadow-2xl relative"
            >
              <button
                onClick={() => { playSound.click(); setSelectedProfile(null); }}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Profile Card Contents */}
              <div className="space-y-5">
                
                {/* Header info */}
                <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-900 pb-4">
                  <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-black uppercase">
                    {selectedProfile.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-850 dark:text-slate-100">{selectedProfile.name}</h4>
                      <span className="text-[9px] bg-indigo-600 text-white font-black px-1.5 py-0.5 rounded uppercase">LVL {selectedProfile.level}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold">{selectedProfile.roleClass} • Integrante Gamezone</p>
                  </div>
                </div>

                {/* Bio section */}
                <div className="space-y-1">
                  <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Bio de Jogador</h5>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                    {selectedProfile.bio}
                  </p>
                </div>

                {/* Shared Inventory Arsenal Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                      Arsenal Compartilhado (Inventory Share)
                    </h5>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">Total Itens: {selectedProfile.inventory.length}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {selectedProfile.inventory.map((item, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{item.icon}</span>
                          <div>
                            <p className="text-[10.5px] font-bold text-slate-850 dark:text-slate-200">{item.name}</p>
                            <span className={`text-[8px] font-black uppercase px-1 rounded ${
                              item.rarity === 'Lendário' 
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' 
                                : item.rarity === 'Épico'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
                                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                            }`}>
                              {item.rarity}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-indigo-500">{item.power} CP</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Achievements stats overview */}
                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-900 pt-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 text-center">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Total Conquistas</span>
                    <div className="text-base font-black text-amber-500 flex items-center justify-center gap-1">
                      <Award className="w-4.5 h-4.5 text-amber-500" />
                      {selectedProfile.achievementsCount} Desbloqueadas
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 text-center">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Taxa de Sinergia</span>
                    <div className="text-base font-black text-emerald-400 flex items-center justify-center gap-1">
                      <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
                      98% Co-op Rate
                    </div>
                  </div>
                </div>

                {/* Profile actions inside card */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { handleShareProfileToChat(selectedProfile); setSelectedProfile(null); }}
                    className="w-1/2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Compartilhar Perfil
                  </button>
                  <button
                    onClick={() => { handleShareInventoryToChat(selectedProfile); setSelectedProfile(null); }}
                    className="w-1/2 py-2 bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-750 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Compartilhar Arsenal
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
