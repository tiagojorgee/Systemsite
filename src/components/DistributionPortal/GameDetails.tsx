import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Star, Heart, Share2, ShoppingCart, Award, Calendar, HelpCircle, ShieldCheck, MessageSquare, Plus, ThumbsUp, Trash2
} from 'lucide-react';
import { PublishedGame, GameReview } from '../../types/distribution';
import { playSound } from '../../utils/audio';

interface GameDetailsProps {
  game: PublishedGame;
  onBack: () => void;
  onAddToCart: (game: PublishedGame) => void;
  onAddToWishlist: (game: PublishedGame) => void;
  wishlist: string[]; // gameIds
  reviews: GameReview[];
  onAddReview: (rating: number, text: string) => void;
  onAddComment: (commentText: string) => void;
  comments: { id: string; username: string; userAvatar: string; text: string; date: string }[];
  relatedGames: PublishedGame[];
  onSelectGame: (game: PublishedGame) => void;
  owned: boolean;
}

export const GameDetails: React.FC<GameDetailsProps> = ({
  game,
  onBack,
  onAddToCart,
  onAddToWishlist,
  wishlist,
  reviews,
  onAddReview,
  onAddComment,
  comments,
  relatedGames,
  onSelectGame,
  owned
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newCommentText, setNewCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'desc' | 'reqs' | 'comments' | 'news'>('desc');

  const isWishlisted = wishlist.includes(game.id);
  const finalPrice = game.price * (1 - (game.discount / 100));

  const handleShare = () => {
    playSound.click();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('✓ Link da página copiado para a área de transferência!');
    } else {
      alert(`Compartilhe este incrível jogo: ${game.title} - ${game.subtitle}`);
    }
  };

  const handleAddReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSound.click();
    if (!newReviewText.trim()) return;
    onAddReview(newReviewRating, newReviewText);
    setNewReviewText('');
    alert('✓ Sua análise técnica foi enviada com sucesso!');
  };

  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSound.click();
    if (!newCommentText.trim()) return;
    onAddComment(newCommentText);
    setNewCommentText('');
  };

  return (
    <div className="space-y-6">
      
      {/* Return button */}
      <button
        onClick={onBack}
        className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-all cursor-pointer group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Voltar para a Loja</span>
      </button>

      {/* Main Grid Banner area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Spotlight Trailer/Media Showcase */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
            {/* If we have a YouTube link or simple iframe, render it. Otherwise, simple gallery preview */}
            {game.trailerUrl ? (
              <iframe
                title={`${game.title} Official Trailer`}
                src={game.trailerUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <img
                src={game.images[activeImageIndex] || game.bannerUrl}
                alt={game.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
          </div>

          {/* Slide thumbnails */}
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {game.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => { playSound.click(); setActiveImageIndex(idx); }}
                className={`relative w-24 aspect-video rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer ${
                  activeImageIndex === idx ? 'border-emerald-500 scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>

        {/* Game Purchase Widgets & Meta Info */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-slate-100 tracking-tight">{game.title}</h2>
                <p className="text-xs text-emerald-400 font-mono mt-0.5">{game.genre}</p>
              </div>
              <span className="text-3xl leading-none">{game.iconUrl}</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {game.shortDescription}
            </p>

            <div className="border-t border-slate-800/80 pt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Desenvolvedor:</span>
                <span className="text-slate-300 font-bold">{game.devName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Distribuidora:</span>
                <span className="text-slate-300 font-semibold">{game.publisher}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Lançamento:</span>
                <span className="text-slate-400 font-mono">{game.releaseDate}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Classificação:</span>
                <span className="bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400 font-bold">
                  {game.ageRating}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3.5 border-t border-slate-800/80 pt-4">
            
            {/* Direct Pricing display */}
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500 font-mono">VALOR DO JOGO:</span>
              <div className="flex flex-col items-end">
                {game.discount > 0 && (
                  <span className="text-xs text-slate-500 line-through">R$ {game.price.toFixed(2)}</span>
                )}
                <span className="text-emerald-400 font-black text-lg">
                  {finalPrice === 0 ? 'GRATUITO' : `R$ ${finalPrice.toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Direct control actions */}
            <div className="flex gap-2">
              {owned ? (
                <div className="flex-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5">
                  ✓ Jogo na sua Biblioteca
                </div>
              ) : (
                <button
                  onClick={() => onAddToCart(game)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Adicionar ao Carrinho</span>
                </button>
              )}

              <button
                onClick={() => onAddToWishlist(game)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isWishlisted 
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Lista de desejos"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-3 rounded-xl border bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                title="Compartilhar"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs list: Description, Requirements, Comments, Changelog */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* Left column (tabs details) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2 border-b border-slate-800 pb-2">
            {[
              { id: 'desc', name: 'Sobre o Jogo' },
              { id: 'reqs', name: 'Requisitos de Sistema' },
              { id: 'comments', name: 'Mural de Comentários' },
              { id: 'news', name: 'Notas de Atualização' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { playSound.click(); setActiveTab(tab.id as any); }}
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700/80' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl text-xs leading-relaxed text-slate-300">
            {activeTab === 'desc' && (
              <div className="space-y-4 font-sans">
                <p className="text-sm font-semibold text-slate-200">{game.subtitle}</p>
                <p>{game.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-3">
                  {game.tags.map(t => (
                    <span key={t} className="bg-slate-950/80 border border-slate-800 px-2 py-1 rounded text-[10px] font-mono text-slate-400">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reqs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-[11px]">
                <div className="space-y-3 p-4 bg-slate-950 border border-slate-850 rounded-xl">
                  <h4 className="text-xs font-black text-rose-400 tracking-wider">REQUISITOS MÍNIMOS</h4>
                  <p><strong>OS:</strong> {game.requirementsMin.os}</p>
                  <p><strong>CPU:</strong> {game.requirementsMin.processor}</p>
                  <p><strong>RAM:</strong> {game.requirementsMin.memory}</p>
                  <p><strong>GPU:</strong> {game.requirementsMin.graphics}</p>
                  <p><strong>Espaço:</strong> {game.requirementsMin.storage}</p>
                </div>
                <div className="space-y-3 p-4 bg-slate-950 border border-slate-850 rounded-xl">
                  <h4 className="text-xs font-black text-emerald-400 tracking-wider">REQUISITOS RECOMENDADOS</h4>
                  <p><strong>OS:</strong> {game.requirementsRec.os}</p>
                  <p><strong>CPU:</strong> {game.requirementsRec.processor}</p>
                  <p><strong>RAM:</strong> {game.requirementsRec.memory}</p>
                  <p><strong>GPU:</strong> {game.requirementsRec.graphics}</p>
                  <p><strong>Espaço:</strong> {game.requirementsRec.storage}</p>
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                {/* Submit comment */}
                <form onSubmit={handleAddCommentSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escreva uma pergunta ou comentário de suporte..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-500 text-slate-100"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-500 text-slate-950 text-xs font-bold py-2 px-4 rounded-xl hover:bg-emerald-400 cursor-pointer"
                  >
                    Postar
                  </button>
                </form>

                {/* Comments List */}
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-slate-500 text-[11px] text-center py-6">Nenhum comentário registrado ainda. Faça a primeira pergunta!</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex gap-3">
                        <span className="text-xl">{c.userAvatar}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-200 text-xs">{c.username}</span>
                            <span className="text-[9px] text-slate-500">{c.date}</span>
                          </div>
                          <p className="text-slate-300 font-sans mt-1 text-[11px] leading-normal">{c.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'news' && (
              <div className="space-y-3 font-mono text-[11px]">
                <div className="flex justify-between border-b border-slate-850 pb-2 mb-2 items-center">
                  <span className="text-emerald-400 font-black text-xs">VERSÃO ATUAL: {game.version}</span>
                  <span className="text-slate-500 text-[10px]">Lançada em: {game.releaseDate}</span>
                </div>
                <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-2">
                  <span className="text-[10px] text-slate-400 font-black block">HISTÓRICO DE MUDANÇAS (CHANGELOG)</span>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{game.changelog}</p>
                </div>
              </div>
            )}
          </div>

          {/* User Reviews Module Section */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-black tracking-wider text-slate-100 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>AVALIAÇÕES E CRÍTICAS DE JOGADORES</span>
            </h3>

            {/* If player owns the game, they can submit a review */}
            {owned ? (
              <form onSubmit={handleAddReviewSubmit} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                <span className="text-[10px] font-black text-emerald-400 tracking-wider font-mono">AVALIAR ESTE TÍTULO</span>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => { playSound.click(); setNewReviewRating(star); }}
                        className="text-lg cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${newReviewRating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Classificação: {newReviewRating}/5 estrelas</span>
                </div>

                <div className="space-y-2">
                  <textarea
                    placeholder="Escreva uma crítica detalhada sobre sua jogabilidade, áudio e gráficos. Envie capturas de tela fictícias..."
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-500 font-mono">CAPTURA DE TELA: Simulada permanentemente via URL</span>
                    <button
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] py-1.5 px-3.5 rounded-lg transition-all cursor-pointer"
                    >
                      Publicar Análise
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl text-center text-[10px] text-slate-500 font-mono">
                Adquira este jogo para registrar uma avaliação técnica ou deixar sua nota na plataforma.
              </div>
            )}

            {/* List of reviews */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {reviews.length === 0 ? (
                <p className="text-center text-slate-500 py-6 text-[11px]">Nenhuma análise técnica publicada. Seja o primeiro!</p>
              ) : (
                reviews.map(rev => (
                  <div key={rev.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{rev.userAvatar}</span>
                        <div>
                          <span className="font-bold text-xs text-slate-200">{rev.username}</span>
                          <span className="block text-[9px] text-slate-500 font-mono">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${rev.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                        ))}
                      </div>
                    </div>

                    <p className="text-slate-300 font-sans text-xs leading-relaxed">{rev.reviewText}</p>

                    {rev.screenshots.length > 0 && (
                      <div className="flex gap-2 pt-1">
                        {rev.screenshots.map((s, idx) => (
                          <div key={idx} className="w-28 aspect-video rounded overflow-hidden border border-slate-800">
                            <img src={s} alt="screenshot" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Developer Official Response */}
                    {rev.devResponse && (
                      <div className="bg-emerald-950/15 border border-emerald-900/40 p-3 rounded-lg text-[10px] leading-relaxed text-slate-300 space-y-1">
                        <span className="font-black text-emerald-400 block font-mono">RESPOSTA DO DESENVOLVEDOR</span>
                        <p>{rev.devResponse}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: Developer widget & Related Games */}
        <div className="space-y-6">
          
          {/* Developer widget card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3.5">
            <h4 className="text-[10px] font-black tracking-wider text-slate-400 font-mono">SOBRE O ESTÚDIO</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xl flex items-center justify-center font-bold">
                🛠️
              </div>
              <div>
                <span className="text-slate-200 font-bold text-sm block">{game.devName}</span>
                <span className="text-[10px] text-slate-500 font-mono">Estúdio Independente</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Especialista em construir experiências interativas de alto polimento e diversão instantânea para consoles e PC.
            </p>
            <button
              onClick={() => { playSound.click(); alert(`Você agora está seguindo ${game.devName} para novidades!`); }}
              className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-slate-100 text-xs font-semibold py-2 rounded-xl transition-all cursor-pointer"
            >
              + Seguir Desenvolvedor
            </button>
          </div>

          {/* Related Games card stack */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h4 className="text-[10px] font-black tracking-wider text-slate-400 font-mono">TÍTULOS RELACIONADOS</h4>
            <div className="space-y-3">
              {relatedGames.length === 0 ? (
                <p className="text-[10px] text-slate-500 font-mono">Carregando mais títulos...</p>
              ) : (
                relatedGames.slice(0, 3).map(rel => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectGame(rel)}
                    className="flex gap-2.5 bg-slate-950 border border-slate-850 hover:border-emerald-500/30 p-2.5 rounded-xl cursor-pointer transition-all duration-300 group"
                  >
                    <span className="text-2xl h-10 w-10 shrink-0 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                      {rel.iconUrl}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-200 text-xs truncate block group-hover:text-emerald-400 transition-colors">
                        {rel.title}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">{rel.genre}</span>
                      <span className="text-[10px] text-emerald-400 block font-black font-mono mt-0.5">
                        {rel.price === 0 ? 'Gratuito' : `R$ ${rel.price.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
