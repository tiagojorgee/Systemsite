import React, { useState, useEffect, useRef } from 'react';
import { ReplayBlob, StreamClipData } from './types';
import { 
  Play, 
  Pause, 
  Clock, 
  HardDrive, 
  Share2, 
  Star, 
  Users, 
  BarChart2, 
  Trash2, 
  Download, 
  CheckCircle2, 
  Copy, 
  Plus, 
  History, 
  FolderHeart, 
  ListMusic, 
  TrendingUp,
  Flame,
  MessageSquare,
  Eye,
  Sliders,
  Calendar,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Heart
} from 'lucide-react';
import { playSound } from '../../utils/audio';

interface ReplayStudioProps {
  replays: ReplayBlob[];
  setReplays: React.Dispatch<React.SetStateAction<ReplayBlob[]>>;
  clips: StreamClipData[];
  setClips: React.Dispatch<React.SetStateAction<StreamClipData[]>>;
  addNotification: (title: string, desc: string, type?: 'success' | 'info' | 'alert') => void;
}

export const ReplayStudio: React.FC<ReplayStudioProps> = ({
  replays,
  setReplays,
  clips,
  setClips,
  addNotification
}) => {
  // Navigation: 'list' | 'player'
  const [viewMode, setViewMode] = useState<'list' | 'player'>('list');
  const [selectedRep, setSelectedRep] = useState<ReplayBlob | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'playlists' | 'history'>('all');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);

  // Playlists State (Backed up in localStorage)
  const [playlists, setPlaylists] = useState<string[]>(() => {
    const cached = localStorage.getItem('gamezone_replay_playlists');
    return cached ? JSON.parse(cached) : ['Campeonatos Retro', 'Nave Espacial Pro Runs', 'Speedruns Perfeitos'];
  });
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showAddToPlaylist, setShowAddToPlaylist] = useState<string | null>(null);

  // Watch History State (Backed up in localStorage)
  const [watchHistory, setWatchHistory] = useState<string[]>(() => {
    const cached = localStorage.getItem('gamezone_replay_watch_history');
    return cached ? JSON.parse(cached) : ['rep-1'];
  });

  // Replay Player playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressSec, setProgressSec] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedResumeTime, setSavedResumeTime] = useState<number>(0);
  const [customMarkerText, setCustomMarkerText] = useState('');

  // Floating reactions in Replay Player
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; type: string; x: number; y: number }[]>([]);

  // Simulation of Download state
  const [downloadingRepId, setDownloadingRepId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Sharing state
  const [sharingRep, setSharingRep] = useState<ReplayBlob | null>(null);

  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // --- LOCAL PERSISTENCE BACKUPS ---
  useEffect(() => {
    localStorage.setItem('gamezone_replay_playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem('gamezone_replay_watch_history', JSON.stringify(watchHistory));
  }, [watchHistory]);

  // --- PLAYBACK ENGINE ---
  useEffect(() => {
    if (isPlaying && selectedRep) {
      playbackTimerRef.current = setInterval(() => {
        setProgressSec(prev => {
          const nextVal = prev + 1 * playbackSpeed;
          if (nextVal >= selectedRep.durationSec) {
            setIsPlaying(false);
            if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
            return selectedRep.durationSec;
          }
          
          // Save watch progress to localStorage in real-time
          localStorage.setItem(`gamezone_replay_progress_${selectedRep.id}`, Math.floor(nextVal).toString());
          
          // Periodically spawn floating reactions based on timestamps or random
          if (Math.random() > 0.85) {
            triggerFloatingReaction();
          }

          return nextVal;
        });
      }, 1000);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    }

    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying, selectedRep, playbackSpeed]);

  // Auto scroll chat to bottom when progress updates
  useEffect(() => {
    if (viewMode === 'player' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [progressSec, viewMode]);

  // --- FLOATING REACTION HELPER ---
  const triggerFloatingReaction = () => {
    const emojis = ['🔥', '😮', '👍', '❤️', '👑', '🚀', '⭐'];
    const type = emojis[Math.floor(Math.random() * emojis.length)];
    const id = `react-replay-${Date.now()}-${Math.random()}`;
    const x = 20 + Math.random() * 60; // percentage
    const y = 80;
    setFloatingReactions(prev => [...prev, { id, type, x, y }]);
    setTimeout(() => {
      setFloatingReactions(curr => curr.filter(r => r.id !== id));
    }, 1500);
  };

  // --- OPEN REPLAY PLAYER ---
  const handleOpenReplay = (rep: ReplayBlob) => {
    playSound.click();
    setSelectedRep(rep);
    setViewMode('player');
    setProgressSec(0);
    setIsPlaying(false);
    setPlaybackSpeed(1);

    // Save to Watch History if not already the first element
    setWatchHistory(prev => {
      const filtered = prev.filter(id => id !== rep.id);
      return [rep.id, ...filtered];
    });

    // Check for saved continuable watch position
    const cachedProgress = localStorage.getItem(`gamezone_replay_progress_${rep.id}`);
    if (cachedProgress) {
      const parsedTime = parseInt(cachedProgress, 10);
      if (parsedTime > 5 && parsedTime < rep.durationSec - 5) {
        setSavedResumeTime(parsedTime);
        setShowResumePrompt(true);
      }
    }
  };

  const handleResumeConfirm = (resume: boolean) => {
    playSound.click();
    setShowResumePrompt(false);
    if (resume && selectedRep) {
      setProgressSec(savedResumeTime);
      setIsPlaying(true);
      addNotification(
        'Reprodução Retomada!',
        `Continuando a assistir do minuto ${formatTime(savedResumeTime)}.`,
        'success'
      );
    }
  };

  // --- FORMAT TIMER UTILITY ---
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- MANAGE PLAYLISTS ---
  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    playSound.click();
    const name = newPlaylistName.trim();
    if (playlists.includes(name)) {
      addNotification('Playlist já existe', 'Escolha um nome diferente para a sua playlist.', 'alert');
      return;
    }
    setPlaylists(prev => [...prev, name]);
    setNewPlaylistName('');
    addNotification('Playlist Criada! 📁', `A playlist "${name}" foi adicionada com sucesso.`, 'success');
  };

  const toggleReplayInPlaylist = (repId: string, playlistName: string) => {
    playSound.click();
    setReplays(curr => curr.map(rep => {
      if (rep.id === repId) {
        const currentPlaylists = rep.playlists || [];
        const exists = currentPlaylists.includes(playlistName);
        const updated = exists 
          ? currentPlaylists.filter(p => p !== playlistName)
          : [...currentPlaylists, playlistName];
        
        addNotification(
          exists ? 'Removido da Playlist 📂' : 'Adicionado à Playlist 📂',
          exists 
            ? `Gravação removida de "${playlistName}".`
            : `Gravação adicionada à playlist "${playlistName}" com sucesso.`,
          'info'
        );

        return { ...rep, playlists: updated };
      }
      return rep;
    }));
  };

  // --- TOGGLE FAVORITE ---
  const handleToggleFavorite = (repId: string) => {
    playSound.collect();
    setReplays(curr => curr.map(rep => {
      if (rep.id === repId) {
        const nextFav = !rep.isFavorite;
        addNotification(
          nextFav ? 'Adicionado aos Favoritos! ⭐' : 'Removido dos Favoritos',
          nextFav ? 'Você pode filtrar esta gravação facilmente no painel.' : 'A gravação foi desmarcada como favorita.',
          nextFav ? 'success' : 'info'
        );
        return { ...rep, isFavorite: nextFav };
      }
      return rep;
    }));
    // Sync current selected if watching
    if (selectedRep && selectedRep.id === repId) {
      setSelectedRep(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  // --- DOWNLOAD SIMULATOR ---
  const triggerDownload = (rep: ReplayBlob) => {
    playSound.click();
    setDownloadingRepId(rep.id);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloadingRepId(null);
          playSound.victory();
          addNotification(
            'Download Concluído! 💾',
            `O arquivo MP4 completo (${rep.sizeMb}MB, resolução ${rep.resolution.split(' ')[0]}) foi gravado no seu dispositivo.`,
            'success'
          );
          
          // Trigger browser mock file download
          const element = document.createElement("a");
          const file = new Blob([`Simulated stream replay data for ID ${rep.id}`], {type: 'text/plain'});
          element.href = URL.createObjectURL(file);
          element.download = `replay_${rep.gameId}_${rep.id}.mp4`;
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // --- ADD MANUAL TIMELINE MARKER ---
  const handleAddMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMarkerText.trim() || !selectedRep) return;
    playSound.click();

    const note = customMarkerText.trim();
    const newMarker = {
      timeSec: Math.floor(progressSec),
      note
    };

    setReplays(curr => curr.map(rep => {
      if (rep.id === selectedRep.id) {
        const markers = rep.markers || [];
        return { ...rep, markers: [...markers, newMarker].sort((a,b) => a.timeSec - b.timeSec) };
      }
      return rep;
    }));

    setSelectedRep(curr => {
      if (!curr) return null;
      const markers = curr.markers || [];
      return { ...curr, markers: [...markers, newMarker].sort((a,b) => a.timeSec - b.timeSec) };
    });

    setCustomMarkerText('');
    addNotification(
      'Marcador Adicionado! 📍',
      `Nota "${note}" inserida no segundo ${formatTime(progressSec)}.`,
      'success'
    );
  };

  // --- COPY SHARE REPLAY LINK ---
  const handleShareReplay = (rep: ReplayBlob) => {
    playSound.click();
    setSharingRep(rep);
    navigator.clipboard?.writeText(`https://gamezon.live/replay/${rep.id}`);
  };

  const handleCopyLinkSuccess = () => {
    playSound.click();
    addNotification('Link Copiado! 🔗', 'O link para reprodução direta deste replay foi copiado.', 'success');
    setSharingRep(null);
  };

  // --- DELETE REPLAY ---
  const handleDeleteReplay = (id: string) => {
    playSound.gameover();
    setReplays(prev => prev.filter(r => r.id !== id));
    addNotification('Gravação Deletada 🗑️', 'O replay foi removido permanentemente dos servidores.', 'alert');
    if (selectedRep && selectedRep.id === id) {
      setViewMode('list');
      setSelectedRep(null);
    }
  };

  // --- FILTERED REPLAYS LIST ---
  const filteredReplays = replays.filter(rep => {
    // Search filter
    const matchesSearch = rep.gameId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (rep.title && rep.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          rep.players.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Tabs Filter
    if (activeTab === 'all') {
      return selectedPlaylist ? (rep.playlists && rep.playlists.includes(selectedPlaylist)) : true;
    }
    if (activeTab === 'favorites') return rep.isFavorite;
    if (activeTab === 'history') return watchHistory.includes(rep.id);

    return true;
  });

  // Sort watch history appropriately
  const sortedFilteredReplays = activeTab === 'history'
    ? [...filteredReplays].sort((a, b) => watchHistory.indexOf(a.id) - watchHistory.indexOf(b.id))
    : filteredReplays;

  // Active sync comments for chat box
  const activeChatLogs = selectedRep?.chatLogs || [];
  const currentChatVisible = activeChatLogs.filter(msg => msg.timeSec <= progressSec);

  return (
    <div className="space-y-6">

      {/* REPLAY SHARING MODAL */}
      {sharingRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-850 p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-150 dark:border-slate-800">
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white">
                Compartilhar Gravação
              </h3>
              <button 
                onClick={() => setSharingRep(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Compartilhe o replay de <strong className="text-indigo-500">{sharingRep.title || 'Live Gravada'}</strong> com a comunidade ou redes externas.
            </p>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 font-mono text-xs text-slate-600 dark:text-slate-300">
              <span className="truncate">https://gamezon.live/replay/{sharingRep.id}</span>
              <button
                onClick={handleCopyLinkSuccess}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 cursor-pointer shrink-0"
                title="Copiar Link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <button onClick={handleCopyLinkSuccess} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase cursor-pointer">
                WhatsApp
              </button>
              <button onClick={handleCopyLinkSuccess} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase cursor-pointer">
                Twitter/X
              </button>
              <button onClick={handleCopyLinkSuccess} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase cursor-pointer">
                Discord
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LIST VIEW --- */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Playlists & Left Sidebar Filters */}
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4.5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-150 dark:border-slate-800">
                <FolderHeart className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider font-sans">Navegação e Playlists</span>
              </div>

              {/* Main Quick Filters */}
              <div className="space-y-1">
                <button
                  onClick={() => { playSound.click(); setActiveTab('all'); setSelectedPlaylist(null); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    activeTab === 'all' && !selectedPlaylist
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4" /> Todas as Gravações
                  </span>
                  <span className="text-[10px] font-mono opacity-60 bg-slate-200/50 dark:bg-slate-900 px-1.5 py-0.5 rounded-md">{replays.length}</span>
                </button>

                <button
                  onClick={() => { playSound.click(); setActiveTab('favorites'); setSelectedPlaylist(null); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    activeTab === 'favorites'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-current" /> Favoritos
                  </span>
                  <span className="text-[10px] font-mono opacity-60 bg-slate-200/50 dark:bg-slate-900 px-1.5 py-0.5 rounded-md">
                    {replays.filter(r => r.isFavorite).length}
                  </span>
                </button>

                <button
                  onClick={() => { playSound.click(); setActiveTab('history'); setSelectedPlaylist(null); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    activeTab === 'history'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-500" /> Histórico de Assistidos
                  </span>
                  <span className="text-[10px] font-mono opacity-60 bg-slate-200/50 dark:bg-slate-900 px-1.5 py-0.5 rounded-md">{watchHistory.length}</span>
                </button>
              </div>

              {/* Dynamic Playlists lists */}
              <div className="pt-2 border-t border-slate-150 dark:border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Minhas Playlists</span>
                
                <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                  {playlists.map(pl => (
                    <button
                      key={pl}
                      onClick={() => { playSound.click(); setActiveTab('all'); setSelectedPlaylist(pl); }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center justify-between truncate uppercase ${
                        selectedPlaylist === pl
                          ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 font-black border-l-2 border-purple-500 pl-2'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <ListMusic className="w-3.5 h-3.5 shrink-0" /> {pl}
                      </span>
                      <span className="text-[9px] font-mono opacity-60">
                        {replays.filter(r => r.playlists && r.playlists.includes(pl)).length}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Create Playlist Form */}
                <form onSubmit={handleCreatePlaylist} className="flex gap-1.5 pt-2">
                  <input
                    type="text"
                    placeholder="Nova playlist..."
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                  <button type="submit" className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 cursor-pointer flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Central content: Replays Grid */}
          <div className="lg:col-span-9 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-indigo-500" />
                  {selectedPlaylist ? `Playlist: ${selectedPlaylist}` : activeTab === 'favorites' ? 'Gravações Favoritadas' : activeTab === 'history' ? 'Histórico de Visualização' : 'Estúdio de Replays & Gravações'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Todas as transmissões geram automaticamente replays completos, clipes, melhores momentos, miniaturas e timelines estruturadas.
                </p>
              </div>

              {/* Search bar */}
              <input
                type="text"
                placeholder="Buscar por jogo, título ou piloto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 min-w-[200px]"
              />
            </div>

            {/* Grid of replays */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {sortedFilteredReplays.map(rep => {
                const isDownloading = downloadingRepId === rep.id;
                const isFav = rep.isFavorite;

                return (
                  <div
                    key={rep.id}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between group hover:border-indigo-400 dark:hover:border-indigo-800 transition-all duration-300"
                  >
                    {/* Replay Card Header Wallpaper / Thumbnail Representation */}
                    <div className={`h-28 bg-gradient-to-tr ${rep.thumbnail || 'from-indigo-700 to-purple-800'} p-4.5 flex flex-col justify-between text-white relative`}>
                      <div className="absolute inset-0 bg-slate-950/25 opacity-40 group-hover:opacity-10" />
                      
                      <div className="z-10 flex items-center justify-between">
                        <span className="text-[9px] font-mono font-black bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest text-indigo-300">
                          {rep.gameId.replace(/-/g, ' ')}
                        </span>

                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleFavorite(rep.id); }}
                            className="p-1 rounded bg-slate-900/80 backdrop-blur-sm border border-white/5 hover:scale-105 transition-transform text-amber-400 cursor-pointer"
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <div className="z-10">
                        <h4 className="text-xs font-black uppercase tracking-tight line-clamp-2 leading-tight drop-shadow-sm text-slate-50">
                          {rep.title || `${rep.gameId.replace(/-/g, ' ').toUpperCase()} STREAM REPLAY`}
                        </h4>
                      </div>

                      {/* Floating duration timer badges */}
                      <span className="absolute bottom-2.5 right-2.5 bg-slate-900/90 backdrop-blur-sm text-[9px] font-mono font-black px-2 py-0.5 rounded text-slate-100 border border-white/5 shadow">
                        {formatTime(rep.durationSec)}
                      </span>
                    </div>

                    {/* Card stats and metadata */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-white dark:bg-slate-950">
                      
                      {/* Grid metrics list */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 font-bold uppercase pb-3.5 border-b border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>PICO: {rep.peakViewers?.toLocaleString() || '1.1k'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>LIKES: {rep.likes || '450'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>CHAT: {rep.chatLogs?.length || '250'} msg</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>ENGAJ: 98%</span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1.5 flex-1 flex flex-col justify-end">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-bold">Pilotos: {rep.players.join(', ')}</span>
                          <span className="font-mono text-[10px]">{rep.sizeMb} MB</span>
                        </div>

                        {/* Playlist pills list */}
                        {rep.playlists && rep.playlists.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {rep.playlists.map(p => (
                              <span key={p} className="text-[8px] font-black uppercase bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded border border-purple-150/40">
                                {p}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action buttons bar */}
                        <div className="flex gap-1.5 pt-2">
                          <button
                            onClick={() => handleOpenReplay(rep)}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer flex items-center justify-center gap-1 transition-all"
                          >
                            <Play className="w-3 h-3 fill-current" /> Assistir Replay
                          </button>

                          <button
                            onClick={() => triggerDownload(rep)}
                            disabled={isDownloading}
                            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center shrink-0"
                            title="Download MP4 Completo"
                          >
                            {isDownloading ? (
                              <span className="text-[8px] font-black">{downloadProgress}%</span>
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleShareReplay(rep)}
                            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer flex items-center justify-center shrink-0"
                            title="Compartilhar Link"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Playlist manager dropdown toggle */}
                          <div className="relative">
                            <button
                              onClick={() => setShowAddToPlaylist(showAddToPlaylist === rep.id ? null : rep.id)}
                              className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer flex items-center justify-center"
                              title="Adicionar à Playlist"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            {showAddToPlaylist === rep.id && (
                              <div className="absolute bottom-full right-0 mb-2 z-30 w-44 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-2 rounded-xl shadow-xl space-y-1.5 animate-slideUp">
                                <span className="text-[8px] font-black text-slate-400 block uppercase p-1">Playlists</span>
                                {playlists.map(pl => {
                                  const belongs = rep.playlists && rep.playlists.includes(pl);
                                  return (
                                    <button
                                      key={pl}
                                      onClick={() => toggleReplayInPlaylist(rep.id, pl)}
                                      className={`w-full text-left px-2 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-between ${
                                        belongs ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600' : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900'
                                      }`}
                                    >
                                      {pl} {belongs && '✓'}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteReplay(rep.id)}
                            className="p-2 hover:bg-red-50 hover:text-red-500 border border-transparent hover:border-red-100 rounded-xl cursor-pointer text-slate-400 transition-colors shrink-0"
                            title="Deletar Gravação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}

              {sortedFilteredReplays.length === 0 && (
                <div className="col-span-full text-center py-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl">
                  <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-2 animate-bounce" />
                  <span className="text-xs text-slate-400 uppercase font-black tracking-widest block">Nenhuma gravação encontrada</span>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Experimente alterar o filtro ou iniciar uma nova live. O sistema de gravação automática salvará tudo!
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* --- REPLAY PLAYER MODE --- */}
      {viewMode === 'player' && selectedRep && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          
          {/* Main area: Video Player simulation and Details */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Header metadata bar */}
            <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl flex items-center justify-between gap-4">
              <button
                onClick={() => { playSound.click(); setViewMode('list'); setSelectedRep(null); }}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase text-slate-600 dark:text-slate-300 cursor-pointer flex items-center gap-1.5"
              >
                ← Voltar
              </button>

              <div className="text-center min-w-0">
                <h2 className="text-xs font-black uppercase tracking-widest text-indigo-500 block">REPLAY MULTIMÍDIA ATIVO</h2>
                <h1 className="text-xs sm:text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white truncate">
                  {selectedRep.title || 'Live Gravada'}
                </h1>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => handleToggleFavorite(selectedRep.id)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    selectedRep.isFavorite
                      ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md'
                      : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-amber-500'
                  }`}
                  title="Favoritar Gravação"
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>

                <button
                  onClick={() => handleShareReplay(selectedRep)}
                  className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer"
                  title="Compartilhar Link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Simulated Replay Video Frame */}
            <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-slate-850 shadow-2xl flex flex-col justify-between p-5 text-white group">
              
              {/* Floating reactions animation layer */}
              <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                {floatingReactions.map(rect => (
                  <div 
                    key={rect.id}
                    className="absolute text-3xl animate-floatUp select-none opacity-0"
                    style={{ 
                      left: `${rect.x}%`, 
                      bottom: '20px',
                      animation: 'floatUp 1.5s ease-out forwards'
                    }}
                  >
                    {rect.type}
                  </div>
                ))}
              </div>

              {/* Progress Resuming Prompt Overlay */}
              {showResumePrompt && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-full flex items-center justify-center animate-bounce">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h3 className="text-sm font-black uppercase tracking-wider">Continuar assistindo?</h3>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Identificamos que você parou de assistir anteriormente em <strong className="text-indigo-400 font-mono font-black">{formatTime(savedResumeTime)}</strong>. Deseja retomar deste ponto?
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResumeConfirm(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-black uppercase cursor-pointer text-white shadow"
                    >
                      Sim, Retomar ✓
                    </button>
                    <button
                      onClick={() => handleResumeConfirm(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-[10px] font-bold uppercase cursor-pointer"
                    >
                      Não, Recomeçar
                    </button>
                  </div>
                </div>
              )}

              {/* Video top controls bar overlay */}
              <div className="z-10 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="bg-indigo-600/95 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black tracking-widest text-slate-50 uppercase">
                  REPRODUZINDO REPLAY GRAVADO ({playbackSpeed}x)
                </span>

                <span className="bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full text-[9px] font-mono text-slate-300 border border-white/5 uppercase">
                  Pico Espectadores: {selectedRep.peakViewers?.toLocaleString() || '1,100'}
                </span>
              </div>

              {/* Central screen visualization (procedural visual graphics representing the game play) */}
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center pointer-events-none select-none z-0">
                <div className="absolute inset-0 opacity-15 overflow-hidden flex items-center justify-center">
                  <div className="w-full h-full bg-grid-pattern animate-pulse" />
                </div>

                <div className="space-y-4">
                  {isPlaying ? (
                    <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center animate-ping mx-auto">
                      <Play className="w-8 h-8 text-indigo-400 fill-current" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto">
                      <Pause className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-black text-indigo-400 uppercase tracking-widest bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-900">
                      TELA SIMULADA: {selectedRep.gameId.toUpperCase()}
                    </span>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed uppercase font-mono mt-1">
                      Tempo Decorrido: {formatTime(progressSec)} / {formatTime(selectedRep.durationSec)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom timeline controls block */}
              <div className="z-10 bg-slate-950/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/5 space-y-2.5">
                
                {/* Timeline chapters and event dots representation overlay */}
                <div className="relative h-2 group/timeline">
                  {/* Timeline Scrubber background */}
                  <input
                    type="range"
                    min="0"
                    max={selectedRep.durationSec}
                    value={progressSec}
                    onChange={(e) => { playSound.click(); setProgressSec(parseInt(e.target.value)); }}
                    className="absolute inset-0 w-full h-1.5 rounded-full bg-slate-800 accent-indigo-500 cursor-pointer focus:outline-none appearance-none group-hover/timeline:h-2 transition-all"
                  />
                  
                  {/* Progress bar filled */}
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-indigo-500 rounded-full pointer-events-none"
                    style={{ width: `${(progressSec / selectedRep.durationSec) * 100}%` }}
                  />

                  {/* Chapter ticks overlays on scrubber line */}
                  {selectedRep.chapters?.map((ch, idx) => {
                    const percent = (ch.timeSec / selectedRep.durationSec) * 100;
                    return (
                      <div
                        key={idx}
                        onClick={() => { playSound.click(); setProgressSec(ch.timeSec); }}
                        className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full border border-black hover:scale-150 transition-transform cursor-help -translate-x-1/2 top-[1px]"
                        style={{ left: `${percent}%` }}
                        title={`Capítulo: ${ch.title} (${formatTime(ch.timeSec)})`}
                      />
                    );
                  })}

                  {/* Event ticks overlays on scrubber line */}
                  {selectedRep.events?.map((ev, idx) => {
                    const percent = (ev.timeSec / selectedRep.durationSec) * 100;
                    return (
                      <div
                        key={idx}
                        onClick={() => { playSound.click(); setProgressSec(ev.timeSec); }}
                        className="absolute w-1.5 h-1.5 bg-red-500 rounded-full border border-black hover:scale-150 transition-transform cursor-help -translate-x-1/2 top-[1px]"
                        style={{ left: `${percent}%` }}
                        title={`Evento: ${ev.title} (${formatTime(ev.timeSec)})`}
                      />
                    );
                  })}
                </div>

                {/* Control bar buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => { playSound.click(); setIsPlaying(!isPlaying); }}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>

                    <div className="text-[10px] font-mono text-slate-300 font-bold">
                      {formatTime(progressSec)} / {formatTime(selectedRep.durationSec)}
                    </div>
                  </div>

                  {/* Speeds */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-white/5">
                    <span className="text-[8px] font-bold text-slate-400 uppercase px-1">Velocidade:</span>
                    {[1, 1.25, 1.5, 2].map(sp => (
                      <button
                        key={sp}
                        onClick={() => { playSound.click(); setPlaybackSpeed(sp); }}
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-black cursor-pointer transition-colors ${
                          playbackSpeed === sp
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sp}x
                      </button>
                    ))}
                  </div>

                  {/* Floating triggers reaction manually inside replay */}
                  <button
                    onClick={triggerFloatingReaction}
                    className="px-2.5 py-1 bg-slate-900 border border-white/5 hover:bg-slate-800 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer"
                  >
                    🔥 Reagir
                  </button>
                </div>
              </div>
            </div>

            {/* METADATA SAVED DETAILS & TIMELINE TAB SELECTORS */}
            <div className="p-5 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-150 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-indigo-500" />
                  Métricas Consolidadas de Gravação (Saved Analytics)
                </h3>
                <span className="text-[8px] font-mono bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 px-2 py-0.5 rounded font-black border border-indigo-150">
                  GRAVADO INTEGRALMENTE
                </span>
              </div>

              {/* Metrics block */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850 space-y-1">
                  <span className="text-[8px] text-slate-400 block uppercase font-bold">Tempo Total</span>
                  <span className="text-xs font-black font-mono text-slate-800 dark:text-white">{formatTime(selectedRep.durationSec)}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850 space-y-1">
                  <span className="text-[8px] text-slate-400 block uppercase font-bold">Pico de Espectadores</span>
                  <span className="text-xs font-black font-mono text-emerald-500">{selectedRep.peakViewers?.toLocaleString() || '1,100'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850 space-y-1">
                  <span className="text-[8px] text-slate-400 block uppercase font-bold">Engajamento Total</span>
                  <span className="text-xs font-black font-mono text-indigo-500">{selectedRep.likes || '450'} Curtidas</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850 space-y-1">
                  <span className="text-[8px] text-slate-400 block uppercase font-bold">Compartilhamentos</span>
                  <span className="text-xs font-black font-mono text-purple-500">{selectedRep.shares || '42'} shares</span>
                </div>
              </div>

              {/* Retention graph visualizer */}
              {selectedRep.analyticsData && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-900">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Histórico de Audiência & Retenção do Vídeo</span>
                  <div className="h-14 flex items-end gap-1 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-150 dark:border-slate-850">
                    {selectedRep.analyticsData.viewersHistory.map((val, idx) => {
                      const maxVal = Math.max(...selectedRep.analyticsData!.viewersHistory) || 100;
                      const heightPercent = Math.max(10, Math.round((val / maxVal) * 100));
                      return (
                        <div 
                          key={idx}
                          className="flex-1 bg-indigo-500 rounded-t transition-all duration-300 hover:bg-indigo-400 relative group cursor-help"
                          style={{ height: `${heightPercent}%` }}
                        >
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-mono">
                            {val} spects
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* TIMELINE SEGMENTS: CHAPTERS, EVENTS, MARKERS */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-150 dark:border-slate-800">
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider block">
                  Linha do Tempo Estruturada (Timestamps)
                </span>
                <span className="text-[8px] font-mono text-purple-500 font-bold uppercase">Navegável</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Chapters list */}
                <div className="space-y-2.5">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Capítulos Automáticos (Auto-Generated)</span>
                  
                  <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
                    {selectedRep.chapters?.map((ch, idx) => {
                      const isPast = progressSec >= ch.timeSec;
                      return (
                        <button
                          key={idx}
                          onClick={() => { playSound.click(); setProgressSec(ch.timeSec); setIsPlaying(true); }}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all text-xs flex items-center justify-between cursor-pointer ${
                            isPast
                              ? 'bg-slate-50 border-slate-250 dark:bg-slate-900/60 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                              : 'bg-white border-slate-150 text-slate-400 dark:bg-slate-950'
                          }`}
                        >
                          <span className="font-bold uppercase tracking-tight truncate max-w-[180px]">{ch.title}</span>
                          <span className="font-mono font-black text-[10px] text-indigo-500">{formatTime(ch.timeSec)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Events list */}
                <div className="space-y-2.5">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Eventos Críticos (Automatic Highlights)</span>
                  
                  <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
                    {selectedRep.events?.map((ev, idx) => {
                      const isPast = progressSec >= ev.timeSec;
                      return (
                        <button
                          key={idx}
                          onClick={() => { playSound.click(); setProgressSec(ev.timeSec); setIsPlaying(true); }}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all text-xs flex items-center justify-between cursor-pointer ${
                            isPast
                              ? 'bg-slate-50 border-slate-250 dark:bg-slate-900/60 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                              : 'bg-white border-slate-150 text-slate-400 dark:bg-slate-950'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 font-bold truncate max-w-[180px]">
                            {ev.type === 'kill' && '🎯'}
                            {ev.type === 'boss' && '👹'}
                            {ev.type === 'chat' && '💬'}
                            {ev.type === 'reaction' && '🔥'}
                            <span className="truncate">{ev.title}</span>
                          </span>
                          <span className="font-mono font-black text-[10px] text-red-500">{formatTime(ev.timeSec)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Custom timeline markers */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-900 space-y-3">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Marcadores Manuais e Notas de Análise</span>
                
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin">
                  {selectedRep.markers?.map((mk, idx) => (
                    <button
                      key={idx}
                      onClick={() => { playSound.click(); setProgressSec(mk.timeSec); }}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-200/50 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span>📍 {mk.note}</span>
                      <span className="font-mono opacity-60">({formatTime(mk.timeSec)})</span>
                    </button>
                  ))}

                  {(!selectedRep.markers || selectedRep.markers.length === 0) && (
                    <span className="text-[10px] text-slate-500 block font-medium">Nenhum marcador adicionado pelo piloto ainda.</span>
                  )}
                </div>

                {/* Form to insert custom marker */}
                <form onSubmit={handleAddMarker} className="flex gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Adicionar nota para este segundo do replay..."
                    value={customMarkerText}
                    onChange={(e) => setCustomMarkerText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-850 dark:text-slate-100"
                  />
                  <button type="submit" className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl font-black uppercase text-[10px] tracking-wider shrink-0 cursor-pointer">
                    Salvar Marcador 📍
                  </button>
                </form>
              </div>

            </div>

          </div>

          {/* Right sidebar area: Synchronized Chat replay */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4.5 rounded-2xl shadow-sm flex flex-col justify-between h-[500px] relative">
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                
                <div className="flex items-center justify-between pb-2 border-b border-slate-150 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-tight">Replay de Chat Sincronizado</span>
                  </div>
                  <span className="text-[8px] font-mono text-indigo-500 font-bold uppercase tracking-widest border border-indigo-500/20 px-1.5 py-0.5 rounded">
                    Sincronizado {formatTime(progressSec)}
                  </span>
                </div>

                {/* Comments scroll container based on current timeline timeSec */}
                <div className="flex-1 overflow-y-auto font-sans text-xs space-y-2 py-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-850">
                  {currentChatVisible.map((c) => (
                    <div key={c.id} className="leading-relaxed animate-fadeIn">
                      <span className="font-mono text-[8px] text-slate-400 mr-1.5 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded font-black">
                        {formatTime(c.timeSec)}
                      </span>
                      <strong className={`font-mono text-[10px] mr-1.5 uppercase ${
                        c.isSub ? 'text-purple-600 dark:text-purple-400 font-bold' :
                        c.isVip ? 'text-amber-500 font-bold' : 'text-slate-500'
                      }`}>
                        {c.user}:
                      </strong>
                      <span className="text-slate-600 dark:text-slate-200 font-medium">{c.text}</span>
                    </div>
                  ))}

                  {currentChatVisible.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-[10px] font-bold uppercase leading-relaxed">
                      Chat vazio.<br />Avance o tempo para reproduzir as mensagens enviadas.
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

              </div>

              {/* Footer info showing timeline properties */}
              <div className="pt-2 border-t border-slate-150 dark:border-slate-800 text-[10px] text-slate-400 font-medium">
                As mensagens acima foram recuperadas integralmente do banco de dados e reproduzidas de acordo com o carimbo de data/hora original da gravação.
              </div>
            </div>

            {/* QUICK CLIPS EXTRACED FROM STREAM */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4.5 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-150 dark:border-slate-800">
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider block">
                  Clipes desta Gravação ({selectedRep.clips?.length || 0})
                </span>
                <span className="text-[8px] font-mono text-pink-500 font-bold uppercase">Melhores Momentos</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                {selectedRep.clips?.map(clip => (
                  <div
                    key={clip.id}
                    className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="text-[8px] font-mono font-bold text-slate-400 block uppercase">Clip Rec • {clip.timestamp}</span>
                      <span className="font-black text-slate-800 dark:text-slate-200 block uppercase tracking-tight mt-0.5">{clip.title}</span>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[9px] font-mono font-bold text-pink-500 bg-pink-50 dark:bg-pink-950/40 px-1.5 py-0.5 rounded border border-pink-200 dark:border-pink-900">
                        {clip.durationSec}s
                      </span>
                    </div>
                  </div>
                ))}

                {(!selectedRep.clips || selectedRep.clips.length === 0) && (
                  <div className="text-center py-6 text-slate-400 text-[10px] font-bold uppercase">
                    Nenhum clipe gerado para esta gravação.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
