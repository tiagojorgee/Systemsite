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
  Sparkles
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
