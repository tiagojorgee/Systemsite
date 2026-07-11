import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, SlidersHorizontal, ShoppingCart, Tag, Filter, Check, ShoppingBag, 
  Trash2, CreditCard, ChevronRight, Download, Eye, Star, Sparkles, Award, ShieldAlert,
  Wallet, HelpCircle
} from 'lucide-react';
import { PublishedGame, ShoppingCartItem, DiscountCoupon } from '../../types/distribution';
import { playSound } from '../../utils/audio';

interface GameStoreProps {
  games: PublishedGame[];
  onSelectGame: (game: PublishedGame) => void;
  cart: ShoppingCartItem[];
  setCart: React.Dispatch<React.SetStateAction<ShoppingCartItem[]>>;
  realBalance: number;
  setRealBalance: React.Dispatch<React.SetStateAction<number>>;
  onTriggerToast: (msg: string) => void;
  onAddLog: (
    type: 'earn' | 'purchase_coins' | 'purchase_booster' | 'purchase_cosmetic' | 'stage_skip',
    desc: string,
    amount: number,
    currency: 'coins' | 'real'
  ) => void;
  onPurchaseComplete: (gameIds: string[], pricePaid: number) => void;
}

export const GameStore: React.FC<GameStoreProps> = ({
  games,
  onSelectGame,
  cart,
  setCart,
  realBalance,
  setRealBalance,
  onTriggerToast,
  onAddLog,
  onPurchaseComplete
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceTier, setPriceTier] = useState<string>('all'); // 'all' | 'free' | 'paid' | 'discounted'
  const [showCartModal, setShowCartModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  
  // Coupon and Payment fields
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<DiscountCoupon | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'mercadopago' | 'stripe' | 'paypal'>('pix');
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [invoiceId, setInvoiceId] = useState('');

  // Filtering list
  const genres = ['all', 'Ação', 'Aventura', 'RPG', 'Estratégia', 'Esporte', 'Simulação', 'Corrida', 'Indie'];
  const categories = [
    { id: 'all', name: 'Todos os Tipos' },
    { id: 'game', name: 'Jogos Completos' },
    { id: 'dlc', name: 'DLCs & Expansões' },
    { id: 'bundle', name: 'Pacotes Promocionais (Bundles)' }
  ];

  const filteredGames = games.filter(g => {
    if (g.status !== 'published') return false;
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          g.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesGenre = selectedGenre === 'all' || g.genre === selectedGenre;
    const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
    
    let matchesPrice = true;
    const finalPrice = g.price * (1 - (g.discount / 100));
    if (priceTier === 'free') matchesPrice = finalPrice === 0;
    else if (priceTier === 'paid') matchesPrice = finalPrice > 0;
    else if (priceTier === 'discounted') matchesPrice = g.discount > 0;

    return matchesSearch && matchesGenre && matchesCategory && matchesPrice;
  });

  const addToCart = (game: PublishedGame, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound.click();
    
    if (cart.some(item => item.game.id === game.id)) {
      onTriggerToast(`🛒 "${game.title}" já está no seu carrinho!`);
      return;
    }
    
    setCart(prev => [...prev, { game, quantity: 1 }]);
    onTriggerToast(`🛒 Adicionado ao carrinho: ${game.title}`);
  };

  const removeFromCart = (gameId: string) => {
    playSound.click();
    setCart(prev => prev.filter(item => item.game.id !== gameId));
    onTriggerToast('🛒 Item removido do carrinho.');
  };

  const calculateSubtotal = () => {
    return cart.reduce((acc, item) => {
      const price = item.game.price * (1 - (item.game.discount / 100));
      return acc + price;
    }, 0);
  };

  const applyCoupon = () => {
    playSound.click();
    const cleanCode = couponCode.trim().toUpperCase();
    if (cleanCode === 'GAMEZON56') {
      setActiveCoupon({ code: 'GAMEZON56', discountPercent: 20, isActive: true });
      onTriggerToast('🎉 Cupom GAMEZON56 aplicado! 20% de desconto adicional!');
    } else if (cleanCode === 'INDIEPOWER') {
      setActiveCoupon({ code: 'INDIEPOWER', discountPercent: 10, isActive: true });
      onTriggerToast('🎉 Cupom INDIEPOWER aplicado! 10% de desconto adicional!');
    } else {
      onTriggerToast('❌ Cupom inválido ou expirado.');
    }
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    if (activeCoupon) {
      return subtotal * (1 - (activeCoupon.discountPercent / 100));
    }
    return subtotal;
  };

  const handleCheckoutSubmit = () => {
    playSound.click();
    setCheckoutStatus('processing');
    
    // Create simulated transaction hash
    const generatedInvoice = 'INV-' + Math.floor(100000 + Math.random() * 900000);
    setInvoiceId(generatedInvoice);

    setTimeout(() => {
      const finalPrice = calculateTotal();
      
      // If balance is sufficient or paid through mock external systems (which we always succeed)
      if (paymentMethod === 'stripe' || paymentMethod === 'mercadopago' || paymentMethod === 'paypal' || realBalance >= finalPrice) {
        if (realBalance >= finalPrice && (paymentMethod === 'pix' || paymentMethod === 'paypal')) {
          setRealBalance(prev => prev - finalPrice);
        }
        
        // Log transaction
        onAddLog(
          'purchase_cosmetic',
          `Compra de Jogos na GameZon Store: ${cart.map(i => i.game.title).join(', ')}`,
          finalPrice,
          'real'
        );

        onPurchaseComplete(cart.map(i => i.game.id), finalPrice);
        setCheckoutStatus('success');
        setCart([]); // Clear cart
        setActiveCoupon(null);
        setCouponCode('');
        onTriggerToast('🚀 Compra aprovada! Os jogos já estão na sua Biblioteca.');
      } else {
        setCheckoutStatus('failed');
        onTriggerToast('❌ Saldo insuficiente na carteira para concluir com PIX. Use cartão de crédito/Stripe.');
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Quick Filters banner */}
      <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar jogos, DLCs, tags ou gêneros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto justify-end">
          <select
            value={priceTier}
            onChange={(e) => { playSound.click(); setPriceTier(e.target.value); }}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2 px-3 rounded-lg outline-none cursor-pointer focus:border-emerald-500"
          >
            <option value="all">Faixa de Preço (Todos)</option>
            <option value="free">Gratuito</option>
            <option value="paid">Jogos Pagos</option>
            <option value="discounted">Em Promoção</option>
          </select>

          <button
            onClick={() => { playSound.click(); setShowCartModal(true); }}
            className="relative bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Meu Carrinho</span>
            {cart.length > 0 && (
              <span className="bg-slate-950 text-emerald-400 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border border-emerald-500/20">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tabs list for categories */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => { playSound.click(); setSelectedCategory(c.id); }}
            className={`py-2 px-4 text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer ${
              selectedCategory === c.id 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Grid of Genre Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {genres.map(g => (
          <button
            key={g}
            onClick={() => { playSound.click(); setSelectedGenre(g); }}
            className={`px-3 py-1.5 text-xs font-mono rounded-full shrink-0 border transition-all cursor-pointer ${
              selectedGenre === g 
                ? 'bg-emerald-400 text-slate-950 border-emerald-400 font-bold' 
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {g === 'all' ? 'Todos Gêneros' : g}
          </button>
        ))}
      </div>

      {/* Store Items List */}
      {filteredGames.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl py-16 text-center">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">Nenhum título encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Refine seus termos de busca ou selecione outro gênero de jogo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map(game => {
            const hasDiscount = game.discount > 0;
            const finalPrice = game.price * (1 - (game.discount / 100));
            
            return (
              <div
                key={game.id}
                onClick={() => onSelectGame(game)}
                className="group bg-slate-900 border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.08)] flex flex-col h-full transform hover:-translate-y-1"
                id={`game-card-${game.id}`}
              >
                {/* Cover Banner Area */}
                <div className="relative h-44 bg-slate-950 overflow-hidden shrink-0">
                  <img
                    src={game.bannerUrl}
                    alt={game.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-90"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Overlay chips */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="bg-slate-950/90 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-800">
                      {game.category.toUpperCase()}
                    </span>
                    <span className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {game.genre}
                    </span>
                  </div>

                  {hasDiscount && (
                    <div className="absolute top-3 right-3 bg-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-md shadow-lg animate-pulse">
                      -{game.discount}% OFF
                    </div>
                  )}

                  {/* Rating Average */}
                  <div className="absolute bottom-3 left-3 bg-slate-950/90 text-amber-400 font-bold text-[10px] px-2 py-1 rounded-md border border-slate-800/80 flex items-center gap-1 backdrop-blur-sm">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{game.ratingAverage ? game.ratingAverage.toFixed(1) : 'NEW'}</span>
                  </div>
                </div>

                {/* Info Text */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-slate-100 font-bold text-sm tracking-tight leading-snug group-hover:text-emerald-400 transition-colors">
                          {game.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Por {game.devName}</p>
                      </div>
                      <span className="text-xl shrink-0 leading-none">{game.iconUrl}</span>
                    </div>

                    <p className="text-xs text-slate-400 font-sans line-clamp-2 leading-relaxed">
                      {game.shortDescription}
                    </p>

                    {/* Platform icons */}
                    <div className="flex gap-2 items-center text-slate-500">
                      {game.platform.map(p => (
                        <span key={p} className="text-[10px] bg-slate-950/80 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom pricing area */}
                  <div className="border-t border-slate-800/60 pt-3.5 mt-4 flex items-center justify-between">
                    <div className="flex flex-col">
                      {hasDiscount && (
                        <span className="text-[10px] text-slate-500 line-through">
                          R$ {game.price.toFixed(2)}
                        </span>
                      )}
                      <span className="text-emerald-400 font-black text-sm">
                        {finalPrice === 0 ? 'GRATUITO' : `R$ ${finalPrice.toFixed(2)}`}
                      </span>
                    </div>

                    <button
                      onClick={(e) => addToCart(game, e)}
                      className="bg-slate-950 hover:bg-emerald-500 border border-slate-800 hover:border-emerald-500 text-slate-300 hover:text-slate-950 font-black text-xs py-2 px-3 rounded-xl transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals 1: Shopping Cart */}
      <AnimatePresence>
        {showCartModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setShowCartModal(false)}
            />

            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl z-10 overflow-hidden"
            >
              <h3 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <span>Meu Carrinho de Compras</span>
              </h3>

              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto" />
                  <p className="text-xs">Seu carrinho está vazio.</p>
                  <button
                    onClick={() => setShowCartModal(false)}
                    className="text-xs text-emerald-400 hover:underline cursor-pointer"
                  >
                    Voltar para a Loja
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {cart.map(item => {
                    const price = item.game.price * (1 - (item.game.discount / 100));
                    return (
                      <div key={item.game.id} className="flex items-center gap-3 bg-slate-950 border border-slate-800/60 p-3 rounded-xl justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{item.game.iconUrl}</span>
                          <div>
                            <h5 className="text-xs font-bold text-slate-200">{item.game.title}</h5>
                            <span className="text-[10px] text-slate-400 font-mono">{item.game.genre}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-emerald-400 font-bold">
                            {price === 0 ? 'Gratuito' : `R$ ${price.toFixed(2)}`}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.game.id)}
                            className="text-slate-500 hover:text-rose-500 cursor-pointer p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="border-t border-slate-800 pt-3 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Subtotal</span>
                      <span>R$ {calculateSubtotal().toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="CUPOM (GAMEZON56 ou INDIEPOWER)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={applyCoupon}
                        className="bg-emerald-500 text-slate-950 text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-emerald-400 cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>

                    {activeCoupon && (
                      <div className="bg-emerald-950/40 border border-emerald-800/50 p-2 rounded-lg flex justify-between text-emerald-400 text-xs">
                        <span>Cupom Ativo: <strong>{activeCoupon.code}</strong></span>
                        <span>-{activeCoupon.discountPercent}%</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-slate-100 border-t border-slate-800 pt-3">
                      <span className="font-bold text-sm">Total Estimado</span>
                      <span className="text-emerald-400 font-black text-base">R$ {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => setShowCartModal(false)}
                      className="flex-1 border border-slate-800 text-slate-400 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
                    >
                      Continuar Comprando
                    </button>
                    <button
                      onClick={() => {
                        playSound.click();
                        setShowCartModal(false);
                        setShowCheckoutModal(true);
                      }}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black py-2.5 rounded-xl shadow-lg cursor-pointer"
                    >
                      Ir para o Pagamento
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals 2: Checkout / Receipts */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => { if (checkoutStatus !== 'processing') setShowCheckoutModal(false); }}
            />

            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl z-10 overflow-hidden"
            >
              <h3 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>Processar Transação Segura</span>
              </h3>

              {checkoutStatus === 'idle' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                    <span className="text-[10px] text-slate-500 font-mono">RESUMO DO PEDIDO</span>
                    <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
                      {cart.map(i => (
                        <div key={i.game.id} className="flex justify-between text-xs text-slate-300">
                          <span className="truncate max-w-[200px]">{i.game.title}</span>
                          <span>R$ {(i.game.price * (1 - (i.game.discount/100))).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {activeCoupon && (
                      <div className="text-[11px] text-emerald-400 flex justify-between border-t border-slate-850 pt-1.5">
                        <span>Desconto adicional ({activeCoupon.code})</span>
                        <span>-R$ {(calculateSubtotal() - calculateTotal()).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-850 pt-1.5 flex justify-between text-xs font-bold text-slate-100">
                      <span>Total Geral</span>
                      <span className="text-emerald-400">R$ {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 font-mono">SELECIONE O MEIO DE PAGAMENTO</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'pix', name: 'PIX Carteira' },
                        { id: 'stripe', name: 'Cartão (Stripe)' },
                        { id: 'mercadopago', name: 'Mercado Pago' },
                        { id: 'paypal', name: 'PayPal API' }
                      ].map(method => (
                        <button
                          key={method.id}
                          onClick={() => { playSound.click(); setPaymentMethod(method.id as any); }}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex flex-col justify-between cursor-pointer ${
                            paymentMethod === method.id 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                              : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <span>{method.name}</span>
                          {method.id === 'pix' && <span className="text-[9px] text-slate-500 font-mono">Disponível: R$ {realBalance.toFixed(2)}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800/50 p-3 rounded-xl text-[10px] text-slate-400 flex gap-2 items-center leading-relaxed">
                    <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Seu pagamento está criptografado ponta-a-ponta com SSL de nível militar. Todos os reembolsos são elegíveis em até 7 dias úteis.</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowCheckoutModal(false)}
                      className="flex-1 border border-slate-800 text-slate-400 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleCheckoutSubmit}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black py-2.5 rounded-xl shadow-lg cursor-pointer"
                    >
                      Pagar R$ {calculateTotal().toFixed(2)}
                    </button>
                  </div>
                </div>
              )}

              {checkoutStatus === 'processing' && (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-300 font-mono">Autorizando pagamento junto ao gateway {paymentMethod.toUpperCase()}...</p>
                  <p className="text-[10px] text-slate-500 font-mono">Aguardando confirmação segura do banco emissor...</p>
                </div>
              )}

              {checkoutStatus === 'success' && (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-xl">
                    ✓
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">Transação Autorizada com Sucesso!</h4>
                  
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-left font-mono space-y-1.5 text-[10px] text-slate-300 leading-relaxed">
                    <div className="flex justify-between border-b border-slate-900 pb-1.5 mb-1.5">
                      <span className="text-emerald-400 font-bold">COMPROVANTE FISCAL</span>
                      <span className="text-slate-500">#{invoiceId}</span>
                    </div>
                    <p><strong>Gateway:</strong> {paymentMethod.toUpperCase()}</p>
                    <p><strong>Data/Hora:</strong> {new Date().toLocaleString()}</p>
                    <p><strong>Status:</strong> CONFIRMADO / LIQUIDADO</p>
                    <p><strong>Comissão (10%):</strong> R$ {(calculateTotal() * 0.1).toFixed(2)}</p>
                    <p className="border-t border-slate-900 pt-1.5 mt-1.5 text-xs text-emerald-400 flex justify-between">
                      <strong>Pago total:</strong>
                      <strong>R$ {calculateTotal().toFixed(2)}</strong>
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-[10px] text-emerald-400 leading-normal flex gap-1.5 justify-center items-center">
                    <Download className="w-3.5 h-3.5" />
                    <span>Pronto para downloads permanentes! Acesse sua biblioteca.</span>
                  </div>

                  <button
                    onClick={() => {
                      playSound.click();
                      setShowCheckoutModal(false);
                      setCheckoutStatus('idle');
                    }}
                    className="w-full bg-emerald-500 text-slate-950 text-xs font-black py-2.5 rounded-xl cursor-pointer"
                  >
                    Fechar Comprovante
                  </button>
                </div>
              )}

              {checkoutStatus === 'failed' && (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full flex items-center justify-center mx-auto text-xl">
                    ✕
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">Transação Negada</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">Não foi possível debitar R$ {calculateTotal().toFixed(2)} do seu saldo de carteira.</p>
                  
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-left text-[10px] text-rose-400 flex gap-2 items-center leading-normal">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span>Erro 402: Fundos insuficientes. Se você estiver sem saldo in-game, favor selecionar Cartão / Stripe ou recarregar saldo no Portal Financeiro.</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setCheckoutStatus('idle')}
                      className="flex-1 border border-slate-800 text-slate-300 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-850 cursor-pointer"
                    >
                      Mudar Forma
                    </button>
                    <button
                      onClick={() => { setShowCheckoutModal(false); setCheckoutStatus('idle'); }}
                      className="flex-1 bg-slate-950 text-slate-400 text-xs font-bold py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
