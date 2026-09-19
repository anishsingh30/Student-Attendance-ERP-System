import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User as UserIcon, Sparkles, AlertCircle, Clock, Zap } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
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
  const { engineStatus } = useNotifications();
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      role: 'assistant',
      content: `### Academic Attendance Advisor\nHello **${user?.full_name || 'Student'}**! I am your University Academic Attendance Advisor. I have access to your verified course attendance records and deterministic recovery calculations.\n\nHow can I assist you with your academic compliance today?`,
      suggested_actions: [
        'Explain my attendance situation to me in simple language, and give me practical advice for the next 2 weeks.',
        'Compare my attendance across all subjects and explain which subjects are most urgent and why.',
        'Which subject has my lowest attendance?',
        'How many classes do I need to attend to reach 75%?',
      ],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [isSlowWarning, setIsSlowWarning] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const slowTimerRef = useRef<any>(null);

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

    // Forward last 6 messages as conversation context
    const recentHistory = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userEntry]);
    if (!textToSend) setInput('');
    setLoading(true);
    setActiveStage('Retrieving authorized academic attendance records...');
    setIsSlowWarning(false);

    // Trigger slow warning after 8 seconds of continuous processing
    slowTimerRef.current = setTimeout(() => {
      setIsSlowWarning(true);
    }, 8000);

    // Temporary placeholder for streaming assistant response
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
          if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
          setIsSlowWarning(false);
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
          if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
          setIsSlowWarning(false);
          setActiveStage(null);
          console.error('[AI Assistant Error]', err);
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: 'I encountered a temporary connection issue. Your verified attendance records and What-If calculators remain available on your dashboard.',
              timestamp: new Date(),
              isStreaming: false,
            },
          ]);
        },
      });
    } catch (e: any) {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      setIsSlowWarning(false);
      setActiveStage(null);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Live AI is temporarily unavailable. Your attendance data remains fully accessible.',
          timestamp: new Date(),
          isStreaming: false,
        },
      ]);
    } finally {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      setLoading(false);
      setActiveStage(null);
      setIsSlowWarning(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white dark:bg-[#111111] rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs overflow-hidden animate-fade-in">
      
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#141414] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-700 dark:text-blue-300">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Academic Attendance Advisor
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                Live Fast AI
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-[#A3A3A3]">
              Deterministic calculations • Role-isolated context • High-speed streaming
            </p>
          </div>
        </div>

        {engineStatus && (
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 dark:text-[#737373] font-medium">Active Engine:</span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{engineStatus.display_badge}</p>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white dark:bg-[#0A0A0A]">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300'
              }`}
            >
              {m.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-xl space-y-2 ${m.role === 'user' ? 'items-end' : ''}`}>
              <div
                className={`p-4 rounded-xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-xs whitespace-pre-wrap'
                    : 'bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-slate-200 rounded-tl-none shadow-xs'
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

              {/* Suggestion action pills */}
              {m.suggested_actions && m.suggested_actions.length > 0 && !m.isStreaming && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {m.suggested_actions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      onClick={() => handleSend(act)}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-white dark:bg-[#171717] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-[#262626] hover:border-blue-300 dark:hover:border-blue-700 text-slate-700 dark:text-[#D4D4D4] hover:text-blue-700 dark:hover:text-blue-300 transition-all text-left shadow-xs erp-button cursor-pointer"
                    >
                      {act}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400 dark:text-[#737373]">
                <span>{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {m.telemetry && m.telemetry.provider && (
                  <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#171717] text-slate-600 dark:text-[#A3A3A3] border border-slate-200 dark:border-[#262626]">
                    <Sparkles className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                    {m.telemetry.provider.toUpperCase()}
                    {m.telemetry.model && ` (${m.telemetry.model})`}
                    {m.telemetry.latency_ms && ` • ${(m.telemetry.latency_ms / 1000).toFixed(1)}s`}
                    {m.telemetry.first_token_latency_ms && ` (1st: ${(m.telemetry.first_token_latency_ms / 1000).toFixed(1)}s)`}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && activeStage && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-700 dark:text-blue-300">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] text-xs text-slate-600 dark:text-[#A3A3A3] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500 animate-pulse" />
                <span className="font-medium text-slate-700 dark:text-slate-200">{activeStage}</span>
              </div>
            </div>

            {isSlowWarning && (
              <div className="ml-11 flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 rounded-lg max-w-md animate-fade-in">
                <Clock className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <span>AI is taking longer than usual. Your attendance data is still available.</span>
              </div>
            )}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#141414]">
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
            placeholder="Ask about your attendance, recovery requirements, lowest subjects..."
            disabled={loading}
            className="flex-1 bg-white dark:bg-[#111111] border border-slate-300 dark:border-[#262626] rounded-lg px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs disabled:bg-slate-100 dark:disabled:bg-[#1A1A1A]"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-all shadow-xs erp-button cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
