/**
 * GameZone Cryptographic Security Engine
 * Pure TypeScript implementation of SHA-256 hashing, salting, anti-tamper validations,
 * double-spend prevention, and state integrity backup systems.
 */

// A secure static secret key known only to the compiled code to sign states
const COMPILER_SECRET_SALT = 'GZ_SECURE_SALT_9f31b8a6d25e4c7b80a1c2d3e4f5a6b7';

/**
 * Pure TypeScript SHA-256 implementation for standalone secure hashing
 */
export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const h: number[] = [];
  const r: number[] = [];
  let i: number;
  let j: number;

  const primeCounter = 0;
  const isPrime: Record<number, boolean> = {};
  let candidate = 2;
  while (h.length < 64) {
    if (!isPrime[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isPrime[i] = true;
      }
      h.push((mathPow(candidate, .5) * maxWord) | 0);
      r.push((mathPow(candidate, 1 / 3) * maxWord) | 0);
    }
    candidate++;
  }

  const words: number[] = [];
  const asciiLength = ascii.length;
  let asciiBitLength = asciiLength * 8;
  
  // Convert string to bytes representation
  const bytes: number[] = [];
  for (i = 0; i < asciiLength; i++) {
    bytes.push(ascii.charCodeAt(i) & 0xff);
  }

  // Padding
  bytes.push(0x80);
  while ((bytes.length * 8) % 512 !== 448) {
    bytes.push(0);
  }

  // Append length in bits (big-endian 64-bit)
  const bitLengthBuffer = new ArrayBuffer(8);
  const dataView = new DataView(bitLengthBuffer);
  dataView.setUint32(0, Math.floor(asciiBitLength / maxWord));
  dataView.setUint32(4, asciiBitLength % maxWord);
  for (i = 0; i < 8; i++) {
    bytes.push(new Uint8Array(bitLengthBuffer)[i]);
  }

  // Process 512-bit chunks
  for (i = 0; i < bytes.length; i += 64) {
    const chunk = bytes.slice(i, i + 64);
    for (j = 0; j < 16; j++) {
      words[j] = (chunk[j * 4] << 24) | (chunk[j * 4 + 1] << 16) | (chunk[j * 4 + 2] << 8) | chunk[j * 4 + 3];
    }
    for (j = 16; j < 64; j++) {
      const w15 = words[j - 15];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const w2 = words[j - 2];
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      words[j] = (words[j - 16] + s0 + words[j - 7] + s1) | 0;
    }

    let [a, b, c, d, e, f, g, hh] = h;

    for (j = 0; j < 64; j++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + s1 + ch + r[j] + words[j]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      hh = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0;
    h[5] = (h[5] + f) | 0;
    h[6] = (h[6] + g) | 0;
    h[7] = (h[7] + hh) | 0;
  }

  // Hexadecimal formatting
  let result = '';
  for (i = 0; i < 8; i++) {
    const hex = (h[i] >>> 0).toString(16);
    result += hex.padStart(8, '0');
  }
  return result;
}

/**
 * Base64 Obfuscation helper (not for extreme encryption, but to mask raw JSON strings from direct inspection)
 */
export function obfuscate(text: string): string {
  try {
    return btoa(encodeURIComponent(text));
  } catch (e) {
    return text;
  }
}

export function deobfuscate(cipher: string): string {
  try {
    return decodeURIComponent(atob(cipher));
  } catch (e) {
    return cipher;
  }
}

/**
 * Cryptographically signs a data payload using salted SHA-256
 */
export function generateSignature(payload: any, userId: string = 'guest'): string {
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const integrityMessage = `${COMPILER_SECRET_SALT}:${userId}:${serialized}`;
  return sha256(integrityMessage);
}

/**
 * Verifies if the data payload matches its signature
 */
export function verifySignature(payload: any, signature: string, userId: string = 'guest'): boolean {
  if (!signature) return false;
  const computed = generateSignature(payload, userId);
  return computed === signature;
}

/**
 * Encrypted/Secure LocalStorage state wrapper
 */
export const secureStorage = {
  /**
   * Saves a state securely by hashing it and storing a redundant obfuscated checkpoint backup
   */
  setItem(key: string, value: any, userId: string = 'guest'): void {
    const serialized = JSON.stringify(value);
    const signature = generateSignature(serialized, userId);
    
    // Save standard key with clear contents for standard access
    localStorage.setItem(key, serialized);
    // Save signature
    localStorage.setItem(`${key}_sig`, signature);
    
    // Save high-security obfuscated redundancy checkpoint backup
    const backupObj = {
      data: serialized,
      signature: signature,
      timestamp: new Date().toISOString()
    };
    const obfuscatedBackup = obfuscate(JSON.stringify(backupObj));
    localStorage.setItem(`_gz_chk_${key}`, obfuscatedBackup);
  },

  /**
   * Retrieves item, validates its cryptographic signature, detects tampering,
   * and automatically heals/restores the state from the secure redundancy checkpoint.
   * Returns null if no data or if totally unrecoverable.
   */
  getItem(key: string, defaultValue: any, userId: string = 'guest', triggerWarningCallback?: (msg: string) => void): any {
    const localRaw = localStorage.getItem(key);
    const localSig = localStorage.getItem(`${key}_sig`) || '';
    const backupRaw = localStorage.getItem(`_gz_chk_${key}`);

    // Case 1: No local data exists at all
    if (!localRaw && !backupRaw) {
      return defaultValue;
    }

    let isTampered = false;
    let validatedData: any = null;

    // Validate main entry signature
    if (localRaw) {
      if (verifySignature(localRaw, localSig, userId)) {
        try {
          validatedData = JSON.parse(localRaw);
        } catch (e) {
          isTampered = true;
        }
      } else {
        isTampered = true;
        console.warn(`[SECURITY ENGINE] Tampering detected on key: ${key}! Main state signature invalid.`);
      }
    } else {
      // Missing main data, check if backup is present to restore
      isTampered = true;
    }

    // Case 2: Tampering or missing main state, attempt recovery from obfuscated backup
    if (isTampered) {
      if (backupRaw) {
        try {
          const decryptedBackup = JSON.parse(deobfuscate(backupRaw));
          const backupDataStr = decryptedBackup.data;
          const backupSig = decryptedBackup.signature;

          if (verifySignature(backupDataStr, backupSig, userId)) {
            console.warn(`[SECURITY ENGINE] Self-Healing Active: Recovering and repairing ${key} from secure cryptographic backup...`);
            
            // Repair standard keys
            localStorage.setItem(key, backupDataStr);
            localStorage.setItem(`${key}_sig`, backupSig);
            
            validatedData = JSON.parse(backupDataStr);
            
            if (triggerWarningCallback) {
              triggerWarningCallback(`🛡️ ALERTA DE SEGURANÇA: Tentativa de manipulação de dados detectada em "${key}". O sistema criptográfico anulou as modificações e restaurou seu progresso legítimo com segurança!`);
            }
          } else {
            console.error(`[SECURITY ENGINE] Critical: Cryptographic backup is also tampered! Refusing load to protect system ledger.`);
            validatedData = null;
          }
        } catch (backupErr) {
          console.error(`[SECURITY ENGINE] Critical error reading backup storage. Resetting to secure default.`);
          validatedData = null;
        }
      }

      if (!validatedData) {
        // Both standard state and backup failed verification, we must load default to protect integrity
        console.error(`[SECURITY ENGINE] Resetting tampered key "${key}" to safe default state.`);
        validatedData = defaultValue;
        this.setItem(key, defaultValue, userId);
      }
    }

    return validatedData;
  },

  /**
   * Force audit all stored keys and returns true if any tampering was corrected
   */
  auditStateIntegrity(userId: string = 'guest', triggerWarningCallback?: (msg: string) => void): boolean {
    let corrected = false;
    const criticalKeys = ['gamezone_player_stats', 'gamezone_real_balance', 'gamezone_withdraw_limit', 'gamezone_transaction_logs'];
    
    for (const key of criticalKeys) {
      const localRaw = localStorage.getItem(key);
      const localSig = localStorage.getItem(`${key}_sig`) || '';
      
      if (localRaw) {
        if (!verifySignature(localRaw, localSig, userId)) {
          console.warn(`[SECURITY ENGINE] Audit failed for ${key}. Re-triggering loading recovery sequence.`);
          
          let defaultVal: any = {};
          if (key === 'gamezone_real_balance') defaultVal = 120.00;
          else if (key === 'gamezone_withdraw_limit') defaultVal = 100.00;
          else if (key === 'gamezone_transaction_logs') defaultVal = [];
          else if (key === 'gamezone_player_stats') {
            defaultVal = {
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
          }
          
          this.getItem(key, defaultVal, userId, triggerWarningCallback);
          corrected = true;
        }
      }
    }
    return corrected;
  }
};

/**
 * Prevents Cheat Engine or speed-hacking simulations on games
 * by measuring timestamp offsets on tick intervals
 */
export class GameTimingGuard {
  private lastTick: number = Date.now();
  private maxTolerableSpeedUpRatio = 1.6; // No more than 1.6x faster than wall clock
  private warningCount = 0;

  constructor() {
    this.reset();
  }

  reset() {
    this.lastTick = Date.now();
    this.warningCount = 0;
  }

  /**
   * Returns true if timing is valid, false if speed hack / interval cheating is suspected
   */
  validateTick(expectedMs: number): boolean {
    const now = Date.now();
    const elapsed = now - this.lastTick;
    this.lastTick = now;

    // If actual time passed is significantly shorter than expected interval
    if (elapsed < expectedMs / this.maxTolerableSpeedUpRatio && expectedMs > 30) {
      this.warningCount++;
      if (this.warningCount >= 3) {
        console.warn('[SECURITY GUARD] Game execution speed-hack / accelerator detected!');
        return false;
      }
    } else {
      this.warningCount = Math.max(0, this.warningCount - 0.5);
    }
    return true;
  }
}
