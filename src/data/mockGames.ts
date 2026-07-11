import { PublishedGame } from '../types/distribution';

export const INITIAL_PUBLISHED_GAMES: PublishedGame[] = [
  {
    id: 'game-neon-overdrive',
    devId: 'dev_cyber_pulse',
    devName: 'CyberPulse Studios',
    title: 'Neon Overdrive: Tokyo Drift',
    subtitle: 'O supremo simulador de corrida arcade cyberpunk',
    description: 'Acelere pelas ruas de uma Tóquio futurista banhada por luzes neon em velocidade supersônica. Domine o drift gravitacional, tune seus veículos híbridos eletromagnéticos com inteligência artificial e compita contra gangues cibernéticas pelo controle do submundo digital.',
    shortDescription: 'Corrida arcade cyberpunk com física de drift em alta velocidade, trilha synthwave retro e customização avançada de veículos híbridos.',
    category: 'game',
    genre: 'Corrida',
    platform: ['Windows', 'Mac', 'Linux'],
    language: 'Português (BR), Inglês, Japonês',
    ageRating: '12+',
    requirementsMin: {
      os: 'Windows 10 64-bit',
      processor: 'Intel Core i5-4460 / AMD FX-6300',
      memory: '8 GB RAM',
      graphics: 'NVIDIA GeForce GTX 760 / AMD Radeon R7 260X',
      storage: '15 GB de espaço livre'
    },
    requirementsRec: {
      os: 'Windows 11 64-bit',
      processor: 'Intel Core i7-8700K / AMD Ryzen 5 3600X',
      memory: '16 GB RAM',
      graphics: 'NVIDIA GeForce GTX 1080 Ti / RTX 3060',
      storage: '15 GB de espaço livre em SSD'
    },
    publisher: 'GameZon Global Solutions',
    releaseDate: '2026-05-12',
    price: 49.90,
    discount: 15,
    version: '1.4.2',
    changelog: 'Adicionado modo Drift Gravitacional cooperativo online; Novas pistas em Chiba District; Ajustes de estabilidade em GPUs RTX.',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder trailer link
    images: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=600'
    ],
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800',
    iconUrl: '🏎️',
    logoUrl: '⚡ NEON OVERDRIVE',
    tags: ['Cyberpunk', 'Drift', 'Synthwave', 'Arcade', 'Online'],
    status: 'published',
    downloadsCount: 14500,
    salesCount: 8900,
    ratingAverage: 4.8,
    ratingCount: 142
  },
  {
    id: 'game-shadow-samurai',
    devId: 'dev_zenith_interactive',
    devName: 'Zenith Interactive',
    title: 'Shadow Samurai: Zero',
    subtitle: 'Corte as sombras neste hack-and-slash visceral',
    description: 'Entre na pele de Zero, o último samurai cibernético em um mundo de fantasia feudal tecnologicamente avançado. Domine as artes do sabre de plasma, desvie de balas de canhão elétrico e realize parries precisos contra generais mecânicos em combates onde cada erro é fatal.',
    shortDescription: 'Combate tático e ultra veloz com espadas de plasma, chefes mecânicos colossais e mecânica de parry punitiva.',
    category: 'game',
    genre: 'Ação',
    platform: ['Windows', 'Web'],
    language: 'Português (BR), Inglês, Espanhol',
    ageRating: '16+',
    requirementsMin: {
      os: 'Windows 10 64-bit',
      processor: 'Intel Core i3-8100 / AMD Ryzen 3 1200',
      memory: '6 GB RAM',
      graphics: 'NVIDIA GeForce GTX 1050 / RX 560',
      storage: '10 GB livres'
    },
    requirementsRec: {
      os: 'Windows 11 64-bit',
      processor: 'Intel Core i5-10400 / AMD Ryzen 5 3600',
      memory: '12 GB RAM',
      graphics: 'NVIDIA GTX 1660 Super / RX 5500 XT',
      storage: '10 GB em SSD'
    },
    publisher: 'Zenith Publishing',
    releaseDate: '2026-06-01',
    price: 0, // FREE
    discount: 0,
    version: '1.0.1',
    changelog: 'Corrigido bug de congelamento de frames durante o parry consecutivo; Adicionado suporte a controles DualSense.',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    images: [
      'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&q=80&w=600'
    ],
    bannerUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=800',
    iconUrl: '⚔️',
    logoUrl: '🥋 SHADOW SAMURAI',
    tags: ['Samurai', 'Dificuldade', 'Hack & Slash', 'Gratuito', 'Solo'],
    status: 'published',
    downloadsCount: 38200,
    salesCount: 0,
    ratingAverage: 4.6,
    ratingCount: 380
  },
  {
    id: 'game-stellar-tactics',
    devId: 'dev_nebula_games',
    devName: 'Nebula Games',
    title: 'Stellar Tactics: Galaxy Command',
    subtitle: 'Comande frotas espaciais e colonize planetas',
    description: 'Um jogo de estratégia 4X massivo. Explore sistemas estelares gerados proceduralmente, envie sondas de mineração de matéria escura, estabeleça rotas comerciais diplomáticas ou trave batalhas interestelares dinâmicas com simulação física de destruição de cascos em tempo real.',
    shortDescription: 'Estratégia 4X espacial profunda, diplomacia intergaláctica complexa e batalhas de frotas dinâmicas.',
    category: 'game',
    genre: 'Estratégia',
    platform: ['Windows', 'Mac'],
    language: 'Inglês, Alemão, Francês',
    ageRating: 'Livre',
    requirementsMin: {
      os: 'Windows 10 / MacOS Catalina',
      processor: 'Intel Core i5 / AMD Ryzen 3',
      memory: '8 GB RAM',
      graphics: 'NVIDIA GTX 960 / AMD R9 380',
      storage: '20 GB livres'
    },
    requirementsRec: {
      os: 'Windows 11 / MacOS Sonoma',
      processor: 'Intel i7 / Ryzen 7',
      memory: '16 GB RAM',
      graphics: 'NVIDIA RTX 2070 / Radeon RX 5700',
      storage: '20 GB em SSD'
    },
    publisher: 'IndieUniverse Corp',
    releaseDate: '2026-03-24',
    price: 79.90,
    discount: 30, // Promotional sale!
    version: '2.1.0',
    changelog: 'Expansão "Dark Core" inclusa; Mecânica de buracos negros aprimorada; Balanceamento de cruzadores e transportadores pesados.',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    images: [
      'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600'
    ],
    bannerUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&q=80&w=800',
    iconUrl: '🚀',
    logoUrl: '🌌 STELLAR COMMAND',
    tags: ['Espacial', '4X Strategy', 'Ficção Científica', 'Multijogador'],
    status: 'published',
    downloadsCount: 5200,
    salesCount: 3100,
    ratingAverage: 4.4,
    ratingCount: 88
  },
  {
    id: 'dlc-neon-overdrive-drifter',
    devId: 'dev_cyber_pulse',
    devName: 'CyberPulse Studios',
    title: 'Neon Overdrive: Drifter Pack (DLC)',
    subtitle: 'Expansão oficial de veículos lendários',
    description: 'Adiciona 4 novos carros elétricos customizados, 12 novas skins de auras de neon e 5 trilhas exclusivas de Synthwave licenciadas para tocar em sua rádio in-game.',
    shortDescription: 'DLC de expansão contendo 4 novos carros elétricos lendários e cosméticos inéditos.',
    category: 'dlc',
    genre: 'Corrida',
    platform: ['Windows', 'Mac', 'Linux'],
    language: 'Português (BR), Inglês',
    ageRating: '12+',
    requirementsMin: {
      os: 'Requer o jogo base instalado',
      processor: 'N/A',
      memory: 'N/A',
      graphics: 'N/A',
      storage: '500 MB adicionais'
    },
    requirementsRec: {
      os: 'Requer o jogo base instalado',
      processor: 'N/A',
      memory: 'N/A',
      graphics: 'N/A',
      storage: '500 MB adicionais'
    },
    publisher: 'GameZon Global Solutions',
    releaseDate: '2026-06-20',
    price: 19.90,
    discount: 0,
    version: '1.0.0',
    changelog: 'Lançamento oficial da expansão.',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    images: ['https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=600'],
    bannerUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=800',
    iconUrl: '🎁',
    logoUrl: '⚡ DRIFTER BUNDLE',
    tags: ['DLC', 'Carros', 'Cosméticos', 'Música'],
    status: 'published',
    downloadsCount: 2200,
    salesCount: 1900,
    ratingAverage: 4.7,
    ratingCount: 45
  },
  {
    id: 'bundle-ultimate-gamer',
    devId: 'dev_cyber_pulse',
    devName: 'CyberPulse Studios',
    title: 'Cyber Drifter Ultimate Bundle',
    subtitle: 'Adquira o jogo base + DLC Drifter com desconto gigante',
    description: 'O pacote definitivo para entusiastas digitais de velocidade. Este pacote promocional inclui o aclamado jogo base "Neon Overdrive: Tokyo Drift" junto com a recém-lançada expansão "Drifter Pack DLC" por um valor cumulativo imbatível.',
    shortDescription: 'Pacote promocional contendo o jogo Neon Overdrive completo e a DLC Drifter Pack inclusa.',
    category: 'bundle',
    genre: 'Corrida',
    platform: ['Windows', 'Mac', 'Linux'],
    language: 'Português (BR), Inglês',
    ageRating: '12+',
    requirementsMin: {
      os: 'Windows 10 64-bit',
      processor: 'Intel Core i5',
      memory: '8 GB RAM',
      graphics: 'NVIDIA GTX 760',
      storage: '16 GB livres'
    },
    requirementsRec: {
      os: 'Windows 11 64-bit',
      processor: 'Intel Core i7',
      memory: '16 GB RAM',
      graphics: 'NVIDIA RTX 3060',
      storage: '16 GB em SSD'
    },
    publisher: 'GameZon Global Solutions',
    releaseDate: '2026-06-20',
    price: 59.90, // cheaper than 49.90 + 19.90
    discount: 20, // further 20% discount on the bundle price!
    version: '1.0.0',
    changelog: 'Compilação de lançamento do pacote integrado.',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    images: ['https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600'],
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800',
    iconUrl: '📦',
    logoUrl: '⚡ ULTIMATE BUNDLE',
    tags: ['Pacote', 'Desconto', 'Completo', 'Ficção Científica'],
    status: 'published',
    downloadsCount: 1500,
    salesCount: 1100,
    ratingAverage: 4.9,
    ratingCount: 32
  }
];

export const MOCK_DEVELOPERS = [
  {
    id: 'dev_cyber_pulse',
    userId: 'user_cyber_pulse',
    studioName: 'CyberPulse Studios',
    bio: 'Desenvolvedora de jogos eletrônicos independente fundada em 2022, focada em reviver o sentimento dos arcades clássicos de velocidade com estética cyberpunk e batidas eletrônicas imersivas.',
    logoUrl: '⚡',
    bannerUrl: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
    website: 'https://cyberpulse.gamezon.io',
    twitter: '@CyberPulseRetro',
    youtube: 'youtube.com/cyberpulsegames',
    discord: 'discord.gg/cyberpulse',
    team: ['Lucas Neon (Diretor Criativo)', 'Alice Synth (Engenharia de Som)', 'Daniel Shader (Lead Developer)'],
    followersCount: 8400
  },
  {
    id: 'dev_zenith_interactive',
    userId: 'user_zenith_interactive',
    studioName: 'Zenith Interactive',
    bio: 'Estúdio focado em experiências desafiadoras e narrativas sombrias. Amamos espadas digitais, fantasia industrial e dificuldade brutal.',
    logoUrl: '⚔️',
    bannerUrl: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    website: 'https://zenithinteractive.com',
    twitter: '@ZenithSamurai',
    discord: 'discord.gg/zenithinteractive',
    team: ['Kenji Zero (Roteiro & Arte)', 'Sophia Core (Dev Principal)'],
    followersCount: 11200
  }
];

export const MOCK_REVIEWS: Record<string, any[]> = {
  'game-neon-overdrive': [
    {
      id: 'rev-1',
      userId: 'user_speedrun_god',
      username: 'Speedrunner_2077',
      userAvatar: '👾',
      gameId: 'game-neon-overdrive',
      rating: 5,
      reviewText: 'Absolutamente incrível! A sensação de velocidade é maravilhosa, o sistema de drift gravidade funciona com muita precisão e a trilha sonora synthwave me deu arrepios. Vale cada centavo!',
      screenshots: ['https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400'],
      upvotes: 48,
      downvotes: 1,
      createdAt: '2026-06-25T14:30:00Z',
      devResponse: 'Muito obrigado, Speedrunner! Nos esforçamos muito na trilha de som e o feedback de especialistas em drift nos deixa extremamente felizes. Nos vemos na pista!'
    },
    {
      id: 'rev-2',
      userId: 'user_casual_retro',
      username: 'GamerSaudoso',
      userAvatar: '🎮',
      gameId: 'game-neon-overdrive',
      rating: 4,
      reviewText: 'Gostei muito do visual retrô e da dirigibilidade. Só achei um pouco difícil nas fases avançadas contra o chefe cibernético Chiba-9. Mas o suporte a controles e calibração é exemplar.',
      screenshots: [],
      upvotes: 12,
      downvotes: 2,
      createdAt: '2026-07-02T18:15:00Z'
    }
  ],
  'game-shadow-samurai': [
    {
      id: 'rev-3',
      userId: 'user_hardcore_sabre',
      username: 'BladeMasterX',
      userAvatar: '🥋',
      gameId: 'game-shadow-samurai',
      rating: 5,
      reviewText: 'O parry deste jogo é uma obra-prima. Lembra Sekiro, mas o tema cyber-samurai adiciona um charme elétrico espetacular. Difícil pacas, mas quando você pega o timing é extremamente recompensador.',
      screenshots: [],
      upvotes: 95,
      downvotes: 4,
      createdAt: '2026-06-15T10:00:00Z',
      devResponse: 'Arigatou, BladeMasterX! Continuaremos polindo o feedback visual das faíscas de plasma para tornar o parry ainda mais satisfatório na próxima atualização!'
    }
  ]
};
