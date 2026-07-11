import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code, Settings, TrendingUp, SlidersHorizontal, Layers, Plus, Save, Trash2, 
  CheckCircle2, DollarSign, Download, Eye, Star, Info, MessageSquare, Send, ShieldAlert, Users
} from 'lucide-react';
import { PublishedGame, DevProfile, GameReview } from '../../types/distribution';
import { playSound } from '../../utils/audio';

interface DevDashboardProps {
  publishedGames: PublishedGame[];
  onPublishGame: (game: PublishedGame) => void;
  onEditGame: (game: PublishedGame) => void;
  devProfile: DevProfile | null;
  onCreateDevProfile: (studioName: string, bio: string, logo: string, banner: string, website: string) => void;
  reviews: Record<string, GameReview[]>;
  onRespondReview: (gameId: string, reviewId: string, responseText: string) => void;
  onTriggerToast: (msg: string) => void;
}

export const DevDashboard: React.FC<DevDashboardProps> = ({
  publishedGames,
  onPublishGame,
  onEditGame,
  devProfile,
  onCreateDevProfile,
  reviews,
  onRespondReview,
  onTriggerToast
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'games' | 'reviews' | 'profile'>('stats');
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [editingGame, setEditingGame] = useState<PublishedGame | null>(null);

  // Form states for creating profile
  const [studioName, setStudioName] = useState('');
  const [studioBio, setStudioBio] = useState('');
  const [studioLogo, setStudioLogo] = useState('🛠️');
  const [studioBanner, setStudioBanner] = useState('');
  const [studioWebsite, setStudioWebsite] = useState('');

  // Form states for publishing game
  const [gameTitle, setGameTitle] = useState('');
  const [gameSubtitle, setGameSubtitle] = useState('');
  const [gameDesc, setGameDesc] = useState('');
  const [gameShortDesc, setGameShortDesc] = useState('');
  const [gameCategory, setGameCategory] = useState<'game' | 'dlc' | 'bundle'>('game');
  const [gameGenre, setGameGenre] = useState<PublishedGame['genre']>('Ação');
  const [gamePlatforms, setGamePlatforms] = useState<string[]>(['Windows']);
  const [gamePrice, setGamePrice] = useState(0);
  const [gameDiscount, setGameDiscount] = useState(0);
  const [gameVersion, setGameVersion] = useState('1.0.0');
  const [gameChangelog, setGameChangelog] = useState('Lançamento inicial.');
  const [gameTags, setGameTags] = useState('');
  const [gameIcon, setGameIcon] = useState('🎮');
  const [gameBanner, setGameBanner] = useState('');

  // Developer response state
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const handleRegisterProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSound.click();
    if (!studioName.trim() || !studioBio.trim()) {
      onTriggerToast('❌ Nome do estúdio e biografia são obrigatórios.');
      return;
    }
    onCreateDevProfile(
      studioName,
      studioBio,
      studioLogo || '⚙️',
      studioBanner || 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
      studioWebsite || 'https://meuestudio.io'
    );
    onTriggerToast('🚀 Perfil de Desenvolvedor criado! Painel do estúdio desbloqueado.');
  };

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSound.click();

    if (!gameTitle.trim()) {
      onTriggerToast('❌ O título do jogo é obrigatório.');
      return;
    }

    const defaultRequirements = {
      os: 'Windows 10 64-bit',
      processor: 'Intel i5 / AMD Ryzen 3',
      memory: '8 GB RAM',
      graphics: 'NVIDIA GTX 1050',
      storage: '5 GB de espaço livre'
    };

    const newGame: PublishedGame = {
      id: editingGame ? editingGame.id : 'game-' + Date.now(),
      devId: devProfile?.id || 'dev_guest',
      devName: devProfile?.studioName || 'Estúdio Convidado',
      title: gameTitle,
      subtitle: gameSubtitle || 'Subtítulo do jogo',
      description: gameDesc || 'Descrição detalhada do jogo.',
      shortDescription: gameShortDesc || 'Uma curta introdução do game.',
      category: gameCategory as any,
      genre: gameGenre,
      platform: gamePlatforms as any,
      language: 'Português (BR), Inglês',
      ageRating: 'Livre',
      requirementsMin: defaultRequirements,
      requirementsRec: defaultRequirements,
      publisher: devProfile?.studioName || 'Estúdio Convidado',
      releaseDate: new Date().toISOString().split('T')[0],
      price: Number(gamePrice) || 0,
      discount: Number(gameDiscount) || 0,
      version: gameVersion || '1.0.0',
      changelog: gameChangelog || 'Lançamento inicial.',
      trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      images: [
        gameBanner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600'
      ],
      bannerUrl: gameBanner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800',
      iconUrl: gameIcon || '🎮',
      logoUrl: `🎮 ${gameTitle.toUpperCase()}`,
      tags: gameTags.split(',').map(t => t.trim()).filter(Boolean),
      status: 'published', // Automatically approved in sandbox
      downloadsCount: editingGame ? editingGame.downloadsCount : 0,
      salesCount: editingGame ? editingGame.salesCount : 0,
      ratingAverage: editingGame ? editingGame.ratingAverage : 5,
      ratingCount: editingGame ? editingGame.ratingCount : 1
    };

    if (editingGame) {
      onEditGame(newGame);
      onTriggerToast(`✓ Jogo editado com sucesso: ${gameTitle}`);
    } else {
      onPublishGame(newGame);
      onTriggerToast(`🚀 Novo jogo publicado com sucesso! ${gameTitle}`);
    }

    // Reset publishing form fields
    setGameTitle('');
    setGameSubtitle('');
    setGameDesc('');
    setGameShortDesc('');
    setGamePrice(0);
    setGameDiscount(0);
    setGameTags('');
    setShowPublishForm(false);
    setEditingGame(null);
  };

  const openEditForm = (game: PublishedGame) => {
    playSound.click();
    setEditingGame(game);
    setGameTitle(game.title);
    setGameSubtitle(game.subtitle);
    setGameDesc(game.description);
    setGameShortDesc(game.shortDescription);
    setGamePrice(game.price);
    setGameDiscount(game.discount);
    setGameCategory(game.category as any);
    setGameGenre(game.genre);
    setGamePlatforms(game.platform);
    setGameVersion(game.version);
    setGameChangelog(game.changelog);
    setGameIcon(game.iconUrl);
    setGameBanner(game.bannerUrl);
    setGameTags(game.tags.join(', '));
    setShowPublishForm(true);
  };

  const handleSendResponse = (gameId: string, reviewId: string) => {
    playSound.click();
    const text = replyText[reviewId];
    if (!text || !text.trim()) return;
    onRespondReview(gameId, reviewId, text);
    setReplyText(prev => ({ ...prev, [reviewId]: '' }));
    onTriggerToast('✓ Resposta do desenvolvedor enviada e anexada ao comentário.');
  };

  // If no dev profile, show creation form
  if (!devProfile) {
    return (
      <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="text-center space-y-1.5">
          <Code className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-black tracking-tight text-slate-100">Registrar Estúdio Gamer</h3>
          <p className="text-xs text-slate-400">Entre na rede de distribuição e comece a comercializar seus jogos com suporte total de faturamento.</p>
        </div>

        <form onSubmit={handleRegisterProfileSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-mono">NOME DO ESTÚDIO OU EMPRESA</label>
            <input
              type="text"
              placeholder="Ex: CyberPulse Studios, IndieUniverse"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-3.5 text-xs text-slate-100 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-mono">BIOGRAFIA E APRESENTAÇÃO</label>
            <textarea
              placeholder="Escreva sobre sua visão de desenvolvimento e portfólio..."
              value={studioBio}
              onChange={(e) => setStudioBio(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono">ÍCONE / EMOJI</label>
              <input
                type="text"
                placeholder="Ex: 👾, 🛠️, ⚔️, 🏎️"
                value={studioLogo}
                onChange={(e) => setStudioLogo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-slate-100 text-center outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono">WEBSITE OFICIAL</label>
              <input
                type="text"
                placeholder="Ex: https://meuestudio.com"
                value={studioWebsite}
                onChange={(e) => setStudioWebsite(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Registrar Estúdio na GameZon
          </button>
        </form>
      </div>
    );
  }

  // Calculate analytical dev stats
  const devGames = publishedGames.filter(g => g.devId === devProfile.id);
  const totalSalesCount = devGames.reduce((acc, g) => acc + g.salesCount, 0);
  const totalDownloadsCount = devGames.reduce((acc, g) => acc + g.downloadsCount, 0);
  const grossRevenue = devGames.reduce((acc, g) => {
    const finalPrice = g.price * (1 - (g.discount / 100));
    return acc + (g.salesCount * finalPrice);
  }, 0);
  const commissionDeducted = grossRevenue * 0.1; // 10% Platform fee
  const netRevenue = grossRevenue - commissionDeducted;

  return (
    <div className="space-y-6">
      
      {/* Dev studio Header Card banner */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-5 overflow-hidden">
        <div className="relative flex flex-col md:flex-row gap-4 items-center justify-between z-10">
          <div className="flex items-center gap-3.5">
            <span className="text-4xl h-14 w-14 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-center">
              {devProfile.logoUrl}
            </span>
            <div className="text-center md:text-left">
              <h3 className="text-lg font-black text-slate-100 tracking-tight">{devProfile.studioName}</h3>
              <p className="text-[10px] text-emerald-400 font-mono">PORTAL DE CRIAÇÃO ATIVO</p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => { playSound.click(); setShowPublishForm(true); setEditingGame(null); }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black py-2.5 px-4 rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Novo Jogo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Internal Navigation tabs */}
      <div className="flex gap-4 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'stats', name: 'Analíticas & Finanças' },
          { id: 'games', name: 'Meus Jogos Catalogados' },
          { id: 'reviews', name: 'Mural de Críticas' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { playSound.click(); setActiveTab(t.id as any); }}
            className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === t.id 
                ? 'bg-slate-800 text-emerald-400 border border-slate-700/80' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* 1. Analytical Charts/Stats Panel */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-1">
              <span className="text-[9px] text-slate-500 font-mono block">FATURAMENTO BRUTO</span>
              <p className="text-xl font-black text-slate-100">R$ {grossRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-1">
              <span className="text-[9px] text-slate-500 font-mono block">TAXA PLATAFORMA (10%)</span>
              <p className="text-xl font-black text-rose-500">-R$ {commissionDeducted.toFixed(2)}</p>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-1">
              <span className="text-[9px] text-emerald-500 font-mono block">LÍQUIDO RECEBIDO</span>
              <p className="text-xl font-black text-emerald-400">R$ {netRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-1">
              <span className="text-[9px] text-slate-500 font-mono block">UNIDADES VENDIDAS</span>
              <p className="text-xl font-black text-cyan-400">{totalSalesCount}</p>
            </div>
          </div>

          {/* Simple Analytics chart explanation */}
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-emerald-400 font-black text-xs block font-mono">★ MÉTRICAS DETALHADAS DE AUDIÊNCIA</span>
              <p className="text-xs text-slate-400 leading-normal max-w-md">
                Seus títulos possuem um total acumulado de <strong>{totalDownloadsCount}</strong> downloads e visualizações de página consistentes com taxa média de conversão de 11.2%.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <span className="text-[9px] text-slate-500 font-mono block">CONVERSÃO</span>
                <p className="text-base font-black text-slate-200">11.2%</p>
              </div>
              <div className="text-center">
                <span className="text-[9px] text-slate-500 font-mono block">GROWTH MENSAL</span>
                <p className="text-base font-black text-emerald-400">+14.5%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. List of published games with Edit options */}
      {activeTab === 'games' && (
        <div className="space-y-4">
          {devGames.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl py-12 text-center text-slate-500">
              Nenhum jogo publicado pelo estúdio ainda. Use o botão superior para criar um!
            </div>
          ) : (
            <div className="space-y-3">
              {devGames.map(game => {
                const price = game.price * (1 - (game.discount / 100));
                return (
                  <div key={game.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl h-11 w-11 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center">
                        {game.iconUrl}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-200 text-xs">{game.title}</h4>
                        <span className="text-[9px] text-slate-500 font-mono">Versão: {game.version} | Gênero: {game.genre}</span>
                        <div className="flex gap-4 text-[10px] text-slate-400 font-mono mt-1">
                          <span>Vendas: {game.salesCount}</span>
                          <span>Downloads: {game.downloadsCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                      <span className="text-xs text-emerald-400 font-bold">R$ {price.toFixed(2)}</span>
                      <button
                        onClick={() => openEditForm(game)}
                        className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-semibold py-1.5 px-3.5 rounded-xl cursor-pointer"
                      >
                        Editar Informações
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Dev response tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl text-[10px] text-slate-500 font-mono flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Responder análises de usuários aumenta seu índice de destaque orgânico e melhora a retenção em até 22%.</span>
          </div>

          <div className="space-y-4">
            {devGames.map(game => {
              const gameRevs = reviews[game.id] || [];
              if (gameRevs.length === 0) return null;

              return (
                <div key={game.id} className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 font-mono tracking-wider border-b border-slate-850 pb-1">{game.title}</h4>
                  
                  {gameRevs.map(rev => (
                    <div key={rev.id} className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-200">{rev.username} ({rev.rating}/5)</span>
                        <span className="text-[10px] text-slate-500 font-mono">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-normal font-sans">{rev.reviewText}</p>

                      {rev.devResponse ? (
                        <div className="bg-emerald-950/10 border border-emerald-900/20 p-2.5 rounded-lg text-[10px] text-slate-400 font-mono">
                          <strong>Sua resposta:</strong> {rev.devResponse}
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Escreva uma resposta de suporte oficial do estúdio..."
                            value={replyText[rev.id] || ''}
                            onChange={(e) => setReplyText(prev => ({ ...prev, [rev.id]: e.target.value }))}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs outline-none focus:border-emerald-500 text-slate-100"
                          />
                          <button
                            onClick={() => handleSendResponse(game.id, rev.id)}
                            className="bg-emerald-500 text-slate-950 font-bold text-xs py-1.5 px-3 rounded-lg hover:bg-emerald-400 cursor-pointer"
                          >
                            Enviar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Publish Game / Edit Game Overlay Modal Form */}
      <AnimatePresence>
        {showPublishForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setShowPublishForm(false)}
            />

            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl z-10 overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                <Save className="w-5 h-5 text-emerald-400" />
                <span>{editingGame ? 'Editar Jogo Publicado' : 'Formulário de Publicação de Jogo'}</span>
              </h3>

              <form onSubmit={handlePublishSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">TÍTULO PRINCIPAL</label>
                    <input
                      type="text"
                      placeholder="Ex: Cyber Drift Retro"
                      value={gameTitle}
                      onChange={(e) => setGameTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs outline-none text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">SUBTÍTULO / SLOGAN</label>
                    <input
                      type="text"
                      placeholder="Ex: Domine o drift na pista cibernética"
                      value={gameSubtitle}
                      onChange={(e) => setGameSubtitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs outline-none text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono">DESCRIÇÃO DETALHADA COMPLETA</label>
                  <textarea
                    placeholder="Descrição longa explicando a gameplay, sistemas de upgrades, conquistas etc..."
                    value={gameDesc}
                    onChange={(e) => setGameDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none text-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono">DESCRIÇÃO CURTA DE VITRINE</label>
                  <input
                    type="text"
                    placeholder="Resumo de no máximo 140 caracteres..."
                    value={gameShortDesc}
                    onChange={(e) => setGameShortDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs outline-none text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">GÊNERO</label>
                    <select
                      value={gameGenre}
                      onChange={(e) => setGameGenre(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2 text-xs outline-none text-slate-300"
                    >
                      <option value="Ação">Ação</option>
                      <option value="Aventura">Aventura</option>
                      <option value="RPG">RPG</option>
                      <option value="Estratégia">Estratégia</option>
                      <option value="Esporte">Esporte</option>
                      <option value="Simulação">Simulação</option>
                      <option value="Corrida">Corrida</option>
                      <option value="Indie">Indie</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">CATEGORIA</label>
                    <select
                      value={gameCategory}
                      onChange={(e) => setGameCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2 text-xs outline-none text-slate-300"
                    >
                      <option value="game">Jogo Completo</option>
                      <option value="dlc">DLC / Expansão</option>
                      <option value="bundle">Pacote (Bundle)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">PREÇO (R$)</label>
                    <input
                      type="number"
                      placeholder="0.00 para gratuito"
                      value={gamePrice}
                      onChange={(e) => setGamePrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs outline-none text-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">DESCONTO (%)</label>
                    <input
                      type="number"
                      placeholder="Ex: 15 para 15%"
                      value={gameDiscount}
                      onChange={(e) => setGameDiscount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs outline-none text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">VERSÃO ATUAL</label>
                    <input
                      type="text"
                      placeholder="Ex: 1.0.0"
                      value={gameVersion}
                      onChange={(e) => setGameVersion(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs outline-none text-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">TAGS (SEPARADAS POR VÍRGULA)</label>
                    <input
                      type="text"
                      placeholder="Ex: Cyberpunk, Solo, Difícil"
                      value={gameTags}
                      onChange={(e) => setGameTags(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs outline-none text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">EMOJI / ÍCONE</label>
                    <input
                      type="text"
                      placeholder="Ex: 🏎️, 🥋, 🚀"
                      value={gameIcon}
                      onChange={(e) => setGameIcon(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs outline-none text-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">FOTO / BANNER URL</label>
                    <input
                      type="text"
                      placeholder="Link de imagem do Unsplash..."
                      value={gameBanner}
                      onChange={(e) => setGameBanner(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs outline-none text-slate-200"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPublishForm(false)}
                    className="flex-1 border border-slate-850 text-slate-400 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-850 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black py-2.5 rounded-xl cursor-pointer shadow-lg"
                  >
                    {editingGame ? 'Salvar Edição' : 'Publicar na Loja'}
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
