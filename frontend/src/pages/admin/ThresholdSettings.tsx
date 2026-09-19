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
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-12">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Institutional Attendance Thresholds</h1>
        <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
          Configure university policy cutoffs for compliance, early warnings, and academic debarment risk.
        </p>
      </div>

      <div className="bg-white dark:bg-[#111111] p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs">
        
        {success && (
          <div className="mb-6 p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* GREEN */}
          <div className="p-4 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                GREEN Zone (Safe Attendance)
              </label>
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">&gt;= {greenMin}%</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-[#A3A3A3]">
              Students at or above this percentage are comfortably exceeding institutional standards.
            </p>
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={greenMin}
              onChange={(e) => setGreenMin(parseFloat(e.target.value))}
              className="w-full bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* YELLOW */}
          <div className="p-4 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                YELLOW Zone (Approaching Threshold Warning)
              </label>
              <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300">{yellowMin}% to {greenMin - 0.01}%</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-[#A3A3A3]">
              Mandatory minimum threshold. Students approaching this margin receive cautionary notices.
            </p>
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={yellowMin}
              onChange={(e) => setYellowMin(parseFloat(e.target.value))}
              className="w-full bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* ORANGE */}
          <div className="p-4 rounded-lg bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-orange-800 dark:text-orange-400 uppercase tracking-wider">
                ORANGE Zone (Attendance Shortage)
              </label>
              <span className="text-xs font-mono font-bold text-orange-700 dark:text-orange-300">{orangeMin}% to {yellowMin - 0.01}%</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-[#A3A3A3]">
              Below threshold. Triggers consecutive class recovery calculations and active alerts.
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
              className="w-full bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* RED */}
          <div className="p-4 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider">
                RED Zone (Critical Shortage / Examination Debarment Risk)
              </label>
              <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300">&lt; {orangeMin}%</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-[#A3A3A3]">
              Severe academic shortage. High risk of examination debarment.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#1a1a1a] hover:bg-slate-200 dark:hover:bg-[#262626] text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] transition-all inline-flex items-center gap-2 erp-button"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Standards (80 / 75 / 65)</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-semibold text-white transition-all shadow-xs inline-flex items-center gap-2 erp-button"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Policy Changes'}</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
