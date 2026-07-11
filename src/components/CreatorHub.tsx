import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Gamepad2, 
  Tv, 
  Code, 
  ShieldAlert, 
  Clock, 
  Flame, 
  User, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Eye, 
  Heart, 
  Zap, 
  RefreshCw, 
  Play, 
  Activity, 
  Award, 
  FileText, 
  Filter, 
  Settings, 
  SlidersHorizontal,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  Download,
  Share2,
  Trash2,
  Lock,
  UserCheck,
  Plus,
  ShoppingBag,
  Send,
  Link2,
  Shield,
  Sparkles,
  Check,
  HelpCircle,
  UsersRound,
  Wallet,
  Coins,
  ArrowRight,
  ExternalLink,
  Gift,
  PlusCircle,
  Video,
  VideoOff,
  UserPlus,
  X,
  Store,
  CalendarClock,
  Target
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { PlayerStats, ShopItem, TransactionLog } from '../types';

// Let's define the Props for CreatorHub
interface CreatorHubProps {
  stats: PlayerStats;
  updateStats: (newStats: Partial<PlayerStats>) => void;
  realBalance: number;
  setRealBalance: React.Dispatch<React.SetStateAction<number>>;
  addLog: (
    type: 'earn' | 'purchase_coins' | 'purchase_booster' | 'purchase_cosmetic' | 'stage_skip',
    desc: string,
    amount: number,
    currency: 'coins' | 'real'
  ) => void;
}

// Interfaces for our creator structure
interface CreatorProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  banner: string;
  bio: string;
  badges: { id: string; name: string; icon: string; color: string; desc: string }[];
  links: { label: string; url: string; platform: string }[];
  followersCount: number;
  subscribersCount: number;
  isFollowing: boolean;
  isSubscribed: boolean;
  team: { name: string; role: string; avatar: string }[];
  moderators: { name: string; badgeColor: string; actionsCount: number }[];
  games: { id: string; name: string; image: string; downloads: number; rating: number; coinsPrice: number; plays: number }[];
  products: { id: string; name: string; description: string; price: number; currency: 'coins' | 'real'; image: string; category: string; stock: number }[];
  events: { id: string; title: string; date: string; time: string; description: string; prize: string; registered: boolean }[];
  agenda: { date: string; title: string; type: 'live' | 'tournament' | 'release'; time: string }[];
  lives: { title: string; views: number; likes: number; status: 'online' | 'offline'; rtmpUrl?: string; delayMs?: number }[];
  replays: { id: string; title: string; views: number; date: string; duration: string; coinsPrice?: number }[];
  clips: { id: string; title: string; views: number; creator: string; duration: string }[];
}

export const CreatorHub: React.FC<CreatorHubProps> = ({
  stats,
  updateStats,
  realBalance,
  setRealBalance,
  addLog
}) => {
  // Navigation: 'public_page' | 'studio'
  const [activeMode, setActiveMode] = useState<'public_page' | 'studio'>('public_page');
  
  // Studio sub-tabs
  const [studioTab, setStudioTab] = useState<'analytical' | 'financial' | 'content' | 'monetization'>('analytical');

  // Interactive state for Simulated Creator Data
  const [creator, setCreator] = useState<CreatorProfile>({
    id: 'creator_speedy_neon',
    name: 'Speedy Neon',
    handle: '@SpeedyNeonRetro',
    avatar: '⚡',
    banner: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)',
    bio: 'Desenvolvedor Indie, Piloto Profissional do Retro Speed Racer e Streamer Oficial da GameHub. Especialista em quebrar recordes na pista de Neon!',
    badges: [
      { id: 'badge_partner', name: 'Parceiro Oficial', icon: '💎', color: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30', desc: 'Criador oficial verificado pelo ecossistema GameHub' },
      { id: 'badge_speedrun', name: 'Recordista Racer', icon: '🏆', color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', desc: 'Conquistou top 1 global em Speed Racer Arcade' },
      { id: 'badge_innovator', name: 'Dev Pioneiro', icon: '⚙️', color: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30', desc: 'Publicou mais de 3 minigames na GameHub API' }
    ],
    links: [
      { label: 'Meu Portfólio de Jogos', url: 'https://retro-speedy.gamehub', platform: 'website' },
      { label: 'Canal de Clipes', url: 'https://twitch.tv/speedyneon', platform: 'twitch' },
      { label: 'Comunidade Discord', url: 'https://discord.gg/speedy-hub', platform: 'discord' }
    ],
    followersCount: 12450,
    subscribersCount: 842,
    isFollowing: false,
    isSubscribed: false,
    team: [
      { name: 'Carol Tech', role: 'Co-Produtora & Designer', avatar: '👩‍💻' },
      { name: 'Lucas Arcade', role: 'Dev de Gameplay', avatar: '👨‍🎨' },
      { name: 'Valkyria_Dev', role: 'Engenheira de Som', avatar: '👩‍🎤' }
    ],
    moderators: [
      { name: 'mod_alex_retro', badgeColor: 'bg-emerald-500', actionsCount: 142 },
      { name: 'cyber_guard', badgeColor: 'bg-indigo-500', actionsCount: 312 },
      { name: 'neon_filter_bot', badgeColor: 'bg-rose-500', actionsCount: 1450 }
    ],
    games: [
      { id: 'game_racer_neon', name: 'Retro Speed Racer v1.2', image: '🏎️', downloads: 84500, rating: 4.8, coinsPrice: 250, plays: 12400 },
      { id: 'game_neon_jump', name: 'Cyber Jump Dash', image: '🔋', downloads: 12400, rating: 4.4, coinsPrice: 0, plays: 3200 },
      { id: 'game_tiger_fury', name: 'Fúria do Tigre Cyber', image: '🐯', downloads: 54000, rating: 4.9, coinsPrice: 400, plays: 28400 }
    ],
    products: [
      { id: 'prod_skin_neon', name: 'Skin Piloto Speed Neon Gold', description: 'Cosmético ultra exclusivo com brilho dourado dinâmico na arena', price: 1500, currency: 'coins', image: '✨', category: 'avatar', stock: 45 },
      { id: 'prod_accessory_helmet', name: 'Capacete Aerodinâmico Cyber', description: 'Acessório de cabeça que fornece +10% de ganho de estilo', price: 29.90, currency: 'real', image: '🪖', category: 'avatar', stock: 12 },
      { id: 'prod_lives_mega', name: 'Pacote Supremo de Vidas (+30)', description: '30 vidas extras para reinar nas transmissões arcade do canal', price: 45.00, currency: 'real', image: '❤️', category: 'booster', stock: 999 }
    ],
    events: [
      { id: 'event_cup_neon', title: 'Copa Neón Retro Speedy', date: '2026-07-20', time: '19:00', description: 'Torneio eliminatório em alta velocidade. Prêmios em Moedas Arena para o Top 3!', prize: '🪙 15,000 Moedas Arena + Badge Especial', registered: false },
      { id: 'event_dev_stream', title: 'Live de Código Aberto: Meu Novo Minigame', date: '2026-07-15', time: '14:30', description: 'Construindo um jogo em 2 horas utilizando a API do ecossistema', prize: '🎁 Sorteio de Skins Exclusivas para Espectadores', registered: false }
    ],
    agenda: [
      { date: '15 de Julho', title: 'Live de Desenvolvimento', type: 'live', time: '14:30' },
      { date: '18 de Julho', title: 'Lançamento: Cyber Jump v2', type: 'release', time: '12:00' },
      { date: '20 de Julho', title: 'Grande Copa Neón Retro', type: 'tournament', time: '19:00' },
      { date: '24 de Julho', title: 'Stream de Speedruns', type: 'live', time: '20:00' }
    ],
    lives: [
      { title: '🔴 DESAFIO SPEEDRUN GLOBAL: Retro Speed Racer', views: 542, likes: 210, status: 'online', rtmpUrl: 'rtmp://live.gamehub.tv/speedy_neon', delayMs: 42 }
    ],
    replays: [
      { id: 'rep_01', title: 'Gravação Completa: Copa Velocidade Máxima', views: 3200, date: '05/07/2026', duration: '01:45:12', coinsPrice: 50 },
      { id: 'rep_02', title: 'Live Testando a nova Mecânica de Derrapagem', views: 1840, date: '28/06/2026', duration: '02:10:45' }
    ],
    clips: [
      { id: 'clip_01', title: 'Curva 4 Perfeita sem Frear! (WR)', views: 12400, creator: 'Lady_Gamer_99', duration: '00:30' },
      { id: 'clip_02', title: 'Aquele pulo milimétrico de R$ 100 reais', views: 8900, creator: 'PilotoDoFuturo', duration: '00:45' },
      { id: 'clip_03', title: 'RTP Boost ativado no momento exato', views: 4200, creator: 'Mod_Alex', duration: '00:15' }
    ]
  });

  // Financial status inside the Studio backoffice
  const [revenue, setRevenue] = useState({
    totalEarned: 18450.50,
    withdrawable: 4850.25,
    pending: 13600.25,
    subscriptionsShare: 6420.00,
    donationsShare: 4850.50,
    marketplaceSales: 7180.00,
    advertisingShare: 186.00,
    sponsorshipsShare: 1150.00,
    commissionsPaid: 1540.00,
    splitRate: 85 // 85% creator, 15% platform fee
  });

  // Partner Program Tiers
  const [partnerTier, setPartnerTier] = useState({
    level: 'Gold Partner',
    followersNeeded: 500,
    subscribersNeeded: 50,
    nextLevel: 'Diamond Creator Elite',
    nextFollowers: 1000,
    nextSubscribers: 200,
    bonusRate: 5 // +5% commission bonus (making it 85% instead of 80%)
  });

  // Co-producers revenue splits (Comissões & Receita Compartilhada)
  const [autoDistributeTeam, setAutoDistributeTeam] = useState<boolean>(true);
  const [teamCuts, setTeamCuts] = useState([
    { name: 'Carol Tech', role: 'Co-Produtora', cut: 10 },
    { name: 'Lucas Arcade', role: 'Dev Gameplay', cut: 5 }
  ]);

  // Crowdfunding goals (Metas de Arrecadação)
  const [goals, setGoals] = useState([
    { id: 'goal_camera', title: 'Câmera DSLR 4K para Estúdio', target: 2000, current: 1650, currency: 'BRL', icon: '📷' },
    { id: 'goal_server', title: 'Servidor Dedicado para Torneio VIP', target: 5000, current: 3500, currency: 'coins', icon: '🖥️' }
  ]);

  // Advertising configurations
  const [adSettings, setAdSettings] = useState({
    autoAdsEnabled: true,
    adIntervalMinutes: 10,
    activeFormat: 'overlay', // overlay, midroll, banner
    impressionsThisMonth: 12400,
    cpmRate: 15.00, // R$ 15 per 1k views
    revenueGenerated: 186.00
  });

  // Sponsorship contracts (Patrocínios)
  const [sponsorships, setSponsorships] = useState([
    { id: 'sp_monster', brand: 'Monster Energy Cup', logo: '🟢', reward: 250, status: 'active', requirement: 100, desc: 'Patrocínio oficial de bebidas para campeonatos de drift.' },
    { id: 'sp_logitech', brand: 'Logitech GZ Wearables', logo: '🔵', reward: 600, status: 'available', requirement: 500, desc: 'Campanha de exibição de mouses e teclados mecânicos em lives.' },
    { id: 'sp_cyberx', brand: 'Cyber-X Nutrition', logo: '⚡', reward: 1200, status: 'available', requirement: 1000, desc: 'Patrocínio de nutrição gamer para transmissões de alta resistência.' }
  ]);

  // Detailed Transaction History / Statement Logs (Relatórios, Extratos e Histórico)
  const [transactionLogs, setTransactionLogs] = useState([
    { id: 'TX-9482', date: '11/07/2026 14:22', type: 'subscription', desc: 'Inscrição VIP de @gamer_retro', gross: 25.00, fee: 3.75, net: 21.25, currency: 'BRL', status: 'completed' },
    { id: 'TX-9481', date: '11/07/2026 11:05', type: 'donation', desc: 'Doação de Bits de @stream_fan', gross: 50.00, fee: 7.50, net: 42.50, currency: 'BRL', status: 'completed' },
    { id: 'TX-9480', date: '10/07/2026 21:44', type: 'product', desc: 'Venda de Skin Piloto Speed Neon Gold', gross: 75.00, fee: 11.25, net: 63.75, currency: 'BRL', status: 'completed' },
    { id: 'TX-9479', date: '10/07/2026 18:30', type: 'ad_payout', desc: 'Rendimento de Banners Publicitários (1.2k views)', gross: 18.00, fee: 2.70, net: 15.30, currency: 'BRL', status: 'completed' },
    { id: 'TX-9478', date: '09/07/2026 15:00', type: 'sponsorship', desc: 'Adiantamento Semanal: Monster Energy Cup', gross: 250.00, fee: 37.50, net: 212.50, currency: 'BRL', status: 'completed' },
    { id: 'TX-9477', date: '08/07/2026 12:00', type: 'commission', desc: 'Repasse Co-produtor: Carol Tech (10% cut)', gross: -18.45, fee: 0.00, net: -18.45, currency: 'BRL', status: 'completed' },
    { id: 'TX-9476', date: '07/07/2026 10:15', type: 'gift', desc: 'Presente Recebido: Super Energético de @luc_racer', gross: 15.00, fee: 2.25, net: 12.75, currency: 'BRL', status: 'completed' }
  ]);

  // Financial search and tab filters
  const [activeLogFilter, setActiveLogFilter] = useState<string>('all');
  const [financialSearch, setFinancialSearch] = useState<string>('');

  const [simulatedLiveViews, setSimulatedLiveViews] = useState<number>(542);
  const [showDonateModal, setShowDonateModal] = useState<boolean>(false);
  const [donateAmount, setDonateAmount] = useState<string>('50');
  const [donateCurrency, setDonateCurrency] = useState<'coins' | 'real'>('coins');
  const [selectedGift, setSelectedGift] = useState<{ name: string; price: number; icon: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New item creators for Content and Monetization panels
  const [newLiveTitle, setNewLiveTitle] = useState<string>('');
  const [newGameName, setNewGameName] = useState<string>('');
  const [newGamePrice, setNewGamePrice] = useState<string>('150');
  const [newProductName, setNewProductName] = useState<string>('');
  const [newProductPrice, setNewProductPrice] = useState<string>('10');
  const [newProductCurrency, setNewProductCurrency] = useState<'coins' | 'real'>('coins');
  const [newProductCategory, setNewProductCategory] = useState<string>('avatar');
  const [newEventTitle, setNewEventTitle] = useState<string>('');
  const [newEventPrize, setNewEventPrize] = useState<string>('');
  const [newEventDate, setNewEventDate] = useState<string>('');

  // Analytics graph state (historical simulation)
  const [chartMetric, setChartMetric] = useState<'views' | 'subscribers' | 'revenue'>('views');
  const [analyticsHistory, setAnalyticsHistory] = useState([
    { label: 'Jan', views: 12000, subscribers: 310, revenue: 1450 },
    { label: 'Fev', views: 15400, subscribers: 420, revenue: 2100 },
    { label: 'Mar', views: 18900, subscribers: 510, revenue: 2900 },
    { label: 'Abr', views: 24500, subscribers: 640, revenue: 3800 },
    { label: 'Mai', views: 32000, subscribers: 740, revenue: 4900 },
    { label: 'Jun', views: 45200, subscribers: 842, revenue: 6420 }
  ]);

  // Simulation for live view counter flutuation
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedLiveViews(prev => {
        const delta = Math.floor(Math.random() * 15) - 7;
        const nextViews = Math.max(480, prev + delta);
        // Sync with creator state
        setCreator(c => ({
          ...c,
          lives: c.lives.map(l => l.status === 'online' ? { ...l, views: nextViews } : l)
        }));
        return nextViews;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const triggerToast = (msg: string, success: boolean = true) => {
    playSound.click();
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Follow Creator action
  const toggleFollow = () => {
    playSound.click();
    setCreator(prev => {
      const isNowFollowing = !prev.isFollowing;
      const nextCount = isNowFollowing ? prev.followersCount + 1 : prev.followersCount - 1;
      
      triggerToast(
        isNowFollowing 
          ? `❤️ Você agora segue ${prev.name}! Alertas de transmissões ativados.` 
          : `Deixou de seguir ${prev.name}.`
      );

      return {
        ...prev,
        isFollowing: isNowFollowing,
        followersCount: nextCount
      };
    });
  };

  // 2. Subscribe to Creator action (Economia Virtual: custos de Moedas Arena)
  const handleSubscribe = () => {
    const subCost = 500; // 500 Arena Coins for monthly subscription
    if (creator.isSubscribed) {
      triggerToast('Você já é assinante ativo deste criador! Assinatura renovada até o próximo mês.');
      return;
    }

    if (stats.coins < subCost) {
      playSound.gameover();
      triggerToast('❌ Saldo insuficiente! Você precisa de 500 Moedas Arena para assinar o canal.', false);
      return;
    }

    // Deduct coins and log transaction
    playSound.victory();
    updateStats({ coins: stats.coins - subCost });
    addLog(
      'purchase_cosmetic',
      `Assinatura Mensal VIP Premium do Canal: ${creator.name}`,
      subCost,
      'coins'
    );

    setCreator(prev => ({
      ...prev,
      isSubscribed: true,
      subscribersCount: prev.subscribersCount + 1
    }));

    const grossVal = 25.00; // 500 Coins = R$ 25.00
    const feeVal = grossVal * 0.15;
    const netVal = grossVal - feeVal;

    // Update revenue on creator studio
    setRevenue(prev => ({
      ...prev,
      totalEarned: prev.totalEarned + netVal,
      withdrawable: prev.withdrawable + netVal,
      subscriptionsShare: prev.subscriptionsShare + netVal
    }));

    // Add to transaction logs
    const txId = `TX-${Math.floor(Math.random() * 9000) + 1000}`;
    const newTx = {
      id: txId,
      date: new Date().toLocaleString('pt-BR'),
      type: 'subscription',
      desc: `Inscrição VIP de @Você`,
      gross: grossVal,
      fee: feeVal,
      net: netVal,
      currency: 'BRL',
      status: 'completed'
    };
    setTransactionLogs(prev => [newTx, ...prev]);

    triggerToast(`🎉 Parabéns! Você assinou ${creator.name}! Benefícios e badges exclusivos desbloqueados no chat.`);
  };

  // 3. Make donation to Creator (Virtual Economy: Arena Coins or Real Balance)
  const executeDonation = () => {
    const amountNum = selectedGift ? selectedGift.price : parseFloat(donateAmount);
    const currencyType = selectedGift ? 'coins' : donateCurrency;
    const donationLabel = selectedGift 
      ? `Presente Especial: ${selectedGift.icon} ${selectedGift.name}`
      : `Doação Direct-Bit (${currencyType === 'coins' ? 'Moedas Arena' : 'Saldo Real'})`;

    if (isNaN(amountNum) || amountNum <= 0) {
      triggerToast('❌ Insira um valor válido para doação.', false);
      return;
    }

    if (currencyType === 'coins') {
      if (stats.coins < amountNum) {
        playSound.gameover();
        triggerToast(`❌ Saldo insuficiente de moedas! Você possui ${stats.coins} moedas.`, false);
        return;
      }

      // Deduct coins
      updateStats({ coins: stats.coins - amountNum });
      addLog(
        'purchase_booster',
        `${donationLabel} para ${creator.name}: ${amountNum} moedas`,
        amountNum,
        'coins'
      );
      
      const grossVal = amountNum * 0.05; // 1 coin = R$ 0.05 conversion
      const feeVal = grossVal * 0.15;
      const netVal = grossVal - feeVal;

      // Add to creator dashboard
      setRevenue(prev => ({
        ...prev,
        totalEarned: prev.totalEarned + netVal,
        withdrawable: prev.withdrawable + netVal,
        donationsShare: prev.donationsShare + netVal
      }));

      // Add to transaction logs
      const txId = `TX-${Math.floor(Math.random() * 9000) + 1000}`;
      const newTx = {
        id: txId,
        date: new Date().toLocaleString('pt-BR'),
        type: selectedGift ? 'gift' : 'donation',
        desc: `${donationLabel} de @Você`,
        gross: grossVal,
        fee: feeVal,
        net: netVal,
        currency: 'BRL',
        status: 'completed'
      };
      setTransactionLogs(prev => [newTx, ...prev]);

    } else {
      if (realBalance < amountNum) {
        playSound.gameover();
        triggerToast(`❌ Saldo real insuficiente! Você possui R$ ${realBalance.toFixed(2)}.`, false);
        return;
      }

      // Deduct balance
      setRealBalance(prev => prev - amountNum);
      addLog(
        'purchase_booster',
        `${donationLabel} para ${creator.name}: R$ ${amountNum.toFixed(2)}`,
        amountNum,
        'real'
      );

      const grossVal = amountNum;
      const feeVal = grossVal * 0.15;
      const netVal = grossVal - feeVal;

      // Add directly to creator dashboard
      setRevenue(prev => ({
        ...prev,
        totalEarned: prev.totalEarned + netVal,
        withdrawable: prev.withdrawable + netVal,
        donationsShare: prev.donationsShare + netVal
      }));

      // Add to transaction logs
      const txId = `TX-${Math.floor(Math.random() * 9000) + 1000}`;
      const newTx = {
        id: txId,
        date: new Date().toLocaleString('pt-BR'),
        type: 'donation',
        desc: `Doação Direta (BRL) de @Você`,
        gross: grossVal,
        fee: feeVal,
        net: netVal,
        currency: 'BRL',
        status: 'completed'
      };
      setTransactionLogs(prev => [newTx, ...prev]);
    }

    playSound.jackpot();
    setShowDonateModal(false);
    setSelectedGift(null);
    triggerToast(`🎁 ${selectedGift ? `Presente "${selectedGift.name}"` : 'Doação'} enviado com sucesso! Speedy Neon agradece!`);
  };

  // 4. Register for creator event (Eventos)
  const toggleRegisterEvent = (eventId: string) => {
    playSound.click();
    setCreator(prev => ({
      ...prev,
      events: prev.events.map(ev => {
        if (ev.id === eventId) {
          const nextRegistered = !ev.registered;
          triggerToast(
            nextRegistered 
              ? `📅 Confirmado! Sua vaga foi reservada no evento "${ev.title}".`
              : `Cancelada sua reserva no evento "${ev.title}".`
          );
          return { ...ev, registered: nextRegistered };
        }
        return ev;
      })
    }));
  };

  // 5. Purchase creator published games
  const purchaseCreatorGame = (gameId: string, price: number, gameName: string) => {
    if (price === 0) {
      playSound.jump();
      triggerToast(`🕹️ Lançando Jogo Gratuito: ${gameName}! Divirta-se na Arena!`);
      return;
    }

    if (stats.coins < price) {
      playSound.gameover();
      triggerToast(`❌ Saldo insuficiente! Você precisa de ${price} Moedas Arena para comprar o jogo.`, false);
      return;
    }

    playSound.purchase();
    updateStats({ coins: stats.coins - price });
    addLog(
      'purchase_cosmetic',
      `Licença vitalícia adquirida para o Jogo: ${gameName}`,
      price,
      'coins'
    );

    const grossVal = price * 0.05; // 1 Coin = R$ 0.05
    const feeVal = grossVal * 0.15;
    const netVal = grossVal - feeVal;

    // Track developer gains on Studio backoffice
    setRevenue(prev => ({
      ...prev,
      totalEarned: prev.totalEarned + netVal,
      withdrawable: prev.withdrawable + netVal,
      marketplaceSales: prev.marketplaceSales + netVal
    }));

    // Add to transaction logs
    const txId = `TX-${Math.floor(Math.random() * 9000) + 1000}`;
    const newTx = {
      id: txId,
      date: new Date().toLocaleString('pt-BR'),
      type: 'product',
      desc: `Venda de Jogo: ${gameName}`,
      gross: grossVal,
      fee: feeVal,
      net: netVal,
      currency: 'BRL',
      status: 'completed'
    };
    setTransactionLogs(prev => [newTx, ...prev]);

    triggerToast(`🎮 Compra efetuada! O jogo "${gameName}" foi adicionado à sua biblioteca Arcade.`);
  };

  // 6. Purchase creator products (Marketplace Integration & Economy)
  const buyCreatorProduct = (prodId: string, price: number, name: string, currency: 'coins' | 'real') => {
    if (currency === 'coins') {
      if (stats.coins < price) {
        playSound.gameover();
        triggerToast(`❌ Moedas insuficientes! Esse item custa ${price} Moedas Arena.`, false);
        return;
      }

      playSound.purchase();
      updateStats({ 
        coins: stats.coins - price,
        // If it's a skin/accessory, unlock it in the player profile!
        unlockedSkins: prodId === 'prod_skin_neon' ? [...(stats.unlockedSkins || []), 'gold_neon_rider'] : stats.unlockedSkins
      });

      addLog(
        'purchase_cosmetic',
        `Compra de Produto de Criador: ${name}`,
        price,
        'coins'
      );

      // Deduct stock
      setCreator(prev => ({
        ...prev,
        products: prev.products.map(p => p.id === prodId ? { ...p, stock: Math.max(0, p.stock - 1) } : p)
      }));

      const grossVal = price * 0.05; // 1 Coin = R$ 0.05
      const feeVal = grossVal * 0.15;
      const netVal = grossVal - feeVal;

      // Update creator revenue split
      setRevenue(prev => ({
        ...prev,
        totalEarned: prev.totalEarned + netVal,
        withdrawable: prev.withdrawable + netVal,
        marketplaceSales: prev.marketplaceSales + netVal
      }));

      // Add to transaction logs
      const txId = `TX-${Math.floor(Math.random() * 9000) + 1000}`;
      const newTx = {
        id: txId,
        date: new Date().toLocaleString('pt-BR'),
        type: 'product',
        desc: `Venda de Produto: ${name}`,
        gross: grossVal,
        fee: feeVal,
        net: netVal,
        currency: 'BRL',
        status: 'completed'
      };
      setTransactionLogs(prev => [newTx, ...prev]);

    } else {
      if (realBalance < price) {
        playSound.gameover();
        triggerToast(`❌ Saldo de compras insuficiente! Esse item custa R$ ${price.toFixed(2)}.`, false);
        return;
      }

      playSound.purchase();
      setRealBalance(prev => prev - price);
      updateStats({
        // If it's supremo lives packet, add lives to the player stats directly!
        lives: prodId === 'prod_lives_mega' ? stats.lives + 30 : stats.lives
      });

      addLog(
        'purchase_booster',
        `E-commerce Marketplace: Produto de Criador (${name})`,
        price,
        'real'
      );

      // Deduct stock
      setCreator(prev => ({
        ...prev,
        products: prev.products.map(p => p.id === prodId ? { ...p, stock: Math.max(0, p.stock - 1) } : p)
      }));

      // Update creator revenue split (85% net creator payout)
      const grossVal = price;
      const feeVal = grossVal * (1 - revenue.splitRate / 100);
      const netVal = grossVal - feeVal;

      setRevenue(prev => ({
        ...prev,
        totalEarned: prev.totalEarned + netVal,
        withdrawable: prev.withdrawable + netVal,
        marketplaceSales: prev.marketplaceSales + netVal
      }));

      // Add to transaction logs
      const txId = `TX-${Math.floor(Math.random() * 9000) + 1000}`;
      const newTx = {
        id: txId,
        date: new Date().toLocaleString('pt-BR'),
        type: 'product',
        desc: `Venda de E-commerce: ${name}`,
        gross: grossVal,
        fee: feeVal,
        net: netVal,
        currency: 'BRL',
        status: 'completed'
      };
      setTransactionLogs(prev => [newTx, ...prev]);
    }

    triggerToast(`🛍️ Sucesso! Você adquiriu "${name}" integrado de forma resiliente ao inventário da conta.`);
  };

  // 7. Simulated Creator Backoffice: Add Live Stream (Content Panel)
  const handleCreateLive = () => {
    if (!newLiveTitle.trim()) {
      triggerToast('Insira um título para a Transmissão.', false);
      return;
    }

    setCreator(prev => ({
      ...prev,
      lives: [
        { title: `🔴 ${newLiveTitle}`, views: 0, likes: 0, status: 'online', rtmpUrl: `rtmp://live.gamehub.tv/stream-${Math.floor(Math.random() * 90000)}`, delayMs: 30 },
        ...prev.lives.map(l => ({ ...l, status: 'offline' as const }))
      ]
    }));

    playSound.victory();
    setNewLiveTitle('');
    triggerToast('📡 Nova Live iniciada no servidor RTMP com sucesso!');
  };

  // 8. Simulated Creator Backoffice: Stop active live
  const handleStopLive = () => {
    playSound.click();
    setCreator(prev => {
      const activeLive = prev.lives.find(l => l.status === 'online');
      if (!activeLive) return prev;

      // Automatically archive live as a Replay in the Database
      const newReplayId = `rep_${Math.floor(Math.random() * 9000) + 1000}`;
      const newReplay = {
        id: newReplayId,
        title: `Replay: ${activeLive.title.replace('🔴 ', '')}`,
        views: activeLive.views + Math.floor(Math.random() * 150),
        date: new Date().toLocaleDateString('pt-BR'),
        duration: '01:15:00',
        coinsPrice: 20
      };

      triggerToast('📺 Live encerrada! Gravação enviada e replay salvo automaticamente no banco.');

      return {
        ...prev,
        lives: prev.lives.map(l => ({ ...l, status: 'offline' as const })),
        replays: [newReplay, ...prev.replays]
      };
    });
  };

  // 9. Simulated Creator Backoffice: Publish Game (Content Panel)
  const handlePublishGame = () => {
    if (!newGameName.trim()) {
      triggerToast('Insira o nome do Jogo.', false);
      return;
    }

    const price = parseInt(newGamePrice) || 0;
    const newGame = {
      id: `game_${Math.floor(Math.random() * 90000)}`,
      name: newGameName,
      image: '🎮',
      downloads: 1,
      rating: 5.0,
      coinsPrice: price,
      plays: 0
    };

    setCreator(prev => ({
      ...prev,
      games: [newGame, ...prev.games]
    }));

    playSound.victory();
    setNewGameName('');
    triggerToast(`🚀 Jogo "${newGameName}" compilado e publicado no Marketplace da GameHub!`);
  };

  // 10. Simulated Creator Backoffice: Add Product (Monetization Panel)
  const handleAddProduct = () => {
    if (!newProductName.trim()) {
      triggerToast('Insira o nome do Produto.', false);
      return;
    }

    const price = parseFloat(newProductPrice) || 5;
    const newProduct = {
      id: `prod_${Math.floor(Math.random() * 90000)}`,
      name: newProductName,
      description: `Item premium oficial do catálogo de Speedy Neon para personalização`,
      price: price,
      currency: newProductCurrency,
      image: newProductCategory === 'avatar' ? '🎭' : '🔋',
      category: newProductCategory,
      stock: 50
    };

    setCreator(prev => ({
      ...prev,
      products: [newProduct, ...prev.products]
    }));

    playSound.victory();
    setNewProductName('');
    triggerToast(`📦 Produto "${newProductName}" integrado à loja virtual do criador no Marketplace!`);
  };

  // 11. Simulated Creator Backoffice: Add Event & Calendar Agenda
  const handleCreateEvent = () => {
    if (!newEventTitle.trim()) {
      triggerToast('Insira o título do Evento.', false);
      return;
    }

    const nextEvent = {
      id: `event_${Math.floor(Math.random() * 90000)}`,
      title: newEventTitle,
      date: newEventDate || '2026-08-01',
      time: '18:00',
      description: 'Evento competitivo ao vivo do ecossistema criador.',
      prize: newEventPrize || '🪙 500 Moedas Arena',
      registered: false
    };

    setCreator(prev => ({
      ...prev,
      events: [nextEvent, ...prev.events],
      agenda: [
        { date: newEventDate ? `${newEventDate.split('-')[2]}/${newEventDate.split('-')[1]}` : 'Próximo', title: newEventTitle, type: 'live', time: '18:00' },
        ...prev.agenda
      ]
    }));

    playSound.victory();
    setNewEventTitle('');
    setNewEventPrize('');
    triggerToast(`📅 Evento "${newEventTitle}" agendado com sucesso no calendário público!`);
  };

  // 12. Simulate Creator Withdrawal (Painel Financeiro)
  const handleCreatorWithdraw = () => {
    if (revenue.withdrawable <= 10) {
      triggerToast('❌ Saldo insuficiente! Valor mínimo de resgate é de R$ 10,00.', false);
      return;
    }

    const cashOut = revenue.withdrawable;
    playSound.jackpot();
    
    // Transfer from creator earnings to player Saldo Real (Virtual Economy cycle!)
    setRealBalance(prev => prev + cashOut);
    addLog(
      'earn',
      `Saque de Estúdio de Criador: Speedy Neon para Saldo Principal`,
      cashOut,
      'real'
    );

    // Dynamic co-producer commissions split
    let commissionsNote = '';
    let totalCommissionsPaid = 0;
    if (autoDistributeTeam) {
      const carolShare = cashOut * 0.10; // Carol 10%
      const lucasShare = cashOut * 0.05; // Lucas 5%
      totalCommissionsPaid = carolShare + lucasShare;
      commissionsNote = ` Carol Tech (10%): R$ ${carolShare.toFixed(2)} | Lucas Arcade (5%): R$ ${lucasShare.toFixed(2)} distribuídos automaticamente.`;
      
      // Log co-producer split as individual logs
      const txIdCarol = `TX-${Math.floor(Math.random() * 9000) + 1000}`;
      const txIdLucas = `TX-${Math.floor(Math.random() * 9000) + 1000}`;
      
      setTransactionLogs(prev => [
        {
          id: txIdCarol,
          date: new Date().toLocaleString('pt-BR'),
          type: 'commission',
          desc: `Repasse Co-produtora: Carol Tech (10% cut)`,
          gross: -carolShare,
          fee: 0,
          net: -carolShare,
          currency: 'BRL',
          status: 'completed'
        },
        {
          id: txIdLucas,
          date: new Date().toLocaleString('pt-BR'),
          type: 'commission',
          desc: `Repasse Co-produtor: Lucas Arcade (5% cut)`,
          gross: -lucasShare,
          fee: 0,
          net: -lucasShare,
          currency: 'BRL',
          status: 'completed'
        },
        ...prev
      ]);
    }

    // Add withdrawal log
    const txId = `TX-${Math.floor(Math.random() * 9000) + 1000}`;
    const newTx = {
      id: txId,
      date: new Date().toLocaleString('pt-BR'),
      type: 'withdrawal',
      desc: `Saque de Ganhos: Estúdio Speedy Neon`,
      gross: -cashOut,
      fee: 0.00,
      net: -cashOut,
      currency: 'BRL',
      status: 'completed'
    };
    setTransactionLogs(prev => [newTx, ...prev]);

    setRevenue(prev => ({
      ...prev,
      withdrawable: 0,
      commissionsPaid: prev.commissionsPaid + totalCommissionsPaid
    }));

    triggerToast(`💸 Resgate de R$ ${cashOut.toFixed(2)} transferido integralmente para seu Saldo Principal!${commissionsNote}`);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-2xl transition-colors duration-300">
      
      {/* 1. COMPACT CREATOR BANNER / HUD NAVIGATION HERO */}
      <div className="p-6 text-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ background: creator.banner }}>
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-xs pointer-events-none" />
        
        {/* Creator Info */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-xl">
            {creator.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight">{creator.name}</h2>
              <span className="text-[10px] bg-indigo-500/30 border border-white/20 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase">
                Creator Pro 🎥
              </span>
            </div>
            <p className="text-white/80 text-xs font-mono mt-0.5">{creator.handle}</p>
            
            {/* Followers / Subscribers Stats inside header */}
            <div className="flex items-center gap-4 mt-2 text-xs text-white/90">
              <div className="flex items-center gap-1 font-mono">
                <Users className="w-3.5 h-3.5 text-pink-300" />
                <span><strong>{creator.followersCount.toLocaleString()}</strong> seguidores</span>
              </div>
              <div className="flex items-center gap-1 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span><strong>{creator.subscribersCount.toLocaleString()}</strong> assinantes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Hub Switcher */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setActiveMode('public_page');
              playSound.click();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-tight cursor-pointer transition-all flex items-center gap-1.5 ${
              activeMode === 'public_page'
                ? 'bg-white text-slate-900 shadow-xl shadow-slate-950/20 scale-102 border-none'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Página Pública (Visão Espectador)</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('studio');
              playSound.click();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-tight cursor-pointer transition-all flex items-center gap-1.5 ${
              activeMode === 'studio'
                ? 'bg-slate-900 text-white shadow-xl shadow-black/40 scale-102 border border-slate-700/60'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Estúdio do Criador (Back-office)</span>
          </button>
        </div>
      </div>

      {/* Toast Alert Message */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="m-4 p-3 bg-indigo-950/90 text-indigo-200 border border-indigo-800/80 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-lg"
          >
            <span>{toastMessage}</span>
            <span className="text-[9px] bg-indigo-800 text-white px-2 py-0.5 rounded font-mono uppercase">Creator Hub</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 2. MODE A: PUBLIC PAGE (VISÃO ESPECTADOR)                 */}
      {/* ======================================================== */}
      {activeMode === 'public_page' && (
        <div className="p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
          
          {/* First block: Biography, Links, Badges & Action Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Biography, Links and Badges */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight font-sans">Biografia do Criador</h3>
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mt-2">{creator.bio}</p>
              </div>

              {/* Links List */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-extrabold text-slate-400 block tracking-wider">Links de Destaque</span>
                <div className="flex flex-wrap gap-2">
                  {creator.links.map((lnk, idx) => (
                    <a
                      key={idx}
                      href={lnk.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-750 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-all"
                    >
                      <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{lnk.label}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Badges List */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-extrabold text-slate-400 block tracking-wider">Conquistas &amp; Badges</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {creator.badges.map((bdg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl flex items-start gap-2 text-left transition-transform hover:scale-[1.01] ${bdg.color}`}
                      title={bdg.desc}
                    >
                      <span className="text-lg shrink-0">{bdg.icon}</span>
                      <div>
                        <strong className="text-xs block font-bold leading-none">{bdg.name}</strong>
                        <span className="text-[9px] opacity-80 mt-1 block leading-normal">{bdg.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Hub (Follow, Subscribe, Donate with Virtual Economy Integration) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight font-sans">Apoie o Criador</h3>
                <p className="text-[11px] text-slate-400 leading-normal mt-1">
                  Utilize as moedas ou saldo real da sua carteira integrada para apoiar o Speedy Neon. Todo suporte reverte vantagens imediatas para sua conta.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Follow Button */}
                <button
                  onClick={toggleFollow}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all border ${
                    creator.isFollowing
                      ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 hover:scale-[1.01]'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{creator.isFollowing ? '✓ Seguindo Speedy Neon' : 'Seguir Speedy Neon'}</span>
                </button>

                {/* Subscribe Button */}
                <button
                  onClick={handleSubscribe}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all border ${
                    creator.isSubscribed
                      ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border-amber-400 font-extrabold hover:scale-[1.01]'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-800" />
                  <span>{creator.isSubscribed ? '✓ Assinante Ativo VIP' : 'Assinar Canal (🪙 500 Moedas/mês)'}</span>
                </button>

                {/* Donate Trigger Button */}
                <button
                  onClick={() => {
                    playSound.click();
                    setShowDonateModal(true);
                  }}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Gift className="w-4 h-4 text-indigo-500" />
                  <span>Enviar Doação (Bits / Coins)</span>
                </button>
              </div>

              {/* Economy info indicator */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-[10px] font-mono text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Seu Saldo Arena:</span>
                  <strong className="text-amber-500">🪙 {stats.coins} Moedas</strong>
                </div>
                <div className="flex justify-between">
                  <span>Seu Saldo Real:</span>
                  <strong className="text-emerald-500">R$ {realBalance.toFixed(2)}</strong>
                </div>
              </div>

              {/* Crowdfunding / Donation Goals */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-[10px] font-mono uppercase font-extrabold text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5 tracking-wider">
                  <Target className="w-3.5 h-3.5" /> Metas de Arrecadação
                </span>
                <div className="space-y-3">
                  {goals.map((goal) => {
                    const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
                    return (
                      <div key={goal.id} className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold flex items-center gap-1">
                            <span>{goal.icon}</span>
                            <span className="truncate max-w-[120px]">{goal.title}</span>
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {goal.current} / {goal.target} {goal.currency === 'BRL' ? 'R$' : 'moedas'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-mono">
                          <span className="text-slate-400">Progresso:</span>
                          <strong className="text-indigo-500">{pct}%</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Second block: Active Live player / simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Live streaming viewport player */}
            <div className="lg:col-span-8 bg-slate-900 dark:bg-slate-950 p-4 md:p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">Transmissão ao Vivo</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {simulatedLiveViews} assistindo</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500" /> 420 curtidas</span>
                </div>
              </div>

              {/* Streaming Video Simulation Canvas */}
              {creator.lives.some(l => l.status === 'online') ? (
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden flex flex-col items-center justify-center text-white border border-slate-800 group">
                  
                  {/* Outer animated screen filter */}
                  <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/40 pointer-events-none" />

                  {/* Simulated game racing background inside stream */}
                  <div className="text-center space-y-3 p-4">
                    <span className="text-5xl animate-bounce inline-block">🏎️💨</span>
                    <h4 className="text-sm font-bold font-mono tracking-tight text-indigo-300">
                      {creator.lives.find(l => l.status === 'online')?.title}
                    </h4>
                    <p className="text-slate-400 text-[10px] font-mono max-w-sm mx-auto">
                      Streamer Speedy Neon está quebrando o recorde na Pista 4 (Copa Neón). Utilizando o veículo especial de corrida.
                    </p>

                    {/* Simulation stream details footer overlay */}
                    <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-slate-900/90 border border-slate-800 rounded-lg text-[9px] font-mono">
                      <span className="text-emerald-400">FPS: 60</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-indigo-400">Latência: {creator.lives[0].delayMs}ms</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-400">Bitrate: 6200 Kbps</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-video bg-slate-950 border border-slate-850 rounded-xl flex flex-col items-center justify-center text-slate-500">
                  <VideoOff className="w-12 h-12 stroke-1 text-slate-600" />
                  <h4 className="font-bold text-xs mt-3">Criador está Offline no momento</h4>
                  <p className="text-[10px] font-mono mt-1">Veja a agenda ao lado para programar sua presença.</p>
                </div>
              )}
            </div>

            {/* Agenda & Schedule list (Agenda) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-1.5 font-sans">
                  <CalendarClock className="w-4 h-4 text-indigo-500" />
                  Agenda &amp; Transmissões
                </h3>
                <span className="text-[9px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md font-bold uppercase">Julho 2026</span>
              </div>

              <div className="space-y-3">
                {creator.agenda.map((ag, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850 hover:border-indigo-100 transition-all">
                    <div className="space-y-0.5">
                      <strong className="text-xs text-slate-800 dark:text-slate-200 block font-bold leading-snug">{ag.title}</strong>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                        <span>{ag.date}</span>
                        <span>•</span>
                        <span>{ag.time}</span>
                      </div>
                    </div>
                    {/* Event Type tag */}
                    <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      ag.type === 'live' 
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                        : ag.type === 'tournament'
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                    }`}>
                      {ag.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Third block: Published Games & Custom Creator Store (Lojas e Produtos) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Creator Published Games (Jogos publicados) */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight font-sans">Jogos Publicados (Arcade Hub)</h3>
                <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                  Adquira as licenças oficiais dos jogos do Speedy Neon e jogue instantaneamente na arena global.
                </p>
              </div>

              <div className="space-y-3">
                {creator.games.map((gm) => (
                  <div key={gm.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-2xl border border-indigo-500/20 shrink-0">
                        {gm.image}
                      </div>
                      <div>
                        <strong className="text-xs text-slate-800 dark:text-slate-200 block font-bold leading-tight">{gm.name}</strong>
                        <div className="flex flex-wrap items-center gap-2 text-[9px] text-slate-400 font-mono mt-1">
                          <span className="text-amber-500">⭐ {gm.rating.toFixed(1)}</span>
                          <span>•</span>
                          <span>{gm.downloads.toLocaleString()} downloads</span>
                          <span>•</span>
                          <span className="text-indigo-400">{gm.plays.toLocaleString()} plays</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => purchaseCreatorGame(gm.id, gm.coinsPrice, gm.name)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black tracking-tight transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                    >
                      {gm.coinsPrice === 0 ? 'Lançar Grátis' : `Comprar (🪙 ${gm.coinsPrice})`}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Store & E-commerce (Lojas e Produtos com integração de Economia) */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-1.5 font-sans">
                    <Store className="w-5 h-5 text-indigo-500" />
                    Loja do Criador (E-commerce)
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                    Itens e boosters oficiais sincronizados de forma nativa com o Marketplace global.
                  </p>
                </div>
                <span className="text-[9px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-bold border border-emerald-500/20 animate-pulse">
                  Marketplace Sync ON
                </span>
              </div>

              <div className="space-y-3">
                {creator.products.map((prod) => (
                  <div key={prod.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl flex items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-xl border border-purple-500/20 shrink-0">
                        {prod.image}
                      </div>
                      <div>
                        <strong className="text-xs text-slate-800 dark:text-slate-200 block font-bold leading-none">{prod.name}</strong>
                        <p className="text-[10px] text-slate-400 leading-tight mt-1">{prod.description}</p>
                        <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-slate-400 block mt-1">Estoque: {prod.stock} un.</span>
                      </div>
                    </div>

                    <button
                      onClick={() => buyCreatorProduct(prod.id, prod.price, prod.name, prod.currency)}
                      className="px-3.5 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-[11px] font-black tracking-tight shrink-0 transition-all cursor-pointer hover:bg-indigo-600 dark:hover:bg-indigo-600 border border-slate-700/50"
                    >
                      {prod.currency === 'coins' ? `🪙 ${prod.price}` : `R$ ${prod.price.toFixed(2)}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fourth block: Replays, Clips, Team & Moderators */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Replays & Clips list (Replays e Clipes) */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Replays of past live broadcasts */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Tv className="w-4 h-4 text-purple-400" />
                    Replays de Lives Salvas
                  </h4>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {creator.replays.map((rep) => (
                      <div key={rep.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs text-slate-800 dark:text-slate-200 font-bold block truncate max-w-[140px] leading-snug">{rep.title}</strong>
                          <span className="text-[9px] text-slate-400 font-mono">{rep.duration}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                          <span>{rep.date} • {rep.views.toLocaleString()} views</span>
                          <button
                            onClick={() => {
                              playSound.jump();
                              triggerToast(`📽️ Carregando gravação completa do Replay: ${rep.title}`);
                            }}
                            className="text-indigo-500 font-bold hover:underline"
                          >
                            Assistir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clips generated by fans */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Clipes em Destaque
                  </h4>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {creator.clips.map((clip) => (
                      <div key={clip.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs text-slate-800 dark:text-slate-200 font-bold block truncate max-w-[140px] leading-snug">{clip.title}</strong>
                          <span className="text-[9px] text-slate-400 font-mono">{clip.duration}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                          <span>Por {clip.creator} • {clip.views.toLocaleString()} views</span>
                          <button
                            onClick={() => {
                              playSound.jump();
                              triggerToast(`🎬 Exibindo clip rápido (30s): "${clip.title}"`);
                            }}
                            className="text-indigo-500 font-bold hover:underline"
                          >
                            Ver Clip
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Team & Moderators (Equipe e Moderadores) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 space-y-4">
              
              {/* Creator Team */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400">Equipe de Produção</h4>
                <div className="space-y-2">
                  {creator.team.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-base">
                        {t.avatar}
                      </div>
                      <div className="text-left">
                        <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">{t.name}</strong>
                        <span className="text-[9px] text-slate-400 font-mono">{t.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Channel Moderators */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400">Moderadores do Chat</h4>
                <div className="space-y-2">
                  {creator.moderators.map((mod, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${mod.badgeColor}`} />
                        <strong className="text-xs text-slate-700 dark:text-slate-200 font-bold font-mono">{mod.name}</strong>
                      </div>
                      <span className="text-[8px] font-mono text-slate-400">{mod.actionsCount} ações</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Fifth block: Active Events list (Eventos) */}
          <div className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-850 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight font-sans">Próximos Eventos do Canal</h3>
              <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                Inscreva-se antecipadamente para participar e competir nas transmissões ao vivo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creator.events.map((ev) => (
                <div key={ev.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <strong className="text-sm text-slate-800 dark:text-slate-200 font-bold block leading-snug">{ev.title}</strong>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">📅 {ev.date} às {ev.time}</span>
                    </div>
                    <span className="text-[10px] text-indigo-500 font-bold font-mono bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/20">EVENTO LIVE</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{ev.description}</p>
                  
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-950/80 border border-slate-150 dark:border-slate-850 rounded-xl text-[10px] font-mono text-slate-600 dark:text-slate-350 flex justify-between items-center">
                    <span>Prêmio do Evento:</span>
                    <strong className="text-amber-500 font-bold">{ev.prize}</strong>
                  </div>

                  <button
                    onClick={() => toggleRegisterEvent(ev.id)}
                    className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      ev.registered
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 shadow-sm'
                    }`}
                  >
                    {ev.registered ? '✓ Inscrição Confirmada' : 'Inscrever-se Grátis'}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MODE B: STUDIO BACK-OFFICE (CONTROLES DO CRIADOR)     */}
      {/* ======================================================== */}
      {activeMode === 'studio' && (
        <div className="bg-slate-100 dark:bg-slate-900/30 p-4 md:p-6 min-h-[500px] flex flex-col lg:flex-row gap-6">
          
          {/* Studio Left side-rail navigation */}
          <div className="w-full lg:w-60 shrink-0 flex flex-col gap-2">
            <div className="p-3 bg-slate-950/90 rounded-2xl border border-slate-800 text-left">
              <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-wider block font-black">Estúdio speedy_neon</span>
              <h4 className="text-sm font-black text-white mt-1">Creator Central Studio</h4>
              <p className="text-[10px] text-slate-400 leading-snug mt-1">Gerenciamento completo de lives, games, finanças e lojas sincronizadas.</p>
            </div>

            <button
              onClick={() => {
                setStudioTab('analytical');
                playSound.click();
              }}
              className={`w-full p-3.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 ${
                studioTab === 'analytical'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/10'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[8px] opacity-70 uppercase tracking-tight font-mono font-black">Métricas de Canal</span>
                <span className="block truncate font-bold">Painel Analítico</span>
              </div>
            </button>

            <button
              onClick={() => {
                setStudioTab('financial');
                playSound.click();
              }}
              className={`w-full p-3.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 ${
                studioTab === 'financial'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/10'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Wallet className="w-4 h-4 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[8px] opacity-70 uppercase tracking-tight font-mono font-black">Balanço &amp; Economia</span>
                <span className="block truncate font-bold">Painel Financeiro</span>
              </div>
            </button>

            <button
              onClick={() => {
                setStudioTab('content');
                playSound.click();
              }}
              className={`w-full p-3.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 ${
                studioTab === 'content'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/10'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[8px] opacity-70 uppercase tracking-tight font-mono font-black">Lives &amp; Minigames</span>
                <span className="block truncate font-bold">Painel de Conteúdo</span>
              </div>
            </button>

            <button
              onClick={() => {
                setStudioTab('monetization');
                playSound.click();
              }}
              className={`w-full p-3.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 ${
                studioTab === 'monetization'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/10'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <DollarSign className="w-4 h-4 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[8px] opacity-70 uppercase tracking-tight font-mono font-black">Produtos &amp; Subs</span>
                <span className="block truncate font-bold">Painel de Monetização</span>
              </div>
            </button>
          </div>

          {/* Studio Content Viewport */}
          <div className="flex-1 bg-white dark:bg-slate-950/80 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-850">
            
            {/* ======================================================== */}
            {/* SUBTAB 1: PAINEL ANALÍTICO (CHARTS & REACH)             */}
            {/* ======================================================== */}
            {studioTab === 'analytical' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight font-sans">Painel de Métricas &amp; Crescimento</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Analise o desempenho histórico de audiência e receitas acumuladas de Speedy Neon.</p>
                </div>

                {/* KPI Metrics row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Cliques Totais</span>
                    <strong className="text-base font-mono text-slate-800 dark:text-white block font-black">45,200</strong>
                    <span className="text-[8px] text-emerald-500 font-bold block">+14.2% este mês</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Subscribers Ativos</span>
                    <strong className="text-base font-mono text-slate-800 dark:text-white block font-black">842</strong>
                    <span className="text-[8px] text-emerald-500 font-bold block">+3.8% este mês</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Retenção de Live</span>
                    <strong className="text-base font-mono text-slate-800 dark:text-white block font-black">84.5%</strong>
                    <span className="text-[8px] text-indigo-400 font-bold block">Excelente engajamento</span>
                  </div>
                </div>

                {/* Graph selectors */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-mono font-bold text-slate-400">Curva de Performance Semestral</span>
                    
                    <div className="flex gap-1">
                      {['views', 'subscribers', 'revenue'].map((metric) => (
                        <button
                          key={metric}
                          onClick={() => {
                            setChartMetric(metric as any);
                            playSound.click();
                          }}
                          className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg cursor-pointer ${
                            chartMetric === metric
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {metric.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SVG Chart Visualization */}
                  <div className="relative h-48 w-full bg-slate-900 rounded-xl p-4 flex items-end justify-between overflow-hidden">
                    <div className="absolute inset-x-0 top-1/4 border-b border-slate-800/40" />
                    <div className="absolute inset-x-0 top-2/4 border-b border-slate-800/40" />
                    <div className="absolute inset-x-0 top-3/4 border-b border-slate-800/40" />

                    {/* Polyline rendering for metrics */}
                    <svg className="absolute inset-0 w-full h-full p-4 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Calculate SVG dynamic path based on chosen metric */}
                      {(() => {
                        const values = analyticsHistory.map(h => h[chartMetric]);
                        const max = Math.max(...values);
                        const min = Math.min(...values);
                        const range = max - min || 1;
                        
                        // Map coordinates
                        const points = values.map((val, idx) => {
                          const x = (idx / (values.length - 1)) * 90 + 5;
                          const y = 90 - ((val - min) / range) * 70;
                          return `${x},${y}`;
                        }).join(' ');

                        return (
                          <>
                            <polyline
                              fill="none"
                              stroke="#6366f1"
                              strokeWidth="3.5"
                              points={points}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            {/* Area */}
                            <path
                              d={`M 5,90 L ${points} L 95,90 Z`}
                              fill="url(#chartGrad)"
                            />
                          </>
                        );
                      })()}
                    </svg>

                    {/* Month labels */}
                    {analyticsHistory.map((h, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full relative z-10">
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-10 bg-slate-950 border border-slate-800 p-1.5 rounded text-[8px] font-mono text-white opacity-0 hover:opacity-100 transition-opacity z-25">
                          {chartMetric === 'revenue' ? `R$ ${h.revenue}` : h[chartMetric]}
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 mt-2">{h.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SUBTAB 2: PAINEL FINANCEIRO (RECEITA & INTEGRATION)     */}
            {/* ======================================================== */}
            {studioTab === 'financial' && (
              <div className="space-y-6 text-slate-800 dark:text-white text-left">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight font-sans">Conselho Fiscal, Monetização &amp; Payout</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Painel central de rendimentos, extratos detalhados e patrocínios da sua marca.</p>
                </div>

                {/* Balances layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Saldo Disponível para Saque</span>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                      R$ {revenue.withdrawable.toFixed(2)}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Valor líquido calculado considerando a taxa de 15% do gateway GameHub.
                    </p>

                    <button
                      onClick={handleCreatorWithdraw}
                      disabled={revenue.withdrawable <= 0}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/10"
                    >
                      <Download className="w-4 h-4" />
                      <span>Resgatar para Saldo Principal (Virtual Economy)</span>
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Demonstrativo de Receitas</span>
                    <div className="text-xs font-mono space-y-1.5 text-slate-600 dark:text-slate-350">
                      <div className="flex justify-between">
                        <span>Total Líquido Gerado:</span>
                        <strong className="text-slate-800 dark:text-white">R$ {revenue.totalEarned.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Receita de Assinaturas:</span>
                        <strong className="text-indigo-400">R$ {revenue.subscriptionsShare.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Doações (Bits/Coins/Gifts):</span>
                        <strong className="text-pink-400">R$ {revenue.donationsShare.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Vendas de E-commerce:</span>
                        <strong className="text-cyan-400">R$ {revenue.marketplaceSales.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Rendimento Publicitário (Ads):</span>
                        <strong className="text-amber-500">R$ {revenue.advertisingShare.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Patrocínios de Marcas:</span>
                        <strong className="text-emerald-400">R$ {revenue.sponsorshipsShare.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-850">
                        <span>Taxa de Repasse:</span>
                        <strong className="text-amber-500 font-bold">{revenue.splitRate}% Creator Net</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Co-Producers split (Comissões e Receita Compartilhada) */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-mono uppercase font-black text-indigo-400">Comissões &amp; Coprodutores</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Defina a distribuição automática de splits em seus saques de estúdio.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">Split Automático:</span>
                      <button
                        onClick={() => {
                          setAutoDistributeTeam(!autoDistributeTeam);
                          playSound.click();
                          triggerToast(autoDistributeTeam ? 'Split automático desativado.' : 'Split automático ativado para a equipe!');
                        }}
                        className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${autoDistributeTeam ? 'bg-indigo-600' : 'bg-slate-350 dark:bg-slate-700'}`}
                      >
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${autoDistributeTeam ? 'translate-x-4' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {teamCuts.map((member, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between">
                        <div className="text-left">
                          <strong className="text-xs font-bold block">{member.name}</strong>
                          <span className="text-[9px] text-slate-400 font-mono">{member.role}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-indigo-500">{member.cut}%</span>
                          <span className="text-[9px] text-slate-400 font-mono">cut</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                    ℹ️ Com o split ativo, {teamCuts.reduce((acc, m) => acc + m.cut, 0)}% de cada saque de estúdio será repassado para as contas dos coprodutores.
                  </div>
                </div>

                {/* Ads and Sponsorships section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Advertising Revenue & Formats */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-4">
                    <div>
                      <h4 className="text-xs font-mono uppercase font-black text-indigo-400">Campanhas Publicitárias (Ads)</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Configure e rentabilize sua live com anúncios automáticos.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl text-left">
                        <span className="text-[9px] font-mono text-slate-400 block font-bold">Impressões</span>
                        <strong className="text-sm font-mono block mt-1">{adSettings.impressionsThisMonth.toLocaleString()}</strong>
                        <span className="text-[8px] text-slate-400 block font-mono">CPM: R$ {adSettings.cpmRate.toFixed(2)}</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-left">
                        <span className="text-[9px] font-mono text-slate-400 block font-bold">Ganhos Ad</span>
                        <strong className="text-sm font-mono text-indigo-400 block mt-1">R$ {adSettings.revenueGenerated.toFixed(2)}</strong>
                        <span className="text-[8px] text-emerald-500 block font-bold">85% Split líquido</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium">Anúncios Automáticos na Live:</span>
                        <button
                          onClick={() => {
                            setAdSettings(prev => ({ ...prev, autoAdsEnabled: !prev.autoAdsEnabled }));
                            playSound.click();
                            triggerToast(adSettings.autoAdsEnabled ? 'Anúncios automáticos suspensos.' : 'Anúncios automáticos ativados.');
                          }}
                          className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${adSettings.autoAdsEnabled ? 'bg-indigo-600' : 'bg-slate-350 dark:bg-slate-700'}`}
                        >
                          <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${adSettings.autoAdsEnabled ? 'translate-x-4' : ''}`} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Formato de Anúncio Ativo</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'overlay', label: 'Overlay' },
                            { id: 'midroll', label: 'Mid-Roll' },
                            { id: 'banner', label: 'Banner GZ' }
                          ].map((fmt) => (
                            <button
                              key={fmt.id}
                              onClick={() => {
                                setAdSettings(prev => ({ ...prev, activeFormat: fmt.id }));
                                playSound.click();
                                triggerToast(`Formato de anúncio alterado para: ${fmt.label}`);
                              }}
                              className={`p-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                adSettings.activeFormat === fmt.id
                                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-900/60'
                              }`}
                            >
                              {fmt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sponsorship Contracts */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-4">
                    <div>
                      <h4 className="text-xs font-mono uppercase font-black text-indigo-400">Patrocínios de Marcas (Sponsorships)</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Vincule campanhas ao vivo para receber pagamentos de patrocinadores.</p>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {sponsorships.map((sp) => (
                        <div key={sp.id} className="p-3 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl space-y-2 text-left">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{sp.logo}</span>
                              <strong className="text-xs font-bold">{sp.brand}</strong>
                            </div>
                            <span className="text-[10px] font-mono font-black text-emerald-500">R$ {sp.reward.toFixed(2)}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug">{sp.desc}</p>
                          
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-900">
                            <span className="text-[9px] font-mono text-slate-400">Requisito: {sp.requirement} seguidores</span>
                            {sp.status === 'active' ? (
                              <button
                                onClick={() => {
                                  playSound.victory();
                                  // Credit reward to available withdrawal balance
                                  setRevenue(prev => ({
                                    ...prev,
                                    totalEarned: prev.totalEarned + sp.reward,
                                    withdrawable: prev.withdrawable + sp.reward,
                                    sponsorshipsShare: prev.sponsorshipsShare + sp.reward
                                  }));
                                  // Log transaction
                                  const txId = `TX-${Math.floor(Math.random() * 9000) + 1000}`;
                                  setTransactionLogs(prev => [
                                    {
                                      id: txId,
                                      date: new Date().toLocaleString('pt-BR'),
                                      type: 'sponsorship',
                                      desc: `Rendimento de Patrocínio: ${sp.brand}`,
                                      gross: sp.reward,
                                      fee: sp.reward * 0.15,
                                      net: sp.reward * 0.85,
                                      currency: 'BRL',
                                      status: 'completed'
                                    },
                                    ...prev
                                  ]);
                                  triggerToast(`🎉 Patrocínio de ${sp.brand} coletado! R$ ${sp.reward.toFixed(2)} adicionados aos seus ganhos.`);
                                }}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-bold cursor-pointer transition-all"
                              >
                                Coletar Rendimento
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (creator.followersCount < sp.requirement) {
                                    triggerToast(`❌ Você precisa de pelo menos ${sp.requirement} seguidores para assinar este patrocínio.`, false);
                                    return;
                                  }
                                  playSound.victory();
                                  setSponsorships(prev => prev.map(item => item.id === sp.id ? { ...item, status: 'active' } : item));
                                  triggerToast(`🤝 Contrato de patrocínio com ${sp.brand} assinado com sucesso!`);
                                }}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[9px] font-bold cursor-pointer transition-all"
                              >
                                {creator.followersCount >= sp.requirement ? 'Ativar Contrato' : 'Bloqueado'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Partner Program Tiers progress */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-mono uppercase font-black text-indigo-400">Programa de Parceiros GameZon</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Sua classificação atual e vantagens exclusivas de comissão na plataforma.</p>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider">
                      ★ {partnerTier.level}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Follower threshold */}
                    <div className="p-3 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium">Seguidores para {partnerTier.nextLevel}:</span>
                        <strong className="font-mono text-indigo-500">{creator.followersCount} / {partnerTier.nextFollowers}</strong>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (creator.followersCount / partnerTier.nextFollowers) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Subscriber threshold */}
                    <div className="p-3 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium">Assinantes para {partnerTier.nextLevel}:</span>
                        <strong className="font-mono text-indigo-500">{creator.subscribersCount} / {partnerTier.nextSubscribers}</strong>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (creator.subscribersCount / partnerTier.nextSubscribers) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-[10px] font-mono text-amber-600 dark:text-amber-400 flex items-center justify-between">
                    <span>Vantagem ativa: <strong>+{partnerTier.bonusRate}% de bônus de split</strong> (Comissão reduzida de 20% para 15% na plataforma!)</span>
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  </div>
                </div>

                {/* Transaction Statement / Relatórios, Extratos e Histórico */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-mono uppercase font-black text-indigo-400">Relatório &amp; Extrato Financeiro de Estúdio</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Histórico completo de transações, vendas, repasses e doações consolidadas.</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {/* Search box */}
                      <input
                        type="text"
                        placeholder="Buscar transação..."
                        value={financialSearch}
                        onChange={(e) => setFinancialSearch(e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans max-w-[150px] dark:text-white"
                      />
                      <button
                        onClick={() => {
                          // Download mock spreadsheet report CSV
                          playSound.victory();
                          const headers = 'ID,Data,Tipo,Descricao,Valor Bruto,Taxa,Valor Liquido,Moeda,Status\n';
                          const rows = transactionLogs.map(l => `${l.id},"${l.date}",${l.type},"${l.desc}",${l.gross},${l.fee},${l.net},${l.currency},${l.status}`).join('\n');
                          const blob = new Blob([headers + rows], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.setAttribute('href', url);
                          a.setAttribute('download', `Extrato_Estudio_${creator.name.replace(/\s+/g, '_')}_2026.csv`);
                          a.click();
                          triggerToast('📊 Relatório completo em planilha (CSV) exportado com sucesso!');
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Baixar Relatório CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Exportar CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Categories Row */}
                  <div className="flex flex-wrap gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'subscription', label: 'Subs' },
                      { id: 'donation', label: 'Doações' },
                      { id: 'product', label: 'Vendas' },
                      { id: 'ad_payout', label: 'Publicidade' },
                      { id: 'sponsorship', label: 'Patrocínios' },
                      { id: 'commission', label: 'Comissões' },
                      { id: 'withdrawal', label: 'Saques' }
                    ].map((flt) => (
                      <button
                        key={flt.id}
                        onClick={() => {
                          setActiveLogFilter(flt.id);
                          playSound.click();
                        }}
                        className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-lg cursor-pointer transition-all ${
                          activeLogFilter === flt.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-950 text-slate-400 border border-slate-150 dark:border-slate-850 hover:bg-slate-900/60'
                        }`}
                      >
                        {flt.label.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {/* Transaction history list */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(() => {
                      const filtered = transactionLogs.filter(log => {
                        const matchesType = activeLogFilter === 'all' || log.type === activeLogFilter;
                        const matchesSearch = log.desc.toLowerCase().includes(financialSearch.toLowerCase()) || 
                                              log.id.toLowerCase().includes(financialSearch.toLowerCase());
                        return matchesType && matchesSearch;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="p-6 text-center text-[11px] text-slate-400 font-mono">
                            Nenhuma transação encontrada para os filtros selecionados.
                          </div>
                        );
                      }

                      return filtered.map((log) => {
                        const isPositive = log.gross > 0;
                        return (
                          <div key={log.id} className="p-3 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between transition-all hover:scale-[1.005]">
                            <div className="text-left space-y-1 min-w-0 flex-1 pr-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                  log.type === 'subscription' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                                  log.type === 'donation' ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' :
                                  log.type === 'gift' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                                  log.type === 'product' ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' :
                                  log.type === 'ad_payout' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                  log.type === 'sponsorship' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                  log.type === 'commission' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                  'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                }`}>
                                  {log.type}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">{log.date}</span>
                                <span className="text-[9px] font-mono font-bold text-slate-500">ID: {log.id}</span>
                              </div>
                              <strong className="text-xs text-slate-700 dark:text-slate-200 block truncate font-medium">{log.desc}</strong>
                            </div>

                            <div className="text-right shrink-0">
                              <span className={`text-xs font-mono font-black ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isPositive ? '+' : ''} R$ {log.net.toFixed(2)}
                              </span>
                              <div className="text-[8px] font-mono text-slate-400">
                                Bruto: R$ {log.gross.toFixed(2)} | Fee: R$ {log.fee.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Audit Security block */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-400 uppercase font-bold">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Auditoria de Transações Criptográficas</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Todos os ganhos do estúdio são assinados em tempo real e consolidados em bancos resilientes a fraudes de balanço.
                  </p>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SUBTAB 3: PAINEL DE CONTEÚDO (LIVES & MINIGAMES SETUP)   */}
            {/* ======================================================== */}
            {studioTab === 'content' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight font-sans">Administração de Mídia &amp; Gameplay</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Publique novos minigames para a Arena ou configure transmissões em tempo real.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Create Live Streams controller */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-4">
                    <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Tv className="w-4 h-4 text-rose-500" />
                      Painel de Controle de Transmissão
                    </h4>

                    {creator.lives.some(l => l.status === 'online') ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 text-xs font-mono">
                          🟢 LIVE ATIVA: "{creator.lives.find(l => l.status === 'online')?.title}"
                        </div>
                        <button
                          onClick={handleStopLive}
                          className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Encerrar Live (Salvar Replay no Banco)
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Título da Transmissão</label>
                          <input
                            type="text"
                            placeholder="Ex: Desafio de Speedrun da Madrugada"
                            value={newLiveTitle}
                            onChange={(e) => setNewLiveTitle(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
                          />
                        </div>

                        <button
                          onClick={handleCreateLive}
                          className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Iniciar Transmissão RTMP
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Publish custom Minigames (Jogos publicados builder) */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-3">
                    <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Gamepad2 className="w-4 h-4 text-cyan-400" />
                      Publicar Minigame na Arena API
                    </h4>

                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Nome do Jogo</label>
                        <input
                          type="text"
                          placeholder="Ex: Neon Tetris Extreme"
                          value={newGameName}
                          onChange={(e) => setNewGameName(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Preço em Moedas Arena</label>
                        <input
                          type="number"
                          placeholder="Ex: 150 (0 para Gratuito)"
                          value={newGamePrice}
                          onChange={(e) => setNewGamePrice(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handlePublishGame}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer mt-2"
                    >
                      Compilar e Publicar Minigame
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SUBTAB 4: PAINEL DE MONETIZAÇÃO (PRODUCTS & EVENTS)      */}
            {/* ======================================================== */}
            {studioTab === 'monetization' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight font-sans">Sistemas de Monetização &amp; Loja</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Cadastre itens digitais ou agende eventos integrados ao Marketplace.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Add Product builder (Marketplace item) */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-3">
                    <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-purple-400" />
                      Cadastrar Item no E-commerce
                    </h4>

                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Nome do Produto</label>
                        <input
                          type="text"
                          placeholder="Ex: Skin Speedy Hologram"
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Preço</label>
                          <input
                            type="number"
                            placeholder="Preço"
                            value={newProductPrice}
                            onChange={(e) => setNewProductPrice(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Moeda</label>
                          <select
                            value={newProductCurrency}
                            onChange={(e) => setNewProductCurrency(e.target.value as any)}
                            className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-1.5 text-xs outline-none"
                          >
                            <option value="coins">Moedas Arena</option>
                            <option value="real">Saldo Real (BRL)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Categoria</label>
                        <select
                          value={newProductCategory}
                          onChange={(e) => setNewProductCategory(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-1.5 text-xs outline-none"
                        >
                          <option value="avatar">Cosmético de Avatar</option>
                          <option value="booster">Booster / Multiplicador</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleAddProduct}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer mt-2"
                    >
                      Adicionar e Sincronizar Produto
                    </button>
                  </div>

                  {/* Add Event agenda constructor */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-3">
                    <h4 className="text-xs font-mono uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      Agendar Competição / Evento
                    </h4>

                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Título do Evento</label>
                        <input
                          type="text"
                          placeholder="Ex: Torneio Estrelas do Drift"
                          value={newEventTitle}
                          onChange={(e) => setNewEventTitle(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Prêmio Anunciado</label>
                        <input
                          type="text"
                          placeholder="Ex: 🪙 5,000 Moedas"
                          value={newEventPrize}
                          onChange={(e) => setNewEventPrize(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Data do Evento</label>
                        <input
                          type="date"
                          value={newEventDate}
                          onChange={(e) => setNewEventDate(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleCreateEvent}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer mt-2"
                    >
                      Anunciar e Registrar na Agenda
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL DETALHADO DE DOAÇÃO (DONATIONS & GIFTS)         */}
      {/* ======================================================== */}
      {showDonateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-left">
            <button
              onClick={() => {
                playSound.click();
                setShowDonateModal(false);
                setSelectedGift(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase font-black text-indigo-500 tracking-wider">Apoio Direto ao Criador</span>
              <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight">Enviar Bits, Presentes &amp; Doações</h3>
              <p className="text-xs text-slate-400">Escolha um presente temático ou defina um valor customizado em moedas ou saldo real.</p>
            </div>

            {/* Interactive Gifts Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-indigo-500 dark:text-indigo-400 font-bold block">Selecione um Presente Especial (Gifts 🎁)</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Energético Nitro', price: 50, icon: '🔋' },
                  { name: 'Skin Lendária', price: 150, icon: '🥋' },
                  { name: 'Emote Animado', price: 200, icon: '🎭' },
                  { name: 'Troféu Speedy', price: 500, icon: '🏆' }
                ].map((gift) => (
                  <button
                    key={gift.name}
                    onClick={() => {
                      setSelectedGift(selectedGift?.name === gift.name ? null : gift);
                      playSound.click();
                    }}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      selectedGift?.name === gift.name
                        ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xl shrink-0">{gift.icon}</span>
                    <div className="min-w-0">
                      <strong className="text-[10px] block font-bold truncate leading-tight">{gift.name}</strong>
                      <span className="text-[9px] text-amber-500 font-mono font-bold mt-0.5 block">🪙 {gift.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {!selectedGift ? (
              <>
                {/* Currency switcher */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                  <button
                    onClick={() => {
                      setDonateCurrency('coins');
                      playSound.click();
                    }}
                    className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      donateCurrency === 'coins'
                        ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-white shadow-xs'
                        : 'text-slate-400'
                    }`}
                  >
                    🪙 Moedas Arena
                  </button>
                  <button
                    onClick={() => {
                      setDonateCurrency('real');
                      playSound.click();
                    }}
                    className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      donateCurrency === 'real'
                        ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-white shadow-xs'
                        : 'text-slate-400'
                    }`}
                  >
                    R$ Saldo Real
                  </button>
                </div>

                {/* Pre-sets */}
                <div className="grid grid-cols-4 gap-2">
                  {['10', '50', '200', '500'].map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        setDonateAmount(val);
                        playSound.click();
                      }}
                      className={`py-1.5 text-xs font-mono rounded-lg border cursor-pointer transition-all ${
                        donateAmount === val
                          ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      {donateCurrency === 'coins' ? `🪙 ${val}` : `R$ ${val}`}
                    </button>
                  ))}
                </div>

                {/* Custom inputs */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-bold">Valor Customizado</label>
                  <input
                    type="number"
                    value={donateAmount}
                    onChange={(e) => setDonateAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    placeholder="Insira a quantidade"
                  />
                </div>
              </>
            ) : (
              <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                🎁 Presente ativo: <strong>{selectedGift.icon} {selectedGift.name}</strong> por <strong>🪙 {selectedGift.price} Moedas Arena</strong>.
              </div>
            )}

            {/* Wallet summary */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl text-[10px] font-mono text-slate-500 flex justify-between">
              <span>Seu Saldo Atual:</span>
              <strong className={selectedGift || donateCurrency === 'coins' ? 'text-amber-500' : 'text-emerald-500'}>
                {selectedGift || donateCurrency === 'coins' ? `🪙 ${stats.coins} Moedas` : `R$ ${realBalance.toFixed(2)}`}
              </strong>
            </div>

            <button
              onClick={executeDonation}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              Confirmar Transação Segura
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
