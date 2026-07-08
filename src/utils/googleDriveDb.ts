import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { PlayerStats, TransactionLog } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Drive scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Configure Facebook Auth Provider
const fbProvider = new FacebookAuthProvider();
fbProvider.addScope('email');
fbProvider.addScope('public_profile');

export interface GameZoneDatabase {
  stats: PlayerStats;
  realBalance: number;
  withdrawLimit: number;
  logs: TransactionLog[];
  lastSavedAt?: string;
}

// In-memory token and cache handling
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

// Auth state listeners
let authStateListeners: ((user: User | null, token: string | null) => void)[] = [];

export const registerAuthListener = (callback: (user: User | null, token: string | null) => void) => {
  authStateListeners.push(callback);
  // Trigger immediately with current status
  callback(cachedUser, cachedAccessToken);
  return () => {
    authStateListeners = authStateListeners.filter(cb => cb !== callback);
  };
};

const notifyListeners = () => {
  authStateListeners.forEach(cb => cb(cachedUser, cachedAccessToken));
};

// Initialize Firebase Auth state change handler
onAuthStateChanged(auth, async (user: User | null) => {
  cachedUser = user;
  if (!user) {
    cachedAccessToken = null;
    notifyListeners();
  } else {
    // If we already have the token cached, keep it, otherwise let it fetch during login
    notifyListeners();
  }
});

// Sign-in function
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter token de acesso do Firebase Auth.');
    }
    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    notifyListeners();
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Erro de Login Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Facebook Sign-in function
export const facebookSignIn = async (): Promise<{ user: User } | null> => {
  try {
    const result = await signInWithPopup(auth, fbProvider);
    cachedUser = result.user;
    notifyListeners();
    return { user: result.user };
  } catch (error: any) {
    if (error?.code === 'auth/operation-not-allowed' || error?.message?.includes('operation-not-allowed')) {
      console.warn('Facebook Login Provider is not enabled in Firebase Console. Falling back to sandbox simulation.', error);
    } else {
      console.error('Erro de Login Facebook:', error);
    }
    throw error;
  }
};

// Sign-out function
export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedUser = null;
  notifyListeners();
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getCurrentUser = (): User | null => {
  return cachedUser;
};

// Search for the database file on Google Drive
export const findDatabaseFile = async (token: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='gamezone_database.json' and trashed=false&fields=files(id,name)`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error finding database file in Google Drive:', error);
    return null;
  }
};

// Create a new database file in Google Drive
export const createDatabaseFile = async (token: string, dbContent: GameZoneDatabase): Promise<string> => {
  try {
    // 1. Create file metadata
    const metadataResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'gamezone_database.json',
        mimeType: 'application/json',
      }),
    });

    if (!metadataResponse.ok) {
      throw new Error(`Google Drive Create Metadata Error: ${metadataResponse.statusText}`);
    }

    const fileMeta = await metadataResponse.json();
    const fileId = fileMeta.id;

    // 2. Upload file content
    await updateDatabaseFileContent(token, fileId, dbContent);

    return fileId;
  } catch (error) {
    console.error('Error creating database file in Google Drive:', error);
    throw error;
  }
};

// Update file content
export const updateDatabaseFileContent = async (
  token: string,
  fileId: string,
  dbContent: GameZoneDatabase
): Promise<void> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...dbContent,
          lastSavedAt: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Drive Upload Content Error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error updating database file content in Google Drive:', error);
    throw error;
  }
};

// Read database file content from Google Drive
export const readDatabaseFileContent = async (token: string, fileId: string): Promise<GameZoneDatabase> => {
  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Google Drive Read Content Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error reading database file content in Google Drive:', error);
    throw error;
  }
};
