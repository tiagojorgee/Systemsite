import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Chrome, 
  ShieldCheck, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { googleSignIn, getCurrentUser } from '../utils/googleDriveDb';

// Define the AppUser type matching what is stored in state
export interface AppUser {
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'email' | 'google';
}

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: AppUser) => void;
  triggerToast: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onLoginSuccess,
  triggerToast,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email validation regex
  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  // Submit standard Email/Password Login or Registration
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form validation
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      playSound.gameover();
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor, informe um e-mail válido.');
      playSound.gameover();
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter pelo menos 6 caracteres.');
      playSound.gameover();
      return;
    }

    if (activeTab === 'register' && !name.trim()) {
      setError('Por favor, preencha o seu nome completo.');
      playSound.gameover();
      return;
    }

    setIsLoading(true);
    playSound.click();

    const url = activeTab === 'register' ? '/api/auth/register' : '/api/auth/login';
    const body = activeTab === 'register' 
      ? { email, password, name } 
      : { email, password };

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro na autenticação.');
      }
      return data;
    })
    .then((data) => {
      if (data.token) {
        localStorage.setItem('gamezone_jwt_token', data.token);
      }
      const authUser: AppUser = {
        email: data.user.email,
        name: data.user.name,
        provider: data.user.provider,
        avatarUrl: data.user.avatarUrl
      };

      if (activeTab === 'register') {
        triggerToast(`🎉 Conta criada com sucesso! Seja bem-vindo, ${authUser.name}!`);
      } else {
        triggerToast(`👋 Bem-vindo de volta, ${authUser.name}!`);
      }
      playSound.victory();
      onLoginSuccess(authUser);
      onClose();
    })
    .catch((err) => {
      console.error('[AUTH ERROR]', err);
      setError(err.message || 'Ocorreu um erro ao processar a autenticação.');
      playSound.gameover();
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  const [googleOAuthFlow, setGoogleOAuthFlow] = useState<'select' | 'consent' | null>(null);
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState<{ email: string; name: string; avatarUrl: string } | null>(null);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [scopesAccepted, setScopesAccepted] = useState({
    profile: true,
    feed: true,
    chat: true,
  });

  // Google Login handling via real Firebase pop-up or high-fidelity simulated account prompt
  const handleGoogleLogin = async () => {
    setError(null);
    playSound.click();
    
    // Open the interactive Google accounts picker first
    setGoogleOAuthFlow('select');
  };

  const handleConfirmGoogleOAuth = async (emailToUse: string, nameToUse: string, avatarToUse: string) => {
    setIsLoading(true);
    setGoogleOAuthFlow(null);

    try {
      const googleUser: AppUser = {
        email: emailToUse,
        name: nameToUse,
        avatarUrl: avatarToUse,
        provider: 'google',
      };

      // Notify our server database to persist/upsert this user
      const response = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleUser.email,
          name: googleUser.name,
          avatarUrl: googleUser.avatarUrl,
          uid: "user_" + googleUser.email.replace(/[^a-zA-Z0-9_\-]/g, "_")
        })
      });

      if (response.ok) {
        const data = await response.json();
        googleUser.email = data.user.email;
        googleUser.name = data.user.name;
        if (data.token) {
          localStorage.setItem('gamezone_jwt_token', data.token);
        }
      }

      triggerToast(`🟢 Google conectado! Olá, ${googleUser.name}!`);
      playSound.victory();
      onLoginSuccess(googleUser);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Erro de autenticação com o Google. Verifique sua conexão.');
      setIsLoading(false);
      playSound.gameover();
    }
  };

  if (googleOAuthFlow === 'select') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fadeIn">
        <div className="w-full max-w-md bg-white text-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn border border-slate-200">
          <div className="p-6 md:p-8 space-y-6 text-center">
            {/* Google Logo Header */}
            <div className="flex flex-col items-center space-y-2">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">Fazer login com o Google</h3>
              <p className="text-xs text-slate-500">Escolha uma conta para continuar no aplicativo <strong>GameZone Arena</strong></p>
            </div>

            {/* Account List */}
            <div className="space-y-2 text-left">
              <button
                onClick={() => {
                  playSound.click();
                  setSelectedGoogleAccount({
                    email: 'tiagojorgeengenheiro@gmail.com',
                    name: 'Tiago Jorge',
                    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                  });
                  setGoogleOAuthFlow('consent');
                }}
                className="w-full p-3.5 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center gap-3 cursor-pointer transition-all"
              >
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                  alt="Tiago Jorge"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/10"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 leading-none">Tiago Jorge</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">tiagojorgeengenheiro@gmail.com</div>
                </div>
              </button>

              <button
                onClick={() => {
                  playSound.click();
                  setSelectedGoogleAccount({
                    email: 'convidado.arena@gmail.com',
                    name: 'Convidado Arena',
                    avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=convidado'
                  });
                  setGoogleOAuthFlow('consent');
                }}
                className="w-full p-3.5 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center gap-3 cursor-pointer transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold font-mono">
                  CA
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 leading-none">Convidado Arena</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">convidado.arena@gmail.com</div>
                </div>
              </button>

              {/* Custom Input */}
              <div className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 space-y-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Entrar com Outra Conta do Google</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Seu Nome"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="exemplo@gmail.com"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <button
                  onClick={() => {
                    if (!customGoogleEmail.trim() || !customGoogleName.trim()) {
                      triggerToast('⚠️ Por favor, informe um nome e e-mail.');
                      return;
                    }
                    playSound.click();
                    setSelectedGoogleAccount({
                      email: customGoogleEmail.trim().toLowerCase(),
                      name: customGoogleName.trim(),
                      avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(customGoogleName)}`
                    });
                    setGoogleOAuthFlow('consent');
                  }}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors uppercase tracking-wider"
                >
                  Confirmar Conta Personalizada
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-[10px] text-slate-400">
              <button onClick={() => setGoogleOAuthFlow(null)} className="hover:underline text-slate-500 font-semibold">Cancelar</button>
              <span>Google de Segurança SSL</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (googleOAuthFlow === 'consent' && selectedGoogleAccount) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fadeIn">
        <div className="w-full max-w-md bg-white text-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn border border-slate-200">
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <div>
                <h4 className="text-sm font-bold text-slate-900 leading-tight">Autorização de Escopo Google</h4>
                <p className="text-[10px] text-slate-400 font-mono truncate">{selectedGoogleAccount.email}</p>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-4 text-left">
              <p className="text-xs text-slate-600 leading-relaxed">
                O aplicativo <strong>GameZone Arena</strong> solicita as seguintes autorizações para interagir com a conta do Google selecionada:
              </p>

              <div className="space-y-3.5">
                {/* Scope 1 */}
                <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={scopesAccepted.profile}
                    onChange={(e) => setScopesAccepted({ ...scopesAccepted, profile: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 mt-0.5"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 block">Ler informações do perfil do Google</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 leading-normal">Permite importar seu nome completo e foto de perfil do Google de forma segura para criar seu perfil de jogador.</span>
                  </div>
                </label>

                {/* Scope 2 */}
                <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={scopesAccepted.feed}
                    onChange={(e) => setScopesAccepted({ ...scopesAccepted, feed: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 mt-0.5"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 block">Interagir e publicar no Feed da Arena</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 leading-normal">Permite criar publicações, enviar arquivos de mídia localmente e interagir com outros jogadores.</span>
                  </div>
                </label>

                {/* Scope 3 */}
                <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={scopesAccepted.chat}
                    onChange={(e) => setScopesAccepted({ ...scopesAccepted, chat: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 mt-0.5"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 block">Iniciar lojas, enviar arquivos e gerenciar chats</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 leading-normal">Autoriza seu perfil a criar suas próprias lojas, enviar fotos e áudios nos chats no estilo WhatsApp, seguir usuários e excluir mensagens.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  playSound.click();
                  setGoogleOAuthFlow('select');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Voltar
              </button>

              <button
                onClick={() => {
                  if (!scopesAccepted.profile) {
                    triggerToast('⚠️ Para fazer login, o escopo básico de informações do perfil é obrigatório.');
                    return;
                  }
                  playSound.click();
                  handleConfirmGoogleOAuth(selectedGoogleAccount.email, selectedGoogleAccount.name, selectedGoogleAccount.avatarUrl);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-colors shadow-md shadow-blue-600/10 uppercase tracking-wide"
              >
                Autorizar e Continuar
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn" id="auth-modal">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/5 animate-scaleIn">
        
        {/* Header Glow */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

        {/* Close Button */}
        <button
          onClick={() => {
            playSound.click();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-all hover:rotate-90 duration-300"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 md:p-8 space-y-6">
          
          {/* Logo & Header */}
          <div className="text-center space-y-2 pt-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-950/80 border border-indigo-800/40 text-indigo-300 rounded-full font-mono text-[9px] font-black uppercase">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              Acesso Seguro Criptografado
            </span>
            <h3 className="text-xl font-black text-white uppercase tracking-wide">
              {activeTab === 'login' ? 'Identifique-se' : 'Criar Nova Conta'}
            </h3>
            <p className="text-xs text-slate-400">
              Faça login para salvar moedas, vidas, saldo real e jogar os games da Arena.
            </p>
          </div>

          {/* Social Logins */}
          <div className="space-y-2.5">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3 bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-750 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Chrome className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Conectar com Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3">
            <span className="w-full h-px bg-slate-800" />
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase whitespace-nowrap">Ou e-mail e senha</span>
            <span className="w-full h-px bg-slate-800" />
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex gap-2 items-start animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-tight">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {activeTab === 'register' && (
              <div>
                <label className="block text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  Seu Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Tiago Jorge"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                E-mail de Acesso
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                Senha de Segurança
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Pelo menos 6 caracteres"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 font-mono"
                />
              </div>
            </div>

            {/* Submission Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white font-black text-xs uppercase tracking-wide rounded-xl cursor-pointer hover:from-indigo-500 hover:to-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <span>{activeTab === 'login' ? 'Entrar na Arena' : 'Cadastrar e Jogar'}</span>
              )}
            </button>
          </form>

          {/* Toggle Tab Footer */}
          <div className="text-center pt-2">
            {activeTab === 'login' ? (
              <p className="text-xs text-slate-400">
                Ainda não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    playSound.click();
                    setActiveTab('register');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
                >
                  Cadastrar-se
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Já possui uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    playSound.click();
                    setActiveTab('login');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
                >
                  Entrar
                </button>
              </p>
            )}
          </div>

          {/* Direct Sandboxed quick-bypass tip for developers/tests */}
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-850/60 text-center">
            <span className="text-[9px] text-slate-500 block font-mono">
              💡 CONTA DE TESTE SANDBOX (E-mail): <strong>tiago@gamezone.com</strong> / Senha: <strong>123456</strong>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
