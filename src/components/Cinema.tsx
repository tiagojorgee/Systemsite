import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Info, 
  Plus, 
  Check, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  Star, 
  Clock, 
  X, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  Heart,
  MessageSquare,
  User,
  Share2,
  ArrowLeft,
  Upload,
  ThumbsUp,
  ExternalLink,
  Flame,
  Gamepad2,
  Film,
  Compass,
  Youtube
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { getCleanUserId, addMovie, getMovies, FirestoreMovie } from '../utils/firebaseDb';
import { VideoPlayer } from './VideoPlayer';

// Media Item representation
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
  uploaderName?: string;
  createdAt?: string;
}

interface UserComment {
  user: string;
  text: string;
  rating: number;
  date: string;
}

const PRESET_IMAGES = {
  synthwave: {
    label: 'Grid Synthwave',
    url: 'https://images.unsplash.com/photo-1515260268569-9271009adfdb?q=80&w=600'
  },
  cyberpunk: {
    label: 'Cyberpunk Beco',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600'
  },
  classic_arcade: {
    label: 'Fliperama Clássico',
    url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600'
  },
  retro_gaming: {
    label: 'Controle Neon',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600'
  },
  cosmic_space: {
    label: 'Espaço Cósmico',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600'
  },
  noir: {
    label: 'Cinema Noir',
    url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=600'
  }
};

// Initial default movies list
const INITIAL_MOVIES: MediaItem[] = [
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
    duration: 'Filme',
    matchScore: 93,
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400',
    youtubeId: 'dQw4w9WgXcQ',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tags: ['Aventura', 'Sobrevivência', 'Superação']
  },
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
    description: 'Um matemático com problemas com jogos descobre a equação que prevê placares exatos no futebol. Quando os maiores sindicatos de apostas mundiais descobrem, o jogo fica perigoso.',
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
  },
  {
    id: 'yt-gameplay-1',
    title: 'Joguei o Pior Jogo do Mundo e Me Arrependi Amargamente! 💀',
    description: 'Aventurando-se nos confins da internet para testar o pior jogo já desenvolvido. Risadas, frustrações e momentos de pura loucura nesta gameplay épica!',
    category: 'youtube',
    year: 2026,
    rating: '12+',
    duration: '18 min',
    matchScore: 98,
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=400',
    youtubeId: 'Ld_A3g-1G10',
    tags: ['Gameplay', 'Humor', 'Arcade', 'Desafio']
  },
  {
    id: 'yt-gameplay-2',
    title: 'Reagindo aos Piores Momentos do Futebol Brasileiro ⚽',
    description: 'Prepare o lenço porque você vai chorar de rir! Um compilado absurdo com as piores jogadas, falhas de goleiros e momentos bizarros que só acontecem no futebol do Brasil.',
    category: 'youtube',
    year: 2026,
    rating: 'Livre',
    duration: '22 min',
    matchScore: 95,
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=400',
    youtubeId: '9p2gBOfX-n8',
    tags: ['Reação', 'Futebol', 'Meme']
  }
];

// Initial seeded reviews/comments for cinematic engagement
const DEFAULT_REVIEWS: Record<string, UserComment[]> = {
  'orig-1': [
    { user: 'Tiago Jorge', text: 'Excelente produção! Esse bug de código me lembrou muito os fliperamas clássicos do centro de São Paulo. Nostalgia pura!', rating: 5, date: '08/07/2026' },
    { user: 'GamerX_88', text: 'Muito bem editado e a trilha sonora synthwave está espetacular! Aguardo o episódio 2.', rating: 4, date: '06/07/2026' }
  ],
  'orig-2': [
    { user: 'Admin_GameZone', text: 'O enredo sobre bancos digitais e criptografia está genial. Super dinâmico!', rating: 5, date: '09/07/2026' }
  ],
  'block-2': [
    { user: 'MatemáticoFiel', text: 'A premissa é boa, mas algumas equações mostradas no quadro são fictícias. Ainda assim, 10/10 para o suspense!', rating: 4, date: '07/07/2026' }
  ]
};

export const Cinema: React.FC<{
  stats: any;
  updateStats: (updater: (prev: any) => any) => void;
  addLog: (type: any, desc: string, amount: number, currency: 'coins' | 'real') => void;
  loggedInUser?: any;
  onOpenLogin?: () => void;
}> = ({ stats, updateStats, addLog, loggedInUser, onOpenLogin }) => {

  // Dynamic lists from state
  const [userUploadedMovies, setUserUploadedMovies] = useState<MediaItem[]>([]);
  const [myList, setMyList] = useState<string[]>(() => {
    const cached = localStorage.getItem('gamezone_cinema_mylist_unified');
    return cached ? JSON.parse(cached) : ['orig-1', 'block-2'];
  });

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active playing view (VideoPlayer)
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);

  // Active detail modal (Netflix preview style)
  const [selectedDetailMedia, setSelectedDetailMedia] = useState<MediaItem | null>(null);

  // Carousel slider index
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [isHoveredCarousel, setIsHoveredCarousel] = useState<boolean>(false);

  // Community Reviews State
  const [reviews, setReviews] = useState<Record<string, UserComment[]>>(() => {
    const cached = localStorage.getItem('gamezone_cinema_reviews');
    return cached ? JSON.parse(cached) : DEFAULT_REVIEWS;
  });
  const [newComment, setNewComment] = useState<string>('');
  const [newRating, setNewRating] = useState<number>(5);

  // Upload Form State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadSynopsis, setUploadSynopsis] = useState<string>('');
  const [uploadYoutubeId, setUploadYoutubeId] = useState<string>('');
  const [uploadPreset, setUploadPreset] = useState<keyof typeof PRESET_IMAGES>('synthwave');
  const [uploadImageUrl, setUploadImageUrl] = useState<string>('');
  const [uploadImageOption, setUploadImageOption] = useState<'preset' | 'url'>('preset');

  // AI Upload Progress Simulation
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiStep, setAiStep] = useState<string>('');
  const [aiProgress, setAiProgress] = useState<number>(0);

  // Toast Feed
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Element Row References for horizontal scroll buttons
  const myRowRef = useRef<HTMLDivElement>(null);
  const userRowRef = useRef<HTMLDivElement>(null);
  const origRowRef = useRef<HTMLDivElement>(null);
  const blockRowRef = useRef<HTMLDivElement>(null);
  const docRowRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Extract YouTube ID from full URL or return input
  const extractYoutubeId = (url: string): string => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  // Keyboard navigation support: Press Escape to clear overlays
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeMedia) {
          setActiveMedia(null);
          playSound.click();
        } else if (selectedDetailMedia) {
          setSelectedDetailMedia(null);
          playSound.click();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMedia, selectedDetailMedia]);

  // Load community movies from Firestore database
  useEffect(() => {
    const fetchCommunityMovies = async () => {
      try {
        const dbMovies = await getMovies();
        if (dbMovies && dbMovies.length > 0) {
          const formatted: MediaItem[] = dbMovies.map(m => ({
            id: m.id,
            title: m.title,
            description: m.description,
            category: m.category,
            year: m.year,
            rating: m.rating,
            duration: m.duration,
            matchScore: m.matchScore,
            imageUrl: m.imageUrl,
            youtubeId: m.youtubeId,
            tags: m.tags,
            uploaderName: m.uploaderName,
            createdAt: m.createdAt
          }));
          setUserUploadedMovies(formatted);
        }
      } catch (err) {
        console.error('Failed to load community movies from Firestore, using offline storage:', err);
      }
    };
    fetchCommunityMovies();
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('gamezone_cinema_mylist_unified', JSON.stringify(myList));
  }, [myList]);

  useEffect(() => {
    localStorage.setItem('gamezone_cinema_reviews', JSON.stringify(reviews));
  }, [reviews]);

  // Merge default items with community uploaded ones
  const ALL_ITEMS = React.useMemo(() => {
    return [...userUploadedMovies, ...INITIAL_MOVIES];
  }, [userUploadedMovies]);

  // Carousel Items (dynamic 5 items)
  const carouselItems = React.useMemo(() => {
    return ALL_ITEMS.slice(0, 5);
  }, [ALL_ITEMS]);

  // Banner carousel interval
  useEffect(() => {
    if (isHoveredCarousel || carouselItems.length <= 1) return;
    const timer = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % carouselItems.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isHoveredCarousel, carouselItems.length]);

  const handleHorizontalScroll = (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
    playSound.click();
    if (ref.current) {
      const offset = dir === 'left' ? -380 : 380;
      ref.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const toggleMyList = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playSound.click();
    if (myList.includes(id)) {
      setMyList(prev => prev.filter(x => x !== id));
      showToast('❌ Removido da Minha Lista');
    } else {
      setMyList(prev => [...prev, id]);
      showToast('💖 Adicionado à Minha Lista');
    }
  };

  // Submit new review
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedDetailMedia) return;

    playSound.click();
    const commentItem: UserComment = {
      user: loggedInUser?.displayName || loggedInUser?.email || 'Gamer Anônimo',
      text: newComment.trim(),
      rating: newRating,
      date: new Date().toLocaleDateString('pt-BR')
    };

    const mediaId = selectedDetailMedia.id;
    setReviews(prev => ({
      ...prev,
      [mediaId]: [commentItem, ...(prev[mediaId] || [])]
    }));

    setNewComment('');
    showToast('✨ Crítica publicada com sucesso!');
  };

  // Process AI upload submission
  const handlePublishMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) {
      showToast('⚠️ É necessário estar logado para publicar.');
      onOpenLogin?.();
      return;
    }

    if (!uploadTitle.trim()) {
      showToast('⚠️ Por favor, preencha o título do filme.');
      return;
    }

    playSound.click();
    setAiAnalyzing(true);
    setAiProgress(10);

    const steps = [
      { prg: 25, label: '🔍 Escaneando link do YouTube CDN...' },
      { prg: 50, label: '🤖 Analisando metadados e tags inteligentes...' },
      { prg: 75, label: '📝 Otimizando sinopse por IA GameZone...' },
      { prg: 90, label: '✨ Registrando filme no ledger seguro do Firestore...' },
      { prg: 100, label: '🎬 Filme publicado com Sucesso!' }
    ];

    for (const step of steps) {
      setAiStep(step.label);
      setAiProgress(step.prg);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    const videoId = extractYoutubeId(uploadYoutubeId);
    const finalImg = uploadImageOption === 'preset' 
      ? PRESET_IMAGES[uploadPreset].url 
      : (uploadImageUrl.trim() || PRESET_IMAGES.synthwave.url);

    const parsedCategory = videoId ? 'youtube' as const : 'blockbuster' as const;

    const finalSynopsis = uploadSynopsis.trim() 
      ? `[IA Otimizada] ${uploadSynopsis}` 
      : `[IA Otimizada] O incrível espetáculo "${uploadTitle}" traz à comunidade do GameZone uma emocionante jornada cinemática recheada de adrenalina e desafios de tirar o fôlego.`;

    const newMedia: MediaItem = {
      id: `community-${Date.now()}`,
      title: uploadTitle.trim(),
      description: finalSynopsis,
      category: parsedCategory,
      year: new Date().getFullYear(),
      rating: 'L',
      duration: 'Vídeo YouTube',
      matchScore: Math.floor(Math.random() * 8) + 92,
      imageUrl: finalImg,
      youtubeId: videoId || undefined,
      tags: ['Comunidade', 'IA Otimizado', 'YouTube Clip'],
      uploaderName: loggedInUser.displayName || loggedInUser.email || 'Gamer'
    };

    // Save locally
    setUserUploadedMovies(prev => [newMedia, ...prev]);

    // Save on database
    const dbUploaderId = getCleanUserId(loggedInUser) || 'anonymous';
    const dbMoviePayload: FirestoreMovie = {
      id: newMedia.id,
      title: newMedia.title,
      description: newMedia.description,
      category: newMedia.category,
      year: newMedia.year,
      rating: newMedia.rating,
      duration: newMedia.duration,
      matchScore: newMedia.matchScore,
      imageUrl: newMedia.imageUrl,
      youtubeId: newMedia.youtubeId,
      tags: newMedia.tags,
      uploaderId: dbUploaderId,
      uploaderName: newMedia.uploaderName || 'Gamer',
      createdAt: new Date().toISOString()
    };

    addMovie(dbMoviePayload).catch(err => {
      console.error('Error saving community movie upload to cloud Firestore:', err);
    });

    // Award bonus
    addLog('cine_upload', `Publicou o filme/clipe "${newMedia.title}" no catálogo`, 100, 'coins');
    updateStats(prev => ({
      ...prev,
      coins: prev.coins + 100,
      points: (prev.points || 0) + 20
    }));

    // Reset Form
    setUploadTitle('');
    setUploadSynopsis('');
    setUploadYoutubeId('');
    setUploadImageUrl('');
    setShowUploadModal(false);
    setAiAnalyzing(false);

    playSound.victory();
    showToast(`🎉 "${newMedia.title}" foi publicado e destacado nos row lists!`);
  };

  // Filter media lists based on search
  const filteredAllMedia = searchQuery 
    ? ALL_ITEMS.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <div className="text-slate-100 min-h-screen relative bg-[#141414] select-none" id="cinema-container">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-[#E50914] text-white font-bold rounded-full shadow-2xl border border-red-500/30 flex items-center gap-2.5 text-xs font-sans tracking-wide"
          >
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-300" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Cine Header Nav */}
      <div className="sticky top-0 bg-[#141414]/95 backdrop-blur-lg border-b border-zinc-800/50 px-4 py-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 z-40">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-[#E50914] text-white font-black text-[10px] uppercase tracking-widest rounded-md flex items-center gap-1.5 shadow-lg shadow-red-900/40">
            <Film className="w-3.5 h-3.5" />
            <span>CINEMA COISA DE CINEMA</span>
          </div>
          <p className="text-xs text-zinc-400 font-medium hidden md:block">
            Sua plataforma comunitária de streaming e entretenimento gamer
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Custom Search bar */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar no catálogo comunitário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-red-600 focus:outline-none rounded-full text-xs text-white placeholder-zinc-500 w-full sm:w-64 transition-all font-sans font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Action to upload */}
          {loggedInUser ? (
            <button 
              onClick={() => {
                playSound.click();
                setShowUploadModal(true);
              }}
              className="px-4 py-2 bg-[#E50914] hover:bg-red-500 active:scale-95 transition-all text-xs font-black text-white rounded-full flex items-center gap-1.5 shadow-lg shadow-red-950/40 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Publicar Vídeo</span>
            </button>
          ) : (
            <button 
              onClick={() => {
                playSound.click();
                onOpenLogin?.();
              }}
              className="px-4 py-2 bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 transition-all text-xs font-black text-zinc-300 hover:text-white rounded-full flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Login para Enviar</span>
            </button>
          )}
        </div>
      </div>

      {/* ACTIVE PLAYING SCREEN (Cinematic Theater View Mode) */}
      <AnimatePresence>
        {activeMedia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 overflow-y-auto flex flex-col justify-between"
          >
            {/* Header / Return Controller */}
            <div className="bg-gradient-to-b from-black/90 to-transparent px-4 py-6 md:px-8 flex items-center justify-between z-10">
              <button 
                onClick={() => {
                  playSound.click();
                  setActiveMedia(null);
                }}
                className="px-4 py-2 rounded-xl bg-zinc-900/85 hover:bg-zinc-800 border border-zinc-800 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-2 tracking-wide transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-red-500" />
                <span>Voltar ao Catálogo</span>
              </button>
              
              <div className="text-right hidden sm:block">
                <span className="text-xs text-zinc-400 font-mono">Modo Cinema Ativo</span>
                <h4 className="text-sm font-extrabold text-white">{activeMedia.title}</h4>
              </div>
            </div>

            {/* Central Video Container */}
            <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 flex items-center justify-center">
              <VideoPlayer 
                media={{
                  id: activeMedia.id,
                  title: activeMedia.title,
                  imageUrl: activeMedia.imageUrl,
                  youtubeId: activeMedia.youtubeId,
                  videoUrl: activeMedia.videoUrl
                }}
                onClose={() => setActiveMedia(null)}
              />
            </div>

            {/* Bottom info section */}
            <div className="bg-gradient-to-t from-black to-zinc-950 p-6 md:p-8 max-w-5xl mx-auto w-full border-t border-zinc-900 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[#E50914] text-xs font-black uppercase tracking-wider bg-red-950/60 border border-red-900/40 px-2 py-0.5 rounded">
                  {activeMedia.matchScore}% de Relevância
                </span>
                <span className="text-zinc-400 text-xs font-mono">{activeMedia.year}</span>
                <span className="px-1.5 py-0.5 bg-zinc-850 rounded text-[10px] font-bold text-zinc-300">{activeMedia.rating}</span>
                <span className="text-zinc-400 text-xs font-mono">{activeMedia.duration}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
                {activeMedia.title}
              </h2>
              <p className="text-xs md:text-sm text-zinc-300 leading-relaxed max-w-3xl">
                {activeMedia.description}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {activeMedia.tags.map((t, i) => (
                  <span key={i} className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN VIEW CATALOG */}
      {!activeMedia && (
        <div className="pb-24">
          
          {/* SEARCH MODE OR NORMAL VIEW */}
          {searchQuery ? (
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fadeIn">
              <h2 className="text-lg md:text-xl font-black text-slate-200 mb-6 font-sans flex items-center gap-2">
                Resultados para <span className="text-[#E50914] font-mono">"{searchQuery}"</span>
              </h2>

              {filteredAllMedia.length === 0 ? (
                <div className="py-20 text-center text-zinc-500 space-y-4">
                  <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-zinc-300">Nenhum título foi encontrado.</p>
                    <p className="text-xs">Tente buscar por termos como "Arcade", "Futebol", "Cyberpunk" ou "Faker".</p>
                  </div>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-lg text-white"
                  >
                    Limpar Busca
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredAllMedia.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        playSound.click();
                        setSelectedDetailMedia(item);
                      }}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:scale-105 hover:border-[#E50914]/50 transition-all duration-300 cursor-pointer shadow-lg group relative"
                    >
                      <div className="aspect-[16/10] overflow-hidden relative">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          referrerPolicy="no-referrer"
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
                          <span className="px-1 py-0.5 bg-zinc-850 rounded text-[9px] font-bold text-zinc-300">{item.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* HERO FEATURED BANNER CAROUSEL */}
              <div 
                className="relative w-full aspect-[21/9] min-h-[340px] md:min-h-[480px] bg-black flex flex-col justify-end overflow-hidden"
                onMouseEnter={() => setIsHoveredCarousel(true)}
                onMouseLeave={() => setIsHoveredCarousel(false)}
              >
                {/* Image slider with gradient filters */}
                <div className="absolute inset-0 z-0">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={carouselIndex}
                      src={carouselItems[carouselIndex]?.imageUrl}
                      alt={carouselItems[carouselIndex]?.title}
                      referrerPolicy="no-referrer"
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 0.5, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1 }}
                      className="w-full h-full object-cover"
                    />
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/30 to-black/40 z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent z-10 hidden md:block" />
                </div>

                {/* Left/Right Slider Chevrons */}
                <button
                  onClick={() => {
                    playSound.click();
                    setCarouselIndex(prev => (prev - 1 + carouselItems.length) % carouselItems.length);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 border border-zinc-800 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 md:opacity-50 hover:opacity-100 transition-all cursor-pointer hover:scale-105"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    playSound.click();
                    setCarouselIndex(prev => (prev + 1) % carouselItems.length);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 border border-zinc-800 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 md:opacity-50 hover:opacity-100 transition-all cursor-pointer hover:scale-105"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Slider content overlay */}
                <div className="relative z-20 max-w-3xl p-6 md:p-12 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-red-600 text-white font-mono font-black text-[9px] uppercase tracking-widest rounded flex items-center gap-1.5 animate-pulse">
                      <Flame className="w-3 h-3 fill-white" />
                      <span>RECOMENDADO PARA VOCÊ</span>
                    </span>
                    <span className="text-[10px] text-zinc-300 font-bold font-mono">
                      🔥 {carouselItems[carouselIndex]?.matchScore}% de Match
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h1 className="text-2xl md:text-5xl font-black text-white tracking-tight uppercase drop-shadow-md">
                      {carouselItems[carouselIndex]?.title}
                    </h1>
                    <p className="text-xs md:text-sm text-zinc-300 font-medium leading-relaxed drop-shadow-sm line-clamp-2 md:line-clamp-3">
                      {carouselItems[carouselIndex]?.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        playSound.click();
                        setActiveMedia(carouselItems[carouselIndex]);
                      }}
                      className="px-6 py-3 bg-[#E50914] hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all hover:scale-[1.03] active:scale-95 shadow-xl shadow-red-950/30 flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Assistir Agora</span>
                    </button>

                    <button
                      onClick={() => {
                        playSound.click();
                        setSelectedDetailMedia(carouselItems[carouselIndex]);
                      }}
                      className="px-6 py-3 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-black uppercase tracking-widest rounded-xl transition-all hover:scale-[1.03] active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      <Info className="w-4 h-4" />
                      <span>Mais Informações</span>
                    </button>
                  </div>
                </div>

                {/* Indicator Bullets */}
                <div className="absolute bottom-4 right-12 z-20 flex items-center gap-1.5">
                  {carouselItems.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        playSound.click();
                        setCarouselIndex(idx);
                      }}
                      className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                        carouselIndex === idx ? 'bg-[#E50914] w-6' : 'bg-zinc-600 hover:bg-zinc-400'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* NON-LOGGED IN GUEST CTA BANNER */}
              {!loggedInUser && (
                <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
                  <div className="bg-gradient-to-r from-red-950/40 via-[#1e1011]/80 to-zinc-900/60 border border-red-900/30 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center md:text-left">
                      <h4 className="text-sm font-black text-white flex items-center justify-center md:justify-start gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
                        <span>QUER COMPARTILHAR SEUS FILMES DE GAMES FAVORITOS?</span>
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Faça login no GameZone para carregar trailers, clips e gameplays do YouTube diretamente para o catálogo comunitário!
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        playSound.click();
                        onOpenLogin?.();
                      }}
                      className="px-5 py-2.5 bg-[#E50914] hover:bg-red-500 transition-all text-xs font-black text-white uppercase tracking-wider rounded-xl cursor-pointer shadow-lg shadow-red-950/20 shrink-0"
                    >
                      Entrar na Minha Conta
                    </button>
                  </div>
                </div>
              )}

              {/* ROWS OF CATEGORIES */}
              <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-10">

                {/* ROW 1: MINHA LISTA (Condicional) */}
                {myList.length > 0 && (
                  <div className="space-y-3 relative group/row">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm md:text-base font-black text-zinc-200 tracking-wide uppercase flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-[#E50914] fill-[#E50914]" />
                        <span>Minha Lista</span>
                      </h2>
                      <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleHorizontalScroll(myRowRef, 'left')}
                          className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleHorizontalScroll(myRowRef, 'right')}
                          className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div 
                      ref={myRowRef}
                      className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory"
                    >
                      {ALL_ITEMS.filter(x => myList.includes(x.id)).map(item => (
                        <div 
                          key={item.id}
                          onClick={() => {
                            playSound.click();
                            setSelectedDetailMedia(item);
                          }}
                          className="min-w-[240px] md:min-w-[280px] bg-zinc-900/60 border border-zinc-850 hover:border-[#E50914] rounded-xl overflow-hidden hover:scale-[1.03] transition-all duration-300 cursor-pointer relative group snap-start"
                        >
                          <div className="aspect-[16/9] overflow-hidden relative">
                            <img src={item.imageUrl} alt={item.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                              <span className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400" />
                                <span>{item.matchScore}% Match</span>
                              </span>
                            </div>
                            <button
                              onClick={(e) => toggleMyList(item.id, e)}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-red-600 flex items-center justify-center text-white border border-zinc-800 transition-colors cursor-pointer"
                              title="Remover da lista"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="p-3">
                            <h4 className="text-xs font-extrabold text-white line-clamp-1">{item.title}</h4>
                            <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-mono mt-1">
                              <span>{item.year}</span>
                              <span className="px-1 bg-zinc-800 rounded">{item.rating}</span>
                              <span>{item.duration}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ROW 2: FILMES DA COMUNIDADE (Enviados por usuários) */}
                <div className="space-y-3 relative group/row">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm md:text-base font-black text-zinc-200 tracking-wide uppercase flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-emerald-500" />
                        <span>Publicações da Comunidade</span>
                      </h2>
                      <span className="text-[10px] bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded font-mono">
                        Novos Clipes &amp; Gameplays
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleHorizontalScroll(userRowRef, 'left')}
                        className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleHorizontalScroll(userRowRef, 'right')}
                        className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {userUploadedMovies.length === 0 ? (
                    <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl py-8 text-center text-zinc-500">
                      <p className="text-xs">Nenhum filme enviado pela comunidade ainda.</p>
                      {loggedInUser && (
                        <button 
                          onClick={() => {
                            playSound.click();
                            setShowUploadModal(true);
                          }}
                          className="mt-2 text-[#E50914] text-xs font-bold hover:underline"
                        >
                          Seja o primeiro a publicar!
                        </button>
                      )}
                    </div>
                  ) : (
                    <div 
                      ref={userRowRef}
                      className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory"
                    >
                      {userUploadedMovies.map(item => (
                        <div 
                          key={item.id}
                          onClick={() => {
                            playSound.click();
                            setSelectedDetailMedia(item);
                          }}
                          className="min-w-[240px] md:min-w-[280px] bg-zinc-900/60 border border-zinc-850 hover:border-[#E50914] rounded-xl overflow-hidden hover:scale-[1.03] transition-all duration-300 cursor-pointer relative group snap-start"
                        >
                          <div className="aspect-[16/9] overflow-hidden relative">
                            <img src={item.imageUrl} alt={item.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>Por {item.uploaderName}</span>
                              </span>
                            </div>
                          </div>
                          <div className="p-3">
                            <h4 className="text-xs font-extrabold text-white line-clamp-1">{item.title}</h4>
                            <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-mono mt-1">
                              <span>{item.year}</span>
                              <span className="px-1 bg-zinc-800 rounded">{item.rating}</span>
                              <span>{item.duration}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ROW 3: ORIGINAIS GAMEZONE */}
                <div className="space-y-3 relative group/row">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm md:text-base font-black text-zinc-200 tracking-wide uppercase flex items-center gap-1.5">
                      <Gamepad2 className="w-4 h-4 text-red-500" />
                      <span>Originais GameZone Exclusivos</span>
                    </h2>
                    <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleHorizontalScroll(origRowRef, 'left')}
                        className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleHorizontalScroll(origRowRef, 'right')}
                        className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div 
                    ref={origRowRef}
                    className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory"
                  >
                    {INITIAL_MOVIES.filter(x => x.category === 'originals').map(item => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          playSound.click();
                          setSelectedDetailMedia(item);
                        }}
                        className="min-w-[240px] md:min-w-[280px] bg-zinc-900/60 border border-zinc-850 hover:border-[#E50914] rounded-xl overflow-hidden hover:scale-[1.03] transition-all duration-300 cursor-pointer relative group snap-start"
                      >
                        <div className="aspect-[16/9] overflow-hidden relative">
                          <img src={item.imageUrl} alt={item.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                            <span className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>{item.matchScore}% Match</span>
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="text-xs font-extrabold text-white line-clamp-1">{item.title}</h4>
                          <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-mono mt-1">
                            <span>{item.year}</span>
                            <span className="px-1 bg-zinc-800 rounded">{item.rating}</span>
                            <span>{item.duration}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ROW 4: BLOCKBUSTERS */}
                <div className="space-y-3 relative group/row">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm md:text-base font-black text-zinc-200 tracking-wide uppercase flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-amber-500" />
                      <span>Blockbusters Populares</span>
                    </h2>
                    <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleHorizontalScroll(blockRowRef, 'left')}
                        className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleHorizontalScroll(blockRowRef, 'right')}
                        className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div 
                    ref={blockRowRef}
                    className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory"
                  >
                    {INITIAL_MOVIES.filter(x => x.category === 'blockbuster').map(item => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          playSound.click();
                          setSelectedDetailMedia(item);
                        }}
                        className="min-w-[240px] md:min-w-[280px] bg-zinc-900/60 border border-zinc-850 hover:border-[#E50914] rounded-xl overflow-hidden hover:scale-[1.03] transition-all duration-300 cursor-pointer relative group snap-start"
                      >
                        <div className="aspect-[16/9] overflow-hidden relative">
                          <img src={item.imageUrl} alt={item.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                            <span className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>{item.matchScore}% Match</span>
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="text-xs font-extrabold text-white line-clamp-1">{item.title}</h4>
                          <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-mono mt-1">
                            <span>{item.year}</span>
                            <span className="px-1 bg-zinc-800 rounded">{item.rating}</span>
                            <span>{item.duration}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ROW 5: DOCUMENTÁRIOS */}
                <div className="space-y-3 relative group/row">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm md:text-base font-black text-zinc-200 tracking-wide uppercase flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>Documentários &amp; Curiosidades de Games</span>
                    </h2>
                    <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleHorizontalScroll(docRowRef, 'left')}
                        className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleHorizontalScroll(docRowRef, 'right')}
                        className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div 
                    ref={docRowRef}
                    className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory"
                  >
                    {INITIAL_MOVIES.filter(x => x.category === 'gaming_docs').map(item => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          playSound.click();
                          setSelectedDetailMedia(item);
                        }}
                        className="min-w-[240px] md:min-w-[280px] bg-zinc-900/60 border border-zinc-850 hover:border-[#E50914] rounded-xl overflow-hidden hover:scale-[1.03] transition-all duration-300 cursor-pointer relative group snap-start"
                      >
                        <div className="aspect-[16/9] overflow-hidden relative">
                          <img src={item.imageUrl} alt={item.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                            <span className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>{item.matchScore}% Match</span>
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="text-xs font-extrabold text-white line-clamp-1">{item.title}</h4>
                          <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-mono mt-1">
                            <span>{item.year}</span>
                            <span className="px-1 bg-zinc-800 rounded">{item.rating}</span>
                            <span>{item.duration}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          )}

        </div>
      )}

      {/* DETAILED OVERLAY PREVIEW MODAL (Netflix / Prime Video Style details panel with reviews and play actions) */}
      <AnimatePresence>
        {selectedDetailMedia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedDetailMedia(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-zinc-950 border border-zinc-800/80 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:grid md:grid-cols-12 max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Cover / Backdrop Section - span 5 */}
              <div className="relative md:col-span-5 h-[200px] md:h-auto min-h-[220px] bg-black">
                <img 
                  src={selectedDetailMedia.imageUrl} 
                  alt={selectedDetailMedia.title} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-zinc-950 via-zinc-950/20 to-transparent" />
                
                {/* Floating Play Action directly on thumbnail overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => {
                      playSound.click();
                      setActiveMedia(selectedDetailMedia);
                      setSelectedDetailMedia(null);
                    }}
                    className="w-16 h-16 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all cursor-pointer border border-red-500"
                  >
                    <Play className="w-7 h-7 fill-white text-white translate-x-0.5" />
                  </button>
                </div>

                <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-[#E50914] text-white text-[9px] font-black rounded uppercase">
                    HD STREAMING
                  </span>
                </div>
              </div>

              {/* Informational Contents & Comments - span 7 */}
              <div className="md:col-span-7 p-6 md:p-8 overflow-y-auto flex flex-col justify-between max-h-[60vh] md:max-h-[90vh]">
                
                {/* Header close block */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="space-y-1">
                    <h3 className="text-lg md:text-xl font-extrabold text-white tracking-tight uppercase">
                      {selectedDetailMedia.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-mono text-zinc-400">
                      <span className="text-emerald-400 font-bold">{selectedDetailMedia.matchScore}% Match</span>
                      <span>{selectedDetailMedia.year}</span>
                      <span className="px-1.5 py-0.2 bg-zinc-800 rounded font-black text-zinc-300">{selectedDetailMedia.rating}</span>
                      <span>{selectedDetailMedia.duration}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      playSound.click();
                      setSelectedDetailMedia(null);
                    }}
                    className="p-2 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Synopsis Details */}
                <div className="space-y-4">
                  <p className="text-xs md:text-sm text-zinc-300 leading-relaxed font-medium">
                    {selectedDetailMedia.description}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {selectedDetailMedia.tags.map((t, idx) => (
                      <span key={idx} className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded-full font-bold">
                        #{t}
                      </span>
                    ))}
                  </div>

                  {selectedDetailMedia.uploaderName && (
                    <p className="text-[11px] text-zinc-500 font-mono italic">
                      Publicado por: <span className="text-emerald-400 font-bold">@{selectedDetailMedia.uploaderName}</span>
                    </p>
                  )}
                </div>

                {/* Actions row */}
                <div className="flex flex-wrap items-center gap-3 border-y border-zinc-900 py-4 my-4">
                  <button
                    onClick={() => {
                      playSound.click();
                      setActiveMedia(selectedDetailMedia);
                      setSelectedDetailMedia(null);
                    }}
                    className="flex-1 px-5 py-3 bg-[#E50914] hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-red-950/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Iniciar Player</span>
                  </button>

                  <button
                    onClick={(e) => toggleMyList(selectedDetailMedia.id, e)}
                    className={`p-3 border rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      myList.includes(selectedDetailMedia.id)
                        ? 'border-red-600 bg-red-950/20 text-red-500'
                        : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300'
                    }`}
                    title={myList.includes(selectedDetailMedia.id) ? "Remover da lista" : "Adicionar à minha lista"}
                  >
                    {myList.includes(selectedDetailMedia.id) ? (
                      <Check className="w-4 h-4 text-emerald-400 font-black" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* REVIEWS / COMMENT SECTION */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#E50914]" />
                    <span>Análises &amp; Críticas da Comunidade</span>
                  </h4>

                  {/* Comment Feed list */}
                  <div className="space-y-3.5 max-h-[160px] overflow-y-auto pr-1 border-b border-zinc-900/60 pb-3">
                    {(!reviews[selectedDetailMedia.id] || reviews[selectedDetailMedia.id].length === 0) ? (
                      <p className="text-[11px] text-zinc-500 italic py-2 text-center">Nenhuma crítica registrada ainda. Seja o primeiro a opinar!</p>
                    ) : (
                      reviews[selectedDetailMedia.id].map((rev, rIdx) => (
                        <div key={rIdx} className="bg-zinc-900/40 border border-zinc-900 p-2.5 rounded-lg space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-zinc-300 flex items-center gap-1">
                              <User className="w-3 h-3 text-[#E50914]" />
                              <span>{rev.user}</span>
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">{rev.date}</span>
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">{rev.text}</p>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[...Array(5)].map((_, starIdx) => (
                              <Star 
                                key={starIdx} 
                                className={`w-3 h-3 ${starIdx < rev.rating ? 'fill-amber-500' : 'text-zinc-700'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add feedback rating form */}
                  <form onSubmit={handleAddComment} className="space-y-2 pt-2">
                    <textarea 
                      placeholder="Deixe sua crítica construtiva..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                      className="w-full p-2 text-xs bg-zinc-900 border border-zinc-800 focus:border-[#E50914] focus:outline-none rounded-xl text-white placeholder-zinc-500"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase">Nota:</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              type="button"
                              key={val}
                              onClick={() => setNewRating(val)}
                              className="text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star className={`w-4 h-4 ${val <= newRating ? 'fill-amber-500 text-amber-500' : 'text-zinc-700'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="px-4 py-1.5 bg-zinc-800 hover:bg-[#E50914] disabled:bg-zinc-900 disabled:text-zinc-600 hover:text-white transition-all text-[10px] font-extrabold uppercase rounded-lg text-zinc-300 cursor-pointer"
                      >
                        Enviar Crítica
                      </button>
                    </div>
                  </form>
                </div>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PUBLISH MOVIE UPLOAD MODAL */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => !aiAnalyzing && setShowUploadModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-zinc-950 border border-zinc-800 w-full max-w-lg p-6 md:p-8 rounded-3xl shadow-2xl relative space-y-6 max-h-[95vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-base md:text-lg font-black text-white flex items-center gap-1.5 uppercase">
                    <Upload className="w-5 h-5 text-red-500" />
                    <span>Publicar Vídeo no Catálogo</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Insira links do YouTube e anexe capas para destacar sua gameplay ou filme!
                  </p>
                </div>
                {!aiAnalyzing && (
                  <button
                    onClick={() => {
                      playSound.click();
                      setShowUploadModal(false);
                    }}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Progress bars if AI is busy */}
              {aiAnalyzing ? (
                <div className="py-12 space-y-6 text-center animate-pulse">
                  <Sparkles className="w-12 h-12 text-[#E50914] mx-auto animate-spin" />
                  <div className="space-y-2">
                    <p className="text-sm font-black text-white tracking-wide uppercase">{aiStep}</p>
                    <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                      <div 
                        className="bg-gradient-to-r from-red-600 to-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${aiProgress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">{aiProgress}% otimizado</span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">Processando bônus de +100 moedas para seu saldo...</p>
                </div>
              ) : (
                <form onSubmit={handlePublishMovie} className="space-y-4">
                  
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Título do Vídeo/Filme</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Joguei o novo jogo do Tigre por 24h"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      required
                      className="w-full p-3 text-xs bg-zinc-900 border border-zinc-800 focus:border-red-600 focus:outline-none rounded-xl text-white placeholder-zinc-500 font-sans"
                    />
                  </div>

                  {/* YouTube url/id */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Link ou ID do Vídeo do YouTube</label>
                    <div className="relative">
                      <Youtube className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                      <input 
                        type="text" 
                        placeholder="Ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        value={uploadYoutubeId}
                        onChange={(e) => setUploadYoutubeId(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 text-xs bg-zinc-900 border border-zinc-800 focus:border-red-600 focus:outline-none rounded-xl text-white placeholder-zinc-500 font-mono"
                      />
                    </div>
                    <p className="text-[9px] text-zinc-500 font-mono">Suporta links completos do YouTube, links encurtados youtu.be ou ID de 11 dígitos.</p>
                  </div>

                  {/* Synopsis */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Sinopse / Descrição (Opcional)</label>
                    <textarea 
                      placeholder="Uma breve história do vídeo. Se deixado vazio, a Inteligência Artificial do GameZone gerará uma sinopse incrível e otimizada!"
                      value={uploadSynopsis}
                      onChange={(e) => setUploadSynopsis(e.target.value)}
                      rows={3}
                      className="w-full p-3 text-xs bg-zinc-900 border border-zinc-800 focus:border-red-600 focus:outline-none rounded-xl text-white placeholder-zinc-500 font-sans"
                    />
                  </div>

                  {/* Image Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Poster / Capa Cinematográfica</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setUploadImageOption('preset')}
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${uploadImageOption === 'preset' ? 'bg-[#E50914] text-white' : 'bg-zinc-900 text-zinc-400'}`}
                        >
                          Presets
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadImageOption('url')}
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${uploadImageOption === 'url' ? 'bg-[#E50914] text-white' : 'bg-zinc-900 text-zinc-400'}`}
                        >
                          URL Externa
                        </button>
                      </div>
                    </div>

                    {uploadImageOption === 'preset' ? (
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(PRESET_IMAGES).map(([key, meta]) => (
                          <button
                            type="button"
                            key={key}
                            onClick={() => {
                              playSound.click();
                              setUploadPreset(key as any);
                            }}
                            className={`p-2 rounded-xl border bg-zinc-900/60 flex flex-col items-center gap-1.5 transition-all hover:scale-105 cursor-pointer text-center ${uploadPreset === key ? 'border-red-600 bg-red-950/20' : 'border-zinc-850'}`}
                          >
                            <img src={meta.url} alt={meta.label} referrerPolicy="no-referrer" className="w-full h-10 object-cover rounded-lg" />
                            <span className="text-[8px] font-extrabold text-zinc-300 uppercase line-clamp-1">{meta.label}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input 
                        type="url" 
                        placeholder="Ex: https://site.com/minha_imagem_de_capa.jpg"
                        value={uploadImageUrl}
                        onChange={(e) => setUploadImageUrl(e.target.value)}
                        className="w-full p-3 text-xs bg-zinc-900 border border-zinc-800 focus:border-red-600 focus:outline-none rounded-xl text-white placeholder-zinc-500 font-sans"
                      />
                    )}
                  </div>

                  {/* Submission and Bonus Award notice */}
                  <div className="bg-zinc-900/50 border border-zinc-900 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span>Recompensa de Publicação</span>
                      </span>
                      <p className="text-[11px] text-zinc-400 leading-tight">Ganhe bônus de <strong>100 moedas</strong> e <strong>20 XP</strong> ao publicar no catálogo!</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        playSound.click();
                        setShowUploadModal(false);
                      }}
                      className="flex-1 py-3 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-950/20 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Analisar &amp; Publicar
                    </button>
                  </div>

                </form>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
