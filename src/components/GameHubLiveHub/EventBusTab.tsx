import React, { useState, useEffect, useRef } from 'react';
import { EventLog } from './types';
import { 
  Workflow, 
  Play, 
  Send, 
  Clock, 
  SlidersHorizontal, 
  Layers, 
  Terminal, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Plus
} from 'lucide-react';
import { playSound } from '../../utils/audio';

const PRESET_ACTIONS = [
  {
    name: 'Início de Torneio 🏆',
    source: 'tournament-service',
    event: 'TournamentStartedEvent',
    payload: { tournamentId: 'tour-esports-5', title: 'Copa GameZon Pro', prizePoolCoins: 500000, bracketsGenerated: true },
    consumers: ['notification-service', 'analytics', 'game-presence'],
    description: 'Publicado quando um novo torneio oficial é homologado e os chaveamentos iniciam.'
  },
  {
    name: 'Ticket de Matchmaking 🎮',
    source: 'match-service',
    event: 'PlayerTicketCreatedEvent',
    payload: { ticketId: 'tck-4482', userId: 'usr-ninjapro', gameSlug: 'ultra-space-arcade', mmrRating: 1480 },
    consumers: ['analytics', 'game-presence'],
    description: 'Disparado quando um jogador entra na fila competitiva de pareamento.'
  },
  {
    name: 'Transmissão Iniciada 🎥',
    source: 'livehub-core',
    event: 'StreamInceptionEvent',
    payload: { channelId: 'ch-ninja', broadcaster: 'Ninja_Gamer', streamTitle: 'Rumo ao Mestre!', ingestServer: 'sfu-webrtc-sa-1' },
    consumers: ['notification-service', 'analytics', 'game-presence'],
    description: 'Disparado assim que a chave de transmissão valida um encoder RTMP/WebRTC legítimo.'
  },
  {
    name: 'Replay Gravado 💾',
    source: 'replay-service',
    event: 'ReplayRecordedEvent',
    payload: { replayId: 'rep-9954', matchId: 'm-3382', durationSec: 412, rawBlobUrl: 'gs://replays/raw/m-3382.gzon' },
    consumers: ['media-processing', 'replay-storage', 'analytics'],
    description: 'Gerado após o término de uma partida de arcade quando o buffer de frames é congelado.'
  },
  {
    name: 'Anti-Cheat Violado 🛡️',
    source: 'anti-cheat-integration',
    event: 'AntiCheatViolationDetected',
    payload: { userId: 'usr-speedhack99', matchId: 'm-3382', violationType: 'MEMORY_WALK_DETECTED', actionEnforced: 'INSTANT_KICK' },
    consumers: ['moderation', 'match-service', 'notification-service', 'analytics'],
    description: 'Evento de ALTA PRIORIDADE disparado quando assinaturas de memória ilegal são confirmadas.'
  },
  {
    name: 'Toxidade de Chat 💬',
    source: 'moderation',
    event: 'ToxicityFlaggedEvent',
    payload: { userId: 'usr-toxicguy', messageId: 'msg-552', chatRoom: 'global-lounge', toxicityScore: 0.94, flaggedWords: ['lixo', 'hack'] },
    consumers: ['notification-service', 'analytics'],
    description: 'Gerado pela análise Heurística de IA ao detectar mensagens nocivas nos canais de chat.'
  }
];

export const EventBusTab: React.FC = () => {
  const [logs, setLogs] = useState<EventLog[]>([
    {
      id: 'evt-initial-1',
      timestamp: new Date(Date.now() - 30000).toLocaleTimeString(),
      source: 'gamehub-core',
      target: 'analytics',
      eventName: 'SystemBootstrappedEvent',
      payload: { systemVersion: 'v2.6', servicesOnline: 16, latencyMs: 2 },
      status: 'PROCESSED'
    }
  ]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isSimulatingLoad, setIsSimulatingLoad] = useState<boolean>(false);
  const [queueDelay, setQueueDelay] = useState<number>(0); // RabbitMQ backlog simulated latency

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const selectedEvent = logs.find(l => l.id === selectedEventId);

  // Trigger individual event manually
  const triggerEvent = (preset: typeof PRESET_ACTIONS[0]) => {
    playSound.click();
    
    // Simulate events cascade to multiple consumers
    const newLogs: EventLog[] = preset.consumers.map((consumer, idx) => ({
      id: `evt-${Date.now()}-${idx}`,
      timestamp: new Date().toLocaleTimeString(),
      source: preset.source,
      target: consumer,
      eventName: preset.event,
      payload: preset.payload,
      status: 'PROCESSED'
    }));

    setLogs(prev => [ ...newLogs, ...prev ].slice(0, 50));
    setSelectedEventId(newLogs[0].id);
  };

  // Simulate constant high volume load (millions of concurrent users)
  useEffect(() => {
    if (isSimulatingLoad) {
      playSound.collect();
      intervalRef.current = setInterval(() => {
        const randomPreset = PRESET_ACTIONS[Math.floor(Math.random() * PRESET_ACTIONS.length)];
        const randomConsumer = randomPreset.consumers[Math.floor(Math.random() * randomPreset.consumers.length)];
        
        // Randomly simulate 1% degradation queue latency
        const delayChance = Math.random() > 0.85;
        if (delayChance) {
          setQueueDelay(prev => Math.min(250, prev + Math.floor(Math.random() * 25)));
        } else {
          setQueueDelay(prev => Math.max(0, prev - Math.floor(Math.random() * 15)));
        }

        const newLog: EventLog = {
          id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date().toLocaleTimeString(),
          source: randomPreset.source,
          target: randomConsumer,
          eventName: randomPreset.event,
          payload: {
            ...randomPreset.payload,
            simulationTimestamp: Date.now(),
            concurrentLoadUsers: Math.floor(1200000 + Math.random() * 300000)
          },
          status: delayChance && Math.random() > 0.5 ? 'QUEUED' : 'PROCESSED'
        };

        setLogs(prev => [newLog, ...prev].slice(0, 55));
      }, 800);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSimulatingLoad]);

  const clearLogs = () => {
    playSound.click();
    setLogs([]);
    setSelectedEventId(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left side: Controllers and Preset Trigger Buttons */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-1.5">
              <Workflow className="w-4 h-4 text-indigo-500" />
              Event-Driven Controller
            </h3>
            <span className="text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded border border-purple-150 dark:border-purple-900">
              Apache Kafka / RabbitMQ
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            Dispare fluxos de eventos assíncronos e assista como os microsserviços reagem e consomem mensagens de forma totalmente desacoplada.
          </p>

          <div className="space-y-3">
            {/* Automatic Simulator Switch */}
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl">
              <div>
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight block">Simular Carga de Produção</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Gera tráfego contínuo (~1.5M usuários ativos)</span>
              </div>
              <button
                onClick={() => { playSound.click(); setIsSimulatingLoad(!isSimulatingLoad); }}
                className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                  isSimulatingLoad ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-800'
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isSimulatingLoad ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            {/* Backlog queue latency state indicator */}
            <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                <span>Atraso do Backlog de Mensagens:</span>
                <span className={`font-mono ${queueDelay > 100 ? 'text-amber-500' : 'text-emerald-500'}`}>{queueDelay}ms</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${queueDelay > 100 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${Math.min(100, (queueDelay / 250) * 100)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preset Triggers Container */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl space-y-3">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">DISPARADORES DE EVENTO DE CASO</span>
          <div className="space-y-2">
            {PRESET_ACTIONS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => triggerEvent(preset)}
                className="w-full p-3 bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase">
                    {preset.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1 font-mono text-[9px] text-slate-400 dark:text-slate-500">
                    <span className="text-indigo-500">{preset.source}</span>
                    <span>→</span>
                    <span className="text-purple-500">{preset.event}</span>
                  </div>
                </div>
                <Send className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Middle side: Live Streaming Timeline logs */}
      <div className="lg:col-span-5 space-y-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
              Barramento de Mensagens em Tempo Real (Kafka Bus)
            </h3>
            <span className="text-[10px] text-slate-500">Exibindo as últimas mensagens publicadas</span>
          </div>

          <button 
            onClick={clearLogs}
            className="text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 px-2.5 py-1.5 border border-rose-900/50 rounded-lg cursor-pointer transition-colors"
          >
            Limpar Logs
          </button>
        </div>

        {/* Streaming list container */}
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-3 h-[520px] overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {logs.map((log) => {
            const isSelected = log.id === selectedEventId;
            return (
              <button
                key={log.id}
                onClick={() => { playSound.click(); setSelectedEventId(log.id); }}
                className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer block ${
                  isSelected 
                    ? 'bg-slate-900 border-indigo-500/70 text-white shadow-lg' 
                    : 'bg-slate-900/20 border-slate-850 text-slate-400 hover:bg-slate-900/50 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1 text-[9px]">
                  <span className="text-slate-500">{log.timestamp}</span>
                  <span className={`px-1 rounded ${
                    log.status === 'PROCESSED' 
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900' 
                      : 'bg-amber-950/80 text-amber-400 border border-amber-900'
                  }`}>
                    {log.status}
                  </span>
                </div>

                <div className="flex items-center gap-1 mb-1 font-bold">
                  <span className="text-indigo-400">[{log.source.replace('-service', '')}]</span>
                  <span className="text-slate-400">published</span>
                  <span className="text-purple-400 font-black">{log.eventName}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 text-[9px] truncate">
                  <span>Consumer Target:</span>
                  <span className="text-teal-400">[{log.target.replace('-service', '')}]</span>
                  <span>-</span>
                  <span className="truncate">{JSON.stringify(log.payload)}</span>
                </div>
              </button>
            );
          })}

          {logs.length === 0 && (
            <div className="text-center py-20 text-slate-600 text-xs">
              Nenhuma mensagem trafegando no barramento agora. Dispare um evento acima ou ative o Simulador automático.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Selected Message Payload Detail */}
      <div className="lg:col-span-3">
        {selectedEvent ? (
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-150 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                    Event Spec Inspector
                  </h3>
                  <span className="text-[9px] font-mono text-indigo-500 font-bold">
                    {selectedEvent.eventName}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedEventId(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-mono block">Origem do Evento:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">{selectedEvent.source}</span>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-mono block">Consumidor (Target):</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 font-mono text-[11px] text-teal-600 dark:text-teal-400">{selectedEvent.target}</span>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-mono block">Latência da Fila:</span>
                  <span className="font-bold text-emerald-500 font-mono text-[11px]">{queueDelay} ms</span>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-mono block">JSON Event Payload:</span>
                  <div className="bg-slate-900 dark:bg-black p-3 rounded-lg border border-slate-850 text-[10px] text-indigo-400 font-mono overflow-x-auto mt-1 max-h-56 scrollbar-thin">
                    <pre>{JSON.stringify(selectedEvent.payload, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/40 rounded-xl space-y-1.5 mt-4">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
                <CheckCircle2 className="w-4 h-4" /> Desacoplamento DDD
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-sans">
                Como os serviços se integram via mensagens persistidas na fila, se o serviço consumidor (<code className="text-[9px] text-indigo-500">{selectedEvent.target.replace('-service', '')}</code>) cair para manutenção, a mensagem fica acumulada com segurança no Broker e é consumida assim que o nó reestabelecer.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center h-full flex flex-col justify-center text-slate-400 dark:text-slate-500 text-xs">
            <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3 animate-spin" style={{ animationDuration: '8s' }} />
            Clique em qualquer evento do barramento para analisar a estrutura serializada de dados (Payload Contract) e isolamento estrutural.
          </div>
        )}
      </div>

    </div>
  );
};
