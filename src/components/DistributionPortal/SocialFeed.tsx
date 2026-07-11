import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, MessageSquare, Send, Check, Heart, Sparkles, UserPlus, Star, Bell, Newspaper, HelpCircle
} from 'lucide-react';
import { playSound } from '../../utils/audio';

interface SocialFeedProps {
  developers: { id: string; studioName: string; bio: string; logoUrl: string; website: string; followersCount: number }[];
  following: string[]; // devIds
  onToggleFollow: (devId: string) => void;
  onTriggerToast: (msg: string) => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: string;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({
  developers,
  following,
  onToggleFollow,
  onTriggerToast
}) => {
  const [activeTab, setActiveTab] = useState<'studios' | 'chat' | 'announcements'>('studios');
  const [chatRoom, setChatRoom] = useState<'global' | 'devs'>('global');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    global: [
      { id: '1', sender: 'Speedrunner_2077', avatar: '👾', text: 'Alguém online para bater records no Neon Overdrive?', timestamp: '14:32' },
      { id: '2', sender: 'GamerSaudoso', avatar: '🎮', text: 'Estou tentando! Mas o drift de gravidade na pista Chiba é bem difícil.', timestamp: '14:33' }
    ],
    devs: [
      { id: '3', sender: 'Alice Synth [CyberPulse]', avatar: '⚡', text: 'Olá comunidade! Nova expansão Drifter Pack já está no ar. O que acharam das novas músicas?', timestamp: '12:00' },
      { id: '4', sender: 'BladeMasterX', avatar: '🥋', text: 'As músicas de Synthwave estão sensacionais! Parabéns pela curadoria.', timestamp: '12:05' }
    ]
  });
  const [newMessageText, setNewMessageText] = useState('');

  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSound.click();
    if (!newMessageText.trim()) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'Jogador_Convidado',
      avatar: '👑',
      text: newMessageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => ({
      ...prev,
      [chatRoom]: [...prev[chatRoom], msg]
    }));
    setNewMessageText('');

    // Simulate auto-response after 1.5 seconds
    setTimeout(() => {
      const resp: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: chatRoom === 'global' ? 'GamerSaudoso' : 'Alice Synth [CyberPulse]',
        avatar: chatRoom === 'global' ? '🎮' : '⚡',
        text: chatRoom === 'global' 
          ? 'Boa jogada! Vou te adicionar aos amigos para jogarmos depois.' 
          : 'Obrigada pelo feedback! Fique de olho no canal de anúncios para novidades sobre updates.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => ({
        ...prev,
        [chatRoom]: [...prev[chatRoom], resp]
      }));
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Navigation panels */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl h-fit space-y-3.5">
        <h4 className="text-[10px] font-black tracking-wider text-slate-400 font-mono">ARENA DE CONEXÃO</h4>
        <div className="flex flex-col gap-1">
          {[
            { id: 'studios', name: 'Estúdios de Desenvolvimento', icon: Newspaper },
            { id: 'chat', name: 'Mural de Discussões Chat', icon: MessageSquare },
            { id: 'announcements', name: 'Notas de Lançamento', icon: Bell }
          ].map(tab => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { playSound.click(); setActiveTab(tab.id as any); }}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                  activeTab === tab.id 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/20'
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Panel Column details */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-3xl min-h-[450px] flex flex-col justify-between">
        
        {/* TAB 1: Studios list */}
        {activeTab === 'studios' && (
          <div className="space-y-4 flex-1">
            <h4 className="text-xs font-black text-slate-200 border-b border-slate-800 pb-2">Estúdios de Criação Catalogados</h4>
            <div className="space-y-3">
              {developers.map(dev => {
                const isFollowing = following.includes(dev.id);
                return (
                  <div key={dev.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl h-10 w-10 bg-slate-900 border border-slate-850 rounded-lg flex items-center justify-center">
                        {dev.logoUrl}
                      </span>
                      <div>
                        <h5 className="font-bold text-slate-200 text-xs">{dev.studioName}</h5>
                        <p className="text-[10px] text-slate-400 leading-normal line-clamp-1">{dev.bio}</p>
                        <span className="text-[9px] text-slate-500 font-mono block mt-1">{dev.followersCount + (isFollowing ? 1 : 0)} seguidores</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleFollow(dev.id)}
                      className={`py-1.5 px-3 rounded-lg text-[10px] font-mono cursor-pointer transition-all border ${
                        isFollowing 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'
                      }`}
                    >
                      {isFollowing ? '✓ Seguindo' : '+ Seguir'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Chat discussion modules */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full flex-1 justify-between">
            <div className="space-y-4">
              <div className="flex gap-2 border-b border-slate-800 pb-2">
                {[
                  { id: 'global', name: 'Chat Geral' },
                  { id: 'devs', name: 'Mural de Criadores' }
                ].map(room => (
                  <button
                    key={room.id}
                    onClick={() => { playSound.click(); setChatRoom(room.id as any); }}
                    className={`py-1 px-2.5 text-[10px] font-mono rounded-lg transition-all cursor-pointer ${
                      chatRoom === room.id 
                        ? 'bg-slate-800 text-emerald-400 border border-slate-700/80' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {room.name}
                  </button>
                ))}
              </div>

              {/* Message scroll container */}
              <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                {(messages[chatRoom] || []).map(msg => (
                  <div key={msg.id} className="flex gap-2.5 bg-slate-950 border border-slate-850 p-2.5 rounded-xl">
                    <span className="text-xl shrink-0">{msg.avatar}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="font-bold text-slate-200">{msg.sender}</span>
                        <span className="text-slate-500">{msg.timestamp}</span>
                      </div>
                      <p className="text-slate-300 font-sans text-[11px] leading-relaxed mt-0.5">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Input send message box */}
            <form onSubmit={handleSendMessageSubmit} className="flex gap-2 pt-4 border-t border-slate-800/60 mt-4">
              <input
                type="text"
                placeholder={`Envie uma mensagem em #${chatRoom === 'global' ? 'chat-geral' : 'suporte-criadores'}...`}
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs outline-none text-slate-100 placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-2.5 rounded-xl flex items-center justify-center cursor-pointer shadow-lg"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: Platform announcements board */}
        {activeTab === 'announcements' && (
          <div className="space-y-4 flex-1">
            <h4 className="text-xs font-black text-slate-200 border-b border-slate-800 pb-2">Feed de Lançamentos & Anúncios</h4>
            <div className="space-y-3 font-sans">
              
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2">
                <span className="text-[9px] text-emerald-400 font-mono font-black block">ANÚNCIO OFICIAL DA PLATAFORMA</span>
                <h5 className="text-xs font-bold text-slate-100">Release 56: GameZon Store, Monetização & Painéis</h5>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Inauguramos oficialmente o suporte a faturamentos em sandbox para criadores de jogos independentes! Agora, qualquer desenvolvedor pode criar seu estúdio de criação, catalogar e gerenciar títulos gratuitos ou pagos, responder análises e acompanhar vendas em tempo real de forma totalmente segura.
                </p>
                <span className="text-[9px] text-slate-500 font-mono block">Postado hoje às 14:00 por Equipe GameZon</span>
              </div>

              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2">
                <span className="text-[9px] text-purple-400 font-mono font-black block">BOLETIM DE CRIADOR</span>
                <h5 className="text-xs font-bold text-slate-100">Estúdio CyberPulse comemora 14.500 downloads</h5>
                <p className="text-[11px] text-slate-400 leading-normal">
                  O aclamado simulador Neon Overdrive: Tokyo Drift atingiu a impressionante marca de downloads acumulados em nosso ecossistema. Um agradecimento especial a todos os pilotos virtuais pelo feedback constante e análises publicadas!
                </p>
                <span className="text-[9px] text-slate-500 font-mono block">Postado hoje às 12:00 por CyberPulse Studios</span>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
