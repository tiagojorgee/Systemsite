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
  Sparkles,
  Facebook,
  Github,
  Gamepad2,
  Key,
  ShieldAlert,
  Smartphone
} from 'lucide-react';
import { playSound } from '../utils/audio';

// Define the AppUser type matching what is stored in state
export interface AppUser {
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'email' | 'google' | 'facebook' | 'github' | 'discord';
  role?: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
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
  const [activeView, setActiveView] = useState<'login' | 'register' | 'recover' | 'reset' | 'verifyEmail' | 'twofactor'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recovery & Reset states
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [simulatedRecoveryCode, setSimulatedRecoveryCode] = useState<string | null>(null);

  // Email verification states
  const [emailVerifyCode, setEmailVerifyCode] = useState('');
  const [simulatedEmailCode, setSimulatedEmailCode] = useState<string | null>(null);
  const [pendingUserSession, setPendingUserSession] = useState<{ token: string; user: any } | null>(null);

  // 2FA challenge states
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [temp2faToken, setTemp2faToken] = useState<string | null>(null);

  // Social SSO states
  const [socialOAuthFlow, setSocialOAuthFlow] = useState<'select' | 'consent' | null>(null);
  const [socialProvider, setSocialProvider] = useState<'google' | 'facebook' | 'github' | 'discord'>('google');
  const [selectedSocialAccount, setSelectedSocialAccount] = useState<{ email: string; name: string; avatarUrl: string } | null>(null);
  const [customSocialEmail, setCustomSocialEmail] = useState('');
  const [customSocialName, setCustomSocialName] = useState('');
  const [scopesAccepted, setScopesAccepted] = useState({
    profile: true,
    feed: true,
    chat: true,
  });

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

    if (password.length < 8) {
      setError('Sua senha deve conter no mínimo 8 caracteres por motivos de conformidade.');
      playSound.gameover();
      return;
    }

    if (activeView === 'register' && !name.trim()) {
      setError('Por favor, preencha o seu nome completo.');
      playSound.gameover();
      return;
    }

    setIsLoading(true);
    playSound.click();

    const url = activeView === 'register' ? '/api/auth/register' : '/api/auth/login';
    const body = activeView === 'register' 
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
      if (data.requires2fa) {
        // Transition to 2FA view
        setTemp2faToken(data.tempToken);
        setActiveView('twofactor');
        triggerToast('🛡️ Autenticação em duas etapas necessária!');
        return;
      }

      if (data.token) {
        // If we are registering, let's keep the token pending until email is verified
        if (activeView === 'register') {
          setPendingUserSession({ token: data.token, user: data.user });
          setSimulatedEmailCode(data.verifyCode);
          setActiveView('verifyEmail');
          triggerToast('📧 Código de verificação de e-mail enviado!');
          return;
        }
        localStorage.setItem('gamezone_jwt_token', data.token);
      }

      const authUser: AppUser = {
        email: data.user.email,
        name: data.user.name,
        provider: data.user.provider,
        avatarUrl: data.user.avatarUrl,
        role: data.user.role,
        emailVerified: data.user.emailVerified,
        twoFactorEnabled: data.user.twoFactorEnabled
      };

      if (data.user.suspiciousAlert) {
        triggerToast(`⚠️ Alerta de Segurança: ${data.user.suspiciousAlert}`);
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

  // Submit Password Recovery Request
  const handleRecoverRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!recoveryEmail.trim() || !validateEmail(recoveryEmail)) {
      setError('Por favor, insira um e-mail corporativo válido.');
      playSound.gameover();
      return;
    }

    setIsLoading(true);
    playSound.click();

    fetch('/api/auth/recover-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: recoveryEmail.trim() })
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na recuperação.');
      return data;
    })
    .then((data) => {
      if (data.debugCode) {
        setSimulatedRecoveryCode(data.debugCode);
        triggerToast(`🔑 Simulador: Código gerado: ${data.debugCode}`);
      }
      setActiveView('reset');
      triggerToast('📧 Se o e-mail existir, as instruções foram enviadas.');
      playSound.victory();
    })
    .catch((err) => {
      setError(err.message || 'Erro ao solicitar recuperação.');
      playSound.gameover();
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  // Submit Password Reset (using recovery code)
  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!recoveryCode.trim() || !newPassword.trim()) {
      setError('Código e nova senha são obrigatórios.');
      playSound.gameover();
      return;
    }

    if (newPassword.length < 8) {
      setError('A nova senha deve possuir pelo menos 8 caracteres.');
      playSound.gameover();
      return;
    }

    setIsLoading(true);
    playSound.click();

    fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: recoveryCode.trim(), newPassword })
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    })
    .then((data) => {
      triggerToast('🔒 Senha alterada! Todas as sessões antigas foram encerradas.');
      setActiveView('login');
      playSound.victory();
    })
    .catch((err) => {
      setError(err.message || 'Erro ao redefinir senha.');
      playSound.gameover();
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  // Submit Email Verification Code
  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailVerifyCode.trim() || !pendingUserSession) {
      setError('Código de verificação obrigatório ou sessão inválida.');
      playSound.gameover();
      return;
    }

    setIsLoading(true);
    playSound.click();

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pendingUserSession.token}`
      },
      body: JSON.stringify({ code: emailVerifyCode.trim() })
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    })
    .then((data) => {
      // Save Token and login successfully!
      localStorage.setItem('gamezone_jwt_token', pendingUserSession.token);
      
      const authUser: AppUser = {
        email: pendingUserSession.user.email,
        name: pendingUserSession.user.name,
        provider: pendingUserSession.user.provider,
        avatarUrl: pendingUserSession.user.avatarUrl,
        role: pendingUserSession.user.role,
        emailVerified: true,
        twoFactorEnabled: pendingUserSession.user.twoFactorEnabled
      };

      triggerToast(`🎉 E-mail verificado! Conta criada, seja bem-vindo, ${authUser.name}!`);
      playSound.victory();
      onLoginSuccess(authUser);
      onClose();
    })
    .catch((err) => {
      setError(err.message || 'Código incorreto ou expirado.');
      playSound.gameover();
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  // Submit 2FA Verification Challenge
  const handleVerify2fa = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!twoFactorCode.trim() || !temp2faToken) {
      setError('Código 2FA e token temporário são necessários.');
      playSound.gameover();
      return;
    }

    setIsLoading(true);
    playSound.click();

    fetch('/api/auth/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken: temp2faToken, code: twoFactorCode.trim() })
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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
        avatarUrl: data.user.avatarUrl,
        role: data.user.role,
        emailVerified: data.user.emailVerified,
        twoFactorEnabled: true
      };

      triggerToast(`👋 Bem-vindo de volta, ${authUser.name}! 2FA aprovado.`);
      playSound.victory();
      onLoginSuccess(authUser);
      onClose();
    })
    .catch((err) => {
      setError(err.message || 'Código 2FA incorreto.');
      playSound.gameover();
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  // Social Login triggers
  const triggerSocialOAuth = (provider: 'google' | 'facebook' | 'github' | 'discord') => {
    setError(null);
    playSound.click();
    setSocialProvider(provider);
    setSocialOAuthFlow('select');
  };

  const handleConfirmSocialOAuth = async (emailToUse: string, nameToUse: string, avatarToUse: string) => {
    setIsLoading(true);
    setSocialOAuthFlow(null);

    try {
      const socialUser: AppUser = {
        email: emailToUse,
        name: nameToUse,
        avatarUrl: avatarToUse,
        provider: socialProvider,
      };

      // Notify our server to save this user session
      const response = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: socialUser.email,
          name: socialUser.name,
          avatarUrl: socialUser.avatarUrl,
          provider: socialProvider,
          uid: `user_${socialProvider}_` + socialUser.email.replace(/[^a-zA-Z0-9_\-]/g, "_")
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na federação social.');
      }

      const data = await response.json();
      if (data.requires2fa) {
        setTemp2faToken(data.tempToken);
        setActiveView('twofactor');
        triggerToast(`🛡️ 2FA requerido para ${socialUser.name}!`);
        return;
      }

      if (data.token) {
        localStorage.setItem('gamezone_jwt_token', data.token);
      }

      const authUser: AppUser = {
        email: data.user.email,
        name: data.user.name,
        provider: data.user.provider,
        avatarUrl: data.user.avatarUrl,
        role: data.user.role,
        emailVerified: true,
        twoFactorEnabled: data.user.twoFactorEnabled
      };

      if (data.user.suspiciousAlert) {
        triggerToast(`⚠️ Alerta de Segurança: ${data.user.suspiciousAlert}`);
      } else {
        triggerToast(`🟢 Conectado via ${socialProvider.toUpperCase()}! Olá, ${authUser.name}!`);
      }
      
      playSound.victory();
      onLoginSuccess(authUser);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro de autenticação federada. Verifique sua conexão.');
      setIsLoading(false);
      playSound.gameover();
    }
  };

  // UI styling depending on provider
  const getProviderInfo = () => {
    switch (socialProvider) {
      case 'facebook':
        return {
          brandName: 'Facebook Security',
          brandColor: 'bg-blue-600',
          textColor: 'text-blue-600',
          borderColor: 'border-blue-200',
          accounts: [
            { email: 'tiago.jorge.fb@facebook.com', name: 'Tiago Jorge', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' },
            { email: 'guest.facebook@meta.com', name: 'Facebook Gamer Guest', avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=fb_gamer' }
          ]
        };
      case 'github':
        return {
          brandName: 'GitHub Enterprise OAuth',
          brandColor: 'bg-zinc-900',
          textColor: 'text-zinc-900',
          borderColor: 'border-zinc-300',
          accounts: [
            { email: 'tiagojorgeengenheiro@gmail.com', name: 'TiagoJorge-Dev', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' },
            { email: 'arena-github-player@github.com', name: 'GitHub Action Player', avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=git_player' }
          ]
        };
      case 'discord':
        return {
          brandName: 'Discord Gateway Identity',
          brandColor: 'bg-indigo-600',
          textColor: 'text-indigo-600',
          borderColor: 'border-indigo-300',
          accounts: [
            { email: 'tiagojorgeengenheiro@gmail.com', name: 'TiagoJorge#1337', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' },
            { email: 'gamer.discord.arena@discord.com', name: 'ArenaDiscordGuest#9999', avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=discord_arena' }
          ]
        };
      default: // google
        return {
          brandName: 'Google Accounts SSO',
          brandColor: 'bg-blue-500',
          textColor: 'text-blue-500',
          borderColor: 'border-slate-200',
          accounts: [
            { email: 'tiagojorgeengenheiro@gmail.com', name: 'Tiago Jorge', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' },
            { email: 'convidado.arena@gmail.com', name: 'Convidado Arena', avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=convidado' }
          ]
        };
    }
  };

  const currentProvider = getProviderInfo();

  // RENDER INTERACTIVE SSO LOGIN FLOW SCREENS
  if (socialOAuthFlow === 'select') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fadeIn">
        <div className="w-full max-w-md bg-white text-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn border border-slate-200">
          <div className="p-6 md:p-8 space-y-6 text-center">
            
            <div className="flex flex-col items-center space-y-2">
              {socialProvider === 'google' && (
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {socialProvider === 'facebook' && <Facebook className="w-8 h-8 text-blue-600 fill-current" />}
              {socialProvider === 'github' && <Github className="w-8 h-8 text-black" />}
              {socialProvider === 'discord' && <Gamepad2 className="w-8 h-8 text-indigo-500" />}

              <h3 className="text-xl font-bold tracking-tight text-slate-900">Login Social via {socialProvider.toUpperCase()}</h3>
              <p className="text-xs text-slate-500">Escolha uma conta federada para prosseguir para o <strong>GameZon Arena</strong></p>
            </div>

            {/* Simulated Accounts */}
            <div className="space-y-2 text-left">
              {currentProvider.accounts.map((acc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    playSound.click();
                    setSelectedSocialAccount(acc);
                    setSocialOAuthFlow('consent');
                  }}
                  className="w-full p-3.5 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center gap-3 cursor-pointer transition-all text-left"
                >
                  <img
                    src={acc.avatarUrl}
                    alt={acc.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/10"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 leading-none">{acc.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{acc.email}</div>
                  </div>
                </button>
              ))}

              {/* Custom Social Login input */}
              <div className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 space-y-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Entrar com Nova Conta {socialProvider.toUpperCase()}</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Seu Nome / User"
                    value={customSocialName}
                    onChange={(e) => setCustomSocialName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="email"
                    placeholder="exemplo@gmail.com"
                    value={customSocialEmail}
                    onChange={(e) => setCustomSocialEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <button
                  onClick={() => {
                    if (!customSocialEmail.trim() || !customSocialName.trim()) {
                      triggerToast('⚠️ Por favor, informe um nome/username e e-mail.');
                      return;
                    }
                    playSound.click();
                    setSelectedSocialAccount({
                      email: customSocialEmail.trim().toLowerCase(),
                      name: customSocialName.trim(),
                      avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(customSocialName)}`
                    });
                    setSocialOAuthFlow('consent');
                  }}
                  className={`w-full py-1.5 ${currentProvider.brandColor} text-white rounded-lg text-[10px] font-bold cursor-pointer hover:opacity-90 transition-all uppercase tracking-wider`}
                >
                  Confirmar Conta Customizada
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-[10px] text-slate-400">
              <button onClick={() => setSocialOAuthFlow(null)} className="hover:underline text-slate-500 font-semibold">Cancelar</button>
              <span>{currentProvider.brandName} Secure Protocol</span>
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (socialOAuthFlow === 'consent' && selectedSocialAccount) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fadeIn">
        <div className="w-full max-w-md bg-white text-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn border border-slate-200">
          <div className="p-6 md:p-8 space-y-6">
            
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              {socialProvider === 'google' && (
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {socialProvider === 'facebook' && <Facebook className="w-6 h-6 text-blue-600 fill-current shrink-0" />}
              {socialProvider === 'github' && <Github className="w-6 h-6 text-black shrink-0" />}
              {socialProvider === 'discord' && <Gamepad2 className="w-6 h-6 text-indigo-500 shrink-0" />}
              
              <div>
                <h4 className="text-sm font-bold text-slate-900 leading-tight">Autorização de Escopo {socialProvider.toUpperCase()}</h4>
                <p className="text-[10px] text-slate-400 font-mono truncate">{selectedSocialAccount.email}</p>
              </div>
            </div>

            <div className="space-y-4 text-left">
              <p className="text-xs text-slate-600 leading-relaxed">
                O aplicativo <strong>GameZone Arena</strong> solicita permissão para acessar os seguintes recursos de sua conta do {socialProvider.toUpperCase()}:
              </p>

              <div className="space-y-3.5">
                <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={scopesAccepted.profile}
                    onChange={(e) => setScopesAccepted({ ...scopesAccepted, profile: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 mt-0.5"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 block">Perfil Básico</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 leading-normal">Permite importar seu nome e avatar da federação para criar seu perfil de jogador Arena.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={scopesAccepted.feed}
                    onChange={(e) => setScopesAccepted({ ...scopesAccepted, feed: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 mt-0.5"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 block">Postagens e Mídias</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 leading-normal">Permite fazer uploads de mídias e postar no Feed.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl cursor-pointer hover:bg-slate-100/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={scopesAccepted.chat}
                    onChange={(e) => setScopesAccepted({ ...scopesAccepted, chat: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 mt-0.5"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 block">Sessões e Lojas</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 leading-normal">Autoriza gerenciar chat, WhatsApp sandbox, abrir lojas de itens e inventários.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => { playSound.click(); setSocialOAuthFlow('select'); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
              >
                Voltar
              </button>

              <button
                onClick={() => {
                  if (!scopesAccepted.profile) {
                    triggerToast('⚠️ A permissão de Perfil Básico é obrigatória para prosseguir.');
                    return;
                  }
                  playSound.click();
                  handleConfirmSocialOAuth(selectedSocialAccount.email, selectedSocialAccount.name, selectedSocialAccount.avatarUrl);
                }}
                className={`px-5 py-2 ${currentProvider.brandColor} text-white rounded-xl text-xs font-extrabold cursor-pointer hover:opacity-90 transition-colors shadow-md uppercase tracking-wide`}
              >
                Autorizar e Prosseguir
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // STANDARD AUTH MODAL LAYOUT
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn" id="auth-modal">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/5 animate-scaleIn">
        
        {/* Glow Line Header */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

        {/* Close Button */}
        <button
          onClick={() => { playSound.click(); onClose(); }}
          className="absolute top-4 right-4 p-1.5 bg-slate-950/60 border border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-all hover:rotate-90 duration-300"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 md:p-8 space-y-6">
          
          {/* HEADER SUMMARY SECTION */}
          {activeView === 'login' && (
            <div className="text-center space-y-2 pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-950/80 border border-indigo-800/40 text-indigo-300 rounded-full font-mono text-[9px] font-black uppercase">
                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                Acesso Seguro Criptografado
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-wide">Identifique-se</h3>
              <p className="text-xs text-slate-400">Faça login para gerenciar inventário, moedas e saldo real.</p>
            </div>
          )}

          {activeView === 'register' && (
            <div className="text-center space-y-2 pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-950/80 border border-emerald-800/40 text-emerald-300 rounded-full font-mono text-[9px] font-black uppercase">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Registro Seguro
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-wide">Criar Conta Arena</h3>
              <p className="text-xs text-slate-400">Cadastre-se na rede mestre corporativa do GameZon.</p>
            </div>
          )}

          {activeView === 'recover' && (
            <div className="text-center space-y-2 pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-950/80 border border-amber-800/40 text-amber-300 rounded-full font-mono text-[9px] font-black uppercase">
                <Key className="w-3 h-3 text-amber-400" />
                Recuperação de Acesso
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-wide font-sans">Esqueceu sua senha?</h3>
              <p className="text-xs text-slate-400">Insira seu e-mail corporativo abaixo para gerar o código.</p>
            </div>
          )}

          {activeView === 'reset' && (
            <div className="text-center space-y-2 pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-950/80 border border-rose-800/40 text-rose-300 rounded-full font-mono text-[9px] font-black uppercase">
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                Alteração Obrigatória
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-wide">Redefinir Senha</h3>
              <p className="text-xs text-slate-400">Entre com o código recebido e defina sua nova senha mestre.</p>
            </div>
          )}

          {activeView === 'verifyEmail' && (
            <div className="text-center space-y-2 pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-teal-950/80 border border-teal-800/40 text-teal-300 rounded-full font-mono text-[9px] font-black uppercase">
                <Mail className="w-3 h-3 text-teal-400" />
                Conformidade de E-mail
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-wide">Verifique seu E-mail</h3>
              <p className="text-xs text-slate-400">Insira o código de 6 dígitos enviado para o seu e-mail.</p>
            </div>
          )}

          {activeView === 'twofactor' && (
            <div className="text-center space-y-2 pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-950/80 border border-blue-800/40 text-blue-300 rounded-full font-mono text-[9px] font-black uppercase">
                <Smartphone className="w-3 h-3 text-blue-400" />
                2FA Ativo
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-wide">Segundo Fator (2FA)</h3>
              <p className="text-xs text-slate-400">Abra o seu aplicativo de autenticação e insira o código dinâmico.</p>
            </div>
          )}


          {/* 1. SOCIAL LOGINS (Only on login/register views) */}
          {(activeView === 'login' || activeView === 'register') && (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => triggerSocialOAuth('google')}
                  disabled={isLoading}
                  title="Google"
                  className="py-3 bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-750 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  <Chrome className="w-4 h-4 text-rose-500" />
                </button>
                <button
                  onClick={() => triggerSocialOAuth('facebook')}
                  disabled={isLoading}
                  title="Facebook"
                  className="py-3 bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-750 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  <Facebook className="w-4 h-4 text-blue-600 fill-current" />
                </button>
                <button
                  onClick={() => triggerSocialOAuth('github')}
                  disabled={isLoading}
                  title="GitHub"
                  className="py-3 bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-750 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  <Github className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => triggerSocialOAuth('discord')}
                  disabled={isLoading}
                  title="Discord"
                  className="py-3 bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-750 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  <Gamepad2 className="w-4 h-4 text-indigo-400" />
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <span className="w-full h-px bg-slate-800" />
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase whitespace-nowrap">Ou credenciais seguras</span>
                <span className="w-full h-px bg-slate-800" />
              </div>
            </div>
          )}


          {/* ERROR ALERT DISPLAY */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex gap-2 items-start animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-tight">{error}</span>
            </div>
          )}


          {/* 2. DYNAMIC SCREENS VIEW SWITCHER */}
          
          {/* VIEW: LOGIN & REGISTER */}
          {(activeView === 'login' || activeView === 'register') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeView === 'register' && (
                <div>
                  <label className="block text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Nome de Jogador Completo
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
                  E-mail Corporativo
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
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider">
                    Senha de Segurança
                  </label>
                  {activeView === 'login' && (
                    <button
                      type="button"
                      onClick={() => { playSound.click(); setActiveView('recover'); }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
                    >
                      Esqueceu?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Pelo menos 8 caracteres (1 letra e 1 número)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 font-mono"
                  />
                </div>
              </div>

              {/* Submit Button */}
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
                  <span>{activeView === 'login' ? 'Entrar na Arena' : 'Cadastrar e Jogar'}</span>
                )}
              </button>
            </form>
          )}

          {/* VIEW: RECOVER PASSWORD */}
          {activeView === 'recover' && (
            <form onSubmit={handleRecoverRequest} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  E-mail Registrado
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="digiteseuemail@exemplo.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black text-xs uppercase tracking-wide rounded-xl cursor-pointer hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Solicitar Redefinição</span>}
              </button>

              <button
                type="button"
                onClick={() => { playSound.click(); setActiveView('login'); }}
                className="w-full py-2 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all text-center"
              >
                Voltar para o Login
              </button>
            </form>
          )}

          {/* VIEW: RESET PASSWORD */}
          {activeView === 'reset' && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              {simulatedRecoveryCode && (
                <div className="p-3 bg-indigo-950/50 border border-indigo-800/40 rounded-xl text-indigo-300 text-xs flex flex-col gap-1">
                  <span className="font-bold uppercase font-mono tracking-wider text-[10px]">🤖 BACKCHANNEL DO SIMULADOR (Audit 22)</span>
                  <span>Use o código de recuperação: <strong className="text-white font-mono text-sm">{simulatedRecoveryCode}</strong></span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  Código de 6 dígitos
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    placeholder="Ex: 123456"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 font-mono text-center tracking-widest text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  Nova Senha Corporativa
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres (letras e números)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wide rounded-xl cursor-pointer hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirmar Nova Senha</span>}
              </button>

              <button
                type="button"
                onClick={() => { playSound.click(); setActiveView('login'); }}
                className="w-full py-2 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all text-center"
              >
                Cancelar
              </button>
            </form>
          )}

          {/* VIEW: EMAIL VERIFICATION */}
          {activeView === 'verifyEmail' && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              {simulatedEmailCode && (
                <div className="p-3 bg-teal-950/50 border border-teal-800/40 rounded-xl text-teal-300 text-xs flex flex-col gap-1">
                  <span className="font-bold uppercase font-mono tracking-wider text-[10px]">🤖 SIMULADOR: CORRESPONDÊNCIA DE PROTOCOLO</span>
                  <span>Insira o código de e-mail enviado: <strong className="text-white font-mono text-sm">{simulatedEmailCode}</strong></span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  Código de Verificação (6 Dígitos)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={emailVerifyCode}
                    onChange={(e) => setEmailVerifyCode(e.target.value)}
                    placeholder="Ex: 123456"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 font-mono text-center tracking-widest text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black text-xs uppercase tracking-wide rounded-xl cursor-pointer hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirmar E-mail</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound.click();
                  fetch('/api/auth/send-verification', {
                    method: 'POST',
                    headers: pendingUserSession ? { 'Authorization': `Bearer ${pendingUserSession.token}` } : {}
                  })
                  .then(async r => {
                    const d = await r.json();
                    if (d.debugCode) {
                      setSimulatedEmailCode(d.debugCode);
                      triggerToast(`🔑 Novo Código Gerado: ${d.debugCode}`);
                    } else {
                      triggerToast('📧 Novo código enviado com sucesso!');
                    }
                  });
                }}
                className="w-full py-2 border border-slate-850 hover:border-slate-800 text-indigo-400 hover:text-indigo-300 rounded-xl text-xs font-bold transition-all text-center"
              >
                Reenviar Código de Verificação
              </button>
            </form>
          )}

          {/* VIEW: TWO FACTOR AUTH (MFA) CHALLENGE */}
          {activeView === 'twofactor' && (
            <form onSubmit={handleVerify2fa} className="space-y-4">
              <div className="p-3 bg-indigo-950/30 border border-indigo-800/20 rounded-xl text-indigo-300 text-xs flex flex-col gap-1 text-center">
                <span className="font-bold block">🔐 Criptografia MFA ativa para esta conta</span>
                <span className="text-[10px] text-slate-400">Insira seu token TOTP de 6 dígitos gerado no Google Authenticator para liberar a sessão ativa.</span>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  Código de Autenticação TOTP
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="000 000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-center tracking-widest text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wide rounded-xl cursor-pointer hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Aprovar Token & Entrar</span>}
              </button>

              <button
                type="button"
                onClick={() => { playSound.click(); setActiveView('login'); }}
                className="w-full py-2 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all text-center"
              >
                Cancelar Login TOTP
              </button>
            </form>
          )}


          {/* 3. TOGGLE TAB FOOTERS */}
          {(activeView === 'login' || activeView === 'register') && (
            <div className="text-center pt-2">
              {activeView === 'login' ? (
                <p className="text-xs text-slate-400">
                  Ainda não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => { playSound.click(); setActiveView('register'); }}
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
                    onClick={() => { playSound.click(); setActiveView('login'); }}
                    className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
                  >
                    Entrar
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Sandbox Default Accounts Helper Box */}
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-850/60 text-center">
            <span className="text-[9px] text-slate-500 block font-mono">
              💡 CONTA DE TESTE SANDBOX (E-mail): <strong>tiago@gamezone.com</strong> / Senha: <strong>12345678</strong>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
