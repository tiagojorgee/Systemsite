import { useState, useEffect, lazy, Suspense } from 'react';
import { PlayerStats, TransactionLog, ShopItem } from './types';
import { Header } from './components/Header';
import { CheckoutModal } from './components/CheckoutModal';
import { SHOP_ITEMS, SKINS, ACCESSORIES, AURAS } from './data/shopItems';
import { ShieldCheck, Sparkles, X, Heart, Coins, Bell, UserPlus, Megaphone, MessageSquare } from 'lucide-react';
import { playSound } from './utils/audio';
import { getLevelForPoints, SKIN_LEVELS, ACCESSORY_LEVELS, AURA_LEVELS } from './utils/levelManager';
import { AuthModal, AppUser } from './components/AuthModal';
import { googleSignOut } from './utils/googleDriveDb';
import { getCleanUserId, getUserProfile, saveUserProfile, getUserLogs, addUserLog } from './utils/firebaseDb';
import { secureStorage } from './utils/security';
import { AdminPortal } from './components/AdminPortal';
import { NotificationCenter } from './components/NotificationCenter';

// Dynamic Lazy Loaded Sub-Views for optimal on-demand rendering
const GamePortal = lazy(() => import('./components/GamePortal').then(m => ({ default: m.GamePortal })));
const AvatarCustomizer = lazy(() => import('./components/AvatarCustomizer').then(m => ({ default: m.AvatarCustomizer })));
const Shop = lazy(() => import('./components/Shop').then(m => ({ default: m.Shop })));
const TransactionLogs = lazy(() => import('./components/TransactionLogs').then(m => ({ default: m.TransactionLogs })));
const FootballBets = lazy(() => import('./components/FootballBets').then(m => ({ default: m.FootballBets })));
const Cinema = lazy(() => import('./components/Cinema').then(m => ({ default: m.Cinema })));
const GamezoneShop = lazy(() => import('./components/GamezoneShop').then(m => ({ default: m.GamezoneShop })));
const Feed = lazy(() => import('./components/Feed').then(m => ({ default: m.Feed })));
const ChatPortal = lazy(() => import('./components/ChatPortal').then(m => ({ default: m.ChatPortal })));
const ProfilePortal = lazy(() => import('./components/ProfilePortal').then(m => ({ default: m.ProfilePortal })));
const EcosystemDashboard = lazy(() => import('./components/EcosystemDashboard').then(m => ({ default: m.EcosystemDashboard })));
const SecurityCenter = lazy(() => import('./components/SecurityCenter').then(m => ({ default: m.SecurityCenter })));
const FinancePortal = lazy(() => import('./components/FinancePortal').then(m => ({ default: m.FinancePortal })));

interface TabLoaderProps {
  tabName: string;
}

const TabLoader = ({ tabName }: TabLoaderProps) => {
  const labelMap: Record<string, string> = {
    games: 'Arena de Jogos',
    avatar: 'Customizador de Piloto',
    shop: 'Loja VIP & Pacotes',
    logs: 'Histórico de Transações',
    football: 'Portal de Palpites Futebol',
    cinema: 'Cine Lounge & Vídeos',
    gamezoneshop: 'GamezoneShop E-commerce',
    feed: 'Feed da Arena de Jogadores',
    security: 'Central de Segurança e Conformidade',
    finance: 'Painel Financeiro & Auditoria Criptográfica'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-fadeIn">
      <div className="relative w-20 h-20 mb-6">
        {/* Pulsing neon rings */}
        <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500/20 animate-ping duration-[2s]" />
        <div className="absolute -inset-2 rounded-2xl border border-purple-500/10 animate-pulse" />
        <div className="absolute inset-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl shadow-lg flex items-center justify-center text-white">
          <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
      </div>
      <h3 className="text-lg font-extrabold text-slate-800 tracking-tight font-sans">
        Carregando {labelMap[tabName] || tabName}...
      </h3>
      <p className="text-slate-400 text-xs font-mono mt-1.5 max-w-sm">
        Otimizando recursos em tempo real para navegação instantânea.
      </p>
      
      {/* Wave progress animation */}
      <div className="w-48 h-1 bg-slate-200 rounded-full mt-4 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 w-2/3 rounded-full animate-pulse" style={{ animationDuration: '1.5s' }} />
      </div>
    </div>
  );
};

export default function App() {
  // Tabs: 'games' | 'avatar' | 'shop' | 'logs' | 'football' | 'cinema' | 'gamezoneshop' | 'feed' | 'profile' | 'chat' | 'modules' | 'security' | 'finance' | 'admin'
  const [activeTab, setActiveTab] = useState<'games' | 'avatar' | 'shop' | 'logs' | 'football' | 'cinema' | 'gamezoneshop' | 'feed' | 'profile' | 'chat' | 'modules' | 'security' | 'finance' | 'admin'>('modules');

  // Theme support
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const cachedTheme = localStorage.getItem('gamezone_theme') as 'light' | 'dark';
    if (cachedTheme === 'light' || cachedTheme === 'dark') {
      return cachedTheme;
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('gamezone_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // User Authentication States
  const [loggedInUser, setLoggedInUser] = useState<AppUser | null>(() => {
    const cached = localStorage.getItem('gamezone_logged_in_user');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Error parsing cached user:', e);
      }
    }
    return null;
  });

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Browser & App Push Notification States
  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotificationCenter, setShowNotificationCenter] = useState<boolean>(false);
  const [lastNotification, setLastNotification] = useState<{ title: string; body: string; type: string } | null>(null);

  useEffect(() => {
    if (loggedInUser) {
      localStorage.setItem('gamezone_logged_in_user', JSON.stringify(loggedInUser));
    } else {
      localStorage.removeItem('gamezone_logged_in_user');
    }
  }, [loggedInUser]);

  useEffect(() => {
    const token = localStorage.getItem('gamezone_jwt_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error('Sessão expirada');
        return res.json();
      })
      .then(data => {
        if (data && data.user) {
          setLoggedInUser(data.user);
        }
      })
      .catch(err => {
        console.warn('[JWT Check]', err.message);
        localStorage.removeItem('gamezone_jwt_token');
        setLoggedInUser(null);
      });
    }
  }, []);

  const handleLogout = async () => {
    playSound.click();
    if (loggedInUser?.provider === 'google') {
      try {
        await googleSignOut();
      } catch (e) {
        console.error('Error signing out Google:', e);
      }
    }
    localStorage.removeItem('gamezone_jwt_token');
    setLoggedInUser(null);
    triggerToast('ℹ️ Sessão finalizada com sucesso.');
  };
  
  // Checkout triggers
  const [checkoutItem, setCheckoutItem] = useState<ShopItem | null>(null);
  
  // App-level Toast notifications
  const [appToast, setAppToast] = useState<string | null>(null);

  // Initialize state with default values or localStorage securely with integrity checks
  const [stats, setStats] = useState<PlayerStats>(() => {
    const defaultStats = {
      coins: 150, // Starts with a small bonus of 150 coins to test the customizer immediately!
      lives: 3,
      currentStage: 1,
      highScore: 0,
      unlockedSkins: ['classic'],
      unlockedAccessories: ['none'],
      unlockedAuras: ['none'],
      avatar: {
        skin: 'classic',
        accessory: 'none',
        aura: 'none'
      },
      points: 0,
      level: 1
    };
    
    // Get logged-in user id or guest
    let userId = 'guest';
    const cachedUser = localStorage.getItem('gamezone_logged_in_user');
    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        userId = u.uid || u.email || 'guest';
      } catch (e) {}
    }

    return secureStorage.getItem('gamezone_player_stats', defaultStats, userId);
  });

  // Intercept stats updates to handle point awards and level-up events
  const updateStats = (updater: (prev: PlayerStats) => PlayerStats) => {
    setStats((prev) => {
      const updated = updater(prev);
      const prevPoints = prev.points ?? 0;
      const updatedPoints = updated.points ?? prevPoints;
      
      const { level: newLevel } = getLevelForPoints(updatedPoints);
      const prevLevel = prev.level ?? 1;

      // Handle unlocking of rewards automatically!
      let unlockedSkins = [...(updated.unlockedSkins ?? prev.unlockedSkins ?? ['classic'])];
      let unlockedAccessories = [...(updated.unlockedAccessories ?? prev.unlockedAccessories ?? ['none'])];
      let unlockedAuras = [...(updated.unlockedAuras ?? prev.unlockedAuras ?? ['none'])];

      // Check for rewards that get unlocked at specific levels
      if (newLevel > prevLevel) {
        // Find which items should unlock up to this level
        const newlyUnlocked: string[] = [];

        // Check skins
        Object.entries(SKIN_LEVELS).forEach(([id, reqLevel]) => {
          if (reqLevel <= newLevel && !unlockedSkins.includes(id)) {
            unlockedSkins.push(id);
            const skinName = SKINS.find(s => s.id === id)?.name || id;
            newlyUnlocked.push(`Pele ${skinName}`);
          }
        });

        // Check accessories
        Object.entries(ACCESSORY_LEVELS).forEach(([id, reqLevel]) => {
          if (reqLevel <= newLevel && !unlockedAccessories.includes(id)) {
            unlockedAccessories.push(id);
            const accName = ACCESSORIES.find(a => a.id === id)?.name || id;
            newlyUnlocked.push(`Acessório ${accName}`);
          }
        });

        // Check auras
        Object.entries(AURA_LEVELS).forEach(([id, reqLevel]) => {
          if (reqLevel <= newLevel && !unlockedAuras.includes(id)) {
            unlockedAuras.push(id);
            const auraName = AURAS.find(a => a.id === id)?.name || id;
            newlyUnlocked.push(`Aura ${auraName}`);
          }
        });

        setTimeout(() => {
          try {
            playSound.jackpot();
          } catch (err) {}
          let unlockMsg = `🎉 PARABÉNS! Você alcançou o Nível ${newLevel}! 👑`;
          if (newlyUnlocked.length > 0) {
            unlockMsg += ` Desbloqueado gratuitamente: ${newlyUnlocked.join(', ')}!`;
          }
          setAppToast(unlockMsg);
        }, 150);
      }

      return {
        ...updated,
        unlockedSkins,
        unlockedAccessories,
        unlockedAuras,
        points: updatedPoints,
        level: newLevel
      };
    });
  };

  // Lifted financial states securely loaded with signature validation
  const [realBalance, setRealBalance] = useState<number>(() => {
    let userId = 'guest';
    const cachedUser = localStorage.getItem('gamezone_logged_in_user');
    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        userId = u.uid || u.email || 'guest';
      } catch (e) {}
    }
    return secureStorage.getItem('gamezone_real_balance', 120.00, userId);
  });

  const [withdrawLimit, setWithdrawLimit] = useState<number>(() => {
    let userId = 'guest';
    const cachedUser = localStorage.getItem('gamezone_logged_in_user');
    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        userId = u.uid || u.email || 'guest';
      } catch (e) {}
    }
    return secureStorage.getItem('gamezone_withdraw_limit', 100.00, userId);
  });

  const [logs, setLogs] = useState<TransactionLog[]>(() => {
    let userId = 'guest';
    const cachedUser = localStorage.getItem('gamezone_logged_in_user');
    if (cachedUser) {
      try {
        const u = JSON.parse(cachedUser);
        userId = u.uid || u.email || 'guest';
      } catch (e) {}
    }

    const initialHash = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const defaultLogs: TransactionLog[] = [
      {
        id: 'TXN-INITIAL-001',
        timestamp: new Date().toLocaleString('pt-BR'),
        type: 'earn',
        description: 'Bônus de Boas-vindas creditado na criação da conta',
        amount: 150,
        currency: 'coins',
        status: 'success',
        securityHash: `0x${initialHash}`
      }
    ];

    return secureStorage.getItem('gamezone_transaction_logs', defaultLogs, userId);
  });

  const [isDbLoading, setIsDbLoading] = useState<boolean>(false);

  // Securely save changes whenever stats, realBalance, withdrawLimit, or logs update
  useEffect(() => {
    let userId = 'guest';
    if (loggedInUser) {
      userId = loggedInUser.uid || loggedInUser.email || 'guest';
    }
    secureStorage.setItem('gamezone_player_stats', stats, userId);
  }, [stats, loggedInUser]);

  useEffect(() => {
    let userId = 'guest';
    if (loggedInUser) {
      userId = loggedInUser.uid || loggedInUser.email || 'guest';
    }
    secureStorage.setItem('gamezone_real_balance', realBalance, userId);
  }, [realBalance, loggedInUser]);

  useEffect(() => {
    let userId = 'guest';
    if (loggedInUser) {
      userId = loggedInUser.uid || loggedInUser.email || 'guest';
    }
    secureStorage.setItem('gamezone_withdraw_limit', withdrawLimit, userId);
  }, [withdrawLimit, loggedInUser]);

  useEffect(() => {
    let userId = 'guest';
    if (loggedInUser) {
      userId = loggedInUser.uid || loggedInUser.email || 'guest';
    }
    secureStorage.setItem('gamezone_transaction_logs', logs, userId);
  }, [logs, loggedInUser]);

  // Run initial state integrity audit upon app start
  useEffect(() => {
    let userId = 'guest';
    if (loggedInUser) {
      userId = loggedInUser.uid || loggedInUser.email || 'guest';
    }
    
    // Check for tempering and self-heal automatically
    const corrected = secureStorage.auditStateIntegrity(userId, (warningMsg) => {
      triggerToast(warningMsg);
    });

    if (corrected) {
      // Reload stats and balance if repaired
      const repairedStats = secureStorage.getItem('gamezone_player_stats', null, userId);
      if (repairedStats) setStats(repairedStats);
      setRealBalance(secureStorage.getItem('gamezone_real_balance', 120.00, userId));
      setWithdrawLimit(secureStorage.getItem('gamezone_withdraw_limit', 100.00, userId));
      setLogs(secureStorage.getItem('gamezone_transaction_logs', [], userId));
    }
  }, [loggedInUser]);

  // Load stats and logs from Firestore upon successful login
  useEffect(() => {
    if (loggedInUser) {
      const userId = getCleanUserId(loggedInUser);
      if (userId) {
        setIsDbLoading(true);
        getUserProfile(userId).then((profile) => {
          if (profile) {
            setStats(profile.stats);
            setRealBalance(profile.realBalance);
            setWithdrawLimit(profile.withdrawLimit);
            triggerToast('📂 Perfil e estatísticas carregados do Firestore com sucesso!');
          } else {
            // Document does not exist in Firestore yet; create it!
            saveUserProfile(userId, stats, realBalance, withdrawLimit)
              .catch(err => console.error('Error writing initial profile to Firestore:', err));
          }
        }).catch(err => {
          console.error('Error fetching user profile from Firestore:', err);
        }).finally(() => {
          setIsDbLoading(false);
        });

        // Load logs
        getUserLogs(userId).then((userLogs) => {
          if (userLogs && userLogs.length > 0) {
            setLogs(userLogs);
          }
        }).catch(err => {
          console.error('Error fetching logs from Firestore:', err);
        });
      }
    }
  }, [loggedInUser]);

  // Auto-save stats to Firestore on updates if logged in and not loading
  useEffect(() => {
    if (loggedInUser && !isDbLoading) {
      const userId = getCleanUserId(loggedInUser);
      if (userId) {
        // Safe asynchronous background save
        saveUserProfile(userId, stats, realBalance, withdrawLimit)
          .catch(err => console.error('Error background-saving profile to Firestore:', err));
      }
    }
  }, [stats, realBalance, withdrawLimit, loggedInUser, isDbLoading]);

  // Utility to append transaction logs securely with simulated SHA256 hashes
  const addLog = (
    type: 'earn' | 'purchase_coins' | 'purchase_booster' | 'purchase_cosmetic' | 'stage_skip',
    desc: string,
    amount: number,
    currency: 'coins' | 'real'
  ) => {
    const hexChars = '0123456789abcdef';
    const randomHash = Array.from({ length: 32 }, () => hexChars[Math.floor(Math.random() * 16)]).join('');
    const randomId = `TXN-${Math.floor(100000 + Math.random() * 900000)}-${Math.floor(10 + Math.random() * 89)}`;

    const newLog: TransactionLog = {
      id: randomId,
      timestamp: new Date().toLocaleString('pt-BR'),
      type,
      description: desc,
      amount,
      currency,
      status: 'success',
      securityHash: `0x${randomHash}`
    };

    setLogs((prev) => [...prev, newLog]);

    if (loggedInUser) {
      const userId = getCleanUserId(loggedInUser);
      if (userId) {
        addUserLog(userId, { ...newLog, userId } as any)
          .catch(err => console.error('Error adding log to Firestore:', err));
      }
    }
  };

  // Helper to trigger direct quick-buys from headers/shortcuts
  const openCheckoutForQuickBuy = (itemId: string) => {
    const match = SHOP_ITEMS.find((it) => it.id === itemId);
    if (match) {
      setCheckoutItem(match);
    }
  };

  // Fulfill secure payments directly
  const handleCheckoutSuccess = (item: ShopItem) => {
    setStats((prev) => {
      let nextLives = prev.lives;
      let nextCoins = prev.coins;
      let nextSkins = [...prev.unlockedSkins];
      let nextAccessories = [...prev.unlockedAccessories];
      let nextAuras = [...prev.unlockedAuras];
      let nextIsVip = prev.isVip;
      let nextRtpBoostSpins = prev.rtpBoostSpins || 0;

      if (item.subCategory === 'lives') {
        nextLives += item.value;
      } else if (item.subCategory === 'pack' && item.id.includes('coins')) {
        nextCoins += item.value;
      } else if (item.id === 'limit_upgrade_500') {
        nextCoins += item.value;
        nextLives += 5; // 5 bonus lives!
      } else if (item.id === 'pack_skips_3') {
        // Push 3 copies of 'booster_stage_skip' to unlockedAccessories
        nextAccessories.push(...Array(item.value).fill('booster_stage_skip'));
      } else if (item.id === 'vip_all_access') {
        // Unlock all assets!
        nextSkins = SKINS.map((s) => s.id);
        nextAccessories = ACCESSORIES.map((a) => a.id);
        nextAuras = AURAS.map((au) => au.id);
        // Add 10 bonus lives
        nextLives += 10;
        nextIsVip = true;
      } else if (item.id === 'booster_luck_15') {
        nextRtpBoostSpins += item.value;
      }

      return {
        ...prev,
        lives: nextLives,
        coins: nextCoins,
        unlockedSkins: nextSkins,
        unlockedAccessories: nextAccessories,
        unlockedAuras: nextAuras,
        isVip: nextIsVip,
        rtpBoostSpins: nextRtpBoostSpins
      };
    });

    const isPack = item.category === 'coins';
    const logType = isPack ? 'purchase_coins' : 'purchase_booster';
    addLog(logType, `Compra Segura aprovada: ${item.name}`, item.price, 'real');

    playSound.purchase();
    setCheckoutItem(null);
    triggerToast(`Sucesso! Seu ${item.name} foi creditado com segurança no sistema.`);
  };

  function triggerToast(msg: string) {
    setAppToast(msg);
    setTimeout(() => setAppToast(null), 4000);
  }

  const sendBrowserNotification = (title: string, options: any, type: 'chat' | 'friend' | 'promo' | 'test') => {
    // Show in-app banner alert first for instant visual feedback
    setLastNotification({ title, body: options.body || '', type });
    setTimeout(() => setLastNotification(null), 5000);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          // Play audio alert
          playSound.victory();
          new Notification(title, options);
          return true;
        } catch (e) {
          console.warn('Browser blocked notification inside iframe, showing custom toast:', e);
        }
      }
    }
    
    // Play audio alert anyway
    try { playSound.victory(); } catch(e){}
    // Fallback toast
    let emoji = '🔔';
    if (type === 'chat') emoji = '💬';
    if (type === 'friend') emoji = '👥';
    if (type === 'promo') emoji = '🎁';
    triggerToast(`${emoji} ${title}: ${options.body}`);
    return false;
  };

  // Request browser Notification Permission with instant state updates
  const requestNotificationPermission = async () => {
    playSound.click();
    if (typeof window === 'undefined' || !('Notification' in window)) {
      triggerToast('❌ Seu navegador não suporta notificações de área de trabalho.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        playSound.victory();
        triggerToast('✅ Notificações ativadas! Agora você receberá alertas em tempo real.');
        // Show test greeting notification
        sendBrowserNotification('🚀 Notificações Prontas!', {
          body: 'As notificações da Arena de Jogos foram configuradas com sucesso!',
          icon: '/icon.png'
        }, 'test');
      } else if (permission === 'denied') {
        triggerToast('⚠️ Permissão negada. Você precisará permitir nas configurações do seu navegador para receber alertas.');
      }
    } catch (err) {
      console.error('Error requesting permission:', err);
      // Fallback request
      try {
        Notification.requestPermission((permission) => {
          setNotificationPermission(permission);
          if (permission === 'granted') {
            triggerToast('✅ Notificações ativadas!');
          }
        });
      } catch (e) {
        triggerToast('⚠️ Não foi possível solicitar permissões devido às restrições do iframe.');
      }
    }
  };

  // Setup periodic polling for notifications
  useEffect(() => {
    if (!loggedInUser) {
      setUnreadCount(0);
      return;
    }

    let lastChecked = new Date().toISOString();
    let knownFollowersList: string[] = [];
    let initialLoad = true;
    let lastPromoId = localStorage.getItem('gamezone_last_promo_id') || '';

    const checkNotifications = async () => {
      try {
        const url = `/api/user/notifications?userId=${loggedInUser.uid}&lastChecked=${lastChecked}`;
        const res = await fetch(url);
        if (!res.ok) return;

        const data = await res.json();
        if (data.success) {
          // Update lastChecked instantly
          lastChecked = new Date().toISOString();

          // 1. New Messages in Chat
          if (data.newMessages && data.newMessages.length > 0) {
            // Only increment if not currently viewing chat tab
            if (activeTab !== 'chat') {
              setUnreadCount(prev => prev + data.newMessages.length);
            }
            data.newMessages.forEach((msg: any) => {
              const textContent = msg.text || (msg.mediaType === 'image' ? '📷 Foto enviada' : '🎙️ Áudio enviado');
              sendBrowserNotification('💬 Mensagem de Arena Chat', {
                body: textContent,
                icon: '/icon.png',
                tag: msg.id
              }, 'chat');
            });
          }

          // 2. Friend Invitations / New Follows
          const currentFollowers = data.followers || [];
          if (initialLoad) {
            knownFollowersList = currentFollowers;
            initialLoad = false;
          } else {
            const newFollowers = currentFollowers.filter((fId: string) => !knownFollowersList.includes(fId));
            if (newFollowers.length > 0) {
              newFollowers.forEach((followerId: string) => {
                sendBrowserNotification('👥 Novo Seguidor / Convite', {
                  body: `O piloto "${followerId}" começou a seguir você! Retribua a amizade!`,
                  icon: '/icon.png',
                  tag: `follower-${followerId}`
                }, 'friend');
              });
              knownFollowersList = currentFollowers;
            }
          }

          // 3. New promotions
          if (data.promotion && data.promotion.id !== lastPromoId) {
            lastPromoId = data.promotion.id;
            localStorage.setItem('gamezone_last_promo_id', lastPromoId);

            sendBrowserNotification(data.promotion.title, {
              body: data.promotion.body,
              icon: '/icon.png',
              tag: data.promotion.id
            }, 'promo');
          }
        }
      } catch (e) {
        console.warn('Erro ao sincronizar notificações no background:', e);
      }
    };

    // Poll every 8.5 seconds for instant response
    checkNotifications();
    const interval = setInterval(checkNotifications, 8500);

    return () => clearInterval(interval);
  }, [loggedInUser, activeTab]);

  // Instantly clear unread messages when opening the chat
  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadCount(0);
    }
  }, [activeTab]);

  const handlePrefetchTab = (tab: 'games' | 'avatar' | 'shop' | 'logs' | 'football' | 'cinema' | 'gamezoneshop' | 'feed' | 'profile' | 'chat' | 'modules' | 'security' | 'finance') => {
    switch (tab) {
      case 'games':
        import('./components/GamePortal');
        break;
      case 'avatar':
        import('./components/AvatarCustomizer');
        break;
      case 'shop':
        import('./components/Shop');
        break;
      case 'logs':
        import('./components/TransactionLogs');
        break;
      case 'football':
        import('./components/FootballBets');
        break;
      case 'cinema':
        import('./components/Cinema');
        break;
      case 'gamezoneshop':
        import('./components/GamezoneShop');
        break;
      case 'security':
        import('./components/SecurityCenter');
        break;
      case 'finance':
        import('./components/FinancePortal');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans relative overflow-x-hidden transition-colors duration-300">
      
      {/* Decorative Fluid Ambient Glowing Backdrops */}
      <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[50%] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none animate-float" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[50%] rounded-full bg-purple-500/10 blur-[130px] pointer-events-none animate-float" style={{ animationDelay: '3s' }} />
      <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[140px] pointer-events-none animate-float" style={{ animationDelay: '6s' }} />
      
      {/* Upper security announcement ribbon */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-center text-[10px] md:text-xs text-slate-300 font-mono flex items-center justify-center gap-2 relative z-10 shadow-sm">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>SISTEMA DE PAGAMENTO CRIPTOGRAFADO ATIVO — CONEXÃO SEGURA SSL</span>
      </div>

      {/* Main Header navigation & Player stats */}
      <Header
        stats={stats}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openCheckoutForQuickBuy={openCheckoutForQuickBuy}
        realBalance={realBalance}
        loggedInUser={loggedInUser}
        onLogout={handleLogout}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onPrefetchTab={handlePrefetchTab}
        unreadCount={unreadCount}
        theme={theme}
        setTheme={setTheme}
      />

      {/* App-level Toast notifications */}
      {appToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-900/90 text-emerald-200 border border-emerald-700/80 rounded-xl shadow-2xl flex items-center gap-3 animate-slideIn max-w-sm">
          <div className="p-1 bg-emerald-800 rounded-lg text-emerald-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold">{appToast}</p>
          <button
            onClick={() => setAppToast(null)}
            className="text-emerald-400 hover:text-emerald-100 cursor-pointer ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-view switcher based on active tab with real-time dynamic loading technology */}
      <main className="flex-1 pb-16">
        <Suspense fallback={<TabLoader tabName={activeTab} />}>
          {activeTab === 'games' && (
            <GamePortal
              stats={stats}
              updateStats={updateStats}
              addLog={addLog}
              openShop={() => setActiveTab('shop')}
              openCheckoutForQuickBuy={openCheckoutForQuickBuy}
              loggedInUser={loggedInUser}
              onOpenAuthModal={() => setShowAuthModal(true)}
              realBalance={realBalance}
              setRealBalance={setRealBalance}
              withdrawLimit={withdrawLimit}
              setWithdrawLimit={setWithdrawLimit}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'football' && (
            <div className="p-3 md:p-6 max-w-5xl mx-auto">
              <FootballBets
                stats={stats}
                updateStats={updateStats}
                addLog={addLog}
                realBalance={realBalance}
                setRealBalance={setRealBalance}
                withdrawLimit={withdrawLimit}
                setWithdrawLimit={setWithdrawLimit}
              />
            </div>
          )}

          {activeTab === 'avatar' && (
            <AvatarCustomizer
              stats={stats}
              updateStats={updateStats}
              addLog={addLog}
              openCheckoutForCoins={() => setActiveTab('shop')}
            />
          )}

          {activeTab === 'shop' && (
            <Shop
              stats={stats}
              updateStats={updateStats}
              addLog={addLog}
              openCheckout={(item) => setCheckoutItem(item)}
            />
          )}

          {activeTab === 'logs' && (
            <TransactionLogs
              logs={logs}
            />
          )}

          {activeTab === 'cinema' && (
            <Cinema
              stats={stats}
              updateStats={updateStats}
              addLog={addLog}
              loggedInUser={loggedInUser}
              onOpenLogin={() => setShowAuthModal(true)}
            />
          )}

          {activeTab === 'gamezoneshop' && (
            <GamezoneShop
              stats={stats}
              updateStats={updateStats}
              addLog={addLog}
              loggedInUser={loggedInUser}
              onOpenLogin={() => setShowAuthModal(true)}
              realBalance={realBalance}
              setRealBalance={setRealBalance}
            />
          )}

          {activeTab === 'feed' && (
            <Feed
              loggedInUser={loggedInUser}
              onOpenLogin={() => setShowAuthModal(true)}
            />
          )}

          {activeTab === 'chat' && (
            <ChatPortal
              loggedInUser={loggedInUser}
              onOpenLogin={() => setShowAuthModal(true)}
            />
          )}

          {activeTab === 'profile' && (
            <ProfilePortal
              loggedInUser={loggedInUser}
              setLoggedInUser={setLoggedInUser}
              onOpenLogin={() => setShowAuthModal(true)}
              stats={stats}
              updateStats={updateStats}
            />
          )}

          {activeTab === 'modules' && (
            <EcosystemDashboard
              loggedInUser={loggedInUser}
              stats={stats}
              realBalance={realBalance}
              logs={logs}
              onTriggerToast={triggerToast}
              onRefreshUserData={() => {
                if (loggedInUser) {
                  const userId = getCleanUserId(loggedInUser);
                  if (userId) {
                    getUserProfile(userId).then((profile) => {
                      if (profile) {
                        setStats(profile.stats);
                        setRealBalance(profile.realBalance);
                        setWithdrawLimit(profile.withdrawLimit);
                      }
                    }).catch(err => console.error('Error refreshing stats:', err));
                    
                    getUserLogs(userId).then((userLogs) => {
                      if (userLogs && userLogs.length > 0) {
                        setLogs(userLogs);
                      }
                    }).catch(err => console.error('Error refreshing logs:', err));
                  }
                }
              }}
            />
          )}

          {activeTab === 'security' && (
            <div className="p-3 md:p-6 max-w-5xl mx-auto">
              <SecurityCenter
                user={loggedInUser}
                onUserUpdate={(updated) => setLoggedInUser(updated)}
                onLogout={handleLogout}
              />
            </div>
          )}

          {activeTab === 'finance' && (
            <FinancePortal
              stats={stats}
              updateStats={(newStats) => setStats(newStats)}
              loggedInUser={loggedInUser ? loggedInUser.uid : null}
              onOpenLogin={() => setShowAuthModal(true)}
              realBalance={realBalance}
              setRealBalance={setRealBalance}
              logs={logs}
              setLogs={setLogs}
            />
          )}

          {activeTab === 'admin' && (
            <div className="p-3 md:p-6 max-w-7xl mx-auto">
              <AdminPortal
                user={loggedInUser}
                onTriggerToast={triggerToast}
              />
            </div>
          )}
        </Suspense>
      </main>

      {/* Integrated secure checkout modal overlay */}
      {checkoutItem && (
        <CheckoutModal
          item={checkoutItem}
          onClose={() => setCheckoutItem(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {/* User Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(user) => {
            setLoggedInUser(user);
          }}
          triggerToast={triggerToast}
        />
      )}

      {/* Real-time System Notification Banner Toast Overlay */}
      {lastNotification && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/60 max-w-sm w-80 flex gap-3 animate-slideIn backdrop-blur-md bg-slate-900/95">
          <div className="p-2.5 rounded-xl shrink-0 h-fit bg-indigo-500/10 text-indigo-400">
            {lastNotification.type === 'chat' && <Bell className="w-5 h-5 text-emerald-400 animate-pulse" />}
            {lastNotification.type === 'friend' && <UserPlus className="w-5 h-5 text-cyan-400" />}
            {lastNotification.type === 'promo' && <Megaphone className="w-5 h-5 text-amber-400" />}
            {lastNotification.type === 'test' && <Sparkles className="w-5 h-5 text-indigo-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black tracking-tight text-slate-100">{lastNotification.title}</h4>
            <p className="text-[11px] text-slate-300 mt-1 font-sans font-medium line-clamp-3">{lastNotification.body}</p>
          </div>
          <button 
            onClick={() => setLastNotification(null)}
            className="text-slate-400 hover:text-white cursor-pointer self-start p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Notification Control Trigger Button */}
      <button
        onClick={() => {
          playSound.click();
          setShowNotificationCenter(!showNotificationCenter);
        }}
        className="fixed bottom-24 right-6 z-40 p-3.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 cursor-pointer transition-all duration-300 group flex items-center justify-center border border-indigo-400/20"
        title="Centro de Notificações Push"
        id="floating-notification-bell"
      >
        <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white shadow animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Center Config Panel Drawer */}
      <NotificationCenter
        user={loggedInUser}
        onTriggerToast={triggerToast}
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        onUnreadCountChange={setUnreadCount}
      />

      {/* Global persistent Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-10 text-xs text-slate-500 mt-auto font-sans shadow-inner">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
            {/* Logo and support */}
            <div className="text-center md:text-left space-y-1.5">
              <div className="text-sm font-black text-slate-900 tracking-wider font-mono">
                🚀 GAME<span className="text-indigo-600">ZONE</span> ARCADE &amp; CINE
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Sua plataforma integrada de entretenimento virtual premium e streaming.
              </p>
            </div>

            {/* Quick links */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] text-slate-500 font-semibold">
              <button onClick={() => setActiveTab('games')} className="hover:text-indigo-600 transition-colors cursor-pointer">Arcade</button>
              <button onClick={() => setActiveTab('cinema')} className="hover:text-red-600 transition-colors cursor-pointer">Sessão Cinema</button>
              <button onClick={() => setActiveTab('gamezoneshop')} className="hover:text-amber-500 transition-colors cursor-pointer">GamezoneShop</button>
              <button onClick={() => setActiveTab('football')} className="hover:text-emerald-600 transition-colors cursor-pointer">Futebol</button>
              <button onClick={() => setActiveTab('shop')} className="hover:text-purple-600 transition-colors cursor-pointer">Loja VIP</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1 text-[11px] text-slate-500 font-mono">
            {/* Contact and copyright */}
            <div className="text-center sm:text-left space-y-1">
              <p>© 2026 GameZone Inc. Todos os direitos reservados.</p>
              <p>Contato &amp; Suporte: <a href="mailto:tiagojorgeengenheiro@gmail.com" className="text-indigo-600 hover:text-indigo-500 transition-colors underline select-all font-sans font-medium">tiagojorgeengenheiro@gmail.com</a></p>
            </div>

            {/* Security badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 bg-slate-50/80 border border-slate-200/50 px-3 py-1.5 rounded-xl text-[10px] text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-slate-600">🔒 SSL Criptografado</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">🛡️ PCI-DSS Nível 1</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-extrabold">⚡ Pix Instantâneo BC</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
