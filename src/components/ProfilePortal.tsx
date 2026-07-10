import React, { useState, useEffect } from 'react';
import { AppUser } from './AuthModal';
import { PlayerStats } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Sparkles, 
  Camera, 
  Check, 
  Trash2, 
  Plus, 
  Store, 
  FileText, 
  Users, 
  UploadCloud, 
  Folder, 
  Eye, 
  UserMinus,
  UserPlus,
  Briefcase,
  X,
  Search,
  Shield,
  MapPin,
  Link as LinkIcon,
  Award,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Lock,
  Globe,
  Zap,
  Settings,
  RefreshCw,
  Mail,
  Calendar,
  Twitter,
  Github,
  Youtube,
  Clock,
  Heart
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface ProfilePortalProps {
  loggedInUser: AppUser | null;
  setLoggedInUser: (user: AppUser | null) => void;
  onOpenLogin: () => void;
  stats: PlayerStats;
  updateStats: (updater: (prev: PlayerStats) => PlayerStats) => void;
}

interface UserProfileData {
  uid: string;
  email: string;
  name: string;
  rawName?: string;
  username?: string;
  avatarUrl?: string;
  biography?: string;
  followers: string[];
  following: string[];
  stores: any[];
  files: any[];
  avatarGallery?: string[];
  
  // Advanced features
  bannerUrl?: string;
  links?: string[];
  location?: string;
  socialNetworks?: {
    twitter?: string;
    github?: string;
    discord?: string;
    youtube?: string;
  };
  badges?: string[];
  conquistas?: string[];
  inventario?: any[];
  historico?: any[];
  amigos?: string[];
  solicitacoesAmizade?: string[];
  bloqueados?: string[];
  denuncias?: any[];
  statusOnline?: 'online' | 'idle' | 'offline';
  ultimaAtividade?: string;
  reputacao?: number;
  verificado?: boolean;
  premium?: boolean;
  reputacaoVotos?: { [voterId: string]: 'up' | 'down' };
  privacySettings?: {
    privateProfile: boolean;
    hideCoins: boolean;
    hideHistory: boolean;
    hideFollowers: boolean;
    hideFriends: boolean;
  };
  stats?: any;
}

export const ProfilePortal: React.FC<ProfilePortalProps> = ({
  loggedInUser,
  setLoggedInUser,
  onOpenLogin,
  stats,
  updateStats
}) => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'stores' | 'files' | 'connections' | 'inventory' | 'history'>('details');

  // Search & Filter state for user directory
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<'all' | 'friends' | 'online' | 'verified' | 'premium'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // View state: viewing own profile or looking at a community user profile
  const [viewedUserUid, setViewedUserUid] = useState<string | null>(null);

  // Edit fields for our own profile
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLinks, setEditLinks] = useState<string[]>([]);
  const [newLinkInput, setNewLinkInput] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editYoutube, setEditYoutube] = useState('');
  const [editDiscord, setEditDiscord] = useState('');
  const [avatarGallery, setAvatarGallery] = useState<string[]>([]);
  
  // Privacy preferences
  const [privateProfile, setPrivateProfile] = useState(false);
  const [hideCoins, setHideCoins] = useState(false);
  const [hideHistory, setHideHistory] = useState(false);
  const [hideFollowers, setHideFollowers] = useState(false);
  const [hideFriends, setHideFriends] = useState(false);

  // Action states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [showReportModal, setShowReportModal] = useState<string | null>(null); // contains target Uid

  // File management states
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Store creation states
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState('Jogos');
  const [newStoreDescription, setNewStoreDescription] = useState('');

  // Default banners
  const PRESET_BANNERS = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80'
  ];

  // Fetch profiles and community directory
  const fetchProfile = async () => {
    if (!loggedInUser) return;
    setIsLoading(true);
    try {
      const usersRes = await fetch('/api/user/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(usersData.users);

        // Find match for logged-in user to fill state fields
        const matched = usersData.users.find((u: any) => u.uid === loggedInUser.uid);
        if (matched) {
          setProfile(matched);
          
          // Fill states if we are not actively viewing someone else
          if (!viewedUserUid) {
            setEditName(matched.rawName || matched.name || '');
            setEditUsername(matched.username || '');
            setEditBio(matched.biography || '');
            setEditAvatarUrl(matched.avatarUrl || '');
            setEditBannerUrl(matched.bannerUrl || PRESET_BANNERS[0]);
            setEditLocation(matched.location || '');
            setEditLinks(matched.links || []);
            setEditTwitter(matched.socialNetworks?.twitter || '');
            setEditGithub(matched.socialNetworks?.github || '');
            setEditYoutube(matched.socialNetworks?.youtube || '');
            setEditDiscord(matched.socialNetworks?.discord || '');
            setAvatarGallery(matched.avatarGallery || []);
            
            // Privacy
            setPrivateProfile(matched.privacySettings?.privateProfile || false);
            setHideCoins(matched.privacySettings?.hideCoins || false);
            setHideHistory(matched.privacySettings?.hideHistory || false);
            setHideFollowers(matched.privacySettings?.hideFollowers || false);
            setHideFriends(matched.privacySettings?.hideFriends || false);
          }
        }
      }
    } catch (e) {
      console.error('Error loading profiles:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [loggedInUser, viewedUserUid]);

  // Handle saving the logged-in user profile settings
  const handleSaveProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) return;
    setIsSaving(true);
    setSaveSuccess(false);
    playSound.click();

    try {
      let updatedGallery = [...avatarGallery];
      if (editAvatarUrl && !updatedGallery.includes(editAvatarUrl)) {
        updatedGallery.push(editAvatarUrl);
      }

      const response = await fetch('/api/user/profile/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser.uid,
          name: editName,
          username: editUsername.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase(),
          biography: editBio,
          avatar: editAvatarUrl,
          avatarGallery: updatedGallery,
          banner: editBannerUrl,
          location: editLocation,
          links: editLinks,
          socialNetworks: {
            twitter: editTwitter,
            github: editGithub,
            youtube: editYoutube,
            discord: editDiscord
          },
          privacySettings: {
            privateProfile,
            hideCoins,
            hideHistory,
            hideFollowers,
            hideFriends
          }
        })
      });

      if (response.ok) {
        setSaveSuccess(true);
        playSound.victory();
        
        setLoggedInUser({
          ...loggedInUser,
          name: editName,
          avatarUrl: editAvatarUrl || undefined
        });

        setTimeout(() => setSaveSuccess(false), 3000);
        fetchProfile();
      } else {
        const err = await response.json();
        alert(err.error || "Ocorreu um erro ao salvar o perfil.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Add custom link
  const handleAddLink = () => {
    if (newLinkInput.trim() && !editLinks.includes(newLinkInput.trim())) {
      setEditLinks([...editLinks, newLinkInput.trim()]);
      setNewLinkInput('');
      playSound.click();
    }
  };

  // Remove custom link
  const handleRemoveLink = (lk: string) => {
    setEditLinks(editLinks.filter(l => l !== lk));
    playSound.click();
  };

  const handleRemoveFromGallery = async (imgUrl: string) => {
    if (!loggedInUser) return;
    playSound.click();
    const updated = avatarGallery.filter(url => url !== imgUrl);
    setAvatarGallery(updated);

    try {
      await fetch('/api/user/profile/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser.uid,
          avatarGallery: updated
        })
      });
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  // Drag and drop handlers for upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileToUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  // Profile avatar upload
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      playSound.click();
      setIsSaving(true);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          setEditAvatarUrl(data.url);
          playSound.collect();
        }
      } catch (err) {
        console.error('Avatar upload failed:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Banner image upload
  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      playSound.click();
      setIsSaving(true);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          setEditBannerUrl(data.url);
          playSound.collect();
        }
      } catch (err) {
        console.error('Banner upload failed:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Upload user files to vault
  const handleUploadUserFile = async () => {
    if (!fileToUpload || !profile || !loggedInUser) return;
    setIsUploadingFile(true);
    playSound.click();

    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        const newFileItem = {
          name: fileToUpload.name,
          url: uploadData.url,
          size: (fileToUpload.size / (1024 * 1024)).toFixed(2) + ' MB',
          type: fileToUpload.type,
          uploadedAt: new Date().toLocaleDateString('pt-BR')
        };

        const updatedFiles = [...(profile.files || []), newFileItem];

        const saveRes = await fetch('/api/user/profile/details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: loggedInUser.uid,
            files: updatedFiles
          })
        });

        if (saveRes.ok) {
          setFileToUpload(null);
          playSound.victory();
          fetchProfile();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Delete user file from vault
  const handleDeleteUserFile = async (index: number) => {
    if (!profile || !loggedInUser) return;
    playSound.click();

    const updatedFiles = [...(profile.files || [])];
    updatedFiles.splice(index, 1);

    try {
      const res = await fetch('/api/user/profile/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser.uid,
          files: updatedFiles
        })
      });

      if (res.ok) {
        playSound.purchase();
        fetchProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open store
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !loggedInUser || !newStoreName.trim()) return;
    playSound.click();

    const newStore = {
      id: `store-${Date.now()}`,
      name: newStoreName.trim(),
      category: newStoreCategory,
      description: newStoreDescription.trim(),
      balance: 0.00,
      createdAt: new Date().toLocaleDateString('pt-BR')
    };

    const updatedStores = [...(profile.stores || []), newStore];

    try {
      const res = await fetch('/api/user/profile/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser.uid,
          stores: updatedStores
        })
      });

      if (res.ok) {
        setNewStoreName('');
        setNewStoreDescription('');
        setIsCreatingStore(false);
        playSound.jackpot();
        fetchProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete store
  const handleDeleteStore = async (storeId: string) => {
    if (!profile || !loggedInUser) return;
    playSound.click();

    const updatedStores = (profile.stores || []).filter(s => s.id !== storeId);

    try {
      const res = await fetch('/api/user/profile/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser.uid,
          stores: updatedStores
        })
      });

      if (res.ok) {
        playSound.purchase();
        fetchProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Follow / Unfollow toggle
  const handleToggleFollow = async (targetId: string) => {
    if (!loggedInUser) return;
    playSound.click();

    try {
      const response = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: loggedInUser.uid,
          targetId
        })
      });

      if (response.ok) {
        playSound.collect();
        fetchProfile();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  // Send, Accept, Decline, Remove Friend operations
  const handleFriendshipAction = async (targetId: string, action: 'send' | 'accept' | 'decline' | 'remove') => {
    if (!loggedInUser) return;
    playSound.click();

    try {
      const res = await fetch('/api/user/friend-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: loggedInUser.uid,
          targetId,
          action
        })
      });

      if (res.ok) {
        playSound.victory();
        fetchProfile();
      } else {
        const data = await res.json();
        alert(data.error || "Operação falhou.");
      }
    } catch (e) {
      console.error('Friendship action error:', e);
    }
  };

  // Block/Unblock user operation
  const handleBlockAction = async (targetId: string, action: 'block' | 'unblock') => {
    if (!loggedInUser) return;
    playSound.click();

    try {
      const res = await fetch('/api/user/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: loggedInUser.uid,
          targetId,
          action
        })
      });

      if (res.ok) {
        if (action === "block") playSound.purchase();
        else playSound.collect();
        fetchProfile();
      }
    } catch (e) {
      console.error('Block operation failed:', e);
    }
  };

  // Submit report operation
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser || !showReportModal || !reportReason) return;
    playSound.click();

    try {
      const res = await fetch('/api/user/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: loggedInUser.uid,
          targetId: showReportModal,
          reason: reportReason,
          description: reportDescription
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setShowReportModal(null);
        setReportReason('');
        setReportDescription('');
        playSound.victory();
      }
    } catch (e) {
      console.error('Report submission failed:', e);
    }
  };

  // Vote user reputation
  const handleReputationVote = async (targetId: string, vote: 'up' | 'down') => {
    if (!loggedInUser) return;
    playSound.click();

    try {
      const res = await fetch('/api/user/reputation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: loggedInUser.uid,
          targetId,
          vote
        })
      });

      if (res.ok) {
        playSound.collect();
        fetchProfile();
      }
    } catch (e) {
      console.error('Reputation vote failed:', e);
    }
  };

  // Request/Upgrade to Verified status
  const handleVerifyRequest = async () => {
    if (!loggedInUser) return;
    playSound.click();

    try {
      const res = await fetch('/api/user/verify-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser.uid })
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle VIP Premium VIP status
  const handlePremiumToggle = async () => {
    if (!loggedInUser) return;
    playSound.click();

    try {
      const res = await fetch('/api/user/premium-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser.uid })
      });

      if (res.ok) {
        const data = await res.json();
        playSound.jackpot();
        fetchProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper: Get user details object by Uid
  const getProfileByUid = (uid: string) => {
    return allUsers.find(u => u.uid === uid);
  };

  // Check blocking relationship
  const isUserBlockedByMe = (uid: string) => {
    const me = getProfileByUid(loggedInUser?.uid || '');
    return me?.bloqueados?.includes(uid) || false;
  };

  const amIBlockedByUser = (uid: string) => {
    const match = getProfileByUid(uid);
    return match?.bloqueados?.includes(loggedInUser?.uid || '') || false;
  };

  // Calculate Level XP helper progress
  const getXpProgress = () => {
    const currentXp = stats.highScore || 0;
    const requiredXp = stats.level * 1000;
    const percentage = Math.min(100, Math.floor((currentXp / requiredXp) * 100));
    return { current: currentXp, required: requiredXp, percentage };
  };

  // Filter and sort the community user directory
  const filteredUsersList = allUsers.filter(u => {
    if (u.uid === loggedInUser?.uid) return false; // hide self in directories
    
    // Check search query matches name or username
    const matchQuery = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()));
      
    if (!matchQuery) return false;

    // Apply active segment tab filter
    if (selectedUserFilter === 'friends') {
      const me = getProfileByUid(loggedInUser?.uid || '');
      return me?.amigos?.includes(u.uid) || false;
    }
    if (selectedUserFilter === 'online') {
      return u.statusOnline === 'online' || u.statusOnline === 'idle';
    }
    if (selectedUserFilter === 'verified') {
      return u.verificado === true;
    }
    if (selectedUserFilter === 'premium') {
      return u.premium === true;
    }
    return true;
  });

  // Directory pagination calculations
  const totalPages = Math.ceil(filteredUsersList.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsersList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Profile selection
  const activeProfile = viewedUserUid ? getProfileByUid(viewedUserUid) : profile;
  const isOwnProfile = !viewedUserUid || viewedUserUid === loggedInUser?.uid;

  // Render auth placeholder if not signed in
  if (!loggedInUser) {
    return (
      <div className="max-w-xl mx-auto my-12 px-6 text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-xl space-y-6">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <User className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight font-sans">Acesse seu Perfil GameZon</h2>
        <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
          Faça login para customizar seu perfil público, gerenciar conquistas, acompanhar amigos virtuais, subir de nível e faturar moedas na comunidade.
        </p>
        <button
          onClick={onOpenLogin}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black tracking-wide uppercase cursor-pointer transition-all shadow-md shadow-indigo-600/10"
        >
          Fazer Login ou Criar Conta
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-6 px-3 md:px-6 animate-fadeIn space-y-6">
      
      {/* Search and browse other players widget */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-[-20%] left-[-10%] w-56 h-56 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              <h2 className="text-md font-black uppercase tracking-wider text-slate-100">Procurar Jogadores na Arena</h2>
            </div>
            {viewedUserUid && (
              <button 
                onClick={() => { setViewedUserUid(null); playSound.click(); }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-colors flex items-center gap-1 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" /> Ver Meu Perfil
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Pesquisar por nome ou @username do jogador..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium font-sans"
              />
            </div>

            {/* Select filter segment */}
            <select
              value={selectedUserFilter}
              onChange={(e) => { setSelectedUserFilter(e.target.value as any); setCurrentPage(1); playSound.click(); }}
              className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-bold"
            >
              <option value="all">🌐 Todos os Jogadores</option>
              <option value="friends">👥 Meus Amigos</option>
              <option value="online">🟢 Jogadores Online</option>
              <option value="verified">🛡️ Apenas Verificados</option>
              <option value="premium">👑 Apenas Assinantes Premium</option>
            </select>
          </div>

          {/* Directory Results */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {paginatedUsers.map((u) => {
              const isFriend = profile?.amigos?.includes(u.uid);
              const hasSentRequest = u.solicitacoesAmizade?.includes(loggedInUser.uid);
              const hasReceivedRequest = profile?.solicitacoesAmizade?.includes(u.uid);
              const isOnline = u.statusOnline === 'online';
              const isIdle = u.statusOnline === 'idle';

              return (
                <div 
                  key={u.uid} 
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                    u.premium 
                      ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/60' 
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                  onClick={() => { setViewedUserUid(u.uid); playSound.click(); }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative shrink-0">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Online dot indicator */}
                      <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        isOnline ? 'bg-emerald-500' : isIdle ? 'bg-amber-500' : 'bg-slate-500'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold truncate block text-slate-100">{u.name}</span>
                        {u.verificado && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" title="Verificado" />}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 truncate block">
                        {u.username ? `@${u.username}` : u.email.split('@')[0]}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400">
                    <span className="flex items-center gap-0.5"><Sparkles className="w-3 h-3 text-amber-500" /> Nível {u.stats?.level || 1}</span>
                    <span className="font-bold flex items-center gap-0.5"><ThumbsUp className="w-3 h-3 text-indigo-400" /> {u.reputacao ?? 0}</span>
                  </div>
                </div>
              );
            })}

            {filteredUsersList.length === 0 && (
              <div className="col-span-full py-6 text-center text-xs text-slate-400 font-medium">
                Nenhum outro jogador encontrado nos filtros selecionados.
              </div>
            )}
          </div>

          {/* Directory Pagination Controls */}
          {filteredUsersList.length > itemsPerPage && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/50 text-xs">
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(1, prev - 1)); playSound.click(); }}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 disabled:opacity-30 rounded-lg cursor-pointer font-bold"
              >
                Anterior
              </button>
              <span className="text-slate-400 font-mono">Página {currentPage} de {totalPages}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(totalPages, prev + 1)); playSound.click(); }}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 disabled:opacity-30 rounded-lg cursor-pointer font-bold"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Single-View Visual Profile Hub */}
      {activeProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT PANEL: User Info & Reputation Block */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Visual Profile Avatar & Identity Card */}
            <div className={`border rounded-3xl p-6 text-center relative overflow-hidden shadow-xl ${
              activeProfile.premium 
                ? 'bg-gradient-to-b from-amber-500/10 via-slate-950 to-slate-950 border-amber-500/40 text-white'
                : 'bg-slate-950 border-slate-800 text-white'
            }`}>
              {/* Premium Glow Aura Effect */}
              {activeProfile.premium && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-300 animate-pulse" />
              )}

              <div className="relative inline-block mt-4">
                {activeProfile.avatarUrl ? (
                  <img 
                    src={activeProfile.avatarUrl} 
                    alt={activeProfile.name} 
                    className={`w-28 h-28 rounded-2xl object-cover mx-auto shadow-2xl relative z-10 border-2 ${
                      activeProfile.premium ? 'border-amber-400 ring-4 ring-amber-500/20' : 'border-indigo-500/40'
                    }`} 
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-4xl font-black mx-auto shadow-2xl">
                    {activeProfile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Active verification badge overlapping */}
                {activeProfile.verificado && (
                  <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1 rounded-full border-2 border-slate-950 z-20 shadow-md">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-1.5">
                <div className="flex items-center justify-center gap-1.5">
                  <h3 className="text-lg font-black tracking-tight">{activeProfile.name}</h3>
                  {activeProfile.premium && (
                    <span className="text-[9px] font-black tracking-wider uppercase bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded shadow">
                      PRO
                    </span>
                  )}
                </div>
                {activeProfile.username && (
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-900/30 px-2.5 py-0.5 rounded-lg inline-block">
                    @{activeProfile.username}
                  </span>
                )}
                {activeProfile.location && (
                  <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1 pt-1 font-semibold">
                    <MapPin className="w-3 h-3 text-red-400" /> {activeProfile.location}
                  </span>
                )}
              </div>

              {/* Status Online indicator text */}
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] font-mono text-slate-400">
                <span className={`w-2 h-2 rounded-full ${
                  activeProfile.statusOnline === 'online' ? 'bg-emerald-500' : activeProfile.statusOnline === 'idle' ? 'bg-amber-500' : 'bg-slate-500'
                }`} />
                <span className="uppercase font-bold tracking-wider">
                  {activeProfile.statusOnline === 'online' ? 'Online' : activeProfile.statusOnline === 'idle' ? 'Ausente' : 'Offline'}
                </span>
              </div>

              {/* level progress container */}
              <div className="mt-6 pt-5 border-t border-slate-900 text-left space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Nível {isOwnProfile ? stats.level : (activeProfile.stats?.level || 1)}
                  </span>
                  <span className="text-slate-500">
                    {getXpProgress().current} / {getXpProgress().required} XP
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${getXpProgress().percentage}%` }}
                  />
                </div>
              </div>

              {/* Coins & Reputation metric widgets */}
              <div className="grid grid-cols-2 gap-2.5 mt-6 pt-5 border-t border-slate-900 text-left">
                
                {/* Coins panel (subject to privacy setting hideCoins) */}
                {(!activeProfile.privacySettings?.hideCoins || isOwnProfile) ? (
                  <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-2xl text-center space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Saldo Coins</span>
                    <span className="text-sm font-black text-amber-400">
                      🪙 {isOwnProfile ? stats.coins : (activeProfile.stats?.coins ?? 150)}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-2xl text-center flex items-center justify-center text-[10px] text-slate-500 font-mono italic">
                    <Lock className="w-3.5 h-3.5 mr-1 text-slate-600" /> Oculto
                  </div>
                )}

                {/* Reputation panel */}
                <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-2xl text-center space-y-0.5">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Reputação</span>
                  <span className="text-sm font-black text-indigo-400">
                     {activeProfile.reputacao ?? 0}
                  </span>
                </div>
              </div>

              {/* Reputation voting controls for community viewer */}
              {!isOwnProfile && (
                <div className="mt-4 pt-4 border-t border-slate-900 flex items-center justify-between gap-2 bg-slate-900/20 p-2.5 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold block">Avaliar Jogador:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleReputationVote(activeProfile.uid, 'up')}
                      className={`p-1.5 rounded-xl cursor-pointer transition-colors ${
                        activeProfile.reputacaoVotos?.[loggedInUser.uid] === 'up'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white'
                      }`}
                      title="Recomendar Positivamente (+1 Reputação)"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleReputationVote(activeProfile.uid, 'down')}
                      className={`p-1.5 rounded-xl cursor-pointer transition-colors ${
                        activeProfile.reputacaoVotos?.[loggedInUser.uid] === 'down'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white'
                      }`}
                      title="Recomendar Negativamente (-1 Reputação)"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Preset Quick Badges Shelf */}
              <div className="mt-5 pt-4 border-t border-slate-900 space-y-2 text-left">
                <span className="text-[9px] font-black font-mono text-slate-400 uppercase tracking-wider block">Emblemas Ativos</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-bold bg-indigo-950/80 border border-indigo-900/40 text-indigo-400 px-2 py-0.5 rounded flex items-center gap-0.5">
                    <Award className="w-3 h-3 text-indigo-400" /> Pioneiro
                  </span>
                  {activeProfile.premium && (
                    <span className="text-[10px] font-bold bg-amber-950/80 border border-amber-900/40 text-amber-400 px-2 py-0.5 rounded flex items-center gap-0.5">
                      <Zap className="w-3 h-3 text-amber-400" /> Premium VIP
                    </span>
                  )}
                  {activeProfile.reputacao !== undefined && activeProfile.reputacao >= 5 && (
                    <span className="text-[10px] font-bold bg-emerald-950/80 border border-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded flex items-center gap-0.5">
                      <Heart className="w-3 h-3 text-emerald-400" /> Amigável
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links Panel Display */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-md space-y-4">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider block border-b border-slate-100 pb-2">
                Redes Sociais & Contatos
              </h4>
              <div className="space-y-3">
                {activeProfile.socialNetworks?.twitter && (
                  <a href={`https://twitter.com/${activeProfile.socialNetworks.twitter}`} target="_blank" rel="noreferrer" className="flex items-center justify-between text-xs text-slate-600 hover:text-indigo-600 font-medium">
                    <span className="flex items-center gap-2"><Twitter className="w-4 h-4 text-sky-400" /> Twitter (X)</span>
                    <span className="font-mono text-slate-400">@{activeProfile.socialNetworks.twitter}</span>
                  </a>
                )}
                {activeProfile.socialNetworks?.github && (
                  <a href={`https://github.com/${activeProfile.socialNetworks.github}`} target="_blank" rel="noreferrer" className="flex items-center justify-between text-xs text-slate-600 hover:text-indigo-600 font-medium">
                    <span className="flex items-center gap-2"><Github className="w-4 h-4 text-slate-800" /> GitHub</span>
                    <span className="font-mono text-slate-400">/{activeProfile.socialNetworks.github}</span>
                  </a>
                )}
                {activeProfile.socialNetworks?.youtube && (
                  <a href={`https://youtube.com/${activeProfile.socialNetworks.youtube}`} target="_blank" rel="noreferrer" className="flex items-center justify-between text-xs text-slate-600 hover:text-indigo-600 font-medium">
                    <span className="flex items-center gap-2"><Youtube className="w-4 h-4 text-red-500" /> YouTube</span>
                    <span className="font-mono text-slate-400">/{activeProfile.socialNetworks.youtube}</span>
                  </a>
                )}
                {activeProfile.socialNetworks?.discord && (
                  <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-400" /> Discord</span>
                    <span className="font-mono text-slate-400">{activeProfile.socialNetworks.discord}</span>
                  </div>
                )}
                {!activeProfile.socialNetworks?.twitter && !activeProfile.socialNetworks?.github && !activeProfile.socialNetworks?.youtube && !activeProfile.socialNetworks?.discord && (
                  <p className="text-[11px] text-slate-400 italic">Nenhum contato social informado.</p>
                )}
              </div>

              {/* Custom External Links Display List */}
              {activeProfile.links && activeProfile.links.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Links de Interesse</span>
                  <div className="space-y-1.5">
                    {activeProfile.links.map((lk, idx) => (
                      <a 
                        key={idx} 
                        href={lk.startsWith('http') ? lk : `https://${lk}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1.5 truncate"
                      >
                        <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {lk}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* General Actions Block (Add Friend, Follow, Report, Block) */}
            {!isOwnProfile && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-md space-y-2.5">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider block border-b border-slate-100 pb-2">
                  Ações de Relacionamento
                </h4>
                
                {/* Friendship button flow */}
                <div className="space-y-1.5">
                  {profile?.amigos?.includes(activeProfile.uid) ? (
                    <button
                      onClick={() => handleFriendshipAction(activeProfile.uid, 'remove')}
                      className="w-full py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-black tracking-wide uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <UserMinus className="w-4 h-4" /> Desfazer Amizade
                    </button>
                  ) : activeProfile.solicitacoesAmizade?.includes(loggedInUser.uid) ? (
                    <button
                      disabled
                      className="w-full py-2.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-xs font-black tracking-wide uppercase flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Solicitação Pendente
                    </button>
                  ) : profile?.solicitacoesAmizade?.includes(activeProfile.uid) ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleFriendshipAction(activeProfile.uid, 'accept')}
                        className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black tracking-wide uppercase cursor-pointer transition-all"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => handleFriendshipAction(activeProfile.uid, 'decline')}
                        className="py-2.5 bg-slate-100 hover:bg-slate-250 text-slate-600 rounded-xl text-xs font-black tracking-wide uppercase cursor-pointer transition-all"
                      >
                        Recusar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleFriendshipAction(activeProfile.uid, 'send')}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black tracking-wide uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" /> Adicionar Amigo
                    </button>
                  )}

                  {/* Follow button */}
                  <button
                    onClick={() => handleToggleFollow(activeProfile.uid)}
                    className={`w-full py-2.5 border rounded-xl text-xs font-black tracking-wide uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      profile?.following?.includes(activeProfile.uid)
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
                        : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    {profile?.following?.includes(activeProfile.uid) ? 'Deixar de Seguir' : 'Seguir Jogador'}
                  </button>

                  <div className="grid grid-cols-2 gap-2 pt-1.5">
                    {/* Block button */}
                    {profile?.bloqueados?.includes(activeProfile.uid) ? (
                      <button
                        onClick={() => handleBlockAction(activeProfile.uid, 'unblock')}
                        className="py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer text-center"
                      >
                        Desbloquear
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBlockAction(activeProfile.uid, 'block')}
                        className="py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer text-center"
                      >
                        Bloquear
                      </button>
                    )}

                    {/* Report button */}
                    <button
                      onClick={() => { playSound.click(); setShowReportModal(activeProfile.uid); }}
                      className="py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Denunciar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Interactive Tabs, Forms, Stores, Inventory & History */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upper Custom Banner Area */}
            <div className="h-44 md:h-52 w-full rounded-3xl overflow-hidden relative border border-slate-200 shadow-lg group">
              <img 
                src={activeProfile.bannerUrl || PRESET_BANNERS[0]} 
                alt="Banner" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
              
              {/* Change banner trigger overlay for own profile */}
              {isOwnProfile && (
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <label htmlFor="banner-file-upload" className="px-3 py-1.5 bg-black/70 hover:bg-black/90 backdrop-blur border border-white/20 text-white rounded-lg text-[10px] font-extrabold cursor-pointer uppercase tracking-wider flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" /> Mudar Banner
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="banner-file-upload" 
                    onChange={handleBannerFileUpload} 
                    className="hidden" 
                  />
                </div>
              )}
            </div>

            {/* Sub Tabs Selection Panel */}
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex items-center gap-1 overflow-x-auto scrollbar-none text-white">
              <button
                onClick={() => { playSound.click(); setActiveSubTab('details'); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap shrink-0 ${
                  activeSubTab === 'details' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isOwnProfile ? '⚙️ Configurações' : '👤 Sobre'}
              </button>
              <button
                onClick={() => { playSound.click(); setActiveSubTab('connections'); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap shrink-0 ${
                  activeSubTab === 'connections' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                👥 Amigos ({activeProfile.amigos?.length || 0})
              </button>
              <button
                onClick={() => { playSound.click(); setActiveSubTab('inventory'); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap shrink-0 ${
                  activeSubTab === 'inventory' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🎒 Inventário
              </button>
              <button
                onClick={() => { playSound.click(); setActiveSubTab('history'); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap shrink-0 ${
                  activeSubTab === 'history' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                📜 Histórico
              </button>
              <button
                onClick={() => { playSound.click(); setActiveSubTab('stores'); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap shrink-0 ${
                  activeSubTab === 'stores' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🏪 Lojas ({activeProfile.stores?.length || 0})
              </button>
              <button
                onClick={() => { playSound.click(); setActiveSubTab('files'); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap shrink-0 ${
                  activeSubTab === 'files' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                📂 Arquivos
              </button>
            </div>

            {/* TAB CONTENT: Details / Edit Form */}
            {activeSubTab === 'details' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md">
                
                {isOwnProfile ? (
                  <form onSubmit={handleSaveProfileDetails} className="space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="text-md font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                        <Settings className="w-5 h-5 text-indigo-600" /> Configurações de Identidade
                      </h3>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleVerifyRequest}
                          disabled={profile?.verificado}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                            profile?.verificado 
                              ? 'bg-blue-50 border border-blue-200 text-blue-600' 
                              : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                          }`}
                        >
                          {profile?.verificado ? 'Conta Verificada' : 'Solicitar Verificação 🛡️'}
                        </button>
                        <button
                          type="button"
                          onClick={handlePremiumToggle}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                            profile?.premium 
                              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold' 
                              : 'bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold'
                          }`}
                        >
                          {profile?.premium ? 'Ativo: VIP Premium' : 'Adquirir VIP Premium 👑'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Nome Público</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Username (@)</label>
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          placeholder="nomedeusuario"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono font-bold"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Biografia Curta</label>
                        <textarea
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          placeholder="Fale um pouco sobre você..."
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Localização / Região</label>
                        <input
                          type="text"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          placeholder="Ex: São Paulo, Brasil"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Custom Banner URL (ou preset)</label>
                        <input
                          type="text"
                          value={editBannerUrl}
                          onChange={(e) => setEditBannerUrl(e.target.value)}
                          placeholder="https://exemplo.com/banner.png"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono"
                        />
                      </div>
                    </div>

                    {/* Social networks links section */}
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3.5">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                        Conectar Redes Sociais
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Twitter (X) Username</label>
                          <input type="text" value={editTwitter} onChange={e => setEditTwitter(e.target.value)} placeholder="usuario" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">GitHub Username</label>
                          <input type="text" value={editGithub} onChange={e => setEditGithub(e.target.value)} placeholder="usuario" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">YouTube Channel ID</label>
                          <input type="text" value={editYoutube} onChange={e => setEditYoutube(e.target.value)} placeholder="canal" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Discord Tag</label>
                          <input type="text" value={editDiscord} onChange={e => setEditDiscord(e.target.value)} placeholder="tag#0000" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                      </div>
                    </div>

                    {/* Links list modifier */}
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                        Meus Links Personalizados
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newLinkInput}
                          onChange={(e) => setNewLinkInput(e.target.value)}
                          placeholder="https://meusite.com"
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <button 
                          type="button" 
                          onClick={handleAddLink}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Adicionar Link
                        </button>
                      </div>
                      
                      {editLinks.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {editLinks.map((lk, idx) => (
                            <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                              <LinkIcon className="w-3 h-3 text-slate-400" /> {lk}
                              <button type="button" onClick={() => handleRemoveLink(lk)} className="text-red-500 hover:text-red-700 font-extrabold text-xs ml-1 cursor-pointer">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Privacy configurations section */}
                    <div className="p-4 bg-red-50/20 border border-red-100 rounded-2xl space-y-3">
                      <span className="text-[10px] font-black text-red-700 uppercase tracking-wider block flex items-center gap-1">
                        <Lock className="w-4 h-4 text-red-600" /> Configurações de Privacidade do Perfil
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 font-bold">
                        <label className="flex items-center gap-2 cursor-pointer p-1">
                          <input type="checkbox" checked={privateProfile} onChange={e => setPrivateProfile(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                          <span>Tornar perfil 100% privado 🔒</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-1">
                          <input type="checkbox" checked={hideCoins} onChange={e => setHideCoins(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                          <span>Esconder saldo de coins no perfil</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-1">
                          <input type="checkbox" checked={hideHistory} onChange={e => setHideHistory(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                          <span>Ocultar histórico de atividade de jogo</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-1">
                          <input type="checkbox" checked={hideFollowers} onChange={e => setHideFollowers(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                          <span>Ocultar seguidores da comunidade</span>
                        </label>
                      </div>
                    </div>

                    {/* Save actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                      {saveSuccess && (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-pulse">
                          <Check className="w-4.5 h-4.5" /> Suas alterações foram salvas com sucesso!
                        </span>
                      )}
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow flex items-center gap-1.5"
                      >
                        {isSaving ? "Salvando..." : "Salvar Alterações"}
                      </button>
                    </div>
                  </form>
                ) : (
                  // public view about details of another user
                  <div className="space-y-6">
                    <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-md font-black text-slate-800 uppercase tracking-tight">
                        Biografia do Jogador
                      </h3>
                      {activeProfile.verificado && (
                        <span className="text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-600 px-2 py-0.5 rounded flex items-center gap-0.5">
                          🛡️ Verificado
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {activeProfile.biography || "Este jogador ainda não preencheu sua biografia no GameZon."}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block font-mono">STATUS DA CONTA</span>
                        <span className="text-xs font-black text-slate-800">
                          {activeProfile.premium ? 'Assinante Premium VIP 👑' : 'Jogador Convencional 👤'}
                        </span>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block font-mono">CADASTRO NA ARENA</span>
                        <span className="text-xs font-black text-slate-800">
                          Membro Fundador do GameZon
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB CONTENT: Connections & Friendships */}
            {activeSubTab === 'connections' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md space-y-6">
                
                {/* Enforce private profile rules */}
                {(!isOwnProfile && activeProfile.privacySettings?.privateProfile) ? (
                  <div className="text-center py-12 space-y-3">
                    <Lock className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-500 font-bold">Este perfil é privado. As conexões do jogador estão ocultas.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Friends Shelf */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider block border-b border-slate-100 pb-2 flex items-center gap-1">
                        <Users className="w-4 h-4 text-indigo-500" /> Amigos ({activeProfile.amigos?.length || 0})
                      </h4>
                      {activeProfile.amigos && activeProfile.amigos.length > 0 ? (
                        <div className="space-y-2">
                          {activeProfile.amigos.map(fUid => {
                            const match = getProfileByUid(fUid);
                            return (
                              <div key={fUid} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={() => setViewedUserUid(fUid)}>
                                  {match?.avatarUrl ? (
                                    <img src={match.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{match?.name.charAt(0).toUpperCase()}</div>
                                  )}
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-black text-slate-800 truncate leading-none">{match?.name || "Jogador"}</h5>
                                    {match?.username && <span className="text-[10px] text-slate-400 font-mono block mt-0.5">@{match.username}</span>}
                                  </div>
                                </div>
                                {isOwnProfile && (
                                  <button
                                    onClick={() => handleFriendshipAction(fUid, 'remove')}
                                    className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                                    title="Desfazer Amizade"
                                  >
                                    <UserMinus className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Nenhum amigo conectado ainda.</p>
                      )}
                    </div>

                    {/* Followers Shelf */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider block border-b border-slate-100 pb-2">
                        Seguidores ({activeProfile.followers?.length || 0})
                      </h4>
                      {activeProfile.followers && activeProfile.followers.length > 0 ? (
                        <div className="space-y-2">
                          {activeProfile.followers.map(fUid => {
                            const match = getProfileByUid(fUid);
                            return (
                              <div key={fUid} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={() => setViewedUserUid(fUid)}>
                                  {match?.avatarUrl ? (
                                    <img src={match.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{match?.name.charAt(0).toUpperCase()}</div>
                                  )}
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-black text-slate-800 truncate leading-none">{match?.name || "Jogador"}</h5>
                                    {match?.username && <span className="text-[10px] text-slate-400 font-mono block mt-0.5">@{match.username}</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Nenhum seguidor ativo no momento.</p>
                      )}
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Game Inventory */}
            {activeSubTab === 'inventory' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md space-y-4">
                <h3 className="text-md font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-indigo-600" /> Inventário de Equipamentos & Skins
                </h3>

                {(!isOwnProfile && activeProfile.privacySettings?.privateProfile) ? (
                  <div className="text-center py-12 space-y-3">
                    <Lock className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-500 font-bold">Este perfil é privado. O inventário está oculto.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    {/* Map existing stats unlocked skins or items */}
                    {(isOwnProfile ? stats.unlockedSkins : (activeProfile.stats?.unlockedSkins || ['classic'])).map((skin: string) => (
                      <div key={skin} className="p-3 border border-slate-150 rounded-2xl text-center bg-slate-50/60 flex flex-col items-center justify-between space-y-2">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-extrabold text-sm uppercase">SK</div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black text-slate-700 block capitalize">{skin} Skin</span>
                          <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">Equipável</span>
                        </div>
                      </div>
                    ))}

                    {(isOwnProfile ? stats.unlockedAccessories : (activeProfile.stats?.unlockedAccessories || ['none'])).map((acc: string) => (
                      <div key={acc} className="p-3 border border-slate-150 rounded-2xl text-center bg-slate-50/60 flex flex-col items-center justify-between space-y-2">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-extrabold text-sm uppercase">AC</div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black text-slate-700 block capitalize">{acc}</span>
                          <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">Acessório</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Activity logs / history */}
            {activeSubTab === 'history' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md space-y-4">
                <h3 className="text-md font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                  <Clock className="w-5 h-5 text-indigo-600" /> Histórico de Atividades & Auditoria
                </h3>

                {(!isOwnProfile && (activeProfile.privacySettings?.hideHistory || activeProfile.privacySettings?.privateProfile)) ? (
                  <div className="text-center py-12 space-y-3">
                    <Lock className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-500 font-bold">O histórico de atividades está ocultado por privacidade.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    <div className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="font-bold text-slate-700">Login realizado com sucesso</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Atividade recente</span>
                    </div>
                    <div className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <span className="font-bold text-slate-700">Recorde de estágio alcançado na arena</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Estágio {isOwnProfile ? stats.currentStage : (activeProfile.stats?.currentStage || 1)}</span>
                    </div>
                    <div className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="font-bold text-slate-700">Conexão estabelecida de dispositivo confiável</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Sucesso</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Stores */}
            {activeSubTab === 'stores' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md space-y-6">
                
                {(!isOwnProfile && activeProfile.privacySettings?.privateProfile) ? (
                  <div className="text-center py-12 space-y-3">
                    <Lock className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-500 font-bold">Este perfil é privado. As lojas estão ocultas.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-md font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                          <Store className="w-5 h-5 text-indigo-600" /> Lojas Virtuais
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Gerenciamento de estabelecimentos comerciais.</p>
                      </div>
                      {isOwnProfile && !isCreatingStore && (
                        <button
                          onClick={() => { playSound.click(); setIsCreatingStore(true); }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-4 h-4" /> Criar Loja
                        </button>
                      )}
                    </div>

                    {isCreatingStore && (
                      <form onSubmit={handleCreateStore} className="p-4 border border-slate-200 bg-slate-50 rounded-2xl space-y-3">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider block">Criar Loja Comercial</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Nome</label>
                            <input
                              type="text"
                              value={newStoreName}
                              onChange={(e) => setNewStoreName(e.target.value)}
                              required
                              placeholder="Minha loja"
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Categoria</label>
                            <select
                              value={newStoreCategory}
                              onChange={(e) => setNewStoreCategory(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                            >
                              <option value="Jogos">Jogos & Contas</option>
                              <option value="Serviços">Serviços & Boosts</option>
                              <option value="Colecionáveis">Colecionáveis & Skins</option>
                              <option value="Outros">Outros Negócios</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Descrição</label>
                            <textarea
                              value={newStoreDescription}
                              onChange={(e) => setNewStoreDescription(e.target.value)}
                              placeholder="O que você vende?"
                              rows={2}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setIsCreatingStore(false)} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold">Cancelar</button>
                          <button type="submit" className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold">Confirmar</button>
                        </div>
                      </form>
                    )}

                    {activeProfile.stores && activeProfile.stores.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {activeProfile.stores.map((store, i) => (
                          <div key={store.id || i} className="border border-slate-150 p-4 rounded-2xl relative flex flex-col justify-between space-y-3">
                            {isOwnProfile && (
                              <button
                                onClick={() => handleDeleteStore(store.id)}
                                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <div className="space-y-1 pr-6">
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                {store.category}
                              </span>
                              <h4 className="text-xs font-black text-slate-800 mt-1.5">{store.name}</h4>
                              <p className="text-[11px] text-slate-500 leading-relaxed">{store.description}</p>
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                              <span>Iniciado: {store.createdAt}</span>
                              <span className="font-extrabold text-indigo-600">Saldo: 🪙 {store.balance?.toFixed(2) || '0.00'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-xs text-slate-400 italic">
                        Nenhuma loja comercial cadastrada ainda.
                      </div>
                    )}
                  </>
                )}

              </div>
            )}

            {/* TAB CONTENT: Vault Files */}
            {activeSubTab === 'files' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md space-y-6">
                
                {(!isOwnProfile && activeProfile.privacySettings?.privateProfile) ? (
                  <div className="text-center py-12 space-y-3">
                    <Lock className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-500 font-bold">Este perfil é privado. Os arquivos estão ocultos.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-md font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                        <Folder className="w-5 h-5 text-indigo-600" /> Arquivos Públicos & Vault
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Veja e acesse arquivos de utilidade salvos na conta.</p>
                    </div>

                    {isOwnProfile && (
                      <div 
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center space-y-2 relative transition-all ${
                          dragActive ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="text-[10px] font-bold text-slate-600">Arraste e solte ou clique para selecionar arquivos</p>
                      </div>
                    )}

                    {fileToUpload && (
                      <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <span className="font-bold text-slate-700 truncate">{fileToUpload.name}</span>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => setFileToUpload(null)} className="text-[10px] font-bold text-slate-500">Cancelar</button>
                          <button onClick={handleUploadUserFile} disabled={isUploadingFile} className="px-3 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold">
                            {isUploadingFile ? "Enviando..." : "Enviar"}
                          </button>
                        </div>
                      </div>
                    )}

                    {activeProfile.files && activeProfile.files.length > 0 ? (
                      <div className="border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-100">
                        {activeProfile.files.map((file, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                            <div className="min-w-0 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-800 truncate block">{file.name}</span>
                                <span className="text-[9px] font-mono text-slate-400 block">{file.size} • {file.uploadedAt}</span>
                              </div>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <a href={file.url} target="_blank" rel="noreferrer" className="p-1 text-indigo-500 hover:bg-indigo-50 rounded">
                                <Eye className="w-4 h-4" />
                              </a>
                              {isOwnProfile && (
                                <button onClick={() => handleDeleteUserFile(idx)} className="p-1 text-slate-400 hover:text-red-500 rounded">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-xs text-slate-400 italic">
                        Nenhum arquivo listado.
                      </div>
                    )}
                  </>
                )}

              </div>
            )}

          </div>

        </div>
      )}

      {/* REPORT USER MODAL */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-md font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                  <ShieldAlert className="w-5 h-5 text-red-500" /> Denunciar Jogador na Arena
                </h3>
                <button onClick={() => { playSound.click(); setShowReportModal(null); }} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Motivo da Denúncia</label>
                  <select
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="">Selecione um motivo...</option>
                    <option value="HateSpeech">Discurso de Ódio / Ofensas</option>
                    <option value="Cheating">Uso de Cheats / Trapaças</option>
                    <option value="Scam">Golpe / Fraude Comercial</option>
                    <option value="Toxic">Comportamento Tóxico / Spam</option>
                    <option value="Other">Outro Motivo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Descrição detalhada do incidente</label>
                  <textarea
                    value={reportDescription}
                    onChange={e => setReportDescription(e.target.value)}
                    placeholder="Forneça links de logs, evidências ou descreva o ocorrido de forma detalhada..."
                    rows={4}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => { playSound.click(); setShowReportModal(null); }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Enviar Denúncia de Segurança
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
