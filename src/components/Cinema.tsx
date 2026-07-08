import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Info, 
  Settings, 
  Youtube, 
  Plus, 
  Check, 
  Search, 
  Bell, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  ChevronLeft, 
  Star, 
  Clock, 
  ExternalLink, 
  Tv, 
  Gamepad2, 
  Film, 
  Sliders, 
  X, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Heart,
  Coins,
  PictureInPicture,
  Flame
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { getCleanUserId, addMovie, getMovies } from '../utils/firebaseDb';
import { VideoPlayer } from './VideoPlayer';

// Fictitious movie and series posters list
interface MediaItem {
  id: string;
  title: string;
  description: string;
  category: 'youtube' | 'originals' | 'blockbuster' | 'gaming_docs';
  year: number;
  rating: string;
  duration: string;
  matchScore: number;
  imageUrl: string;
  youtubeId?: string; // If it's a YouTube video
  videoUrl?: string; // Fictitious play link
  tags: string[];
}

interface LiveChannel {
  id: string;
  title: string;
  desc: string;
  url: string;
  type: 'youtube' | 'iptv';
  category: 'Notícias' | 'Esportes' | 'Desenhos' | 'Cultura' | 'Legislativo' | 'Variedades' | 'Ciência' | 'Documentários';
  imageUrl: string;
  views: string;
  logoColor?: string;
  fallbackUrl?: string;
}
const PRECONFIGURED_BR_CHANNELS: LiveChannel[] = [
  {
    id: "br-1",
    title: "CNN Brasil Ao Vivo",
    desc: "Transmissão de notícias 24h em tempo real da CNN Brasil. Cobertura completa de política, economia, saúde e reportagens especiais diretas de São Paulo e Brasília.",
    url: "https://www.youtube.com/embed/live_stream?channel=UC_gWv3fT8u5q7UvR6X7U7vg",
    type: "youtube",
    category: "Notícias",
    imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200",
    views: "145K assistindo",
    logoColor: "bg-red-600"
  },
  {
    id: "br-2",
    title: "Record News Ao Vivo",
    desc: "Acompanhe a Record News, canal brasileiro 24 horas de jornalismo gratuito com reportagens internacionais, previsão do tempo e análises em tempo real.",
    url: "https://www.youtube.com/embed/live_stream?channel=UC9mUAt4df3vEAti67gY9fgg",
    type: "youtube",
    category: "Notícias",
    imageUrl: "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?q=80&w=1200",
    views: "62K assistindo",
    logoColor: "bg-blue-800"
  },
  {
    id: "br-3",
    title: "Jovem Pan News Ao Vivo",
    desc: "Opinião, informação e debates políticos vibrantes na programação de notícias em tempo real da rede de jornalismo Jovem Pan News.",
    url: "https://www.youtube.com/embed/live_stream?channel=UCEvSpR6v_VOf3T5mDWVHnzg",
    type: "youtube",
    category: "Notícias",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200",
    views: "115K assistindo",
    logoColor: "bg-red-700"
  },
  {
    id: "br-4",
    title: "SBT News Ao Vivo",
    desc: "O canal de notícias oficial do SBT no YouTube. Fique por dentro dos principais acontecimentos do país com reportagens exclusivas e debates em tempo real.",
    url: "https://www.youtube.com/embed/live_stream?channel=UCcoTC356Y07z_mXWv4X-uJI",
    type: "youtube",
    category: "Notícias",
    imageUrl: "https://images.unsplash.com/photo-1518384401463-d387de163f22?q=80&w=1200",
    views: "38K assistindo",
    logoColor: "bg-indigo-600"
  },
  {
    id: "br-5",
    title: "Band Jornalismo Ao Vivo",
    desc: "Edições diárias do Jornal da Band, debates políticos, opinião e as notícias mais importantes do cenário nacional e internacional, transmitidas ao vivo.",
    url: "https://www.youtube.com/embed/live_stream?channel=UCoa-D_x9cbVJcoAdfYgtSgA",
    type: "youtube",
    category: "Notícias",
    imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200",
    views: "78K assistindo",
    logoColor: "bg-green-700"
  },
  {
    id: "br-6",
    title: "Ciência Todo Dia - E Se a Terra Parasse de Girar?",
    desc: "Se por algum milagre cósmico a rotação da Terra parasse instantaneamente, as consequências físicas seriam inimagináveis. Pedro Loos explica cada detalhe dessa catástrofe hipotética de forma didática.",
    url: "https://www.youtube.com/embed/HreA9Z-Y8hI",
    type: "youtube",
    category: "Ciência",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200",
    views: "2.4M visualizações",
    logoColor: "bg-blue-600"
  },
  {
    id: "br-7",
    title: "Ciência Todo Dia - Por Que o Tempo Só Anda Para Frente?",
    desc: "Uma jornada científica profunda sobre as leis da física, entropia, a flecha cósmica do tempo e as razões fundamentais pelas quais nunca poderemos voltar ao passado.",
    url: "https://www.youtube.com/embed/b83h3CqO_vU",
    type: "youtube",
    category: "Ciência",
    imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1200",
    views: "1.8M visualizações",
    logoColor: "bg-teal-600"
  },
  {
    id: "br-8",
    title: "Ciência Todo Dia - O Paradoxo de Fermi: Onde Estão?",
    desc: "Se existem bilhões de estrelas e trilhões de planetas no universo com idade suficiente para abrigar vida, por que ainda não encontramos nenhuma civilização alienígena? Entenda os 'Filtros Cósmicos'.",
    url: "https://www.youtube.com/embed/zL2_D0_9_N6",
    type: "youtube",
    category: "Ciência",
    imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200",
    views: "3.2M visualizações",
    logoColor: "bg-violet-600"
  },
  {
    id: "br-9",
    title: "Ciência Todo Dia - A Gravidade de Einstein Explicada",
    desc: "Esqueça a ideia tradicional de Newton de que a gravidade é uma força de atração. Para Albert Einstein, ela é a distorção do próprio espaço-tempo. Entenda esse conceito de forma incrivelmente simples.",
    url: "https://www.youtube.com/embed/Wp-6M0D8S7W",
    type: "youtube",
    category: "Ciência",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200",
    views: "1.5M visualizações",
    logoColor: "bg-sky-600"
  },
  {
    id: "br-10",
    title: "Ciência Todo Dia - O Mistério da Matéria Escura",
    desc: "Estudos provam que cerca de 85% de toda a matéria do universo é completamente invisível e indetectável pelas ferramentas tradicionais. Entenda os mistérios por trás da elusiva matéria escura.",
    url: "https://www.youtube.com/embed/df3vEAti67g",
    type: "youtube",
    category: "Ciência",
    imageUrl: "https://images.unsplash.com/photo-1538370965046-79c0d6907d47?q=80&w=1200",
    views: "2.1M visualizações",
    logoColor: "bg-indigo-600"
  },
  {
    id: "br-11",
    title: "Ciência Todo Dia - O Vazio Quântico do Espaço",
    desc: "Se retirarmos todas as estrelas, planetas e partículas elementares, o que restará no espaço? Conheça a fascinante física das flutuações quânticas de vácuo e a energia escura.",
    url: "https://www.youtube.com/embed/Ati67gY9fgg",
    type: "youtube",
    category: "Ciência",
    imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200",
    views: "1.9M visualizações",
    logoColor: "bg-emerald-600"
  },
  {
    id: "br-12",
    title: "Ciência Todo Dia - Como Ver a 4ª Dimensão?",
    desc: "Como nosso cérebro tridimensional pode tentar conceber, visualizar e raciocinar sobre uma quarta dimensão espacial na matemática e na física teórica? Veja a explicação geométrica definitiva.",
    url: "https://www.youtube.com/embed/6L2I0_D_9_N",
    type: "youtube",
    category: "Ciência",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200",
    views: "2.8M visualizações",
    logoColor: "bg-purple-600"
  },
  {
    id: "br-13",
    title: "National Geographic - No Coração da Floresta Amazônica",
    desc: "Uma expedição visual extraordinária que desbrava a biodiversidade, a fauna espetacular e as complexidades ecológicas da maior e mais importante floresta tropical do nosso planeta.",
    url: "https://www.youtube.com/embed/F77F4nN-M58",
    type: "youtube",
    category: "Documentários",
    imageUrl: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=1200",
    views: "4.5M visualizações",
    logoColor: "bg-green-600"
  },
  {
    id: "br-14",
    title: "National Geographic - Criaturas da Fossa das Marianas",
    desc: "Explore o ponto mais profundo dos oceanos terrestres, a mais de 11 mil metros de profundidade. Conheça as formas de vida extraordinárias adaptadas a pressões extremas e escuridão absoluta.",
    url: "https://www.youtube.com/embed/L_f7S-OaDoo",
    type: "youtube",
    category: "Documentários",
    imageUrl: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?q=80&w=1200",
    views: "6.2M visualizações",
    logoColor: "bg-blue-600"
  },
  {
    id: "br-15",
    title: "National Geographic - Segredos Revelados do Antigo Egito",
    desc: "Uso de varreduras a laser de altíssima definição 3D e radares de solo revelam câmaras secretas enterradas há milênios sob as pirâmides monumentais e os túmulos dos grandes faraós.",
    url: "https://www.youtube.com/embed/f7M-I6P2U-Q",
    type: "youtube",
    category: "Documentários",
    imageUrl: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?q=80&w=1200",
    views: "5.1M visualizações",
    logoColor: "bg-amber-600"
  },
  {
    id: "br-16",
    title: "National Geographic - Missão Marte: A Nova Fronteira",
    desc: "Os avanços da aeroengenharia moderna e da biologia espacial para tornar possível a primeira viagem tripulada de colonização a Marte e os impactos psicológicos nos astronautas pioneiros.",
    url: "https://www.youtube.com/embed/Ld_A3g-1G10",
    type: "youtube",
    category: "Documentários",
    imageUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1200",
    views: "3.8M visualizações",
    logoColor: "bg-rose-600"
  },
  {
    id: "br-17",
    title: "National Geographic - O Alerta Global de Oceanos de Plástico",
    desc: "Acompanhe cientistas marinhos em uma jornada investigativa chocante que expõe a presença massiva de microplásticos nas cadeias alimentares marítimas e as soluções de limpeza ecológica.",
    url: "https://www.youtube.com/embed/jfKfPfyJRdk",
    type: "youtube",
    category: "Documentários",
    imageUrl: "https://images.unsplash.com/photo-1520116468816-95b69f847357?q=80&w=1200",
    views: "4.2M visualizações",
    logoColor: "bg-teal-600"
  },
  {
    id: "br-18",
    title: "National Geographic - O Poder Oculto dos Vulcões Ativos",
    desc: "Descubra as forças tectônicas gigantescas que modelam a Terra por meio do estudo de cientistas vulcano-geólogos que escalam crateras ativas em busca de amostras de magma incandescente.",
    url: "https://www.youtube.com/embed/38BcoC27_44",
    type: "youtube",
    category: "Documentários",
    imageUrl: "https://images.unsplash.com/photo-1460194436988-671f763436b7?q=80&w=1200",
    views: "2.9M visualizações",
    logoColor: "bg-orange-600"
  },
  {
    id: "br-19",
    title: "National Geographic - A Grande Migração nas Savanas",
    desc: "O ciclo anual de vida e sobrevivência espetacular onde mais de dois milhões de herbívoros cruzam rios repletos de predadores na áfrica Oriental em busca de pastagens verdes.",
    url: "https://www.youtube.com/embed/Ati67gY9fgg",
    type: "youtube",
    category: "Documentários",
    imageUrl: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=1200",
    views: "3.5M visualizações",
    logoColor: "bg-emerald-700"
  },
  {
    id: "br-20",
    title: "National Geographic - A Física das Grandes Tempestades",
    desc: "Uma análise científica climática de ponta sobre como a elevação das temperaturas globais de água do mar alimenta furacões catastróficos e supertempestades devastadoras.",
    url: "https://www.youtube.com/embed/X8y_C89R-rY",
    type: "youtube",
    category: "Documentários",
    imageUrl: "https://images.unsplash.com/photo-1504253163759-c23fcca5e559?q=80&w=1200",
    views: "1.7M visualizações",
    logoColor: "bg-slate-700"
  }
];

export const Cinema: React.FC<{
  stats: any;
  updateStats: (updater: (prev: any) => any) => void;
  addLog: (type: any, desc: string, amount: number, currency: 'coins' | 'real') => void;
  loggedInUser?: any;
  onOpenLogin?: () => void;
}> = ({ stats, updateStats, addLog, loggedInUser, onOpenLogin }) => {
  // State for Youtube config (persistent)
  const [youtubeHandle, setYoutubeHandle] = useState<string>(() => {
    return localStorage.getItem('gamezone_yt_handle') || '@jacopiei';
  });
  const [youtubeEmail, setYoutubeEmail] = useState<string>(() => {
    return localStorage.getItem('gamezone_yt_email') || 'redrubspirits@gmail.com';
  });
  const [youtubeApiKey, setYoutubeApiKey] = useState<string>(() => {
    return localStorage.getItem('gamezone_yt_apikey') || '';
  });
  const [youtubeChannelId, setYoutubeChannelId] = useState<string>(() => {
    return localStorage.getItem('gamezone_yt_channel_id') || 'UC-7vE4-6p2rXgBic3GZ7bCw'; // Simulated default for jacopiei
  });
  const [integrationMode, setIntegrationMode] = useState<'simulated' | 'real'>(() => {
    return (localStorage.getItem('gamezone_yt_mode') as 'simulated' | 'real') || 'simulated';
  });

  // User uploaded movies list (persisted in localStorage)
  const [userUploadedMovies, setUserUploadedMovies] = useState<MediaItem[]>(() => {
    const cached = localStorage.getItem('gamezone_cinema_user_uploads');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Error parsing cached uploads:', e);
      }
    }
    return [
      {
        id: 'user-upload-1',
        title: 'Coringa Retro: O Ultimato',
        description: 'Um retrato psicológico de um comediante de fliperamas que decide hackear o sistema de apostas para combater a corrupção corporativa do cassino de São Paulo.',
        category: 'blockbuster',
        year: 2026,
        rating: '16+',
        duration: '1h 48min',
        matchScore: 98,
        imageUrl: 'https://images.unsplash.com/photo-1601513525393-8393e5518e31?q=80&w=400',
        youtubeId: 'f7M-I6P2U-Q',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        tags: ['AI-Optimized', 'Cyberpunk', 'Gamer', 'Justiça']
      },
      {
        id: 'user-upload-2',
        title: 'Retro-Futuro de Pixel',
        description: 'Documentário de ficção sobre os heróis anônimos que mantiveram vivos os servidores de jogos online dos anos 2000 em meio a um apagão digital mundial.',
        category: 'gaming_docs',
        year: 2026,
        rating: 'Livre',
        duration: '1h 15min',
        matchScore: 94,
        imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400',
        youtubeId: 'Ld_A3g-1G10',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        tags: ['História', 'Tecnologia', 'Salvação', 'Nostalgia']
      }
    ];
  });

  // Upload Form states
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadSynopsis, setUploadSynopsis] = useState<string>('');
  const [uploadImageOption, setUploadImageOption] = useState<'url' | 'file' | 'preset'>('preset');
  const [uploadImageUrl, setUploadImageUrl] = useState<string>('');
  const [uploadPreset, setUploadPreset] = useState<string>('synthwave');
  const [uploadFileBase64, setUploadFileBase64] = useState<string>('');
  const [uploadYoutubeId, setUploadYoutubeId] = useState<string>('');
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiStep, setAiStep] = useState<string>('');

  const PRESET_IMAGES: Record<string, { label: string; url: string }> = {
    synthwave: {
      label: 'Synthwave Grid',
      url: 'https://images.unsplash.com/photo-1515260268569-9271009adfdb?q=80&w=600'
    },
    cyberpunk: {
      label: 'Cyberpunk Alley',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600'
    },
    classic_arcade: {
      label: 'Vintage Arcade',
      url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600'
    },
    retro_gaming: {
      label: 'Neon Gamepad',
      url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600'
    },
    cosmic_space: {
      label: 'Space Nebula',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600'
    },
    noir: {
      label: 'Mystery Cinema',
      url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=600'
    }
  };

  // UI state variables
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Cinema e TV States (Dual Player Streaming System)
  const [cinemaSubTab, setCinemaSubTab] = useState<'tv' | 'catalog'>('tv');
  const [currentMediaType, setCurrentMediaType] = useState<'iptv' | 'youtube' | 'idle'>('youtube');
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string>('https://www.youtube.com/embed/live_stream?channel=UC_gWv3fT8u5q7UvR6X7U7vg');
  const [currentMediaTitle, setCurrentMediaTitle] = useState<string>('CNN Brasil Ao Vivo');
  const [currentMediaDesc, setCurrentMediaDesc] = useState<string>('Transmissão de notícias 24h em tempo real da CNN Brasil. Cobertura completa de política, economia, saúde e reportagens especiais diretas de São Paulo e Brasília.');
  const [tvBannerIndex, setTvBannerIndex] = useState<number>(0);
  const [tvChannelFilter, setTvChannelFilter] = useState<string>('Todos');
  const [videojsReady, setVideojsReady] = useState<boolean>(false);
  const [customChannels, setCustomChannels] = useState<any[]>(() => {
    const cached = localStorage.getItem('gamezone_custom_channels');
    return cached ? JSON.parse(cached) : [];
  });
  const [customChannelName, setCustomChannelName] = useState<string>('');
  const [customChannelUrl, setCustomChannelUrl] = useState<string>('');
  const [customChannelType, setCustomChannelType] = useState<'iptv' | 'youtube'>('iptv');
  const [showAddChannelModal, setShowAddChannelModal] = useState<boolean>(false);

  // References for Video.js player
  const videojsElementRef = useRef<HTMLVideoElement | null>(null);
  const videojsPlayerRef = useRef<any>(null);
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [myList, setMyList] = useState<string[]>(() => {
    const cached = localStorage.getItem('gamezone_cinema_mylist');
    return cached ? JSON.parse(cached) : ['orig-1', 'block-2'];
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [ytVideos, setYtVideos] = useState<MediaItem[]>([]);
  const [isLoadingYt, setIsLoadingYt] = useState<boolean>(false);

  // Banner Carousel States
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [isHoveredCarousel, setIsHoveredCarousel] = useState<boolean>(false);

  // References for rows scroll
  const ytRowRef = useRef<HTMLDivElement>(null);
  const origRowRef = useRef<HTMLDivElement>(null);
  const blockRowRef = useRef<HTMLDivElement>(null);
  const docRowRef = useRef<HTMLDivElement>(null);
  const userRowRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);

  // Default simulated Youtube Videos representing "@jacopiei"
  const DEFAULT_JACOPIEI_VIDEOS: MediaItem[] = [
    {
      id: 'yt-1',
      title: 'Joguei o Pior Jogo do Mundo e Me Arrependi Amargamente! 💀',
      description: 'Desta vez @jacopiei se aventurou nos confins da internet para testar o pior jogo já desenvolvido. Risadas, frustrações e momentos de pura loucura nesta gameplay épica!',
      category: 'youtube',
      year: 2026,
      rating: '12+',
      duration: '18 min',
      matchScore: 98,
      imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=400',
      youtubeId: 'Ld_A3g-1G10', // Cool gaming video
      tags: ['Gameplay', 'Humor', 'Arcade', 'Desafio']
    },
    {
      id: 'yt-2',
      title: 'Reagindo aos Piores Momentos do Futebol Brasileiro ⚽',
      description: 'Prepare o lenço porque você vai chorar de rir! Um compilado absurdo com as piores jogadas, falhas de goleiros e momentos bizarros que só acontecem no futebol do Brasil.',
      category: 'youtube',
      year: 2026,
      rating: 'Livre',
      duration: '22 min',
      matchScore: 95,
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=400',
      youtubeId: '9p2gBOfX-n8',
      tags: ['Reação', 'Futebol', 'Gols Perdidos', 'Meme']
    },
    {
      id: 'yt-3',
      title: 'Comprei uma Caixa Misteriosa de Games de R$ 1.000! 📦',
      description: 'Será que fui enganado ou tirei a sorte grande? Abri uma caixa misteriosa lacrada que comprei na deep web cheia de cartuchos antigos, consoles e acessórios bizarros.',
      category: 'youtube',
      year: 2026,
      rating: '10+',
      duration: '15 min',
      matchScore: 99,
      imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400',
      youtubeId: 'dQw4w9WgXcQ', // Classic Rickroll or placeholder
      tags: ['Unboxing', 'Caixa Misteriosa', 'Hardware', 'Retrô']
    },
    {
      id: 'yt-4',
      title: 'Desafio Extremo: Se Rir, Você Perde R$ 500 no Pix! 💸',
      description: 'Tentei não dar uma única risada assistindo aos memes mais novos e virais da comunidade. O final foi chocante e custou caro para o bolso do canal!',
      category: 'youtube',
      year: 2026,
      rating: '14+',
      duration: '12 min',
      matchScore: 94,
      imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=400',
      youtubeId: '9bZkp7q19f0',
      tags: ['Tente não rir', 'Desafio', 'Pix', 'Humor']
    },
    {
      id: 'yt-5',
      title: 'Como Hackear um Fliperama Antigo usando Programação (Sério!) 🕹️',
      description: 'Uma aula prática de como funcionavam as placas de fliperama dos anos 90 e como @jacopiei usou engenharia reversa para habilitar créditos infinitos.',
      category: 'youtube',
      year: 2026,
      rating: '16+',
      duration: '25 min',
      matchScore: 97,
      imageUrl: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?q=80&w=400',
      youtubeId: 'Z-43S89YjJ4',
      tags: ['Tech', 'Hacking', 'Fliperama', 'Nostalgia']
    }
  ];

  // Fictitious Originals Row
  const ORIGINALS_ITEMS: MediaItem[] = [
    {
      id: 'orig-1',
      title: 'Arcade Masters',
      description: 'Cinco programadores rivais se unem para salvar o último fliperama clássico de São Paulo. Mas, para isso, precisam decodificar um bug que ameaça todo o ecossistema virtual global.',
      category: 'originals',
      year: 2026,
      rating: '14+',
      duration: '8 Episódios',
      matchScore: 99,
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=400',
      youtubeId: 'f7M-I6P2U-Q',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      tags: ['Suspense', 'Sci-Fi', 'Geek', 'Exclusivo']
    },
    {
      id: 'orig-2',
      title: 'The Pix Legend',
      description: 'Um jovem herói descobre um algoritmo oculto que multiplica transações Pix na velocidade da luz. Caçado pela Interpol e bancos digitais, ele vira o Robin Hood dos tempos modernos.',
      category: 'originals',
      year: 2026,
      rating: '16+',
      duration: '1 Temporada',
      matchScore: 97,
      imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?q=80&w=400',
      youtubeId: 'Ld_A3g-1G10',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      tags: ['Ação', 'Drama', 'Finanças', 'Cibernético']
    },
    {
      id: 'orig-3',
      title: 'Only Up! A Ascensão',
      description: 'Inspirado no jogo viral. Um escalador de favelas precisa subir uma misteriosa estrutura vertical infinita que surgiu sobre a cidade para resgatar sua família e descobrir a verdade cósmica.',
      category: 'originals',
      year: 2025,
      rating: '10+',
      duration: 'Film',
      matchScore: 93,
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400',
      youtubeId: 'dQw4w9WgXcQ',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      tags: ['Aventura', 'Sobrevivência', 'Superação']
    },
    {
      id: 'orig-4',
      title: 'Roleta Russa: Destinos',
      description: 'Um grupo de bilionários decadentes aposta suas fortunas em uma partida sinistra de roleta clandestina monitorada por inteligência artificial avançada. Quem sairá vivo?',
      category: 'originals',
      year: 2026,
      rating: '18+',
      duration: '6 Episódios',
      matchScore: 96,
      imageUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=400',
      youtubeId: '9p2gBOfX-n8',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      tags: ['Thriller', 'Aposta', 'Mistério', 'Sombrio']
    }
  ];

  // Fictitious Blockbuster movies
  const BLOCKBUSTER_ITEMS: MediaItem[] = [
    {
      id: 'block-1',
      title: 'Operação Milhão',
      description: 'O maior roubo a um banco de dados suíço planejado pelo mais improvável grupo de golpistas brasileiros usando apenas engenharia social e simuladores virtuais.',
      category: 'blockbuster',
      year: 2025,
      rating: '14+',
      duration: '2h 10min',
      matchScore: 95,
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400',
      youtubeId: 'Ld_A3g-1G10',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
      tags: ['Assalto', 'Intriga', 'Ação', 'Veloz']
    },
    {
      id: 'block-2',
      title: 'Código da Vitória',
      description: 'Um matemático com problemas com jogos descobre a equação matemática que prevê placares exatos no futebol. Quando os maiores sindicatos de apostas mundiais descobrem, o jogo fica perigoso.',
      category: 'blockbuster',
      year: 2026,
      rating: '12+',
      duration: '1h 55min',
      matchScore: 98,
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=400',
      youtubeId: '9p2gBOfX-n8',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      tags: ['Drama', 'Estratégia', 'Futebol', 'Matemática']
    },
    {
      id: 'block-3',
      title: 'Sombra do Tigre',
      description: 'Nos templos da Ásia, o mestre do jogo do Tigre treina seu último pupilo na arte espiritual do RTP para resgatar a prosperidade perdida de sua linhagem ancestral.',
      category: 'blockbuster',
      year: 2025,
      rating: '10+',
      duration: '2h 05min',
      matchScore: 92,
      imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400',
      youtubeId: 'f7M-I6P2U-Q',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      tags: ['Artes Marciais', 'Magia', 'Tigre', 'Mítico']
    },
    {
      id: 'block-4',
      title: 'O Último Recorde',
      description: 'Após anos aposentado, o maior recordista mundial de Tetris e Pacman é convocado por uma agência espacial para enfrentar uma inteligência extraterrestre que joga com o planeta.',
      category: 'blockbuster',
      year: 2026,
      rating: 'Livre',
      duration: '1h 48min',
      matchScore: 91,
      imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400',
      youtubeId: 'dQw4w9WgXcQ',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      tags: ['Comédia', 'Ficção Científica', 'Família']
    }
  ];

  // Gaming Docs items
  const DOCS_ITEMS: MediaItem[] = [
    {
      id: 'doc-1',
      title: 'Inside the Screen: A Era dos Arcades',
      description: 'Documentário profundo e revelador sobre as origens do mercado de fliperamas, desde as garagens de Tóquio até o ápice financeiro dos anos 80 nos shopping centers.',
      category: 'gaming_docs',
      year: 2024,
      rating: 'Livre',
      duration: '1h 30min',
      matchScore: 89,
      imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=400',
      youtubeId: 'Ld_A3g-1G10',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      tags: ['Documentário', 'História', 'Games', 'Nostalgia']
    },
    {
      id: 'doc-2',
      title: 'Faker: A Dinastia dos Esports',
      description: 'Conheça os bastidores exclusivos, o treinamento mental de 14 horas por dia e o preço da glória do maior jogador de League of Legends de todos os tempos.',
      category: 'gaming_docs',
      year: 2025,
      rating: 'Livre',
      duration: '1h 45min',
      matchScore: 96,
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400',
      youtubeId: '9p2gBOfX-n8',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      tags: ['Documentário', 'Esports', 'LoL', 'Superação']
    }
  ];

  // Combine lists for searches including user-uploaded films
  const ALL_MEDIA_ITEMS = [...userUploadedMovies, ...ytVideos, ...ORIGINALS_ITEMS, ...BLOCKBUSTER_ITEMS, ...DOCS_ITEMS];

  // Carrossel de banners animados e de alta conversão destacando os filmes mais recentes postados por usuários
  const carouselItems: MediaItem[] = React.useMemo(() => {
    const list = [...userUploadedMovies, ...BLOCKBUSTER_ITEMS, ...ORIGINALS_ITEMS];
    const uniqueMap = new Map<string, MediaItem>();
    list.forEach(item => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });
    return Array.from(uniqueMap.values()).slice(0, 5);
  }, [userUploadedMovies]);

  // Auto-play timer for high-converting banner carousel
  useEffect(() => {
    if (isHoveredCarousel || carouselItems.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % carouselItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHoveredCarousel, carouselItems.length]);

  // Automatically reset to first slide when a new movie is uploaded by community
  useEffect(() => {
    setCarouselIndex(0);
  }, [userUploadedMovies.length]);

  // Auto-play timer for TV live channels highlights banner
  useEffect(() => {
    if (cinemaSubTab !== 'tv') return;
    const interval = setInterval(() => {
      setTvBannerIndex(prev => (prev + 1) % 6);
    }, 6000);
    return () => clearInterval(interval);
  }, [cinemaSubTab]);

  // Dynamic CDN Loader for Video.js (HLS/IPTV Stream Decoder)
  useEffect(() => {
    // 1. Append CSS Link
    let cssLink = document.getElementById('videojs-cdn-css') as HTMLLinkElement;
    if (!cssLink) {
      cssLink = document.createElement('link');
      cssLink.id = 'videojs-cdn-css';
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://vjs.zencdn.net/8.10.0/video-js.css';
      document.head.appendChild(cssLink);
    }

    // 2. Append Javascript Script
    let jsScript = document.getElementById('videojs-cdn-js') as HTMLScriptElement;
    if (!jsScript) {
      jsScript = document.createElement('script');
      jsScript.id = 'videojs-cdn-js';
      jsScript.src = 'https://vjs.zencdn.net/8.10.0/video.min.js';
      jsScript.async = true;
      jsScript.onload = () => {
        setVideojsReady(true);
        if ((window as any).videojs) {
          try {
            (window as any).videojs.log.level('off');
          } catch (e) {}
        }
      };
      document.head.appendChild(jsScript);
    } else {
      setVideojsReady(true);
      if ((window as any).videojs) {
        try {
          (window as any).videojs.log.level('off');
        } catch (e) {}
      }
    }

    // Cleanup when component unmounts
    return () => {
      if (videojsPlayerRef.current) {
        try {
          videojsPlayerRef.current.dispose();
          videojsPlayerRef.current = null;
        } catch (e) {
          console.error('Error disposing Video.js on cleanup:', e);
        }
      }
    };
  }, []);

  const handlePlayerError = (failedUrl: string, failedTitle: string) => {
    console.warn(`VideoJS error encountered loading: ${failedUrl} (${failedTitle})`);
    
    if (videojsPlayerRef.current) {
      try {
        videojsPlayerRef.current.error(null);
      } catch (e) {
        console.error('Error clearing Video.js error:', e);
      }
    }

    const currentChannel = PRECONFIGURED_BR_CHANNELS.find(ch => ch.url === failedUrl || ch.title === failedTitle);
    
    if (currentChannel && currentChannel.fallbackUrl) {
      showToast(`⚠️ Sinal IPTV instável ou bloqueado. Sintonizando transmissão alternativa via YouTube...`);
      setTimeout(() => {
        setCurrentMediaType('youtube');
        setCurrentMediaUrl(currentChannel.fallbackUrl);
        if (videojsPlayerRef.current) {
          try {
            videojsPlayerRef.current.error(null);
          } catch (e) {}
        }
      }, 100);
    } else {
      showToast(`❌ Falha ao carregar canal IPTV (CORS ou erro de rede).`);
    }
  };

  // Expert MudarMídia Function: Alternates Player visibility & handles playback
  const mudarMidia = (tipo: 'iptv' | 'youtube', url: string, title: string, description: string) => {
    playSound.click();
    setCurrentMediaType(tipo);
    setCurrentMediaUrl(url);
    setCurrentMediaTitle(title);
    setCurrentMediaDesc(description);

    if (tipo === 'youtube') {
      // 1. Pause IPTV Video.js Player immediately
      if (videojsPlayerRef.current) {
        try {
          videojsPlayerRef.current.pause();
        } catch (e) {
          console.error('Error pausing Video.js on Youtube switch:', e);
        }
      }
    } else if (tipo === 'iptv') {
      // 2. Load .m3u8/HLS using Video.js with standard configuration and auto-play
      setTimeout(() => {
        if ((window as any).videojs) {
          try {
            // Ensure logger level is off
            try { (window as any).videojs.log.level('off'); } catch (_) {}

            if (!videojsPlayerRef.current) {
              videojsPlayerRef.current = (window as any).videojs('videojs-live-player', {
                controls: true,
                autoplay: true,
                preload: 'auto',
                responsive: true,
                fluid: true,
                errorDisplay: false, // Suppress Video.js native error overlay modal
                html5: {
                  vhs: {
                    overrideNative: true
                  }
                }
              }, () => {
                videojsPlayerRef.current.src({ src: url, type: 'application/x-mpegURL' });
                
                // Add error listener
                videojsPlayerRef.current.on('error', (e: any) => {
                  if (e) {
                    try {
                      if (typeof e.preventDefault === 'function') e.preventDefault();
                      if (typeof e.stopPropagation === 'function') e.stopPropagation();
                    } catch (_) {}
                  }
                  handlePlayerError(url, title);
                });

                videojsPlayerRef.current.play().catch((err: any) => {
                  console.log('Video.js autoplay was blocked or delayed:', err);
                });
              });
            } else {
              // Reset error before setting new source
              videojsPlayerRef.current.error(null);
              videojsPlayerRef.current.off('error');
              
              videojsPlayerRef.current.src({ src: url, type: 'application/x-mpegURL' });
              
              // Register new error listener
              videojsPlayerRef.current.on('error', (e: any) => {
                if (e) {
                  try {
                    if (typeof e.preventDefault === 'function') e.preventDefault();
                    if (typeof e.stopPropagation === 'function') e.stopPropagation();
                  } catch (_) {}
                }
                handlePlayerError(url, title);
              });

              videojsPlayerRef.current.load();
              videojsPlayerRef.current.play().catch((err: any) => {
                console.log('Video.js play was blocked or delayed:', err);
              });
            }
          } catch (e) {
            console.error('Failed to load IPTV stream with Video.js:', e);
          }
        }
      }, 100);
    }
  };

  // Toggle picture-in-picture mode for the native HTML5 video player used by Video.js
  const togglePictureInPicture = async () => {
    playSound.click();

    if (currentMediaType !== 'iptv') {
      showToast('⚠️ O modo Picture-in-Picture nativo está disponível apenas para canais de TV ao vivo (IPTV).');
      return;
    }

    try {
      // Find the native video element of Video.js
      const videoElement = document.getElementById('videojs-live-player_html5_api') as HTMLVideoElement || 
                           document.getElementById('videojs-live-player') as HTMLVideoElement;

      if (!videoElement) {
        showToast('⚠️ Player de vídeo não encontrado ou ainda não carregado.');
        return;
      }

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        showToast('📺 Modo flutuante (PiP) desativado.');
      } else {
        if (document.pictureInPictureEnabled || (videoElement as any).webkitSupportsPresentationMode) {
          await videoElement.requestPictureInPicture();
          showToast('📺 Modo flutuante (PiP) ativado com sucesso!');
        } else {
          showToast('❌ Seu navegador não oferece suporte para Picture-in-Picture.');
        }
      }
    } catch (error: any) {
      console.error('Erro ao alternar Picture-in-Picture:', error);
      showToast('❌ Falha ao iniciar Picture-in-Picture. Certifique-se de que o vídeo começou a tocar.');
    }
  };

  // Pre-carregamento dinâmico de imagens do carrossel para transições instantâneas e navegação ultra leve
  useEffect(() => {
    if (carouselItems && carouselItems.length > 0) {
      carouselItems.forEach(item => {
        if (item.imageUrl) {
          const img = new Image();
          img.src = item.imageUrl;
        }
      });
    }
  }, [carouselItems]);

  // Fetch community movies on mount from Firestore
  useEffect(() => {
    const fetchCommunityMovies = async () => {
      try {
        const dbMovies = await getMovies();
        if (dbMovies && dbMovies.length > 0) {
          setUserUploadedMovies(prev => {
            const localIds = new Set(prev.map(m => m.id));
            const newFromDb = dbMovies.filter(m => !localIds.has(m.id));
            return [...newFromDb, ...prev];
          });
        }
      } catch (err) {
        console.error('Error fetching community movies from Firestore:', err);
      }
    };
    fetchCommunityMovies();
  }, []);

  // Handle local base64 file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadFileBase64(reader.result as string);
        playSound.click();
      };
      reader.readAsDataURL(file);
    }
  };

  // Process movie submission with AI Recognition Animation
  const handleAiPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      showToast('⚠️ Por favor, insira o título do filme.');
      return;
    }

    playSound.click();
    setAiAnalyzing(true);
    
    // Staggered AI Steps Simulation for high visual engagement
    const steps = [
      '🔍 Analisando formato da imagem e resolução...',
      '🤖 Executando reconhecimento facial e de ambiente por IA...',
      '📝 Otimizando a sinopse e gerando legendas cativantes...',
      '🏷️ Criando tags de engajamento recomendadas...',
      '✨ Integrando cartaz de cinema nos destaques com matching automático...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setAiStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Now construct the final AI-optimized item!
    // Select image
    let finalImg = PRESET_IMAGES[uploadPreset]?.url || PRESET_IMAGES.synthwave.url;
    if (uploadImageOption === 'url' && uploadImageUrl) {
      finalImg = uploadImageUrl;
    } else if (uploadImageOption === 'file' && uploadFileBase64) {
      finalImg = uploadFileBase64;
    }

    // AI optimization of synopsis
    const aiOptimizedDescription = uploadSynopsis.trim() 
      ? `[Reconhecido por IA GameZone] ${uploadSynopsis} - Uma narrativa espetacular que envolve suspense e reviravoltas no ecossistema virtual.`
      : `[Reconhecido por IA GameZone] "${uploadTitle}" é um thriller futurista onde o destino dos personagens colide com o submundo dos jogos eletrônicos e transmissões ao vivo. Uma obra-prima moderna de alta definição e match impecável de engajamento.`;

    // AI generation of tags
    const presetTags = ['IA-Reconhecido', 'Exclusivo', 'FullHD', 'GameZone-Cine'];
    if (uploadTitle.toLowerCase().includes('arcade') || uploadTitle.toLowerCase().includes('retro') || uploadTitle.toLowerCase().includes('game')) {
      presetTags.push('Nostalgia', 'Gamer');
    } else {
      presetTags.push('Ação', 'Suspense');
    }

    const newMedia: MediaItem = {
      id: `user-upload-${Date.now()}`,
      title: uploadTitle,
      description: aiOptimizedDescription,
      category: 'blockbuster', // Display as user-uploaded / blockbuster style
      year: 2026,
      rating: '14+',
      duration: '1h 50min',
      matchScore: Math.floor(Math.random() * 8) + 92, // High match score 92% to 99%
      imageUrl: finalImg,
      youtubeId: uploadYoutubeId.trim() || undefined,
      tags: presetTags
    };

    // Update state and persistence
    const uploaderId = loggedInUser ? getCleanUserId(loggedInUser) || 'anonymous' : 'anonymous';
    const uploaderName = loggedInUser?.name || 'Anônimo';

    const finalMovieToSave: any = {
      ...newMedia,
      uploaderId,
      uploaderName,
      createdAt: new Date().toISOString()
    };

    const updated = [finalMovieToSave, ...userUploadedMovies];
    setUserUploadedMovies(updated);
    localStorage.setItem('gamezone_cinema_user_uploads', JSON.stringify(updated));

    // Save to community cloud Firestore database
    addMovie(finalMovieToSave).catch(err => {
      console.error('Error saving uploaded movie to Firestore:', err);
    });

    // Also trigger log in player stats
    addLog('cine_publish', `Publicou o filme "${uploadTitle}" otimizado por IA`, 100, 'coins');
    updateStats(prev => ({
      ...prev,
      points: (prev.points ?? 0) + 20, // Award experience points for creative contribution
      coins: prev.coins + 100   // Award coin bonus
    }));

    // Reset states
    setUploadTitle('');
    setUploadSynopsis('');
    setUploadImageUrl('');
    setUploadFileBase64('');
    setUploadYoutubeId('');
    
    setAiAnalyzing(false);
    setShowUploadModal(false);
    playSound.victory(); // High fidelity celebration sound!
    showToast(`🎬 "${newMedia.title}" publicado com IA e destacado nos banners!`);
  };

  // Handle configuration submit
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    playSound.purchase();
    
    localStorage.setItem('gamezone_yt_handle', youtubeHandle);
    localStorage.setItem('gamezone_yt_email', youtubeEmail);
    localStorage.setItem('gamezone_yt_apikey', youtubeApiKey);
    localStorage.setItem('gamezone_yt_channel_id', youtubeChannelId);
    localStorage.setItem('gamezone_yt_mode', integrationMode);

    showToast('💾 Configurações salvas com sucesso! Canal sincronizado.');
    setShowConfig(false);
    
    // Trigger video refresh
    fetchYoutubeVideos();
  };

  // Simulated or Real fetch of YouTube Videos
  const fetchYoutubeVideos = async () => {
    setIsLoadingYt(true);
    
    if (integrationMode === 'real' && youtubeApiKey && youtubeChannelId) {
      try {
        // Real connection to Youtube API Data v3
        // Searching for videos from channelId
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${youtubeApiKey}&channelId=${youtubeChannelId}&part=snippet,id&order=date&maxResults=10&type=video`
        );
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          const fetchedItems: MediaItem[] = data.items.map((item: any, idx: number) => ({
            id: `yt-fetched-${item.id.videoId}`,
            title: item.snippet.title,
            description: item.snippet.description || 'Nenhuma descrição fornecida pelo canal.',
            category: 'youtube' as const,
            year: new Date(item.snippet.publishedAt).getFullYear(),
            rating: '10+',
            duration: 'Vídeo do YouTube',
            matchScore: 95 - idx,
            imageUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=400',
            youtubeId: item.id.videoId,
            tags: ['YouTube Live', youtubeHandle, 'Novo']
          }));
          setYtVideos(fetchedItems);
          showToast('✅ Feed real-time do YouTube importado com sucesso!');
        } else {
          setYtVideos(DEFAULT_JACOPIEI_VIDEOS);
        }
      } catch (err) {
        console.error('Error fetching real YouTube API data:', err);
        // Fallback to high-fidelity simulated
        setYtVideos(DEFAULT_JACOPIEI_VIDEOS);
      }
    } else {
      // High fidelity simulation mode (reads config values)
      setTimeout(() => {
        const updatedSimulated = DEFAULT_JACOPIEI_VIDEOS.map(vid => ({
          ...vid,
          title: vid.title.replace('@jacopiei', youtubeHandle),
          description: vid.description.replace('@jacopiei', youtubeHandle),
          tags: vid.tags.map(t => t === '@jacopiei' ? youtubeHandle : t)
        }));
        setYtVideos(updatedSimulated);
      }, 500);
    }
    setIsLoadingYt(false);
  };

  useEffect(() => {
    fetchYoutubeVideos();
  }, [youtubeHandle, youtubeChannelId, integrationMode]);

  // Synchronize myList with localStorage
  useEffect(() => {
    localStorage.setItem('gamezone_cinema_mylist', JSON.stringify(myList));
  }, [myList]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleMyList = (id: string) => {
    playSound.click();
    if (myList.includes(id)) {
      setMyList(prev => prev.filter(x => x !== id));
      showToast('❌ Removido da Minha Lista');
    } else {
      setMyList(prev => [...prev, id]);
      showToast('💖 Adicionado à Minha Lista');
    }
  };

  // Horizontal scroll buttons
  const scrollRow = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    playSound.click();
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Filtered items based on search query
  const filteredMedia = searchQuery 
    ? ALL_MEDIA_ITEMS.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // Hero Featured Banner item
  const featuredItem: MediaItem = ytVideos[0] || DEFAULT_JACOPIEI_VIDEOS[0];

  return (
    <div className="text-slate-100 min-h-screen relative bg-[#141414]" id="cine-hub-root">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-[#E50914] text-white font-bold rounded-full shadow-2xl border border-red-500/30 flex items-center gap-2.5 text-xs"
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Netflix Premium Topbar Accent */}
      <div className="h-1.5 bg-gradient-to-r from-red-600 via-[#E50914] to-red-800" />

      {/* Netflix Sub-Header Navigation */}
      <div className="bg-[#141414] border-b border-zinc-800/40 px-4 py-3 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-[#E50914] text-white font-black text-xs uppercase tracking-widest rounded-md animate-pulse">
            NETFLIX STYLE
          </div>
          <div className="text-slate-200 text-xs md:text-sm font-semibold flex items-center gap-1.5">
            <Tv className="w-4 h-4 text-[#E50914]" />
            <span>CINE COISA DE CINEMA &amp; REAL-TIME FEED</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Custom Search bar */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar filmes, séries ou tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-red-600 focus:outline-none rounded-full text-xs text-white placeholder-slate-500 w-full sm:w-60 transition-all font-sans"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sync control button */}
          <button 
            onClick={() => {
              playSound.click();
              setShowConfig(true);
            }}
            className="px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-750 border border-zinc-700/60 rounded-xl text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden md:inline">Configurar Canal</span>
            <span className="md:hidden">Canal</span>
          </button>
        </div>
      </div>

      {/* SEARCH RESULTS OVERLAY */}
      {searchQuery && (
        <div className="px-4 py-8 md:px-8 bg-[#141414] min-h-[50vh]">
          <h2 className="text-lg md:text-xl font-black text-slate-200 mb-6 font-sans flex items-center gap-2">
            Resultados para <span className="text-red-500 font-mono">"{searchQuery}"</span>
          </h2>
          
          {filteredMedia.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto" />
              <p className="text-sm font-semibold">Nenhum título fictício ou vídeo de YouTube encontrado.</p>
              <p className="text-xs">Tente buscar por termos como "Futebol", "Arcade", "Desafio" ou "Tigre".</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredMedia.map(item => (
                <div 
                  key={item.id}
                  onClick={() => {
                    playSound.click();
                    setActiveMedia(item);
                  }}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:scale-105 hover:border-red-600/50 transition-all duration-300 cursor-pointer shadow-lg group relative"
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 bg-black/75 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-red-500">
                      {item.matchScore}% Match
                    </div>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <h4 className="text-xs font-extrabold text-white line-clamp-1 group-hover:text-red-500 transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                      <span>{item.year}</span>
                      <span className="px-1 py-0.5 bg-zinc-800 rounded text-[9px] font-bold text-zinc-300">{item.rating}</span>
                      <span>{item.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MAIN CINEMA FRONT-END (Visible when not searching) */}
      {!searchQuery && (
        <>
          {/* PREMIUM CINEMA & TV SUB-NAV TABS */}
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-30 relative border-b border-zinc-800/60 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playSound.click();
                  setCinemaSubTab('tv');
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  cinemaSubTab === 'tv'
                    ? 'bg-[#E50914] text-white shadow-lg shadow-red-600/20 scale-105 border border-red-500'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Tv className="w-4 h-4" />
                <span>📺 Cinema &amp; TV Ao Vivo</span>
              </button>
              <button
                onClick={() => {
                  playSound.click();
                  setCinemaSubTab('catalog');
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  cinemaSubTab === 'catalog'
                    ? 'bg-[#E50914] text-white shadow-lg shadow-red-600/20 scale-105 border border-red-500'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>🍿 Catálogo &amp; Filmes da Comunidade</span>
              </button>
            </div>
            <div className="text-[11px] font-mono text-zinc-500 hidden md:block">
              Sintonizando via <span className="text-[#E50914] font-bold">Video.js HLS &amp; YouTube CDN</span>
            </div>
          </div>

          {/* CINEMA & TV PLAYERS TAB */}
          {cinemaSubTab === 'tv' && (
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fadeIn" id="tv-ao-vivo-section">
              
              {/* LIVE CHANNELS HIGH-CONVERTING HERO BANNER CAROUSEL */}
              <div className="relative w-full rounded-3xl overflow-hidden mb-8 border border-zinc-800/80 bg-zinc-950 min-h-[260px] md:min-h-[320px] flex flex-col justify-end group shadow-2xl">
                {/* Background image of the active channel with black gradient overlay */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={PRECONFIGURED_BR_CHANNELS[tvBannerIndex].imageUrl}
                    alt={PRECONFIGURED_BR_CHANNELS[tvBannerIndex].title}
                    className="w-full h-full object-cover opacity-35 scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-transparent z-10 hidden md:block" />
                </div>

                {/* Banner Content */}
                <div className="relative z-20 p-6 md:p-10 space-y-4 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-2.5 py-1 bg-red-600 text-white font-mono font-black text-[9px] uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-lg shadow-red-900/40 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                      <span>AO VIVO</span>
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-800/80 border border-zinc-700/50 rounded-md text-[9px] font-bold text-zinc-300 uppercase tracking-wider">
                      {PRECONFIGURED_BR_CHANNELS[tvBannerIndex].category}
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      <span>{PRECONFIGURED_BR_CHANNELS[tvBannerIndex].views}</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-xl md:text-3.5xl font-black text-white tracking-tight uppercase font-sans drop-shadow-md">
                      {PRECONFIGURED_BR_CHANNELS[tvBannerIndex].title}
                    </h2>
                    <p className="text-xs md:text-sm text-zinc-300 font-medium leading-relaxed drop-shadow-sm line-clamp-2 md:line-clamp-3">
                      {PRECONFIGURED_BR_CHANNELS[tvBannerIndex].desc}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => {
                        playSound.click();
                        const selectedChan = PRECONFIGURED_BR_CHANNELS[tvBannerIndex];
                        mudarMidia(selectedChan.type, selectedChan.url, selectedChan.title, selectedChan.desc);
                        setTimeout(() => {
                          const el = document.getElementById('player-view-anchor');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                      }}
                      className="px-6 py-3 bg-[#E50914] hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all hover:scale-[1.03] active:scale-95 shadow-xl shadow-red-900/30 flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white text-white" />
                      <span>Sintonizar no Player</span>
                    </button>
                    
                    <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                      CDN: Ativa &amp; 100% Estável
                    </span>
                  </div>
                </div>

                {/* Arrow Controls */}
                <button
                  onClick={() => {
                    playSound.click();
                    setTvBannerIndex(prev => (prev - 1 + 6) % 6);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 border border-zinc-800 hover:border-zinc-700 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-300"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    playSound.click();
                    setTvBannerIndex(prev => (prev + 1) % 6);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 border border-zinc-800 hover:border-zinc-700 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-300"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Banner Indicators (dots) */}
                <div className="absolute bottom-4 right-6 z-30 flex items-center gap-2">
                  {[...Array(6)].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        playSound.click();
                        setTvBannerIndex(idx);
                      }}
                      className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                        tvBannerIndex === idx
                          ? 'bg-[#E50914] w-6'
                          : 'bg-zinc-600 hover:bg-zinc-400'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* SCROLL TARGET FOR DYNAMIC NAVIGATION */}
              <div id="player-view-anchor" className="scroll-mt-24" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* PLAYER CENTRAL (COL-SPAN-8) */}
                <div className="lg:col-span-8 space-y-4">
                  
                  {/* Dynamic Double Player Area */}
                  <div className="relative w-full aspect-[16/9] bg-black rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl shadow-red-950/10 group">
                    {/* Blinking On-Air Overlay Indicator when any media is active */}
                    {currentMediaType !== 'idle' && (
                      <div className="absolute top-4 right-4 z-40 bg-red-600/90 text-white font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg border border-red-500 animate-pulse">
                        <span className="w-2.5 h-2.5 rounded-full bg-white block" />
                        <span>SINAL NO AR</span>
                      </div>
                    )}

                    {/* TV ABERTA / IPTV PLAYER (Video.js) */}
                    <div className={`w-full h-full relative ${currentMediaType === 'iptv' ? '' : 'hidden'}`}>
                      <video
                        id="videojs-live-player"
                        className="video-js vjs-default-skin vjs-big-play-centered w-full h-full aspect-[16/9]"
                        controls
                        preload="auto"
                        playsInline
                      />

                      {/* Manual YouTube Backup button */}
                      {PRECONFIGURED_BR_CHANNELS.find(ch => ch.title === currentMediaTitle)?.fallbackUrl && (
                        <button
                          onClick={() => {
                            playSound.click();
                            const backupUrl = PRECONFIGURED_BR_CHANNELS.find(ch => ch.title === currentMediaTitle)?.fallbackUrl;
                            if (backupUrl) {
                              setCurrentMediaType('youtube');
                              setCurrentMediaUrl(backupUrl);
                              showToast('📺 Alternado para transmissão de backup via YouTube!');
                              if (videojsPlayerRef.current) {
                                try {
                                  videojsPlayerRef.current.pause();
                                  videojsPlayerRef.current.error(null);
                                } catch (e) {}
                              }
                            }
                          }}
                          className="absolute bottom-4 left-4 z-40 bg-zinc-950/80 hover:bg-zinc-900 text-white border border-zinc-850 hover:border-zinc-700 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
                        >
                          <Youtube className="w-3.5 h-3.5 fill-red-600 text-red-600" />
                          <span>Assistir pelo YouTube (Sem Travar)</span>
                        </button>
                      )}
                    </div>

                    {/* YOUTUBE IFRAME PLAYER */}
                    {currentMediaType === 'youtube' && currentMediaUrl && (
                      <div className="relative w-full h-full">
                        <iframe
                          src={`${currentMediaUrl}${currentMediaUrl.includes('?') ? '&' : '?'}autoplay=1&mute=0&modestbranding=1&rel=0`}
                          title={currentMediaTitle}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="w-full h-full aspect-[16/9]"
                        />

                        {/* Option to try IPTV HD again if it's a preconfigured channel */}
                        {PRECONFIGURED_BR_CHANNELS.find(ch => ch.fallbackUrl === currentMediaUrl)?.url && (
                          <button
                            onClick={() => {
                              playSound.click();
                              const iptvUrl = PRECONFIGURED_BR_CHANNELS.find(ch => ch.fallbackUrl === currentMediaUrl)?.url;
                              if (iptvUrl) {
                                showToast('📺 Tentando sintonizar sinal IPTV HD...');
                                mudarMidia('iptv', iptvUrl, currentMediaTitle, currentMediaDesc);
                              }
                            }}
                            className="absolute bottom-4 left-4 z-40 bg-red-600/90 hover:bg-red-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
                          >
                            <Tv className="w-3.5 h-3.5" />
                            <span>Alternar para IPTV (Sinal HD)</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* PLACEHOLDER / IDLE SCREEN */}
                    {currentMediaType === 'idle' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
                        <div className="absolute inset-0 bg-scanlines opacity-[0.04] pointer-events-none" />
                        <div className="p-5 bg-red-600/15 rounded-full border border-red-500/30 text-[#E50914] mb-4 animate-pulse">
                          <Tv className="w-14 h-14" />
                        </div>
                        <h3 className="text-lg md:text-xl font-black text-white font-sans tracking-tight">Sintonizador Cinema &amp; TV</h3>
                        <p className="text-xs text-zinc-400 mt-2.5 max-w-md leading-relaxed">
                          Escolha uma transmissão IPTV ao vivo no formato <span className="text-red-500 font-bold">.m3u8 / HLS</span> ou clipe do <span className="text-red-500 font-bold">YouTube</span> na barra lateral para carregar no player profissional.
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                          <button
                            onClick={() => mudarMidia('iptv', 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.m3u8', 'Canal 1: TV Aberta (HLS Teste)', 'Transmissão IPTV de altíssima definição no formato .m3u8 rodando diretamente com Video.js')}
                            className="px-5 py-2.5 bg-[#E50914] hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all hover:scale-[1.03] shadow-lg shadow-red-600/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Sintonizar Canal 1</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reproducing Info Meta Panel */}
                  <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-500 bg-red-950/30 px-2 py-0.5 rounded border border-red-900/20">
                          {currentMediaType === 'iptv' ? '📺 IPTV .M3U8 HLS' : currentMediaType === 'youtube' ? '🎥 YouTube Video' : '📴 Offline'}
                        </span>
                        <h2 className="text-lg md:text-xl font-black text-white font-sans tracking-tight">
                          {currentMediaTitle}
                        </h2>
                      </div>
                      
                      {currentMediaType !== 'idle' && (
                        <div className="flex flex-wrap items-center gap-2">
                          {currentMediaType === 'iptv' && (
                            <button 
                              onClick={togglePictureInPicture}
                              className="px-3.5 py-2.5 bg-red-600/10 hover:bg-[#E50914] text-red-500 hover:text-white rounded-xl border border-red-500/30 hover:border-red-600 transition-all flex items-center gap-1.5 text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-red-600/10 scale-100 hover:scale-[1.02] active:scale-95 cursor-pointer"
                              title="Ativar Modo Picture-in-Picture (PiP)"
                            >
                              <PictureInPicture className="w-4 h-4 animate-pulse" />
                              <span>Modo Flutuante (PiP)</span>
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              playSound.click();
                              showToast('💖 Canal salvo nos favoritos!');
                            }}
                            className="p-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white rounded-xl border border-zinc-750 transition-colors cursor-pointer"
                            title="Curtir Canal"
                          >
                            <Heart className="w-4 h-4 fill-current text-zinc-400" />
                          </button>
                          <button 
                            onClick={() => {
                              playSound.click();
                              navigator.clipboard.writeText(window.location.href);
                              showToast('🔗 Link do canal copiado para a área de transferência!');
                            }}
                            className="p-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white rounded-xl border border-zinc-750 transition-colors cursor-pointer"
                            title="Compartilhar"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs md:text-sm text-zinc-400 leading-relaxed font-medium">
                      {currentMediaDesc}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-850 text-xs font-mono text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-amber-500" />
                        <span>Espectador Premium: <span className="text-amber-400 font-bold">+5 Moedas / min</span></span>
                      </span>
                      <span>•</span>
                      <span>Sinal: 1080p Full HD</span>
                      <span>•</span>
                      <span>CDN: Ativa &amp; Otimizada</span>
                    </div>
                  </div>

                </div>

                {/* BARRA LATERAL - LISTA DE CANAIS (COL-SPAN-4) */}
                <div className="lg:col-span-4 bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-5 flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-[#E50914]" />
                      <h3 className="font-sans font-black text-white text-sm uppercase tracking-wider">
                        Radar de Canais
                      </h3>
                    </div>
                    <span className="text-[10px] bg-red-950/40 border border-red-900/30 px-2.5 py-0.5 rounded-full text-red-400 font-bold font-mono uppercase tracking-wider animate-pulse">
                      {PRECONFIGURED_BR_CHANNELS.length + customChannels.length} DISPONÍVEIS
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                    Clique em qualquer canal ou vídeo abaixo para alternar e sintonizar instantaneamente usando o player dedicado de alto desempenho.
                  </p>

                  {/* Category Filter Tabs */}
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {['Todos', 'Notícias', 'Ciência', 'Documentários', 'Esportes', 'Desenhos', 'Cultura', 'Variedades'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          playSound.click();
                          setTvChannelFilter(cat);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                          tvChannelFilter === cat
                            ? 'bg-[#E50914] text-white border-red-500 shadow-sm scale-105'
                            : 'bg-zinc-950/40 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* List of Channels */}
                  <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
                    
                    {/* Pre-configured channels */}
                    {PRECONFIGURED_BR_CHANNELS
                      .filter(channel => tvChannelFilter === 'Todos' || channel.category === tvChannelFilter)
                      .map((channel) => {
                        const isSelected = currentMediaUrl === channel.url;
                        return (
                          <button
                            key={channel.id}
                            onClick={() => mudarMidia(channel.type, channel.url, channel.title, channel.desc)}
                            className={`w-full p-3.5 rounded-2xl flex items-start gap-3.5 border text-left transition-all hover:scale-[1.01] cursor-pointer ${
                              isSelected
                                ? 'bg-red-950/20 border-[#E50914] shadow-lg shadow-red-900/5'
                                : 'bg-zinc-950/50 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-zinc-800 relative flex items-center justify-center">
                              <img
                                src={channel.imageUrl}
                                alt={channel.title}
                                className="w-full h-full object-cover opacity-50"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                                {channel.type === 'youtube' ? (
                                  <Youtube className="w-4 h-4 text-red-500 fill-red-500" />
                                ) : (
                                  <Tv className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-[8px] font-mono font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse inline-block" />
                                  <span>{channel.category}</span>
                                </span>
                                <span className="text-[8px] text-zinc-500 font-mono font-bold flex items-center gap-0.5">
                                  <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />
                                  <span>{channel.views}</span>
                                </span>
                              </div>
                              <h4 className={`text-xs font-black line-clamp-1 truncate ${isSelected ? 'text-[#E50914]' : 'text-slate-200'}`}>
                                {channel.title}
                              </h4>
                              <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
                                {channel.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}

                    {/* Custom user-defined channels */}
                    {customChannels.map((channel, index) => {
                      const isSelected = currentMediaUrl === channel.url;
                      return (
                        <div
                          key={`custom-${index}`}
                          className={`w-full p-3.5 rounded-2xl flex items-start gap-3.5 border text-left transition-all hover:scale-[1.01] cursor-pointer ${
                            isSelected
                              ? 'bg-red-950/20 border-[#E50914] shadow-lg shadow-red-900/5'
                              : 'bg-zinc-950/50 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900'
                          }`}
                          onClick={() => mudarMidia(channel.type, channel.url, channel.title, channel.desc || 'Canal Customizado sintonizado via link')}
                        >
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-zinc-800 relative flex items-center justify-center">
                            <div className="text-zinc-500">
                              {channel.type === 'iptv' ? <Tv className="w-5 h-5 text-indigo-500" /> : <Youtube className="w-5 h-5 text-red-500 fill-red-500" />}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[9px] font-mono font-black text-indigo-400 uppercase tracking-widest">
                                CANAL DO USUÁRIO
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playSound.click();
                                  const updated = customChannels.filter((_, i) => i !== index);
                                  setCustomChannels(updated);
                                  localStorage.setItem('gamezone_custom_channels', JSON.stringify(updated));
                                  showToast('🗑️ Canal customizado excluído.');
                                }}
                                className="text-zinc-500 hover:text-red-500 transition-colors p-0.5 rounded-md"
                                title="Excluir Canal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <h4 className={`text-xs font-black line-clamp-1 truncate ${isSelected ? 'text-red-500' : 'text-slate-200'}`}>
                              {channel.title}
                            </h4>
                            <p className="text-[10px] text-zinc-500 line-clamp-1">
                              {channel.url}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                  </div>

                  {/* Add Custom Live Link Trigger */}
                  <button
                    onClick={() => {
                      playSound.click();
                      setShowAddChannelModal(true);
                    }}
                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 border border-zinc-700/60 cursor-pointer transition-colors mt-2"
                  >
                    <Plus className="w-4 h-4 text-red-500" />
                    <span>Adicionar Minha Stream (.m3u8/YT)</span>
                  </button>

                </div>

              </div>
            </div>
          )}

          {cinemaSubTab === 'catalog' && (
            <>
              {/* FEATURED ANIMATED HERO CAROUSEL (HIGH-CONVERTING) */}
              {carouselItems.length > 0 && (
            <div 
              className="relative w-full aspect-[21/9] min-h-[440px] md:min-h-[540px] flex items-end overflow-hidden select-none group/carousel" 
              id="cine-hero-carousel"
              onMouseEnter={() => setIsHoveredCarousel(true)}
              onMouseLeave={() => setIsHoveredCarousel(false)}
              onTouchStart={(e) => {
                touchStartRef.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (touchStartRef.current === null) return;
                const diff = touchStartRef.current - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 50) {
                  playSound.click();
                  if (diff > 0) {
                    setCarouselIndex(prev => (prev + 1) % carouselItems.length);
                  } else {
                    setCarouselIndex(prev => (prev - 1 + carouselItems.length) % carouselItems.length);
                  }
                }
                touchStartRef.current = null;
              }}
            >
              {/* Slides Background Container with AnimatePresence for ultra fluid fades */}
              <div className="absolute inset-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={carouselIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="absolute inset-0 w-full h-full"
                  >
                    <img 
                      src={carouselItems[carouselIndex].imageUrl} 
                      alt={carouselItems[carouselIndex].title} 
                      className="w-full h-full object-cover brightness-[0.4] transition-all duration-700"
                    />
                  </motion.div>
                </AnimatePresence>
                
                {/* Premium Cinema Ambient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/50 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/90 via-[#141414]/30 to-transparent z-10" />
                
                {/* Scanlines layer for techy vibe */}
                <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-10" />
              </div>

              {/* Slider Left/Right Premium Hotkeys / Chevron Controls */}
              {carouselItems.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      playSound.click();
                      setCarouselIndex(prev => (prev - 1 + carouselItems.length) % carouselItems.length);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 hover:bg-[#E50914] text-white border border-white/10 hover:border-red-500 hover:shadow-lg hover:shadow-red-600/30 flex items-center justify-center transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 transform hover:scale-110 active:scale-95 cursor-pointer"
                    id="btn-carousel-prev"
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => {
                      playSound.click();
                      setCarouselIndex(prev => (prev + 1) % carouselItems.length);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 hover:bg-[#E50914] text-white border border-white/10 hover:border-red-500 hover:shadow-lg hover:shadow-red-600/30 flex items-center justify-center transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 transform hover:scale-110 active:scale-95 cursor-pointer"
                    id="btn-carousel-next"
                    aria-label="Próximo"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Dynamic Slide Content */}
              <div className="relative z-20 max-w-3xl px-4 pb-14 md:px-8 space-y-4">
                
                {/* Highly Converting Badge Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {carouselItems[carouselIndex].id.startsWith('user-upload-') ? (
                    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-600 text-black font-black text-[9px] md:text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-yellow-500/10">
                      <Sparkles className="w-3.5 h-3.5 text-black animate-bounce" />
                      <span>🔥 LANÇAMENTO DA COMUNIDADE</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 bg-red-600/90 text-white font-extrabold text-[9px] md:text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                      <Film className="w-3.5 h-3.5 text-white animate-pulse" />
                      <span>🏆 DESTAQUE PREMIUM DE HOJE</span>
                    </div>
                  )}

                  {carouselItems[carouselIndex].youtubeId && (
                    <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1">
                      <Youtube className="w-3 h-3 fill-white" />
                      YOUTUBE FEED
                    </span>
                  )}
                </div>

                {/* Animated Title & description */}
                <div className="space-y-3">
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-sans max-w-2xl leading-tight drop-shadow-2xl">
                    {carouselItems[carouselIndex].title}
                  </h1>

                  <div className="flex items-center gap-3.5 text-xs font-mono text-zinc-300 drop-shadow">
                    <span className="text-emerald-400 font-black">{carouselItems[carouselIndex].matchScore}% Match</span>
                    <span className="text-zinc-500">•</span>
                    <span>{carouselItems[carouselIndex].year}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-bold text-zinc-200">{carouselItems[carouselIndex].rating}</span>
                    <span className="text-zinc-500">•</span>
                    <span>{carouselItems[carouselIndex].duration}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-[#E50914] font-black uppercase tracking-wider text-[10px]">Full HD 4K</span>
                  </div>

                  <p className="text-xs md:text-sm text-zinc-400 max-w-xl font-medium leading-relaxed line-clamp-3 drop-shadow">
                    {carouselItems[carouselIndex].description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {carouselItems[carouselIndex].tags.map(t => (
                    <span key={t} className="text-[10px] px-2.5 py-1 bg-zinc-900/90 border border-zinc-800/80 rounded-lg text-zinc-400 font-mono font-medium hover:text-white transition-colors">
                      #{t}
                    </span>
                  ))}
                </div>

                {/* High Converting Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button 
                    onClick={() => {
                      playSound.click();
                      setActiveMedia(carouselItems[carouselIndex]);
                      setIsPlaying(true);
                    }}
                    className="px-6 py-3 bg-white hover:bg-neutral-200 text-black font-black text-xs md:text-sm rounded-xl flex items-center gap-2.5 transition-all hover:scale-105 cursor-pointer shadow-xl active:scale-95 shrink-0"
                    id="btn-carousel-watch-now"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Assistir Agora</span>
                  </button>

                  <button 
                    onClick={() => {
                      playSound.click();
                      setActiveMedia(carouselItems[carouselIndex]);
                      setIsPlaying(false);
                    }}
                    className="px-5 py-3 bg-zinc-800/85 hover:bg-zinc-700 text-white font-bold text-xs md:text-sm rounded-xl flex items-center gap-2 transition-all hover:scale-105 border border-zinc-700/60 cursor-pointer shadow-xl shrink-0"
                    id="btn-carousel-more-info"
                  >
                    <Info className="w-4 h-4 text-zinc-300" />
                    <span>Mais Informações</span>
                  </button>
                </div>
              </div>

              {/* Modern Micro Progress Indicators (Netflix Style Dots) */}
              {carouselItems.length > 1 && (
                <div className="absolute right-4 md:right-8 bottom-6 z-30 flex items-center gap-2">
                  {carouselItems.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        playSound.click();
                        setCarouselIndex(idx);
                      }}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        carouselIndex === idx 
                          ? 'w-6 bg-red-600' 
                          : 'w-2 bg-zinc-600 hover:bg-zinc-400'
                      }`}
                      aria-label={`Ir para slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NETFLIX CINEMATIC CAROUSELS */}
          <div className="px-4 md:px-8 pb-20 space-y-10 relative z-20 mt-[-40px] md:mt-[-80px]">
            
            {/* UPGRADE CINEMA: AI UPLOAD & PUBLISH BANNER */}
            <div className="bg-gradient-to-r from-red-950/40 via-zinc-950/90 to-indigo-950/40 border border-red-500/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden backdrop-blur-sm" id="ai-cinema-uploader">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-3 max-w-2xl text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-indigo-600 text-white font-black text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg shadow-red-500/10">
                  <Sparkles className="w-3 h-3 text-yellow-300 animate-bounce" />
                  <span>SISTEMA DE DETECÇÃO &amp; IA CINEMÁTICA</span>
                </div>
                <h3 className="text-lg md:text-2xl font-black text-white tracking-tight">
                  Publique seus próprios Filmes e Clipes na Grade! 🎥🍿
                </h3>
                <p className="text-xs md:text-sm text-zinc-400 leading-relaxed font-medium">
                  Submeta uma imagem (upload local, URL ou presets premium), dê um título e digite uma ideia básica. Nossa IA fará o <span className="text-red-500 font-bold">reconhecimento óptico</span>, otimizará as legendas e fixará o pôster instantaneamente nos banners em destaque com matching dinâmico!
                </p>
              </div>

              <div className="shrink-0 w-full md:w-auto">
                {loggedInUser ? (
                  <button
                    onClick={() => {
                      playSound.click();
                      setShowUploadModal(true);
                    }}
                    className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-[#E50914] to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs md:text-sm uppercase tracking-wider rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-red-600/20 cursor-pointer"
                    id="btn-trigger-ai-upload"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>Publicar Novo Filme com IA</span>
                  </button>
                ) : (
                  <div className="space-y-2.5 text-center">
                    <button
                      onClick={() => {
                        playSound.click();
                        if (onOpenLogin) {
                          onOpenLogin();
                        } else {
                          showToast('🔒 Faça login no menu principal no topo.');
                        }
                      }}
                      className="w-full md:w-auto px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-black text-xs md:text-sm uppercase tracking-wider rounded-xl transition-all duration-300 border border-zinc-700/60 flex items-center justify-center gap-2 cursor-pointer"
                      id="btn-login-to-upload"
                    >
                      <span>🔒 Entrar na Conta para Publicar</span>
                    </button>
                    <p className="text-[10px] text-zinc-500 font-medium">
                      Ganhe 100 Moedas e 20 XP por filme publicado!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* NEW ROW: User Uploads / Community Movies */}
            {userUploadedMovies.length > 0 && (
              <div className="space-y-2" id="row-community-uploads">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-6 bg-indigo-500 rounded-full animate-pulse" />
                    <h3 className="text-sm md:text-base font-black uppercase text-white font-sans tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Destaques da Comunidade (IA Reconhecidos)
                    </h3>
                  </div>
                  <span className="text-[10px] bg-indigo-950/60 border border-indigo-800/30 px-2 py-0.5 rounded-full text-indigo-400 font-bold">
                    {userUploadedMovies.length} Filmes Publicados
                  </span>
                </div>

                <div className="relative group">
                  <button 
                    onClick={() => scrollRow(userRowRef, 'left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-10 h-24 bg-black/60 hover:bg-black/90 text-white border-r border-zinc-800/40 opacity-0 group-hover:opacity-100 transition-all rounded-r-lg cursor-pointer flex items-center justify-center"
                    id="btn-scroll-user-left"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <div 
                    ref={userRowRef}
                    className="flex gap-4 overflow-x-auto scrollbar-none pb-4 pt-1 snap-x scroll-smooth touch-pan-x"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    {userUploadedMovies.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          playSound.click();
                          setActiveMedia(item);
                        }}
                        className="flex-none w-52 md:w-60 bg-zinc-900 border border-indigo-500/20 hover:border-indigo-500/50 rounded-xl overflow-hidden cursor-pointer hover:scale-105 hover:shadow-xl transition-all duration-300 snap-start group"
                        id={`item-user-${item.id}`}
                      >
                        <div className="aspect-[3/4] relative overflow-hidden">
                          <img 
                            src={item.imageUrl} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-md flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-yellow-300 animate-pulse" />
                            <span>IA RECONHECIDO</span>
                          </div>
                        </div>
                        <div className="p-3 space-y-1">
                          <h4 className="text-xs font-black text-slate-100 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                            <span>{item.year}</span>
                            <span className="px-1 py-0.2 bg-zinc-800 text-zinc-300 rounded text-[9px] font-bold">{item.rating}</span>
                            <span className="text-emerald-400 font-bold">{item.matchScore}% Match</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => scrollRow(userRowRef, 'right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-10 h-24 bg-black/60 hover:bg-black/90 text-white border-l border-zinc-800/40 opacity-0 group-hover:opacity-100 transition-all rounded-l-lg cursor-pointer flex items-center justify-center"
                    id="btn-scroll-user-right"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}
            
            {/* ROW 1: YouTube Channel Feed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-6 bg-red-600 rounded-full" />
                  <h3 className="text-sm md:text-base font-black uppercase text-white font-sans tracking-wide flex items-center gap-1.5">
                    <Youtube className="w-4 h-4 text-[#E50914] fill-[#E50914]" />
                    Canal {youtubeHandle} — Vídeos no YouTube
                  </h3>
                </div>
                {isLoadingYt && (
                  <span className="text-[10px] font-mono text-zinc-500 animate-pulse">Sincronizando feed...</span>
                )}
              </div>

              {/* Scroll wrapper */}
              <div className="relative group">
                <button 
                  onClick={() => scrollRow(ytRowRef, 'left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-10 h-24 bg-black/60 hover:bg-black/90 text-white border-r border-zinc-800/40 opacity-0 group-hover:opacity-100 transition-all rounded-r-lg cursor-pointer flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div 
                  ref={ytRowRef}
                  className="flex gap-4 overflow-x-auto scrollbar-none pb-4 pt-1 snap-x scroll-smooth touch-pan-x"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {ytVideos.map(video => (
                    <div 
                      key={video.id}
                      onClick={() => {
                        playSound.click();
                        setActiveMedia(video);
                      }}
                      className="flex-none w-72 md:w-80 bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden cursor-pointer hover:scale-105 hover:border-red-600/40 hover:shadow-xl transition-all duration-300 snap-start group relative"
                    >
                      <div className="aspect-[16/9] relative overflow-hidden">
                        <img 
                          src={video.imageUrl} 
                          alt={video.title} 
                          className="w-full h-full object-cover"
                        />
                        {/* Interactive hover overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <div className="w-10 h-10 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center shadow-lg transform translate-y-3 group-hover:translate-y-0 transition-all">
                            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-red-600 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1">
                          <Youtube className="w-2.5 h-2.5 fill-white" />
                          <span>YouTube</span>
                        </div>
                      </div>
                      <div className="p-3 space-y-1">
                        <h4 className="text-xs font-extrabold text-slate-100 line-clamp-1 group-hover:text-red-500 transition-colors">
                          {video.title}
                        </h4>
                        <p className="text-[10px] text-zinc-400 line-clamp-2">
                          {video.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => scrollRow(ytRowRef, 'right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-10 h-24 bg-black/60 hover:bg-black/90 text-white border-l border-zinc-800/40 opacity-0 group-hover:opacity-100 transition-all rounded-l-lg cursor-pointer flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* ROW 2: Exclusivos GameZone */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-6 bg-red-600 rounded-full" />
                <h3 className="text-sm md:text-base font-black uppercase text-white font-sans tracking-wide">
                  Séries Originais GameZone 🍿
                </h3>
              </div>

              <div className="relative group">
                <button 
                  onClick={() => scrollRow(origRowRef, 'left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-10 h-24 bg-black/60 hover:bg-black/90 text-white border-r border-zinc-800/40 opacity-0 group-hover:opacity-100 transition-all rounded-r-lg cursor-pointer flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div 
                  ref={origRowRef}
                  className="flex gap-4 overflow-x-auto scrollbar-none pb-4 pt-1 snap-x scroll-smooth touch-pan-x"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {ORIGINALS_ITEMS.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        playSound.click();
                        setActiveMedia(item);
                      }}
                      className="flex-none w-52 md:w-60 bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden cursor-pointer hover:scale-105 hover:border-red-600/40 hover:shadow-xl transition-all duration-300 snap-start group"
                    >
                      <div className="aspect-[3/4] relative overflow-hidden">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-red-600 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                          N ORIGINAL
                        </div>
                      </div>
                      <div className="p-3 space-y-1">
                        <h4 className="text-xs font-black text-slate-100 line-clamp-1 group-hover:text-red-500 transition-colors">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                          <span>{item.year}</span>
                          <span className="px-1 py-0.2 bg-zinc-800 text-zinc-300 rounded text-[9px] font-bold">{item.rating}</span>
                          <span className="text-emerald-400 font-bold">{item.matchScore}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => scrollRow(origRowRef, 'right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-10 h-24 bg-black/60 hover:bg-black/90 text-white border-l border-zinc-800/40 opacity-0 group-hover:opacity-100 transition-all rounded-l-lg cursor-pointer flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* ROW 3: Filmes Blockbuster de Hollywood */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-6 bg-red-600 rounded-full" />
                <h3 className="text-sm md:text-base font-black uppercase text-white font-sans tracking-wide">
                  Blockbusters de Hollywood 🎬
                </h3>
              </div>

              <div className="relative group">
                <button 
                  onClick={() => scrollRow(blockRowRef, 'left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-10 h-24 bg-black/60 hover:bg-black/90 text-white border-r border-zinc-800/40 opacity-0 group-hover:opacity-100 transition-all rounded-r-lg cursor-pointer flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div 
                  ref={blockRowRef}
                  className="flex gap-4 overflow-x-auto scrollbar-none pb-4 pt-1 snap-x scroll-smooth touch-pan-x"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {BLOCKBUSTER_ITEMS.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        playSound.click();
                        setActiveMedia(item);
                      }}
                      className="flex-none w-52 md:w-60 bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden cursor-pointer hover:scale-105 hover:border-red-600/40 hover:shadow-xl transition-all duration-300 snap-start group"
                    >
                      <div className="aspect-[3/4] relative overflow-hidden">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-black/70 text-slate-300 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded">
                          ★ {item.matchScore}% Pop
                        </div>
                      </div>
                      <div className="p-3 space-y-1">
                        <h4 className="text-xs font-black text-slate-100 line-clamp-1 group-hover:text-red-500 transition-colors">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                          <span>{item.year}</span>
                          <span className="px-1 py-0.2 bg-zinc-800 text-zinc-300 rounded text-[9px] font-bold">{item.rating}</span>
                          <span className="text-amber-400">{item.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => scrollRow(blockRowRef, 'right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-10 h-24 bg-black/60 hover:bg-black/90 text-white border-l border-zinc-800/40 opacity-0 group-hover:opacity-100 transition-all rounded-l-lg cursor-pointer flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* ROW 4: Gaming & Esports Docs */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-6 bg-red-600 rounded-full" />
                <h3 className="text-sm md:text-base font-black uppercase text-white font-sans tracking-wide">
                  Gaming &amp; Esports Docs 🎮
                </h3>
              </div>

              <div className="relative group">
                <button 
                  onClick={() => scrollRow(docRowRef, 'left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-10 h-24 bg-black/60 hover:bg-black/90 text-white border-r border-zinc-800/40 opacity-0 group-hover:opacity-100 transition-all rounded-r-lg cursor-pointer flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div 
                  ref={docRowRef}
                  className="flex gap-4 overflow-x-auto scrollbar-none pb-4 pt-1 snap-x scroll-smooth touch-pan-x"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {DOCS_ITEMS.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        playSound.click();
                        setActiveMedia(item);
                      }}
                      className="flex-none w-72 bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden cursor-pointer hover:scale-105 hover:border-red-600/40 hover:shadow-xl transition-all duration-300 snap-start group"
                    >
                      <div className="aspect-[16/10] relative overflow-hidden">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-indigo-950/80 text-indigo-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-indigo-800/30">
                          DOCUMENTAL
                        </div>
                      </div>
                      <div className="p-3 space-y-1">
                        <h4 className="text-xs font-extrabold text-slate-100 line-clamp-1 group-hover:text-red-500 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-zinc-400 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => scrollRow(docRowRef, 'right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-10 h-24 bg-black/60 hover:bg-black/90 text-white border-l border-zinc-800/40 opacity-0 group-hover:opacity-100 transition-all rounded-l-lg cursor-pointer flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            </div>
          </>
        )}
      </>
    )}

      {/* ADD CUSTOM CHANNEL MODAL */}
      <AnimatePresence>
        {showAddChannelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-zinc-800 max-w-md w-full rounded-3xl overflow-hidden shadow-2xl text-left"
            >
              <div className="bg-gradient-to-r from-red-600 to-zinc-900 px-6 py-4 flex items-center justify-between border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Tv className="w-5 h-5 text-white" />
                  <h3 className="font-sans font-black text-white text-xs uppercase tracking-wider">
                    Sintonizar Seu Próprio Link
                  </h3>
                </div>
                <button
                  onClick={() => {
                    playSound.click();
                    setShowAddChannelModal(false);
                  }}
                  className="p-1 bg-black/40 text-slate-300 hover:text-white rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!customChannelName.trim() || !customChannelUrl.trim()) {
                    showToast('⚠️ Por favor, preencha todos os campos.');
                    return;
                  }
                  playSound.victory();
                  const newChan = {
                    title: customChannelName.trim(),
                    url: customChannelUrl.trim(),
                    type: customChannelType,
                    desc: `Link customizado sintonizado pelo usuário. Pronto para reproduzir via ${customChannelType === 'iptv' ? 'Video.js' : 'YouTube iframe'}.`
                  };
                  const updated = [...customChannels, newChan];
                  setCustomChannels(updated);
                  localStorage.setItem('gamezone_custom_channels', JSON.stringify(updated));
                  showToast(`📺 Canal "${newChan.title}" adicionado e sintonizado!`);
                  mudarMidia(newChan.type, newChan.url, newChan.title, newChan.desc);
                  setCustomChannelName('');
                  setCustomChannelUrl('');
                  setShowAddChannelModal(false);
                }}
                className="p-6 space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider block">Tipo de Link</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playSound.click();
                        setCustomChannelType('iptv');
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        customChannelType === 'iptv'
                          ? 'bg-red-600/15 border-red-500 text-red-400'
                          : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white'
                      }`}
                    >
                      TV Ao Vivo (.m3u8 / HLS)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playSound.click();
                        setCustomChannelType('youtube');
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        customChannelType === 'youtube'
                          ? 'bg-red-600/15 border-red-500 text-red-400'
                          : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Vídeo YouTube (Embed)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider block">Nome do Canal</label>
                  <input
                    type="text"
                    value={customChannelName}
                    onChange={(e) => setCustomChannelName(e.target.value)}
                    placeholder="Ex: TV Local / Meu Gameplay"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-red-600 focus:outline-none rounded-xl text-xs text-white placeholder-zinc-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider block">URL Completa do Stream</label>
                  <input
                    type="url"
                    value={customChannelUrl}
                    onChange={(e) => setCustomChannelUrl(e.target.value)}
                    placeholder={customChannelType === 'iptv' ? 'https://dominio.com/canal.m3u8' : 'https://www.youtube.com/embed/VIDEO_ID'}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-red-600 focus:outline-none rounded-xl text-xs text-white placeholder-zinc-500 font-mono"
                    required
                  />
                  <p className="text-[9px] text-zinc-500 leading-relaxed font-mono mt-1">
                    {customChannelType === 'iptv' 
                      ? 'IPTV requer um link .m3u8 direto compatível com HLS Streaming CORS.' 
                      : 'O link do YouTube deve ser no formato de incorporação (embed) para permitir reprodução iframe.'}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => {
                      playSound.click();
                      setShowAddChannelModal(false);
                    }}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold rounded-xl text-zinc-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-500 text-xs font-black rounded-xl text-white transition-all hover:scale-105 cursor-pointer shadow-lg active:scale-95 flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Adicionar Stream</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* YOUTUBE AND CINEMATIC MEDIA MODAL WITH PLAYBACK */}
      <AnimatePresence>
        {activeMedia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-3 md:p-6"
          >
            {/* Modal Container */}
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl relative"
            >
              
              {/* Close Button */}
              <button 
                onClick={() => {
                  playSound.click();
                  setActiveMedia(null);
                  setIsPlaying(false);
                }}
                className="absolute top-4 right-4 z-50 p-2 bg-black/80 hover:bg-red-600 rounded-full border border-zinc-700/50 hover:border-red-500/50 text-white cursor-pointer transition-colors"
                title="Fechar Detalhes"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Top Media Area: Video Player or Banner preview */}
              <div className="aspect-[16/9] w-full bg-black relative">
                {isPlaying ? (
                  // REAL PLAYABLE VIDEO PLAYER
                  <VideoPlayer 
                    media={activeMedia} 
                    onClose={() => setIsPlaying(false)}
                  />
                ) : (
                  // BEAUTIFUL CARD COVER PREVIEW
                  <>
                    <img 
                      src={activeMedia.imageUrl} 
                      alt={activeMedia.title} 
                      className="w-full h-full object-cover brightness-75"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                    
                    {/* Big Play overlay button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button 
                        onClick={() => {
                          playSound.click();
                          setIsPlaying(true);
                        }}
                        className="p-5 md:p-6 bg-[#E50914] hover:bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 shadow-2xl transition-transform animate-pulse cursor-pointer"
                        title="Play"
                      >
                        <Play className="w-8 h-8 fill-white translate-x-0.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Bottom detail Area */}
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  
                  {/* Left Column: Descriptions */}
                  <div className="space-y-4 flex-1">
                    <h2 className="text-xl md:text-2xl font-black text-white font-sans">
                      {activeMedia.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400">
                      <span className="text-emerald-400 font-extrabold">{activeMedia.matchScore}% Match</span>
                      <span>{activeMedia.year}</span>
                      <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-bold text-zinc-200">{activeMedia.rating}</span>
                      <span>{activeMedia.duration}</span>
                      {activeMedia.youtubeId && (
                        <span className="text-[#E50914] font-bold bg-red-950/40 border border-red-900/30 px-1.5 py-0.5 rounded text-[10px]">
                          YouTube Clip
                        </span>
                      )}
                    </div>

                    <p className="text-xs md:text-sm text-zinc-300 leading-relaxed font-medium">
                      {activeMedia.description}
                    </p>

                    {/* Metadata lists */}
                    <div className="grid grid-cols-2 gap-4 text-xs font-medium border-t border-zinc-900 pt-4">
                      <div>
                        <span className="text-zinc-500 font-bold block mb-1">Tags:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeMedia.tags.map(t => (
                            <span key={t} className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-slate-400 font-mono">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-zinc-500 font-bold block mb-1">Gêneros Cinema:</span>
                        <span className="text-slate-300">Sci-Fi, Aventura, Geek, Drama</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions panel */}
                  <div className="w-full md:w-60 bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 md:p-5 space-y-4 shrink-0">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider font-mono">
                      Ações de Espectador
                    </h4>

                    <div className="space-y-2.5 text-xs">
                      {/* Play/Stop button */}
                      {activeMedia.youtubeId && (
                        <button 
                          onClick={() => {
                            playSound.click();
                            setIsPlaying(!isPlaying);
                          }}
                          className="w-full py-2 bg-red-600 hover:bg-red-500 font-bold rounded-lg text-white text-center flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>{isPlaying ? 'Pausar Player' : 'Reproduzir Vídeo'}</span>
                        </button>
                      )}

                      {/* Add to list */}
                      <button 
                        onClick={() => toggleMyList(activeMedia.id)}
                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 font-semibold rounded-lg text-slate-200 text-center flex items-center justify-center gap-2 cursor-pointer transition-all border border-zinc-750"
                      >
                        {myList.includes(activeMedia.id) ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Minha Lista (Salvo)</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-slate-400" />
                            <span>Minha Lista</span>
                          </>
                        )}
                      </button>

                      {/* Open YouTube externally */}
                      {activeMedia.youtubeId && (
                        <a 
                          href={`https://www.youtube.com/watch?v=${activeMedia.youtubeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => playSound.click()}
                          className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 font-medium rounded-lg text-slate-400 hover:text-white text-center flex items-center justify-center gap-2 cursor-pointer transition-colors border border-zinc-800"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Ver no YouTube</span>
                        </a>
                      )}
                    </div>

                    {/* Small gamified element */}
                    <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-850 text-[10px] space-y-1">
                      <span className="text-[#E50914] font-black uppercase font-mono tracking-wider block">Bônus de Espectador</span>
                      <p className="text-zinc-400">Assista para ganhar XP e moedas extras para a arena de apostas e arcade!</p>
                    </div>

                  </div>

                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* YOUTUBE CHANNEL CONFIGURATION DRAWER/MODAL */}
      <AnimatePresence>
        {showConfig && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-zinc-800 max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl"
            >
              
              <div className="bg-gradient-to-r from-red-600 via-red-700 to-zinc-900 px-6 py-4 flex items-center justify-between border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Youtube className="w-5.5 h-5.5 text-white fill-white" />
                  <h3 className="font-sans font-black text-white text-sm uppercase tracking-wider">
                    Sincronizador YouTube @jacopiei
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    playSound.click();
                    setShowConfig(false);
                  }}
                  className="p-1 bg-black/40 text-slate-300 hover:text-white rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveConfig} className="p-6 space-y-5">
                
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs space-y-1.5 text-red-300">
                  <p className="font-black flex items-center gap-1">
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    Como funciona a sincronização?
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Você pode conectar o canal de YouTube do cliente <span className="font-bold underline text-white">@jacopiei</span> (email: <span className="font-bold underline text-white">redrubspirits@gmail.com</span>) de duas formas: no Modo Simulado Realístico de alta velocidade ou fornecendo uma chave de API oficial do Google.
                  </p>
                </div>

                <div className="space-y-4">
                  
                  {/* Mode Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider">Modo de Integração</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          playSound.click();
                          setIntegrationMode('simulated');
                        }}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                          integrationMode === 'simulated'
                            ? 'bg-red-600/10 border-red-500 text-red-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Simulado Fidelidade (Recomendado)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playSound.click();
                          setIntegrationMode('real');
                        }}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                          integrationMode === 'real'
                            ? 'bg-red-600/10 border-red-500 text-red-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Integração Real (Data API v3)
                      </button>
                    </div>
                  </div>

                  {/* Channel Handle Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider block">Username do Canal (YouTube @)</label>
                    <input 
                      type="text" 
                      value={youtubeHandle}
                      onChange={(e) => setYoutubeHandle(e.target.value)}
                      placeholder="@jacopiei"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 focus:border-red-600 focus:outline-none rounded-lg text-xs font-mono text-white"
                      required
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider block">E-mail do Proprietário</label>
                    <input 
                      type="email" 
                      value={youtubeEmail}
                      onChange={(e) => setYoutubeEmail(e.target.value)}
                      placeholder="redrubspirits@gmail.com"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 focus:border-red-600 focus:outline-none rounded-lg text-xs font-mono text-white"
                      required
                    />
                  </div>

                  {/* API Real Fields */}
                  {integrationMode === 'real' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 pt-1 border-t border-zinc-900"
                    >
                      {/* Channel ID Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider block">ID do Canal do YouTube (Channel ID)</label>
                        <input 
                          type="text" 
                          value={youtubeChannelId}
                          onChange={(e) => setYoutubeChannelId(e.target.value)}
                          placeholder="Ex: UC-7vE4..."
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 focus:border-red-600 focus:outline-none rounded-lg text-xs font-mono text-white"
                          required
                        />
                      </div>

                      {/* API Key Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider block">Google / YouTube API Key</label>
                        <input 
                          type="password" 
                          value={youtubeApiKey}
                          onChange={(e) => setYoutubeApiKey(e.target.value)}
                          placeholder="Chave de API do Google Cloud Console"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 focus:border-red-600 focus:outline-none rounded-lg text-xs font-mono text-white"
                        />
                      </div>
                    </motion.div>
                  )}

                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => {
                      playSound.click();
                      setShowConfig(false);
                    }}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold rounded-lg text-zinc-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-500 text-xs font-black rounded-lg text-white transition-all hover:scale-105 cursor-pointer shadow-lg active:scale-95 flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Salvar &amp; Sincronizar</span>
                  </button>
                </div>

              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXQUISITE IA MOVIE PUBLISH & UPLOAD MODAL */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            id="modal-ai-uploader"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative"
            >
              
              {/* Top Banner Accent */}
              <div className="h-2 bg-gradient-to-r from-red-600 via-indigo-600 to-purple-600" />

              {/* Header */}
              <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-600/10 rounded-lg border border-red-500/20 text-red-500 animate-pulse">
                    <Sparkles className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-white text-base tracking-tight">
                      Publicar Novo Filme com Reconhecimento IA
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-medium font-mono uppercase tracking-wider">
                      Processamento Inteligente de Imagem e Metadados
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    playSound.click();
                    setShowUploadModal(false);
                  }}
                  disabled={aiAnalyzing}
                  className="p-1.5 bg-zinc-900 hover:bg-red-600 text-slate-300 hover:text-white rounded-full cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content or AI Loading State */}
              <div className="p-6">
                {aiAnalyzing ? (
                  /* BEAUTIFUL AI RUNTIME OPTICAL RECOGNITION SCREEN */
                  <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
                    <div className="relative">
                      {/* Scanning visual effect */}
                      <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 border-t-red-600 animate-spin flex items-center justify-center" />
                      <div className="absolute inset-0 m-auto w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/40">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      
                      {/* Dynamic light scanline overlay */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_15px_#ef4444] animate-bounce" />
                    </div>

                    <div className="space-y-2 max-w-md">
                      <h4 className="text-sm font-black text-white font-mono animate-pulse tracking-wide uppercase">
                        {aiStep}
                      </h4>
                      <p className="text-xs text-zinc-500">
                        Nossa rede neural está analisando sua imagem, refinando os metadados cinematográficos e inserindo matching rating na plataforma. Por favor, aguarde...
                      </p>
                    </div>

                    {/* Progress dots bar */}
                    <div className="flex gap-1.5 justify-center">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                ) : (
                  /* THE MAIN MOVIE UPLOAD FORM */
                  <form onSubmit={handleAiPublish} className="space-y-5">
                    
                    {/* Basic Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Title */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider block">Título do Filme / Clipe</label>
                        <input 
                          type="text" 
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          placeholder="Ex: Retro Cyberpunk: A Origem"
                          className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-750 focus:border-red-600 focus:outline-none rounded-xl text-xs text-white"
                          required
                        />
                      </div>

                      {/* YouTube Video ID (Optional) */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider block">ID do Vídeo do YouTube (Opcional)</label>
                        <input 
                          type="text" 
                          value={uploadYoutubeId}
                          onChange={(e) => setUploadYoutubeId(e.target.value)}
                          placeholder="Ex: dQw4w9WgXcQ (Opcional)"
                          className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-750 focus:border-red-600 focus:outline-none rounded-xl text-xs text-white font-mono"
                        />
                      </div>

                    </div>

                    {/* Image Upload Source Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider block">Origem do Pôster / Imagem</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            playSound.click();
                            setUploadImageOption('preset');
                          }}
                          className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all text-center cursor-pointer ${
                            uploadImageOption === 'preset'
                              ? 'bg-red-600/10 border-red-500 text-red-400'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          🎬 Presets de Cinema
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playSound.click();
                            setUploadImageOption('file');
                          }}
                          className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all text-center cursor-pointer ${
                            uploadImageOption === 'file'
                              ? 'bg-red-600/10 border-red-500 text-red-400'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          📁 Upload de Arquivo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playSound.click();
                            setUploadImageOption('url');
                          }}
                          className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all text-center cursor-pointer ${
                            uploadImageOption === 'url'
                              ? 'bg-red-600/10 border-red-500 text-red-400'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          🔗 Endereço / URL
                        </button>
                      </div>
                    </div>

                    {/* Image Options Form Inputs */}
                    {uploadImageOption === 'preset' && (
                      <div className="space-y-1.5 bg-zinc-900/60 border border-zinc-900/80 p-3 rounded-xl">
                        <label className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-wider block">Escolha uma Atmosfera Estilizada por IA</label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {Object.entries(PRESET_IMAGES).map(([key, item]) => (
                            <button
                              type="button"
                              key={key}
                              onClick={() => {
                                playSound.click();
                                setUploadPreset(key);
                              }}
                              className={`p-1 border rounded-lg transition-all text-center overflow-hidden flex flex-col items-center gap-1 cursor-pointer ${
                                uploadPreset === key
                                  ? 'border-red-500 bg-red-950/20'
                                  : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                              }`}
                            >
                              <img src={item.url} className="w-full aspect-[4/3] object-cover rounded" alt={item.label} />
                              <span className="text-[8px] font-mono font-bold leading-none line-clamp-1 text-zinc-400 group-hover:text-white">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {uploadImageOption === 'file' && (
                      <div className="space-y-2 bg-zinc-900/60 border border-zinc-900/80 p-4 rounded-xl">
                        <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider block">Upload do Arquivo do Pôster (Foto do Filme)</label>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileChange}
                            className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-black file:bg-[#E50914] file:text-white hover:file:bg-red-500 cursor-pointer"
                          />
                          {uploadFileBase64 && (
                            <div className="w-16 h-16 rounded-xl border border-zinc-700 overflow-hidden shrink-0 shadow-lg">
                              <img src={uploadFileBase64} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                        <p className="text-[9px] text-zinc-500">Sua foto é processada localmente e mantida em cache privado criptografado.</p>
                      </div>
                    )}

                    {uploadImageOption === 'url' && (
                      <div className="space-y-1 bg-zinc-900/60 border border-zinc-900/80 p-3 rounded-xl">
                        <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider block">Endereço da Imagem (URL)</label>
                        <input 
                          type="url" 
                          value={uploadImageUrl}
                          onChange={(e) => setUploadImageUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-red-600 focus:outline-none rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                    )}

                    {/* Legend / Brief Synopsis */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider block">Legenda Básica / Sinopse Fictícia</label>
                      <textarea 
                        value={uploadSynopsis}
                        onChange={(e) => setUploadSynopsis(e.target.value)}
                        placeholder="Escreva uma ideia simples de 1 a 2 linhas. Deixe que a IA faça o resto para torná-la profissional!"
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-750 focus:border-red-600 focus:outline-none rounded-xl text-xs text-white h-20 resize-none"
                      />
                    </div>

                    {/* Reward callout */}
                    <div className="p-3 bg-indigo-950/30 border border-indigo-500/25 rounded-xl flex items-center justify-between text-xs text-indigo-300">
                      <span className="font-bold flex items-center gap-1">🎁 Recompensa do Diretor:</span>
                      <span className="font-mono font-black text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-800/30">
                        ⚡ +100 Moedas &amp; +20 XP
                      </span>
                    </div>

                    {/* Actions footer */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-900">
                      <button
                        type="button"
                        onClick={() => {
                          playSound.click();
                          setShowUploadModal(false);
                        }}
                        className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold rounded-xl text-zinc-300 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-red-600 via-[#E50914] to-red-700 hover:scale-105 text-xs font-black rounded-xl text-white transition-all shadow-lg active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                        <span>Analisar &amp; Publicar com IA</span>
                      </button>
                    </div>

                  </form>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
