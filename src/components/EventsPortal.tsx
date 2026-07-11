import React, { useState, useEffect } from 'react';
import { PlayerStats, TransactionLog } from '../types';
import { playSound } from '../utils/audio';
import { 
  Calendar, 
  Trophy, 
  Sparkles, 
  Award, 
  Coins, 
  Lock, 
  Unlock, 
  Clock, 
  Gift, 
  Package, 
  Flame, 
  Zap, 
  ChevronRight, 
  Crown, 
  Play, 
  Check, 
  Tv, 
  ShoppingBag,
  Bell,
  Heart,
  User,
  ShieldCheck,
  ChevronDown,
  Info
} from 'lucide-react';

interface EventsPortalProps {
  stats: PlayerStats;
  updateStats: (newStats: Partial<PlayerStats>) => void;
  addLog?: (log: Omit<TransactionLog, 'id' | 'timestamp' | 'status'>) => void;
  onTriggerToast: (msg: string, isSuccess?: boolean) => void;
  setActiveTab?: (tab: any) => void;
  realBalance?: number;
  setRealBalance?: React.Dispatch<React.SetStateAction<number>>;
}

// Default items for rewards
const ALL_BADGES = [
  { id: 'pilot_pioneer', name: 'Piloto Pioneiro 🎖️', desc: 'Conquistado na Temporada de Lançamento', icon: '🎖️', color: 'text-amber-500 border-amber-500/30 bg-amber-500/5' },
  { id: 'turbo_sprinter', name: 'Velocista Turbo ⚡', desc: 'Atinja velocidade máxima no Arcade', icon: '⚡', color: 'text-cyan-500 border-cyan-500/30 bg-cyan-500/5' },
  { id: 'chat_star', name: 'Estrela do Chat 🌟', desc: 'Participe ativamente das discussões na Arena', icon: '🌟', color: 'text-indigo-500 border-indigo-500/30 bg-indigo-500/5' },
  { id: 'elite_racer', name: 'Piloto de Elite 🎖️', desc: 'Conquiste nível de prestígio no Battle Pass', icon: '🏆', color: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5' },
  { id: 'shadow_champion', name: 'Campeão das Sombras ⚔️', desc: 'Vença um desafio especial patrocinado', icon: '⚔️', color: 'text-rose-500 border-rose-500/30 bg-rose-500/5' },
  { id: 'coca_cola_gamer', name: 'Refresco Gamer 🥤', desc: 'Concluído o evento patrocinado Coca-Cola', icon: '🥤', color: 'text-red-500 border-red-500/30 bg-red-500/5' },
];

const ALL_TITLES = [
  { id: 'digital_warrior', name: 'Guerreiro Digital', desc: 'Sempre conectado à Rede' },
  { id: 'neon_master', name: 'Mestre Neon', desc: 'Doutrinador das pistas cyberpunk' },
  { id: 'arena_legend', name: 'Lenda da Arena', desc: 'Reconhecido por todos os criadores' },
  { id: 'speedy_pro', name: 'Speedy Pro', desc: 'Velocidade corre em suas veias' },
  { id: 'time_master', name: 'Mestre do Tempo', desc: 'Frequência diária inabalável' },
  { id: 'arena_emperor', name: 'Imperador da Arena', desc: 'Nível máximo do Passe de Batalha Premium' },
];

export const EventsPortal: React.FC<EventsPortalProps> = ({
  stats,
  updateStats,
  addLog,
  onTriggerToast,
  setActiveTab,
  realBalance = 0,
  setRealBalance
}) => {
  // Tabs for subview switcher: 'battlepass' | 'quests' | 'calendar' | 'lootboxes' | 'customize'
  const [activeSubTab, setActiveSubTab] = useState<'battlepass' | 'quests' | 'calendar' | 'lootboxes' | 'customize'>('battlepass');

  // Local stats for robust defaults (in case global fields are undefined initially)
  const bpXp = stats.battlePassXp ?? 0;
  const bpLevel = stats.battlePassLevel ?? 1;
  const isPremium = stats.battlePassPremiumUnlocked ?? false;
  const unlockedBadges = stats.unlockedBadges ?? ['pilot_pioneer'];
  const unlockedTitles = stats.unlockedTitles ?? ['digital_warrior'];
  const activeTitle = stats.activeTitle ?? 'digital_warrior';
  const activeBadges = stats.activeBadges ?? ['pilot_pioneer'];
  const boxesInventory = stats.boxesInventory ?? [
    { type: 'common', count: 2 },
    { type: 'rare', count: 0 },
    { type: 'legendary', count: 0 },
    { type: 'sponsored', count: 1 }
  ];
  const completedQuests = stats.completedQuestIds ?? [];
  const dailyCheckedIn = stats.dailyCheckedInDays ?? [];

  // Lootbox open simulation states
  const [openingBoxType, setOpeningBoxType] = useState<'common' | 'rare' | 'legendary' | 'sponsored' | null>(null);
  const [openingStage, setOpeningStage] = useState<'idle' | 'counting' | 'revealing'>('idle');
  const [countdown, setCountdown] = useState<number>(3);
  const [revealedRewards, setRevealedRewards] = useState<{ name: string; amount: string; icon: string }[]>([]);

  // Simulated Quest progression
  const [questsList, setQuestsList] = useState([
    { id: 'q_daily_play', title: 'Arcade Star', desc: 'Ganhar 500 pontos em qualquer jogo da Arena', type: 'daily', rewardType: 'xp', rewardVal: 40, target: 500, current: 0, category: 'Jogos' },
    { id: 'q_daily_chat', title: 'Palhaço do Chat', desc: 'Enviar 3 mensagens no GameChat para engajar', type: 'daily', rewardType: 'coins', rewardVal: 80, target: 3, current: 1, category: 'Interação' },
    { id: 'q_weekly_loot', title: 'Mestre Caçador', desc: 'Abrir 2 Caixas de Loot (Comum, Rara ou Lendária)', type: 'weekly', rewardType: 'box_common', rewardVal: 1, target: 2, current: 0, category: 'Loot' },
    { id: 'q_weekly_avatar', title: 'Estilo Puro', desc: 'Customizar o Avatar na aba de personalização', type: 'weekly', rewardType: 'xp', rewardVal: 150, target: 1, current: 1, category: 'Avatar' },
    { id: 'q_monthly_shop', title: 'Consumista Consciente', desc: 'Gastar 300 moedas na Loja Segura de Itens', type: 'monthly', rewardType: 'box_rare', rewardVal: 1, target: 300, current: 120, category: 'Marketplace' },
    { id: 'q_monthly_stage', title: 'Sobrevivente Elite', desc: 'Avançar até o estágio 5 no Arcade', type: 'monthly', rewardType: 'xp', rewardVal: 300, target: 5, current: stats.currentStage, category: 'Desafio' },
  ]);

  // Sync stage progress on load or stats change
  useEffect(() => {
    setQuestsList(prev => prev.map(q => {
      if (q.id === 'q_monthly_stage') {
        return { ...q, current: Math.min(q.target, stats.currentStage) };
      }
      return q;
    }));
  }, [stats.currentStage]);

  // Battle Pass rewards configuration (Levels 1 to 10)
  const bpRewards = [
    { level: 1, free: { name: '50 Moedas', icon: '🪙', type: 'coins', val: 50 }, premium: { name: 'Caixa Comum', icon: '🎁', type: 'box', boxType: 'common' } },
    { level: 2, free: { name: '20 XP de Passe', icon: '⭐', type: 'bp_xp', val: 20 }, premium: { name: 'Aura Relâmpago Azul', icon: '⚡', type: 'aura', auraId: 'blue_lightning' } },
    { level: 3, free: { name: '1 Vida Extra', icon: '❤️', type: 'lives', val: 1 }, premium: { name: '200 Moedas Arena', icon: '🪙', type: 'coins', val: 200 } },
    { level: 4, free: { name: '100 Moedas', icon: '🪙', type: 'coins', val: 100 }, premium: { name: 'Emblema Velocista Turbo', icon: '⚡', type: 'badge', badgeId: 'turbo_sprinter' } },
    { level: 5, free: { name: 'Caixa Comum', icon: '🎁', type: 'box', boxType: 'common' }, premium: { name: 'Skin Cyber Ghost', icon: '🥋', type: 'skin', skinId: 'cyber_ghost' } },
    { level: 6, free: { name: '50 XP de Passe', icon: '⭐', type: 'bp_xp', val: 50 }, premium: { name: 'Título Mestre Neon', icon: '👑', type: 'title', titleId: 'neon_master' } },
    { level: 7, free: { name: '150 Moedas', icon: '🪙', type: 'coins', val: 150 }, premium: { name: 'Caixa Rara de Loot', icon: '🎁', type: 'box', boxType: 'rare' } },
    { level: 8, free: { name: '2 Vidas Extras', icon: '❤️', type: 'lives', val: 2 }, premium: { name: '500 Moedas Arena', icon: '🪙', type: 'coins', val: 500 } },
    { level: 9, free: { name: 'Emblema Campeão das Sombras', icon: '⚔️', type: 'badge', badgeId: 'shadow_champion' }, premium: { name: 'Caixa Lendária', icon: '🎁', type: 'box', boxType: 'legendary' } },
    { level: 10, free: { name: 'Caixa Lendária', icon: '🎁', type: 'box', boxType: 'legendary' }, premium: { name: 'Skin Overlord Cósmico + Imperador', icon: '👑', type: 'dual_reward' } },
  ];

  // Daily Check-In Calendar items
  const calendarDays = Array.from({ length: 28 }, (_, idx) => {
    const day = idx + 1;
    let reward = { name: '50 Moedas', icon: '🪙', type: 'coins', val: 50 };
    if (day % 7 === 0) {
      if (day === 7) reward = { name: 'Badge: Piloto Pioneiro', icon: '🎖️', type: 'badge', val: 'pilot_pioneer' } as any;
      if (day === 14) reward = { name: 'Caixa Rara', icon: '🎁', type: 'box', val: 'rare' } as any;
      if (day === 21) reward = { name: 'Título: Mestre do Tempo', icon: '👑', type: 'title', val: 'time_master' } as any;
      if (day === 28) reward = { name: 'Skin Cyber Overlord', icon: '🛸', type: 'skin', val: 'cyber_overlord' } as any;
    } else if (day % 3 === 0) {
      reward = { name: 'Caixa Comum', icon: '🎁', type: 'box', val: 'common' } as any;
    } else if (day % 2 === 0) {
      reward = { name: '20 XP de Passe', icon: '⚡', type: 'bp_xp', val: 20 };
    }
    return { day, reward };
  });

  // Action Check-In Handler
  const handleDailyCheckIn = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (stats.lastDailyCheckInDate === todayStr) {
      onTriggerToast('❌ Você já fez o check-in de hoje! Volte amanhã.', false);
      return;
    }

    playSound.victory();
    const nextDayNum = dailyCheckedIn.length + 1;
    const dayConfig = calendarDays.find(d => d.day === nextDayNum) || calendarDays[0];
    
    // Distribute rewards
    const updatedStats: Partial<PlayerStats> = {
      dailyCheckedInDays: [...dailyCheckedIn, nextDayNum],
      lastDailyCheckInDate: todayStr
    };

    let rewardLabel = '';
    const r = dayConfig.reward;
    if (r.type === 'coins') {
      updatedStats.coins = stats.coins + r.val;
      rewardLabel = `${r.val} Moedas Arena`;
    } else if (r.type === 'bp_xp') {
      addBattlePassXp(r.val);
      rewardLabel = `${r.val} XP do Battle Pass`;
    } else if (r.type === 'box') {
      const boxType = r.val as any;
      const inv = [...boxesInventory];
      const match = inv.find(b => b.type === boxType);
      if (match) match.count += 1;
      updatedStats.boxesInventory = inv;
      rewardLabel = `1x Caixa de Loot (${boxType.toUpperCase()})`;
    } else if (r.type === 'badge') {
      const badgeId = r.val as any;
      if (!unlockedBadges.includes(badgeId)) {
        updatedStats.unlockedBadges = [...unlockedBadges, badgeId];
      }
      rewardLabel = `Emblema Exclusivo: ${badgeId}`;
    } else if (r.type === 'title') {
      const titleId = r.val as any;
      if (!unlockedTitles.includes(titleId)) {
        updatedStats.unlockedTitles = [...unlockedTitles, titleId];
      }
      rewardLabel = `Título: ${titleId}`;
    } else if (r.type === 'skin') {
      const skinId = r.val as any;
      if (!stats.unlockedSkins.includes(skinId)) {
        updatedStats.unlockedSkins = [...stats.unlockedSkins, skinId];
      }
      rewardLabel = `Skin Exclusiva: ${skinId}`;
    }

    updateStats(updatedStats);
    onTriggerToast(`🎉 Dia ${nextDayNum} marcado! Recompensa resgatada: ${rewardLabel}`);
    
    if (addLog) {
      addLog({
        type: 'earn',
        description: `Login Diário Dia ${nextDayNum}: Ganhou ${rewardLabel}`,
        amount: r.type === 'coins' ? r.val : 0,
        currency: 'coins'
      });
    }
  };

  // Helper to add BP XP and handle level ups
  const addBattlePassXp = (amount: number) => {
    let newXp = bpXp + amount;
    let newLvl = bpLevel;
    const xpPerLevel = 100;

    while (newXp >= xpPerLevel && newLvl < 10) {
      newXp -= xpPerLevel;
      newLvl += 1;
      onTriggerToast(`⭐ PARABÉNS! Você subiu para o Nível ${newLvl} do Passe de Batalha!`);
    }

    updateStats({
      battlePassXp: newXp,
      battlePassLevel: newLvl
    });
  };

  // Claim Quest Reward
  const claimQuest = (questId: string) => {
    const quest = questsList.find(q => q.id === questId);
    if (!quest) return;

    if (quest.current < quest.target) {
      onTriggerToast('❌ Este objetivo ainda não foi concluído!', false);
      return;
    }

    playSound.collect();
    
    // Add completed ID
    const updatedCompleted = [...completedQuests, questId];
    const updatedStats: Partial<PlayerStats> = {
      completedQuestIds: updatedCompleted
    };

    let claimLabel = '';
    if (quest.rewardType === 'xp') {
      addBattlePassXp(quest.rewardVal);
      claimLabel = `${quest.rewardVal} XP do Passe`;
    } else if (quest.rewardType === 'coins') {
      updatedStats.coins = stats.coins + quest.rewardVal;
      claimLabel = `${quest.rewardVal} Moedas`;
    } else if (quest.rewardType.startsWith('box_')) {
      const bType = quest.rewardType.replace('box_', '') as any;
      const inv = [...boxesInventory];
      const match = inv.find(b => b.type === bType);
      if (match) match.count += quest.rewardVal;
      updatedStats.boxesInventory = inv;
      claimLabel = `${quest.rewardVal}x Caixa de Loot (${bType.toUpperCase()})`;
    }

    updateStats(updatedStats);
    onTriggerToast(`🎁 Recompensa coletada: ${claimLabel}`);

    if (addLog) {
      addLog({
        type: 'earn',
        description: `Missão Concluída: ${quest.title}`,
        amount: quest.rewardType === 'coins' ? quest.rewardVal : 0,
        currency: 'coins'
      });
    }
  };

  // Open Lootbox Simulation
  const handleOpenLootbox = (type: 'common' | 'rare' | 'legendary' | 'sponsored') => {
    const inv = [...boxesInventory];
    const match = inv.find(b => b.type === type);
    if (!match || match.count <= 0) {
      onTriggerToast('❌ Você não possui nenhuma caixa deste tipo!', false);
      return;
    }

    playSound.click();
    // Consume box
    match.count -= 1;
    updateStats({ boxesInventory: inv });

    // Start countdown animation
    setOpeningBoxType(type);
    setOpeningStage('counting');
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Calculate reward
          triggerBoxOpeningReveal(type);
          return 0;
        }
        playSound.click();
        return prev - 1;
      });
    }, 800);
  };

  const triggerBoxOpeningReveal = (type: 'common' | 'rare' | 'legendary' | 'sponsored') => {
    playSound.victory();
    setOpeningStage('revealing');

    // Rewards definition based on box type
    let rewards: { name: string; amount: string; icon: string; action: () => void }[] = [];

    if (type === 'common') {
      const coinAmt = Math.floor(Math.random() * 50) + 50;
      rewards = [
        { name: 'Moedas Arena', amount: `🪙 ${coinAmt}`, icon: '🪙', action: () => updateStats({ coins: stats.coins + coinAmt }) },
        { name: 'XP de Temporada', amount: `⭐ 30 XP`, icon: '⭐', action: () => addBattlePassXp(30) }
      ];
    } else if (type === 'rare') {
      const coinAmt = Math.floor(Math.random() * 150) + 150;
      const livesAmt = Math.random() > 0.5 ? 2 : 1;
      rewards = [
        { name: 'Moedas Arena', amount: `🪙 ${coinAmt}`, icon: '🪙', action: () => updateStats({ coins: stats.coins + coinAmt }) },
        { name: 'Vidas Extras', amount: `❤️ ${livesAmt}`, icon: '❤️', action: () => updateStats({ lives: stats.lives + livesAmt }) },
        { name: 'XP do Battle Pass', amount: `⭐ 80 XP`, icon: '⭐', action: () => addBattlePassXp(80) }
      ];
    } else if (type === 'legendary') {
      const coinAmt = Math.floor(Math.random() * 500) + 400;
      // Unlock random premium badge or title
      const badgeId = 'shadow_champion';
      const titleId = 'arena_legend';
      
      rewards = [
        { name: 'Mega Moedas', amount: `🪙 ${coinAmt}`, icon: '🪙', action: () => updateStats({ coins: stats.coins + coinAmt }) },
        { 
          name: 'Emblema: Campeão das Sombras', 
          amount: '⚔️ Exclusivo', 
          icon: '⚔️', 
          action: () => {
            if (!unlockedBadges.includes(badgeId)) {
              updateStats({ unlockedBadges: [...unlockedBadges, badgeId] });
            }
          } 
        },
        { 
          name: 'Título: Lenda da Arena', 
          amount: '👑 Lendário', 
          icon: '👑', 
          action: () => {
            if (!unlockedTitles.includes(titleId)) {
              updateStats({ unlockedTitles: [...unlockedTitles, titleId] });
            }
          } 
        }
      ];
    } else if (type === 'sponsored') {
      // Sponsored rewards (e.g. Red Bull or Coca-Cola with massive boosts)
      const coinAmt = 250;
      const badgeId = 'coca_cola_gamer';
      rewards = [
        { name: 'Bônus Coca-Cola', amount: `🪙 ${coinAmt} Moedas`, icon: '🥤', action: () => updateStats({ coins: stats.coins + coinAmt }) },
        { 
          name: 'Emblema Patrocinado', 
          amount: '🥤 Refresco Gamer', 
          icon: '🥤', 
          action: () => {
            if (!unlockedBadges.includes(badgeId)) {
              updateStats({ unlockedBadges: [...unlockedBadges, badgeId] });
            }
          } 
        },
        { name: 'Super XP do Passe', amount: `⚡ 120 XP`, icon: '⚡', action: () => addBattlePassXp(120) }
      ];
    }

    setRevealedRewards(rewards);

    // Apply rewards
    rewards.forEach(r => r.action());

    if (addLog) {
      addLog({
        type: 'earn',
        description: `Lootbox ${type.toUpperCase()} aberta com sucesso!`,
        amount: type === 'legendary' ? 400 : 50,
        currency: 'coins'
      });
    }
  };

  // Close reveal modal
  const finishLootboxOpening = () => {
    setOpeningBoxType(null);
    setOpeningStage('idle');
    setRevealedRewards([]);
  };

  // Claim Battle Pass level reward
  const claimBPReward = (level: number, isPremiumClaim: boolean) => {
    if (bpLevel < level) {
      onTriggerToast('❌ Alcance o nível correspondente no Passe para desbloquear!', false);
      return;
    }
    
    if (isPremiumClaim && !isPremium) {
      onTriggerToast('🔒 Desbloqueie o Passe Premium para resgatar esta recompensa!', false);
      return;
    }

    playSound.victory();
    const config = bpRewards.find(r => r.level === level);
    if (!config) return;

    const reward = isPremiumClaim ? config.premium : config.free;
    const updatedStats: Partial<PlayerStats> = {};

    let claimMsg = '';
    if (reward.type === 'coins') {
      updatedStats.coins = stats.coins + (reward.val || 0);
      claimMsg = `${reward.val} Moedas Arena`;
    } else if (reward.type === 'bp_xp') {
      addBattlePassXp(reward.val || 0);
      claimMsg = `${reward.val} XP de Passe`;
    } else if (reward.type === 'lives') {
      updatedStats.lives = stats.lives + (reward.val || 0);
      claimMsg = `${reward.val} Vidas Extras`;
    } else if (reward.type === 'badge') {
      const badgeId = (reward as any).badgeId;
      if (!unlockedBadges.includes(badgeId)) {
        updatedStats.unlockedBadges = [...unlockedBadges, badgeId];
      }
      claimMsg = `Emblema: ${badgeId}`;
    } else if (reward.type === 'title') {
      const titleId = (reward as any).titleId;
      if (!unlockedTitles.includes(titleId)) {
        updatedStats.unlockedTitles = [...unlockedTitles, titleId];
      }
      claimMsg = `Título: ${titleId}`;
    } else if (reward.type === 'skin') {
      const skinId = (reward as any).skinId;
      if (!stats.unlockedSkins.includes(skinId)) {
        updatedStats.unlockedSkins = [...stats.unlockedSkins, skinId];
      }
      claimMsg = `Skin Exclusiva: ${skinId}`;
    } else if (reward.type === 'box') {
      const boxType = (reward as any).boxType;
      const inv = [...boxesInventory];
      const match = inv.find(b => b.type === boxType);
      if (match) match.count += 1;
      updatedStats.boxesInventory = inv;
      claimMsg = `Caixa de Loot (${boxType.toUpperCase()})`;
    } else if (reward.type === 'dual_reward') {
      // Special skin + title dual reward on level 10
      const activeSkins = [...stats.unlockedSkins];
      if (!activeSkins.includes('cosmic_overlord')) activeSkins.push('cosmic_overlord');
      const activeTitles = [...unlockedTitles];
      if (!activeTitles.includes('arena_emperor')) activeTitles.push('arena_emperor');
      
      updatedStats.unlockedSkins = activeSkins;
      updatedStats.unlockedTitles = activeTitles;
      claimMsg = 'Skin Cosmic Overlord + Título Imperador da Arena!';
    }

    updateStats(updatedStats);
    onTriggerToast(`🎁 Recompensa do Nível ${level} resgatada: ${claimMsg}`);
  };

  // Buy Premium Battle Pass
  const handlePurchasePremium = () => {
    if (isPremium) {
      onTriggerToast('ℹ️ Seu Passe de Batalha Premium já está ativo nesta Temporada!');
      return;
    }

    if (stats.coins < 500) {
      onTriggerToast('❌ Moedas insuficientes! O Passe Premium custa 500 moedas.', false);
      return;
    }

    playSound.victory();
    updateStats({
      coins: stats.coins - 500,
      battlePassPremiumUnlocked: true
    });
    
    onTriggerToast('👑 PASSE PREMIUM ADQUIRIDO! Recompensas da linha Premium liberadas!');
    
    if (addLog) {
      addLog({
        type: 'purchase_booster',
        description: 'Adquiriu o Passe de Batalha Premium de Estúdio',
        amount: 500,
        currency: 'coins'
      });
    }
  };

  // Profile customization change active badge / title
  const handleToggleBadge = (badgeId: string) => {
    playSound.click();
    let current = [...activeBadges];
    if (current.includes(badgeId)) {
      current = current.filter(b => b !== badgeId);
    } else {
      if (current.length >= 3) {
        onTriggerToast('❌ Você só pode equipar até 3 Emblemas por vez!', false);
        return;
      }
      current.push(badgeId);
    }
    updateStats({ activeBadges: current });
    onTriggerToast('🎖️ Emblemas equipados atualizados com sucesso!');
  };

  const handleSelectTitle = (titleId: string) => {
    playSound.click();
    updateStats({ activeTitle: titleId });
    onTriggerToast(`👑 Título ativo alterado para: "${ALL_TITLES.find(t => t.id === titleId)?.name}"`);
  };

  // Simulated live event click
  const triggerSpecialEvent = (name: string, rewardBox: 'common' | 'rare' | 'legendary' | 'sponsored') => {
    playSound.victory();
    // Grant lootbox reward directly
    const inv = [...boxesInventory];
    const match = inv.find(b => b.type === rewardBox);
    if (match) match.count += 1;
    
    // Add event specific badges or other things
    const updatedStats: Partial<PlayerStats> = {
      boxesInventory: inv
    };

    updateStats(updatedStats);
    onTriggerToast(`🎉 Você ingressou no Evento "${name}"! Recebeu uma Caixa de Loot (${rewardBox.toUpperCase()}) como bônus de inscrição.`);
    
    // Auto-progress related daily quests
    setQuestsList(prev => prev.map(q => {
      if (q.id === 'q_daily_play') {
        return { ...q, current: q.target }; // complete play quest
      }
      return q;
    }));
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-white max-w-7xl mx-auto p-4 animate-fadeIn">
      
      {/* Banner de Cabeçalho do Evento Global */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        {/* Background gradient/glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

        {/* Player Profile Event Widget */}
        <div className="relative flex items-center gap-4 text-left">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-lg">
            🏆
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-amber-500 rounded text-[9px] font-mono font-bold text-slate-950">
              Lvl {bpLevel}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black uppercase text-white tracking-tight">
                {stats.avatar.skin === 'classic' ? 'Piloto da Arena' : stats.avatar.skin.replace('_', ' ').toUpperCase()}
              </h2>
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold uppercase border border-indigo-500/30">
                TEMPORADA 1: NEON LEGACY
              </span>
            </div>
            
            {/* Active Title and Badges preview */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-xs text-amber-400 font-mono font-bold uppercase tracking-wider">
                &lt; {ALL_TITLES.find(t => t.id === activeTitle)?.name || 'Guerreiro Digital'} &gt;
              </span>
              <div className="flex items-center gap-1 ml-2">
                {activeBadges.map((badgeId) => {
                  const b = ALL_BADGES.find(x => x.id === badgeId);
                  return b ? (
                    <span 
                      key={badgeId} 
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono border bg-slate-800/80 text-indigo-300 border-indigo-500/20"
                      title={b.desc}
                    >
                      {b.icon} {b.name.split(' ')[0]}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Season progress & level summary */}
        <div className="relative bg-slate-950/60 border border-slate-800 rounded-2xl p-4 min-w-[250px] text-left">
          <div className="flex justify-between items-center text-xs text-slate-300 mb-2">
            <span className="font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" /> Progression XP
            </span>
            <span className="font-mono text-[11px] font-bold text-slate-400">{bpXp} / 100 XP</span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${bpXp}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2">
            <span>Level {bpLevel}</span>
            <span>Level {Math.min(10, bpLevel + 1)}</span>
          </div>
        </div>
      </div>

      {/* Navegação Subtelas */}
      <div className="flex items-center justify-start gap-1.5 overflow-x-auto scrollbar-none pb-2 border-b border-slate-200 dark:border-slate-850 flex-nowrap">
        {[
          { id: 'battlepass', label: 'Passe de Batalha', icon: Trophy, color: 'text-amber-500 bg-amber-500/5' },
          { id: 'quests', label: 'Missões & Metas', icon: Award, color: 'text-indigo-500 bg-indigo-500/5' },
          { id: 'calendar', label: 'Calendário de Prêmios', icon: Calendar, color: 'text-cyan-500 bg-cyan-500/5' },
          { id: 'lootboxes', label: 'Caixas de Loot', icon: Package, color: 'text-purple-500 bg-purple-500/5' },
          { id: 'customize', label: 'Customizar Perfil', icon: User, color: 'text-emerald-500 bg-emerald-500/5' },
        ].map((sub) => {
          const Icon = sub.icon;
          const isActive = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => {
                setActiveSubTab(sub.id as any);
                playSound.click();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all uppercase font-mono ${
                isActive
                  ? 'bg-indigo-600 text-white border-b-2 border-indigo-400 shadow-lg shadow-indigo-600/10'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-150 dark:border-slate-850 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PASSE DE BATALHA */}
      {activeSubTab === 'battlepass' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* BP Progress Left Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-4">
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">Passe de Temporada 👑</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Jogue jogos da Arena, complete missões diárias e assista a transmissões ao vivo para ganhar XP. Desbloqueie itens, títulos e caixas exclusivas!
              </p>

              {/* Premium Status Widget */}
              <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-600/15 border border-indigo-500/30 rounded-xl space-y-3 relative overflow-hidden">
                <div className="absolute top-2 right-2 opacity-10">
                  <Crown className="w-16 h-16 text-indigo-500" />
                </div>
                
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  {isPremium ? (
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase font-mono">
                      <Crown className="w-4 h-4 fill-indigo-500" /> Premium Ativo
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase font-mono">
                      <Crown className="w-4 h-4" /> Versão Gratuita
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-normal">
                  {isPremium 
                    ? 'Parabéns! Você tem acesso irrestrito às recompensas exclusivas da linha Premium!' 
                    : 'Adquira a licença Premium por 500 moedas para receber prêmios superiores, incluindo skins raras e boosts.'
                  }
                </p>

                {!isPremium && (
                  <button
                    onClick={handlePurchasePremium}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    Adquirir Premium (🪙 500)
                  </button>
                )}
              </div>

              {/* Status details */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2 font-mono text-[11px] text-slate-500">
                <div className="flex justify-between">
                  <span>Sua Licença:</span>
                  <span className="font-bold text-slate-800 dark:text-white uppercase">{isPremium ? 'Premium 👑' : 'Livre'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Progresso do Passe:</span>
                  <span className="font-bold text-indigo-500">Lvl {bpLevel} / 10</span>
                </div>
                <div className="flex justify-between">
                  <span>XP Acumulado:</span>
                  <span className="font-bold text-amber-500">{bpXp} XP</span>
                </div>
                <div className="flex justify-between">
                  <span>Encerramento:</span>
                  <span className="font-bold text-rose-500 flex items-center gap-1"><Clock className="w-3 h-3" /> 18 dias</span>
                </div>
              </div>
            </div>

            {/* Special / Sponsored Live Challenge triggers */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-black uppercase text-indigo-400">Torneios &amp; Lives Ativas 📺</h4>
                <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[8px] font-mono font-bold uppercase rounded tracking-wider animate-pulse">AO VIVO</span>
              </div>
              
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥤</span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">Desafio Cola-Cola</h5>
                    <p className="text-[10px] text-slate-400">Sponsored Live Drop Event</p>
                  </div>
                </div>
                <button
                  onClick={() => triggerSpecialEvent('Desafio Coca-Cola Gamer', 'sponsored')}
                  className="w-full py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-[10px] uppercase font-mono cursor-pointer transition-all"
                >
                  Participar &amp; Resgatar Drop Coca-Cola
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥤</span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">Torneio Speedy Nitro</h5>
                    <p className="text-[10px] text-slate-400">Campeonato da Arena Especial</p>
                  </div>
                </div>
                <button
                  onClick={() => triggerSpecialEvent('Torneio Speedy Nitro', 'legendary')}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] uppercase font-mono cursor-pointer transition-all"
                >
                  Registrar na Chave &amp; Pegar Caixa Lendária
                </button>
              </div>
            </div>
          </div>

          {/* Rewards Grid (Lvl 1 to 10) */}
          <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight font-sans">Trilha de Recompensas de Estúdio</h3>
              <p className="text-xs text-slate-400 mt-0.5">Suba de nível para obter as duas colunas de prêmios de temporada.</p>
            </div>

            <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
              {bpRewards.map((reward) => {
                const isLvlReached = bpLevel >= reward.level;
                return (
                  <div 
                    key={reward.level} 
                    className={`p-3 bg-slate-50 dark:bg-slate-950 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      isLvlReached 
                        ? 'border-indigo-500/20 bg-indigo-500/5' 
                        : 'border-slate-150 dark:border-slate-850'
                    }`}
                  >
                    {/* Level Badge Indicator */}
                    <div className="flex items-center gap-3 min-w-[70px]">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs border ${
                        isLvlReached
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}>
                        Lvl {reward.level}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block sm:hidden">Recompensas do Passe</span>
                    </div>

                    {/* Free Track Reward Box */}
                    <div className="flex-1 p-2 bg-white dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{reward.free.icon}</span>
                        <div>
                          <span className="text-[8px] font-mono font-bold text-slate-400 block uppercase">Gratuito</span>
                          <span className="text-xs font-bold leading-none">{reward.free.name}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => claimBPReward(reward.level, false)}
                        disabled={!isLvlReached}
                        className={`px-2 py-1 text-[9px] font-mono font-bold uppercase rounded-lg transition-all ${
                          isLvlReached
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Resgatar
                      </button>
                    </div>

                    {/* Premium Track Reward Box */}
                    <div className="flex-1 p-2 bg-gradient-to-tr from-amber-500/5 to-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{reward.premium.icon}</span>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] font-mono font-bold text-amber-600 block uppercase">Premium</span>
                            <Crown className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                          </div>
                          <span className="text-xs font-bold leading-none text-slate-800 dark:text-slate-100">{reward.premium.name}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => claimBPReward(reward.level, true)}
                        disabled={!isLvlReached || !isPremium}
                        className={`px-2 py-1 text-[9px] font-mono font-bold uppercase rounded-lg transition-all ${
                          isLvlReached && isPremium
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isPremium ? 'Resgatar' : 'Bloqueado'}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUETS / MISSÕES */}
      {activeSubTab === 'quests' && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl text-left space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">Mural de Missões da Temporada</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ganhe XP de Battle Pass e pacotes de moedas cumprindo os desafios listados.</p>
            </div>
            
            <div className="flex gap-2">
              <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 text-indigo-500 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider">
                Resgatadas: {completedQuests.length} / {questsList.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questsList.map((quest) => {
              const isCompleted = quest.current >= quest.target;
              const isAlreadyClaimed = completedQuests.includes(quest.id);
              const pct = Math.min(100, (quest.current / quest.target) * 100);
              
              return (
                <div 
                  key={quest.id} 
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isAlreadyClaimed
                      ? 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-850/50 opacity-75'
                      : isCompleted
                      ? 'bg-indigo-500/5 border-indigo-500/30 shadow-md shadow-indigo-500/5'
                      : 'bg-white dark:bg-slate-950 border-slate-150 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        quest.type === 'daily' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        quest.type === 'weekly' ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' :
                        'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                      }`}>
                        {quest.type} - {quest.category}
                      </span>
                      
                      {isAlreadyClaimed ? (
                        <span className="text-[10px] font-mono text-emerald-500 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Resgatado
                        </span>
                      ) : isCompleted ? (
                        <span className="text-[10px] font-mono text-indigo-500 font-bold animate-pulse">
                          Pronto para Coletar
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">
                          Em Progresso
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mt-1 leading-tight">
                      {quest.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {quest.desc}
                    </p>
                  </div>

                  <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-900">
                    {/* Goal progress numbers */}
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Progresso:</span>
                      <strong className={isCompleted ? 'text-indigo-500' : 'text-slate-700 dark:text-slate-200'}>
                        {quest.current} / {quest.target}
                      </strong>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isAlreadyClaimed ? 'bg-slate-350' : isCompleted ? 'bg-indigo-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Reward & claim button row */}
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-mono">
                        <span className="text-slate-400 block uppercase text-[8px]">Recompensa</span>
                        <strong className="text-indigo-500 dark:text-indigo-400 flex items-center gap-1 font-bold">
                          {quest.rewardType === 'xp' ? `⭐ +${quest.rewardVal} XP` : 
                           quest.rewardType === 'coins' ? `🪙 +${quest.rewardVal} Moedas` : 
                           `🎁 +${quest.rewardVal} Caixa`}
                        </strong>
                      </div>

                      {isAlreadyClaimed ? (
                        <button disabled className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg text-[10px] font-mono uppercase font-black cursor-not-allowed">
                          Coletado
                        </button>
                      ) : isCompleted ? (
                        <button
                          onClick={() => claimQuest(quest.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-mono uppercase font-black cursor-pointer shadow transition-all hover:scale-105"
                        >
                          Coletar
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            // Quick Action Help
                            if (quest.id === 'q_daily_chat') {
                              if (setActiveTab) setActiveTab('chat');
                            } else if (quest.id === 'q_daily_play') {
                              if (setActiveTab) setActiveTab('games');
                            } else {
                              onTriggerToast('💡 Execute a ação descrita para completar a meta!', true);
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[10px] font-mono uppercase font-black cursor-pointer transition-colors"
                        >
                          Ir Fazer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CALENDÁRIO DE LOGIN */}
      {activeSubTab === 'calendar' && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl text-left space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">Calendário de Check-In Diário</h3>
              <p className="text-xs text-slate-400 mt-0.5">Faça login e marque o dia correspondente para receber os prêmios da grade do mês.</p>
            </div>

            <button
              onClick={handleDailyCheckIn}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black uppercase font-mono cursor-pointer shadow transition-all"
            >
              Fazer Check-In de Hoje (Dia {dailyCheckedIn.length + 1})
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {calendarDays.map((item) => {
              const isChecked = dailyCheckedIn.includes(item.day);
              const isToday = dailyCheckedIn.length + 1 === item.day;
              
              return (
                <div 
                  key={item.day} 
                  className={`p-3 rounded-xl border flex flex-col justify-between items-center text-center gap-2 relative transition-all ${
                    isChecked
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
                      : isToday
                      ? 'bg-indigo-500/5 border-indigo-500/40 ring-2 ring-indigo-500/20 text-indigo-600 dark:text-indigo-400 scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] font-mono font-black text-slate-400 uppercase">Dia {item.day}</span>
                    {isChecked && (
                      <span className="text-[11px] text-emerald-500 font-bold">✓</span>
                    )}
                  </div>

                  <span className="text-2xl my-1">{item.reward.icon}</span>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold block truncate leading-tight">{item.reward.name}</span>
                    <span className="text-[8px] font-mono text-slate-400 block uppercase">{item.reward.type}</span>
                  </div>

                  {isToday && (
                    <div className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-indigo-500" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: LOOTBOXES */}
      {activeSubTab === 'lootboxes' && (
        <div className="space-y-6 text-left">
          {/* Active Open box overlay / animation view */}
          {openingBoxType && (
            <div className="p-6 bg-slate-950 border border-indigo-500/30 rounded-3xl text-center space-y-6 relative overflow-hidden animate-fadeIn shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent pointer-events-none" />
              
              {openingStage === 'counting' ? (
                <div className="space-y-4 py-8">
                  <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                    <span className="text-4xl font-mono font-black text-indigo-400">{countdown}</span>
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Descriptografando Caixa {openingBoxType.toUpperCase()}...</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">Preparando chaves de segurança e gerando sementes criptográficas para o drop do loot.</p>
                </div>
              ) : (
                <div className="space-y-6 py-4 animate-scaleIn">
                  <div>
                    <span className="text-4xl">🎁</span>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mt-2">Loot Desbloqueado!</h3>
                    <p className="text-xs text-slate-400">Recompensas depositadas automaticamente na sua conta e carteira do ecossistema.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
                    {revealedRewards.map((reward, i) => (
                      <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1">
                        <span className="text-2xl block">{reward.icon}</span>
                        <strong className="text-xs font-bold text-slate-300 block">{reward.name}</strong>
                        <span className="text-sm font-mono font-black text-indigo-400 block">{reward.amount}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={finishLootboxOpening}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition-all shadow-lg"
                  >
                    Confirmar e Fechar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* List of current boxes */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-5">
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight font-sans">Seu Cofre de Caixas de Loot (Drops)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Caixas adquiridas por check-in, missões de estúdio ou compradas no marketplace.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { type: 'common', name: 'Caixa de Loot Comum', desc: 'Drops básicos de moedas e XP', icon: '🎁', color: 'bg-slate-50 border-slate-200' },
                { type: 'rare', name: 'Caixa de Loot Rara', desc: 'Loot aprimorado com vidas e cosméticos', icon: '💎', color: 'bg-cyan-500/5 border-cyan-500/20' },
                { type: 'legendary', name: 'Caixa de Loot Lendária', desc: 'Exclusividade com títulos, badges e mega moedas', icon: '👑', color: 'bg-amber-500/5 border-amber-500/20' },
                { type: 'sponsored', name: 'Caixa de Marca Patrocinada', desc: 'Promoções especiais das marcas e drops Nitro', icon: '🥤', color: 'bg-red-500/5 border-red-500/20' }
              ].map((box) => {
                const count = boxesInventory.find(b => b.type === box.type)?.count ?? 0;
                return (
                  <div key={box.type} className={`p-4 rounded-2xl border flex flex-col justify-between gap-4 ${box.color}`}>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{box.icon}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-mono font-bold">
                          {count} Disponíveis
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none mt-1">
                        {box.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        {box.desc}
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenLootbox(box.type as any)}
                      disabled={count <= 0 || openingBoxType !== null}
                      className={`w-full py-2 rounded-xl text-xs font-bold uppercase cursor-pointer transition-all ${
                        count > 0 && openingBoxType === null
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/5'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Abrir Caixa Drop
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PERFIL / EMBLMAS & TÍTULOS */}
      {activeSubTab === 'customize' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
          
          {/* Active Badges Setup */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">Equipar Emblemas (Máx 3)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Selecione até 3 emblemas ativos para exibir em seu perfil, chat e estúdio.</p>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {ALL_BADGES.map((badge) => {
                const isUnlocked = unlockedBadges.includes(badge.id);
                const isEquipped = activeBadges.includes(badge.id);
                return (
                  <div 
                    key={badge.id} 
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isEquipped 
                        ? 'border-indigo-500 bg-indigo-500/5' 
                        : 'border-slate-150 dark:border-slate-850 bg-slate-50 dark:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <strong className="text-xs font-bold block">{badge.name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{badge.desc}</span>
                      </div>
                    </div>

                    {isUnlocked ? (
                      <button
                        onClick={() => handleToggleBadge(badge.id)}
                        className={`px-3 py-1 text-[9px] font-mono font-bold uppercase rounded-lg transition-all ${
                          isEquipped
                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        {isEquipped ? 'Desequipar' : 'Equipar'}
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Bloqueado
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Title Setup */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">Selecionar Título Ativo</h3>
              <p className="text-xs text-slate-400 mt-0.5">Selecione um título principal para acompanhar o nome do seu piloto.</p>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {ALL_TITLES.map((title) => {
                const isUnlocked = unlockedTitles.includes(title.id);
                const isEquipped = activeTitle === title.id;
                return (
                  <div 
                    key={title.id} 
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isEquipped 
                        ? 'border-indigo-500 bg-indigo-500/5' 
                        : 'border-slate-150 dark:border-slate-850 bg-slate-50 dark:bg-slate-950'
                    }`}
                  >
                    <div>
                      <strong className="text-xs font-bold block uppercase tracking-wider text-indigo-500 dark:text-indigo-400">&lt; {title.name} &gt;</strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{title.desc}</span>
                    </div>

                    {isUnlocked ? (
                      <button
                        onClick={() => handleSelectTitle(title.id)}
                        className={`px-3 py-1 text-[9px] font-mono font-bold uppercase rounded-lg transition-all ${
                          isEquipped
                            ? 'bg-slate-250 text-slate-500 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                        }`}
                        disabled={isEquipped}
                      >
                        {isEquipped ? 'Ativo' : 'Selecionar'}
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Bloqueado
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
