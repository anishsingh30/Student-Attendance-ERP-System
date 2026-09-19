import React from 'react';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

/**
 * Safe, robust Markdown renderer for academic AI chat messages.
 * Formats headers, bullet lists, numbered lists, bold text, italics, inline code,
 * and paragraphs without raw asterisk artifacts or unsafe innerHTML.
 */
export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, className = '' }) => {
  const parseInline = (text: string): React.ReactNode[] => {
    // Regex matching **bold**, *italic*, `code`
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={i} className="italic text-slate-800 dark:text-slate-200">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#171717] font-mono text-[11px] text-blue-700 dark:text-blue-400 font-semibold border border-slate-200 dark:border-[#262626]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={`ul-${elements.length}`} className="space-y-1 my-2 pl-2">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-800 dark:text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-500 mt-1.5 flex-shrink-0" />
                <span className="flex-1 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${elements.length}`} className="space-y-1 my-2 pl-4 list-decimal text-slate-800 dark:text-slate-200">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed pl-1">
                {item}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Header 3 or 4: ### Header
    if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      flushList();
      const headerText = trimmed.replace(/^#+\s+/, '');
      elements.push(
        <h4 key={`h-${index}`} className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mt-3 mb-1.5 flex items-center gap-1.5">
          <span className="w-1 h-3.5 bg-blue-600 dark:bg-blue-500 rounded-xs" />
          {parseInline(headerText)}
        </h4>
      );
      return;
    }

    // Unordered List: •, -, *
    const bulletMatch = trimmed.match(/^([•\-\*])\s+(.+)$/);
    if (bulletMatch) {
      const itemContent = parseInline(bulletMatch[2]);
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [itemContent] };
      } else {
        currentList.items.push(itemContent);
      }
      return;
    }

    // Ordered List: 1. , 2.
    const numberMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberMatch) {
      const itemContent = parseInline(numberMatch[2]);
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [itemContent] };
      } else {
        currentList.items.push(itemContent);
      }
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${index}`} className="my-1.5 leading-relaxed text-slate-800 dark:text-slate-200">
        {parseInline(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className={`text-xs space-y-1 ${className}`}>{elements}</div>;
};
