import { ShopItem } from '../types';

export const SKINS = [
  { id: 'classic', name: 'Herói Clássico', color: 'bg-emerald-400 border-emerald-300 shadow-emerald-500/50', emoji: '🤖', price: 0, desc: 'O clássico ciborgue de teste.' },
  { id: 'cyber-purple', name: 'Cyber Neon', color: 'bg-fuchsia-500 border-fuchsia-300 shadow-fuchsia-500/50', emoji: '👾', price: 50, desc: 'Pintado em neon fúcsia cibernético.' },
  { id: 'golden-warrior', name: 'Guerreiro de Ouro', color: 'bg-amber-400 border-amber-200 shadow-amber-500/50', emoji: '👑', price: 200, desc: 'Feito de placas de ouro sólido reluzente.' },
  { id: 'matrix-hacker', name: 'Matrix Glitch', color: 'bg-green-500 border-green-300 shadow-green-500/50', emoji: '👽', price: 120, desc: 'Com linhas de código fluindo na carcaça.' },
  { id: 'phantom-shadow', name: 'Sombra Fantasma', color: 'bg-slate-900 border-red-500 shadow-red-900/50', emoji: '💀', price: 150, desc: 'Envolto em trevas tecnológicas e fumaça.' },
  { id: 'plasma-slime', name: 'Slime Ácido', color: 'bg-lime-400 border-lime-200 shadow-lime-500/50', emoji: '🟢', price: 80, desc: 'Gelatinoso, tóxico e altamente flexível.' }
];

export const ACCESSORIES = [
  { id: 'none', name: 'Sem Acessório', emoji: '❌', price: 0, desc: 'Estilo limpo e minimalista.' },
  { id: 'shades', name: 'Óculos Futuristas', emoji: '😎', price: 30, desc: 'Óculos escuros polarizados cyberpunk.' },
  { id: 'wizard', name: 'Chapéu de Mago', emoji: '🧙‍♂️', price: 80, desc: 'Imbuído com magia de desenvolvimento web.' },
  { id: 'headset', name: 'Headset Gamer', emoji: '🎧', price: 50, desc: 'Para ouvir a trilha sonora em 8D.' },
  { id: 'crown', name: 'Coroa Imperial', emoji: '👑', price: 180, desc: 'Mostre quem é o verdadeiro rei da tabela de líderes.' },
  { id: 'viking', name: 'Elmo Viking', emoji: '🪖', price: 70, desc: 'Chifres de batalha para encarar as fases difíceis.' }
];

export const AURAS = [
  { id: 'none', name: 'Sem Aura', effectClass: '', color: 'transparent', price: 0, desc: 'Sem efeitos especiais.' },
  { id: 'cyber-grid', name: 'Grelha Retro', effectClass: 'animate-pulse ring-4 ring-cyan-500/40 bg-cyan-950/20', color: 'cyan', price: 100, desc: 'Grelha holográfica de neon azul.' },
  { id: 'fire-shield', name: 'Escudo de Fogo', effectClass: 'animate-ping duration-1000 ring-4 ring-orange-500/60 bg-orange-500/10', color: 'orange', price: 150, desc: 'Chamas dinâmicas ao seu redor.' },
  { id: 'matrix-rain', name: 'Chuva Cósmica', effectClass: 'animate-bounce ring-4 ring-green-500/50 bg-green-950/20', color: 'green', price: 200, desc: 'Códigos binários verdes flutuantes.' },
  { id: 'stardust', name: 'Pó de Estrelas', effectClass: 'animate-pulse ring-4 ring-yellow-400/50 bg-yellow-400/10', color: 'yellow', price: 120, desc: 'Brilhos de galáxias distantes.' }
];

export const SHOP_ITEMS: ShopItem[] = [
  // LIVES (Category Booster)
  {
    id: 'pack_lives_5',
    name: 'Mini Pacote de Vidas (5x)',
    description: 'Cinco vidas extras para você nunca ver a tela de Game Over.',
    price: 4.90,
    currency: 'real',
    category: 'booster',
    subCategory: 'lives',
    visualValue: '❤️ x5',
    value: 5
  },
  {
    id: 'pack_lives_15',
    name: 'Mega Pacote de Vidas (15x)',
    description: 'Quinze vidas extras para maratonar todos os estágios sem preocupação.',
    price: 11.90,
    currency: 'real',
    category: 'booster',
    subCategory: 'lives',
    visualValue: '❤️ x15',
    value: 15
  },
  {
    id: 'single_life_coin',
    name: '1 Vida Extra (Moedas)',
    description: 'Adquira uma vida extra usando seus pontos/moedas do jogo.',
    price: 50,
    currency: 'coins',
    category: 'booster',
    subCategory: 'lives',
    visualValue: '❤️ x1',
    value: 1
  },

  // STAGE SKIP (Category Booster)
  {
    id: 'pack_skips_3',
    name: 'Pacote Avançar Fases (3x)',
    description: 'Pule fases super difíceis e desafiadoras instantaneamente com 3 skips.',
    price: 9.90,
    currency: 'real',
    category: 'booster',
    subCategory: 'stage_skip',
    visualValue: '⏩ x3',
    value: 3
  },
  {
    id: 'single_skip_coin',
    name: 'Pular 1 Fase (Moedas)',
    description: 'Dificuldade insana? Pule de estágio usando pontos/moedas acumuladas.',
    price: 120,
    currency: 'coins',
    category: 'booster',
    subCategory: 'stage_skip',
    visualValue: '⏩ x1',
    value: 1
  },

  // COINS PACKS (Category Coins)
  {
    id: 'coins_500',
    name: 'Bolsa de Moedas (500)',
    description: 'Adquira 500 moedas para comprar skins e customizar seu avatar.',
    price: 7.90,
    currency: 'real',
    category: 'coins',
    subCategory: 'pack',
    visualValue: '🪙 500',
    value: 500
  },
  {
    id: 'coins_2000',
    name: 'Baú de Ouro (2000)',
    description: 'Pacote econômico de 2000 moedas para ostentar e desbloquear a loja toda.',
    price: 19.90,
    currency: 'real',
    category: 'coins',
    subCategory: 'pack',
    visualValue: '🪙 2000',
    value: 2000
  },

  // PREMIUM AVATAR ALL-ACCESS (Category Booster)
  {
    id: 'vip_all_access',
    name: 'VIP All-Access Pass',
    description: 'Ativa o status de membro VIP PREMIUM: Desbloqueia todos os avatares/auras, dá 10 vidas, aumenta o RTP base em 50% e dobra seus limites!',
    price: 29.90,
    currency: 'real',
    category: 'booster',
    subCategory: 'pack',
    visualValue: '👑 VIP',
    value: 10
  },
  {
    id: 'booster_luck_15',
    name: 'Multiplicador de Sorte (15 Giros)',
    description: 'Aumenta em 200% as chances de acerto e liberação de jackpots no Fortune Tiger, Aviator e Roleta pelas próximas 15 rodadas!',
    price: 14.90,
    currency: 'real',
    category: 'booster',
    subCategory: 'pack',
    visualValue: '🍀 x15',
    value: 15
  },
  {
    id: 'limit_upgrade_500',
    name: 'Super Pack de Moedas (5000 + Bônus)',
    description: 'Adquira um super pacote com 5000 moedas e bônus exclusivo de 5 vidas extras para usar em qualquer jogo do sistema.',
    price: 25.00,
    currency: 'real',
    category: 'coins',
    subCategory: 'pack',
    visualValue: '🪙 5000',
    value: 5000
  }
];
