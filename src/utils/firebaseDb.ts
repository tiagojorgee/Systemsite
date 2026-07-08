import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  addDoc,
  deleteDoc,
  getDocFromServer
} from 'firebase/firestore';
import { initializeApp, getApp } from 'firebase/app';
import { auth } from './googleDriveDb';
import { PlayerStats, TransactionLog } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize or retrieve Firestore instance
const app = getApp();
export const db = getFirestore(app);

// Test Firestore Connection as required by instructions
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration.");
    }
  }
}
testConnection();

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
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Strict JSON Error handler required by guidelines
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Convert user state to a safe Firestore key/ID
export function getCleanUserId(user: { email: string; provider: string } | null): string | null {
  if (!user) return null;
  if (user.provider === 'google' && auth.currentUser) {
    return auth.currentUser.uid;
  }
  // Safe sanitization for simulated local email logins
  return 'user_' + user.email.replace(/[^a-zA-Z0-9_\-]/g, '_');
}

// 1. Profile / Stats Operations
export async function getUserProfile(userId: string): Promise<{ stats: PlayerStats; realBalance: number; withdrawLimit: number } | null> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
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
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

export async function saveUserProfile(
  userId: string, 
  stats: PlayerStats, 
  realBalance: number, 
  withdrawLimit: number
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, {
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
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
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
  try {
    const colRef = collection(db, 'movies');
    const snap = await getDocs(colRef);
    const movies: FirestoreMovie[] = [];
    snap.forEach((docSnap) => {
      movies.push(docSnap.data() as FirestoreMovie);
    });
    return movies;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function addMovie(movie: FirestoreMovie): Promise<void> {
  const path = `movies/${movie.id}`;
  try {
    const docRef = doc(db, 'movies', movie.id);
    await setDoc(docRef, movie);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 3. Transaction Logs Operations
export async function getUserLogs(userId: string): Promise<TransactionLog[]> {
  const path = `users/${userId}/logs`;
  try {
    const colRef = collection(db, 'users', userId, 'logs');
    const snap = await getDocs(colRef);
    const logs: TransactionLog[] = [];
    snap.forEach((docSnap) => {
      logs.push(docSnap.data() as TransactionLog);
    });
    // Sort locally by date for clean viewing
    return logs.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function addUserLog(userId: string, log: TransactionLog): Promise<void> {
  const path = `users/${userId}/logs/${log.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'logs', log.id);
    await setDoc(docRef, log);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
