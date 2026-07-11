import React, { useState, useEffect } from 'react';
import { GameStore } from './GameStore';
import { GameDetails } from './GameDetails';
import { UserLibrary } from './UserLibrary';
import { DevDashboard } from './DevDashboard';
import { SocialFeed } from './SocialFeed';
import { AdminPortalExt } from './AdminPortalExt';

import { PublishedGame, LibraryItem, DevProfile, ShoppingCartItem, DiscountCoupon, GameReview } from '../../types/distribution';
import { INITIAL_PUBLISHED_GAMES, MOCK_DEVELOPERS, MOCK_REVIEWS } from '../../data/mockGames';
import { playSound } from '../../utils/audio';

interface DistributionPortalProps {
  realBalance: number;
  setRealBalance: React.Dispatch<React.SetStateAction<number>>;
  onTriggerToast: (msg: string) => void;
  onAddLog: (
    type: 'earn' | 'purchase_coins' | 'purchase_booster' | 'purchase_cosmetic' | 'stage_skip',
    desc: string,
    amount: number,
    currency: 'coins' | 'real'
  ) => void;
  isAdmin?: boolean;
}

export const DistributionPortal: React.FC<DistributionPortalProps> = ({
  realBalance,
  setRealBalance,
  onTriggerToast,
  onAddLog,
  isAdmin = true // set true by default for developer testing flexibility
}) => {
  const [activeTab, setActiveTab] = useState<'store' | 'library' | 'dev' | 'social' | 'admin'>('store');
  const [selectedGame, setSelectedGame] = useState<PublishedGame | null>(null);

  // Core synchronized state engines (using localStorage persistency)
  const [games, setGames] = useState<PublishedGame[]>(() => {
    const cached = localStorage.getItem('gamezon_published_games_r56');
    return cached ? JSON.parse(cached) : INITIAL_PUBLISHED_GAMES;
  });

  const [developers, setDevelopers] = useState<DevProfile[]>(() => {
    const cached = localStorage.getItem('gamezon_developers_r56');
    return cached ? JSON.parse(cached) : MOCK_DEVELOPERS;
  });

  const [library, setLibrary] = useState<LibraryItem[]>(() => {
    const cached = localStorage.getItem('gamezon_user_library_r56');
    return cached ? JSON.parse(cached) : [
      {
        id: 'lib-samurai',
        gameId: 'game-shadow-samurai',
        gameTitle: 'Shadow Samurai: Zero',
        gameIconUrl: '⚔️',
        purchasedAt: new Date().toISOString(),
        pricePaid: 0,
        isFavorite: false,
        playTimeMinutes: 12,
        isInstalled: true,
        achievements: [
          { id: 'ach-first-boot', title: 'Primeiro Boot', desc: 'Iniciou o jogo com sucesso na GameZon.', unlocked: true, unlockedAt: '15:30' },
          { id: 'ach-pro-drifter', title: 'Drifter Elite', desc: 'Alcançou 15 minutos simulados de sessão.', unlocked: false }
        ]
      }
    ];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const cached = localStorage.getItem('gamezon_user_wishlist_r56');
    return cached ? JSON.parse(cached) : ['game-neon-overdrive'];
  });

  const [cart, setCart] = useState<ShoppingCartItem[]>([]);
  
  const [devProfile, setDevProfile] = useState<DevProfile | null>(() => {
    const cached = localStorage.getItem('gamezon_dev_profile_r56');
    return cached ? JSON.parse(cached) : null;
  });

  const [following, setFollowing] = useState<string[]>([]);

  const [coupons, setCoupons] = useState<DiscountCoupon[]>(() => {
    return [
      { code: 'GAMEZON56', discountPercent: 20, isActive: true },
      { code: 'INDIEPOWER', discountPercent: 10, isActive: true }
    ];
  });

  const [reviews, setReviews] = useState<Record<string, GameReview[]>>(() => {
    const cached = localStorage.getItem('gamezon_reviews_r56');
    return cached ? JSON.parse(cached) : MOCK_REVIEWS;
  });

  const [comments, setComments] = useState<Record<string, { id: string; username: string; userAvatar: string; text: string; date: string }[]>>({
    'game-neon-overdrive': [
      { id: 'c1', username: 'DigaDrift', userAvatar: '🏎️', text: 'Esse jogo roda liso no Linux?', date: 'Ontem' },
      { id: 'c2', username: 'CyberPulse Studios', userAvatar: '⚡', text: 'Sim, DigaDrift! Há suporte nativo a builds OpenGL e Vulkan compilados.', date: 'Ontem' }
    ]
  });

  const [systemLogs, setSystemLogs] = useState<{ id: string; type: string; desc: string; amount: number; date: string }[]>(() => {
    return [
      { id: 'log-1', type: 'system', desc: 'Portal de Distribuição de Jogos GameZon ativado.', amount: 0, date: new Date().toLocaleTimeString() }
    ];
  });

  // Safe side effects caching state to disk
  useEffect(() => {
    localStorage.setItem('gamezon_published_games_r56', JSON.stringify(games));
  }, [games]);

  useEffect(() => {
    localStorage.setItem('gamezon_developers_r56', JSON.stringify(developers));
  }, [developers]);

  useEffect(() => {
    localStorage.setItem('gamezon_user_library_r56', JSON.stringify(library));
  }, [library]);

  useEffect(() => {
    localStorage.setItem('gamezon_user_wishlist_r56', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('gamezon_dev_profile_r56', JSON.stringify(devProfile));
  }, [devProfile]);

  useEffect(() => {
    localStorage.setItem('gamezon_reviews_r56', JSON.stringify(reviews));
  }, [reviews]);

  // Handlers
  const handleSelectGame = (game: PublishedGame) => {
    playSound.click();
    setSelectedGame(game);
  };

  const handleAddToCart = (game: PublishedGame) => {
    playSound.click();
    if (cart.some(item => item.game.id === game.id)) {
      onTriggerToast(`🛒 "${game.title}" já está no carrinho!`);
      return;
    }
    setCart(prev => [...prev, { game, quantity: 1 }]);
    onTriggerToast(`🛒 Adicionado ao carrinho: ${game.title}`);
  };

  const handleAddToWishlist = (game: PublishedGame) => {
    playSound.click();
    if (wishlist.includes(game.id)) {
      setWishlist(prev => prev.filter(id => id !== game.id));
      onTriggerToast('💔 Removido da lista de desejos.');
    } else {
      setWishlist(prev => [...prev, game.id]);
      onTriggerToast('💖 Adicionado à lista de desejos!');
    }
  };

  const handlePurchaseComplete = (gameIds: string[], pricePaid: number) => {
    const newLibItems: LibraryItem[] = gameIds.map(id => {
      const g = games.find(game => game.id === id);
      return {
        id: 'lib-' + Math.floor(100000 + Math.random() * 900000),
        gameId: id,
        gameTitle: g ? g.title : 'Jogo Desconhecido',
        gameIconUrl: g ? g.iconUrl : '🎮',
        purchasedAt: new Date().toISOString(),
        pricePaid: pricePaid / gameIds.length,
        isFavorite: false,
        playTimeMinutes: 0,
        isInstalled: false,
        achievements: [
          { id: 'ach-first-boot', title: 'Primeiro Boot', desc: 'Iniciou o jogo com sucesso na GameZon.', unlocked: false },
          { id: 'ach-pro-drifter', title: 'Drifter Elite', desc: 'Alcançou 15 minutos simulados de sessão.', unlocked: false }
        ]
      };
    });

    setLibrary(prev => [...prev, ...newLibItems]);

    // Update sales/download count dynamically in store
    setGames(prev => prev.map(g => {
      if (gameIds.includes(g.id)) {
        return { ...g, salesCount: g.salesCount + 1, downloadsCount: g.downloadsCount + 1 };
      }
      return g;
    }));

    // Generate System Audit Logs
    const logDesc = `Compra de títulos por Jogador: ID [${gameIds.join(', ')}] liquidada.`;
    setSystemLogs(prev => [
      { id: 'log-' + Date.now(), type: 'purchase', desc: logDesc, amount: pricePaid, date: new Date().toLocaleTimeString() },
      ...prev
    ]);
  };

  const handlePublishGame = (newGame: PublishedGame) => {
    setGames(prev => [newGame, ...prev]);
    setSystemLogs(prev => [
      { id: 'log-' + Date.now(), type: 'publish', desc: `Novo jogo publicado: ${newGame.title}`, amount: 0, date: new Date().toLocaleTimeString() },
      ...prev
    ]);
  };

  const handleEditGame = (editedGame: PublishedGame) => {
    setGames(prev => prev.map(g => g.id === editedGame.id ? editedGame : g));
  };

  const handleCreateDevProfile = (studioName: string, bio: string, logo: string, banner: string, website: string) => {
    const newProfile: DevProfile = {
      id: 'dev_' + Math.floor(100000 + Math.random() * 900000),
      userId: 'user_active',
      studioName,
      bio,
      logoUrl: logo,
      bannerUrl: banner,
      website,
      team: ['Fundador'],
      followersCount: 0
    };
    setDevProfile(newProfile);
    setDevelopers(prev => [newProfile, ...prev]);
  };

  const handleAddReview = (rating: number, text: string) => {
    if (!selectedGame) return;
    const newRev: GameReview = {
      id: 'rev-' + Math.floor(100000 + Math.random() * 900000),
      userId: 'user_active',
      username: 'Jogador_Ativo',
      userAvatar: '👑',
      gameId: selectedGame.id,
      rating,
      reviewText: text,
      screenshots: [],
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date().toISOString()
    };

    setReviews(prev => {
      const prevList = prev[selectedGame.id] || [];
      return { ...prev, [selectedGame.id]: [newRev, ...prevList] };
    });

    // Recalculate average stars on store
    setGames(prev => prev.map(g => {
      if (g.id === selectedGame.id) {
        const revList = reviews[selectedGame.id] || [];
        const nextList = [newRev, ...revList];
        const sum = nextList.reduce((acc, r) => acc + r.rating, 0);
        return { ...g, ratingCount: nextList.length, ratingAverage: sum / nextList.length };
      }
      return g;
    }));
  };

  const handleRespondReview = (gameId: string, reviewId: string, responseText: string) => {
    setReviews(prev => {
      const list = prev[gameId] || [];
      const updatedList = list.map(r => r.id === reviewId ? { ...r, devResponse: responseText } : r);
      return { ...prev, [gameId]: updatedList };
    });
  };

  const handleAddComment = (commentText: string) => {
    if (!selectedGame) return;
    const newComment = {
      id: 'c-' + Math.floor(100000 + Math.random() * 900000),
      username: 'Jogador_Ativo',
      userAvatar: '👑',
      text: commentText,
      date: 'Agora mesmo'
    };

    setComments(prev => {
      const list = prev[selectedGame.id] || [];
      return { ...prev, [selectedGame.id]: [...list, newComment] };
    });
  };

  const handleToggleFollow = (devId: string) => {
    playSound.click();
    if (following.includes(devId)) {
      setFollowing(prev => prev.filter(id => id !== devId));
      onTriggerToast('💔 Você deixou de seguir este estúdio.');
    } else {
      setFollowing(prev => [...prev, devId]);
      onTriggerToast('💖 Você agora está seguindo este estúdio!');
    }
  };

  const wishlistGames = games.filter(g => wishlist.includes(g.id));

  return (
    <div className="space-y-6">
      
      {/* Tab select bar */}
      <div className="flex bg-slate-950 border border-slate-850 p-1.5 rounded-2xl gap-1 overflow-x-auto scrollbar-none shrink-0">
        {[
          { id: 'store', name: '🎮 Loja de Jogos PC' },
          { id: 'library', name: '💾 Minha Biblioteca' },
          { id: 'dev', name: '⚙️ Estúdio de Criação' },
          { id: 'social', name: '👥 Arena de Conexão' },
          { id: 'admin', name: '🛡️ Painel Auditor' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { playSound.click(); setActiveTab(tab.id as any); setSelectedGame(null); }}
            className={`py-2 px-4.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === tab.id 
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-black' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Render selected views */}
      {selectedGame ? (
        <GameDetails
          game={selectedGame}
          onBack={() => { playSound.click(); setSelectedGame(null); }}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
          wishlist={wishlist}
          reviews={reviews[selectedGame.id] || []}
          onAddReview={handleAddReview}
          onAddComment={handleAddComment}
          comments={comments[selectedGame.id] || []}
          relatedGames={games.filter(g => g.id !== selectedGame.id)}
          onSelectGame={handleSelectGame}
          owned={library.some(item => item.gameId === selectedGame.id)}
        />
      ) : (
        <>
          {activeTab === 'store' && (
            <GameStore
              games={games}
              onSelectGame={handleSelectGame}
              cart={cart}
              setCart={setCart}
              realBalance={realBalance}
              setRealBalance={setRealBalance}
              onTriggerToast={onTriggerToast}
              onAddLog={onAddLog}
              onPurchaseComplete={handlePurchaseComplete}
            />
          )}

          {activeTab === 'library' && (
            <UserLibrary
              library={library}
              setLibrary={setLibrary}
              wishlistGames={wishlistGames}
              onSelectGame={handleSelectGame}
              onTriggerToast={onTriggerToast}
            />
          )}

          {activeTab === 'dev' && (
            <DevDashboard
              publishedGames={games}
              onPublishGame={handlePublishGame}
              onEditGame={handleEditGame}
              devProfile={devProfile}
              onCreateDevProfile={handleCreateDevProfile}
              reviews={reviews}
              onRespondReview={handleRespondReview}
              onTriggerToast={onTriggerToast}
            />
          )}

          {activeTab === 'social' && (
            <SocialFeed
              developers={developers}
              following={following}
              onToggleFollow={handleToggleFollow}
              onTriggerToast={onTriggerToast}
            />
          )}

          {activeTab === 'admin' && (
            <AdminPortalExt
              games={games}
              setGames={setGames}
              developers={developers}
              setDevelopers={setDevelopers}
              coupons={coupons}
              setCoupons={setCoupons}
              logs={systemLogs}
              onTriggerToast={onTriggerToast}
            />
          )}
        </>
      )}

    </div>
  );
};
