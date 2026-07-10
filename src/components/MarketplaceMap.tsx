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
  Award,
  Search,
  MessageSquare,
  ThumbsUp,
  Tag
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
  const [stores, setStores] = useState<UserStore[]>(INITIAL_STORES);
  const [products, setProducts] = useState<AffiliateProduct[]>(INITIAL_PRODUCTS);

  const fetchMarketplaceStores = async () => {
    try {
      const res = await fetch('/api/marketplace/stores');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.stores)) {
          const fetchedStores = data.stores.length > 0 ? data.stores : INITIAL_STORES;
          setStores(fetchedStores);
          
          const allProducts: AffiliateProduct[] = [];
          fetchedStores.forEach((st: any) => {
            if (Array.isArray(st.products)) {
              allProducts.push(...st.products);
            }
          });
          
          const finalProducts = allProducts.length > 0 ? allProducts : INITIAL_PRODUCTS;
          setProducts(finalProducts);
        }
      }
    } catch (e) {
      console.error('Error fetching marketplace stores:', e);
    }
  };

  useEffect(() => {
    fetchMarketplaceStores();
  }, [loggedInUser]);

  // View States
  const [selectedStore, setSelectedStore] = useState<UserStore | null>(null);
  const [showStoreProductsModal, setShowStoreProductsModal] = useState<boolean>(false);
  const [showCreateStorePanel, setShowCreateStorePanel] = useState<boolean>(false);
  const [showCreateProductPanel, setShowCreateProductPanel] = useState<boolean>(false);

  // Enhanced Storefront & Facade states
  const [searchStoreQuery, setSearchStoreQuery] = useState('');
  const [selectedStoreCategory, setSelectedStoreCategory] = useState('todos');
  const [activeStoreSubTab, setActiveStoreSubTab] = useState<'produtos' | 'chat' | 'cupons'>('produtos');
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  
  const [storeLikes, setStoreLikes] = useState<Record<string, number>>(() => {
    const cached = localStorage.getItem('gamezone_store_likes');
    return cached ? JSON.parse(cached) : {
      'store-saopaulo': 48,
      'store-riodejaneiro': 35,
      'store-curitiba': 52
    };
  });

  const [likedStores, setLikedStores] = useState<string[]>(() => {
    const cached = localStorage.getItem('gamezone_user_liked_stores');
    return cached ? JSON.parse(cached) : [];
  });

  const [chatMessages, setChatMessages] = useState<Array<{sender: 'user' | 'owner', text: string, time: string}>>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    localStorage.setItem('gamezone_user_liked_stores', JSON.stringify(likedStores));
  }, [likedStores]);

  // Reset search and category, and set initial greeting when a store is opened
  useEffect(() => {
    if (selectedStore) {
      setSearchStoreQuery('');
      setSelectedStoreCategory('todos');
      setActiveStoreSubTab('produtos');
      setChatMessages([
        { 
          sender: 'owner', 
          text: `Olá! Bem-vindo à fachada oficial da minha loja "${selectedStore.name}". Sinta-se à vontade para tirar dúvidas clicando nos botões de chat ou explore nossa vitrine abaixo! 🛒✨`, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
    }
  }, [selectedStore]);

  const handleLikeStore = (storeId: string) => {
    playSound.click();
    if (likedStores.includes(storeId)) {
      setLikedStores(prev => prev.filter(id => id !== storeId));
      setStoreLikes(prev => {
        const updated = { ...prev, [storeId]: Math.max(0, (prev[storeId] || 0) - 1) };
        localStorage.setItem('gamezone_store_likes', JSON.stringify(updated));
        return updated;
      });
      addLog('earn', `Removeu curtida da loja de afiliado`, 0, 'coins');
    } else {
      setLikedStores(prev => [...prev, storeId]);
      setStoreLikes(prev => {
        const updated = { ...prev, [storeId]: (prev[storeId] || 0) + 1 };
        localStorage.setItem('gamezone_store_likes', JSON.stringify(updated));
        return updated;
      });
      // Reward the user 5 coins for liking a store!
      updateStats(prev => ({ ...prev, coins: prev.coins + 5 }));
      addLog('earn', `Curtiu a loja gamer de afiliado! Ganhou +5 moedas.`, 5, 'coins');
    }
  };

  const PREDEFINED_QUESTIONS = [
    { id: 'frete', label: '🚚 O frete é grátis?', reply: 'Sim! Quase todas as minhas indicações têm o selo de Frete Grátis pelo parceiro de envio. Aproveite para economizar!' },
    { id: 'estoque', label: '📦 Tem em estoque?', reply: 'Com certeza! Só recomendo produtos que estão com estoque ativo e envio imediato pelas maiores varejistas do Brasil.' },
    { id: 'seguro', label: '🔒 É realmente seguro comprar?', reply: '100% seguro! Você compra direto no site oficial (Amazon, Mercado Livre, Kabum), com garantia de entrega e devolução.' },
    { id: 'desconto', label: '🔥 Consigo cupom extra?', reply: 'Sim! Use o cupom "ARENAGAMER" no fechamento do pedido na loja parceira para tentar descontos especiais de parceiros.' }
  ];

  const handleSendPredefinedQuestion = (text: string, reply: string) => {
    playSound.click();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user question
    setChatMessages(prev => [...prev, { sender: 'user', text, time: timeStr }]);
    setIsTyping(true);

    // Simulate store owner replying with realistic latency
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        sender: 'owner', 
        text: reply, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
      setIsTyping(false);
    }, 1200);
  };

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
    // Strict business rule: User must be an active VIP member with a monthly subscription
    if (!stats?.isVip) {
      playSound.tick();
      setStoreFormError('⚠️ ASSINATURA VIP NECESSÁRIA! Você precisa ser um assinante VIP ativo para abrir sua própria loja virtual de afiliados na plataforma.');
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
    const newStore: UserStore & { products: AffiliateProduct[] } = {
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
      createdAt: new Date().toISOString(),
      products: []
    };

    setStores(prev => [newStore, ...prev]);

    // Persist to the SQLite database under user's profile detail "lojas" field
    fetch('/api/user/profile/details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: loggedInUser.uid || loggedInUser.email,
        stores: [newStore]
      })
    }).then(() => {
      fetchMarketplaceStores();
    }).catch(err => {
      console.error('Error saving store to backend:', err);
    });

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

    const updatedStore = {
      ...currentUserStore,
      products: [newProd, ...(currentUserStore.products || [])]
    };

    setProducts(prev => [newProd, ...prev]);

    // Persist to SQLite
    fetch('/api/user/profile/details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: loggedInUser.uid || loggedInUser.email,
        stores: [updatedStore]
      })
    }).then(() => {
      fetchMarketplaceStores();
    }).catch(err => {
      console.error('Error updating store products in backend:', err);
    });

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
    if (!currentUserStore) return;
    if (confirm('Deseja realmente remover este produto da sua vitrine de afiliado?')) {
      const updatedStore = {
        ...currentUserStore,
        products: (currentUserStore.products || []).filter(p => p.id !== prodId)
      };

      setProducts(prev => prev.filter(p => p.id !== prodId));

      fetch('/api/user/profile/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: loggedInUser.uid || loggedInUser.email,
          stores: [updatedStore]
        })
      }).then(() => {
        fetchMarketplaceStores();
      }).catch(err => {
        console.error('Error deleting store product in backend:', err);
      });
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
      {!(showStoreProductsModal && selectedStore) && (
        <>
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
      </>)}

      {/* SINGLE STORE PRODUCTS EXPLORE PAGE (IMPROVED PREMIUM STOREFRONT & VISUAL FACADE) */}
      <AnimatePresence mode="wait">
        {showStoreProductsModal && selectedStore && (() => {
          const storeProducts = products.filter(p => p.storeId === selectedStore.id);
          const filteredProducts = storeProducts.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchStoreQuery.toLowerCase()) || 
                                  p.description.toLowerCase().includes(searchStoreQuery.toLowerCase());
            const matchesCategory = selectedStoreCategory === 'todos' || p.category === selectedStoreCategory;
            return matchesSearch && matchesCategory;
          });

          // Determine dynamic physical awning (toldo) colors based on selected store branding
          const getAwningStripes = (banner: string) => {
            if (banner.includes('purple') || banner.includes('pink')) {
              return { main: 'bg-purple-600', stripe: 'bg-pink-100', text: 'text-purple-400', border: 'border-purple-600' };
            }
            if (banner.includes('emerald') || banner.includes('teal')) {
              return { main: 'bg-emerald-600', stripe: 'bg-emerald-100', text: 'text-emerald-400', border: 'border-emerald-600' };
            }
            if (banner.includes('yellow') || banner.includes('orange')) {
              return { main: 'bg-amber-500', stripe: 'bg-yellow-100', text: 'text-amber-500', border: 'border-amber-500' };
            }
            if (banner.includes('slate') || banner.includes('dark')) {
              return { main: 'bg-slate-800', stripe: 'bg-slate-200', text: 'text-slate-400', border: 'border-slate-850' };
            }
            return { main: 'bg-indigo-600', stripe: 'bg-indigo-100', text: 'text-indigo-400', border: 'border-indigo-600' };
          };

          const colors = getAwningStripes(selectedStore.bannerColor);
          const isOwner = loggedInUser && (selectedStore.userId === loggedInUser.uid || selectedStore.userId === loggedInUser.email);
          const currentLikes = storeLikes[selectedStore.id] || 0;
          const userHasLiked = likedStores.includes(selectedStore.id);

          return (
            <div className="space-y-6">
              {/* Navigational Back Button / Breadcrumbs */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg animate-fadeIn">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { playSound.click(); setShowStoreProductsModal(false); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all hover:scale-[1.02] shadow-md border border-yellow-500"
                  >
                    ← Voltar para o Radar de Lojas
                  </button>
                  <span className="text-slate-600 font-mono text-xs">/</span>
                  <span className="text-yellow-400/90 font-mono text-xs uppercase tracking-wider font-extrabold hidden sm:inline">Vitrine Virtual</span>
                </div>
                <div className="text-right text-xs text-slate-400 font-mono">
                  Loja ID: <span className="text-yellow-400 font-bold">{selectedStore.id}</span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className={`bg-white border-2 ${colors.border} rounded-3xl w-full overflow-hidden shadow-2xl flex flex-col text-left`}
              >
                {/* 1. PHYSICAL FACADE RETRO AWNING (Toldo Listrado Gamer) */}
                <div className="relative w-full h-7 overflow-hidden flex shrink-0 z-20 shadow-md">
                  <div className="absolute inset-0 flex">
                    {[...Array(20)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 h-full transform -skew-x-12 ${
                          i % 2 === 0 ? colors.main : colors.stripe
                        }`} 
                      />
                    ))}
                  </div>
                  {/* Facade wave trim */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-950/10 backdrop-blur-xs flex">
                    {[...Array(20)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 h-2 rounded-b-full ${colors.main} -mt-0.5`} 
                      />
                    ))}
                  </div>
                </div>

                {/* 2. FACHADA DA LOJA: Main Visual Banner Header */}
                <div className={`p-6 ${selectedStore.bannerColor} text-white shrink-0 relative flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-white/10`}>
                  
                  {/* Subtle Neon Glow Grid Overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.03)_1px,_transparent_1px)] bg-[size:16px_16px] opacity-20 pointer-events-none" />

                  <div className="space-y-3 z-10">
                    <div className="flex items-center gap-3.5">
                      <span className="text-4xl bg-white/15 p-2 rounded-2xl backdrop-blur-lg border border-white/25 flex items-center justify-center shadow-lg">
                        {selectedStore.userAvatar}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none text-white drop-shadow-sm">
                            {selectedStore.name}
                          </h3>
                          
                          {/* Glowing Online indicator */}
                          <span className="bg-emerald-500 text-slate-950 text-[8px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /> LOJA ABERTA
                          </span>
                        </div>
                        
                        <p className="text-xs text-white/80 mt-1 font-mono flex items-center gap-1">
                          <span>Inaugurada por <strong>{selectedStore.userName}</strong></span>
                          <span>•</span>
                          <span className="text-yellow-300 font-bold">★ 4.9 (Excelente)</span>
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-100 max-w-2xl leading-relaxed italic opacity-95">
                      "{selectedStore.description}"
                    </p>
                  </div>

                  {/* Fachada Fast Interaction Controls */}
                  <div className="shrink-0 flex flex-wrap items-center gap-2.5 z-10 bg-slate-950/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/10">
                    
                    {/* Thumbs up Like counter */}
                    <button
                      onClick={() => handleLikeStore(selectedStore.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                        userHasLiked
                          ? 'bg-yellow-400 text-slate-950 scale-103'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                      }`}
                      title="Curtir Loja & Ganhar Recompensa"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 shrink-0" />
                      <span>{currentLikes} Curtidas</span>
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => { playSound.click(); setShowCreateProductPanel(!showCreateProductPanel); }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow-md transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Indicar Produto
                      </button>
                    )}

                    <button
                      onClick={() => { playSound.click(); setShowStoreProductsModal(false); }}
                      className="p-1.5 bg-slate-950/40 hover:bg-slate-950/60 text-white rounded-xl cursor-pointer transition-colors"
                      title="Fechar Vitrine"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 3. STOREFRONT NAVIGATION SUB-TABS */}
                <div className="flex bg-slate-100 border-b border-slate-200 shrink-0">
                  <button
                    onClick={() => { playSound.click(); setActiveStoreSubTab('produtos'); }}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border-b-2 ${
                      activeStoreSubTab === 'produtos'
                        ? 'border-indigo-600 text-indigo-600 bg-white font-black'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-indigo-600" /> Vitrine Gamer ({filteredProducts.length})
                  </button>
                  <button
                    onClick={() => { playSound.click(); setActiveStoreSubTab('chat'); }}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border-b-2 ${
                      activeStoreSubTab === 'chat'
                        ? 'border-indigo-600 text-indigo-600 bg-white font-black'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600 animate-bounce" /> Fale com o Vendedor
                  </button>
                  <button
                    onClick={() => { playSound.click(); setActiveStoreSubTab('cupons'); }}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border-b-2 ${
                      activeStoreSubTab === 'cupons'
                        ? 'border-indigo-600 text-indigo-600 bg-white font-black'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Tag className="w-4 h-4 text-amber-500" /> Cupons Ativos
                  </button>
                </div>

                {/* CREATE PRODUCT FORM PANEL FOR THIS STORE */}
                {showCreateProductPanel && isOwner && (
                  <div className="p-5 border-b border-slate-200 bg-indigo-50/50 max-h-[35vh] overflow-y-auto shrink-0 animate-fadeIn">
                    <div className="flex items-center justify-between pb-3 border-b border-indigo-100 mb-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5">
                        <PlusCircle className="w-4.5 h-4.5 text-indigo-600" /> Cadastrar Novo Produto de Afiliado nesta Loja
                      </h4>
                      <button 
                        onClick={() => setShowCreateProductPanel(false)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer bg-white px-2 py-0.5 rounded-md shadow-xs border"
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

                    <form onSubmit={handleAddProductToStore} className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                              className="w-full p-2 bg-white border rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
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
                            className="w-full p-2 bg-white border rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[10px]"
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
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">URL Imagem ou escolha rápida:</label>
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

                {/* 4. DYNAMIC SUB-TAB VIEWS */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                  
                  {/* --- SUB-TAB A: VITRINE DE PRODUTOS --- */}
                  {activeStoreSubTab === 'produtos' && (
                    <div className="space-y-6">
                      {/* Products visual filters & Search for fast navigation */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                        
                        {/* Instant Search input */}
                        <div className="relative w-full sm:max-w-xs">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Buscar nesta vitrine..."
                            value={searchStoreQuery}
                            onChange={(e) => setSearchStoreQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        {/* Store category shelf pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto -mx-3 px-3 sm:mx-0 sm:px-0">
                          {[
                            { id: 'todos', label: 'Ver Todos' },
                            { id: 'perifericos', label: '⌨️ Periféricos' },
                            { id: 'hardwares', label: '⚙️ Hardware' },
                            { id: 'cadeiras', label: '💺 Cadeiras' },
                            { id: 'consoles', label: '🎮 Consoles' }
                          ].map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => { playSound.click(); setSelectedStoreCategory(cat.id); }}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-tight whitespace-nowrap cursor-pointer transition-colors ${
                                selectedStoreCategory === cat.id
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Filtered products layout */}
                      {filteredProducts.length === 0 ? (
                        <div className="text-center py-16 space-y-3 bg-white border rounded-3xl p-6 shadow-sm">
                          <ShoppingBag className="w-14 h-14 text-slate-300 mx-auto animate-pulse" />
                          <h4 className="text-sm font-black text-slate-700">Nenhum item encontrado nesta prateleira</h4>
                          <p className="text-xs text-slate-450 max-w-sm mx-auto leading-relaxed">
                            Ajuste os filtros de categoria ou faça outra busca para achar periféricos e hardwares gamer indicados.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredProducts.map((prod) => {
                            const discPrice = prod.price * (1 - prod.discount / 100);
                            
                            return (
                              <div 
                                key={prod.id}
                                className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl hover:border-indigo-400/50 transition-all duration-300 flex flex-col justify-between"
                              >
                                {/* Imagem do produto */}
                                <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                                  <img
                                    src={prod.imageUrl}
                                    alt={prod.title}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover opacity-95 group-hover:scale-105 transition-all duration-500"
                                  />
                                  
                                  {/* Badge de desconto */}
                                  {prod.discount > 0 && (
                                    <span className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-md animate-pulse">
                                      🔥 {prod.discount}% OFF
                                    </span>
                                  )}

                                  {prod.freeShipping && (
                                    <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[8px] font-black px-2 py-0.5 rounded-lg shadow">
                                      🚚 FRETE GRÁTIS
                                    </span>
                                  )}

                                  {isOwner && (
                                    <button
                                      onClick={(e) => handleDeleteAffProduct(prod.id, e)}
                                      className="absolute bottom-3 right-3 p-1.5 bg-red-700/90 text-white rounded-lg hover:bg-red-650 shadow transition-colors cursor-pointer border border-red-500/20"
                                      title="Excluir Produto"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                <div className="p-4.5 space-y-3.5 flex-1 flex flex-col justify-between">
                                  <div className="space-y-1.5 text-left">
                                    <div className="flex justify-between items-center text-[9px]">
                                      <span className="uppercase font-black tracking-widest text-indigo-600 font-mono">
                                        {prod.platform}
                                      </span>
                                      <span className="text-amber-500 font-bold flex items-center gap-0.5">
                                        ★ {prod.rating}
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-black text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                      {prod.title}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed h-7">
                                      {prod.description}
                                    </p>
                                  </div>

                                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <div>
                                      {prod.discount > 0 && (
                                        <span className="text-[9px] text-slate-400 line-through block font-mono">
                                          De R$ {prod.price.toFixed(2)}
                                        </span>
                                      )}
                                      <span className="text-sm font-black text-slate-950 font-mono">
                                        R$ {discPrice.toFixed(2)}
                                      </span>
                                    </div>

                                    <button
                                      onClick={() => handleOpenAffLink(prod)}
                                      className="px-3.5 py-2 bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black text-[10px] rounded-xl flex items-center gap-1 cursor-pointer border border-yellow-500 shadow-md transition-all active:scale-95"
                                    >
                                      Ver Link <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- SUB-TAB B: FALE COM O VENDEDOR (CHAT SIMULATOR) --- */}
                  {activeStoreSubTab === 'chat' && (
                    <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[400px]">
                      
                      {/* Chat header bar */}
                      <div className="bg-slate-900 text-white p-3.5 px-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl bg-white/10 p-1.5 rounded-xl">{selectedStore.userAvatar}</span>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-white leading-none">
                              Suporte {selectedStore.name.split(' ')[0]}
                            </h4>
                            <span className="text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> Online para Dúvidas
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400">Canal Seguro</span>
                      </div>

                      {/* Chat messages viewport */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 text-left flex flex-col">
                        {chatMessages.map((msg, i) => (
                          <div 
                            key={i}
                            className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs flex flex-col ${
                              msg.sender === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none self-end'
                                : 'bg-white border text-slate-800 rounded-tl-none self-start'
                            }`}
                          >
                            <span className="font-semibold block text-[10px] opacity-80 mb-0.5">
                              {msg.sender === 'user' ? 'Você' : selectedStore.userName}
                            </span>
                            <p>{msg.text}</p>
                            <span className="text-[8px] opacity-60 self-end mt-1 font-mono">{msg.time}</span>
                          </div>
                        ))}

                        {/* Typing feedback loader */}
                        {isTyping && (
                          <div className="bg-white border text-slate-800 rounded-2xl rounded-tl-none p-3 text-xs self-start max-w-[200px] flex items-center gap-1 shadow-xs font-mono">
                            <span className="text-slate-400">{selectedStore.userName} está digitando</span>
                            <span className="animate-bounce">.</span>
                            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                            <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
                          </div>
                        )}
                      </div>

                      {/* Predefined Instant Smart Questions for Fast UI Navigation */}
                      <div className="bg-slate-100 p-3.5 border-t shrink-0">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 font-mono">
                          ⚡ Clique em uma pergunta para obter resposta instantânea:
                        </span>
                        
                        <div className="flex flex-wrap gap-2">
                          {PREDEFINED_QUESTIONS.map((q) => (
                            <button
                              key={q.id}
                              disabled={isTyping}
                              onClick={() => handleSendPredefinedQuestion(q.label, q.reply)}
                              className="px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 hover:text-indigo-600 border rounded-xl text-[10px] font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1 text-left"
                            >
                              <span>❓ {q.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* --- SUB-TAB C: COUPONS & DISCOUNTS --- */}
                  {activeStoreSubTab === 'cupons' && (
                    <div className="max-w-xl mx-auto space-y-4 animate-fadeIn">
                      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 p-5 rounded-3xl shadow-md text-left space-y-1.5 relative overflow-hidden">
                        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 text-7xl opacity-10">🎫</div>
                        <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} /> Cupons de Afiliado Exclusivos
                        </h4>
                        <p className="text-xs leading-relaxed max-w-md font-bold">
                          Copie os códigos promocionais ativos para aplicar no carrinho de compras das lojas parceiras e ganhar descontos adicionais em sua compra!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4.5">
                        {[
                          { code: 'ARENAGAMER', value: '10% OFF', desc: 'Válido em todos os periféricos recomendados nesta vitrine.' },
                          { code: 'TECLADO50', value: 'R$ 50 OFF', desc: 'Válido para compras de teclados mecânicos importados selecionados.' },
                          { code: 'FPSPOWER', value: '5% EXTRA', desc: 'Desconto extra em mouses gamer de alta performance e mousepads.' },
                          { code: 'SETUP2026', value: 'FRETE GRÁTIS', desc: 'Garante frete grátis em qualquer produto de hardware ou cadeira gamer.' }
                        ].map((cup) => (
                          <div 
                            key={cup.code} 
                            className="bg-white border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs hover:border-amber-400 transition-all text-left"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="bg-amber-50 text-amber-600 text-[10px] font-black border border-amber-200 px-2 py-0.5 rounded">
                                  {cup.value}
                                </span>
                                <h5 className="font-extrabold text-xs text-slate-800 tracking-tight">{cup.desc}</h5>
                              </div>
                              <p className="text-[10px] text-slate-400">Cupom de parceria ativa certificado pela Arena Gamer.</p>
                            </div>

                            <button
                              onClick={() => {
                                playSound.click();
                                navigator.clipboard.writeText(cup.code);
                                setCopiedCoupon(cup.code);
                                setTimeout(() => setCopiedCoupon(null), 2000);
                              }}
                              className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-all min-w-[120px] text-center cursor-pointer ${
                                copiedCoupon === cup.code
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-900 hover:bg-slate-850 text-yellow-400 border border-yellow-400/20'
                              }`}
                            >
                              {copiedCoupon === cup.code ? '✓ Copiado!' : `Copiar: ${cup.code}`}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* 5. STOREFRONT FOOTER WITH CLOSE ACTION */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between">
                  <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                    🔒 Conexão segura e autenticada com {selectedStore.userName}'s Storefront
                  </p>
                  
                  <button
                    onClick={() => { playSound.click(); setShowStoreProductsModal(false); }}
                    className="px-6 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
                  >
                    Fechar Loja
                  </button>
                </div>

              </motion.div>
            </div>
          );
        })()}
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
