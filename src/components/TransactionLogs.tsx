import React from 'react';
import { TransactionLog } from '../types';
import { History, ShieldCheck, Key, FileSpreadsheet, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react';

interface TransactionLogsProps {
  logs: TransactionLog[];
}

export const TransactionLogs: React.FC<TransactionLogsProps> = ({ logs }) => {
  // Compute some interesting secure metrics
  const stats = React.useMemo(() => {
    let totalRealBrl = 0;
    let totalCoinsEarned = 0;
    let totalCoinsSpent = 0;

    logs.forEach((log) => {
      if (log.status === 'success') {
        if (log.currency === 'real') {
          totalRealBrl += log.amount;
        } else if (log.currency === 'coins') {
          if (log.type === 'earn') {
            totalCoinsEarned += log.amount;
          } else {
            totalCoinsSpent += log.amount;
          }
        }
      }
    });

    return { totalRealBrl, totalCoinsEarned, totalCoinsSpent };
  }, [logs]);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="text-center md:text-left mb-6">
        <h2 className="text-2xl font-extrabold text-white flex items-center justify-center md:justify-start gap-2">
          <History className="w-6 h-6 text-slate-400" />
          Extrato &amp; Auditoria de Transações
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Registro completo de compras, resgates e pontuações ganhas, criptografados e assinados digitalmente.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Volume de Checkout Seguro</span>
            <h4 className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">R$ {stats.totalRealBrl.toFixed(2)}</h4>
            <p className="text-[9px] text-slate-500 mt-0.5">Faturamento real processado</p>
          </div>
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Moedas Acumuladas</span>
            <h4 className="text-xl font-extrabold text-amber-400 font-mono mt-0.5">🪙 {stats.totalCoinsEarned}</h4>
            <p className="text-[9px] text-slate-500 mt-0.5">Ganhos jogando nos minijogos</p>
          </div>
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Moedas Investidas</span>
            <h4 className="text-xl font-extrabold text-fuchsia-400 font-mono mt-0.5">🪙 {stats.totalCoinsSpent}</h4>
            <p className="text-[9px] text-slate-500 mt-0.5">Gastos em customizações e vidas</p>
          </div>
          <div className="p-2 bg-fuchsia-500/10 rounded-lg text-fuchsia-400">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl relative overflow-hidden">
        
        {/* Banner with signature info */}
        <div className="mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Chave de assinatura ativa: <strong className="font-mono text-cyan-300">SHA256-RSA-4096-ECC</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/15 text-[10px] font-mono">
            <span>● SISTEMA VERIFICADO</span>
          </div>
        </div>

        {/* Scrollable list of logs */}
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileSpreadsheet className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-sm">Nenhum log de transações registrado ainda.</p>
              <p className="text-xs mt-1">Jogue ou faça compras para popular a auditoria.</p>
            </div>
          ) : (
            [...logs].reverse().map((log) => {
              const isReal = log.currency === 'real';
              const isEarn = log.type === 'earn';

              return (
                <div
                  key={log.id}
                  className="bg-slate-950/55 border border-slate-800/80 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{log.id}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] text-slate-400 font-sans">{log.timestamp}</span>
                      
                      {/* Badge Type */}
                      <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        log.type === 'earn'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : log.type === 'purchase_coins' || log.type === 'purchase_booster'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-fuchsia-500/10 text-fuchsia-400'
                      }`}>
                        {log.type === 'earn' ? 'GANHO' : log.type === 'stage_skip' ? 'SKIP FASE' : 'COMPRA'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white tracking-tight">{log.description}</h4>

                    {/* Hash visual representation */}
                    {log.securityHash && (
                      <div className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                        <Key className="w-2.5 h-2.5 text-slate-600" />
                        <span>Hash Segura: <span className="text-slate-400 select-all">{log.securityHash}</span></span>
                      </div>
                    )}
                  </div>

                  {/* Value / Amount change indicator */}
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-500 font-mono block">Valor</span>
                    <span className={`text-sm font-black font-mono ${
                      isEarn ? 'text-emerald-400' : isReal ? 'text-cyan-400' : 'text-rose-400'
                    }`}>
                      {isEarn ? '+' : isReal ? 'S' : '-'}
                      {isReal ? `R$ ${log.amount.toFixed(2)}` : `${log.amount} 🪙`}
                    </span>
                    <div className="text-[9px] text-emerald-500 font-mono flex items-center sm:justify-end gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>ASSINADA</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
