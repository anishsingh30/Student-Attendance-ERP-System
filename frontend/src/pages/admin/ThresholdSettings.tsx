import React, { useState, useEffect } from 'react';
import { Sliders, CheckCircle2, AlertCircle, Save, RotateCcw } from 'lucide-react';
import { api } from '../../api/client';
import { ThresholdConfig } from '../../types';

export const ThresholdSettings: React.FC = () => {
  const [config, setConfig] = useState<ThresholdConfig | null>(null);
  const [greenMin, setGreenMin] = useState<number>(80);
  const [yellowMin, setYellowMin] = useState<number>(75);
  const [orangeMin, setOrangeMin] = useState<number>(65);
  const [redMax, setRedMax] = useState<number>(65);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const th = await api.getThresholds();
        setConfig(th);
        setGreenMin(th.green_min);
        setYellowMin(th.yellow_min);
        setOrangeMin(th.orange_min);
        setRedMax(th.red_max);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchThresholds();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    // Validation
    if (greenMin <= yellowMin || yellowMin <= orangeMin) {
      setError('Threshold values must be hierarchical: Green > Yellow > Orange.');
      setSaving(false);
      return;
    }

    try {
      const updated = await api.updateThresholds({
        green_min: greenMin,
        yellow_min: yellowMin,
        orange_min: orangeMin,
        red_max: orangeMin
      });
      setConfig(updated);
      setSuccess('Institutional attendance thresholds successfully saved and activated.');
    } catch (err: any) {
      setError(err.message || 'Failed to update thresholds.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setGreenMin(80);
    setYellowMin(75);
    setOrangeMin(65);
    setRedMax(65);
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-10">
      
      <div className="pb-4 border-b border-slate-200 dark:border-[#27272A]">
        <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Institutional Attendance Thresholds</h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          Configure university policy thresholds for compliance, advisory warnings, and debarment risk.
        </p>
      </div>

      <div className="bg-white dark:bg-[#121215] p-5 sm:p-6 rounded-lg border border-slate-200 dark:border-[#27272A] shadow-xs">
        
        {success && (
          <div className="mb-4 p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* GREEN */}
          <div className="p-3.5 rounded-md bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                GREEN Zone (Fully Compliant)
              </label>
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">&gt;= {greenMin}%</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Students at or above this percentage comfortably satisfy all academic attendance standards.
            </p>
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={greenMin}
              onChange={(e) => setGreenMin(parseFloat(e.target.value))}
              className="w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-md px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* YELLOW */}
          <div className="p-3.5 rounded-md bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                YELLOW Zone (Approaching Shortage Warning)
              </label>
              <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">{yellowMin}% to {greenMin - 0.01}%</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Mandatory minimum threshold. Students approaching this margin receive early warning notices.
            </p>
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={yellowMin}
              onChange={(e) => setYellowMin(parseFloat(e.target.value))}
              className="w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-md px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* ORANGE */}
          <div className="p-3.5 rounded-md bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                ORANGE Zone (Attendance Shortage)
              </label>
              <span className="text-xs font-mono font-bold text-orange-700 dark:text-orange-400">{orangeMin}% to {yellowMin - 0.01}%</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Below threshold. Calculates consecutive session quotas required to regain compliance.
            </p>
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={orangeMin}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setOrangeMin(v);
                setRedMax(v);
              }}
              className="w-full bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-md px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* RED */}
          <div className="p-3.5 rounded-md bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                RED Zone (Debarment Risk)
              </label>
              <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-400">&lt; {orangeMin}%</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Critical academic deficit. Student is at severe risk of examination debarment.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-[#27272A] flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-[#18181B] hover:bg-slate-200 dark:hover:bg-[#202025] text-xs font-medium text-slate-700 dark:text-zinc-300 transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Standards (80 / 75 / 65)</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-medium text-white transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Thresholds'}</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
