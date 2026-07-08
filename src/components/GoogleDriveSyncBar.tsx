import React, { useState, useEffect, useRef } from 'react';
import { 
  registerAuthListener, 
  googleSignIn, 
  googleSignOut, 
  findDatabaseFile, 
  createDatabaseFile, 
  updateDatabaseFileContent, 
  readDatabaseFileContent, 
  GameZoneDatabase 
} from '../utils/googleDriveDb';
import { PlayerStats, TransactionLog } from '../types';
import { 
  Cloud, 
  CloudOff, 
  Database, 
  RefreshCw, 
  LogIn, 
  LogOut, 
  ArrowUp, 
  ArrowDown, 
  AlertCircle, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { AppUser } from './AuthModal';

interface GoogleDriveSyncBarProps {
  stats: PlayerStats;
  realBalance: number;
  withdrawLimit: number;
  logs: TransactionLog[];
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  setRealBalance: React.Dispatch<React.SetStateAction<number>>;
  setWithdrawLimit: React.Dispatch<React.SetStateAction<number>>;
  setLogs: React.Dispatch<React.SetStateAction<TransactionLog[]>>;
  triggerToast: (msg: string) => void;
  loggedInUser: AppUser | null;
  setLoggedInUser: (user: AppUser | null) => void;
}

export const GoogleDriveSyncBar: React.FC<GoogleDriveSyncBarProps> = ({
  stats,
  realBalance,
  withdrawLimit,
  logs,
  setStats,
  setRealBalance,
  setWithdrawLimit,
  setLogs,
  triggerToast,
  loggedInUser,
  setLoggedInUser,
}) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'searching' | 'syncing' | 'synced' | 'restoring' | 'error' | 'disconnected'>('disconnected');
  const [lastSaved, setLastSaved] = useState<string | null>(localStorage.getItem('gamezone_last_drive_sync'));
  const [hasRemoteBackup, setHasRemoteBackup] = useState<boolean>(false);
  const [remoteFileId, setRemoteFileId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ref to prevent auto-save loop when restoring remote backup
  const isRestoringRef = useRef<boolean>(false);

  // Monitor Google Authentication
  useEffect(() => {
    const unsubscribe = registerAuthListener((currentUser, currentToken) => {
      setUser(currentUser);
      setToken(currentToken);
      if (currentUser && currentToken) {
        setSyncStatus('idle');
        checkBackupOnDrive(currentToken);
        
        // Auto sign-in global app user if they connected with google
        setLoggedInUser({
          email: currentUser.email || '',
          name: currentUser.displayName || 'Usuário Google',
          avatarUrl: currentUser.photoURL || undefined,
          provider: 'google'
        });
      } else {
        setSyncStatus('disconnected');
        setHasRemoteBackup(false);
        setRemoteFileId(null);
        
        // Auto log-out global app user if Google gets disconnected and they were logged in with Google
        // We check using local storage or reference since state might be captured in closure
        const cachedUserStr = localStorage.getItem('gamezone_logged_in_user');
        if (cachedUserStr) {
          try {
            const cachedUser = JSON.parse(cachedUserStr);
            if (cachedUser && cachedUser.provider === 'google') {
              setLoggedInUser(null);
            }
          } catch (e) {}
        }
      }
    });
    return unsubscribe;
  }, [setLoggedInUser]);

  // Search for backup on drive
  const checkBackupOnDrive = async (accessToken: string) => {
    setSyncStatus('searching');
    try {
      const fileId = await findDatabaseFile(accessToken);
      if (fileId) {
        setRemoteFileId(fileId);
        setHasRemoteBackup(true);
        setSyncStatus('idle');
        // Let user know there's a backup ready to load
        triggerToast('⚡ Backup encontrado no Google Drive! Use "Carregar Nuvem" para restaurar seu progresso anterior.');
      } else {
        setHasRemoteBackup(false);
        setRemoteFileId(null);
        setSyncStatus('idle');
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setErrorMessage('Erro ao buscar arquivos no Google Drive.');
    }
  };

  // Sign In with Google Drive permissions
  const handleConnect = async () => {
    playSound.click();
    try {
      setSyncStatus('searching');
      const result = await googleSignIn();
      if (result) {
        triggerToast('✅ Google Drive conectado com sucesso como seu banco de dados!');
        playSound.victory();
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setErrorMessage('Erro na autenticação com o Google.');
      triggerToast('❌ Falha ao autenticar com o Google Drive.');
    }
  };

  // Sign Out
  const handleDisconnect = async () => {
    playSound.click();
    if (window.confirm('Deseja realmente desconectar do Google Drive? Seu progresso continuará salvo apenas localmente neste navegador.')) {
      await googleSignOut();
      triggerToast('ℹ️ Google Drive desconectado.');
    }
  };

  // Manual save backup to Google Drive (Database Write)
  const handleSaveToDrive = async () => {
    playSound.click();
    if (!token) return;

    const confirmed = window.confirm(
      'Salvar seu progresso atual? Isto atualizará o arquivo "gamezone_database.json" em seu Google Drive com suas moedas, saldo e histórico atuais.'
    );
    if (!confirmed) return;

    setSyncStatus('syncing');
    setErrorMessage(null);

    try {
      const dbContent: GameZoneDatabase = {
        stats,
        realBalance,
        withdrawLimit,
        logs,
      };

      let fileId = remoteFileId;
      if (!fileId) {
        // Search one last time or create
        fileId = await findDatabaseFile(token);
      }

      if (fileId) {
        await updateDatabaseFileContent(token, fileId, dbContent);
      } else {
        const newId = await createDatabaseFile(token, dbContent);
        setRemoteFileId(newId);
        setHasRemoteBackup(true);
      }

      const timestamp = new Date().toLocaleString('pt-BR');
      setLastSaved(timestamp);
      localStorage.setItem('gamezone_last_drive_sync', timestamp);
      setSyncStatus('synced');
      triggerToast('💾 Progresso salvo com segurança em seu Google Drive!');
      playSound.victory();
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setErrorMessage('Erro ao gravar dados no Drive.');
      triggerToast('❌ Erro ao salvar progresso no Google Drive.');
    }
  };

  // Manual load/restore backup from Google Drive (Database Read)
  const handleLoadFromDrive = async () => {
    playSound.click();
    if (!token || (!remoteFileId && !hasRemoteBackup)) {
      triggerToast('⚠️ Nenhum backup remoto localizado para carregar.');
      return;
    }

    const confirmed = window.confirm(
      '⚠️ ATENÇÃO: Carregar o backup irá SUBSTITUIR o progresso atual do seu navegador por completo. Deseja prosseguir com a restauração de dados?'
    );
    if (!confirmed) return;

    setSyncStatus('restoring');
    setErrorMessage(null);
    isRestoringRef.current = true;

    try {
      let fileId = remoteFileId;
      if (!fileId) {
        fileId = await findDatabaseFile(token);
      }

      if (!fileId) {
        throw new Error('Arquivo de backup não encontrado no Drive.');
      }

      const remoteDb = await readDatabaseFileContent(token, fileId);
      
      // Update local React States
      if (remoteDb.stats) setStats(remoteDb.stats);
      if (remoteDb.realBalance !== undefined) setRealBalance(remoteDb.realBalance);
      if (remoteDb.withdrawLimit !== undefined) setWithdrawLimit(remoteDb.withdrawLimit);
      if (remoteDb.logs) setLogs(remoteDb.logs);

      // Save to localStorage as immediately updated cache
      localStorage.setItem('gamezone_player_stats', JSON.stringify(remoteDb.stats));
      localStorage.setItem('gamezone_real_balance', remoteDb.realBalance.toFixed(2));
      localStorage.setItem('gamezone_withdraw_limit', remoteDb.withdrawLimit.toFixed(2));
      localStorage.setItem('gamezone_transaction_logs', JSON.stringify(remoteDb.logs));

      const timestamp = new Date().toLocaleString('pt-BR');
      setLastSaved(timestamp);
      localStorage.setItem('gamezone_last_drive_sync', timestamp);

      setSyncStatus('synced');
      triggerToast('🎉 Backup restaurado com sucesso do seu Google Drive!');
      playSound.jackpot();
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setErrorMessage('Erro ao ler dados do Drive.');
      triggerToast('❌ Erro ao ler backup do Google Drive.');
    } finally {
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 500);
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-3 relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Info Area */}
        <div className="flex items-center gap-3 text-left">
          <div className={`p-2.5 rounded-xl ${user ? 'bg-indigo-950/60 border border-indigo-500/20' : 'bg-slate-950/60 border border-slate-800'} shadow-inner`}>
            {user ? (
              <Cloud className="w-5 h-5 text-indigo-400 animate-pulse" />
            ) : (
              <CloudOff className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-slate-200 uppercase tracking-wide flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                Banco de Dados em Nuvem (Google Drive)
              </h4>
              <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold border ${
                syncStatus === 'disconnected' ? 'bg-slate-950 text-slate-400 border-slate-800' :
                syncStatus === 'searching' ? 'bg-amber-950/30 text-amber-400 border-amber-800/35 animate-pulse' :
                syncStatus === 'syncing' || syncStatus === 'restoring' ? 'bg-indigo-950/30 text-indigo-400 border-indigo-800/35 animate-spin' :
                syncStatus === 'synced' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/35' :
                syncStatus === 'error' ? 'bg-red-950/30 text-red-400 border-red-800/35' :
                'bg-blue-950/30 text-blue-400 border-blue-800/35'
              }`}>
                {syncStatus === 'disconnected' && 'Inativo'}
                {syncStatus === 'searching' && 'Pesquisando...'}
                {syncStatus === 'syncing' && 'Sincronizando...'}
                {syncStatus === 'restoring' && 'Restaurando...'}
                {syncStatus === 'synced' && 'Sincronizado'}
                {syncStatus === 'error' && 'Erro'}
                {syncStatus === 'idle' && 'Conectado'}
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 mt-0.5">
              {user ? (
                <>
                  Conectado como <strong className="text-slate-300 font-sans select-all font-semibold">{user.email}</strong>
                  {lastSaved && <span className="text-[10px] text-slate-500"> • Último backup: {lastSaved}</span>}
                </>
              ) : (
                'Salve moedas, vidas, histórico e saldo na sua própria conta do Google de forma 100% segura.'
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons Area */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {user ? (
            <>
              {hasRemoteBackup && (
                <button
                  onClick={handleLoadFromDrive}
                  disabled={syncStatus === 'restoring' || syncStatus === 'syncing'}
                  className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-slate-800 rounded-lg text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50"
                  title="Restaurar o estado do Google Drive para o navegador"
                >
                  <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                  Carregar Nuvem
                </button>
              )}

              <button
                onClick={handleSaveToDrive}
                disabled={syncStatus === 'restoring' || syncStatus === 'syncing'}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-indigo-500/20 rounded-lg text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-indigo-600/10"
                title="Gravar progresso atual no Google Drive"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                Salvar Nuvem
              </button>

              <button
                onClick={handleDisconnect}
                className="p-1.5 bg-slate-850 hover:bg-red-950/20 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/25 rounded-lg cursor-pointer transition-colors"
                title="Desconectar conta Google"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              disabled={syncStatus === 'searching'}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-black cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/15 uppercase"
            >
              <LogIn className="w-3.5 h-3.5" />
              Conectar Google Drive
            </button>
          )}
        </div>

      </div>

      {/* Error Banner inside sync bar if error occurs */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] flex gap-2 items-center justify-center animate-shake">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
          <button 
            onClick={() => {
              if (token) checkBackupOnDrive(token);
              else setErrorMessage(null);
            }} 
            className="underline hover:text-red-200 cursor-pointer ml-1 font-semibold"
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
};
