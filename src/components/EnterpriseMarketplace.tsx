import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, 
  ShoppingBag, 
  Compass, 
  Search, 
  SlidersHorizontal, 
  PlusCircle, 
  Heart, 
  Info, 
  Star, 
  MessageSquare, 
  Truck, 
  CreditCard, 
  ChevronRight, 
  Settings, 
  Package, 
  CheckCircle, 
  ExternalLink,
  Trash2,
  TrendingUp,
  Sliders,
  Play,
  FileText,
  Clock,
  ShieldCheck,
  Award,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface EnterpriseMarketplaceProps {
  stats: any;
  updateStats: (updater: (prev: any) => any) => void;
  addLog: (type: any, desc: string, amount: number, currency: 'coins' | 'real') => void;
  loggedInUser?: any;
  onOpenLogin?: () => void;
  realBalance: number;
  setRealBalance: React.Dispatch<React.SetStateAction<number>>;
}

export const EnterpriseMarketplace: React.FC<EnterpriseMarketplaceProps> = ({
  stats,
  updateStats,
  addLog,
  loggedInUser,
  onOpenLogin,
  realBalance,
  setRealBalance
}) => {
  const currentUserId = loggedInUser?.id || 'user-default';
  const currentUserName = loggedInUser?.name || 'GamerAnônimo';

  // Navigation Subtabs
  const [activeTab, setActiveTab] = useState<'explore' | 'products' | 'manage' | 'orders'>('products');

  // Loading and Error States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Core Entity States
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [myStore, setMyStore] = useState<any | null>(null);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);

  // Selection Details
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);

  // Search and Advanced Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedType, setSelectedType] = useState('todos'); // physical, digital, service, subscription
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Checkout State
  const [checkoutProduct, setCheckoutProduct] = useState<any | null>(null);
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);
  const [checkoutVariation, setCheckoutVariation] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [payMethod, setPayMethod] = useState<'real' | 'coins'>('real');

  // Interactive Reviews Form
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');

  // Interactive Questions Form
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newAnswerText, setNewAnswerText] = useState<{ [qId: string]: string }>({});

  // Virtual Store Creation / Customizer Form
  const [regStoreName, setRegStoreName] = useState('');
  const [regStoreUrl, setRegStoreUrl] = useState('');
  const [regStoreLogo, setRegStoreLogo] = useState('');
  const [regStoreBanner, setRegStoreBanner] = useState('');
  const [regStoreTheme, setRegStoreTheme] = useState('default');
  const [regStoreDesc, setRegStoreDesc] = useState('');
  const [regStoreCategories, setRegStoreCategories] = useState<string[]>([]);

  // Product Creation Form
  const [prodTitle, setProdTitle] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodCategory, setProdCategory] = useState('perifericos');
  const [prodType, setProdType] = useState('physical'); // physical, digital, service, subscription
  const [prodStock, setProdStock] = useState('10');
  const [prodSku, setProdSku] = useState('');
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [prodNewImage, setProdNewImage] = useState('');
  const [prodVideoUrl, setProdVideoUrl] = useState('');
  const [prodDigitalFile, setProdDigitalFile] = useState('');
  const [prodSubBilling, setProdSubBilling] = useState('mensal'); // mensal, anual
  const [prodSubPerks, setProdSubPerks] = useState('');
  const [prodVariations, setProdVariations] = useState(''); // comma-separated

  // Load Data
  const loadStores = async () => {
    try {
      const r = await fetch('/api/marketplace/enterprise/stores');
      const d = await r.json();
      if (d.success) setStores(d.stores);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = async () => {
    try {
      const r = await fetch('/api/marketplace/enterprise/products');
      const d = await r.json();
      if (d.success) setProducts(d.products);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMyStore = async () => {
    try {
      const r = await fetch(`/api/marketplace/enterprise/seller/store?sellerId=${currentUserId}`);
      const d = await r.json();
      if (d.success) {
        setMyStore(d.store);
        if (d.store) {
          // Pre-fill edit form
          setRegStoreName(d.store.store_name);
          setRegStoreUrl(d.store.custom_url);
          setRegStoreLogo(d.store.logo_url);
          setRegStoreBanner(d.store.banner_url);
          setRegStoreTheme(d.store.theme);
          setRegStoreDesc(d.store.description);
          try {
            setRegStoreCategories(JSON.parse(d.store.categories || '[]'));
          } catch (_) {
            setRegStoreCategories([]);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMyOrders = async () => {
    try {
      const r = await fetch(`/api/marketplace/enterprise/orders?userId=${currentUserId}`);
      const d = await r.json();
      if (d.success) setMyOrders(d.orders);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCustomerOrders = async () => {
    try {
      const r = await fetch(`/api/marketplace/enterprise/orders?userId=${currentUserId}&isSeller=true`);
      const d = await r.json();
      if (d.success) setCustomerOrders(d.orders);
    } catch (err) {
      console.error(err);
    }
  };

  const loadWishlist = async () => {
    try {
      const r = await fetch(`/api/marketplace/enterprise/wishlist?userId=${currentUserId}`);
      const d = await r.json();
      if (d.success) setWishlist(d.wishlist);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshAllData = () => {
    loadStores();
    loadProducts();
    loadMyStore();
    loadMyOrders();
    loadCustomerOrders();
    loadWishlist();
  };

  useEffect(() => {
    refreshAllData();
  }, [currentUserId]);

  // Open Store Page
  const viewStore = async (store: any) => {
    setSelectedStore(store);
    setSelectedProduct(null);
    playSound.click();
  };

  // Open Product Details Page (and load reviews + questions)
  const viewProduct = async (product: any) => {
    setSelectedProduct(product);
    playSound.click();
    try {
      const [revRes, qstRes] = await Promise.all([
        fetch(`/api/marketplace/enterprise/products/${product.id}/reviews`),
        fetch(`/api/marketplace/enterprise/products/${product.id}/questions`)
      ]);
      const revData = await revRes.json();
      const qstData = await qstRes.json();
      if (revData.success) setReviews(revData.reviews);
      if (qstData.success) setQuestions(qstData.questions);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Store Registration or Update
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regStoreName.trim() || !regStoreUrl.trim()) {
      setErrorMsg('Por favor, preencha o nome e a URL personalizada da loja.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    playSound.click();

    const payload = {
      seller_id: currentUserId,
      store_name: regStoreName,
      custom_url: regStoreUrl.toLowerCase().replace(/[^a-z0-9-_]/g, ''),
      logo_url: regStoreLogo || 'https://images.unsplash.com/photo-1472851294608-062f824d296e?auto=format&fit=crop&q=80&w=150',
      banner_url: regStoreBanner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
      theme: regStoreTheme,
      description: regStoreDesc,
      categories: regStoreCategories
    };

    try {
      const url = myStore ? `/api/marketplace/enterprise/stores/${myStore.id}` : '/api/marketplace/enterprise/stores';
      const method = myStore ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      if (d.success) {
        setSuccessMsg(myStore ? 'Sua loja virtual foi atualizada!' : 'Parabéns! Sua loja virtual foi criada com sucesso!');
        playSound.purchase();
        refreshAllData();
      } else {
        setErrorMsg(d.error || 'Erro ao salvar loja virtual.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão ao salvar loja.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Product Creation
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myStore) return;
    if (!prodTitle.trim() || !prodPrice.trim()) {
      setErrorMsg('Por favor, preencha o título e o preço do produto.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    playSound.click();

    const payload = {
      marketplace_id: myStore.id,
      seller_id: currentUserId,
      title: prodTitle,
      price: parseFloat(prodPrice),
      description: prodDescription,
      category: prodCategory,
      type: prodType,
      stock: prodType === 'physical' ? parseInt(prodStock) : 9999,
      sku: prodSku || `SKU-${Date.now().toString().slice(-6)}`,
      images: prodImages.length ? prodImages : ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400'],
      video_url: prodVideoUrl,
      digital_file_url: prodDigitalFile,
      subscription_plan: {
        billing: prodSubBilling,
        perks: prodSubPerks.split('\n').filter(p => p.trim())
      },
      variations: prodVariations.split(',').map(v => v.trim()).filter(v => v)
    };

    try {
      const r = await fetch('/api/marketplace/enterprise/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      if (d.success) {
        setSuccessMsg('Produto cadastrado com sucesso na sua loja!');
        playSound.purchase();
        // Reset product form
        setProdTitle('');
        setProdPrice('');
        setProdDescription('');
        setProdStock('10');
        setProdSku('');
        setProdImages([]);
        setProdVideoUrl('');
        setProdDigitalFile('');
        setProdVariations('');
        setProdSubPerks('');
        refreshAllData();
      } else {
        setErrorMsg(d.error || 'Erro ao cadastrar produto.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão ao cadastrar produto.');
    } finally {
      setLoading(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (prodId: string) => {
    if (!window.confirm('Tem certeza de que deseja remover este produto?')) return;
    playSound.click();
    try {
      const r = await fetch(`/api/marketplace/enterprise/products/${prodId}?sellerId=${currentUserId}`, {
        method: 'DELETE'
      });
      const d = await r.json();
      if (d.success) {
        setSuccessMsg('Produto removido com sucesso!');
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    playSound.click();
    try {
      const r = await fetch(`/api/marketplace/enterprise/products/${selectedProduct.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUserId,
          rating: newReviewRating,
          comment: newReviewComment
        })
      });
      const d = await r.json();
      if (d.success) {
        setNewReviewComment('');
        // Reload reviews
        const res = await fetch(`/api/marketplace/enterprise/products/${selectedProduct.id}/reviews`);
        const data = await res.json();
        if (data.success) setReviews(data.reviews);
        playSound.purchase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Question
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !newQuestionText.trim()) return;
    playSound.click();
    try {
      const r = await fetch(`/api/marketplace/enterprise/products/${selectedProduct.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUserId,
          question: newQuestionText
        })
      });
      const d = await r.json();
      if (d.success) {
        setNewQuestionText('');
        // Reload questions
        const res = await fetch(`/api/marketplace/enterprise/products/${selectedProduct.id}/questions`);
        const data = await res.json();
        if (data.success) setQuestions(data.questions);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Answer Question (Seller)
  const handleAnswerQuestion = async (qstId: string) => {
    const answerText = newAnswerText[qstId];
    if (!answerText || !answerText.trim()) return;
    playSound.click();
    try {
      const r = await fetch(`/api/marketplace/enterprise/questions/${qstId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: answerText,
          seller_id: currentUserId
        })
      });
      const d = await r.json();
      if (d.success) {
        setNewAnswerText(prev => ({ ...prev, [qstId]: '' }));
        // Reload questions
        if (selectedProduct) {
          const res = await fetch(`/api/marketplace/enterprise/products/${selectedProduct.id}/questions`);
          const data = await res.json();
          if (data.success) setQuestions(data.questions);
        } else {
          // If in manage store panel, reload everything
          refreshAllData();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Wishlist Toggle
  const toggleWishlist = async (prod: any) => {
    playSound.click();
    const isFav = wishlist.some(w => w.id === prod.id || w.title === prod.title);
    try {
      if (isFav) {
        const r = await fetch(`/api/marketplace/enterprise/wishlist/${prod.id}?userId=${currentUserId}`, {
          method: 'DELETE'
        });
        const d = await r.json();
        if (d.success) loadWishlist();
      } else {
        const r = await fetch('/api/marketplace/enterprise/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: currentUserId,
            product_id: prod.id
          })
        });
        const d = await r.json();
        if (d.success) loadWishlist();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Checkout Purchase Submission
  const handleConfirmCheckout = async () => {
    if (!checkoutProduct) return;
    if (checkoutProduct.type === 'physical' && checkoutProduct.stock < checkoutQuantity) {
      alert('Quantidade solicitada excede o estoque disponível!');
      return;
    }
    if (checkoutProduct.type === 'physical' && !shippingAddress.trim()) {
      alert('O endereço de entrega é obrigatório para produtos físicos!');
      return;
    }

    setLoading(true);
    playSound.click();

    try {
      const r = await fetch('/api/marketplace/enterprise/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_id: currentUserId,
          product_id: checkoutProduct.id,
          quantity: checkoutQuantity,
          shipping_address: checkoutProduct.type === 'physical' ? shippingAddress : 'Entrega Digital Imediata',
          variation_selected: checkoutVariation,
          payMethod
        })
      });
      const d = await r.json();
      if (d.success) {
        playSound.jackpot();
        alert('Pedido realizado com sucesso! Verifique a aba "Meus Pedidos" para acompanhar a entrega.');
        setCheckoutProduct(null);
        setShippingAddress('');
        setCheckoutQuantity(1);
        setCheckoutVariation('');
        refreshAllData();
        // If product was selected, update stock locally
        if (selectedProduct && selectedProduct.id === checkoutProduct.id) {
          setSelectedProduct(prev => ({ ...prev, stock: Math.max(0, prev.stock - checkoutQuantity) }));
        }
      } else {
        alert(d.error || 'Erro ao processar o pagamento.');
      }
    } catch (err) {
      alert('Erro ao se conectar ao servidor de faturamento.');
    } finally {
      setLoading(false);
    }
  };

  // Seller updates Order status
  const handleUpdateOrderStatus = async (orderId: string, status: string, trackingCode?: string) => {
    playSound.click();
    try {
      const r = await fetch(`/api/marketplace/enterprise/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, shipping_tracking_code: trackingCode })
      });
      const d = await r.json();
      if (d.success) {
        alert('Status do pedido atualizado com sucesso!');
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Advanced Smart Search & Filter logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.store_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'todos' || p.category === selectedCategory;
    const matchesType = selectedType === 'todos' || p.type === selectedType;
    const priceNum = p.price;
    const matchesMinPrice = !minPrice || priceNum >= parseFloat(minPrice);
    const matchesMaxPrice = !maxPrice || priceNum <= parseFloat(maxPrice);
    return matchesSearch && matchesCategory && matchesType && matchesMinPrice && matchesMaxPrice;
  });

  // Get store theme classes
  const getThemeClasses = (themeName: string) => {
    switch (themeName) {
      case 'dark':
        return 'bg-slate-950 text-white border-slate-800';
      case 'amber':
        return 'bg-amber-950 text-amber-50 border-amber-800';
      case 'emerald':
        return 'bg-emerald-950 text-emerald-50 border-emerald-800';
      case 'cyber':
        return 'bg-purple-950 text-cyan-200 border-purple-900';
      default:
        return 'bg-white text-slate-900 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Enterprise Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4 border-slate-200">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <Store className="text-indigo-600 w-6 h-6" />
            Marketplace de Lojas Virtuais
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Qualquer usuário pode cadastrar uma loja exclusiva e começar a vender produtos físicos, downloads ou assinaturas gamer.
          </p>
        </div>

        {/* Local subtabs switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 font-mono text-xs font-bold">
          <button
            onClick={() => { playSound.click(); setActiveTab('products'); setSelectedProduct(null); setSelectedStore(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'products' ? 'bg-slate-950 text-white' : 'text-slate-600'}`}
          >
            🛒 Produtos
          </button>
          <button
            onClick={() => { playSound.click(); setActiveTab('explore'); setSelectedProduct(null); setSelectedStore(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'explore' ? 'bg-slate-950 text-white' : 'text-slate-600'}`}
          >
            🏪 Explorar Lojas
          </button>
          <button
            onClick={() => { playSound.click(); setActiveTab('manage'); setSelectedProduct(null); setSelectedStore(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'manage' ? 'bg-slate-950 text-white' : 'text-slate-600'}`}
          >
            ⚙️ Gerenciar Loja
          </button>
          <button
            onClick={() => { playSound.click(); setActiveTab('orders'); setSelectedProduct(null); setSelectedStore(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'orders' ? 'bg-slate-950 text-white' : 'text-slate-600'}`}
          >
            📦 Pedidos &amp; Desejos
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* RENDER PRODUCTS CATALOG (MAIN TAB) */}
      {activeTab === 'products' && !selectedProduct && !selectedStore && (
        <div className="space-y-6">
          {/* SEARCH BAR & FILTERS TOOLBAR */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Pesquisar por produtos, lojas, categorias ou especificações..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={() => { playSound.click(); setShowFilters(!showFilters); }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros {showFilters ? 'Ativos' : 'Avançados'}
              </button>
            </div>

            {/* EXPANDABLE FILTERS */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-slate-200/60 text-xs"
              >
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Categoria</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 bg-white border rounded-xl"
                  >
                    <option value="todos">Todas as Categorias</option>
                    <option value="perifericos">Periféricos</option>
                    <option value="hardwares">Hardware</option>
                    <option value="consoles">Consoles &amp; Jogos</option>
                    <option value="cadeiras">Móveis &amp; Conforto</option>
                    <option value="servicos">Serviços Profissionais</option>
                    <option value="assinaturas">Assinaturas VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tipo de Comercialização</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full p-2 bg-white border rounded-xl"
                  >
                    <option value="todos">Qualquer Tipo</option>
                    <option value="physical">📦 Produto Físico (Envio)</option>
                    <option value="digital">⚡ Download Digital (Imediato)</option>
                    <option value="service">🛠️ Serviço Digital</option>
                    <option value="subscription">📅 Assinatura Periódica</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Preço Mínimo (R$)</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full p-2 bg-white border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Preço Máximo (R$)</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full p-2 bg-white border rounded-xl"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* PRODUCTS GRID */}
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 border rounded-2xl border-slate-200">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-bold">Nenhum produto cadastrado no marketplace no momento.</p>
              <p className="text-xs text-slate-400 mt-1">Crie sua própria loja virtual na aba "Gerenciar Loja" para ser o pioneiro!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {filteredProducts.map((prod) => {
                let imagesList = [];
                try {
                  imagesList = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
                } catch (_) {
                  imagesList = [prod.images];
                }
                const firstImg = imagesList[0] || 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400';
                const isFav = wishlist.some(w => w.id === prod.id);

                return (
                  <motion.div
                    key={prod.id}
                    layoutId={`ent-prod-${prod.id}`}
                    onClick={() => viewProduct(prod)}
                    className="bg-white border border-slate-200/80 hover:border-indigo-400 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer group text-left relative"
                  >
                    {/* Badge type */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-950/80 text-yellow-400 border border-slate-800 uppercase tracking-wider">
                        {prod.type === 'physical' && '📦 Físico'}
                        {prod.type === 'digital' && '⚡ Digital'}
                        {prod.type === 'service' && '🛠️ Serviço'}
                        {prod.type === 'subscription' && '📅 Clube'}
                      </span>
                    </div>

                    {/* Wishlist Icon */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(prod); }}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-slate-400 hover:text-red-500 hover:scale-110 transition-all border shadow"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>

                    {/* Image */}
                    <div className="aspect-video w-full overflow-hidden bg-slate-100 relative">
                      <img
                        src={firstImg}
                        alt={prod.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        {/* Store Reference */}
                        <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider">
                          <Store className="w-3 h-3" />
                          <span>{prod.store_name}</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 line-clamp-1 mt-0.5 tracking-tight group-hover:text-indigo-600">
                          {prod.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mt-1">
                          {prod.description}
                        </p>
                      </div>

                      <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">PREÇO</span>
                          <span className="text-sm font-extrabold text-slate-950 font-mono">
                            R$ {Number(prod.price).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Estoque</span>
                          <span className={`text-[10px] font-bold ${prod.stock > 0 ? 'text-slate-600' : 'text-red-500'}`}>
                            {prod.stock > 0 ? `${prod.stock} un` : 'Esgotado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EXPLORE STORES TAB */}
      {activeTab === 'explore' && !selectedStore && !selectedProduct && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-900 to-slate-950 rounded-2xl p-6 border border-slate-800 text-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 max-w-xl">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-500 text-white uppercase tracking-widest font-mono">PARCEIROS VIRTUAIS</span>
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight">Consórcio de Lojas Oficiais SystemSite</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Navegue pelas lojas personalizadas por criadores parceiros. Cada loja possui layout exclusivo, catálogo unificado, reputação com base em avaliações e suporte integrado via chat.
              </p>
            </div>
            <button
              onClick={() => { playSound.click(); setActiveTab('manage'); }}
              className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Criar Minha Loja 🏪
            </button>
          </div>

          {stores.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 border rounded-2xl border-slate-200">
              <Store className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-bold">Nenhuma loja virtual cadastrada no momento.</p>
              <p className="text-xs text-slate-400 mt-1">Sabe programar, revender hardware ou possui chaves digitais? Cadastre sua loja!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stores.map((st) => {
                let cats = [];
                try {
                  cats = JSON.parse(st.categories || '[]');
                } catch (_) {}

                return (
                  <motion.div
                    key={st.id}
                    onClick={() => viewStore(st)}
                    className="bg-white border border-slate-200/80 hover:border-indigo-400 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer group text-left"
                  >
                    {/* Banner Image */}
                    <div className="h-20 bg-slate-100 overflow-hidden relative">
                      <img
                        src={st.banner_url}
                        alt={st.store_name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-102 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-slate-950/20" />
                    </div>

                    {/* Logo and store title */}
                    <div className="px-4 pb-4 relative flex-1 flex flex-col justify-between">
                      <div className="relative">
                        {/* Logo offset */}
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow bg-white absolute -top-6 left-2">
                          <img
                            src={st.logo_url}
                            alt="Logo"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="pt-8 pl-1">
                          <h4 className="text-sm font-black text-slate-950 tracking-tight group-hover:text-indigo-600 line-clamp-1">
                            {st.store_name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            /{st.custom_url}
                          </span>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                            {st.description}
                          </p>
                        </div>
                      </div>

                      {/* Footer store card stats */}
                      <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[11px] font-bold">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          <span>{st.reputation || '5.0'}</span>
                        </div>
                        {cats.length > 0 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] uppercase tracking-wider">
                            {cats[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SINGLE PRODUCT DETAILS VIEW */}
      {selectedProduct && (
        <motion.div
          layoutId={`ent-prod-${selectedProduct.id}`}
          className="bg-white border rounded-3xl p-4 md:p-6 shadow-md grid grid-cols-1 md:grid-cols-12 gap-8 text-left"
        >
          {/* Back button */}
          <div className="col-span-12">
            <button
              onClick={() => setSelectedProduct(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-lg"
            >
              ← Voltar aos Produtos
            </button>
          </div>

          {/* Left Column: Product Images / Carousel */}
          <div className="col-span-12 md:col-span-6 space-y-4">
            {(() => {
              let imgs = [];
              try {
                imgs = typeof selectedProduct.images === 'string' ? JSON.parse(selectedProduct.images) : selectedProduct.images;
              } catch (_) {
                imgs = [selectedProduct.images];
              }
              const firstImg = imgs[0] || 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400';
              return (
                <div className="space-y-3">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200/60 bg-slate-50">
                    <img
                      src={firstImg}
                      alt={selectedProduct.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {imgs.length > 1 && (
                    <div className="flex gap-2.5 overflow-x-auto pb-1">
                      {imgs.map((im: string, idx: number) => (
                        <div key={idx} className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200/80 shrink-0">
                          <img src={im} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Video Preview section */}
            {selectedProduct.video_url && (
              <div className="p-4 bg-slate-950 text-white rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block font-mono">🎥 Vídeo demonstrativo</span>
                <p className="text-xs text-slate-300">Este vendedor incluiu uma demonstração audiovisual para este produto.</p>
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-yellow-400" />
                  <a
                    href={selectedProduct.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:underline font-bold"
                  >
                    Ver Demonstração de Produto externa ↗
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Title, Purchase controls */}
          <div className="col-span-12 md:col-span-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 uppercase tracking-wider">
                  {selectedProduct.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">SKU: {selectedProduct.sku}</span>
              </div>

              <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {selectedProduct.title}
              </h3>

              {/* Vendor line */}
              <div
                onClick={() => {
                  const s = stores.find(st => st.id === selectedProduct.marketplace_id);
                  if (s) viewStore(s);
                }}
                className="inline-flex items-center gap-1.5 p-1 px-2.5 bg-slate-50 border hover:border-indigo-200 rounded-full text-xs font-bold text-slate-600 cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-indigo-600" />
                Vendido e entregue por: <strong className="text-indigo-600">{selectedProduct.store_name}</strong>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-2">
                {selectedProduct.description}
              </p>
            </div>

            {/* Price and buying widget */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-3xl space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">PREÇO À VISTA</span>
                  <span className="text-2xl font-black text-slate-950 font-mono">
                    R$ {Number(selectedProduct.price).toFixed(2)}
                  </span>
                </div>
                {selectedProduct.stock > 0 ? (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black font-mono">
                    ✓ EM ESTOQUE
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-black font-mono">
                    ⚠ ESGOTADO
                  </span>
                )}
              </div>

              {/* Variations selector if applicable */}
              {(() => {
                let vars = [];
                try {
                  vars = typeof selectedProduct.variations === 'string' ? JSON.parse(selectedProduct.variations || '[]') : selectedProduct.variations;
                } catch (_) {
                  vars = selectedProduct.variations ? selectedProduct.variations.split(',').filter((v: any) => v) : [];
                }
                if (vars.length > 0) {
                  return (
                    <div className="space-y-1.5 text-xs">
                      <label className="block font-bold text-slate-600">Selecione uma Variação / Opção:</label>
                      <div className="flex gap-2 flex-wrap">
                        {vars.map((v: string) => (
                          <button
                            key={v}
                            onClick={() => { playSound.click(); setCheckoutVariation(v); }}
                            className={`px-3 py-1 rounded-xl font-bold transition-all ${checkoutVariation === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border text-slate-600'}`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Action buttons */}
              {selectedProduct.stock > 0 ? (
                <button
                  onClick={() => { playSound.click(); setCheckoutProduct(selectedProduct); }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 cursor-pointer transition-all"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Ir para o Checkout Seguro 🔒
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3 bg-slate-200 text-slate-400 font-bold text-sm rounded-2xl cursor-not-allowed"
                >
                  Esgotado temporariamente
                </button>
              )}
            </div>
          </div>

          {/* QUESTIONS & REVIEWS COLLAPSIBLE BOXES */}
          <div className="col-span-12 border-t pt-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
            {/* Customer reviews */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                <Star className="text-yellow-500 fill-yellow-500 w-4 h-4" />
                Avaliações dos Consumidores ({reviews.length})
              </h4>

              {/* Add review form */}
              <form onSubmit={handleSubmitReview} className="bg-slate-50 border p-3.5 rounded-2xl space-y-3">
                <p className="font-bold text-slate-700">Deixe sua nota para este vendedor:</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => { playSound.click(); setNewReviewRating(star); }}
                      className="p-0.5"
                    >
                      <Star className={`w-5 h-5 ${star <= newReviewRating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Escreva um comentário honesto sobre a qualidade do produto e atendimento da loja..."
                  rows={2}
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  className="w-full p-2.5 bg-white border rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-950 hover:bg-slate-900 text-yellow-400 font-extrabold rounded-lg cursor-pointer transition-all"
                >
                  Enviar Avaliação
                </button>
              </form>

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <p className="text-slate-400 font-medium italic pt-2">Este item ainda não foi avaliado por outros usuários.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-white border border-slate-100 rounded-2xl space-y-1 text-left shadow-sm">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span>{rev.display_name || rev.email.split('@')[0]}</span>
                        <div className="flex">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{rev.comment}</p>
                      <span className="text-[9px] text-slate-400 font-mono block">
                        {new Date(rev.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Q&A */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                <MessageSquare className="text-indigo-600 w-4 h-4" />
                Perguntas e Respostas ({questions.length})
              </h4>

              {/* Ask Question form */}
              <form onSubmit={handleSubmitQuestion} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tire suas dúvidas diretamente com o lojista..."
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer"
                >
                  Perguntar
                </button>
              </form>

              {/* Questions list */}
              {questions.length === 0 ? (
                <p className="text-slate-400 font-medium italic pt-2">Nenhuma dúvida registrada. Seja o primeiro a perguntar!</p>
              ) : (
                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {questions.map((qst) => (
                    <div key={qst.id} className="p-3 bg-slate-50 border rounded-2xl space-y-2 text-left">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-700">
                          <span className="flex items-center gap-1">❓ Pergunta por {qst.display_name || 'Gamer'}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{new Date(qst.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-slate-900 font-medium">{qst.question}</p>
                      </div>

                      {/* Answer box */}
                      {qst.answer ? (
                        <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl space-y-1">
                          <div className="flex items-center justify-between font-bold text-indigo-950">
                            <span>Lojista respondeu:</span>
                            <span className="text-[9px] text-indigo-400 font-mono">{new Date(qst.answered_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <p className="text-indigo-900 font-medium leading-relaxed">{qst.answer}</p>
                        </div>
                      ) : (
                        currentUserId === selectedProduct.seller_id ? (
                          <div className="pt-1 flex gap-2">
                            <input
                              type="text"
                              placeholder="Escreva sua resposta de lojista..."
                              value={newAnswerText[qst.id] || ''}
                              onChange={(e) => setNewAnswerText(prev => ({ ...prev, [qst.id]: e.target.value }))}
                              className="flex-1 p-1.5 bg-white border rounded-lg"
                            />
                            <button
                              onClick={() => handleAnswerQuestion(qst.id)}
                              className="px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg"
                            >
                              Responder
                            </button>
                          </div>
                        ) : (
                          <p className="text-slate-400 font-medium italic pl-4">Aguardando resposta do vendedor...</p>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* SINGLE CUSTOM STORE FRONT PAGE VIEW */}
      {selectedStore && !selectedProduct && (
        <div className="space-y-6">
          {/* Back button */}
          <div>
            <button
              onClick={() => setSelectedStore(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-lg"
            >
              ← Voltar à Lista de Lojas
            </button>
          </div>

          {/* Store Page header with customized theme applied */}
          <div className={`rounded-3xl border overflow-hidden p-5 md:p-8 space-y-6 ${getThemeClasses(selectedStore.theme)}`}>
            {/* Banner image background style if modern */}
            <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
              <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-white">
                  <img
                    src={selectedStore.logo_url}
                    alt="Logo"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl md:text-3xl font-black tracking-tight">{selectedStore.store_name}</h3>
                  <div className="flex items-center gap-3 justify-center md:justify-start font-mono text-[10px] uppercase tracking-widest mt-1 opacity-85">
                    <span>url: /{selectedStore.custom_url}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      ⭐ Reputação {selectedStore.reputation || '5.0'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed max-w-xl mt-3 opacity-90">{selectedStore.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Catalog items of this store */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-900 tracking-tight uppercase font-mono">Catálogo Exclusivo da Loja</h4>

            {(() => {
              const storeProds = products.filter(p => p.marketplace_id === selectedStore.id);
              if (storeProds.length === 0) {
                return (
                  <div className="p-12 text-center bg-slate-50 border rounded-2xl">
                    <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                    <p className="text-xs text-slate-400">Esta loja ainda não possui produtos ativos no catálogo.</p>
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {storeProds.map((prod) => {
                    let imgsList = [];
                    try {
                      imgsList = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
                    } catch (_) {
                      imgsList = [prod.images];
                    }
                    const firstImg = imgsList[0] || 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400';
                    const isFav = wishlist.some(w => w.id === prod.id);

                    return (
                      <div
                        key={prod.id}
                        onClick={() => viewProduct(prod)}
                        className="bg-white border border-slate-200/80 hover:border-indigo-400 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer group text-left relative"
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleWishlist(prod); }}
                          className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-slate-400 hover:text-red-500 hover:scale-110 border shadow"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>

                        <div className="aspect-video w-full overflow-hidden bg-slate-100">
                          <img
                            src={firstImg}
                            alt={prod.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                          />
                        </div>
                        <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-black text-slate-900 line-clamp-1">{prod.title}</h4>
                            <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-normal">{prod.description}</p>
                          </div>
                          <div className="flex justify-between items-baseline border-t border-slate-50 pt-2 mt-2">
                            <span className="text-xs font-mono font-black text-slate-950">R$ {Number(prod.price).toFixed(2)}</span>
                            <span className="text-[9px] text-slate-400">Qtd: {prod.stock}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MANAGE YOUR STORE PANEL (SELLER PANEL) */}
      {activeTab === 'manage' && (
        <div className="space-y-8">
          {!myStore ? (
            /* CREATE STORE FORM */
            <div className="bg-slate-50 border p-5 md:p-8 rounded-3xl text-left space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-950 flex items-center gap-1.5">
                  <Store className="text-indigo-600 w-5 h-5" />
                  Cadastre Sua Loja Virtual no SystemSite
                </h3>
                <p className="text-xs text-slate-500">
                  Defina um nome marcante, configure uma URL encurtada exclusiva e customize o tema visual para impressionar seus compradores.
                </p>
              </div>

              <form onSubmit={handleSaveStore} className="grid grid-cols-1 md:grid-cols-12 gap-5 text-xs font-bold text-slate-700">
                <div className="col-span-12 md:col-span-6 space-y-1">
                  <label>Nome Comercial da Loja</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Teclados Mecânicos Custom BR"
                    value={regStoreName}
                    onChange={(e) => setRegStoreName(e.target.value)}
                    className="w-full p-2.5 bg-white border rounded-xl"
                  />
                </div>

                <div className="col-span-12 md:col-span-6 space-y-1">
                  <label>URL Customizada (Apenas letras e números)</label>
                  <div className="flex">
                    <span className="p-2.5 bg-slate-200 border-y border-l rounded-l-xl text-slate-500 select-none">systemsite.com/store/</span>
                    <input
                      type="text"
                      required
                      placeholder="tecladoscustom"
                      value={regStoreUrl}
                      onChange={(e) => setRegStoreUrl(e.target.value)}
                      className="flex-1 p-2.5 bg-white border rounded-r-xl"
                    />
                  </div>
                </div>

                <div className="col-span-12 md:col-span-6 space-y-1">
                  <label>URL do Logo da Loja</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/photo-1472851294608-062f824d296e"
                    value={regStoreLogo}
                    onChange={(e) => setRegStoreLogo(e.target.value)}
                    className="w-full p-2.5 bg-white border rounded-xl"
                  />
                </div>

                <div className="col-span-12 md:col-span-6 space-y-1">
                  <label>URL da Imagem de Banner</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"
                    value={regStoreBanner}
                    onChange={(e) => setRegStoreBanner(e.target.value)}
                    className="w-full p-2.5 bg-white border rounded-xl"
                  />
                </div>

                <div className="col-span-12 md:col-span-6 space-y-1">
                  <label>Tema de Cores da Loja</label>
                  <select
                    value={regStoreTheme}
                    onChange={(e) => setRegStoreTheme(e.target.value)}
                    className="w-full p-2.5 bg-white border rounded-xl"
                  >
                    <option value="default">Default Light (Clássico)</option>
                    <option value="dark">Modern Dark (Grafite &amp; Carbono)</option>
                    <option value="amber">Neon Amber (Laranja Tecnológico)</option>
                    <option value="emerald">Elegant Emerald (Verde Luxuoso)</option>
                    <option value="cyber">Retro Cyber (Roxo &amp; Neon)</option>
                  </select>
                </div>

                <div className="col-span-12 md:col-span-6 space-y-1">
                  <label>Categorias de Atuação (Multi-seleção)</label>
                  <div className="flex gap-2 flex-wrap pt-1">
                    {['Periféricos', 'Hardware', 'Consoles & Jogos', 'Assinaturas', 'Serviços'].map((cat) => {
                      const isSel = regStoreCategories.includes(cat);
                      return (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => {
                            playSound.click();
                            setRegStoreCategories(prev =>
                              isSel ? prev.filter(c => c !== cat) : [...prev, cat]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-lg border font-bold ${isSel ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white text-slate-600'}`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="col-span-12 space-y-1">
                  <label>Descrição da Loja / Biografia Comercial</label>
                  <textarea
                    placeholder="Diga aos compradores quem você é, o que vende, prazos de envio, políticas de devolução e garantias de dropshipping..."
                    rows={3}
                    value={regStoreDesc}
                    onChange={(e) => setRegStoreDesc(e.target.value)}
                    className="w-full p-2.5 bg-white border rounded-xl"
                  />
                </div>

                <div className="col-span-12 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/15"
                  >
                    {loading ? 'Cadastrando...' : 'Cadastrar Loja Virtual e Começar a Vender! 🚀'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* STORE DASHBOARD & PRODUCTS MANAGEMENT */
            <div className="space-y-8 text-left">
              {/* Store statistics bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-slate-600">
                <div className="p-4 bg-slate-50 border rounded-2xl space-y-1">
                  <span>FATURAMENTO ESTIMADO</span>
                  <p className="text-lg font-black text-slate-950 font-mono">
                    R$ {customerOrders.reduce((acc, o) => acc + (o.status === 'delivered' ? o.total_price : 0), 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 border rounded-2xl space-y-1">
                  <span>PEDIDOS RECEBIDOS</span>
                  <p className="text-lg font-black text-slate-950 font-mono">
                    {customerOrders.length}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 border rounded-2xl space-y-1">
                  <span>REPUTAÇÃO DA LOJA</span>
                  <p className="text-lg font-black text-yellow-500 flex items-center gap-1">
                    ★ {myStore.reputation || '5.0'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 border rounded-2xl space-y-1">
                  <span>PRODUTOS ATIVOS</span>
                  <p className="text-lg font-black text-indigo-600 font-mono">
                    {products.filter(p => p.marketplace_id === myStore.id).length}
                  </p>
                </div>
              </div>

              {/* Edit Store Customizer details button */}
              <div className="p-4 bg-white border rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-600" />
                  <div>
                    <strong className="text-slate-950 block">Ajustes &amp; Customização visual de sua Loja</strong>
                    <span className="text-slate-400">Edite o logotipo, banner e tema de cores em tempo real.</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    playSound.click();
                    // Just prompt modal or show registration form by temporarily deleting myStore state locally
                    setMyStore(null);
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Configurar Loja
                </button>
              </div>

              {/* Main row: Add product form on left, products list on right */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Product registration */}
                <div className="col-span-12 md:col-span-5 bg-slate-50 border p-5 rounded-3xl space-y-4">
                  <h4 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                    <PlusCircle className="text-indigo-600 w-4 h-4" />
                    Cadastrar Novo Produto
                  </h4>

                  <form onSubmit={handleCreateProduct} className="space-y-3 text-xs font-bold text-slate-700">
                    <div className="space-y-1">
                      <label>Título do Produto / Serviço</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Teclado Mecânico RGB v2"
                        value={prodTitle}
                        onChange={(e) => setProdTitle(e.target.value)}
                        className="w-full p-2 bg-white border rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label>Preço Unitário (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="249.90"
                          value={prodPrice}
                          onChange={(e) => setProdPrice(e.target.value)}
                          className="w-full p-2 bg-white border rounded-lg"
                        />
                      </div>

                      <div className="space-y-1">
                        <label>Tipo de Item</label>
                        <select
                          value={prodType}
                          onChange={(e) => setProdType(e.target.value)}
                          className="w-full p-2 bg-white border rounded-lg"
                        >
                          <option value="physical">📦 Produto Físico</option>
                          <option value="digital">⚡ Download Digital</option>
                          <option value="service">🛠️ Serviço Profissional</option>
                          <option value="subscription">📅 Assinatura Periódica</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label>Estoque Inicial</label>
                        <input
                          type="number"
                          disabled={prodType !== 'physical'}
                          placeholder="10"
                          value={prodStock}
                          onChange={(e) => setProdStock(e.target.value)}
                          className="w-full p-2 bg-white border rounded-lg disabled:opacity-50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label>Código SKU (Opcional)</label>
                        <input
                          type="text"
                          placeholder="Ex: KB-RGB-85"
                          value={prodSku}
                          onChange={(e) => setProdSku(e.target.value)}
                          className="w-full p-2 bg-white border rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label>Variações / Opções (Separe por vírgulas, ex: Preto, Branco)</label>
                      <input
                        type="text"
                        placeholder="Ex: Preto, Branco, Rosa"
                        value={prodVariations}
                        onChange={(e) => setProdVariations(e.target.value)}
                        className="w-full p-2 bg-white border rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <label>URL da Imagem Principal</label>
                      <input
                        type="text"
                        placeholder="Insira link da imagem..."
                        value={prodNewImage}
                        onChange={(e) => setProdNewImage(e.target.value)}
                        className="w-full p-2 bg-white border rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (prodNewImage) {
                            setProdImages([prodNewImage]);
                            alert('Imagem adicionada!');
                          }
                        }}
                        className="text-[10px] text-indigo-600 font-bold block pt-0.5 hover:underline"
                      >
                        + Confirmar URL da Imagem
                      </button>
                    </div>

                    {prodType === 'digital' && (
                      <div className="space-y-1 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                        <label className="text-indigo-950">Link de Download do Arquivo Digital</label>
                        <input
                          type="text"
                          placeholder="https://drive.google.com/..."
                          value={prodDigitalFile}
                          onChange={(e) => setProdDigitalFile(e.target.value)}
                          className="w-full p-1.5 bg-white border rounded-md"
                        />
                      </div>
                    )}

                    {prodType === 'subscription' && (
                      <div className="space-y-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                        <span className="text-amber-950 block">Configurar Assinatura</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label>Periodicidade</label>
                            <select
                              value={prodSubBilling}
                              onChange={(e) => setProdSubBilling(e.target.value)}
                              className="w-full p-1 bg-white border rounded"
                            >
                              <option value="mensal">Mensal</option>
                              <option value="anual">Anual</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label>Vantagens (Uma por linha)</label>
                          <textarea
                            rows={2}
                            placeholder="Acesso VIP ao canal Discord&#10;Consultas Mensais exclusivas"
                            value={prodSubPerks}
                            onChange={(e) => setProdSubPerks(e.target.value)}
                            className="w-full p-1 bg-white border rounded"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label>Link de Vídeo de Demonstração (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ex: Youtube, Vimeo, Twitch"
                        value={prodVideoUrl}
                        onChange={(e) => setProdVideoUrl(e.target.value)}
                        className="w-full p-2 bg-white border rounded-lg"
                      />
                    </div>

                    <div className="space-y-1">
                      <label>Categoria de Catálogo</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full p-2 bg-white border rounded-lg"
                      >
                        <option value="perifericos">Periféricos</option>
                        <option value="hardwares">Hardware</option>
                        <option value="consoles">Consoles &amp; Jogos</option>
                        <option value="cadeiras">Móveis &amp; Conforto</option>
                        <option value="servicos">Serviços Profissionais</option>
                        <option value="assinaturas">Assinaturas VIP</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label>Descrição do Produto / Especificações</label>
                      <textarea
                        required
                        placeholder="Detalhes sobre garantia, material, compatibilidade e desempenho..."
                        rows={3}
                        value={prodDescription}
                        onChange={(e) => setProdDescription(e.target.value)}
                        className="w-full p-2 bg-white border rounded-lg"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl cursor-pointer"
                    >
                      Publicar Produto no Catálogo
                    </button>
                  </form>
                </div>

                {/* Seller's Products and customer questions table */}
                <div className="col-span-12 md:col-span-7 space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                      <Package className="text-indigo-600 w-4 h-4" />
                      Seus Produtos Ativos ({products.filter(p => p.marketplace_id === myStore.id).length})
                    </h4>

                    {products.filter(p => p.marketplace_id === myStore.id).length === 0 ? (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-4 border rounded-2xl">Você ainda não cadastrou produtos para sua loja virtual.</p>
                    ) : (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white text-[11px]">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b">
                            <tr className="font-extrabold text-slate-600 font-mono uppercase tracking-wider">
                              <th className="p-3">Título</th>
                              <th className="p-3">Preço</th>
                              <th className="p-3">Tipo</th>
                              <th className="p-3">Estoque</th>
                              <th className="p-3 text-center">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.filter(p => p.marketplace_id === myStore.id).map((prod) => (
                              <tr key={prod.id} className="border-b last:border-none">
                                <td className="p-3 font-bold text-slate-950">{prod.title}</td>
                                <td className="p-3 font-mono">R$ {Number(prod.price).toFixed(2)}</td>
                                <td className="p-3 uppercase font-mono text-[9px]">{prod.type}</td>
                                <td className="p-3 font-mono">{prod.stock}</td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                                    title="Remover produto"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Customer Orders to ship panel */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                      <Truck className="text-indigo-600 w-4 h-4" />
                      Fila de Envios / Vendas de Clientes ({customerOrders.length})
                    </h4>

                    {customerOrders.length === 0 ? (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-4 border rounded-2xl">Sua loja ainda não registrou vendas de outros usuários.</p>
                    ) : (
                      <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                        {customerOrders.map((ord) => (
                          <div key={ord.id} className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-3 text-xs shadow-sm">
                            <div className="flex justify-between font-bold border-b pb-1.5">
                              <span className="font-mono uppercase text-slate-500">Pedido: {ord.id}</span>
                              <span className={`px-2 py-0.5 rounded uppercase text-[9px] ${ord.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {ord.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-400 block font-bold">CLIENTE</span>
                                <span className="text-slate-950 font-medium">{ord.buyer_email}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-bold">PRODUTO</span>
                                <span className="text-slate-950 font-bold truncate block">{ord.product_title}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-bold">ENDEREÇO DE ENTREGA</span>
                                <span className="text-slate-950 font-medium leading-normal">{ord.shipping_address}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-bold">FATURAMENTO</span>
                                <span className="text-indigo-600 font-black font-mono">R$ {Number(ord.total_price).toFixed(2)}</span>
                              </div>
                            </div>

                            {/* Tracking code input and state triggers */}
                            {ord.status !== 'delivered' && (
                              <div className="pt-2 flex gap-2 items-center">
                                <input
                                  type="text"
                                  placeholder="Código Correios (ex: BR123456789BR)"
                                  id={`track-input-${ord.id}`}
                                  className="p-1.5 bg-slate-50 border rounded-lg flex-1 font-mono"
                                />
                                <button
                                  onClick={() => {
                                    const input = document.getElementById(`track-input-${ord.id}`) as HTMLInputElement;
                                    handleUpdateOrderStatus(ord.id, 'shipped', input?.value);
                                  }}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer"
                                >
                                  Despachar 🚚
                                </button>
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer"
                                >
                                  Entregar ✓
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PEDIDOS & DESEJOS VIEW */}
      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Wishlist Favorites */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-950 flex items-center gap-1.5 uppercase font-mono">
              <Heart className="text-red-500 fill-red-500 w-4.5 h-4.5" />
              Sua Lista de Desejos / Favoritos ({wishlist.length})
            </h4>

            {wishlist.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border rounded-2xl border-slate-200/60">
                <p className="text-xs text-slate-500">Sua lista de desejos está vazia.</p>
                <p className="text-[10px] text-slate-400 mt-1">Clique no ícone de coração nos produtos para favoritá-los!</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {wishlist.map((item) => (
                  <div
                    key={item.wishlist_entry_id || item.id}
                    onClick={() => viewProduct(item)}
                    className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-3.5 hover:border-indigo-400 cursor-pointer shadow-sm transition-all"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-100 shrink-0">
                      {(() => {
                        let imgs = [];
                        try {
                          imgs = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
                        } catch (_) {
                          imgs = [item.images];
                        }
                        return <img src={imgs[0] || 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400'} alt="" className="w-full h-full object-cover" />;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] text-indigo-600 font-extrabold uppercase block">{item.store_name}</span>
                      <h5 className="text-xs font-black text-slate-950 truncate">{item.title}</h5>
                      <span className="text-xs font-mono font-extrabold text-slate-900 block mt-0.5">R$ {Number(item.price).toFixed(2)}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(item); }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Purchasing History Orders */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-950 flex items-center gap-1.5 uppercase font-mono">
              <Package className="text-indigo-600 w-4.5 h-4.5" />
              Histórico de Seus Pedidos ({myOrders.length})
            </h4>

            {myOrders.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border rounded-2xl border-slate-200/60">
                <p className="text-xs text-slate-500">Você ainda não realizou compras no marketplace de lojas virtuais.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {myOrders.map((ord) => (
                  <div key={ord.id} className="p-3.5 bg-white border rounded-2xl space-y-3 text-xs shadow-sm text-left">
                    <div className="flex justify-between items-center border-b pb-1.5">
                      <strong className="font-mono text-slate-500 text-[10px]">CÓDIGO: {ord.id}</strong>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${ord.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {ord.status === 'delivered' ? '✓ ENTREGUE' : `🚚 ${ord.status.toUpperCase()}`}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">LOJA PARCEIRA</span>
                        <span className="text-slate-950 font-bold block">{ord.store_name}</span>
                        <h5 className="text-xs font-black text-slate-950 mt-1">{ord.product_title}</h5>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">TOTAL PAGO</span>
                        <span className="font-mono font-black text-slate-950 text-xs block">R$ {Number(ord.total_price).toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500 font-bold block mt-0.5">Qtd: {ord.quantity}</span>
                      </div>
                    </div>

                    {ord.shipping_tracking_code && (
                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 flex justify-between items-center text-[11px]">
                        <span className="text-emerald-800 font-bold font-mono">Correios:</span>
                        <span className="font-mono font-extrabold text-slate-950 select-all bg-white px-2 py-0.5 rounded border">{ord.shipping_tracking_code}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT SAFE SLIDE-OVER / MODAL */}
      <AnimatePresence>
        {checkoutProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-2 border-indigo-500 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-left"
            >
              {/* Checkout Header */}
              <div className="bg-slate-950 text-white p-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-yellow-400" />
                  <div>
                    <h3 className="text-sm font-black tracking-tight uppercase font-mono text-white">Faturamento de Pedido Seguro</h3>
                    <p className="text-[10px] text-slate-400 font-medium">ECOMMERCE ESCALÁVEL INTEGRADO</p>
                  </div>
                </div>
                <button
                  onClick={() => setCheckoutProduct(null)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Product summary card */}
                <div className="flex gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border bg-white shrink-0">
                    {(() => {
                      let imgs = [];
                      try {
                        imgs = typeof checkoutProduct.images === 'string' ? JSON.parse(checkoutProduct.images) : checkoutProduct.images;
                      } catch (_) {
                        imgs = [checkoutProduct.images];
                      }
                      return <img src={imgs[0]} alt="" className="w-full h-full object-cover" />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] text-indigo-600 font-extrabold uppercase block">{checkoutProduct.store_name}</span>
                    <h4 className="text-xs font-black text-slate-950 truncate">{checkoutProduct.title}</h4>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{checkoutProduct.description}</p>
                    <span className="font-mono font-black text-slate-900 block mt-1">R$ {Number(checkoutProduct.price).toFixed(2)}</span>
                  </div>
                </div>

                {/* Select quantity & variation summary */}
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                  <div className="space-y-1">
                    <label>Quantidade:</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => { playSound.click(); setCheckoutQuantity(prev => Math.max(1, prev - 1)); }}
                        className="px-2.5 py-1 bg-slate-100 rounded hover:bg-slate-200"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 border rounded-lg font-mono">{checkoutQuantity}</span>
                      <button
                        type="button"
                        onClick={() => { playSound.click(); setCheckoutQuantity(prev => prev + 1); }}
                        className="px-2.5 py-1 bg-slate-100 rounded hover:bg-slate-200"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {checkoutVariation && (
                    <div className="space-y-1">
                      <label>Opção Escolhida:</label>
                      <span className="p-1.5 px-3 bg-indigo-50 text-indigo-700 rounded-lg inline-block border border-indigo-200">
                        {checkoutVariation}
                      </span>
                    </div>
                  )}
                </div>

                {/* Shipping info (required for physical goods) */}
                {checkoutProduct.type === 'physical' && (
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-700">Endereço de Entrega Completo (Rua, Número, CEP, Cidade):</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo/SP"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Payment configuration */}
                <div className="space-y-2 text-xs">
                  <label className="font-bold text-slate-700">Escolha o Meio de Pagamento:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => { playSound.click(); setPayMethod('real'); }}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between ${payMethod === 'real' ? 'border-indigo-600 bg-indigo-50/50' : 'bg-slate-50'}`}
                    >
                      <div className="flex justify-between items-center w-full font-bold">
                        <span>Saldo em Conta</span>
                        <CreditCard className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="font-mono font-black text-slate-900 block mt-2">R$ {realBalance.toFixed(2)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { playSound.click(); setPayMethod('coins'); }}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between ${payMethod === 'coins' ? 'border-indigo-600 bg-indigo-50/50' : 'bg-slate-50'}`}
                    >
                      <div className="flex justify-between items-center w-full font-bold">
                        <span>Coins de Jogo</span>
                        <Award className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="font-mono font-black text-indigo-600 block mt-2">{stats.coins} 🪙</span>
                    </button>
                  </div>
                </div>

                {/* Subtotal calculation */}
                <div className="border-t pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500 font-bold">
                    <span>Subtotal:</span>
                    <span className="font-mono">R$ {(checkoutProduct.price * checkoutQuantity).toFixed(2)}</span>
                  </div>
                  {checkoutProduct.type === 'physical' && (
                    <div className="flex justify-between text-slate-500 font-bold">
                      <span>Frete Mercado Envios:</span>
                      <span className="text-emerald-600 font-bold font-mono">GRÁTIS</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-950 font-black text-sm border-t pt-2">
                    <span>TOTAL GERAL:</span>
                    {payMethod === 'real' ? (
                      <span className="font-mono text-slate-950">R$ {(checkoutProduct.price * checkoutQuantity).toFixed(2)}</span>
                    ) : (
                      <span className="font-mono text-indigo-600">{(checkoutProduct.price * checkoutQuantity * 100).toLocaleString('pt-BR')} Coins 🪙</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Checkout actions */}
              <div className="bg-slate-50 p-4 border-t flex items-center justify-between">
                <button
                  onClick={() => setCheckoutProduct(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmCheckout}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  Confirmar Pagamento e Envio 🔒
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
