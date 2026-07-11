import React, { useState, useEffect } from 'react';
import { AntiCheatLog } from './types';
import { 
  ShieldAlert, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Trash2, 
  Activity, 
  Search,
  Lock,
  Sparkles,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { playSound } from '../../utils/audio';

const SECURITY_METRICS_PRESET = {
  totalScans: 4892011,
  safePlayersPercent: 99.98,
  bansToday: 142,
  activeEnforcers: 14
};

const INITIAL_AC_LOGS: AntiCheatLog[] = [
  { id: 'ac-1', timestamp: '14:22:05', userId: 'usr-chakal', gameId: 'space-arcade', scanType: 'INTEGRITY_CHECK', result: 'CLEAN', confidence: 0.99, details: 'Verificação de integridade de arquivos de textura aprovada.' },
  { id: 'ac-2', timestamp: '14:22:11', userId: 'usr-katarina', gameId: 'space-arcade', scanType: 'MEMORY_SIGNATURE', result: 'CLEAN', confidence: 0.99, details: 'Assinaturas de memória RAM limpas, sem injetores ativos.' },
  { id: 'ac-3', timestamp: '14:23:42', userId: 'usr-speedhack99', gameId: 'space-arcade', scanType: 'HEURISTIC', result: 'BANNED', confidence: 0.98, details: 'ALERTA: Velocidade de movimento excedeu limite físico em 240%! Conexão fechada e banimento agendado.' }
];

export const SecurityTab: React.FC = () => {
  const [acLogs, setAcLogs] = useState<AntiCheatLog[]>(INITIAL_AC_LOGS);
  const [inputText, setInputText] = useState<string>('');
  const [scannedResult, setScannedResult] = useState<{ isSafe: boolean; score: number; flag: string } | null>(null);
  const [isScanningText, setIsScanningText] = useState<boolean>(false);
  const [acScanActive, setAcScanActive] = useState<boolean>(true);

  // Background scanner ticker loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (acScanActive) {
      interval = setInterval(() => {
        const scanTypes: ('HEURISTIC' | 'MEMORY_SIGNATURE' | 'INTEGRITY_CHECK')[] = ['HEURISTIC', 'MEMORY_SIGNATURE', 'INTEGRITY_CHECK'];
        const randomType = scanTypes[Math.floor(Math.random() * scanTypes.length)];
        const randomUser = `usr-${Math.floor(1000 + Math.random() * 9000)}`;
        
        // 5% chance of finding a flagged cheater
        const flagChance = Math.random() > 0.95;
        const result: 'CLEAN' | 'FLAGGED' | 'BANNED' = flagChance ? 'FLAGGED' : 'CLEAN';
        const confidence = parseFloat((0.9 + Math.random() * 0.09).toFixed(3));
        const details = flagChance 
          ? 'ALERTA: Possível hook de DLL detectado no processo do cliente. Telemetria encaminhada.' 
          : 'Monitoramento contínuo limpo. Assinaturas validadas.';

        if (flagChance) playSound.gameover();

        const newLog: AntiCheatLog = {
          id: `ac-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          userId: randomUser,
          gameId: 'space-arcade',
          scanType: randomType,
          result: result,
          confidence: confidence,
          details: details
        };

        setAcLogs(prev => [ newLog, ...prev ].slice(0, 15));
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [acScanActive]);

  const testChatToxicity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    playSound.click();
    setIsScanningText(true);
    setScannedResult(null);

    setTimeout(() => {
      setIsScanningText(false);
      const lower = inputText.toLowerCase();
      let isSafe = true;
      let score = 0.05 + Math.random() * 0.1;
      let flag = 'Livre de Toxidade ✅';

      // Check for simple mock toxic words
      if (lower.includes('lixo') || lower.includes('inútil') || lower.includes('hack') || lower.includes('merda') || lower.includes('fdp')) {
        isSafe = false;
        score = 0.75 + Math.random() * 0.2;
        flag = 'Linguagem Ofensiva / Assédio ❌';
        playSound.gameover();
      }

      setScannedResult({ isSafe, score, flag });
    }, 1000);
  };

  const clearAcLogs = () => {
    playSound.click();
    setAcLogs([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left side: Live Anti-Cheat Scanner Logs Console */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-white">
          <div>
            <h3 className="text-xs font-black uppercase tracking-tight flex items-center gap-1.5">
              <Terminal className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
              Painel Integrado Anti-Cheat (EAC / BattlEye Mesh)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Consola ativa recebendo telemetrias de integridade de processos</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => { playSound.click(); setAcScanActive(!acScanActive); }}
              className={`px-2.5 py-1.5 text-[9px] font-bold border rounded-lg cursor-pointer transition-colors ${
                acScanActive ? 'bg-indigo-950 border-indigo-700 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {acScanActive ? 'Pausar Scanner' : 'Retomar Scanner'}
            </button>
            <button 
              onClick={clearAcLogs}
              className="text-[10px] p-1.5 hover:bg-slate-850 rounded-lg cursor-pointer text-slate-500"
              title="Limpar Console"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live scanner ticker content */}
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 h-[420px] overflow-y-auto font-mono text-[10px] space-y-2 scrollbar-thin scrollbar-thumb-slate-850">
          <div className="text-slate-500 text-[9px] border-b border-slate-850 pb-1.5 mb-2.5 flex justify-between">
            <span>SECURE ANTI-CHEAT DIAGNOSTICS TIMELINE</span>
            <span>SHIELD ACTIVE 🛡️</span>
          </div>

          {acLogs.map(log => {
            const isClean = log.result === 'CLEAN';
            const isBanned = log.result === 'BANNED';
            return (
              <div 
                key={log.id} 
                className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-start justify-between gap-3 ${
                  isClean ? 'bg-slate-900/40 border-slate-850 text-slate-300' :
                  isBanned ? 'bg-red-950/30 border-red-900/60 text-red-300 shadow-md shadow-red-900/15' :
                  'bg-amber-950/30 border-amber-900/60 text-amber-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500">{log.timestamp}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                      log.scanType === 'HEURISTIC' ? 'bg-purple-950 border border-purple-900 text-purple-400' :
                      log.scanType === 'MEMORY_SIGNATURE' ? 'bg-blue-950 border border-blue-900 text-blue-400' :
                      'bg-teal-950 border border-teal-900 text-teal-400'
                    }`}>
                      {log.scanType}
                    </span>
                    <span className="font-bold text-slate-400">Player: {log.userId}</span>
                  </div>
                  <p className="text-[11px] font-sans leading-relaxed mt-1 text-slate-300 dark:text-slate-200">
                    {log.details}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${
                    isClean ? 'bg-emerald-950 text-emerald-400 border-emerald-900' :
                    isBanned ? 'bg-red-950 text-red-400 border-red-900' :
                    'bg-amber-950 text-amber-400 border-amber-900'
                  }`}>
                    {log.result}
                  </span>
                  <div className="text-[9px] text-slate-500 font-mono mt-1.5">
                    Conf: {(log.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}

          {acLogs.length === 0 && (
            <div className="text-center py-20 text-slate-600 text-xs">
              Nenhuma telemetria no console. Ligue o scanner acima para receber logs.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: AI Moderation Triage and Global Security Metrics */}
      <div className="lg:col-span-5 space-y-4">
        
        {/* Global stats panel */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl shadow-sm grid grid-cols-2 gap-3">
          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850 text-center">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Verificações de Integridade</span>
            <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100">{SECURITY_METRICS_PRESET.totalScans.toLocaleString()}</span>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850 text-center">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Jogadores Limpos</span>
            <span className="text-sm font-black font-mono text-emerald-500">{SECURITY_METRICS_PRESET.safePlayersPercent}%</span>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850 text-center">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Punidos Hoje (Automatic Kick)</span>
            <span className="text-sm font-black font-mono text-red-500">{SECURITY_METRICS_PRESET.bansToday} accounts</span>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-850 text-center">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Enforcers Ativos</span>
            <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100">{SECURITY_METRICS_PRESET.activeEnforcers} nodes</span>
          </div>
        </div>

        {/* AI Moderation Chat Scanner UseCase */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-150 dark:border-slate-800">
            <Activity className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Simulador Moderação de IA (Chat Scan)</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Escreva uma frase de teste no formulário abaixo para experimentar o algoritmo de detecção de linguagem imprópria e assédio do módulo <code className="text-indigo-500">Moderation</code>.
          </p>

          <form onSubmit={testChatToxicity} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Conteúdo da Mensagem</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Exemplo seguro: 'Manda muito bem, boa partida!' ou contendo ofensas para testar o filtro."
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isScanningText || !inputText.trim()}
              className="w-full py-2 bg-slate-800 dark:bg-indigo-600 hover:bg-slate-750 dark:hover:bg-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isScanningText ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verificando Heurística...
                </>
              ) : (
                'Escanear Conteúdo de Chat ⚡'
              )}
            </button>
          </form>

          {/* AI Scanner Result Screen */}
          {scannedResult && (
            <div className={`p-4 rounded-xl border animate-scaleIn space-y-3 ${
              scannedResult.isSafe 
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300' 
                : 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-900/60 text-red-800 dark:text-red-300'
            }`}>
              <div className="flex items-center justify-between pb-1.5 border-b border-black/5 dark:border-white/5 font-bold uppercase text-[10px]">
                <span>Triage de Moderação Oficial</span>
                <span className={`px-2 py-0.5 rounded border ${
                  scannedResult.isSafe ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-red-100 border-red-200 text-red-700'
                }`}>
                  {scannedResult.isSafe ? 'SEGURO' : 'SINALIZADO'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[9px] uppercase font-sans text-slate-400 block">Classificação:</span>
                  <span className="font-bold">{scannedResult.flag}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-sans text-slate-400 block">Grau de Toxidade (Score):</span>
                  <span className="font-bold font-mono">{(scannedResult.score * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
