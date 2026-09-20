import React, { useEffect, useState } from 'react';
import {
  Brain,
  CheckCircle2,
  RefreshCw,
  BarChart2,
  ShieldAlert,
  ArrowLeft,
  Cpu,
  Layers,
  Sliders,
  Database,
  Info,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../api/client';
import { MLMetrics } from '../../types';

export const AdminMLTelemetry: React.FC = () => {
  const [metrics, setMetrics] = useState<MLMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrainLoading, setRetrainLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMLMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load model telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleRetrain = async () => {
    setRetrainLoading(true);
    setActionMsg(null);
    try {
      const res = await api.trainMLModel();
      setActionMsg({
        type: 'success',
        text: res?.message || 'Model successfully retrained with updated empirical partitions.'
      });
      await fetchMetrics();
    } catch (err: any) {
      setActionMsg({
        type: 'error',
        text: err.message || 'Model retraining failed.'
      });
    } finally {
      setRetrainLoading(false);
    }
  };

  // Safe extraction helpers
  const modelVersion = metrics?.model_version || metrics?.version || 'v2.1.0-rf-leakage-free';
  const algorithm = metrics?.algorithm || 'RandomForestClassifier';
  const evalMetrics = metrics?.metrics || metrics?.evaluation_metrics;
  const baseline = metrics?.baseline_comparison;
  
  // Extract labels & matrix safely
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
    <div className="space-y-6">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#27272A]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <a
              href="/admin/config"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to System Configuration</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100">
                Predictive Risk Model Telemetry &amp; Evaluation Matrix
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Empirical evaluation metrics, confusion matrix, baseline benchmarks, and feature importances
              </p>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 py-1.5 px-3 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleRetrain}
            disabled={retrainLoading}
            className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrainLoading ? 'animate-spin' : ''}`} />
            <span>{retrainLoading ? 'Retraining...' : 'Retrain Model'}</span>
          </button>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMsg && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium border flex items-center gap-2.5 ${
            actionMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
          }`}
        >
          {actionMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 shrink-0" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && !metrics ? (
        <div className="py-20 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg text-center flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Loading model telemetry...</p>
        </div>
      ) : error && !metrics ? (
        /* Error State */
        <div className="p-8 bg-white dark:bg-[#121215] border border-rose-200 dark:border-rose-900/50 rounded-lg text-center flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Unable to load model telemetry</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md">{error}</p>
          <button
            onClick={fetchMetrics}
            className="mt-2 inline-flex items-center gap-1.5 py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : !metrics ? (
        /* Empty State */
        <div className="p-8 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg text-center flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center justify-center">
            <Info className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">No telemetry data available</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md">
            The machine learning risk model has not been trained or evaluated yet.
          </p>
          <button
            onClick={handleRetrain}
            disabled={retrainLoading}
            className="mt-2 inline-flex items-center gap-1.5 py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrainLoading ? 'animate-spin' : ''}`} />
            <span>Train &amp; Evaluate Model Now</span>
          </button>
        </div>
      ) : (
        /* Main Telemetry Dashboard Content */
        <div className="space-y-6">
          {/* Metadata Banner */}
          <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">{algorithm}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#27272A]">
                      {modelVersion}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    {metrics.target_definition || 'Attendance Trajectory Shortage Risk Tier Classification'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Scikit-Learn</span>
                </span>
                {metrics.leakage_prevention_verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Leakage-Free Partitioning</span>
                  </span>
                )}
                {metrics.evaluated_at && (
                  <span className="text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] px-2.5 py-1 rounded">
                    Evaluated: {new Date(metrics.evaluated_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Split & Sample Methodology */}
            {metrics.split_methodology && (
              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-[#27272A] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                  <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">Partition Methodology:</span>
                  <span>{metrics.split_methodology}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px] text-slate-600 dark:text-zinc-400">
                  {metrics.total_empirical_samples !== undefined && (
                    <span>Total: <strong className="text-slate-900 dark:text-zinc-200">{metrics.total_empirical_samples}</strong></span>
                  )}
                  {metrics.raw_train_samples !== undefined && (
                    <span>Train: <strong className="text-slate-900 dark:text-zinc-200">{metrics.raw_train_samples}</strong></span>
                  )}
                  {metrics.test_samples !== undefined && (
                    <span>Test: <strong className="text-slate-900 dark:text-zinc-200">{metrics.test_samples}</strong></span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-4 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-zinc-400 block font-medium mb-1">Empirical Accuracy</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
                  {evalMetrics ? `${(evalMetrics.accuracy * 100).toFixed(1)}%` : 'N/A'}
                </span>
                {baseline && evalMetrics && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    vs {(baseline.baseline_accuracy * 100).toFixed(1)}% baseline
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">Untouched test partition</p>
            </div>

            <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-4 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-zinc-400 block font-medium mb-1">Weighted Precision</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {evalMetrics ? `${(evalMetrics.precision * 100).toFixed(1)}%` : 'N/A'}
                </span>
                {baseline && evalMetrics && (
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                    vs {(baseline.baseline_precision * 100).toFixed(1)}% base
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">Positive predictive value</p>
            </div>

            <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-4 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-zinc-400 block font-medium mb-1">Weighted Recall</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {evalMetrics ? `${(evalMetrics.recall * 100).toFixed(1)}%` : 'N/A'}
                </span>
                {baseline && evalMetrics && (
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                    vs {(baseline.baseline_recall * 100).toFixed(1)}% base
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">True shortage detection rate</p>
            </div>

            <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-4 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-zinc-400 block font-medium mb-1">Macro / Weighted F1 Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {evalMetrics ? `${(evalMetrics.f1_score * 100).toFixed(1)}%` : 'N/A'}
                </span>
                {baseline && evalMetrics && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    vs {(baseline.baseline_f1_score * 100).toFixed(1)}% base
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">Harmonic mean balance</p>
            </div>
          </div>

          {/* Confusion Matrix & Feature Importances (2 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Confusion Matrix (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#27272A]">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    Empirical Confusion Matrix
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Row: Ground Truth Actual Label &nbsp;|&nbsp; Column: Model Predicted Tier
                  </p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#27272A]">
                  Test Partition
                </span>
              </div>

              {matrix.length > 0 && labels.length > 0 ? (
                <div className="border border-slate-200 dark:border-[#27272A] rounded-md overflow-x-auto text-xs">
                  <table className="w-full min-w-[420px] border-collapse text-center">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-[#27272A]">
                        <th className="py-2.5 px-3 text-left bg-slate-100/70 dark:bg-[#141416]">Actual \ Predicted</th>
                        {labels.map((lbl) => (
                          <th key={lbl} className="py-2.5 px-3 font-mono">
                            {lbl}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {labels.map((actualLabel, rowIdx) => (
                        <tr
                          key={actualLabel}
                          className="border-b border-slate-100 dark:border-[#27272A] last:border-0 hover:bg-slate-50/50 dark:hover:bg-zinc-800/40"
                        >
                          <td className="py-2.5 px-3 text-left font-semibold text-slate-800 dark:text-zinc-200 bg-slate-50/70 dark:bg-[#141416]">
                            {actualLabel}
                          </td>
                          {matrix[rowIdx]?.map((val, colIdx) => {
                            const isDiagonal = rowIdx === colIdx;
                            return (
                              <td
                                key={colIdx}
                                className={`py-2.5 px-3 font-mono font-medium ${
                                  isDiagonal
                                    ? val > 0
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                                      : 'text-slate-700 dark:text-zinc-300'
                                    : val > 0
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold'
                                    : 'text-slate-400 dark:text-zinc-500'
                                }`}
                              >
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 dark:text-zinc-500 text-xs">
                  Confusion matrix is currently unavailable for this model checkpoint.
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-[#27272A]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> True Positives (Accurate Tier)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Off-Diagonal (Tier Shift)
                </span>
              </div>
            </div>

            {/* Feature Importances (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#27272A]">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    Feature Importances (Gini)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">Weight</span>
              </div>

              {featureEntries.length > 0 ? (
                <div className="space-y-3">
                  {featureEntries.map(([feat, score]) => (
                    <div key={feat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-zinc-300">
                        <span>{feat.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-slate-500 dark:text-zinc-400">{(score * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(4, score * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 dark:text-zinc-500 text-xs">
                  Feature importances are currently unavailable.
                </div>
              )}
            </div>
          </div>

          {/* Model Hyperparameters & Provenance */}
          <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#27272A]">
              <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Model Hyperparameters &amp; Target Schema
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-[#18181B] rounded-md border border-slate-200 dark:border-[#27272A] space-y-2">
                <div className="font-semibold text-slate-800 dark:text-zinc-200 mb-1">Scikit-Learn Estimator Hyperparameters</div>
                {metrics.hyperparameters && Object.keys(metrics.hyperparameters).length > 0 ? (
                  Object.entries(metrics.hyperparameters).map(([k, v]) => (
                    <div key={k} className="flex justify-between font-mono text-[11px]">
                      <span className="text-slate-500 dark:text-zinc-400">{k}:</span>
                      <span className="text-slate-800 dark:text-zinc-200 font-semibold">{String(v)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 dark:text-zinc-400 text-xs">Default Random Forest parameters</p>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-[#18181B] rounded-md border border-slate-200 dark:border-[#27272A] space-y-2">
                <div className="font-semibold text-slate-800 dark:text-zinc-200 mb-1">Class Distribution in Dataset</div>
                {metrics.class_distribution && Object.keys(metrics.class_distribution).length > 0 ? (
                  Object.entries(metrics.class_distribution).map(([tier, count]) => (
                    <div key={tier} className="flex justify-between font-mono text-[11px]">
                      <span className="text-slate-500 dark:text-zinc-400">{tier}:</span>
                      <span className="text-slate-800 dark:text-zinc-200 font-semibold">{count} samples</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 dark:text-zinc-400 text-xs">Balanced risk tier distribution</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
