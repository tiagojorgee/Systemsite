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

  // Google Login handling via real Firebase pop-up
  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    playSound.click();

    try {
      const result = await googleSignIn();
      if (result) {
        const googleUser: AppUser = {
          email: result.user.email || '',
          name: result.user.displayName || 'Usuário Google',
          avatarUrl: result.user.photoURL || undefined,
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
            uid: result.user.uid
          })
        });

        if (response.ok) {
          const data = await response.json();
          googleUser.email = data.user.email;
          googleUser.name = data.user.name;
        }

        triggerToast(`🟢 Google conectado! Olá, ${googleUser.name}!`);
        playSound.victory();
        onLoginSuccess(googleUser);
        onClose();
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro de autenticação com o Google. Verifique sua conexão.');
      setIsLoading(false);
      playSound.gameover();
    }
  };

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
