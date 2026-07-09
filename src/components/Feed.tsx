import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Star, 
  Trash2, 
  Edit3, 
  Send, 
  RefreshCw, 
  User, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  UploadCloud, 
  X, 
  Sparkles,
  Database,
  Film,
  Gamepad2,
  Store,
  Video,
  Image as ImageIcon,
  Link,
  ChevronRight,
  MoreVertical,
  CornerDownRight,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '../utils/audio';

interface FeedReply {
  id: string;
  userId: string;
  username: string;
  userAvatarUrl?: string;
  text: string;
  created_at: string;
  likes?: string[];
}

interface FeedComment {
  id: string;
  userId: string;
  username: string;
  userAvatarUrl?: string;
  text: string;
  created_at: string;
  likes?: string[];
  replies?: FeedReply[];
}

interface Post {
  id: string;
  userId?: string;
  username: string;
  userAvatarUrl?: string;
  text: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  created_at: string;
  likes?: string[];
  evaluations?: Record<string, number>;
  comments?: FeedComment[];
  isAd?: boolean;
  adTitle?: string;
  adActionUrl?: string;
  adCategory?: 'movie' | 'game' | 'shop';
}

interface FeedProps {
  loggedInUser: { name: string; email: string; avatarUrl?: string } | null;
  onOpenLogin: () => void;
}

export const Feed: React.FC<FeedProps> = ({ loggedInUser, onOpenLogin }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [sourceInfo, setSourceInfo] = useState<string>('server_db');

  // New post form states
  const [usernameInput, setUsernameInput] = useState<string>(() => {
    return loggedInUser ? loggedInUser.name : '';
  });
  const [text, setText] = useState<string>('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaUrlInput, setMediaUrlInput] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);

  useEffect(() => {
    if (loggedInUser) {
      setUsernameInput(loggedInUser.name);
    }
  }, [loggedInUser]);

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Interaction UI states
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showStatus = (message: string, type: 'success' | 'error') => {
    setStatusMsg({ message, type });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  // Load feed posts
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/feed');
      if (res.ok) {
        const data = await res.json();
        if (data && data.posts) {
          setPosts(data.posts);
          setSourceInfo(data.source || 'server_db');
        }
      }
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Handle Drag Events for file drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      showStatus("Por favor, selecione apenas arquivos de imagem ou vídeo.", "error");
      return;
    }
    setMediaFile(file);
    setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
      setMediaUrlInput(''); // clear URL if file uploaded
    };
    reader.readAsDataURL(file);
    playSound.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    playSound.click();
  };

  // Submit Post
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalUsername = usernameInput.trim();
    if (!finalUsername) {
      showStatus("Por favor, insira um nome de usuário.", "error");
      return;
    }

    const finalText = text.trim();
    if (!finalText) {
      showStatus("Por favor, digite um texto para sua publicação.", "error");
      return;
    }

    setPublishing(true);
    playSound.click();

    try {
      const formData = new FormData();
      formData.append("username", finalUsername);
      formData.append("userAvatarUrl", loggedInUser?.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(finalUsername)}`);
      formData.append("text", finalText);
      
      if (mediaFile) {
        formData.append("media", mediaFile);
        formData.append("mediaFileName", mediaFile.name);
      } else if (mediaPreview) {
        formData.append("mediaBase64", mediaPreview);
      }

      if (mediaUrlInput.trim()) {
        formData.append("mediaUrl", mediaUrlInput.trim());
      }

      formData.append("mediaType", mediaType);

      if (loggedInUser?.email) {
        formData.append("userId", loggedInUser.email);
      }

      const response = await fetch('/api/feed', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to submit post");
      }

      // Success
      playSound.jackpot();
      showStatus("Sua foto foi publicada com sucesso estilo Instagram!", "success");
      setText('');
      removeMedia();
      setShowUrlInput(false);
      fetchPosts(); // Refresh feed list
    } catch (err) {
      console.error(err);
      showStatus("Erro ao enviar sua publicação. Tente novamente.", "error");
    } finally {
      setPublishing(false);
    }
  };

  // Like action
  const handleLike = async (postId: string) => {
    if (!loggedInUser) {
      showStatus("Faça login para curtir esta publicação.", "error");
      onOpenLogin();
      return;
    }

    playSound.click();
    const userId = loggedInUser.email;

    // Optimistic UI Update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const likes = p.likes || [];
        const index = likes.indexOf(userId);
        const updatedLikes = index > -1 
          ? likes.filter(uid => uid !== userId)
          : [...likes, userId];
        return { ...p, likes: updatedLikes };
      }
      return p;
    }));

    try {
      const res = await fetch('/api/feed/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId })
      });
      if (res.ok) {
        const data = await res.json();
        // Update to match absolute server state
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: data.likes } : p));
      }
    } catch (e) {
      console.error("Error liking post:", e);
    }
  };

  // Evaluate Rating Star action
  const handleEvaluate = async (postId: string, rating: number) => {
    if (!loggedInUser) {
      showStatus("Faça login para avaliar esta publicação.", "error");
      onOpenLogin();
      return;
    }

    playSound.purchase();
    const userId = loggedInUser.email;

    // Optimistic UI Update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const evaluations = { ...(p.evaluations || {}) };
        evaluations[userId] = rating;
        return { ...p, evaluations };
      }
      return p;
    }));

    try {
      const res = await fetch('/api/feed/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId, rating })
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, evaluations: data.evaluations } : p));
        showStatus(`Você avaliou esta publicação com ${rating} estrelas!`, "success");
      }
    } catch (e) {
      console.error("Error evaluating post:", e);
    }
  };

  // Add Comment
  const handleAddComment = async (postId: string) => {
    if (!loggedInUser) {
      showStatus("Faça login para comentar.", "error");
      onOpenLogin();
      return;
    }

    const commentText = newCommentText[postId]?.trim();
    if (!commentText) return;

    playSound.click();

    try {
      const res = await fetch('/api/feed/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          userId: loggedInUser.email,
          username: loggedInUser.name,
          userAvatarUrl: loggedInUser.avatarUrl,
          text: commentText
        })
      });

      if (res.ok) {
        setNewCommentText(prev => ({ ...prev, [postId]: '' }));
        fetchPosts(); // Refresh posts to see complete database sync
        showStatus("Comentário adicionado!", "success");
      }
    } catch (e) {
      console.error("Error commenting:", e);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm("Tem certeza que deseja excluir seu comentário?")) return;
    playSound.gameover();

    try {
      const res = await fetch('/api/feed/comment/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, commentId })
      });
      if (res.ok) {
        fetchPosts();
        showStatus("Comentário excluído.", "success");
      }
    } catch (e) {
      console.error("Error deleting comment:", e);
    }
  };

  // Edit Comment Submit
  const handleEditCommentSubmit = async (postId: string, commentId: string) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;
    playSound.click();

    try {
      const res = await fetch('/api/feed/comment/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, commentId, text: trimmed })
      });
      if (res.ok) {
        setEditingCommentId(null);
        setEditingText('');
        fetchPosts();
        showStatus("Comentário editado com sucesso!", "success");
      }
    } catch (e) {
      console.error("Error editing comment:", e);
    }
  };

  // Reply Comment Submit
  const handleAddReply = async (postId: string, commentId: string) => {
    if (!loggedInUser) {
      showStatus("Faça login para responder.", "error");
      onOpenLogin();
      return;
    }

    const trimmed = replyText.trim();
    if (!trimmed) return;
    playSound.click();

    try {
      const res = await fetch('/api/feed/comment/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          commentId,
          userId: loggedInUser.email,
          username: loggedInUser.name,
          userAvatarUrl: loggedInUser.avatarUrl,
          text: trimmed
        })
      });

      if (res.ok) {
        setReplyingToCommentId(null);
        setReplyText('');
        fetchPosts();
        showStatus("Resposta enviada!", "success");
      }
    } catch (e) {
      console.error("Error replying to comment:", e);
    }
  };

  // Like Comment Action
  const handleLikeComment = async (postId: string, commentId: string) => {
    if (!loggedInUser) {
      showStatus("Faça login para curtir o comentário.", "error");
      onOpenLogin();
      return;
    }
    playSound.click();

    try {
      await fetch('/api/feed/comment/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, commentId, userId: loggedInUser.email })
      });
      fetchPosts();
    } catch (e) {
      console.error("Error liking comment:", e);
    }
  };

  // Copy Post Link to Clipboard
  const handleShare = (post: Post) => {
    playSound.victory();
    const mockUrl = `${window.location.origin}/#feed-post-${post.id}`;
    navigator.clipboard.writeText(mockUrl);
    showStatus("🔗 Link copiado para sua área de transferência! Compartilhe com seus amigos.", "success");
  };

  const formatDate = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHrs / 24);

      if (diffMins < 1) return "Agora mesmo";
      if (diffMins < 60) return `Há ${diffMins} min`;
      if (diffHrs < 24) return `Há ${diffHrs} h`;
      if (diffDays < 7) return `Há ${diffDays} dias`;

      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Ad categories rendering settings
  const getAdIcon = (category?: 'movie' | 'game' | 'shop') => {
    switch (category) {
      case 'movie': return <Film className="w-4 h-4 text-rose-500" />;
      case 'game': return <Gamepad2 className="w-4 h-4 text-indigo-500 animate-bounce" />;
      case 'shop': return <Store className="w-4 h-4 text-amber-500" />;
      default: return <Sparkles className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 font-sans text-slate-850" id="instagram-feed-view">
      
      {/* Dynamic Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-xl font-black text-slate-950 font-sans tracking-tight">Arena Feed</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchPosts} 
            disabled={loading}
            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-all cursor-pointer disabled:opacity-50"
            title="Sincronizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Instagram Post Creator Block */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3.5">
        <div className="space-y-3">
          {/* Nome de Usuário input row */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value.slice(0, 35))}
              placeholder="Digite seu nome de usuário / apelido..."
              className="w-full bg-transparent border-none outline-none text-xs md:text-sm font-semibold text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="flex gap-3">
            {loggedInUser ? (
              <img 
                src={loggedInUser.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(usernameInput || 'visitante')}`} 
                alt={loggedInUser.name} 
                className="w-10 h-10 rounded-full border border-slate-200 shadow-sm shrink-0 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <img 
                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(usernameInput || 'visitante')}`} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full border border-slate-200 shadow-sm shrink-0 object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            
            <div className="flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 500))}
                placeholder="No que você está pensando? Digite o texto da sua publicação..."
                rows={3}
                className="w-full bg-transparent border-none outline-none text-xs md:text-sm text-slate-800 placeholder-slate-400 resize-none leading-relaxed pt-1.5 focus:ring-0 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Media Preview inside Creator block */}
        {mediaPreview && (
          <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-[4/3] max-h-64 flex items-center justify-center border border-slate-100 shadow-inner">
            {mediaType === 'video' ? (
              <video src={mediaPreview} controls className="w-full h-full object-contain" />
            ) : (
              <img src={mediaPreview} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            )}
            <button 
              onClick={removeMedia}
              className="absolute top-2.5 right-2.5 p-1.5 bg-slate-950/75 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* URL Inputs */}
        {showUrlInput && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Link de Imagem ou Vídeo da Web</span>
              <button onClick={() => setShowUrlInput(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={mediaUrlInput}
                onChange={(e) => {
                  setMediaUrlInput(e.target.value);
                  setMediaPreview(null); // clear file upload preview
                }}
                placeholder="Insira a URL: https://exemplo.com/imagem.png"
                className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
              />
              <select 
                value={mediaType} 
                onChange={(e) => setMediaType(e.target.value as 'image' | 'video')}
                className="bg-white border border-slate-200 rounded-lg px-2 text-xs outline-none"
              >
                <option value="image">Imagem</option>
                <option value="video">Vídeo</option>
              </select>
            </div>
          </div>
        )}

        {/* Action controls inside Creator block */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer text-[11px] font-bold"
            >
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">Foto/Vídeo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => {
                setShowUrlInput(!showUrlInput);
                playSound.click();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer text-[11px] font-bold"
            >
              <Link className="w-4 h-4 text-sky-500" />
              <span className="hidden sm:inline">URL Web</span>
            </button>
          </div>

          <button
            onClick={handlePublish}
            disabled={publishing || (!usernameInput.trim()) || (!text.trim() && !mediaPreview && !mediaUrlInput.trim())}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[11px] font-black rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer uppercase tracking-wide shrink-0"
          >
            {publishing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
            <span>Publicar</span>
          </button>
        </div>

        {/* Auth nudge for Guests */}
        {!loggedInUser && (
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 font-medium text-center leading-relaxed">
            👋 Faça <button onClick={onOpenLogin} className="text-indigo-600 font-bold hover:underline">Login na sua conta</button> para poder curtir, comentar, avaliar setups e publicar fotos no feed!
          </div>
        )}
      </div>

      {/* Main Feed chronological loop */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
          <p className="text-xs font-bold text-slate-400 animate-pulse">Sincronizando fotos e setups...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center space-y-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <MessageCircle className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="text-xs font-black text-slate-700">Ainda não há posts</h4>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">Faça login e publique a primeira imagem ou comentário para inaugurar o feed oficial!</p>
        </div>
      ) : (
        <div className="space-y-5">
          <AnimatePresence>
            {posts.map((post, postIdx) => {
              const isLikedByMe = loggedInUser && post.likes?.includes(loggedInUser.email);
              const totalLikes = post.likes?.length || 0;
              const hasEvaluations = post.evaluations && Object.keys(post.evaluations).length > 0;
              
              // Calculate average stars
              let avgRating = 0;
              if (hasEvaluations && post.evaluations) {
                const vals = Object.values(post.evaluations) as number[];
                avgRating = vals.reduce((a, b) => a + b, 0) / vals.length;
              }

              const myEvaluation = loggedInUser && post.evaluations ? post.evaluations[loggedInUser.email] : 0;

              return (
                <motion.div
                  key={post.id || postIdx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(postIdx * 0.05, 0.4) }}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
                >
                  
                  {/* Card Header (Profile + Actions) */}
                  <div className="p-3.5 flex items-center justify-between border-b border-slate-50">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={post.userAvatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(post.username)}`} 
                        alt={post.username} 
                        className="w-9 h-9 rounded-full object-cover border border-slate-100 shadow-inner"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(post.username)}`;
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-slate-900 leading-none">{post.username}</h4>
                          {post.isAd && (
                            <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                              PATROCINADO
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block leading-none font-medium">
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Star rating preview indicator on top-right */}
                      {!post.isAd && avgRating > 0 && (
                        <div className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-full text-[10px] font-black">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{avgRating.toFixed(1)}</span>
                        </div>
                      )}
                      
                      <button className="text-slate-400 hover:text-slate-600 p-1">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Caption Text Body */}
                  <div className="px-4 pt-3 pb-2.5 text-xs md:text-sm text-slate-800 leading-relaxed font-medium">
                    {post.text}
                  </div>

                  {/* Optional Patrocinado/Ad Category Label Header inside Card */}
                  {post.isAd && post.adTitle && (
                    <div className="px-4 py-1.5 bg-slate-50 border-y border-slate-100 flex items-center gap-2 text-[10px] font-mono font-bold text-slate-600">
                      {getAdIcon(post.adCategory)}
                      <span>{post.adTitle}</span>
                    </div>
                  )}

                  {/* Optional Media (Image or Video) Block with clean visual container */}
                  {(post.media_url || post.isAd) && (
                    <div className="relative border-y border-slate-100 bg-slate-950 aspect-[4/3] flex items-center justify-center overflow-hidden">
                      {post.media_type === 'video' ? (
                        <video 
                          src={post.media_url} 
                          controls 
                          className="w-full h-full object-contain"
                          preload="metadata"
                        />
                      ) : (
                        <img 
                          src={post.media_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600"} 
                          alt="Post attachment" 
                          className="w-full h-full object-cover sm:object-contain"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600";
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* Instagram-style Actions Toolbar */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Like button with scale-click effect */}
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 text-xs font-black transition-all hover:scale-115 cursor-pointer ${
                          isLikedByMe ? 'text-rose-600' : 'text-slate-500 hover:text-rose-500'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${isLikedByMe ? 'fill-rose-600 text-rose-600 animate-pulse' : ''}`} />
                        <span>{totalLikes > 0 && totalLikes}</span>
                      </button>

                      {/* Comments expand trigger */}
                      <button 
                        onClick={() => {
                          setActiveCommentsPostId(activeCommentsPostId === post.id ? null : post.id);
                          playSound.click();
                        }}
                        className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-indigo-600 transition-all hover:scale-105 cursor-pointer"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>{(post.comments?.length || 0) > 0 && post.comments?.length}</span>
                      </button>

                      {/* Share button */}
                      <button 
                        onClick={() => handleShare(post)}
                        className="text-slate-500 hover:text-emerald-500 transition-all hover:scale-105 cursor-pointer"
                        title="Copiar link"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Bookmark decoration */}
                    <button className="text-slate-400 hover:text-indigo-600 cursor-pointer">
                      <Bookmark className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Likes Description */}
                  {totalLikes > 0 && (
                    <div className="px-4 pb-2 text-[11px] font-bold text-slate-800 leading-none">
                      {totalLikes === 1 ? '1 curtida' : `${totalLikes} curtidas`}
                    </div>
                  )}

                  {/* Evaluation Stars - ONLY for normal community setups posts, not Ads */}
                  {!post.isAd && (
                    <div className="px-4 pb-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/50 p-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-tight">Avaliar Setup / Gameplay</span>
                        <span className="text-[9px] text-indigo-500 font-bold mt-0.5 block">Como você avalia essa postagem?</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((starValue) => {
                          const isActive = starValue <= (myEvaluation || avgRating);
                          return (
                            <button
                              key={starValue}
                              onClick={() => handleEvaluate(post.id, starValue)}
                              className="focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                              title={`Avaliar ${starValue} estrelas`}
                            >
                              <Star 
                                className={`w-4 h-4 ${
                                  isActive 
                                    ? 'fill-amber-400 text-amber-400' 
                                    : 'text-slate-300 hover:text-amber-300'
                                }`} 
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Comments Block Drawer (Instagram style comments interface) */}
                  <div className="bg-slate-50/60 p-4 space-y-4">
                    
                    {/* Compact comments count or expand button if collapsed */}
                    {(!post.comments || post.comments.length === 0) ? (
                      <div className="text-[10px] text-slate-400 font-medium">Nenhum comentário ainda. Seja o primeiro a comentar!</div>
                    ) : (
                      <div className="space-y-3.5">
                        <div className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Comentários</div>
                        
                        {post.comments.map((comment) => {
                          const isCommentLikedByMe = loggedInUser && comment.likes?.includes(loggedInUser.email);
                          const isMyComment = loggedInUser && comment.userId === loggedInUser.email;

                          return (
                            <div key={comment.id} className="space-y-2 border-b border-slate-200/50 pb-2.5 last:border-none last:pb-0">
                              
                              {/* Comment Header info */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex gap-2">
                                  <img 
                                    src={comment.userAvatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(comment.username)}`} 
                                    alt={comment.username} 
                                    className="w-7 h-7 rounded-full object-cover border border-slate-100 shadow-sm shrink-0"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(comment.username)}`;
                                    }}
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="text-left">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-black text-slate-900">{comment.username}</span>
                                      <span className="text-[9px] text-slate-400">{formatDate(comment.created_at)}</span>
                                    </div>
                                    
                                    {/* Editable text or plain comment text */}
                                    {editingCommentId === comment.id ? (
                                      <div className="mt-1 flex items-center gap-2">
                                        <input 
                                          type="text" 
                                          value={editingText}
                                          onChange={(e) => setEditingText(e.target.value)}
                                          className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-800 max-w-xs focus:border-indigo-500"
                                        />
                                        <button 
                                          onClick={() => handleEditCommentSubmit(post.id, comment.id)}
                                          className="text-[10px] font-bold text-indigo-600 hover:underline"
                                        >
                                          Salvar
                                        </button>
                                        <button 
                                          onClick={() => setEditingCommentId(null)}
                                          className="text-[10px] font-bold text-slate-400 hover:underline"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    ) : (
                                      <p className="text-[11px] md:text-xs text-slate-700 leading-relaxed font-medium mt-0.5">
                                        {comment.text}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Comment Actions Toolbar */}
                                <div className="flex items-center gap-2 shrink-0">
                                  {/* Like comment button */}
                                  <button 
                                    onClick={() => handleLikeComment(post.id, comment.id)}
                                    className={`p-1 transition-all ${
                                      isCommentLikedByMe ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                                    }`}
                                    title="Curtir comentário"
                                  >
                                    <Heart className={`w-3.5 h-3.5 ${isCommentLikedByMe ? 'fill-rose-500' : ''}`} />
                                  </button>

                                  {/* Reply Comment Button */}
                                  <button 
                                    onClick={() => {
                                      setReplyingToCommentId(replyingToCommentId === comment.id ? null : comment.id);
                                      setReplyText('');
                                      playSound.click();
                                    }}
                                    className="text-[10px] font-bold text-slate-400 hover:text-indigo-600"
                                  >
                                    Responder
                                  </button>

                                  {/* Edit/Delete icons */}
                                  {isMyComment && (
                                    <div className="flex items-center gap-1">
                                      <button 
                                        onClick={() => {
                                          setEditingCommentId(comment.id);
                                          setEditingText(comment.text);
                                          playSound.click();
                                        }}
                                        className="p-0.5 text-slate-400 hover:text-indigo-600"
                                        title="Editar"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteComment(post.id, comment.id)}
                                        className="p-0.5 text-slate-400 hover:text-red-500"
                                        title="Excluir"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Nested Replies Block */}
                              {comment.replies && comment.replies.length > 0 && (
                                <div className="pl-6 pt-1 space-y-2">
                                  {comment.replies.map((reply) => (
                                    <div key={reply.id} className="flex gap-2 bg-slate-100/50 p-1.5 rounded-lg border border-slate-200/30">
                                      <img 
                                        src={reply.userAvatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(reply.username)}`} 
                                        alt={reply.username} 
                                        className="w-5.5 h-5.5 rounded-full object-cover shrink-0"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="text-left">
                                        <div className="flex items-center gap-1 flex-wrap">
                                          <span className="text-[10px] font-black text-slate-800">{reply.username}</span>
                                          <span className="text-[8px] text-slate-400">{formatDate(reply.created_at)}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-600 font-medium leading-normal mt-0.5">
                                          {reply.text}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Reply Input Box */}
                              {replyingToCommentId === comment.id && (
                                <div className="pl-6 pt-1 flex gap-1.5 items-center animate-fadeIn">
                                  <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <input 
                                    type="text" 
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Escreva sua resposta..."
                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] outline-none focus:border-indigo-500"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleAddReply(post.id, comment.id);
                                    }}
                                  />
                                  <button 
                                    onClick={() => handleAddReply(post.id, comment.id)}
                                    className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-500 cursor-pointer"
                                  >
                                    <Send className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* New Comment input bar */}
                    <div className="flex gap-2 items-center pt-2.5 border-t border-slate-200/50">
                      <input 
                        type="text" 
                        value={newCommentText[post.id] || ''}
                        onChange={(e) => setNewCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder={loggedInUser ? "Adicione um comentário..." : "Faça login para comentar"}
                        disabled={!loggedInUser}
                        className="flex-1 bg-white border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs outline-none transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(post.id);
                        }}
                      />
                      <button 
                        onClick={() => handleAddComment(post.id)}
                        disabled={!loggedInUser || !newCommentText[post.id]?.trim()}
                        className="px-3 py-1.5 bg-slate-900 text-white hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 font-bold text-xs rounded-xl tracking-wide transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                      >
                        Enviar
                      </button>
                    </div>

                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Global Status Banner */}
      <AnimatePresence>
        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 text-xs font-bold max-w-sm border ${
              statusMsg.type === 'success' 
                ? 'bg-emerald-950/95 text-emerald-200 border-emerald-700' 
                : 'bg-red-950/95 text-red-200 border-red-700'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{statusMsg.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
