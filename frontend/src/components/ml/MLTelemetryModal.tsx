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

  const modelVersion = metrics?.model_version || metrics?.version || 'v2.1.0-rf-leakage-free';
  const evalMetrics = metrics?.metrics || metrics?.evaluation_metrics;
  const trainedAt = metrics?.evaluated_at || metrics?.trained_at;

  let labels: string[] = [];
  let matrix: number[][] = [];

  if (metrics?.confusion_matrix) {
    if (Array.isArray(metrics.confusion_matrix)) {
      matrix = metrics.confusion_matrix;
      labels = metrics.labels || ['SAFE', 'WARNING', 'SHORTAGE', 'CRITICAL'].slice(0, matrix.length);
    } else if (typeof metrics.confusion_matrix === 'object') {
      const cmObj = metrics.confusion_matrix as { labels?: string[]; matrix?: number[][] };
      labels = cmObj.labels || metrics.labels || [];
      matrix = cmObj.matrix || [];
    }
  } else if (metrics?.labels) {
    labels = metrics.labels;
  }

  const featureEntries = metrics?.feature_importances
    ? Object.entries(metrics.feature_importances).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#121215] rounded-xl border border-slate-200 dark:border-[#27272A] shadow-xl max-w-2xl w-full p-4 sm:p-6 animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#27272A] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Machine Learning Model Telemetry</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Random Forest Risk Classifier &amp; Trajectory Evaluation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 dark:text-zinc-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
            <span>Loading verified scikit-learn evaluation metrics...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : metrics ? (
          <div className="space-y-5">
            {/* Meta status bar */}
            <div className="flex flex-wrap items-center justify-between p-3 bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-lg text-xs gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-zinc-300">Model:</span>
                <span className="font-mono text-slate-900 dark:text-zinc-100 bg-white dark:bg-[#121215] px-2 py-0.5 rounded border border-slate-200 dark:border-[#27272A]">
                  {modelVersion}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-zinc-300">Evaluated:</span>
                <span className="text-slate-600 dark:text-zinc-400">
                  {trainedAt ? new Date(trainedAt).toLocaleString() : 'Active'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Scikit-Learn</span>
              </div>
            </div>

            {/* Metric KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-lg text-center">
                <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">Accuracy</div>
                <div className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  {evalMetrics ? `${(evalMetrics.accuracy * 100).toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-lg text-center">
                <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">Precision</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {evalMetrics ? `${(evalMetrics.precision * 100).toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-lg text-center">
                <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">Recall</div>
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {evalMetrics ? `${(evalMetrics.recall * 100).toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-lg text-center">
                <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1">F1 Score</div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {evalMetrics ? `${(evalMetrics.f1_score * 100).toFixed(1)}%` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Confusion Matrix Table */}
            {matrix.length > 0 && labels.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                    Confusion Matrix (Test Evaluation Set)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Row: Actual | Col: Predicted
                  </span>
                </div>
                <div className="border border-slate-200 dark:border-[#27272A] rounded-lg overflow-x-auto text-xs">
                  <table className="w-full min-w-[380px] border-collapse text-center">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-[#27272A]">
                        <th className="py-2 px-3 text-left bg-slate-100/60 dark:bg-[#141416]">Actual \ Pred</th>
                        {labels.map((lbl) => (
                          <th key={lbl} className="py-2 px-3">
                            {lbl}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {labels.map((actualLabel, rowIdx) => (
                        <tr key={actualLabel} className="border-b border-slate-100 dark:border-[#27272A] last:border-0 hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                          <td className="py-2 px-3 text-left font-semibold text-slate-700 dark:text-zinc-300 bg-slate-50/50 dark:bg-[#141416]">
                            {actualLabel}
                          </td>
                          {matrix[rowIdx]?.map((val, colIdx) => (
                            <td
                              key={colIdx}
                              className={`py-2 px-3 font-mono font-medium ${
                                rowIdx === colIdx
                                  ? val > 0
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                                    : 'text-slate-700 dark:text-zinc-300'
                                  : val > 0
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                                  : 'text-slate-400 dark:text-zinc-500'
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
            )}

            {/* Feature Importances */}
            {featureEntries.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                    Top Gini Feature Importances
                  </span>
                </div>
                <div className="space-y-2">
                  {featureEntries.map(([feat, imp]) => (
                    <div key={feat} className="text-xs">
                      <div className="flex justify-between text-slate-700 dark:text-zinc-300 font-medium mb-1">
                        <span>{feat.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-slate-500 dark:text-zinc-400">{(imp * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                          style={{ width: `${Math.max(5, imp * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-[#27272A] flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-zinc-400 gap-2">
              <span>
                {metrics.raw_train_samples !== undefined
                  ? `Dataset: ${metrics.raw_train_samples} training samples, ${metrics.test_samples} test samples.`
                  : 'Empirical model metrics loaded.'}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="/admin/telemetry"
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                >
                  Full Telemetry Page &rarr;
                </a>
                <button
                  type="button"
                  onClick={fetchMetrics}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-[#18181B] hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

