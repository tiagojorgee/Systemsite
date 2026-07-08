import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  Loader2, 
  RotateCcw, 
  Tv, 
  Youtube, 
  Check,
  AlertCircle
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface VideoPlayerProps {
  media: {
    id: string;
    title: string;
    imageUrl: string;
    youtubeId?: string;
    videoUrl?: string;
  };
  onClose?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ media, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Decide default mode: if we have videoUrl, prefer native, else youtube
  const [playerMode, setPlayerMode] = useState<'html5' | 'youtube'>(() => {
    return media.videoUrl ? 'html5' : 'youtube';
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(180); // Fallback 3 mins
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Quality options
  const [quality, setQuality] = useState<string>('1080p');
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [isChangingQuality, setIsChangingQuality] = useState<boolean>(false);
  const [qualitySpinnerMsg, setQualitySpinnerMsg] = useState<string>('');

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Control overlay visibility
  const [showControls, setShowControls] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor mouse movement to auto-hide controls in fullscreen or video view
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Handle Play / Pause
  const togglePlay = () => {
    playSound.click();
    if (playerMode === 'html5' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => console.error(err));
      }
    }
    setIsPlaying(!isPlaying);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    playSound.click();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      videoRef.current.volume = nextMuted ? 0 : volume;
    }
  };

  // Quality Changer simulation with actual visual impact (e.g. CSS filters or video reload)
  const changeQuality = (selectedQuality: string) => {
    if (selectedQuality === quality) return;
    playSound.click();
    setShowQualityMenu(false);
    setIsChangingQuality(true);
    setQualitySpinnerMsg(`Alterando fluxo de vídeo para ${selectedQuality}...`);
    
    // Simulate real video stream buffering for quality adaptation
    setTimeout(() => {
      setQuality(selectedQuality);
      setIsChangingQuality(false);
      
      // If native player, resume playing smoothly
      if (playerMode === 'html5' && videoRef.current) {
        // Slightly seek or reload to simulate stream quality switch
        const currentPos = videoRef.current.currentTime;
        videoRef.current.load();
        videoRef.current.currentTime = currentPos;
        if (isPlaying) {
          videoRef.current.play().catch(err => console.error(err));
        }
      }
    }, 1200);
  };

  // HTML5 Video Events
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 180);
    }
  };

  // Timeline Progress Scrubber click
  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (playerMode === 'html5' && videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  // Fullscreen implementation utilizing correct DOM standard APIs
  const toggleFullscreen = () => {
    playSound.click();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error(err));
    }
  };

  // Handle Fullscreen escape keyboard tracking
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Format second counters beautifully
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '00:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative aspect-[16/9] w-full bg-black rounded-xl overflow-hidden group border border-zinc-850 shadow-2xl select-none"
      id={`video-player-${media.id}`}
    >
      {/* 1. MAIN RENDER AREA (HTML5 Native Video or YouTube Iframe) */}
      <div className="w-full h-full relative">
        {playerMode === 'html5' && media.videoUrl ? (
          <video
            ref={videoRef}
            src={media.videoUrl}
            autoPlay
            playsInline
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
            onError={(e) => {
              console.warn("Video failed to load, falling back to YouTube or standard placeholder:", e);
              if (media.youtubeId) {
                setPlayerMode('youtube');
              } else {
                if (videoRef.current) {
                  videoRef.current.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
                  videoRef.current.load();
                  videoRef.current.play().catch(err => console.error("Fallback video play failed", err));
                }
              }
            }}
            // Quality visual simulation filter (blur slightly on lower quality values)
            className={`w-full h-full object-contain transition-all duration-500 ${
              isChangingQuality ? 'brightness-50' : ''
            } ${
              quality === '360p' ? 'blur-[1.5px]' : 
              quality === '480p' ? 'blur-[0.8px]' : 
              quality === '720p' ? 'blur-[0.2px]' : ''
            }`}
          />
        ) : (
          // YouTube Iframe integration with custom overlay integration
          <iframe 
            width="100%" 
            height="100%" 
            src={`https://www.youtube.com/embed/${media.youtubeId || 'dQw4w9WgXcQ'}?autoplay=1&mute=${isMuted ? 1 : 0}&modestbranding=1&rel=0&controls=1&showinfo=0&vq=${
              quality === '1080p' ? 'hd1080' : 
              quality === '720p' ? 'hd720' : 
              quality === '480p' ? 'large' : 'medium'
            }`} 
            title={media.title}
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen
            className={`w-full h-full object-cover transition-all duration-300 ${isChangingQuality ? 'opacity-30 scale-95 blur-md' : 'opacity-100 scale-100'}`}
          />
        )}

        {/* 2. QUALITY SWITCHING BUFFERING SPINNER OVERLAY */}
        {isChangingQuality && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-3 z-30 transition-opacity">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <div className="text-sm font-black text-white font-sans tracking-wide">
              {qualitySpinnerMsg}
            </div>
            <p className="text-xs text-zinc-500 font-mono">Ajustando taxa de bits do servidor de mídia...</p>
          </div>
        )}
      </div>

      {/* 3. PREMIUM FLOATING HUD DUAL PLAYER TOGGLE */}
      {media.videoUrl && media.youtubeId && showControls && (
        <div className="absolute top-4 left-4 z-40 flex items-center gap-2 bg-black/70 backdrop-blur-md p-1.5 rounded-lg border border-zinc-800">
          <button
            onClick={() => {
              playSound.click();
              setPlayerMode('html5');
              setIsPlaying(true);
            }}
            className={`px-2.5 py-1 text-[10px] font-black rounded-md flex items-center gap-1 transition-all ${
              playerMode === 'html5' 
                ? 'bg-[#E50914] text-white shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Tv className="w-3 h-3" />
            <span>NATIVO MP4</span>
          </button>
          <button
            onClick={() => {
              playSound.click();
              setPlayerMode('youtube');
              setIsPlaying(true);
            }}
            className={`px-2.5 py-1 text-[10px] font-black rounded-md flex items-center gap-1 transition-all ${
              playerMode === 'youtube' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Youtube className="w-3 h-3 fill-current" />
            <span>STREAM YT</span>
          </button>
        </div>
      )}

      {/* 4. CUSTOM PREMIUM CONTROL OVERLAY (For HTML5 and YouTube simulated integrations) */}
      <div 
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-4 md:p-6 space-y-4 transition-all duration-500 z-30 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        {/* Progress Slider (Active timeline scrubber for native HTML5 mode) */}
        {playerMode === 'html5' && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold text-zinc-400">
              {formatTime(currentTime)}
            </span>
            <input 
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={handleTimelineChange}
              className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-800 accent-red-600 focus:outline-none"
              style={{
                background: `linear-gradient(to right, #E50914 0%, #E50914 ${
                  (currentTime / duration) * 100
                }%, #27272a ${(currentTime / duration) * 100}%, #27272a 100%)`
              }}
            />
            <span className="text-[10px] font-mono font-bold text-zinc-300">
              {formatTime(duration)}
            </span>
          </div>
        )}

        {/* Dynamic Control Buttons Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            {playerMode === 'html5' && (
              <button 
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-black text-black" /> : <Play className="w-4 h-4 fill-black text-black translate-x-0.5" />}
              </button>
            )}

            {/* Indicator of YouTube Live Player Controls */}
            {playerMode === 'youtube' && (
              <div className="flex items-center gap-1.5 bg-red-600/95 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-md animate-pulse">
                <Youtube className="w-3.5 h-3.5 fill-white" />
                <span>YouTube Player</span>
              </div>
            )}

            {/* Volume controls */}
            <div className="flex items-center gap-2 group/volume bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/40 hover:border-zinc-700/60 px-2.5 py-1.5 rounded-xl transition-all">
              <button 
                onClick={toggleMute}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? 'Ativar Áudio' : 'Mutar'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input 
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-16 h-1 bg-zinc-700 accent-red-600 rounded-lg appearance-none cursor-pointer transition-all duration-300"
              />
            </div>
          </div>

          {/* Center Info Badge (Active Quality and Audio Format) */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-zinc-400">
            <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded">Stereo 2.0</span>
            <span className="px-2 py-0.5 bg-[#E50914] text-white font-bold rounded">
              {quality} {quality === '1080p' ? 'Full HD' : quality === '720p' ? 'HD' : 'SD'}
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-500">Codec H.264</span>
          </div>

          {/* Right Controls: Quality and Fullscreen */}
          <div className="flex items-center gap-2.5">
            {/* Image Quality Dropdown Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  playSound.click();
                  setShowQualityMenu(!showQualityMenu);
                }}
                className="p-2.5 bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
                title="Qualidade da Imagem"
              >
                <Settings className="w-4 h-4 animate-spin-slow" />
                <span className="text-[11px] font-mono">{quality}</span>
              </button>

              {showQualityMenu && (
                <div className="absolute bottom-12 right-0 bg-zinc-950 border border-zinc-800 rounded-xl py-1.5 w-36 shadow-2xl z-50 animate-fadeIn">
                  <div className="px-3 py-1 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-900 mb-1">
                    Qualidade
                  </div>
                  {['1080p', '720p', '480p', '360p', 'Auto'].map((q) => (
                    <button
                      key={q}
                      onClick={() => changeQuality(q)}
                      className="w-full px-3 py-1.5 text-left text-xs font-bold flex items-center justify-between hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>{q === '1080p' ? '1080p Full HD' : q === '720p' ? '720p HD' : q}</span>
                      {quality === q && <Check className="w-3.5 h-3.5 text-emerald-400 font-black shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button 
              onClick={toggleFullscreen}
              className="p-2.5 bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Tela Cheia"
            >
              {isFullscreen ? <Minimize className="w-4 h-4 text-red-500" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
