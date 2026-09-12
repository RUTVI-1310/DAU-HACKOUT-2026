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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Auditable Operator Dispatch &amp; Action Log
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Immutable record of authorized grid curtailments, BESS dispatches, and peaker notifications.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Table */}
        <div className="p-5 sm:p-6 flex-grow overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-sm text-slate-700">No Dispatches Executed Yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Authorize recommended actions from the Grid Action Center to log active mitigation orders.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold sticky top-0">
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
                <tbody className="divide-y divide-slate-100 font-medium">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{log.id}</td>
                      <td className="py-2.5 px-3 text-slate-500">{log.dispatchedAt}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{log.title}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                        {log.magnitudeMW} MW
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{log.targetAsset}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{log.operator}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
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
        <div className="p-5 sm:p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-xs text-slate-500">
            Total Logged Events: <strong className="text-slate-800">{logs.length}</strong>
          </span>

          <div className="flex items-center space-x-2">
            {logs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
