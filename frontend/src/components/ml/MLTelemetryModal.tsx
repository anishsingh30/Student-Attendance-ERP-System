import React, { useEffect, useState } from 'react';
import { X, Brain, CheckCircle2, RefreshCw, BarChart2, ShieldAlert } from 'lucide-react';
import { api } from '../../api/client';
import { MLMetrics } from '../../types';

interface MLTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MLTelemetryModal: React.FC<MLTelemetryModalProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<MLMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMLMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ML evaluation metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMetrics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-[#262626] shadow-xl max-w-2xl w-full p-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#262626] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Machine Learning Model Telemetry</h3>
              <p className="text-xs text-slate-500 dark:text-[#A3A3A3]">
                Random Forest Risk Classifier &amp; Trajectory Evaluation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-[#737373] hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 dark:text-[#737373] text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
            <span>Loading verified scikit-learn evaluation metrics...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : metrics ? (
          <div className="space-y-5">
            {/* Meta status bar */}
            <div className="flex flex-wrap items-center justify-between p-3 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-xl text-xs gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-[#D4D4D4]">Model:</span>
                <span className="font-mono text-slate-900 dark:text-white bg-white dark:bg-[#111111] px-2 py-0.5 rounded border border-slate-200 dark:border-[#262626]">
                  {metrics.model_name} (v{metrics.version})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-[#D4D4D4]">Trained:</span>
                <span className="text-slate-600 dark:text-[#A3A3A3]">
                  {metrics.trained_at ? new Date(metrics.trained_at).toLocaleString() : 'Active'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Scikit-Learn</span>
              </div>
            </div>

            {/* Metric KPI cards */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-xl text-center">
                <div className="text-xs text-slate-500 dark:text-[#A3A3A3] font-medium mb-1">Accuracy</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {(metrics.evaluation_metrics.accuracy * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-xl text-center">
                <div className="text-xs text-slate-500 dark:text-[#A3A3A3] font-medium mb-1">Precision</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {(metrics.evaluation_metrics.precision * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-xl text-center">
                <div className="text-xs text-slate-500 dark:text-[#A3A3A3] font-medium mb-1">Recall</div>
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {(metrics.evaluation_metrics.recall * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-xl text-center">
                <div className="text-xs text-slate-500 dark:text-[#A3A3A3] font-medium mb-1">F1 Score</div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {(metrics.evaluation_metrics.f1_score * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Confusion Matrix Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Confusion Matrix (Test Evaluation Set)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[#A3A3A3]">
                  Rows: Actual Label | Columns: Predicted Label
                </span>
              </div>
              <div className="border border-slate-200 dark:border-[#262626] rounded-xl overflow-hidden text-xs">
                <table className="w-full border-collapse text-center">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#171717] text-slate-600 dark:text-[#A3A3A3] font-semibold border-b border-slate-200 dark:border-[#262626]">
                      <th className="py-2 px-3 text-left">Actual \ Pred</th>
                      {metrics.confusion_matrix.labels.map((lbl) => (
                        <th key={lbl} className="py-2 px-3">
                          {lbl}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.confusion_matrix.labels.map((actualLabel, rowIdx) => (
                      <tr key={actualLabel} className="border-b border-slate-100 dark:border-[#262626] last:border-0 hover:bg-slate-50/50 dark:hover:bg-[#171717]/60">
                        <td className="py-2 px-3 text-left font-semibold text-slate-700 dark:text-[#D4D4D4] bg-slate-50/50 dark:bg-[#141414]">
                          {actualLabel}
                        </td>
                        {metrics.confusion_matrix.matrix[rowIdx]?.map((val, colIdx) => (
                          <td
                            key={colIdx}
                            className={`py-2 px-3 font-mono font-medium ${
                              rowIdx === colIdx
                                ? val > 0
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                                  : 'text-slate-700 dark:text-[#D4D4D4]'
                                : val > 0
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                                : 'text-slate-300 dark:text-[#737373]'
                            }`}
                          >
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Feature Importances */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="w-4 h-4 text-slate-500 dark:text-[#A3A3A3]" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Top Gini Feature Importances
                </span>
              </div>
              <div className="space-y-2">
                {Object.entries(metrics.feature_importances)
                  .sort((a, b) => b[1] - a[1])
                  .map(([feat, imp]) => (
                    <div key={feat} className="text-xs">
                      <div className="flex justify-between text-slate-700 dark:text-[#D4D4D4] font-medium mb-1">
                        <span>{feat.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-slate-500 dark:text-[#A3A3A3]">{(imp * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-[#262626] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                          style={{ width: `${Math.max(5, imp * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between text-xs text-slate-500 dark:text-[#A3A3A3]">
              <span>
                Dataset: {metrics.training_samples} training samples, {metrics.test_samples} test samples.
              </span>
              <button
                type="button"
                onClick={fetchMetrics}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-[#1a1a1a] hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-700 dark:text-[#D4D4D4] rounded-lg font-medium transition-colors cursor-pointer erp-button"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
