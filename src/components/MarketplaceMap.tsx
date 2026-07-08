import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Store, 
  Plus, 
  ExternalLink, 
  Compass, 
  Filter, 
  ShoppingBag, 
  ShieldCheck, 
  Heart, 
  User, 
  Sparkles, 
  Navigation, 
  Info, 
  AlertCircle, 
  Trash2, 
  CheckCircle2, 
  Map, 
  Layers, 
  DollarSign, 
  X,
  PlusCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { playSound } from '../utils/audio';

// Google Maps Integration as specified in google-maps-platform skill
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim() !== '';

// Haversine Distance Formula in KM
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export interface UserStore {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  bannerColor: string;
  city: string;
  createdAt: string;
}

export interface AffiliateProduct {
  id: string;
  storeId: string;
  title: string;
  description: string;
  price: number;
  platform: string;
  link: string;
  imageUrl: string;
  category: string;
  rating: number;
  freeShipping: boolean;
  discount: number;
  stock: number;
  createdAt: string;
}

const PRESET_STORE_IMAGES = [
  { name: 'Teclado Mecânico RGB', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400' },
  { name: 'Mouse Gamer Pro', url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=400' },
  { name: 'Placa de Vídeo RTX', url: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=400' },
  { name: 'Cadeira Gamer Carbon', url: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&q=80&w=400' },
  { name: 'PlayStation 5 Slim', url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=400' },
  { name: 'Gamer Headset 7.1', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400' },
  { name: 'Gamer Setup Monitor', url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400' }
];

const INITIAL_STORES: UserStore[] = [
  {
    id: 'store-saopaulo',
    userId: 'user-lucas',
    userName: 'Lucas S. de SP',
    userAvatar: '⚡',
    name: 'Teclados Mecânicos Custom & Keycaps',
    description: 'Os melhores teclados modulares importados e switches modificados manualmente para digitação ultra silenciosa.',
    latitude: -23.5505,
    longitude: -46.6333,
    city: 'São Paulo',
    bannerColor: 'bg-gradient-to-r from-indigo-650 to-indigo-850',
    createdAt: new Date().toISOString()
  },
  {
    id: 'store-riodejaneiro',
    userId: 'user-aline',
    userName: 'Aline R. de RJ',
    userAvatar: '👑',
    name: 'Arena Games & Controles Pro',
    description: 'Controles competitivos de alta performance com paddles traseiros e mouses ultraleves com frete grátis.',
    latitude: -22.9068,
    longitude: -43.1729,
    city: 'Rio de Janeiro',
    bannerColor: 'bg-gradient-to-r from-pink-650 to-purple-800',
    createdAt: new Date().toISOString()
  },
  {
    id: 'store-curitiba',
    userId: 'user-bruno',
    userName: 'Bruno M. de PR',
    userAvatar: '🍀',
    name: 'Cyber Seat Sul Ergonômicos',
    description: 'Revenda de cadeiras gamer ergonômicas e mesas reguláveis eletricamente com cupons de desconto exclusivos.',
    latitude: -25.4284,
    longitude: -49.2733,
    city: 'Curitiba',
    bannerColor: 'bg-gradient-to-r from-emerald-650 to-teal-850',
    createdAt: new Date().toISOString()
  }
];

const INITIAL_PRODUCTS: AffiliateProduct[] = [
  {
    id: 'aff-teclado-lucas',
    storeId: 'store-saopaulo',
    title: 'Teclado Mecânico RGB Stealth Pro Gamer v3',
    description: 'Switches amarelos silenciosos, retroiluminação customizada RGB e cabo espiralado incluso.',
    price: 249.90,
    platform: 'Mercado Livre',
    link: 'https://www.mercadolivre.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400',
    category: 'perifericos',
    rating: 4.8,
    freeShipping: true,
    discount: 15,
    stock: 12,
    createdAt: new Date().toISOString()
  },
  {
    id: 'aff-mouse-lucas',
    storeId: 'store-saopaulo',
    title: 'Mouse Gamer Sem Fio NeonX 16000 DPI',
    description: 'Apenas 59g, sensor ultra preciso PixArt premium, bateria de 80 horas via USB-C.',
    price: 189.90,
    platform: 'Shopee Brasil',
    link: 'https://shopee.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=400',
    category: 'perifericos',
    rating: 4.9,
    freeShipping: true,
    discount: 10,
    stock: 25,
    createdAt: new Date().toISOString()
  },
  {
    id: 'aff-ps5-aline',
    storeId: 'store-riodejaneiro',
    title: 'Console PlayStation 5 Slim 1TB SSD',
    description: 'Modelo Slim silencioso com SSD de ultra velocidade e controle DualSense incluso.',
    price: 3699.00,
    platform: 'Amazon Brasil',
    link: 'https://www.amazon.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=400',
    category: 'consoles',
    rating: 4.9,
    freeShipping: true,
    discount: 8,
    stock: 5,
    createdAt: new Date().toISOString()
  },
  {
    id: 'aff-headset-aline',
    storeId: 'store-riodejaneiro',
    title: 'Gamer Headset Kraken Pro 7.1 Surround',
    description: 'Drivers magnéticos de 50mm com isolamento de ruído passivo superior.',
    price: 349.90,
    platform: 'AliExpress',
    link: 'https://shopee.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
    category: 'perifericos',
    rating: 4.6,
    freeShipping: true,
    discount: 12,
    stock: 14,
    createdAt: new Date().toISOString()
  },
  {
    id: 'aff-cadeira-bruno',
    storeId: 'store-curitiba',
    title: 'Cadeira Gamer Ergonômica CyberSeat Carbon v2',
    description: 'Revestimento respirável de fibra de carbono, reclinação 180 graus e suporte lombar.',
    price: 899.00,
    platform: 'Mercado Livre',
    link: 'https://www.mercadolivre.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&q=80&w=400',
    category: 'cadeiras',
    rating: 4.7,
    freeShipping: false,
    discount: 20,
    stock: 8,
    createdAt: new Date().toISOString()
  }
];

// Locations for dropdown click setting
const MAJOR_BRAZILIAN_CITIES = [
  { name: 'São Paulo/SP', lat: -23.5505, lng: -46.6333 },
  { name: 'Rio de Janeiro/RJ', lat: -22.9068, lng: -43.1729 },
  { name: 'Curitiba/PR', lat: -25.4284, lng: -49.2733 },
  { name: 'Belo Horizonte/MG', lat: -19.9173, lng: -43.9345 },
  { name: 'Brasília/DF', lat: -15.7975, lng: -47.8919 },
  { name: 'Porto Alegre/RS', lat: -30.0346, lng: -51.2177 },
  { name: 'Salvador/BA', lat: -12.9714, lng: -38.5014 },
  { name: 'Recife/PE', lat: -8.0543, lng: -34.8813 },
  { name: 'Fortaleza/CE', lat: -3.7319, lng: -38.5267 }
];

interface MarketplaceMapProps {
  stats: any;
  updateStats: (updater: (prev: any) => any) => void;
  addLog: (type: any, desc: string, amount: number, currency: 'coins' | 'real') => void;
  loggedInUser?: any;
  onOpenLogin?: () => void;
  realBalance: number;
  setRealBalance: React.Dispatch<React.SetStateAction<number>>;
}

export const MarketplaceMap: React.FC<MarketplaceMapProps> = ({
  stats,
  updateStats,
  addLog,
  loggedInUser,
  onOpenLogin,
  realBalance,
  setRealBalance
}) => {
  // Persistence state
  const [stores, setStores] = useState<UserStore[]>(() => {
    const cached = localStorage.getItem('gamezone_user_stores');
    return cached ? JSON.parse(cached) : INITIAL_STORES;
  });

  const [products, setProducts] = useState<AffiliateProduct[]>(() => {
    const cached = localStorage.getItem('gamezone_user_store_products');
    return cached ? JSON.parse(cached) : INITIAL_PRODUCTS;
  });

  useEffect(() => {
    localStorage.setItem('gamezone_user_stores', JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem('gamezone_user_store_products', JSON.stringify(products));
  }, [products]);

  // View States
  const [selectedStore, setSelectedStore] = useState<UserStore | null>(null);
  const [showStoreProductsModal, setShowStoreProductsModal] = useState<boolean>(false);
  const [showCreateStorePanel, setShowCreateStorePanel] = useState<boolean>(false);
  const [showCreateProductPanel, setShowCreateProductPanel] = useState<boolean>(false);

  // Map Filter Coordinates center (defaults to São Paulo)
  const [mapCenter, setMapCenter] = useState({ lat: -23.5505, lng: -46.6333 });
  const [selectedCityName, setSelectedCityName] = useState('São Paulo/SP');
  const [distanceRange, setDistanceRange] = useState<number>(1000); // in KM

  // Google Map InfoWindow control
  const [activeInfoWindowStoreId, setActiveInfoWindowStoreId] = useState<string | null>(null);

  // Form States for creating a store
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreDesc, setNewStoreDesc] = useState('');
  const [newStoreCity, setNewStoreCity] = useState('São Paulo/SP');
  const [newStoreLat, setNewStoreLat] = useState(-23.5505);
  const [newStoreLng, setNewStoreLng] = useState(-46.6333);
  const [newStoreBanner, setNewStoreBanner] = useState('bg-gradient-to-r from-indigo-600 to-indigo-850');
  const [storeFormError, setStoreFormError] = useState<string | null>(null);
  const [storeFormSuccess, setStoreFormSuccess] = useState<string | null>(null);

  // Form States for adding an affiliate product to store
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdLink, setNewProdLink] = useState('');
  const [newProdImg, setNewProdImg] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('perifericos');
  const [newProdPlatform, setNewProdPlatform] = useState('Mercado Livre');
  const [newProdDiscount, setNewProdDiscount] = useState('10');
  const [newProdFreeShipping, setNewProdFreeShipping] = useState(true);
  const [prodFormError, setProdFormError] = useState<string | null>(null);
  const [prodFormSuccess, setProdFormSuccess] = useState<string | null>(null);

  // Affiliate Click Modal
  const [activeAffProduct, setActiveAffProduct] = useState<AffiliateProduct | null>(null);

  // Check if current user already has a store registered
  const currentUserStore = stores.find(s => s.userId === loggedInUser?.uid || s.userId === loggedInUser?.email);

  // Handle City Change for Search Filter
  const handleFilterCityChange = (cityName: string) => {
    const cityObj = MAJOR_BRAZILIAN_CITIES.find(c => c.name === cityName);
    if (cityObj) {
      playSound.click();
      setSelectedCityName(cityName);
      setMapCenter({ lat: cityObj.lat, lng: cityObj.lng });
    }
  };

  // Handle City Selection in Create Store Form
  const handleFormCityChange = (cityName: string) => {
    const cityObj = MAJOR_BRAZILIAN_CITIES.find(c => c.name === cityName);
    if (cityObj) {
      setNewStoreCity(cityName);
      // Offset slightly to prevent exact overlaps
      const offsetLat = cityObj.lat + (Math.random() - 0.5) * 0.05;
      const offsetLng = cityObj.lng + (Math.random() - 0.5) * 0.05;
      setNewStoreLat(parseFloat(offsetLat.toFixed(5)));
      setNewStoreLng(parseFloat(offsetLng.toFixed(5)));
    }
  };

  // Filter stores by Distance from active center
  const filteredStores = stores.filter(store => {
    const dist = calculateDistance(mapCenter.lat, mapCenter.lng, store.latitude, store.longitude);
    return dist <= distanceRange;
  });

  // Create User Store
  const handleCreateStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) {
      playSound.tick();
      setStoreFormError('Você precisa fazer login para criar uma loja de afiliado!');
      if (onOpenLogin) onOpenLogin();
      return;
    }
    if (!newStoreName.trim()) {
      setStoreFormError('Preencha o nome da sua loja!');
      return;
    }
    if (!newStoreDesc.trim() || newStoreDesc.length < 10) {
      setStoreFormError('Por favor, insira uma descrição de pelo menos 10 caracteres.');
      return;
    }

    const uniqueId = `store-${Date.now()}`;
    const newStore: UserStore = {
      id: uniqueId,
      userId: loggedInUser.uid || loggedInUser.email,
      userName: loggedInUser.name || 'Gamer Parceiro',
      userAvatar: loggedInUser.picture || '🎮',
      name: newStoreName.trim(),
      description: newStoreDesc.trim(),
      latitude: newStoreLat,
      longitude: newStoreLng,
      city: newStoreCity.split('/')[0],
      bannerColor: newStoreBanner,
      createdAt: new Date().toISOString()
    };

    setStores(prev => [newStore, ...prev]);
    playSound.purchase();
    setStoreFormSuccess('🎉 Sua loja de afiliado foi inaugurada com sucesso!');
    setStoreFormError(null);
    setNewStoreName('');
    setNewStoreDesc('');
    
    // Auto select the new store
    setTimeout(() => {
      setSelectedStore(newStore);
      setStoreFormSuccess(null);
      setShowCreateStorePanel(false);
    }, 2000);
  };

  // Add Product to User's Store
  const handleAddProductToStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserStore) {
      setProdFormError('Inaugure sua loja antes de adicionar produtos!');
      return;
    }
    if (!newProdTitle.trim()) {
      setProdFormError('Insira o título do produto!');
      return;
    }
    const priceVal = parseFloat(newProdPrice);
    if (isNaN(priceVal) || priceVal <= 0) {
      setProdFormError('Preço inválido! Deve ser maior que R$ 0,00.');
      return;
    }
    if (!newProdLink.trim() || !newProdLink.startsWith('http')) {
      setProdFormError('Insira um link de afiliado válido começando com http:// ou https://');
      return;
    }
    if (!newProdImg.trim()) {
      setProdFormError('Forneça ou selecione uma imagem para o produto gamer.');
      return;
    }

    const newProd: AffiliateProduct = {
      id: `aff-prod-${Date.now()}`,
      storeId: currentUserStore.id,
      title: newProdTitle.trim(),
      description: newProdDesc.trim() || 'Sem descrição adicional fornecida.',
      price: priceVal,
      platform: newProdPlatform,
      link: newProdLink.trim(),
      imageUrl: newProdImg,
      category: newProdCategory,
      rating: parseFloat((4.2 + Math.random() * 0.8).toFixed(1)),
      freeShipping: newProdFreeShipping,
      discount: parseInt(newProdDiscount) || 0,
      stock: Math.floor(10 + Math.random() * 40),
      createdAt: new Date().toISOString()
    };

    setProducts(prev => [newProd, ...prev]);
    playSound.purchase();
    setProdFormSuccess('🚀 Produto de afiliado adicionado à sua loja com sucesso!');
    setProdFormError(null);

    // Clear form
    setNewProdTitle('');
    setNewProdDesc('');
    setNewProdPrice('');
    setNewProdLink('');
    setNewProdImg('');

    setTimeout(() => {
      setProdFormSuccess(null);
      setShowCreateProductPanel(false);
    }, 1500);
  };

  // Delete product from store
  const handleDeleteAffProduct = (prodId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound.click();
    if (confirm('Deseja realmente remover este produto da sua vitrine de afiliado?')) {
      setProducts(prev => prev.filter(p => p.id !== prodId));
    }
  };

  // Visit Affiliate Link & Pay Commission to store owner
  const handleOpenAffLink = (prod: AffiliateProduct) => {
    playSound.click();
    setActiveAffProduct(prod);
  };

  const handleConfirmAffLinkVisit = () => {
    if (!activeAffProduct) return;

    window.open(activeAffProduct.link, '_blank', 'noopener,noreferrer');

    // Pay 10% commission to store owner (only if owner is NOT the current logged-in user to prevent self-rewards)
    const storeObj = stores.find(s => s.id === activeAffProduct.storeId);
    const isOwner = storeObj && loggedInUser && (storeObj.userId === loggedInUser.uid || storeObj.userId === loggedInUser.email);

    if (storeObj && !isOwner) {
      const commission = activeAffProduct.price * 0.1;
      // In a real database we would deposit into store owner account.
      // For this full-stack mockup, we will display a gorgeous success log and simulate faturamento:
      setRealBalance(prev => prev + commission);
      addLog('earn', `Comissão de 10% recebida na loja de ${storeObj.userName}: ${activeAffProduct.title}`, commission, 'real');
    } else if (isOwner) {
      // Owner clicking their own link
      addLog('earn', `Visita ao seu próprio link de afiliado: ${activeAffProduct.title}`, 0, 'real');
    }

    setActiveAffProduct(null);
  };

  // Preset Image Selector
  const handleSelectFormImg = (url: string) => {
    playSound.click();
    setNewProdImg(url);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Introduction banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
            <Sparkles className="w-3 h-3" /> NOVIDADE: MARKTPLACE DE AFILIADOS
          </div>
          <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
            Inaugure sua Loja Gamer &amp; Lucre
          </h3>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Agora você pode criar sua própria vitrine de e-commerce! Insira seus links de afiliados do <strong>Mercado Livre, Amazon, Shopee ou Kabum</strong> e fature <strong>10% de comissão</strong> toda vez que usuários comprarem produtos pela sua loja gamer no mapa.
          </p>
        </div>

        {/* Action button */}
        <div className="shrink-0 flex flex-col sm:flex-row gap-3 z-10">
          {currentUserStore ? (
            <div className="space-y-1.5 text-center sm:text-left">
              <span className="text-[10px] text-slate-400 font-mono block">SUA VITRINE ATIVA:</span>
              <button
                onClick={() => { playSound.click(); setSelectedStore(currentUserStore); setShowStoreProductsModal(true); }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <Store className="w-4 h-4" /> Gerenciar Minha Loja
              </button>
            </div>
          ) : (
            <button
              onClick={() => { playSound.click(); setShowCreateStorePanel(!showCreateStorePanel); }}
              className="px-5 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-350 hover:to-yellow-450 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/10"
            >
              <PlusCircle className="w-4 h-4" /> Abrir Minha Loja Grátis
            </button>
          )}
        </div>
      </div>

      {/* CREATE STORE DRAWER/PANEL */}
      <AnimatePresence>
        {showCreateStorePanel && !currentUserStore && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-yellow-400 text-slate-900 rounded-xl">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-black text-slate-900 uppercase">Criação de Loja Gamer de Afiliado</h3>
                    <p className="text-xs text-slate-500 font-mono">Dê nome ao seu e-commerce e marque sua localização no mapa brasileiro.</p>
                  </div>
                </div>
                <button
                  onClick={() => { playSound.click(); setShowCreateStorePanel(false); }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {storeFormError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{storeFormError}</span>
                </div>
              )}

              {storeFormSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-600 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{storeFormSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateStore} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Loja Gamer *</label>
                    <input
                      type="text"
                      placeholder="Ex: Arena Afiliados do Tiago"
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Descrição / Slogan da Loja *</label>
                    <textarea
                      rows={3}
                      placeholder="Diga aos visitantes quais produtos você indica (ex: mouses rápidos, configs de hardware para CS2, etc.)"
                      value={newStoreDesc}
                      onChange={(e) => setNewStoreDesc(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400 outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cidade Sede (Mapa) *</label>
                      <select
                        value={newStoreCity}
                        onChange={(e) => handleFormCityChange(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400 outline-none font-bold"
                      >
                        {MAJOR_BRAZILIAN_CITIES.map((c, i) => (
                          <option key={i} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Estilo do Banner</label>
                      <select
                        value={newStoreBanner}
                        onChange={(e) => setNewStoreBanner(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400 outline-none text-slate-700"
                      >
                        <option value="bg-gradient-to-r from-indigo-600 to-indigo-800">🌌 Espacial (Indigo)</option>
                        <option value="bg-gradient-to-r from-purple-600 to-pink-700">🔮 Cyberpunk (Roxo)</option>
                        <option value="bg-gradient-to-r from-emerald-600 to-teal-850">🌿 Esmeralda (Verde)</option>
                        <option value="bg-gradient-to-r from-yellow-550 to-orange-650">🔥 Vulcânico (Laranja)</option>
                        <option value="bg-gradient-to-r from-slate-800 to-slate-950">🕶️ Dark Carbon (Preto)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-[11px] text-indigo-950 leading-relaxed space-y-1">
                    <p className="font-bold flex items-center gap-1">📍 Coordenadas no Radar:</p>
                    <p>Sua loja será georreferenciada nas coordenadas: <strong>Lat: {newStoreLat}</strong>, <strong>Lng: {newStoreLng}</strong>.</p>
                    <p className="text-slate-500 text-[10px]">As coordenadas são simuladas automaticamente ao redor da sua cidade para criar um visual espetacular no mapa.</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-yellow-400 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer border border-yellow-400"
                  >
                    🚀 Inaugurar Minha Vitrine Gamer
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILTER CONTROLS & MAP HEADER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm md:text-base font-black text-slate-900 uppercase flex items-center gap-1.5">
              <Compass className="w-5 h-5 text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} />
              Radar de Lojas Gamer &amp; Afiliados
            </h4>
            <p className="text-xs text-slate-500">
              Filtre as lojas e produtos pela distância física para ver quem está mais próximo de você.
            </p>
          </div>

          {/* Quick Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Center City selection */}
            <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono shrink-0">CENTRO:</span>
              <select
                value={selectedCityName}
                onChange={(e) => handleFilterCityChange(e.target.value)}
                className="bg-transparent border-0 outline-none text-xs font-black cursor-pointer text-slate-800"
              >
                {MAJOR_BRAZILIAN_CITIES.map((c, i) => (
                  <option key={i} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Distance Slider */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border min-w-[200px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono shrink-0">RAIO:</span>
              <input
                type="range"
                min="100"
                max="3000"
                step="100"
                value={distanceRange}
                onChange={(e) => { playSound.click(); setDistanceRange(Number(e.target.value)); }}
                className="flex-1 h-1 accent-indigo-600 bg-slate-200 rounded-lg outline-none cursor-pointer"
              />
              <span className="text-xs font-bold text-indigo-600 font-mono shrink-0">{distanceRange} km</span>
            </div>
          </div>
        </div>

        {/* THE MAP SECTION */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-950 relative h-[380px] md:h-[450px]">
          
          {hasValidKey ? (
            /* REAL GOOGLE MAP */
            <APIProvider apiKey={API_KEY} version="weekly">
              <GoogleMap
                center={mapCenter}
                zoom={distanceRange > 1500 ? 4 : distanceRange > 500 ? 5 : 8}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
              >
                {/* User Active Center marker */}
                <AdvancedMarker position={mapCenter}>
                  <Pin background="#4F46E5" glyphColor="#fff" scale={1.2}>
                    <span className="text-[10px]">📍</span>
                  </Pin>
                </AdvancedMarker>

                {/* Filtered Stores pins */}
                {filteredStores.map((store) => (
                  <AdvancedMarker 
                    key={store.id} 
                    position={{ lat: store.latitude, lng: store.longitude }}
                    onClick={() => { playSound.click(); setActiveInfoWindowStoreId(store.id); }}
                  >
                    <Pin background="#F59E0B" glyphColor="#0f172a" scale={1.1}>
                      <span className="text-[11px] font-bold">{store.userAvatar}</span>
                    </Pin>
                  </AdvancedMarker>
                ))}

                {/* InfoWindow popup */}
                {activeInfoWindowStoreId && (() => {
                  const infoStore = stores.find(s => s.id === activeInfoWindowStoreId);
                  if (!infoStore) return null;
                  return (
                    <InfoWindow 
                      position={{ lat: infoStore.latitude, lng: infoStore.longitude }}
                      onCloseClick={() => setActiveInfoWindowStoreId(null)}
                    >
                      <div className="p-1 font-sans text-slate-800 text-left max-w-[200px] space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg">{infoStore.userAvatar}</span>
                          <h5 className="font-bold text-xs truncate text-indigo-950 leading-snug">{infoStore.name}</h5>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{infoStore.description}</p>
                        <div className="flex items-center justify-between text-[8px] text-slate-400 pt-1 border-t">
                          <span>Sede: {infoStore.city}</span>
                          <span className="font-bold text-yellow-600">★ 4.9</span>
                        </div>
                        <button
                          onClick={() => { playSound.click(); setSelectedStore(infoStore); setShowStoreProductsModal(true); }}
                          className="w-full py-1 bg-indigo-600 text-white rounded text-[10px] font-bold uppercase transition-all text-center hover:bg-indigo-500"
                        >
                          Ver Produtos 🛒
                        </button>
                      </div>
                    </InfoWindow>
                  );
                })()}
              </GoogleMap>
            </APIProvider>
          ) : (
            /* HIGH-FIDELITY GAMEZONE INTERACTIVE FALLBACK RADAR MAP */
            <div className="w-full h-full relative overflow-hidden bg-slate-950 flex flex-col justify-between p-4" id="fallback-radar-map">
              {/* Radar Grid Lines */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="absolute w-[80%] aspect-square border-2 border-indigo-500 rounded-full animate-pulse" />
                <div className="absolute w-[50%] aspect-square border border-indigo-500/80 rounded-full" />
                <div className="absolute w-[20%] aspect-square border border-indigo-500/40 rounded-full" />
                <div className="absolute h-full w-[1px] bg-indigo-500" />
                <div className="absolute w-full h-[1px] bg-indigo-500" />
              </div>

              {/* Glowing sweep effect */}
              <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg_at_center,_indigo-600_0deg,_transparent_90deg)] opacity-10 pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-spin" style={{ animationDuration: '8s' }} />

              {/* Map instructions & Google Key Warning */}
              <div className="relative z-10 max-w-sm self-start bg-slate-900/90 border border-indigo-500/30 rounded-xl p-3 text-[10px] text-slate-300 leading-normal space-y-1.5 shadow-xl">
                <p className="font-bold text-yellow-400 flex items-center gap-1 uppercase tracking-wide">
                  <Compass className="w-3.5 h-3.5" /> Radar Gamer em Alta Definição
                </p>
                <p>Mostrando as lojas afiliadas ativas do Brasil. Você pode clicar nas lojas diretamente na tela para explorar.</p>
                <div className="text-[9px] text-slate-500 bg-slate-950 p-1.5 rounded border border-slate-800">
                  💡 <strong>Para ativar Google Maps Real:</strong> Acesse as Configurações (⚙️ no topo direito) → Secrets → crie <code>GOOGLE_MAPS_PLATFORM_KEY</code> com sua chave de API!
                </div>
              </div>

              {/* Interactive Fallback Map canvas with stores */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Custom animated pins relative placement */}
                {filteredStores.map((st, idx) => {
                  // Project latitude/longitude visually relative to São Paulo center
                  const scaleLat = 20;
                  const scaleLng = 25;
                  const leftPercent = 50 + (st.longitude - mapCenter.lng) * scaleLng;
                  const topPercent = 50 - (st.latitude - mapCenter.lat) * scaleLat;

                  // Constrain to visual map bounds
                  const leftClamped = Math.max(10, Math.min(90, leftPercent));
                  const topClamped = Math.max(15, Math.min(85, topPercent));

                  const isSelected = selectedStore?.id === st.id;

                  return (
                    <button
                      key={st.id}
                      onClick={() => { playSound.click(); setSelectedStore(st); }}
                      style={{ left: `${leftClamped}%`, top: `${topClamped}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
                    >
                      {/* Pulse ring */}
                      <span className="absolute -inset-2.5 bg-yellow-400/20 rounded-full animate-ping pointer-events-none" />
                      
                      {/* Store Avatar PIN */}
                      <div className={`w-10 h-10 rounded-full border-2 bg-slate-900 shadow-lg flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-yellow-400 scale-110 shadow-yellow-500/30' 
                          : 'border-indigo-500 hover:border-yellow-400 hover:scale-105'
                      }`}>
                        <span className="text-lg">{st.userAvatar}</span>
                      </div>

                      {/* Tooltip Label */}
                      <div className="absolute top-11 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 text-white py-1 px-2.5 rounded text-[9px] font-bold font-mono tracking-wide truncate max-w-[120px] shadow-2xl opacity-80 group-hover:opacity-100 transition-opacity">
                        {st.name.split(' ')[0]}
                      </div>
                    </button>
                  );
                })}

                {/* Marker for current search center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none">
                  <div className="w-5 h-5 bg-indigo-600/30 border border-indigo-400 rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                  </div>
                  <span className="text-[8px] bg-indigo-600 text-white font-bold py-0.5 px-1 rounded-md mt-1 shadow-md uppercase font-mono">SEU CENTRO</span>
                </div>
              </div>

              {/* Fallback footer active panel */}
              <div className="relative z-10 w-full bg-slate-900/95 border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl text-left">
                {selectedStore ? (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">{selectedStore.userAvatar}</span>
                        <h5 className="font-extrabold text-xs text-white uppercase tracking-wider">{selectedStore.name}</h5>
                        <span className="bg-indigo-950 text-indigo-400 text-[8px] font-mono border border-indigo-850 px-1.5 rounded-md">Sede: {selectedStore.city}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 leading-normal">{selectedStore.description}</p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => { playSound.click(); setShowStoreProductsModal(true); }}
                        className="flex-1 sm:flex-initial px-4 py-1.5 bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Explorar Loja
                      </button>
                      <button
                        onClick={() => { playSound.click(); setSelectedStore(null); }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-slate-400 font-medium text-center w-full py-1">
                    🔍 Clique em qualquer uma das lojas de parceiros no radar acima para ver suas vitrines de afiliados!
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* STORES SHOWCASE DIRECTORY LIST */}
      <div className="space-y-4">
        <h4 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
          <Store className="w-5 h-5 text-indigo-600" />
          Diretório de Lojas Afiliadas Ativas ({filteredStores.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredStores.map((st) => {
            const storeProds = products.filter(p => p.storeId === st.id);
            const distKm = calculateDistance(mapCenter.lat, mapCenter.lng, st.latitude, st.longitude);
            const isOwner = loggedInUser && (st.userId === loggedInUser.uid || st.userId === loggedInUser.email);

            return (
              <div
                key={st.id}
                onClick={() => { playSound.click(); setSelectedStore(st); }}
                className={`relative bg-white border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-400 transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  selectedStore?.id === st.id ? 'border-2 border-indigo-600 ring-4 ring-indigo-600/5' : 'border-slate-200'
                }`}
              >
                {/* Banner header color */}
                <div className={`h-12 w-full ${st.bannerColor} relative p-3 flex items-center justify-between`}>
                  <span className="text-[9px] font-mono font-bold tracking-widest text-white bg-slate-950/40 px-2 py-0.5 rounded-full">
                    AFILIADOS SÉRIE PRO
                  </span>
                  
                  {isOwner && (
                    <span className="bg-yellow-400 text-slate-950 text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow">
                      Minha Loja
                    </span>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl bg-slate-100 p-1.5 rounded-2xl border">{st.userAvatar}</span>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 text-sm leading-tight truncate">{st.name}</h4>
                        <span className="text-[10px] text-indigo-600 font-mono font-bold">Por {st.userName.split(' ')[0]}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {st.description}
                    </p>
                  </div>

                  {/* Info stats */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 font-bold text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-red-500" /> Sede: {st.city}
                    </span>
                    <span className="bg-slate-50 border px-1.5 py-0.5 rounded-md font-bold text-indigo-600 shrink-0">
                      {distKm.toFixed(0)} km de você
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); playSound.click(); setSelectedStore(st); setShowStoreProductsModal(true); }}
                      className="flex-1 py-2 bg-slate-950 hover:bg-slate-900 text-yellow-400 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all border border-yellow-400"
                    >
                      🛒 Ver Vitrine ({storeProds.length})
                    </button>
                    
                    {isOwner && (
                      <button
                        onClick={(e) => { e.stopPropagation(); playSound.click(); setSelectedStore(st); setShowStoreProductsModal(true); setShowCreateProductPanel(true); }}
                        className="px-2.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl border border-indigo-100 cursor-pointer transition-colors"
                        title="Cadastrar Produto Afiliado"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SINGLE STORE PRODUCTS EXPLORE DRAWER MODAL */}
      <AnimatePresence>
        {showStoreProductsModal && selectedStore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border-2 border-indigo-600 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col text-left"
            >
              {/* Header with store info */}
              <div className={`p-6 ${selectedStore.bannerColor} text-white shrink-0 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">{selectedStore.userAvatar}</span>
                    <div>
                      <h3 className="text-lg md:text-xl font-black uppercase tracking-tight leading-none">{selectedStore.name}</h3>
                      <p className="text-xs text-indigo-200 mt-1 font-mono">Inaugurada por {selectedStore.userName} | Sede: {selectedStore.city}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-200 max-w-2xl leading-relaxed">{selectedStore.description}</p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {loggedInUser && (selectedStore.userId === loggedInUser.uid || selectedStore.userId === loggedInUser.email) && (
                    <button
                      onClick={() => { playSound.click(); setShowCreateProductPanel(!showCreateProductPanel); }}
                      className="px-3.5 py-2 bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 shadow-md transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Produto
                    </button>
                  )}
                  <button
                    onClick={() => { playSound.click(); setShowStoreProductsModal(false); }}
                    className="p-2 bg-slate-950/40 hover:bg-slate-950/60 text-white rounded-xl cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CREATE PRODUCT FORM PANEL FOR THIS STORE */}
              {showCreateProductPanel && (
                <div className="p-6 border-b border-slate-200 bg-slate-50/80 max-h-[40vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b mb-4">
                    <h4 className="text-xs font-black uppercase text-indigo-900 tracking-wider flex items-center gap-1">
                      <PlusCircle className="w-4 h-4 text-indigo-600" /> Cadastrar Novo Produto de Afiliado nesta Loja
                    </h4>
                    <button 
                      onClick={() => setShowCreateProductPanel(false)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>

                  {prodFormError && (
                    <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
                      {prodFormError}
                    </div>
                  )}
                  {prodFormSuccess && (
                    <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-600 font-bold">
                      {prodFormSuccess}
                    </div>
                  )}

                  <form onSubmit={handleAddProductToStore} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Título do Produto Gamer *</label>
                        <input
                          type="text"
                          placeholder="Ex: Mouse Mecânico Pro 24000DPI"
                          value={newProdTitle}
                          onChange={(e) => setNewProdTitle(e.target.value)}
                          className="w-full p-2 bg-white border rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Preço (R$) *</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Ex: 249.90"
                            value={newProdPrice}
                            onChange={(e) => setNewProdPrice(e.target.value)}
                            className="w-full p-2 bg-white border rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Desconto (%)</label>
                          <input
                            type="number"
                            placeholder="Ex: 10"
                            value={newProdDiscount}
                            onChange={(e) => setNewProdDiscount(e.target.value)}
                            className="w-full p-2 bg-white border rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Link de Afiliado Seguro *</label>
                        <input
                          type="text"
                          placeholder="Ex: https://mercadolivre.com.br/item..."
                          value={newProdLink}
                          onChange={(e) => setNewProdLink(e.target.value)}
                          className="w-full p-2 bg-white border rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Plataforma *</label>
                          <select
                            value={newProdPlatform}
                            onChange={(e) => setNewProdPlatform(e.target.value)}
                            className="w-full p-2 bg-white border rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-bold"
                          >
                            <option value="Mercado Livre">Mercado Livre</option>
                            <option value="Amazon Brasil">Amazon Brasil</option>
                            <option value="Shopee Brasil">Shopee Brasil</option>
                            <option value="Kabum">Kabum</option>
                            <option value="AliExpress">AliExpress</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Categoria *</label>
                          <select
                            value={newProdCategory}
                            onChange={(e) => setNewProdCategory(e.target.value)}
                            className="w-full p-2 bg-white border rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-bold"
                          >
                            <option value="perifericos">⌨️ Periféricos</option>
                            <option value="hardwares">⚙️ Hardware</option>
                            <option value="cadeiras">💺 Cadeiras</option>
                            <option value="consoles">🎮 Consoles</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">URL Imagem ou escolha predefinida:</label>
                        <input
                          type="text"
                          placeholder="Cole link de imagem..."
                          value={newProdImg}
                          onChange={(e) => setNewProdImg(e.target.value)}
                          className="w-full p-2 bg-white border rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {PRESET_STORE_IMAGES.slice(0, 4).map((im, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectFormImg(im.url)}
                              className={`px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 border text-[9px] font-semibold ${
                                newProdImg === im.url ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-300'
                              }`}
                            >
                              {im.name.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] rounded-lg uppercase tracking-wider transition-colors shadow cursor-pointer mt-1"
                      >
                        🚀 Publicar Produto de Afiliado
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Vitrine Products grid inside the store */}
              <div className="flex-1 overflow-y-auto p-6">
                {products.filter(p => p.storeId === selectedStore.id).length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-700">Nenhum produto cadastrado nesta vitrine ainda</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">Adicione produtos de afiliados com seus links para que outros usuários possam encontrá-los e comprar!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.filter(p => p.storeId === selectedStore.id).map((prod) => {
                      const discPrice = prod.price * (1 - prod.discount / 100);
                      const isOwner = loggedInUser && (selectedStore.userId === loggedInUser.uid || selectedStore.userId === loggedInUser.email);

                      return (
                        <div 
                          key={prod.id}
                          className="group bg-slate-50 border border-slate-200/60 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                        >
                          <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                            <img
                              src={prod.imageUrl}
                              alt={prod.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover opacity-90 group-hover:scale-103 transition-transform"
                            />
                            {prod.discount > 0 && (
                              <span className="absolute top-2.5 left-2.5 bg-yellow-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded shadow">
                                🔥 {prod.discount}% OFF
                              </span>
                            )}

                            {isOwner && (
                              <button
                                onClick={(e) => handleDeleteAffProduct(prod.id, e)}
                                className="absolute top-2.5 right-2.5 p-1.5 bg-red-650 text-white rounded-lg hover:bg-red-550 shadow transition-colors cursor-pointer"
                                title="Excluir Produto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[9px] text-slate-400">
                                <span className="uppercase font-bold tracking-wider text-slate-500 font-mono">{prod.platform}</span>
                                <span className="text-amber-500 font-bold">★ {prod.rating}</span>
                              </div>
                              <h4 className="text-xs font-black text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                {prod.title}
                              </h4>
                              <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed h-7">
                                {prod.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                              <div>
                                {prod.discount > 0 && <span className="text-[9px] text-slate-400 line-through block">De R$ {prod.price.toFixed(2)}</span>}
                                <span className="text-xs font-black text-slate-900 font-mono">
                                  R$ {discPrice.toFixed(2)}
                                </span>
                              </div>

                              <button
                                onClick={() => handleOpenAffLink(prod)}
                                className="px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black text-[10px] rounded-lg flex items-center gap-1.5 cursor-pointer border border-yellow-500"
                              >
                                Ver Link <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Close footer */}
              <div className="p-4 bg-slate-50 border-t shrink-0 flex items-center justify-end">
                <button
                  onClick={() => setShowStoreProductsModal(false)}
                  className="px-5 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300 cursor-pointer"
                >
                  Fechar Vitrine
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AFFILIATE EXTERNAL REDIRECT MODAL FOR STORES */}
      <AnimatePresence>
        {activeAffProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-2 border-yellow-400 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-left space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-400 text-slate-950 rounded-xl shrink-0">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase">Redirecionamento Afiliado Parceiro</h3>
                  <p className="text-[9px] font-mono text-slate-400">VITRINE DE PARCEIROS CERTIFICADOS</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-normal">
                Você será direcionado com segurança para o anúncio oficial do vendedor em <strong>{activeAffProduct.platform}</strong>.
              </p>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 text-[11px] text-slate-500 space-y-2 leading-relaxed">
                <p>🛒 <strong>Faturamento de Afiliados:</strong> Ao finalizar a compra neste link, o proprietário desta loja receberá <strong>10% de faturamento em dinheiro real (R$ {(activeAffProduct.price * 0.1).toFixed(2)})</strong> creditados instantaneamente no saldo da conta do jogo!</p>
                <p className="text-[10px] text-indigo-600 font-bold bg-indigo-50 p-1.5 rounded-lg border border-indigo-100">💡 Como jogador e desenvolvedor, apoie a vitrine dos seus amigos e parceiros da Arena de Jogos!</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setActiveAffProduct(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirmAffLinkVisit}
                  className="flex-1 py-2 bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-yellow-500 shadow-md"
                >
                  Ir para Loja Oficial <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
