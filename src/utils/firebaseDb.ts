import { PlayerStats, TransactionLog } from '../types';
import { secureStorage } from './security';

// Safe Import Firebase to prevent runtime crash if library is missing or restricted
let dbInstance: any = null;
let authInstance: any = null;
let isRealFirebaseEnabled = false;

try {
  const firebaseApp = require('firebase/app');
  const firebaseFirestore = require('firebase/firestore');
  const googleDriveDb = require('./googleDriveDb');
  
  const app = firebaseApp.getApp();
  dbInstance = firebaseFirestore.getFirestore(app);
  authInstance = googleDriveDb.auth;
  isRealFirebaseEnabled = true;
  console.log('[FIREBASE CORE] Real Firebase database initialized successfully.');
} catch (e) {
  console.warn('[FIREBASE CORE] Real Firebase initialization failed or bypassed. Running in Secure Standalone Sandbox Mode.', e);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: authInstance?.currentUser?.uid || 'guest',
      email: authInstance?.currentUser?.email || 'guest@gamezone.com',
    },
    operationType,
    path
  };
  console.error('[SECURITY ENGINE] Simulated Firestore Error handled:', JSON.stringify(errInfo));
}

// Convert user state to a safe Firestore key/ID
export function getCleanUserId(user: { email: string; provider: string } | null): string | null {
  if (!user) return null;
  if (user.provider === 'google' && authInstance?.currentUser) {
    return authInstance.currentUser.uid;
  }
  // Safe sanitization for simulated local email logins
  return 'user_' + user.email.replace(/[^a-zA-Z0-9_\-]/g, '_');
}

// ----------------------------------------------------
// LOCAL SIMULATED DATABASE INITIAL SEED
// ----------------------------------------------------
const INITIAL_MOVIES_MOCK: FirestoreMovie[] = [
  {
    id: 'yt-natgeo-001',
    title: 'National Geographic: Planeta Hostil',
    description: 'Explore os limites extremos da sobrevivência da vida selvagem nos habitats mais profundos e perigosos da Terra.',
    category: 'youtube',
    year: 2024,
    rating: 'A12',
    duration: '44 min',
    matchScore: 98,
    imageUrl: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?auto=format&fit=crop&q=80&w=600',
    youtubeId: 'pS-WJ7N8K4g',
    tags: ['Ciência', 'Natureza', 'Sobrevivência'],
    uploaderId: 'system',
    uploaderName: 'Editor National Geographic',
    createdAt: new Date().toISOString()
  },
  {
    id: 'yt-natgeo-002',
    title: 'National Geographic: A Ciência do Cosmos',
    description: 'Uma jornada explicativa sobre a formação de buracos negros, nebulosas e a física do tempo-espaço.',
    category: 'youtube',
    year: 2024,
    rating: 'L',
    duration: '28 min',
    matchScore: 95,
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600',
    youtubeId: '98O8U-6WclA',
    tags: ['Cosmos', 'Astronomia', 'National Geographic'],
    uploaderId: 'system',
    uploaderName: 'Editor National Geographic',
    createdAt: new Date().toISOString()
  },
  {
    id: 'yt-ciencia-001',
    title: 'Ciência Todo Dia: Por Que o Tempo Só Corre Para Frente?',
    description: 'Uma explicação profunda e didática sobre a entropia, a segunda lei da termodinâmica e a flecha do tempo.',
    category: 'youtube',
    year: 2024,
    rating: 'L',
    duration: '15 min',
    matchScore: 99,
    imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=600',
    youtubeId: 's_v063B6F-M',
    tags: ['Ciência Todo Dia', 'Física', 'Tempo'],
    uploaderId: 'system',
    uploaderName: 'Ciência Todo Dia',
    createdAt: new Date().toISOString()
  },
  {
    id: 'yt-jornalismo-001',
    title: 'Jornalismo Investigativo: O Futuro da Inteligência Artificial',
    description: 'Documentário completo sobre o impacto do aprendizado de máquina nas profissões, ética digital e cibersegurança do amanhã.',
    category: 'youtube',
    year: 2024,
    rating: 'A10',
    duration: '52 min',
    matchScore: 92,
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=600',
    youtubeId: 'V9335R8K1M8',
    tags: ['Tecnologia', 'Jornalismo', 'Futuro'],
    uploaderId: 'system',
    uploaderName: 'GZ News',
    createdAt: new Date().toISOString()
  }
];

// 1. Profile / Stats Operations
export async function getUserProfile(userId: string): Promise<{ stats: PlayerStats; realBalance: number; withdrawLimit: number } | null> {
  const path = `users/${userId}`;
  
  if (isRealFirebaseEnabled && dbInstance) {
    try {
      const firebaseFirestore = require('firebase/firestore');
      const docRef = firebaseFirestore.doc(dbInstance, 'users', userId);
      const snap = await firebaseFirestore.getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          stats: {
            coins: data.coins ?? 150,
            lives: data.lives ?? 3,
            currentStage: data.currentStage ?? 1,
            highScore: data.highScore ?? 0,
            unlockedSkins: data.unlockedSkins ?? ['classic'],
            unlockedAccessories: data.unlockedAccessories ?? ['none'],
            unlockedAuras: data.unlockedAuras ?? ['none'],
            avatar: data.avatar ?? { skin: 'classic', accessory: 'none', aura: 'none' },
            points: data.points ?? 0,
            level: data.level ?? 1,
            isVip: data.isVip ?? false,
            rtpBoostSpins: data.rtpBoostSpins ?? 0
          },
          realBalance: data.realBalance ?? 120.00,
          withdrawLimit: data.withdrawLimit ?? 100.00
        };
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  // Standalone offline-safe loading using secure signatures
  console.log('[FIREBASE SIMULATOR] Fetching profile securely from offline ledger...');
  const defaultStats = {
    coins: 150,
    lives: 3,
    currentStage: 1,
    highScore: 0,
    unlockedSkins: ['classic'],
    unlockedAccessories: ['none'],
    unlockedAuras: ['none'],
    avatar: { skin: 'classic', accessory: 'none', aura: 'none' },
    points: 0,
    level: 1
  };

  const savedStats = secureStorage.getItem(`gamezone_player_stats_${userId}`, defaultStats, userId);
  const savedBalance = secureStorage.getItem(`gamezone_real_balance_${userId}`, 120.00, userId);
  const savedLimit = secureStorage.getItem(`gamezone_withdraw_limit_${userId}`, 100.00, userId);

  return {
    stats: savedStats,
    realBalance: savedBalance,
    withdrawLimit: savedLimit
  };
}

export async function saveUserProfile(
  userId: string, 
  stats: PlayerStats, 
  realBalance: number, 
  withdrawLimit: number
): Promise<void> {
  const path = `users/${userId}`;

  // Synchronize securely locally first to avoid data loss under any condition
  secureStorage.setItem(`gamezone_player_stats_${userId}`, stats, userId);
  secureStorage.setItem(`gamezone_real_balance_${userId}`, realBalance, userId);
  secureStorage.setItem(`gamezone_withdraw_limit_${userId}`, withdrawLimit, userId);

  if (isRealFirebaseEnabled && dbInstance) {
    try {
      const firebaseFirestore = require('firebase/firestore');
      const docRef = firebaseFirestore.doc(dbInstance, 'users', userId);
      await firebaseFirestore.setDoc(docRef, {
        coins: stats.coins,
        lives: stats.lives,
        currentStage: stats.currentStage,
        highScore: stats.highScore,
        unlockedSkins: stats.unlockedSkins || ['classic'],
        unlockedAccessories: stats.unlockedAccessories || ['none'],
        unlockedAuras: stats.unlockedAuras || ['none'],
        avatar: stats.avatar || { skin: 'classic', accessory: 'none', aura: 'none' },
        points: stats.points ?? 0,
        level: stats.level ?? 1,
        isVip: stats.isVip ?? false,
        rtpBoostSpins: stats.rtpBoostSpins ?? 0,
        realBalance: realBalance,
        withdrawLimit: withdrawLimit,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

// 2. Movie Operations (Cinema community uploads)
export interface FirestoreMovie {
  id: string;
  title: string;
  description: string;
  category: 'youtube' | 'originals' | 'blockbuster' | 'gaming_docs';
  year: number;
  rating: string;
  duration: string;
  matchScore: number;
  imageUrl: string;
  youtubeId?: string;
  tags: string[];
  uploaderId: string;
  uploaderName: string;
  createdAt: string;
}

export async function getMovies(): Promise<FirestoreMovie[]> {
  const path = 'movies';

  if (isRealFirebaseEnabled && dbInstance) {
    try {
      const firebaseFirestore = require('firebase/firestore');
      const colRef = firebaseFirestore.collection(dbInstance, 'movies');
      const snap = await firebaseFirestore.getDocs(colRef);
      const movies: FirestoreMovie[] = [];
      snap.forEach((docSnap: any) => {
        movies.push(docSnap.data() as FirestoreMovie);
      });
      if (movies.length > 0) return movies;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }

  // Load from local storage simulated Firestore
  const cached = localStorage.getItem('gamezone_simulated_movies');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      return INITIAL_MOVIES_MOCK;
    }
  }
  
  localStorage.setItem('gamezone_simulated_movies', JSON.stringify(INITIAL_MOVIES_MOCK));
  return INITIAL_MOVIES_MOCK;
}

export async function addMovie(movie: FirestoreMovie): Promise<void> {
  const path = `movies/${movie.id}`;

  // Update local storage representation
  const currentMovies = await getMovies();
  const updatedMovies = [movie, ...currentMovies.filter(m => m.id !== movie.id)];
  localStorage.setItem('gamezone_simulated_movies', JSON.stringify(updatedMovies));

  if (isRealFirebaseEnabled && dbInstance) {
    try {
      const firebaseFirestore = require('firebase/firestore');
      const docRef = firebaseFirestore.doc(dbInstance, 'movies', movie.id);
      await firebaseFirestore.setDoc(docRef, movie);
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

// 3. Transaction Logs Operations
export async function getUserLogs(userId: string): Promise<TransactionLog[]> {
  const path = `users/${userId}/logs`;

  if (isRealFirebaseEnabled && dbInstance) {
    try {
      const firebaseFirestore = require('firebase/firestore');
      const colRef = firebaseFirestore.collection(dbInstance, 'users', userId, 'logs');
      const snap = await firebaseFirestore.getDocs(colRef);
      const logs: TransactionLog[] = [];
      snap.forEach((docSnap: any) => {
        logs.push(docSnap.data() as TransactionLog);
      });
      return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }

  // Standalone simulated logs loader
  const defaultLogs = [
    {
      id: 'TXN-INITIAL-001',
      timestamp: new Date().toLocaleString('pt-BR'),
      type: 'earn' as const,
      description: 'Bônus de Boas-vindas creditado na criação da conta',
      amount: 150,
      currency: 'coins' as const,
      status: 'success' as const,
      securityHash: '0x8ae5f63bc10ad9e9b0d21a2c6d48c8b5'
    }
  ];

  return secureStorage.getItem(`gamezone_transaction_logs_${userId}`, defaultLogs, userId);
}

export async function addUserLog(userId: string, log: TransactionLog): Promise<void> {
  const path = `users/${userId}/logs/${log.id}`;

  // Save securely locally
  const currentLogs = await getUserLogs(userId);
  const updatedLogs = [log, ...currentLogs.filter(l => l.id !== log.id)];
  secureStorage.setItem(`gamezone_transaction_logs_${userId}`, updatedLogs, userId);

  if (isRealFirebaseEnabled && dbInstance) {
    try {
      const firebaseFirestore = require('firebase/firestore');
      const docRef = firebaseFirestore.doc(dbInstance, 'users', userId, 'logs', log.id);
      await firebaseFirestore.setDoc(docRef, log);
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}
