import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquareText, 
  Send, 
  User as UserIcon, 
  Clock, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  RotateCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StudentDashboardData } from '../../types';
import { MarkdownMessage } from '../../components/common/MarkdownMessage';

interface ChatEntry {
  role: 'user' | 'assistant';
  content: string;
  suggested_actions?: string[];
  telemetry?: {
    provider?: string;
    model?: string;
    latency_ms?: number;
    first_token_latency_ms?: number;
    db_latency_ms?: number;
    calc_latency_ms?: number;
    status?: string;
  };
  timestamp: Date;
  isStreaming?: boolean;
}

export const StudentAI: React.FC = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null);
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      role: 'assistant',
      content: `### Attendance Advisory Assistant\nWelcome to the Academic Attendance Advisory service. I have access to your official semester attendance records and recovery guidelines.\n\nYou can ask about your current attendance status, specific course deficit quotas, or how to avoid debarment.`,
      suggested_actions: [
        'What is my overall attendance standing and deficit across all courses?',
        'Which course currently has the lowest attendance rate?',
        'How many consecutive classes must I attend in my shortage subjects to reach 75%?',
        'Explain the consequences of an attendance shortage under university regulations.'
      ],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const d = await api.getStudentDashboard();
        setDashboard(d);
      } catch (err) {
        console.error('Failed to load student context in advisory:', err);
      }
    };
    fetchContext();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeStage]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || loading) return;

    const userEntry: ChatEntry = {
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    const recentHistory = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userEntry]);
    if (!textToSend) setInput('');
    setLoading(true);
    setActiveStage('Retrieving registered attendance audit logs...');

    let accumulatedText = '';
    let hasCreatedAssistantBubble = false;

    try {
      await api.sendChatMessageStream(query, recentHistory, {
        onStage: (_stage, stageMessage) => {
          setActiveStage(stageMessage);
        },
        onChunk: (chunk) => {
          accumulatedText += chunk;
          if (!hasCreatedAssistantBubble) {
            hasCreatedAssistantBubble = true;
            setActiveStage(null);
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: accumulatedText,
                timestamp: new Date(),
                isStreaming: true,
              },
            ]);
          } else {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: accumulatedText,
                  isStreaming: true,
                };
              }
              return updated;
            });
          }
        },
        onDone: (doneData) => {
          setActiveStage(null);
          setMessages((prev) => {
            const updated = [...prev];
            if (hasCreatedAssistantBubble) {
              const lastIdx = updated.length - 1;
              updated[lastIdx] = {
                role: 'assistant',
                content: doneData.reply || accumulatedText,
                suggested_actions: doneData.suggested_actions,
                telemetry: doneData.telemetry,
                timestamp: new Date(),
                isStreaming: false,
              };
              return updated;
            } else {
              return [
                ...prev,
                {
                  role: 'assistant',
                  content: doneData.reply,
                  suggested_actions: doneData.suggested_actions,
                  telemetry: doneData.telemetry,
                  timestamp: new Date(),
                  isStreaming: false,
                },
              ];
            }
          });
        },
        onError: (err) => {
          setActiveStage(null);
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `⚠️ **Advisory Notice**: An error occurred while retrieving attendance guidance (${err.message}). Your attendance data remains fully accessible through the official Attendance Records tab.`,
              timestamp: new Date(),
            },
          ]);
        },
      });
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Advisory Error**: ${e.message || 'Unable to connect to advisory service.'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      setActiveStage(null);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                Academic Advisory
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 font-semibold">
                Attendance Advisory Assistant
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Integrated academic guidance powered by institutional attendance records and statutory recovery policies
            </p>
          </div>

          {dashboard && (
            <div className="text-right hidden sm:block">
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                Overall Standing: <strong>{dashboard.overall_percentage}%</strong> (Cutoff: 75%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (8 cols): Conversation Workspace */}
        <div className="lg:col-span-8 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg shadow-xs flex flex-col h-[600px] overflow-hidden">
          
          {/* Conversation Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-[#27272A] bg-slate-50/50 dark:bg-[#151518] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-blue-600" />
              <span>Advisory Dialogue</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
              Deterministic attendance responses
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  {m.role === 'user' ? (
                    <UserIcon className="w-3.5 h-3.5" />
                  ) : (
                    <span className="font-mono text-[10px]">ERP</span>
                  )}
                </div>

                <div className={`max-w-xl space-y-2 ${m.role === 'user' ? 'items-end' : ''}`}>
                  <div
                    className={`p-3.5 rounded-lg text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-800 dark:text-zinc-200'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <MarkdownMessage content={m.content} />
                    ) : (
                      <span>{m.content}</span>
                    )}
                    {m.isStreaming && (
                      <span className="inline-block w-1.5 h-3.5 bg-blue-600 dark:bg-blue-400 animate-pulse ml-1 align-middle" />
                    )}
                  </div>

                  {/* Suggested Follow-up Actions */}
                  {m.suggested_actions && m.suggested_actions.length > 0 && !m.isStreaming && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.suggested_actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleSend(act)}
                          className="erp-btn erp-btn-secondary text-[11px] px-2.5 py-1 text-left"
                        >
                          {act}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono px-1">
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {loading && activeStage && (
              <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-zinc-400 p-2 bg-slate-50 dark:bg-[#18181B] rounded border border-slate-200 dark:border-[#27272A]">
                <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span>{activeStage}</span>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-slate-200 dark:border-[#27272A] bg-slate-50/50 dark:bg-[#151518]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your course recovery quotas or debarment thresholds..."
                disabled={loading}
                className="erp-input flex-1 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="erp-btn erp-btn-primary p-2 text-white"
                aria-label="Send Query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* Right Column (4 cols): Verified Academic Attendance Context */}
        <div className="lg:col-span-4 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-[#27272A]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
              Verified Attendance Context
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Live semester records used to evaluate queries
            </p>
          </div>

          {dashboard ? (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-[#18181B] rounded border border-slate-200 dark:border-[#27272A]">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">Cumulative Rate</span>
                  <span className={`text-base font-bold ${
                    dashboard.overall_percentage >= 75 ? 'text-slate-900 dark:text-zinc-100' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {dashboard.overall_percentage}%
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                  Required: <strong>75%</strong> • At-Risk Subjects: <strong>{dashboard.subjects_below_threshold}</strong>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block mb-2">
                  Course Breakdown
                </span>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {dashboard.subjects.map((sub) => (
                    <div 
                      key={sub.subject_id}
                      className="p-2.5 rounded bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-xs flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-mono text-[10px] text-slate-500 block">{sub.subject_code}</span>
                        <span className="font-medium text-slate-900 dark:text-zinc-100 truncate block">{sub.subject_name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`font-bold ${
                          sub.percentage >= sub.required_threshold ? 'text-slate-900 dark:text-zinc-100' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {sub.percentage}%
                        </span>
                        {sub.consecutive_classes_needed > 0 && (
                          <span className="text-[10px] text-rose-600 block">
                            +{sub.consecutive_classes_needed} needed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#27272A] space-y-1.5">
                <a
                  href="/student/simulator"
                  className="w-full text-center px-3 py-1.5 rounded border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] hover:bg-slate-50 text-xs font-medium text-slate-700 dark:text-zinc-300 transition-colors block"
                >
                  Open What-If Simulator
                </a>
                <a
                  href="/student/attendance"
                  className="w-full text-center px-3 py-1.5 rounded border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] hover:bg-slate-50 text-xs font-medium text-slate-700 dark:text-zinc-300 transition-colors block"
                >
                  Full Attendance History
                </a>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              Loading student attendance context...
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
