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
  Bookmark,
  Plus,
  Users,
  Compass,
  Eye,
  ShieldAlert,
  Award,
  Grid,
  Search,
  Flag,
  ChevronLeft,
  Tv,
  MapPin,
  TrendingUp,
  Sliders,
  Sparkle
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
  shared_post_id?: string;
  scoped_type?: string;
  scoped_id?: string;
  reactions?: Record<string, string[]>;
  is_flagged?: boolean;
  flag_reason?: string;
}

interface FeedProps {
  loggedInUser: { name: string; email: string; avatarUrl?: string } | null;
  onOpenLogin: () => void;
}

export const Feed: React.FC<FeedProps> = ({ loggedInUser, onOpenLogin }) => {
  // Navigation and active views
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'pages' | 'events' | 'explore' | 'saved'>('feed');
  const [activeFilter, setActiveFilter] = useState<'recents' | 'recommended'>('recents');
  
  // Data States
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  
  // Loading and Publishing states
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

  // Group / Scope Filtering State (Allows filtering general feed to specific community)
  const [selectedScope, setSelectedScope] = useState<{ type: string; id: string; name: string } | null>(null);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals / Overlays triggers
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState<number>(0);
  const [showCreateStory, setShowCreateStory] = useState<boolean>(false);
  const [newStoryText, setNewStoryText] = useState<string>('');
  const [newStoryBg, setNewStoryBg] = useState<string>('from-indigo-600 to-purple-600');
  
  // Entity creation modals
  const [showCreateGroup, setShowCreateGroup] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupDesc, setNewGroupDesc] = useState<string>('');
  
  const [showCreateEvent, setShowCreateEvent] = useState<boolean>(false);
  const [newEventTitle, setNewEventTitle] = useState<string>('');
  const [newEventDesc, setNewEventDesc] = useState<string>('');
  const [newEventDate, setNewEventDate] = useState<string>('');
  const [newEventLocation, setNewEventLocation] = useState<string>('');

  const [showCreatePage, setShowCreatePage] = useState<boolean>(false);
  const [newPageName, setNewPageName] = useState<string>('');
  const [newPageDesc, setNewPageDesc] = useState<string>('');
  const [newPageCategory, setNewPageCategory] = useState<string>('Tecnologia');

  // Repost / Share Modal
  const [repostPostId, setRepostPostId] = useState<string | null>(null);
  const [repostCommentText, setRepostCommentText] = useState<string>('');

  // Report Modal
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('');

  // Interactions Popovers
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyProgressInterval = useRef<any>(null);

  useEffect(() => {
    if (loggedInUser) {
      setUsernameInput(loggedInUser.name);
      fetchMemberships();
    } else {
      setMemberships([]);
    }
  }, [loggedInUser]);

  const showStatus = (message: string, type: 'success' | 'error') => {
    setStatusMsg({ message, type });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  // ----------------------------------------------------
  // DATA FETCHING FUNCTIONS
  // ----------------------------------------------------
  
  const fetchPosts = async () => {
    setLoading(true);
    try {
      let url = `/api/feed?filter=${activeFilter === 'recommended' ? 'recommended' : 'recents'}`;
      if (selectedScope) {
        url += `&scope=${selectedScope.type}&scopeId=${selectedScope.id}`;
      }
      if (selectedHashtag) {
        url += `&hashtag=${encodeURIComponent(selectedHashtag)}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.posts) {
          setPosts(data.posts);
          setSourceInfo(data.source || 'sqlite');
        }
      }
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/social/stories');
      if (res.ok) {
        const data = await res.json();
        setStories(data.stories || []);
      }
    } catch (e) {
      console.error("Stories fetch error:", e);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/social/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (e) {
      console.error("Groups fetch error:", e);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/social/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {
      console.error("Events fetch error:", e);
    }
  };

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/social/pages');
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
      }
    } catch (e) {
      console.error("Pages fetch error:", e);
    }
  };

  const fetchTrending = async () => {
    try {
      const res = await fetch('/api/social/trending');
      if (res.ok) {
        const data = await res.json();
        setTrending(data.trending || []);
      }
    } catch (e) {
      console.error("Trending fetch error:", e);
    }
  };

  const fetchMemberships = async () => {
    if (!loggedInUser) return;
    try {
      const res = await fetch(`/api/social/memberships/${loggedInUser.email}`);
      if (res.ok) {
        const data = await res.json();
        setMemberships(data.memberships || []);
      }
    } catch (e) {
      console.error("Memberships error:", e);
    }
  };

  const refreshAllData = () => {
    fetchPosts();
    fetchStories();
    fetchGroups();
    fetchEvents();
    fetchPages();
    fetchTrending();
    if (loggedInUser) fetchMemberships();
  };

  useEffect(() => {
    refreshAllData();
  }, [activeFilter, selectedScope, selectedHashtag, activeTab]);

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
      setMediaUrlInput('');
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

      if (selectedScope) {
        formData.append("scopedType", selectedScope.type);
        formData.append("scopedId", selectedScope.id);
      }

      const response = await fetch('/api/feed', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to submit post");
      }

      const resData = await response.json();

      if (resData.post && resData.post.is_flagged) {
        playSound.click();
        showStatus(`Aviso: O post foi sinalizado pela IA de Moderação e ocultado do feed público. Motivo: ${resData.post.flag_reason}`, "error");
      } else {
        playSound.jackpot();
        showStatus("Publicação enviada com sucesso!", "success");
      }

      setText('');
      removeMedia();
      setShowUrlInput(false);
      fetchPosts();
      fetchTrending();
    } catch (err) {
      console.error(err);
      showStatus("Erro ao enviar sua publicação. Tente novamente.", "error");
    } finally {
      setPublishing(false);
    }
  };

  // ----------------------------------------------------
  // INTERACTION WORKFLOWS
  // ----------------------------------------------------
  
  // Simple Like (standard)
  const handleLike = async (postId: string) => {
    if (!loggedInUser) {
      showStatus("Faça login para curtir.", "error");
      onOpenLogin();
      return;
    }
    playSound.click();
    const userId = loggedInUser.email;

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const likes = p.likes || [];
        const index = likes.indexOf(userId);
        const updatedLikes = index > -1 ? likes.filter(uid => uid !== userId) : [...likes, userId];
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
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: data.likes } : p));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Emoji Reaction
  const handleReact = async (postId: string, reaction: string) => {
    if (!loggedInUser) {
      showStatus("Faça login para reagir.", "error");
      onOpenLogin();
      return;
    }
    playSound.click();
    const userId = loggedInUser.email;

    // Optimistic UI Update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const reactions = { ...(p.reactions || {}) };
        Object.keys(reactions).forEach(r => {
          reactions[r] = reactions[r].filter(uid => uid !== userId);
        });
        if (!reactions[reaction]) reactions[reaction] = [];
        reactions[reaction].push(userId);
        return { ...p, reactions };
      }
      return p;
    }));

    try {
      const res = await fetch('/api/feed/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId, reaction })
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, reactions: data.reactions } : p));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Evaluate Rating Star
  const handleEvaluate = async (postId: string, rating: number) => {
    if (!loggedInUser) {
      showStatus("Faça login para avaliar.", "error");
      onOpenLogin();
      return;
    }
    playSound.purchase();
    const userId = loggedInUser.email;

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
        showStatus(`Você avaliou este setup com ${rating} estrelas!`, "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save / Bookmark Post
  const handleSavePost = async (postId: string) => {
    if (!loggedInUser) {
      showStatus("Faça login para salvar.", "error");
      onOpenLogin();
      return;
    }
    playSound.click();
    const userId = loggedInUser.email;

    try {
      const res = await fetch('/api/feed/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId })
      });
      if (res.ok) {
        const data = await res.json();
        showStatus(data.saved ? "Publicação salva nos favoritos!" : "Removido dos salvos", "success");
        fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Comments & Replies
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
        const data = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: data.comments } : p));
        setNewCommentText(prev => ({ ...prev, [postId]: '' }));
        showStatus("Comentário publicado!", "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLikeComment = async (postId: string, commentId: string) => {
    if (!loggedInUser) return;
    playSound.click();
    try {
      const res = await fetch('/api/feed/comment/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, commentId, userId: loggedInUser.email })
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: data.comments } : p));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddReply = async (postId: string, commentId: string) => {
    if (!loggedInUser || !replyText.trim()) return;
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
          text: replyText.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: data.comments } : p));
        setReplyText('');
        setReplyingToCommentId(null);
        showStatus("Resposta publicada!", "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!loggedInUser) return;
    playSound.click();
    try {
      const res = await fetch('/api/feed/comment/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, commentId, userId: loggedInUser.email })
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: data.comments } : p));
        showStatus("Comentário excluído", "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditCommentSubmit = async (postId: string, commentId: string) => {
    if (!loggedInUser || !editingText.trim()) return;
    playSound.click();
    try {
      const res = await fetch('/api/feed/comment/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, commentId, userId: loggedInUser.email, text: editingText })
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: data.comments } : p));
        setEditingCommentId(null);
        showStatus("Comentário atualizado!", "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!loggedInUser) return;
    playSound.click();
    if (!window.confirm("Deseja realmente deletar esta publicação?")) return;
    try {
      const res = await fetch('/api/feed/post/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: loggedInUser.email })
      });
      if (res.ok) {
        showStatus("Publicação deletada com sucesso.", "success");
        fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Repost / Quote Share
  const handleShareSubmit = async () => {
    if (!loggedInUser || !repostPostId) return;
    playSound.jackpot();
    try {
      const res = await fetch('/api/feed/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: repostPostId,
          userId: loggedInUser.email,
          username: loggedInUser.name,
          userAvatarUrl: loggedInUser.avatarUrl,
          text: repostCommentText.trim()
        })
      });
      if (res.ok) {
        showStatus("Repostado com sucesso!", "success");
        setRepostPostId(null);
        setRepostCommentText('');
        fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Denunciation / Report
  const handleReportSubmit = async () => {
    if (!loggedInUser || !reportPostId) return;
    playSound.click();
    try {
      const res = await fetch('/api/feed/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: reportPostId,
          reporterId: loggedInUser.email,
          reason: reportReason.trim() || "Conteúdo impróprio"
        })
      });
      if (res.ok) {
        const data = await res.json();
        showStatus(data.postFlagged 
          ? "Sua denúncia foi avaliada pela nossa IA de moderação. A publicação violou as regras e foi removida imediatamente!"
          : "Sua denúncia foi registrada para avaliação pela nossa moderação de IA.", "success");
        setReportPostId(null);
        setReportReason('');
        fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ----------------------------------------------------
  // ENTITY OPERATIONS (Stories, Groups, Pages, Events)
  // ----------------------------------------------------
  
  // Submit Story
  const handlePublishStory = async () => {
    if (!loggedInUser) return;
    playSound.jackpot();
    try {
      const formData = new FormData();
      formData.append("username", loggedInUser.name);
      formData.append("userAvatarUrl", loggedInUser.avatarUrl || '');
      formData.append("userId", loggedInUser.email);
      
      if (newStoryText) {
        formData.append("text", newStoryText);
        formData.append("bgColor", newStoryBg);
      }
      if (mediaFile) {
        formData.append("media", mediaFile);
        formData.append("mediaType", mediaType);
      } else if (mediaPreview) {
        formData.append("mediaBase64", mediaPreview);
        formData.append("mediaType", mediaType);
      }

      const res = await fetch('/api/social/stories', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        showStatus("Story publicado com sucesso!", "success");
        setShowCreateStory(false);
        setNewStoryText('');
        removeMedia();
        fetchStories();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Join / Leave Group/Community
  const handleGroupAction = async (groupId: string, action: 'join' | 'leave') => {
    if (!loggedInUser) {
      showStatus("Faça login para entrar.", "error");
      onOpenLogin();
      return;
    }
    playSound.click();
    try {
      const res = await fetch(`/api/social/groups/${groupId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser.email, type: 'group' })
      });
      if (res.ok) {
        showStatus(action === 'join' ? "Você entrou na comunidade!" : "Você saiu da comunidade.", "success");
        fetchGroups();
        fetchMemberships();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // RSVP / Join Event
  const handleEventRSVP = async (eventId: string) => {
    if (!loggedInUser) {
      showStatus("Faça login para confirmar presença.", "error");
      onOpenLogin();
      return;
    }
    playSound.purchase();
    try {
      const res = await fetch(`/api/social/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser.email })
      });
      if (res.ok) {
        showStatus("Presença confirmada no evento!", "success");
        fetchEvents();
        fetchMemberships();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Follow Page
  const handleFollowPage = async (pageId: string) => {
    if (!loggedInUser) {
      showStatus("Faça login para seguir.", "error");
      onOpenLogin();
      return;
    }
    playSound.click();
    try {
      const res = await fetch(`/api/social/pages/${pageId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser.email })
      });
      if (res.ok) {
        showStatus("Você começou a seguir esta página!", "success");
        fetchPages();
        fetchMemberships();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Entities Creation
  const handleCreateGroupSubmit = async () => {
    if (!loggedInUser || !newGroupName.trim()) return;
    try {
      const res = await fetch('/api/social/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDesc,
          creatorId: loggedInUser.email,
          type: 'group'
        })
      });
      if (res.ok) {
        showStatus("Comunidade criada com sucesso!", "success");
        setShowCreateGroup(false);
        setNewGroupName('');
        setNewGroupDesc('');
        fetchGroups();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateEventSubmit = async () => {
    if (!loggedInUser || !newEventTitle.trim() || !newEventDate) return;
    try {
      const res = await fetch('/api/social/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEventTitle,
          description: newEventDesc,
          creatorId: loggedInUser.email,
          date: newEventDate,
          location: newEventLocation
        })
      });
      if (res.ok) {
        showStatus("Evento criado com sucesso!", "success");
        setShowCreateEvent(false);
        setNewEventTitle('');
        setNewEventDesc('');
        setNewEventDate('');
        setNewEventLocation('');
        fetchEvents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePageSubmit = async () => {
    if (!loggedInUser || !newPageName.trim()) return;
    try {
      const res = await fetch('/api/social/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPageName,
          description: newPageDesc,
          creatorId: loggedInUser.email,
          category: newPageCategory
        })
      });
      if (res.ok) {
        showStatus("Página criada com sucesso!", "success");
        setShowCreatePage(false);
        setNewPageName('');
        setNewPageDesc('');
        fetchPages();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ----------------------------------------------------
  // STORY TIMER CAROUSEL
  // ----------------------------------------------------
  
  useEffect(() => {
    if (selectedStoryIndex !== null) {
      setStoryProgress(0);
      storyProgressInterval.current = setInterval(() => {
        setStoryProgress(p => {
          if (p >= 100) {
            handleNextStory();
            return 0;
          }
          return p + 2;
        });
      }, 100);
    } else {
      clearInterval(storyProgressInterval.current);
    }
    return () => clearInterval(storyProgressInterval.current);
  }, [selectedStoryIndex]);

  const handleNextStory = () => {
    if (selectedStoryIndex === null) return;
    if (selectedStoryIndex < stories.length - 1) {
      setSelectedStoryIndex(selectedStoryIndex + 1);
    } else {
      setSelectedStoryIndex(null);
    }
  };

  const handlePrevStory = () => {
    if (selectedStoryIndex === null) return;
    if (selectedStoryIndex > 0) {
      setSelectedStoryIndex(selectedStoryIndex - 1);
    } else {
      setSelectedStoryIndex(null);
    }
  };

  // Copy quote or web address link
  const handleShareLink = (post: Post) => {
    const mockUrl = `${window.location.origin}/#feed-post-${post.id}`;
    navigator.clipboard.writeText(mockUrl);
    showStatus("🔗 Link copiado para sua área de transferência!", "success");
  };

  // Date Formatter Helper
  const formatDate = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHrs / 24);

      if (diffMins < 1) return "Agora mesmo";
      if (diffMins < 60) return `Há ${diffMins} min`;
      if (diffHrs < 24) return `Há ${diffHrs} h`;
      if (diffDays < 7) return `Há ${diffDays} d`;

      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const getAdIcon = (category?: string) => {
    switch (category) {
      case 'movie': return <Film className="w-4 h-4 text-rose-500" />;
      case 'game': return <Gamepad2 className="w-4 h-4 text-emerald-500" />;
      case 'shop': return <Store className="w-4 h-4 text-indigo-500" />;
      default: return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  // Helper check if user is member of a group, page or event
  const isMemberOf = (entityId: string) => {
    return memberships.some(m => m.entity_id === entityId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-slate-800 font-sans">
      
      {/* Dynamic Subheader / Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Compass className="w-6 h-6 text-indigo-600 animate-spin-slow" />
            <span>Rede Social Gamer & Tech</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Conecte-se com gamers, descubra novos setups e interaja com comunidades.</p>
        </div>
        
        {/* Main Tabs Navigation */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab('feed'); setSelectedScope(null); setSelectedHashtag(null); }}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
              activeTab === 'feed' && !selectedScope ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Feed Geral
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
              activeTab === 'groups' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Comunidades
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
              activeTab === 'pages' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Páginas
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
              activeTab === 'events' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Eventos
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
              activeTab === 'explore' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Explorar
          </button>
          {loggedInUser && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                activeTab === 'saved' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Salvos
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout containing Main Column + Widgets Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* STORIES BAR (SLIDER) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="text-xs uppercase font-black text-slate-400 tracking-wider mb-3 flex items-center justify-between">
              <span>Stories do Dia</span>
              <span className="text-[10px] font-mono lowercase text-indigo-500">expiram em 24h</span>
            </div>
            
            <div className="flex items-center gap-3.5 overflow-x-auto pb-1 select-none scrollbar-hide">
              {/* Creator Button */}
              {loggedInUser && (
                <div className="flex flex-col items-center shrink-0">
                  <button 
                    onClick={() => { setShowCreateStory(true); playSound.click(); }}
                    className="w-14 h-14 rounded-full border-2 border-dashed border-indigo-400 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 transition-all text-indigo-600 shadow-inner cursor-pointer"
                  >
                    <Plus className="w-5 h-5 animate-pulse" />
                  </button>
                  <span className="text-[10px] font-bold text-slate-500 mt-1.5">Seu Story</span>
                </div>
              )}

              {stories.length === 0 ? (
                <div className="text-slate-400 text-[11px] font-medium py-3.5 pl-2">Ainda não há stories ativos. Compartilhe o primeiro!</div>
              ) : (
                stories.map((st, i) => (
                  <div 
                    key={st.id || i} 
                    onClick={() => { setSelectedStoryIndex(i); playSound.click(); }}
                    className="flex flex-col items-center shrink-0 cursor-pointer group"
                  >
                    <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-indigo-600 group-hover:scale-105 transition-transform">
                      <img 
                        src={st.user_avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(st.username)}`} 
                        alt={st.username} 
                        className="w-13 h-13 rounded-full object-cover border border-white"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-600 mt-1.5 max-w-[70px] truncate text-center">
                      {st.username}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Scope indicator / Filters Info */}
          {selectedScope && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-900">
                  Visualizando publicações de: <strong className="font-black text-indigo-950">{selectedScope.name}</strong>
                </span>
              </div>
              <button 
                onClick={() => setSelectedScope(null)}
                className="text-indigo-400 hover:text-indigo-900"
                title="Limpar filtro de grupo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {selectedHashtag && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-purple-900">
                  Filtrando hashtag: <strong className="font-black text-purple-950">{selectedHashtag}</strong>
                </span>
              </div>
              <button 
                onClick={() => setSelectedHashtag(null)}
                className="text-purple-400 hover:text-purple-900"
                title="Limpar hashtag"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ACTIVE TABS VIEW CONTROLLERS */}
          {activeTab === 'feed' && (
            <>
              {/* PUBLISH COMPONENT (Creator Block) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <img 
                    src={loggedInUser?.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=Guest`} 
                    alt="User" 
                    className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 text-left">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">O que você está jogando ou montando?</span>
                    <input 
                      type="text" 
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Seu nome ou nick de jogador"
                      className="text-xs font-black text-slate-900 outline-none bg-transparent max-w-[200px] border-b border-transparent focus:border-indigo-500 mt-0.5"
                    />
                  </div>
                </div>

                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl transition-all ${
                    dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-150 hover:border-slate-300'
                  }`}
                >
                  <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={selectedScope ? `Escreva algo para a comunidade ${selectedScope.name}...` : "Escreva sobre seu novo setup, periféricos, gameplays ou dúvidas..."}
                    className="w-full min-h-[75px] bg-transparent outline-none p-3 text-xs md:text-sm text-slate-800 placeholder-slate-400 font-medium resize-none leading-relaxed"
                  />

                  {/* Previews */}
                  {mediaPreview && (
                    <div className="px-3 pb-3 relative">
                      <div className="relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center max-h-[220px]">
                        {mediaType === 'video' ? (
                          <video src={mediaPreview} controls className="w-full h-full object-contain" />
                        ) : (
                          <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                        )}
                        <button 
                          onClick={removeMedia}
                          className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional Web URL Media Input */}
                {showUrlInput && (
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2 text-left animate-fadeIn">
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
                          setMediaPreview(null);
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

                {!loggedInUser && (
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 font-medium text-center leading-relaxed">
                    👋 Faça <button onClick={onOpenLogin} className="text-indigo-600 font-bold hover:underline">Login na sua conta</button> para poder curtir, comentar, reagir, avaliar setups e publicar!
                  </div>
                )}
              </div>

              {/* Relevance Sorting Toolbar */}
              <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-sm">
                <span className="text-[10px] font-mono font-black text-slate-400 flex items-center gap-1 uppercase">
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Classificar publicações</span>
                </span>
                
                <div className="flex gap-1.5 bg-slate-100 p-0.5 rounded-lg">
                  <button
                    onClick={() => setActiveFilter('recents')}
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${
                      activeFilter === 'recents' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Recentes
                  </button>
                  <button
                    onClick={() => setActiveFilter('recommended')}
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all flex items-center gap-1 ${
                      activeFilter === 'recommended' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>Recomendados (Relevância AI)</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* COMMUNITIES TABS VIEW */}
          {activeTab === 'groups' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Comunidades & Grupos de Discussão</h3>
                {loggedInUser && (
                  <button 
                    onClick={() => setShowCreateGroup(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg flex items-center gap-1 uppercase"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Criar Comunidade</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map(gp => {
                  const joined = isMemberOf(gp.id);
                  return (
                    <div key={gp.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex gap-3 text-left">
                      <img src={gp.avatar_url} alt={gp.name} className="w-12 h-12 rounded-xl object-cover border border-slate-150" />
                      <div className="flex-1 space-y-1 min-w-0">
                        <h4 className="text-xs font-black text-slate-900 truncate">{gp.name}</h4>
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{gp.description || "Sem descrição."}</p>
                        
                        <div className="pt-2 flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedScope({ type: 'group', id: gp.id, name: gp.name });
                              setActiveTab('feed');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold rounded-md"
                          >
                            Ver Feed
                          </button>
                          
                          <button
                            onClick={() => handleGroupAction(gp.id, joined ? 'leave' : 'join')}
                            className={`px-2.5 py-1 text-[9px] font-bold rounded-md ${
                              joined 
                                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            {joined ? 'Sair' : 'Participar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EVENTS TABS VIEW */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Eventos Gamer & Meetups</h3>
                {loggedInUser && (
                  <button 
                    onClick={() => setShowCreateEvent(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg flex items-center gap-1 uppercase"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Criar Evento</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {events.map(ev => {
                  const going = isMemberOf(ev.id);
                  return (
                    <div key={ev.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex flex-col items-center justify-center border border-slate-200 shrink-0">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-slate-900">{ev.title}</h4>
                          <p className="text-[10px] text-slate-500 leading-normal">{ev.description}</p>
                          <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold pt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(ev.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {ev.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {ev.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                          onClick={() => {
                            setSelectedScope({ type: 'event', id: ev.id, name: ev.title });
                            setActiveTab('feed');
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg"
                        >
                          Mural
                        </button>
                        
                        <button
                          onClick={() => handleEventRSVP(ev.id)}
                          className={`px-3 py-1.5 text-[10px] font-black rounded-lg ${
                            going 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          {going ? '✓ Presença Confirmada' : 'Confirmar Presença'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PAGES TABS VIEW */}
          {activeTab === 'pages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Páginas Oficiais & Criadores</h3>
                {loggedInUser && (
                  <button 
                    onClick={() => setShowCreatePage(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg flex items-center gap-1 uppercase"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Criar Página</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {pages.map(pg => {
                  const following = isMemberOf(pg.id);
                  return (
                    <div key={pg.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center flex flex-col items-center justify-between space-y-3">
                      <div className="space-y-2">
                        <img src={pg.avatar_url} alt={pg.name} className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-slate-100 shadow-md" />
                        <div>
                          <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{pg.category || "Oficial"}</span>
                          <h4 className="text-xs font-black text-slate-900 mt-1">{pg.name}</h4>
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{pg.description || "Sem descrição."}</p>
                        </div>
                      </div>
                      
                      <div className="w-full pt-2 flex gap-1.5 justify-center">
                        <button
                          onClick={() => {
                            setSelectedScope({ type: 'page', id: pg.id, name: pg.name });
                            setActiveTab('feed');
                          }}
                          className="flex-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg"
                        >
                          Mural
                        </button>
                        
                        <button
                          onClick={() => handleFollowPage(pg.id)}
                          className={`flex-1 px-2.5 py-1 text-[10px] font-bold rounded-lg ${
                            following 
                              ? 'bg-slate-200 text-slate-700' 
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          {following ? 'Seguindo' : 'Seguir'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EXPLORE TABS VIEW */}
          {activeTab === 'explore' && (
            <div className="space-y-6 text-left">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <Search className="w-4 h-4 text-indigo-500" />
                  <span>Pesquisar e Descobrir publicações</span>
                </h3>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Digite palavras-chave, nicks de usuários ou termos..."
                    className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-500 rounded-xl px-3 py-2 text-xs outline-none transition-colors"
                    onKeyDown={(e) => { if (e.key === 'Enter') { fetchPosts(); setActiveTab('feed'); } }}
                  />
                  <button
                    onClick={() => { fetchPosts(); setActiveTab('feed'); }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl"
                  >
                    Buscar
                  </button>
                </div>
              </div>

              {/* Trending Tags Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>Trending Topics (#Hashtags)</span>
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {trending.map((tr, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setSelectedHashtag(tr.tag); setActiveTab('feed'); }}
                      className="bg-white border border-slate-200 hover:border-indigo-500 p-3 rounded-xl shadow-sm text-left transition-all hover:translate-y-[-1px] group"
                    >
                      <span className="text-xs font-black text-indigo-600 block group-hover:text-indigo-700">{tr.tag}</span>
                      <span className="text-[9px] text-slate-400 font-bold block mt-1">{tr.count} {tr.count === 1 ? 'publicação' : 'publicações'}</span>
                    </button>
                  ))}
                  {trending.length === 0 && (
                    <div className="col-span-full text-slate-400 text-xs py-4 text-center">Nenhuma hashtag catalogada ainda no momento.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CHRONOLOGICAL MAIN FEED LIST LOOP */}
          {(activeTab === 'feed' || activeTab === 'saved') && (
            <>
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-400 animate-pulse">Sincronizando fotos e setups...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="py-16 text-center space-y-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <MessageCircle className="w-8 h-8 text-slate-300 mx-auto animate-bounce" />
                  <h4 className="text-xs font-black text-slate-700">Ainda não há posts</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">Publique a primeira imagem, setup ou comentário para inaugurar esta visualização!</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <AnimatePresence>
                    {posts.map((post, postIdx) => {
                      const isLikedByMe = loggedInUser && post.likes?.includes(loggedInUser.email);
                      const totalLikes = post.likes?.length || 0;
                      const hasEvaluations = post.evaluations && Object.keys(post.evaluations).length > 0;
                      
                      let avgRating = 0;
                      if (hasEvaluations && post.evaluations) {
                        const vals = Object.values(post.evaluations) as number[];
                        avgRating = vals.reduce((a, b) => a + b, 0) / vals.length;
                      }

                      const myEvaluation = loggedInUser && post.evaluations ? post.evaluations[loggedInUser.email] : 0;
                      const isSaved = loggedInUser && post.id && activeTab === 'saved';

                      return (
                        <motion.div
                          key={post.id || postIdx}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
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
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="text-xs font-black text-slate-900 leading-none">{post.username}</h4>
                                  
                                  {post.isAd && (
                                    <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-200">
                                      PATROCINADO
                                    </span>
                                  )}

                                  {post.scoped_type && (
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">
                                      {post.scoped_type}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 block leading-none font-medium">
                                  {formatDate(post.created_at)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!post.isAd && avgRating > 0 && (
                                <div className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-full text-[10px] font-black">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500 animate-spin-slow" />
                                  <span>{avgRating.toFixed(1)}</span>
                                </div>
                              )}
                              
                              {/* Option menu trigger for delete and reports */}
                              <div className="relative group">
                                <button className="text-slate-400 hover:text-slate-600 p-1">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                
                                <div className="absolute right-0 top-6 w-36 bg-white border border-slate-200 shadow-xl rounded-xl py-1 z-10 hidden group-hover:block hover:block">
                                  {loggedInUser && post.userId === loggedInUser.email && (
                                    <button 
                                      onClick={() => handleDeletePost(post.id)}
                                      className="w-full px-3 py-2 text-left text-[11px] font-bold text-red-600 hover:bg-slate-50 flex items-center gap-1.5"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Excluir</span>
                                    </button>
                                  )}
                                  
                                  {loggedInUser && post.userId !== loggedInUser.email && (
                                    <button 
                                      onClick={() => { setReportPostId(post.id); playSound.click(); }}
                                      className="w-full px-3 py-2 text-left text-[11px] font-bold text-amber-600 hover:bg-slate-50 flex items-center gap-1.5"
                                    >
                                      <Flag className="w-3.5 h-3.5" />
                                      <span>Denunciar</span>
                                    </button>
                                  )}
                                  
                                  <button 
                                    onClick={() => handleShareLink(post)}
                                    className="w-full px-3 py-2 text-left text-[11px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
                                  >
                                    <Link className="w-3.5 h-3.5" />
                                    <span>Copiar link</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Caption Text Body */}
                          <div className="px-4 pt-3 pb-2.5 text-xs md:text-sm text-slate-800 leading-relaxed font-medium text-left">
                            {post.text}
                          </div>

                          {/* Patrocinado Banner inside Ad card */}
                          {post.isAd && post.adTitle && (
                            <div className="px-4 py-1.5 bg-slate-50 border-y border-slate-100 flex items-center gap-2 text-[10px] font-mono font-bold text-slate-600">
                              {getAdIcon(post.adCategory)}
                              <span>{post.adTitle}</span>
                            </div>
                          )}

                          {/* Nested Quote Shared Post Block */}
                          {post.shared_post_id && (
                            <div className="mx-4 mb-3.5 p-3 border border-slate-200 rounded-xl bg-slate-50/50 text-left space-y-2">
                              <span className="text-[9px] uppercase font-mono font-black text-slate-400 block">Post compartilhado</span>
                              <p className="text-xs text-slate-600 italic">Este post faz referência ao conteúdo original da plataforma.</p>
                            </div>
                          )}

                          {/* Attachment Block */}
                          {post.media_url && (
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
                                  src={post.media_url} 
                                  alt="Post attachment" 
                                  className="w-full h-full object-cover sm:object-contain hover:scale-101 transition-transform duration-300"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                            </div>
                          )}

                          {/* INSTAGRAM-STYLE INTERACT TOOLBAR */}
                          <div className="p-3 flex items-center justify-between relative">
                            <div className="flex items-center gap-3.5">
                              
                              {/* Reactions Overlaid Hover System */}
                              <div 
                                className="relative"
                                onMouseEnter={() => setHoveredPostId(post.id)}
                                onMouseLeave={() => setHoveredPostId(null)}
                              >
                                <button 
                                  onClick={() => handleLike(post.id)}
                                  className={`flex items-center gap-1.5 text-xs font-black transition-all hover:scale-115 cursor-pointer p-1.5 rounded-lg ${
                                    isLikedByMe ? 'text-rose-600 bg-rose-50' : 'text-slate-500 hover:text-rose-500 hover:bg-slate-50'
                                  }`}
                                >
                                  <Heart className={`w-5 h-5 ${isLikedByMe ? 'fill-rose-600 text-rose-600 animate-ping-once' : ''}`} />
                                  <span>{totalLikes > 0 && totalLikes}</span>
                                </button>

                                {/* Floating Popover with customizable reactions */}
                                <AnimatePresence>
                                  {hoveredPostId === post.id && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                      animate={{ opacity: 1, y: -45, scale: 1 }}
                                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                      className="absolute left-0 bg-white border border-slate-200 px-2 py-1.5 rounded-2xl shadow-xl flex gap-2 z-30"
                                    >
                                      {[
                                        { emoji: '❤️', label: 'love' },
                                        { emoji: '😂', label: 'haha' },
                                        { emoji: '😮', label: 'wow' },
                                        { emoji: '😢', label: 'sad' },
                                        { emoji: '👾', label: 'gamer' },
                                        { emoji: '🔥', label: 'hype' }
                                      ].map((re, idx) => (
                                        <button
                                          key={idx}
                                          onClick={() => { handleReact(post.id, re.label); setHoveredPostId(null); }}
                                          className="text-lg hover:scale-130 transition-transform cursor-pointer"
                                          title={re.label}
                                        >
                                          {re.emoji}
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Comments expand trigger */}
                              <button 
                                onClick={() => {
                                  setActiveCommentsPostId(activeCommentsPostId === post.id ? null : post.id);
                                  playSound.click();
                                }}
                                className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-indigo-600 transition-all hover:scale-105 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50"
                              >
                                <MessageCircle className="w-5 h-5" />
                                <span>{(post.comments?.length || 0) > 0 && post.comments?.length}</span>
                              </button>

                              {/* Quote Share / Repost button */}
                              <button 
                                onClick={() => { setRepostPostId(post.id); playSound.click(); }}
                                className="text-slate-500 hover:text-emerald-500 transition-all hover:scale-105 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50"
                                title="Repostar com comentário"
                              >
                                <Share2 className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Bookmark / Bookmark save post trigger */}
                            <button 
                              onClick={() => handleSavePost(post.id)}
                              className={`p-1.5 rounded-lg hover:bg-slate-50 transition-colors ${
                                isSaved ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'
                              }`}
                              title="Salvar publicação nos favoritos"
                            >
                              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-indigo-600' : ''}`} />
                            </button>
                          </div>

                          {/* Render Reactions Metrics */}
                          {post.reactions && (Object.values(post.reactions) as string[][]).some(arr => arr && arr.length > 0) && (
                            <div className="px-4 pb-2 flex gap-2 flex-wrap items-center">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Reações:</span>
                              {(Object.entries(post.reactions) as [string, string[]][]).map(([reaction, userIds], ri) => {
                                if (!userIds || userIds.length === 0) return null;
                                const emoji = reaction === 'love' ? '❤️' : reaction === 'haha' ? '😂' : reaction === 'wow' ? '😮' : reaction === 'sad' ? '😢' : reaction === 'gamer' ? '👾' : '🔥';
                                return (
                                  <div key={ri} className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-600">
                                    <span>{emoji}</span>
                                    <span>{userIds.length}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {totalLikes > 0 && (
                            <div className="px-4 pb-2 text-[11px] font-bold text-slate-800 leading-none text-left">
                              {totalLikes === 1 ? '1 curtida' : `${totalLikes} curtidas`}
                            </div>
                          )}

                          {/* Star Evaluation module */}
                          {!post.isAd && (
                            <div className="px-4 pb-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/50 p-3 text-left">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-tight">Avaliar Setup / Gameplay</span>
                                <span className="text-[9px] text-indigo-500 font-bold mt-0.5 block">Ajude a classificar a relevância deste setup</span>
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
                                          isActive ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300'
                                        }`} 
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* COMMENTS BLOCK */}
                          <div className="bg-slate-50/60 p-4 space-y-4">
                            {(!post.comments || post.comments.length === 0) ? (
                              <div className="text-[10px] text-slate-400 font-medium text-left">Nenhum comentário ainda.</div>
                            ) : (
                              <div className="space-y-3.5">
                                <div className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider text-left">Comentários</div>
                                
                                {post.comments.map((comment) => {
                                  const isCommentLikedByMe = loggedInUser && comment.likes?.includes(loggedInUser.email);
                                  const isMyComment = loggedInUser && comment.userId === loggedInUser.email;

                                  return (
                                    <div key={comment.id} className="space-y-2 border-b border-slate-200/50 pb-2.5 last:border-none last:pb-0 text-left">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex gap-2">
                                          <img 
                                            src={comment.userAvatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(comment.username)}`} 
                                            alt={comment.username} 
                                            className="w-7 h-7 rounded-full object-cover border border-slate-100 shadow-sm shrink-0"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="text-xs font-black text-slate-900">{comment.username}</span>
                                              <span className="text-[9px] text-slate-400">{formatDate(comment.created_at)}</span>
                                            </div>
                                            
                                            {editingCommentId === comment.id ? (
                                              <div className="mt-1 flex items-center gap-2">
                                                <input 
                                                  type="text" 
                                                  value={editingText}
                                                  onChange={(e) => setEditingText(e.target.value)}
                                                  className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-800 max-w-xs focus:border-indigo-500"
                                                />
                                                <button onClick={() => handleEditCommentSubmit(post.id, comment.id)} className="text-[10px] font-bold text-indigo-600 hover:underline">Salvar</button>
                                                <button onClick={() => setEditingCommentId(null)} className="text-[10px] font-bold text-slate-400 hover:underline">Cancelar</button>
                                              </div>
                                            ) : (
                                              <p className="text-[11px] md:text-xs text-slate-700 leading-relaxed font-medium mt-0.5">
                                                {comment.text}
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          <button 
                                            onClick={() => handleLikeComment(post.id, comment.id)}
                                            className={`p-1 transition-all ${isCommentLikedByMe ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                                            title="Curtir"
                                          >
                                            <Heart className={`w-3.5 h-3.5 ${isCommentLikedByMe ? 'fill-rose-500' : ''}`} />
                                          </button>

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

                                          {isMyComment && (
                                            <div className="flex items-center gap-1">
                                              <button 
                                                onClick={() => { setEditingCommentId(comment.id); setEditingText(comment.text); playSound.click(); }}
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

                                      {/* Replies Loop */}
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
                                              <div>
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

                                      {/* Reply input field */}
                                      {replyingToCommentId === comment.id && (
                                        <div className="pl-6 pt-1 flex gap-1.5 items-center animate-fadeIn">
                                          <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                          <input 
                                            type="text" 
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Escreva sua resposta..."
                                            className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] outline-none focus:border-indigo-500"
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddReply(post.id, comment.id); }}
                                          />
                                          <button onClick={() => handleAddReply(post.id, comment.id)} className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-500 cursor-pointer">
                                            <Send className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Comment creation area */}
                            <div className="flex gap-2 items-center pt-2.5 border-t border-slate-200/50">
                              <input 
                                type="text" 
                                value={newCommentText[post.id] || ''}
                                onChange={(e) => setNewCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                                placeholder={loggedInUser ? "Adicione um comentário..." : "Faça login para comentar"}
                                disabled={!loggedInUser}
                                className="flex-1 bg-white border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs outline-none transition-colors"
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id); }}
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
            </>
          )}

        </div>

        {/* Widgets Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* PROFILE CARD */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-center">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 text-left">Seu Perfil de Jogador</h3>
            {loggedInUser ? (
              <div className="space-y-3.5">
                <img src={loggedInUser.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(loggedInUser.name)}`} alt={loggedInUser.name} className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-indigo-500 shadow-md" />
                <div>
                  <h4 className="text-xs font-black text-slate-900">{loggedInUser.name}</h4>
                  <p className="text-[10px] text-slate-400">{loggedInUser.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Inscrições</span>
                    <span className="text-xs font-black text-indigo-600">{memberships.length}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Favoritos</span>
                    <span className="text-xs font-black text-indigo-600">
                      {posts.filter(p => p.saved_by && p.saved_by.includes(loggedInUser.email)).length}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-3">
                <p className="text-[11px] text-slate-500">Você está navegando como visitante.</p>
                <button 
                  onClick={onOpenLogin}
                  className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  Entrar na conta
                </button>
              </div>
            )}
          </div>

          {/* ACTIVE SPARK TRENDING TOPICS */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-left">
            <div className="flex items-center gap-1 mb-3 border-b border-slate-100 pb-2">
              <TrendingUp className="w-4.5 h-4.5 text-purple-600" />
              <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Hashtags em Alta</h3>
            </div>
            
            <div className="space-y-2.5">
              {trending.slice(0, 5).map((tr, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedHashtag(tr.tag); setActiveTab('feed'); }}
                  className="w-full flex items-center justify-between text-left hover:bg-slate-50 p-1.5 rounded-lg transition-colors group"
                >
                  <span className="text-xs font-black text-slate-800 group-hover:text-indigo-600">{tr.tag}</span>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    {tr.count}
                  </span>
                </button>
              ))}
              {trending.length === 0 && (
                <p className="text-[11px] text-slate-400 py-2">Nenhum trending topic catalogado.</p>
              )}
            </div>
          </div>

          {/* DISCOVER COMMUNITIES SIDEBAR */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-left">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Comunidades Sugeridas</h3>
            <div className="space-y-3">
              {groups.slice(0, 3).map(gp => {
                const joined = isMemberOf(gp.id);
                return (
                  <div key={gp.id} className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2.5 last:border-none last:pb-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={gp.avatar_url} alt={gp.name} className="w-8 h-8 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-black text-slate-900 truncate">{gp.name}</h4>
                        <span className="text-[8px] text-slate-400 font-bold block">Grupo de Jogadores</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleGroupAction(gp.id, joined ? 'leave' : 'join')}
                      className={`px-2 py-1 text-[8px] font-black rounded ${
                        joined ? 'bg-red-50 text-red-600' : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {joined ? 'Sair' : 'Entrar'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* ----------------------------------------------------
          OVERLAYS & MODALS
      ---------------------------------------------------- */}

      {/* FULL-SCREEN IMMERSIVE STORY VIEWER */}
      <AnimatePresence>
        {selectedStoryIndex !== null && stories[selectedStoryIndex] && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/98 backdrop-blur-md flex items-center justify-center z-50 text-white p-4"
          >
            <div className="relative w-full max-w-md aspect-[9/16] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between p-4">
              
              {/* Dynamic timer bar indicator */}
              <div className="absolute top-2.5 left-4 right-4 flex gap-1 z-30">
                {stories.map((s, idx) => {
                  let widthPercent = 0;
                  if (idx < selectedStoryIndex) widthPercent = 100;
                  else if (idx === selectedStoryIndex) widthPercent = storyProgress;
                  return (
                    <div key={idx} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: `${widthPercent}%` }} />
                    </div>
                  );
                })}
              </div>

              {/* Story Header */}
              <div className="flex items-center justify-between z-30 mt-3">
                <div className="flex items-center gap-2">
                  <img 
                    src={stories[selectedStoryIndex].user_avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(stories[selectedStoryIndex].username)}`} 
                    alt={stories[selectedStoryIndex].username} 
                    className="w-8 h-8 rounded-full border border-white/50"
                  />
                  <div className="text-left">
                    <h4 className="text-[11px] font-black">{stories[selectedStoryIndex].username}</h4>
                    <span className="text-[8px] text-white/65 mt-0.5 block">{formatDate(stories[selectedStoryIndex].created_at)}</span>
                  </div>
                </div>

                <button onClick={() => setSelectedStoryIndex(null)} className="p-1 text-white/80 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Story Content Block */}
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-10">
                {stories[selectedStoryIndex].media_url ? (
                  stories[selectedStoryIndex].media_type === 'video' ? (
                    <video src={stories[selectedStoryIndex].media_url} autoPlay muted playsInline className="w-full h-full object-contain" />
                  ) : (
                    <img src={stories[selectedStoryIndex].media_url} alt="Story visual" className="w-full h-full object-contain" />
                  )
                ) : null}

                {/* Text overlays */}
                {stories[selectedStoryIndex].text && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${stories[selectedStoryIndex].bg_color || 'from-indigo-600 to-purple-600'} flex items-center justify-center p-6 text-center`}>
                    <p className="text-base md:text-xl font-black text-white leading-relaxed drop-shadow-md">
                      {stories[selectedStoryIndex].text}
                    </p>
                  </div>
                )}
              </div>

              {/* Story Viewer navigation arrows */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-3 z-30">
                <button onClick={handlePrevStory} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/70">
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button onClick={handleNextStory} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/70">
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Footer indicator */}
              <div className="text-center z-30 text-[9px] font-mono tracking-wider text-white/55">
                Story {selectedStoryIndex + 1} de {stories.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE STORY MODAL */}
      <AnimatePresence>
        {showCreateStory && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-800 shadow-2xl relative"
            >
              <button onClick={() => setShowCreateStory(false)} className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-black uppercase text-slate-900 mb-4 flex items-center gap-1.5">
                <Sparkle className="w-4 h-4 text-indigo-500 animate-pulse" />
                <span>Publicar Novo Story</span>
              </h3>

              <div className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Texto do Story</label>
                  <textarea
                    value={newStoryText}
                    onChange={(e) => setNewStoryText(e.target.value)}
                    placeholder="Digite seu pensamento gamer ou mensagem rápida..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:border-indigo-500 outline-none resize-none min-h-[80px]"
                  />
                </div>

                {!mediaPreview && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Cor de Fundo do Texto</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { name: 'Sunset', bg: 'from-orange-500 to-rose-600' },
                        { name: 'Cyber', bg: 'from-indigo-600 to-purple-600' },
                        { name: 'Space', bg: 'from-slate-900 to-slate-700' },
                        { name: 'Moss', bg: 'from-emerald-500 to-teal-700' }
                      ].map((gradient, idx) => (
                        <button
                          key={idx}
                          onClick={() => setNewStoryBg(gradient.bg)}
                          className={`px-3 py-1.5 text-[9px] font-black rounded-lg text-white bg-gradient-to-r ${gradient.bg} ${
                            newStoryBg === gradient.bg ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                          }`}
                        >
                          {gradient.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Media upload option inside story */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-800 block">Adicionar Imagem / Vídeo</span>
                    <span className="text-[8px] text-slate-400 block mt-0.5">Opcional, substitui o fundo colorido</span>
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-500 rounded-lg text-[10px] font-bold"
                  >
                    Selecionar
                  </button>
                </div>

                <button
                  onClick={handlePublishStory}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black rounded-xl cursor-pointer tracking-wider uppercase"
                >
                  Publicar Story
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REPOST/SHARE DIALOG */}
      <AnimatePresence>
        {repostPostId && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-800 shadow-2xl relative"
            >
              <button onClick={() => setRepostPostId(null)} className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-black uppercase text-slate-900 mb-4">Compartilhar Publicação</h3>

              <div className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Seu comentário sobre o post (Opcional)</label>
                  <textarea
                    value={repostCommentText}
                    onChange={(e) => setRepostCommentText(e.target.value)}
                    placeholder="O que você achou dessa montagem ou gameplay?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:border-indigo-500 outline-none resize-none min-h-[80px]"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500">
                  ⚡ O post será citado na sua timeline com referência ao autor original.
                </div>

                <button
                  onClick={handleShareSubmit}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl"
                >
                  Repostar agora
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REPORT/DENOUNCE DIALOG */}
      <AnimatePresence>
        {reportPostId && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-800 shadow-2xl relative"
            >
              <button onClick={() => setReportPostId(null)} className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-black uppercase text-red-600 mb-4 flex items-center gap-1">
                <ShieldAlert className="w-5 h-5" />
                <span>Denunciar Publicação</span>
              </h3>

              <div className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Qual o motivo da denúncia?</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-indigo-500"
                  >
                    <option value="">Selecione um motivo...</option>
                    <option value="spam">Spam / Links excessivos ou indesejados</option>
                    <option value="ofensa">Ofensas, assédio ou comportamento tóxico</option>
                    <option value="inapropriado">Conteúdo ilegal, violento ou pornográfico</option>
                    <option value="fake">Informações falsas ou golpes</option>
                  </select>
                </div>

                <p className="text-[10px] text-slate-400 leading-normal">
                  Sua denúncia ativará uma avaliação por inteligência artificial em tempo real. Se violar as regras da comunidade gamer, o post será suspenso imediatamente.
                </p>

                <button
                  onClick={handleReportSubmit}
                  disabled={!reportReason}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl"
                >
                  Enviar Denúncia
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE GROUP DIALOG */}
      <AnimatePresence>
        {showCreateGroup && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-800 shadow-2xl relative"
            >
              <button onClick={() => setShowCreateGroup(false)} className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-black uppercase text-slate-900 mb-4">Criar Comunidade</h3>

              <div className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nome da Comunidade</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Ex: Colecionadores de Consoles Retro"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Descrição</label>
                  <textarea
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="Descreva as regras ou o objetivo da comunidade..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:border-indigo-500 outline-none resize-none min-h-[80px]"
                  />
                </div>

                <button
                  onClick={handleCreateGroupSubmit}
                  disabled={!newGroupName.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl disabled:bg-slate-200 disabled:text-slate-400"
                >
                  Criar Comunidade agora
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE EVENT DIALOG */}
      <AnimatePresence>
        {showCreateEvent && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-800 shadow-2xl relative"
            >
              <button onClick={() => setShowCreateEvent(false)} className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-black uppercase text-slate-900 mb-4">Criar Evento</h3>

              <div className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Título do Evento</label>
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="Ex: Torneio de Smash Bros ou Hardware Expo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Descrição</label>
                  <textarea
                    value={newEventDesc}
                    onChange={(e) => setNewEventDesc(e.target.value)}
                    placeholder="Explique os horários, cronograma e como participar..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:border-indigo-500 outline-none resize-none min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Data e Hora</label>
                    <input
                      type="datetime-local"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Localização (Física ou Canal)</label>
                    <input
                      type="text"
                      value={newEventLocation}
                      onChange={(e) => setNewEventLocation(e.target.value)}
                      placeholder="Ex: Discord Oficial ou Av Paulista 1000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateEventSubmit}
                  disabled={!newEventTitle.trim() || !newEventDate}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl disabled:bg-slate-200 disabled:text-slate-400"
                >
                  Criar Evento agora
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE PAGE DIALOG */}
      <AnimatePresence>
        {showCreatePage && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-800 shadow-2xl relative"
            >
              <button onClick={() => setShowCreatePage(false)} className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-black uppercase text-slate-900 mb-4">Criar Página de Criador</h3>

              <div className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nome da Página</label>
                  <input
                    type="text"
                    value={newPageName}
                    onChange={(e) => setNewPageName(e.target.value)}
                    placeholder="Ex: Hardware Guru ou Gameplay Retro"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Descrição</label>
                  <textarea
                    value={newPageDesc}
                    onChange={(e) => setNewPageDesc(e.target.value)}
                    placeholder="Descreva sobre o que você publica na página..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:border-indigo-500 outline-none resize-none min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Categoria</label>
                  <select
                    value={newPageCategory}
                    onChange={(e) => setNewPageCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:border-indigo-500 outline-none"
                  >
                    <option value="Tecnologia">Tecnologia & Hardware</option>
                    <option value="Gameplay">Gameplay & Stream</option>
                    <option value="Review">Análise de Jogos</option>
                    <option value="Noticias">Notícias & E-Sports</option>
                  </select>
                </div>

                <button
                  onClick={handleCreatePageSubmit}
                  disabled={!newPageName.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl disabled:bg-slate-200 disabled:text-slate-400"
                >
                  Criar Página agora
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
