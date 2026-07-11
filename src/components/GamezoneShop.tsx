import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, 
  Tag, 
  Sparkles, 
  ExternalLink, 
  PlusCircle, 
  Trash2, 
  Search, 
  Truck, 
  CreditCard, 
  ChevronRight, 
  ChevronLeft,
  Globe, 
  Package, 
  Clock, 
  Heart, 
  Info, 
  Share2, 
  Compass,
  ShoppingBag, 
  CheckCircle2, 
  AlertTriangle,
  SlidersHorizontal,
  DollarSign,
  ChevronDown,
  Gift,
  Play,
  Volume2,
  MessageSquare,
  Eye,
  Flame,
  Star,
  Tv,
  Award,
  Bell,
  ThumbsUp,
  Store
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { MarketplaceMap } from './MarketplaceMap';
import { EnterpriseMarketplace } from './EnterpriseMarketplace';

// Custom Type Definitions for the Ecommerce Store
interface EcomProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  type: 'dropship' | 'affiliate';
  platform: string; // e.g. "Mercado Livre", "Amazon", "Shopee", "AliExpress", "Kabum"
  link: string; // Purchase link
  imageUrl: string;
  category: string; // 'perifericos' | 'hardwares' | 'cadeiras' | 'consoles'
  rating: number;
  reviewsCount: number;
  freeShipping: boolean;
  discount: number; // e.g. 10 for 10%
  estimatedDelivery: string;
  stock: number;
  isCustom?: boolean; // added by the user
  isDailyPick?: boolean; // daily handpicked choice
}

// Simulated Video Review item
interface VideoReview {
  id: string;
  title: string;
  creator: string;
  duration: string;
  views: string;
  likes: string;
  imageUrl: string;
  productId: string; // Linked product for quick purchase
  commentsCount: number;
  comments: string[];
}

const PRESET_IMAGES = [
  { name: 'Teclado Mecânico RGB', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400' },
  { name: 'Mouse Gamer Pro', url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=400' },
  { name: 'Placa de Vídeo RTX', url: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=400' },
  { name: 'Cadeira Gamer Carbon', url: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&q=80&w=400' },
  { name: 'PlayStation 5 Slim', url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=400' },
  { name: 'Gamer Headset 7.1', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400' },
  { name: 'Gamer Setup Monitor', url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400' },
];

const INITIAL_PRODUCTS: EcomProduct[] = [
  {
    id: 'prod-teclado-rgb',
    title: 'Teclado Mecânico RGB Stealth Pro Gamer',
    description: 'Teclado de nível competitivo com switches táteis de alta resposta silenciosos, retroiluminação RGB Chroma de 16.8 milhões de cores com controle pelo app e teclas de duplo disparo PBT.',
    price: 249.90,
    type: 'dropship',
    platform: 'Gamezone Express',
    link: '#',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400',
    category: 'perifericos',
    rating: 4.8,
    reviewsCount: 142,
    freeShipping: true,
    discount: 15,
    estimatedDelivery: 'Chega amanhã',
    stock: 24,
    isDailyPick: true
  },
  {
    id: 'prod-mouse-neonx',
    title: 'Mouse Gamer Sem Fio NeonX 16000 DPI UltraLight',
    description: 'Sensor óptico PixArt premium de alta precisão, bateria de longa duração via USB-C e 8 botões totalmente programáveis para macros. Pesa apenas 59 gramas para movimentos incrivelmente rápidos.',
    price: 189.90,
    type: 'affiliate',
    platform: 'Mercado Livre',
    link: 'https://www.mercadolivre.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=400',
    category: 'perifericos',
    rating: 4.9,
    reviewsCount: 310,
    freeShipping: true,
    discount: 10,
    estimatedDelivery: 'Chega em 2 dias',
    stock: 12
  },
  {
    id: 'prod-rtx-4060',
    title: 'Placa de Vídeo RTX 4060 CyberOC Edition 8GB GDDR6',
    description: 'Arquitetura de ponta com Ray Tracing de 3ª geração e DLSS 3 IA. Sistema de refrigeração Tri-Fan de alta dissipação para as melhores temperaturas mesmo durante maratonas de jogos exigentes.',
    price: 2199.00,
    type: 'dropship',
    platform: 'Kabum',
    link: 'https://www.kabum.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=400',
    category: 'hardwares',
    rating: 4.7,
    reviewsCount: 68,
    freeShipping: true,
    discount: 12,
    estimatedDelivery: 'Frete Expresso Grátis',
    stock: 5,
    isDailyPick: true
  },
  {
    id: 'prod-cadeira-carbon',
    title: 'Cadeira Gamer Ergonômica CyberSeat Carbon v2',
    description: 'Estofamento ultra densidade respirável revestido em fibra de carbono, braços reguláveis 4D, inclinação em até 180 graus e almofadas premium de suporte lombar e cervical para conforto absoluto.',
    price: 899.00,
    type: 'affiliate',
    platform: 'Mercado Livre',
    link: 'https://www.mercadolivre.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&q=80&w=400',
    category: 'cadeiras',
    rating: 4.6,
    reviewsCount: 220,
    freeShipping: false,
    discount: 20,
    estimatedDelivery: 'Chega em 5 dias',
    stock: 18
  },
  {
    id: 'prod-ps5-slim',
    title: 'Console PlayStation 5 Slim 1TB SSD Ultra-Fast',
    description: 'Novo design fino e compacto. Experimente tempos de carregamento quase instantâneos com um SSD de ultra-alta velocidade, feedback tátil revolucionário e áudio imersivo 3D Tempest.',
    price: 3699.00,
    type: 'dropship',
    platform: 'Amazon Brasil',
    link: 'https://www.amazon.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=400',
    category: 'consoles',
    rating: 4.9,
    reviewsCount: 540,
    freeShipping: true,
    discount: 8,
    estimatedDelivery: 'Chega em 3 dias',
    stock: 8,
    isDailyPick: true
  },
  {
    id: 'prod-headset-kraken',
    title: 'Headset Gamer Surround 7.1 Kraken Pro Hifi',
    description: 'Drivers magnéticos customizados de 50mm, isolamento acústico superior passivo de ruído e microfone cardioide retrátil profissional ideal para transmissões ao vivo ou chamadas táticas em equipe.',
    price: 349.90,
    type: 'affiliate',
    platform: 'Shopee Brasil',
    link: 'https://shopee.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
    category: 'perifericos',
    rating: 4.5,
    reviewsCount: 198,
    freeShipping: true,
    discount: 18,
    estimatedDelivery: 'Chega em 4 dias',
    stock: 45
  },
  {
    id: 'prod-monitor-odyssey',
    title: 'Monitor Gamer Curvo Odyssey G32 27" Full HD 165Hz',
    description: 'Painel VA de alta fidelidade com curvatura imersiva 1500R, tempo de resposta de 1ms e compatibilidade com AMD FreeSync Premium para gameplay incrivelmente fluida sem rasgos.',
    price: 1249.90,
    type: 'dropship',
    platform: 'Amazon Brasil',
    link: 'https://www.amazon.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400',
    category: 'perifericos',
    rating: 4.8,
    reviewsCount: 204,
    freeShipping: true,
    discount: 15,
    estimatedDelivery: 'Chega amanhã',
    stock: 14,
    isDailyPick: true
  },
  {
    id: 'prod-ryzen-7',
    title: 'Processador AMD Ryzen 7 5700X3D 4.1GHz Cache 100MB',
    description: 'O rei do custo-benefício para jogos. Equipado com a tecnologia inovadora AMD 3D V-Cache para um boost absurdo na taxa de quadros (FPS) em eSports e mundos abertos massivos.',
    price: 1399.00,
    type: 'affiliate',
    platform: 'AliExpress',
    link: 'https://www.aliexpress.com',
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=400',
    category: 'hardwares',
    rating: 4.9,
    reviewsCount: 412,
    freeShipping: true,
    discount: 25,
    estimatedDelivery: 'Chega em 9 dias',
    stock: 22
  },
  {
    id: 'prod-cyberpunk-epic',
    title: 'Jogo Cyberpunk 2077: Ultimate Edition - Epic Games PC',
    description: 'Chave de ativação digital global para resgatar na Epic Games Store. Inclui a expansão aclamada Phantom Liberty e todos os patches e correções tecnológicas da versão 2.1.',
    price: 119.90,
    type: 'affiliate',
    platform: 'Epic Games Store',
    link: 'https://store.epicgames.com',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=400',
    category: 'consoles',
    rating: 4.7,
    reviewsCount: 89,
    freeShipping: true,
    discount: 50,
    estimatedDelivery: 'Envio Digital Imediato ⚡',
    stock: 999
  }
];

const INITIAL_VIDEOS: VideoReview[] = [
  {
    id: 'v-1',
    title: 'Review Completo: Teclado Mecânico RGB Stealth Pro Gamer é bom mesmo?',
    creator: 'Cezar TecReviews 🇧🇷',
    duration: '04:15',
    views: '12.4K',
    likes: '1.2K',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400',
    productId: 'prod-teclado-rgb',
    commentsCount: 34,
    comments: [
      'Switches incrivelmente silenciosos, adorei o review!',
      'Comprei aqui na Gamezone e chegou no dia seguinte, absurdo!',
      'O RGB dele é muito vivo.'
    ]
  },
  {
    id: 'v-2',
    title: 'Unboxing e Teste de Desempenho: RTX 4060 CyberOC em 10 Jogos Pesados',
    creator: 'Patrícia GamerSpace',
    duration: '08:50',
    views: '34.8K',
    likes: '4.1K',
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=400',
    productId: 'prod-rtx-4060',
    commentsCount: 92,
    comments: [
      'Ficou excelente o teste com Ray Tracing e DLSS 3!',
      'Processador Ryzen 7 leva de boa essa placa, ótima recomendação',
      'Minha próxima aquisição de dropshipping com certeza!'
    ]
  },
  {
    id: 'v-3',
    title: 'Vale a pena comprar o PlayStation 5 Slim em 2026? Análise Honesta',
    creator: 'Pixel Central',
    duration: '06:30',
    views: '51.2K',
    likes: '6.5K',
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=400',
    productId: 'prod-ps5-slim',
    commentsCount: 125,
    comments: [
      'O SSD dele carrega os jogos em segundos.',
      'Melhor console da geração disparado.',
      'Comprei o meu usando as moedas acumuladas dos mini-games aqui, muito bom!'
    ]
  }
];

// Live FOMO purchase alerts simulator
const FOMO_ALERTS = [
  { name: 'Lucas S. de Curitiba/PR', action: 'comprou Mouse Gamer NeonX', platform: 'Mercado Livre' },
  { name: 'Tiago J. de São Paulo/SP', action: 'resgatou Monitor Odyssey Curvo', platform: 'via Moedas 🪙' },
  { name: 'Ramon G. de Rio de Janeiro/RJ', action: 'comprou Teclado RGB Stealth Pro', platform: 'Gamezone Express' },
  { name: 'Gabriel M. de Belo Horizonte/MG', action: 'comprou Placa RTX 4060', platform: 'Kabum' },
  { name: 'Juliana P. de Porto Alegre/RS', action: 'resgatou Teclado Mecânico', platform: 'via Moedas 🪙' },
  { name: 'Fernanda L. de Salvador/BA', action: 'comprou Cadeira Seat Carbon v2', platform: 'Mercado Livre' }
];

export const GamezoneShop: React.FC<{
  stats: any;
  updateStats: (updater: (prev: any) => any) => void;
  addLog: (type: any, desc: string, amount: number, currency: 'coins' | 'real') => void;
  loggedInUser?: any;
  onOpenLogin?: () => void;
  realBalance: number;
  setRealBalance: React.Dispatch<React.SetStateAction<number>>;
}> = ({ stats, updateStats, addLog, loggedInUser, onOpenLogin, realBalance, setRealBalance }) => {
  
  // Products storage & lifecycle
  const [products, setProducts] = useState<EcomProduct[]>(() => {
    const cached = localStorage.getItem('gamezone_ecom_products');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Ensure initial defaults exist if empty or cache is stale
        return parsed.length ? parsed : INITIAL_PRODUCTS;
      } catch (e) {
        console.error('Error parsing ecommerce products:', e);
      }
    }
    return INITIAL_PRODUCTS;
  });

  // Save products
  useEffect(() => {
    localStorage.setItem('gamezone_ecom_products', JSON.stringify(products));
  }, [products]);

  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const cached = localStorage.getItem('gamezone_ecom_wishlist');
    return cached ? JSON.parse(cached) : [];
  });

  useEffect(() => {
    localStorage.setItem('gamezone_ecom_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Active filters and query search
  const [activeShopSubTab, setActiveShopSubTab] = useState<'vitrine' | 'marketplace' | 'enterprise'>('enterprise');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'todos' | 'dropship' | 'affiliate'>('todos');
  
  // Create product panel visibility
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  
  // Checkout Modal State
  const [checkoutProduct, setCheckoutProduct] = useState<EcomProduct | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'saldo' | 'moedas'>('saldo');
  
  // Address Info for simulated dropshipping checkout
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  
  // Purchase Success feedback state
  const [successOrder, setSuccessOrder] = useState<{
    id: string;
    product: EcomProduct;
    trackingCode: string;
    finalPrice: number;
    payMethod: string;
  } | null>(null);

  // Affiliate click safety / simulated commission state
  const [affiliateModal, setAffiliateModal] = useState<EcomProduct | null>(null);

  // Video reviews player state
  const [activeVideo, setActiveVideo] = useState<VideoReview | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [videoPlaybackProgress, setVideoPlaybackProgress] = useState<number>(0);
  const [videoVolume, setVideoVolume] = useState<number>(80);
  const [simulatedComments, setSimulatedComments] = useState<string[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');

  // Form states to add custom product (dropshipping & affiliates link pasting)
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'dropship' | 'affiliate'>('dropship');
  const [newPlatform, setNewPlatform] = useState('Mercado Livre');
  const [newLink, setNewLink] = useState('');
  const [newImgUrl, setNewImgUrl] = useState('');
  const [newCategory, setNewCategory] = useState('perifericos');
  const [newDiscount, setNewDiscount] = useState('10');
  const [newShipping, setNewShipping] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Carousel controls
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselProducts = products.filter(p => p.discount >= 15);

  // FOMO simulated active ticker index
  const [activeFomoIndex, setActiveFomoIndex] = useState(0);

  // Countdown timer for Ofertas do Dia (expires tonight)
  const [countdown, setCountdown] = useState({ hours: 14, minutes: 24, seconds: 45 });

  // Carousel Auto scroll
  useEffect(() => {
    if (carouselProducts.length === 0) return;
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % carouselProducts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [carouselProducts.length]);

  // FOMO simulation ticker automatic transition
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFomoIndex(prev => (prev + 1) % FOMO_ALERTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Countdown clock loop
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 23, minutes: 59, seconds: 59 }; // reset
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulated video playback bar timer
  useEffect(() => {
    let playTimer: any;
    if (isVideoPlaying) {
      playTimer = setInterval(() => {
        setVideoPlaybackProgress(prev => {
          if (prev >= 100) {
            setIsVideoPlaying(false);
            return 0;
          }
          return prev + 1.2;
        });
      }, 300);
    }
    return () => clearInterval(playTimer);
  }, [isVideoPlaying]);

  // Fill in active video comments
  useEffect(() => {
    if (activeVideo) {
      setSimulatedComments(activeVideo.comments);
    }
  }, [activeVideo]);

  // Auto-fill address upon entering a CEP
  const handleCepChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    setCep(cleaned);
    if (cleaned.length === 8) {
      // Simulate quick address auto-fill based on CEP digit ranges
      const digit = parseInt(cleaned[0]);
      if (digit <= 2) {
        setStreet('Avenida Paulista');
        setNeighborhood('Bela Vista');
        setCity('São Paulo');
        setStateName('SP');
      } else if (digit <= 4) {
        setStreet('Avenida Atlântica');
        setNeighborhood('Copacabana');
        setCity('Rio de Janeiro');
        setStateName('RJ');
      } else if (digit <= 6) {
        setStreet('Rua da Bahia');
        setNeighborhood('Lourdes');
        setCity('Belo Horizonte');
        setStateName('MG');
      } else {
        setStreet('Rua das Gamezones');
        setNeighborhood('Gamer Central');
        setCity('Curitiba');
        setStateName('PR');
      }
    }
  };

  // Toggle wishlist item
  const toggleWishlist = (id: string) => {
    playSound.click();
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Preset image picker
  const handleSelectPresetImage = (url: string) => {
    playSound.click();
    setNewImgUrl(url);
  };

  // Save custom added product
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return setFormError('Por favor insira um título descritivo para o produto.');
    const parsedPrice = parseFloat(newPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) return setFormError('Insira um preço em R$ válido maior que zero.');
    if (!newDesc.trim()) return setFormError('Insira uma breve descrição sobre o produto.');
    if (newType === 'affiliate' && !newLink.trim()) return setFormError('Insira o link de destino afiliado para direcionar o comprador.');
    if (!newImgUrl.trim()) return setFormError('Forneça ou selecione uma imagem para o item.');

    const finalProduct: EcomProduct = {
      id: `custom-prod-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      price: parsedPrice,
      type: newType,
      platform: newType === 'dropship' ? 'Gamezone Express' : newPlatform,
      link: newType === 'dropship' ? '#' : (newLink.startsWith('http') ? newLink : `https://${newLink}`),
      imageUrl: newImgUrl,
      category: newCategory,
      rating: parseFloat((4.4 + Math.random() * 0.6).toFixed(1)),
      reviewsCount: Math.floor(10 + Math.random() * 150),
      freeShipping: newShipping,
      discount: parseInt(newDiscount) || 0,
      estimatedDelivery: newShipping ? 'Chega amanhã' : 'Chega em 3 dias',
      stock: Math.floor(5 + Math.random() * 30),
      isCustom: true,
      isDailyPick: Math.random() > 0.5
    };

    setProducts(prev => [finalProduct, ...prev]);
    playSound.purchase();
    
    // Clear state
    setNewTitle('');
    setNewPrice('');
    setNewDesc('');
    setNewLink('');
    setNewImgUrl('');
    setFormError(null);
    setShowAdminPanel(false);
  };

  // Delete product
  const handleDeleteProduct = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound.click();
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Checkout purchase logic
  const handleConfirmPurchase = () => {
    if (!checkoutProduct) return;
    if (checkoutProduct.stock <= 0) {
      playSound.tick();
      alert('Produto temporariamente fora de estoque!');
      return;
    }
    if (!cep || !street || !number || !city || !stateName) {
      playSound.tick();
      alert('Preencha os dados de endereço obrigatórios para envio!');
      return;
    }

    const calculatedDiscountPrice = checkoutProduct.price * (1 - checkoutProduct.discount / 100);
    const coinConversion = Math.round(calculatedDiscountPrice * 10);

    if (paymentMethod === 'saldo') {
      if (realBalance < calculatedDiscountPrice) {
        playSound.tick();
        alert(`Saldo em Conta R$ insuficiente! Você precisa de R$ ${calculatedDiscountPrice.toFixed(2)} mas possui apenas R$ ${realBalance.toFixed(2)}.`);
        return;
      }
      // Deduct balance
      setRealBalance(prev => prev - calculatedDiscountPrice);
      addLog('purchase_booster', `Compra de dropshipping realizada: ${checkoutProduct.title}`, calculatedDiscountPrice, 'real');
    } else {
      // payment with game coins
      if (stats.coins < coinConversion) {
        playSound.tick();
        alert(`Moedas de jogo insuficientes! O produto custa R$ ${calculatedDiscountPrice.toFixed(2)} (equivalente a ${coinConversion} moedas 🪙), mas você tem apenas ${stats.coins} moedas.`);
        return;
      }
      // Deduct coins
      updateStats(prev => ({
        ...prev,
        coins: prev.coins - coinConversion
      }));
      addLog('purchase_cosmetic', `Dropshipping adquirido com Moedas: ${checkoutProduct.title}`, coinConversion, 'coins');
    }

    // Success Order!
    const trackCode = `BR${Math.floor(10000000 + Math.random() * 90000000)}BR`;
    
    // Subtract from stock
    setProducts(prev => 
      prev.map(p => p.id === checkoutProduct.id ? { ...p, stock: Math.max(0, p.stock - 1) } : p)
    );

    setSuccessOrder({
      id: `PED-${Math.floor(100000 + Math.random() * 900000)}`,
      product: checkoutProduct,
      trackingCode: trackCode,
      finalPrice: calculatedDiscountPrice,
      payMethod: paymentMethod === 'saldo' ? 'Saldo R$' : 'Moedas 🪙'
    });

    playSound.jackpot();
    setCheckoutProduct(null);
  };

  // Simulate visiting an affiliate link & earning simulated sales commissions!
  const handleOpenAffiliate = (product: EcomProduct) => {
    playSound.click();
    setAffiliateModal(product);
  };

  const handleRedirectAffiliateConfirm = () => {
    if (!affiliateModal) return;
    
    // Simulates an official open
    window.open(affiliateModal.link, '_blank', 'noopener,noreferrer');
    
    // Reward the site developer with a 10% simulated commission into their real balance!
    const commission = affiliateModal.price * 0.1;
    setRealBalance(prev => prev + commission);
    addLog('earn', `Comissão de afiliado recebida por venda externa: ${affiliateModal.title}`, commission, 'real');
    
    setAffiliateModal(null);
  };

  // Add Comment on Review Video
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    playSound.click();
    setSimulatedComments(prev => [...prev, `${loggedInUser?.name || 'GamerAnônimo'}: ${newCommentText}`]);
    setNewCommentText('');
  };

  // Open Quick checkout directly from a video review
  const handleBuyFromVideo = (productId: string) => {
    const linked = products.find(p => p.id === productId);
    if (linked) {
      playSound.click();
      if (linked.type === 'dropship') {
        setCheckoutProduct(linked);
      } else {
        setAffiliateModal(linked);
      }
    }
  };

  // Filter products based on active filters
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'todos' || p.category === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'todos' || p.type === filterType;
    return matchesCategory && matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-16 font-sans text-slate-800 animate-fadeIn" id="gamezoneshop-page">
      
      {/* FOMO Live Shopping Purchase Ticker Banner at the very top */}
      <div className="bg-slate-950 text-white rounded-xl py-2 px-4 border border-slate-800 mb-6 flex items-center justify-between overflow-hidden relative text-left">
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest font-mono">AO VIVO</span>
        </div>

        <div className="flex-1 px-4 overflow-hidden h-5 relative flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFomoIndex}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-slate-300 font-medium truncate font-mono"
            >
              🎉 <strong className="text-yellow-400">{FOMO_ALERTS[activeFomoIndex].name}</strong> {FOMO_ALERTS[activeFomoIndex].action} <span className="text-slate-500">({FOMO_ALERTS[activeFomoIndex].platform})</span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="text-[10px] text-slate-500 font-mono hidden md:block">
          🚚 12 pedidos em envio hoje
        </div>
      </div>

      {/* Mercado Livre inspired Banner Header */}
      <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-slate-900 rounded-3xl p-6 md:p-8 border border-yellow-300 shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 mb-8 text-left">
        {/* Dynamic elements */}
        <div className="absolute top-0 right-0 w-[300px] h-full bg-indigo-600/10 skew-x-12 blur-3xl pointer-events-none" />
        
        <div className="space-y-3 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-full border border-yellow-400 text-yellow-400 font-mono text-[10px] font-bold uppercase tracking-widest animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Parceria de Vendas Gamer &amp; Dropshipping
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-slate-950 tracking-tight leading-none uppercase">
            GAMEZONE<span className="text-indigo-600">SHOP</span>
          </h2>
          <p className="text-xs md:text-sm font-medium text-slate-900 max-w-xl">
            Inspirado no estilo do Mercado Livre, explore os melhores hardwares e periféricos do mercado! Compre produtos via dropshipping diretamente no sistema ou links afiliados recomendados.
          </p>
          
          <div className="flex items-center gap-6 text-xs text-slate-900 pt-1 font-semibold flex-wrap">
            <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-slate-950" /> Frete Rápido Brasil</span>
            <span className="flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-slate-950" /> Pague com Saldo ou Moedas</span>
            <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-slate-950" /> Comissões em Dinheiro Real</span>
          </div>
        </div>

        {/* Balance panel styled elegantly */}
        <div className="bg-slate-950 text-white p-5 rounded-2xl border-2 border-yellow-400 w-full md:w-auto shadow-2xl shrink-0 space-y-3 relative z-10 animate-scaleIn">
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest text-center md:text-left">Seu Faturamento &amp; Saldo</p>
          
          <div className="flex items-center gap-6 justify-between md:justify-start">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block">SALDO DISPONÍVEL</span>
              <span className="text-xl font-extrabold text-yellow-400 font-mono">R$ {realBalance.toFixed(2)}</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 font-mono block">SUAS MOEDAS 🪙</span>
              <span className="text-xl font-extrabold text-indigo-400 font-mono">{stats.coins}</span>
            </div>
          </div>

          <div className="bg-yellow-400/10 rounded-lg p-2 text-[10px] text-yellow-400 border border-yellow-400/20 text-center font-medium leading-normal">
            💡 Cadastre links e ganhe <strong>10% de comissão</strong> instantânea em cada venda de afiliado!
          </div>

          {/* Quick Creator launcher button */}
          <button
            onClick={() => { playSound.click(); setShowAdminPanel(!showAdminPanel); }}
            className="w-full py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-yellow-500/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Cadastrar Novo Link / Produto
          </button>
        </div>
      </div>

      {/* Dynamic Sub-tab Switcher: Vitrine de Lojas vs. Marketplace & Mapa vs. Enterprise Marketplace */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full mb-8" id="shop-sub-tab-switcher">
        <button
          onClick={() => { playSound.click(); setActiveShopSubTab('enterprise'); }}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeShopSubTab === 'enterprise'
              ? 'bg-slate-900 text-yellow-400 shadow-md font-black'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Store className="w-4 h-4" /> Lojas Virtuais (Enterprise) 🏪
        </button>
        <button
          onClick={() => { playSound.click(); setActiveShopSubTab('vitrine'); }}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeShopSubTab === 'vitrine'
              ? 'bg-slate-900 text-yellow-400 shadow-md font-black'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Vitrine (Dropshipping)
        </button>
        <button
          onClick={() => { playSound.click(); setActiveShopSubTab('marketplace'); }}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeShopSubTab === 'marketplace'
              ? 'bg-slate-900 text-yellow-400 shadow-md font-black'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" /> Mapa de Afiliadas 📍
        </button>
      </div>

      {activeShopSubTab === 'enterprise' ? (
        <EnterpriseMarketplace
          stats={stats}
          updateStats={updateStats}
          addLog={addLog}
          loggedInUser={loggedInUser}
          onOpenLogin={onOpenLogin}
          realBalance={realBalance}
          setRealBalance={setRealBalance}
        />
      ) : activeShopSubTab === 'vitrine' ? (
        <>
          {/* Admin Panel to Add Custom Products (paste link) */}
          <AnimatePresence>
        {showAdminPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xl relative text-left">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-yellow-400 text-slate-900 rounded-lg">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Painel de Cadastro de Produtos (Dropshipping &amp; Afiliados)</h3>
                    <p className="text-xs text-slate-500">Cole links e disponibilize produtos para visitantes comprarem na Gamezone.</p>
                  </div>
                </div>
                <button
                  onClick={() => { playSound.click(); setShowAdminPanel(false); }}
                  className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left side settings */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Título do Produto *</label>
                    <input
                      type="text"
                      placeholder="Ex: Mouse Gamer Sem Fio RGB 24000 DPI"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Preço em R$ *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 199.90"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Desconto (%)</label>
                      <input
                        type="number"
                        placeholder="Ex: 10"
                        value={newDiscount}
                        onChange={(e) => setNewDiscount(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Integração *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { playSound.click(); setNewType('dropship'); }}
                        className={`py-2 px-3 text-xs font-extrabold rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                          newType === 'dropship'
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/20'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <Package className="w-4 h-4" />
                        <span>Dropshipping (Interno)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { playSound.click(); setNewType('affiliate'); }}
                        className={`py-2 px-3 text-xs font-extrabold rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                          newType === 'affiliate'
                            ? 'bg-yellow-500 text-slate-950 border-yellow-600 shadow-md shadow-yellow-500/20'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Afiliado (Link Externo)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Middle part */}
                <div className="space-y-4">
                  {newType === 'affiliate' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Plataforma do Link Afiliado *</label>
                        <select
                          value={newPlatform}
                          onChange={(e) => setNewPlatform(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400 outline-none"
                        >
                          <option value="Mercado Livre">Mercado Livre</option>
                          <option value="Amazon Brasil">Amazon Brasil</option>
                          <option value="Shopee Brasil">Shopee Brasil</option>
                          <option value="AliExpress">AliExpress</option>
                          <option value="Kabum">Kabum</option>
                          <option value="Nuuvem">Nuuvem (Jogos)</option>
                          <option value="Epic Games Store">Epic Games Store</option>
                          <option value="TerabyteShop">TerabyteShop</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Cole o seu Link de Afiliado *</label>
                        <input
                          type="text"
                          placeholder="Ex: https://mercadolivre.com.br/item-exemplo-afiliado"
                          value={newLink}
                          onChange={(e) => setNewLink(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400 outline-none font-mono"
                        />
                      </div>
                    </>
                  )}

                  {newType === 'dropship' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Status Dropshipping</label>
                      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-950 text-[11px] leading-relaxed">
                        ⚡ O produto cadastrado no modelo <strong>Dropshipping Direct</strong> permitirá que os usuários comprem utilizando o saldo da conta ou moedas do jogo, preenchendo endereço de envio simulado.
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Categoria *</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400 outline-none"
                    >
                      <option value="perifericos">⌨️ Periféricos (Mouse, Teclado, etc)</option>
                      <option value="hardwares">⚙️ Hardwares (Placas de Vídeo, Ram, etc)</option>
                      <option value="cadeiras">💺 Cadeiras &amp; Móveis Gamer</option>
                      <option value="consoles">🎮 Consoles &amp; Controles</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="freeShipCheck"
                      checked={newShipping}
                      onChange={(e) => setNewShipping(e.target.checked)}
                      className="w-4 h-4 rounded text-yellow-400 accent-yellow-400 outline-none"
                    />
                    <label htmlFor="freeShipCheck" className="text-xs font-bold text-slate-700 cursor-pointer select-none">Ativar Frete Grátis Brasil 🚚</label>
                  </div>
                </div>

                {/* Right side: images selection and image link */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">URL da Imagem do Produto *</label>
                    <input
                      type="text"
                      placeholder="Ex: https://imagens.com/produto.jpg"
                      value={newImgUrl}
                      onChange={(e) => setNewImgUrl(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Ou escolha uma imagem predefinida:</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_IMAGES.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPresetImage(img.url)}
                          className={`px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border text-[10px] text-slate-700 font-medium transition-all ${
                            newImgUrl === img.url ? 'border-yellow-500 bg-yellow-50 text-slate-900 font-bold' : 'border-slate-200'
                          }`}
                        >
                          {img.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Breve Descrição *</label>
                    <textarea
                      rows={2}
                      placeholder="Destaque as principais características técnicas, compatibilidade do produto gamer..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400 outline-none resize-none"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-950 hover:bg-slate-900 text-yellow-400 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer border border-yellow-400"
                  >
                    🚀 Publicar no GamezoneShop
                  </button>
                </div>

              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ANIMATED CAROUSEL OF FLASH DEALS (Carrossel de Ofertas Relâmpago) */}
      {carouselProducts.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 text-left relative overflow-hidden shadow-xl" id="deals-carousel">
          {/* Decorative neon gradient header line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-400 via-indigo-500 to-pink-500" />
          
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-yellow-400 text-slate-950 rounded-lg text-xs font-black animate-pulse">SUPER OFERTA</span>
              <h3 className="text-lg font-black text-white tracking-tight uppercase">Ofertas Relâmpago do Dia ⚡</h3>
            </div>

            {/* Countdown clock styled like Mercado Livre */}
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono">OFERTAS EXPIRAM EM:</span>
              <span className="text-xs font-bold text-yellow-400 font-mono">
                {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="relative aspect-[25/10] md:aspect-[32/10] overflow-hidden rounded-2xl bg-slate-950/40 border border-slate-800/60">
            <AnimatePresence mode="wait">
              {carouselProducts.map((p, idx) => {
                if (idx !== carouselIndex) return null;
                const calculatedPrice = p.price * (1 - p.discount / 100);
                const isFavorited = wishlist.includes(p.id);

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 p-4 md:p-6 flex flex-col md:flex-row gap-6 items-center justify-between"
                  >
                    {/* Left: Product Image & Badges */}
                    <div className="w-full md:w-2/5 aspect-[16/10] md:h-full relative overflow-hidden rounded-xl shrink-0 bg-slate-900 border border-slate-800">
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-90"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-yellow-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded shadow">
                        🔥 SAVE {p.discount}%
                      </div>
                      <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[8px] font-mono text-slate-400">
                        {p.platform}
                      </div>
                    </div>

                    {/* Right: Info & CTA */}
                    <div className="flex-1 flex flex-col justify-between h-full space-y-2.5 text-left w-full">
                      <div className="space-y-1">
                        <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest font-bold">RECOMENDADO</span>
                        <h4 className="text-sm md:text-lg font-black text-white leading-snug line-clamp-1 hover:text-yellow-400 transition-colors">
                          {p.title}
                        </h4>
                        <p className="text-[11px] md:text-xs text-slate-400 line-clamp-2 md:line-clamp-3 leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 pt-1 border-t border-slate-800/80">
                        <div>
                          <span className="text-[10px] text-slate-500 line-through block">De R$ {p.price.toFixed(2)}</span>
                          <span className="text-lg md:text-2xl font-black text-yellow-400 font-mono">
                            R$ {calculatedPrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800/60 hidden sm:block">
                          <span className="text-[9px] text-slate-400 font-mono block uppercase">RESGATE COINS</span>
                          <span className="text-xs font-bold text-indigo-400 font-mono">🪙 {Math.round(calculatedPrice * 10)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {p.type === 'dropship' ? (
                          <button
                            onClick={() => { playSound.click(); setCheckoutProduct(p); }}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" /> Adquirir Dropshipping
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAffiliate(p)}
                            className="flex-1 py-2 bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-yellow-500"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Ver na Loja Oficial
                          </button>
                        )}
                        
                        <button
                          onClick={() => toggleWishlist(p.id)}
                          className={`p-2 rounded-xl border border-slate-800 transition-colors cursor-pointer ${
                            isFavorited ? 'bg-red-500 text-white border-red-600' : 'bg-slate-900/60 text-slate-300 hover:text-white'
                          }`}
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Slider Navigation arrows */}
            <button
              onClick={() => { playSound.click(); setCarouselIndex(prev => (prev - 1 + carouselProducts.length) % carouselProducts.length); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-white rounded-full transition-all border border-slate-800 cursor-pointer hidden md:block"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => { playSound.click(); setCarouselIndex(prev => (prev + 1) % carouselProducts.length); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-white rounded-full transition-all border border-slate-800 cursor-pointer hidden md:block"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Indicators bullet points */}
          <div className="flex justify-center gap-1.5 mt-3">
            {carouselProducts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => { playSound.click(); setCarouselIndex(idx); }}
                className={`h-1.5 rounded-full transition-all ${
                  idx === carouselIndex ? 'w-5 bg-yellow-400' : 'w-1.5 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* TWO COLUMN GRID: "ESCOLHAS DO DIA" & "VÍDEOS DE AVALIAÇÃO" */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 text-left">
        
        {/* Left Column: Escolhas do Dia (Daily picks handpicked with FOMO counters) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-amber-500 text-slate-950 rounded-lg">
              <Award className="w-4 h-4" />
            </span>
            <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">Escolhas do Dia 🔥</h3>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-5 space-y-4 relative overflow-hidden shadow-sm">
            {/* Pulsing indicator */}
            <div className="absolute top-4 right-4 bg-red-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-white rounded-full"></span> Altíssima Procura
            </div>

            <p className="text-xs text-slate-500 leading-normal">
              Nossa curadoria selecionou estes periféricos e consoles de alta performance com estoques limitados para hoje:
            </p>

            <div className="space-y-3.5">
              {products.filter(p => p.isDailyPick).slice(0, 3).map(p => {
                const finalP = p.price * (1 - p.discount / 100);
                return (
                  <div 
                    key={p.id}
                    onClick={() => { playSound.click(); p.type === 'dropship' ? setCheckoutProduct(p) : setAffiliateModal(p); }}
                    className="group flex gap-3.5 p-2.5 bg-slate-50 hover:bg-yellow-50 border border-slate-100 hover:border-yellow-400/80 rounded-2xl cursor-pointer transition-all duration-300"
                  >
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      referrerPolicy="no-referrer"
                      className="w-16 h-14 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-900"
                    />
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span className="uppercase font-bold tracking-wider text-slate-500 font-mono">{p.platform}</span>
                        <span className="text-amber-500 font-bold">★ {p.rating}</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-800 line-clamp-1 group-hover:text-amber-600 transition-colors">
                        {p.title}
                      </h4>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-black text-slate-900 font-mono">R$ {finalP.toFixed(2)}</span>
                        {p.discount > 0 && <span className="text-[10px] text-slate-400 line-through">R$ {p.price.toFixed(2)}</span>}
                      </div>

                      {/* Micro interaction buy count indicator */}
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-[9px] text-red-600 font-bold flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5" /> Apenas {p.stock} unidades restantes!
                        </span>
                        <span className="text-[8px] text-slate-400 font-mono">
                          {p.type === 'dropship' ? '⚡ Dropship' : '🔗 Afiliado'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-indigo-50 border border-indigo-100/60 rounded-2xl p-3 text-[10px] text-indigo-950 flex items-start gap-2 leading-relaxed">
              <span className="text-xs text-indigo-600">💡</span>
              <div>
                <strong>Aproveite o Frete Expresso:</strong> Qualquer pedido no modo Dropshipping realizado agora será despachado via parceria expressa no mesmo dia!
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Vídeos de Avaliação e Unboxing (Interactive Video Review Showcase) */}
        <div className="lg:col-span-7 space-y-4" id="video-reviews-showcase">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-red-600 text-white rounded-lg">
              <Tv className="w-4 h-4" />
            </span>
            <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">Vídeos de Avaliação &amp; Unboxings 🎬</h3>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-5 shadow-sm">
            
            {/* Active Video Player Simulated Frame */}
            {activeVideo ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="relative aspect-[16/9] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner group/player">
                  <img
                    src={activeVideo.imageUrl}
                    alt={activeVideo.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-30"
                  />
                  
                  {/* Virtual Video Overlay elements */}
                  <div className="absolute inset-0 flex flex-col justify-between p-4 z-10">
                    <div className="flex justify-between items-center">
                      <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase font-mono tracking-widest animate-pulse flex items-center gap-1">
                        <Play className="w-2.5 h-2.5 fill-current" /> Reproduzindo Análise
                      </span>
                      <button
                        onClick={() => { playSound.click(); setActiveVideo(null); setIsVideoPlaying(false); }}
                        className="px-2.5 py-1 text-[9px] font-bold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-900 rounded-lg cursor-pointer transition-colors"
                      >
                        Fechar Player
                      </button>
                    </div>

                    {/* Big central Play/Pause button */}
                    <div className="flex justify-center items-center">
                      <button
                        onClick={() => { playSound.click(); setIsVideoPlaying(!isVideoPlaying); }}
                        className="w-14 h-14 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-all cursor-pointer"
                      >
                        {isVideoPlaying ? (
                          <div className="flex gap-1 items-center justify-center">
                            <span className="h-5 w-1.5 bg-white rounded-sm"></span>
                            <span className="h-5 w-1.5 bg-white rounded-sm"></span>
                          </div>
                        ) : (
                          <Play className="w-6 h-6 fill-current ml-1" />
                        )}
                      </button>
                    </div>

                    {/* Controls Bar at bottom */}
                    <div className="space-y-2">
                      {/* Progress Line */}
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden relative">
                        <div 
                          className="absolute top-0 left-0 h-full bg-red-600 transition-all duration-300"
                          style={{ width: `${videoPlaybackProgress}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
                        <div className="flex items-center gap-3">
                          <span>{isVideoPlaying ? `01:${Math.floor(videoPlaybackProgress * 0.05).toString().padStart(2, '0')}` : '00:00'} / {activeVideo.duration}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {activeVideo.views} visualizações</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={videoVolume}
                            onChange={(e) => setVideoVolume(Number(e.target.value))}
                            className="w-14 h-1 accent-red-600 bg-slate-800 rounded-lg outline-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Soft animated equalizer when playing */}
                  {isVideoPlaying && (
                    <div className="absolute bottom-12 right-4 flex items-end gap-0.5 z-10 h-6">
                      <div className="w-0.5 bg-red-600 animate-pulse h-4" />
                      <div className="w-0.5 bg-red-600 animate-pulse h-5" style={{ animationDelay: '0.1s' }} />
                      <div className="w-0.5 bg-red-600 animate-pulse h-3" style={{ animationDelay: '0.2s' }} />
                      <div className="w-0.5 bg-red-600 animate-pulse h-6" style={{ animationDelay: '0.3s' }} />
                    </div>
                  )}
                </div>

                {/* Video Info and Linked Product Box */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="space-y-1">
                    <span className="text-[10px] text-red-600 font-black font-mono tracking-wider">{activeVideo.creator}</span>
                    <h4 className="text-xs md:text-sm font-black text-slate-800 leading-snug">{activeVideo.title}</h4>
                    <p className="text-[10px] text-slate-500">Este criador recomenda finalizar a compra na parceira confiável da Gamezone.</p>
                  </div>

                  <button
                    onClick={() => handleBuyFromVideo(activeVideo.productId)}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-350 hover:to-yellow-450 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shrink-0 shadow-md border border-yellow-400 active:scale-95 transition-all cursor-pointer"
                  >
                    🛒 Comprar Item do Vídeo
                  </button>
                </div>

                {/* Simulated live video Comments block */}
                <div className="space-y-2 text-xs">
                  <h5 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-slate-400" /> Comentários da Comunidade ({simulatedComments.length})
                  </h5>
                  
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2 max-h-32 overflow-y-auto">
                    {simulatedComments.map((com, idx) => (
                      <div key={idx} className="text-[11px] leading-relaxed border-b border-slate-200/40 pb-1.5 last:border-0 last:pb-0">
                        {com.includes(':') ? (
                          <>
                            <strong className="text-indigo-600">{com.split(':')[0]}</strong>
                            <span className="text-slate-600">: {com.split(':')[1]}</span>
                          </>
                        ) : (
                          <span className="text-slate-600">{com}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Deixe sua dúvida ou avaliação sobre o unboxing..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Enviar
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* Grid of available videos */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {INITIAL_VIDEOS.map((v) => (
                  <div 
                    key={v.id}
                    onClick={() => { playSound.click(); setActiveVideo(v); setIsVideoPlaying(true); }}
                    className="group flex flex-col justify-between bg-slate-50 hover:bg-red-50/50 border border-slate-100 hover:border-red-400/40 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 text-left"
                  >
                    {/* Video Thumbnail */}
                    <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                      <img
                        src={v.imageUrl}
                        alt={v.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/10 transition-colors" />
                      
                      {/* Play Hover button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="w-10 h-10 bg-red-600 group-hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </span>
                      </div>

                      {/* Video duration label */}
                      <span className="absolute bottom-2 right-2 bg-slate-950/80 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-slate-200">
                        {v.duration}
                      </span>
                    </div>

                    {/* Title & metrics */}
                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[8px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded uppercase">Análise Gamer</span>
                        <h4 className="text-[11px] font-black text-slate-800 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                          {v.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1.5 border-t border-slate-200/40">
                        <span className="font-semibold">{v.creator}</span>
                        <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {v.views}</span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

            <div className="text-[10px] text-slate-400 text-center leading-normal">
              🎬 Quer cadastrar seu vídeo do YouTube de review e receber <strong>faturamento extra de afiliado</strong>? Fale com a moderação!
            </div>
          </div>
        </div>

      </div>

      {/* FILTER BUTTONS & SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-8 text-left shadow-sm">
        
        {/* Categories Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => { playSound.click(); setSelectedCategory('todos'); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'todos'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos Produtos
          </button>
          <button
            onClick={() => { playSound.click(); setSelectedCategory('perifericos'); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'perifericos'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ⌨️ Periféricos
          </button>
          <button
            onClick={() => { playSound.click(); setSelectedCategory('hardwares'); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'hardwares'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/10'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ⚙️ Hardware
          </button>
          <button
            onClick={() => { playSound.click(); setSelectedCategory('cadeiras'); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'cadeiras'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/10'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            💺 Cadeiras
          </button>
          <button
            onClick={() => { playSound.click(); setSelectedCategory('consoles'); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'consoles'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/10'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🎮 Consoles
          </button>
        </div>

        {/* Search input and type dropdown */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          
          {/* Dropship or Affiliate type filter */}
          <select
            value={filterType}
            onChange={(e) => { playSound.click(); setFilterType(e.target.value as any); }}
            className="p-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold outline-none cursor-pointer text-slate-700"
          >
            <option value="todos">📦 Todos Tipos</option>
            <option value="dropship">⚡ Dropshipping</option>
            <option value="affiliate">🔗 Links Afiliados</option>
          </select>

          {/* Search container */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar marcas, periféricos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400 outline-none text-slate-800"
            />
          </div>
        </div>

      </div>

      {/* PRODUCTS GRID SYSTEM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        {filteredProducts.map((p) => {
          const discountPrice = p.price * (1 - p.discount / 100);
          const pointsConversion = Math.round(discountPrice * 10);
          const isFavorited = wishlist.includes(p.id);

          return (
            <div 
              key={p.id}
              className="group bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.02)] hover:shadow-2xl hover:border-yellow-400/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              
              {/* Image & Badge overlay */}
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                <img 
                  src={p.imageUrl} 
                  alt={p.title} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />

                {/* Badges */}
                <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5">
                  {p.freeShipping && (
                    <span className="bg-emerald-500 text-slate-950 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                      <Truck className="w-2.5 h-2.5" /> Frete Grátis
                    </span>
                  )}
                  {p.discount > 0 && (
                    <span className="bg-yellow-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-md shadow-md animate-pulse">
                      🔥 {p.discount}% OFF
                    </span>
                  )}
                </div>

                {/* Wishlist and delete controls */}
                <div className="absolute top-3.5 right-3.5 flex gap-1.5">
                  <button
                    onClick={() => toggleWishlist(p.id)}
                    className={`p-1.5 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
                      isFavorited 
                        ? 'bg-red-500 text-white' 
                        : 'bg-slate-950/40 text-slate-300 hover:text-white hover:bg-slate-950/60'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
                  </button>

                  {p.isCustom && (
                    <button
                      onClick={(e) => handleDeleteProduct(p.id, e)}
                      title="Deletar produto cadastrado"
                      className="p-1.5 rounded-full bg-slate-950/40 text-slate-300 hover:text-red-400 hover:bg-slate-950/60 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Custom Type label overlay */}
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                  {p.type === 'dropship' ? (
                    <span className="bg-indigo-600/90 text-white text-[8px] font-mono font-bold px-2 py-0.5 rounded border border-indigo-500">
                      ⚡ DROPSHIPPING DIRECT
                    </span>
                  ) : (
                    <span className="bg-yellow-500/95 text-slate-950 text-[8px] font-mono font-bold px-2 py-0.5 rounded border border-yellow-600">
                      🔗 LINK AFILIADO
                    </span>
                  )}
                </div>
              </div>

              {/* Product Info details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                
                <div className="space-y-1.5">
                  {/* Mercado Livre styled platform/seller header */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="uppercase font-bold text-slate-500">{p.platform}</span>
                    <span className="text-yellow-500 font-bold">★ {p.rating} ({p.reviewsCount})</span>
                  </div>

                  <h3 className="text-xs md:text-sm font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {p.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-normal">
                    {p.description}
                  </p>
                </div>

                {/* Price block */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-baseline gap-2">
                    {p.discount > 0 && (
                      <span className="text-[11px] text-slate-400 line-through font-mono">
                        R$ {p.price.toFixed(2)}
                      </span>
                    )}
                    <span className="text-lg font-black text-slate-900 font-mono tracking-tight">
                      R$ {discountPrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <Clock className="w-3 h-3" /> {p.estimatedDelivery}
                    </span>
                    <span className="font-mono">Estoque: <strong>{p.stock} un</strong></span>
                  </div>

                  {/* Coin equivalent */}
                  <div className="bg-slate-50 rounded-lg p-1.5 flex items-center justify-between text-[9px] font-mono text-slate-600 border border-slate-100">
                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-yellow-500" /> Ou resgate com moedas:</span>
                    <strong className="text-indigo-600">{pointsConversion} moedas 🪙</strong>
                  </div>
                </div>

                {/* Buy triggers */}
                {p.type === 'dropship' ? (
                  <button
                    onClick={() => { playSound.click(); setCheckoutProduct(p); }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Comprar via Dropshipping
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenAffiliate(p)}
                    className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-yellow-500/10 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer border border-yellow-500"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Visitar Loja Afiliada
                  </button>
                )}

              </div>

            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3">
            <span className="text-3xl">🔍</span>
            <h4 className="text-sm font-black text-slate-800">Nenhum produto gamer encontrado!</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Nenhum item corresponde aos termos pesquisados ou aos filtros selecionados. Tente limpar os filtros ou cadastre um novo produto.
            </p>
            <button
              onClick={() => { setSelectedCategory('todos'); setSearchQuery(''); setFilterType('todos'); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Resetar Filtros
            </button>
          </div>
        )}
      </div>

      {/* DROPSHIPPING SIMULATED CHECKOUT MODAL */}
      <AnimatePresence>
        {checkoutProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-2 border-indigo-500 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-left"
            >
              
              {/* Header */}
              <div className="bg-slate-950 text-white p-5 border-b border-indigo-900/60 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-black">Checkout Dropshipping MercadoPago</h3>
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">Faturamento Direto &amp; Entrega Expressa</p>
                  </div>
                </div>
                <button
                  onClick={() => setCheckoutProduct(null)}
                  className="p-1.5 hover:bg-slate-850 rounded-full text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-bold">X</span>
                </button>
              </div>

              {/* Body Form */}
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                
                {/* Product Summary */}
                <div className="flex gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <img
                    src={checkoutProduct.imageUrl}
                    alt={checkoutProduct.title}
                    referrerPolicy="no-referrer"
                    className="w-16 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                  />
                  <div>
                    <span className="text-[8px] bg-indigo-100 text-indigo-700 font-mono font-bold px-1.5 py-0.5 rounded uppercase">Dropship Ativo</span>
                    <h4 className="text-xs font-black text-slate-800 line-clamp-1 mt-0.5">{checkoutProduct.title}</h4>
                    <span className="text-xs font-black text-slate-900 font-mono">
                      R$ {(checkoutProduct.price * (1 - checkoutProduct.discount / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Selecione o Método de Pagamento:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('saldo')}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'saldo'
                          ? 'border-indigo-600 bg-indigo-50/40 text-indigo-950 shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-indigo-600" /> Saldo em R$
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Disponível: R$ {realBalance.toFixed(2)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('moedas')}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'moedas'
                          ? 'border-indigo-600 bg-indigo-50/40 text-indigo-950 shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        🪙 Moedas de Jogo
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Disponível: {stats.coins} 🪙</span>
                    </button>
                  </div>
                </div>

                {/* Delivery Address Details */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-950 flex items-center gap-1">📍 Dados de Entrega (Simulado)</h4>
                  
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">CEP (8 dígitos)</label>
                      <input
                        type="text"
                        maxLength={8}
                        placeholder="Ex: 01310100"
                        value={cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Rua / Logradouro</label>
                      <input
                        type="text"
                        placeholder="Ex: Avenida Paulista"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2.5">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Número</label>
                      <input
                        type="text"
                        placeholder="Ex: 100"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="col-span-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Bairro</label>
                      <input
                        type="text"
                        placeholder="Ex: Bela Vista"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="col-span-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Cidade</label>
                      <input
                        type="text"
                        placeholder="Ex: São Paulo"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping cost disclaimer */}
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-950 text-[10px] leading-relaxed flex items-start gap-2">
                  <span className="text-xs">🚚</span>
                  <div>
                    <strong>Frete Grátis Rastreado Mercado Envios!</strong>
                    <p className="text-slate-500 mt-0.5">Parceria Dropshipping integrada via Correios e Loggi. O código de rastreamento oficial será emitido imediatamente após a compra.</p>
                  </div>
                </div>

              </div>

              {/* Confirm footer */}
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => setCheckoutProduct(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmPurchase}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  Confirmar Pagamento e Envio 🔒
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>
      ) : (
        <MarketplaceMap
          stats={stats}
          updateStats={updateStats}
          addLog={addLog}
          loggedInUser={loggedInUser}
          onOpenLogin={onOpenLogin}
          realBalance={realBalance}
          setRealBalance={setRealBalance}
        />
      )}

      {/* PURCHASE SUCCESS FEEDBACK MODAL */}
      <AnimatePresence>
        {successOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-2 border-emerald-500 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-left p-6 space-y-5"
            >
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl mx-auto animate-bounce">
                  ✓
                </div>
                <h3 className="text-lg font-black text-slate-900">Compra de Dropshipping Confirmada!</h3>
                <p className="text-xs text-slate-500">Seu pedido foi faturado e enviado à fábrica parceira com sucesso.</p>
              </div>

              {/* Invoice details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500 font-mono">CÓDIGO PEDIDO</span>
                  <strong className="text-slate-900 font-mono">{successOrder.id}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">PRODUTO</span>
                  <span className="text-slate-950 font-bold truncate max-w-[200px]">{successOrder.product.title}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">PREÇO PAGO</span>
                  <strong className="text-slate-900 font-mono">R$ {successOrder.finalPrice.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">FORMA PAGAMENTO</span>
                  <span className="text-indigo-600 font-bold">{successOrder.payMethod}</span>
                </div>
                <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  <span className="text-emerald-800 font-mono font-bold">Rastreio Correios:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white border px-1.5 py-0.5 rounded text-[10px] select-all">{successOrder.trackingCode}</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-950 text-[10px] leading-relaxed">
                📢 <strong>Faturamento Automatizado:</strong> O fornecedor já foi acionado e a postagem do item ocorrerá nas próximas 24 horas. Acompanhe pelo seu histórico de transações.
              </div>

              <button
                onClick={() => setSuccessOrder(null)}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-yellow-400 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-yellow-400"
              >
                Voltar à GamezoneShop
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AFFILIATE REDIRECT INFO MODAL */}
      <AnimatePresence>
        {affiliateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-2 border-yellow-400 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-left p-6 space-y-4"
            >
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-400 text-slate-950 rounded-xl shrink-0">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-black text-slate-900">Link de Afiliado Seguro Detectado</h3>
                  <p className="text-[10px] font-mono text-slate-500 uppercase">REDIRECIONAMENTO EXTERNO</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-normal">
                Você está prestes a ser redirecionado com segurança para o marketplace oficial de vendas <strong>({affiliateModal.platform})</strong> para finalizar a compra deste produto gamer.
              </p>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px] text-slate-500 space-y-1.5">
                <p>🚀 <strong>Por que este link?</strong> Este é um link de parceria recomendado pela Gamezone. Apoiando este link, você ajuda a plataforma a continuar funcionando!</p>
                <p>💸 <strong>Como desenvolvedor parceiro:</strong> Você receberá uma comissão simulada de 10% (<strong>R$ {(affiliateModal.price * 0.1).toFixed(2)}</strong>) creditada no seu saldo em conta!</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAffiliateModal(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  onClick={handleRedirectAffiliateConfirm}
                  className="flex-1 py-2 bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-yellow-500"
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
