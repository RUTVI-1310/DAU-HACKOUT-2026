import React from 'react';
import { X, CheckCircle2, AlertTriangle, Trash2, ShieldCheck, Clock } from 'lucide-react';
import { ExecutionLog } from '../types';

interface DispatchLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ExecutionLog[];
  onClearLogs: () => void;
}

export const DispatchLogModal: React.FC<DispatchLogModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6">
      <div className="glass-panel rounded-2xl shadow-2xl border border-slate-800 max-w-4xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm sm:text-base">
                Auditable Operator Dispatch &amp; Action Log
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Immutable record of authorized grid curtailments, BESS dispatches, and peaker notifications.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Table */}
        <div className="p-5 sm:p-6 flex-grow overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-3 text-slate-500" />
              <p className="font-semibold text-sm text-slate-200">No Dispatches Executed Yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Authorize recommended actions from the Grid Action Center to log active mitigation orders.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800/80">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900/90 text-slate-300 uppercase font-bold sticky top-0 font-mono text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Action Directive</th>
                    <th className="py-2.5 px-3">Magnitude</th>
                    <th className="py-2.5 px-3">Target Substation</th>
                    <th className="py-2.5 px-3">Operator</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium bg-slate-950/40">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/60 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{log.id}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{log.dispatchedAt}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{log.title}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                        {log.magnitudeMW} MW
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{log.targetAsset}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{log.operator}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <span className="text-xs text-slate-400">
            Total Logged Events: <strong className="text-slate-200 font-mono">{logs.length}</strong>
          </span>

          <div className="flex items-center space-x-2.5">
            {logs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition cursor-pointer border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
