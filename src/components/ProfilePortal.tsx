import React, { useState, useEffect } from 'react';
import { AppUser } from './AuthModal';
import { PlayerStats } from '../types';
import { 
  User, 
  Sparkles, 
  Camera, 
  BookOpen, 
  Check, 
  Trash2, 
  Plus, 
  Store, 
  FileText, 
  Users, 
  UploadCloud, 
  Folder, 
  Download, 
  Eye, 
  UserMinus,
  Briefcase,
  X
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
  username?: string;
  avatarUrl?: string;
  biography?: string;
  followers: string[];
  following: string[];
  stores: any[];
  files: any[];
  avatarGallery?: string[];
}

export const ProfilePortal: React.FC<ProfilePortalProps> = ({
  loggedInUser,
  setLoggedInUser,
  onOpenLogin,
  stats,
  updateStats
}) => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [avatarGallery, setAvatarGallery] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // File management states
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Store creation states
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState('Jogos');
  const [newStoreDescription, setNewStoreDescription] = useState('');

  // All users (for follow system display)
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Active sub-section
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'stores' | 'files' | 'connections'>('details');

  // Fetch the logged-in user profile details
  const fetchProfile = async () => {
    if (!loggedInUser) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/profile?userId=${loggedInUser.uid}`);
      if (response.ok) {
        const data = await response.json();
        // Since profile comes from server, fetch all platform users too
        const usersRes = await fetch('/api/user/users');
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setAllUsers(usersData.users);
          
          // Find matching profile from the users list to get raw details
          const matched = usersData.users.find((u: any) => u.uid === loggedInUser.uid);
          if (matched) {
            setProfile(matched);
            setEditName(matched.rawName || matched.name || '');
            setEditUsername(matched.username || '');
            setEditBio(matched.biography || '');
            setEditAvatarUrl(matched.avatarUrl || '');
            setAvatarGallery(matched.avatarGallery || []);
          } else {
            // Fallback to local default if not found
            setProfile({
              uid: loggedInUser.uid,
              email: loggedInUser.email,
              name: loggedInUser.name,
              followers: [],
              following: [],
              stores: [],
              files: []
            });
            setEditName(loggedInUser.name);
          }
        }
      }
    } catch (e) {
      console.error('Error loading user profile:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [loggedInUser]);

  const handleSaveProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) return;
    setIsSaving(true);
    setSaveSuccess(false);
    playSound.click();

    try {
      // Auto-save the new avatar to the gallery if it doesn't already exist in it
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
          username: editUsername.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase(), // clean username
          biography: editBio,
          avatar: editAvatarUrl,
          avatarGallery: updatedGallery
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSaveSuccess(true);
        playSound.victory();
        
        // Update App level user state
        setLoggedInUser({
          ...loggedInUser,
          name: editName,
          avatarUrl: editAvatarUrl || undefined
        });

        // Trigger auto-dismiss success
        setTimeout(() => setSaveSuccess(false), 3000);
        fetchProfile();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
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

  // Drag and drop handlers
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

  // Profile image upload
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
        console.error('File upload failed:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Upload user files
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

        // Save updated files array to server
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

  // Delete user file
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

  // Create store handler
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

  // Delete store handler
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

  // Unfollow user handler
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

  if (!loggedInUser) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4 text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-xl space-y-6">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <User className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight font-sans">Acesse sua Conta</h2>
        <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
          Faça login para gerenciar seu perfil de jogador, acompanhar seguidores, enviar arquivos locais, e abrir lojas digitais.
        </p>
        <button
          onClick={onOpenLogin}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black tracking-wide uppercase cursor-pointer transition-all shadow-md shadow-indigo-600/10"
        >
          Fazer Login ou Criar Perfil
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto my-6 px-3 md:px-6 animate-fadeIn space-y-6">
      
      {/* Upper Profile Display Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-[-40%] right-[-10%] w-64 h-64 bg-indigo-500/15 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          {/* Avatar Container */}
          <div className="relative group shrink-0">
            {profile?.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt={profile.name} 
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-black ring-4 ring-indigo-500/20 shadow-xl">
                {profile?.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="text-center md:text-left space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-xl md:text-2xl font-black tracking-tight">{profile?.name}</h2>
              {profile?.username && (
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-900/50 px-2 py-0.5 rounded-lg">
                  @{profile.username}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-xl truncate">
              {profile?.biography || "Nenhuma biografia informada ainda. Clique em 'Editar Perfil' abaixo para contar mais sobre você!"}
            </p>

            {/* Quick Stats Metrics display */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-mono pt-1 text-slate-400">
              <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> Nível {stats.level}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-indigo-400" /> {profile?.followers?.length || 0} seguidores</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-purple-400" /> {profile?.following?.length || 0} seguindo</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 mt-6 border-t border-slate-800/80 pt-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => { playSound.click(); setActiveSubTab('details'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeSubTab === 'details'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Editar Detalhes 👤
          </button>
          <button
            onClick={() => { playSound.click(); setActiveSubTab('stores'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeSubTab === 'stores'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Minhas Lojas ({profile?.stores?.length || 0}) 🏪
          </button>
          <button
            onClick={() => { playSound.click(); setActiveSubTab('files'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeSubTab === 'files'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Meus Arquivos ({profile?.files?.length || 0}) 📂
          </button>
          <button
            onClick={() => { playSound.click(); setActiveSubTab('connections'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeSubTab === 'connections'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Seguidores & Seguindo 👥
          </button>
        </div>
      </div>

      {/* Main Interactive Sub-views */}
      {activeSubTab === 'details' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md">
          <h3 className="text-lg font-black text-slate-800 tracking-tight font-sans mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            Configurações e Detalhes do Perfil
          </h3>

          <form onSubmit={handleSaveProfileDetails} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">Nome do Jogador</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                placeholder="Seu nome completo"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">Nome de Usuário (Username)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold font-mono">@</span>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="nomedeusuario"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 font-mono font-medium"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">Biografia do Jogador</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Escreva algo sobre você, suas conquistas nos jogos ou o que mais quiser compartilhar na Arena..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">Foto de Perfil (Avatar)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <input
                  type="text"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://exemplo.com/sua-foto.png"
                  className="w-full sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-mono"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileUpload}
                    id="avatar-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 text-slate-500" />
                    Upload de Imagem
                  </label>
                </div>
              </div>

              {/* INTERACTIVE AVATAR GALLERY DATABASE DISPLAY */}
              <div className="mt-4 p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
                    Sua Galeria de Avatares (Banco de Dados)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {avatarGallery.length} {avatarGallery.length === 1 ? 'foto' : 'fotos'} salva(s)
                  </span>
                </div>
                
                {avatarGallery.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {avatarGallery.map((imgUrl, index) => {
                      const isActive = editAvatarUrl === imgUrl;
                      return (
                        <div key={index} className="relative group shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              playSound.click();
                              setEditAvatarUrl(imgUrl);
                            }}
                            className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all block relative cursor-pointer ${
                              isActive 
                                ? 'border-indigo-600 ring-2 ring-indigo-600/30 shadow-md scale-105' 
                                : 'border-slate-200 hover:border-slate-400 hover:scale-105'
                            }`}
                          >
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                            {isActive && (
                              <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white drop-shadow" />
                              </div>
                            )}
                          </button>
                          
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveFromGallery(imgUrl)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Remover da galeria"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    Nenhuma foto salva na galeria ainda. Ao alterar seu avatar e salvar suas configurações, a imagem será gravada de forma duradoura no seu banco de dados de perfil!
                  </p>
                )}
              </div>
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              {saveSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-pulse">
                  <Check className="w-4 h-4" /> Configurações salvas com sucesso!
                </span>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black tracking-wide uppercase cursor-pointer transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
              >
                {isSaving ? "Salvando..." : "Salvar Configurações"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeSubTab === 'stores' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight font-sans flex items-center gap-2">
                <Store className="w-5 h-5 text-indigo-600" />
                Minhas Lojas Virtuais
              </h3>
              <p className="text-xs text-slate-400 mt-1">Crie e gerencie seus próprios comércios para faturar com moedas na plataforma.</p>
            </div>
            {!isCreatingStore && (
              <button
                onClick={() => { playSound.click(); setIsCreatingStore(true); }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" /> Criar Nova Loja
              </button>
            )}
          </div>

          {isCreatingStore && (
            <form onSubmit={handleCreateStore} className="p-5 border border-slate-200 bg-slate-50 rounded-2xl space-y-4 animate-scaleIn">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider block">Criar Nova Loja Comercial</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Nome da Loja</label>
                  <input
                    type="text"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    required
                    placeholder="Ex: Armas & Skins Lendárias"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Categoria</label>
                  <select
                    value={newStoreCategory}
                    onChange={(e) => setNewStoreCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Jogos">Jogos & Contas</option>
                    <option value="Serviços">Serviços & Boosts</option>
                    <option value="Colecionáveis">Colecionáveis & Skins</option>
                    <option value="Outros">Outros Negócios</option>
                  </select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Descrição do Negócio</label>
                  <textarea
                    value={newStoreDescription}
                    onChange={(e) => setNewStoreDescription(e.target.value)}
                    placeholder="Descreva que tipo de itens ou serviços você comercializará nesta loja..."
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingStore(false)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                >
                  Confirmar Abertura de Loja
                </button>
              </div>
            </form>
          )}

          {/* List of current stores */}
          {profile?.stores && profile.stores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.stores.map((store, i) => (
                <div key={store.id || i} className="border border-slate-150 p-4 rounded-2xl hover:border-slate-300 hover:shadow-lg transition-all flex flex-col justify-between space-y-3 relative">
                  <button
                    onClick={() => handleDeleteStore(store.id)}
                    className="absolute top-4 right-4 p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer transition-colors"
                    title="Excluir Loja"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="space-y-1 pr-6">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {store.category}
                    </span>
                    <h4 className="text-sm font-black text-slate-800 leading-tight mt-1.5">{store.name}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">{store.description}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Início: {store.createdAt}</span>
                    <span className="font-extrabold text-indigo-600">Balanço: 🪙 {store.balance.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
              <Store className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400 font-bold">Você não possui nenhuma loja aberta no momento.</p>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Empreenda abrindo sua própria loja de itens virtuais e conquiste compradores da comunidade!</p>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'files' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight font-sans flex items-center gap-2">
              <Folder className="w-5 h-5 text-indigo-600" />
              Meus Arquivos & Documentos
            </h3>
            <p className="text-xs text-slate-400 mt-1">Armazene fotos de setups, áudios e arquivos locais de forma totalmente segura na plataforma.</p>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center space-y-3 transition-all relative ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-50/30' 
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              onChange={handleFileChange}
              id="user-file-uploader"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-slate-700">Arrastar & Soltar arquivo aqui ou clique para selecionar</p>
              <p className="text-[10px] text-slate-400 font-medium">Fotos, áudios, vídeos ou documentos de até 50MB</p>
            </div>
          </div>

          {fileToUpload && (
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between gap-3 animate-scaleIn">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{fileToUpload.name}</p>
                  <p className="text-[10px] font-mono text-slate-400">{(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFileToUpload(null)}
                  className="px-2.5 py-1 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  Remover
                </button>
                <button
                  onClick={handleUploadUserFile}
                  disabled={isUploadingFile}
                  className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  {isUploadingFile ? "Enviando..." : "Confirmar Envio"}
                </button>
              </div>
            </div>
          )}

          {/* Current file inventory */}
          {profile?.files && profile.files.length > 0 ? (
            <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-150">
              {profile.files.map((file, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                      {file.type?.includes('image') ? (
                        <img src={file.url} className="w-full h-full object-cover rounded-xl" alt="Preview" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">{file.name}</p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                        <span>Tamanho: {file.size}</span>
                        <span>•</span>
                        <span>Data: {file.uploadedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-indigo-50 text-indigo-500 rounded-lg cursor-pointer transition-colors"
                      title="Abrir arquivo"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteUserFile(idx)}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer transition-colors"
                      title="Excluir arquivo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
              <Folder className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400 font-bold">Nenhum arquivo ou documento salvo.</p>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Salve fotos de setups de forma segura diretamente na nuvem para manter seus registros!</p>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'connections' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight font-sans flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Comunidade da Arena & Conexões
            </h3>
            <p className="text-xs text-slate-400 mt-1">Conecte-se com outros jogadores seguindo os perfis e acompanhando suas interações.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Seguindo section */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider block border-b border-slate-100 pb-2">
                Pessoas que você segue ({profile?.following?.length || 0})
              </h4>
              {profile?.following && profile.following.length > 0 ? (
                <div className="space-y-2.5">
                  {profile.following.map(targetUid => {
                    const match = allUsers.find(u => u.uid === targetUid);
                    return (
                      <div key={targetUid} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {match?.avatarUrl ? (
                            <img src={match.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[11px] font-bold font-mono">U</div>
                          )}
                          <div className="min-w-0">
                            <h5 className="text-xs font-black text-slate-800 truncate leading-none">{match?.rawName || match?.name || "Jogador"}</h5>
                            {match?.username && <span className="text-[10px] text-slate-400 font-mono block mt-0.5">@{match.username}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleFollow(targetUid)}
                          className="px-2.5 py-1.5 hover:bg-red-50 text-red-600 rounded-xl text-[10px] font-extrabold cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <UserMinus className="w-3.5 h-3.5" /> Deixar de Seguir
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Você não segue nenhum jogador ainda.</p>
              )}
            </div>

            {/* Followers section */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider block border-b border-slate-100 pb-2">
                Seus Seguidores ({profile?.followers?.length || 0})
              </h4>
              {profile?.followers && profile.followers.length > 0 ? (
                <div className="space-y-2.5">
                  {profile.followers.map(targetUid => {
                    const match = allUsers.find(u => u.uid === targetUid);
                    return (
                      <div key={targetUid} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {match?.avatarUrl ? (
                            <img src={match.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[11px] font-bold font-mono font-extrabold">U</div>
                          )}
                          <div className="min-w-0">
                            <h5 className="text-xs font-black text-slate-800 truncate leading-none">{match?.rawName || match?.name || "Jogador"}</h5>
                            {match?.username && <span className="text-[10px] text-slate-400 font-mono block mt-0.5">@{match.username}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Nenhum seguidor no momento. Compartilhe recordes no Feed para ganhar destaque!</p>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
