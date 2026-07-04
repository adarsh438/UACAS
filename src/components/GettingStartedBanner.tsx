import React from 'react';
import { CheckCircle2, Circle, ArrowRight, Sparkles } from 'lucide-react';

interface CheckItem {
  label: string;
  completed: boolean;
  onClick?: () => void;
}

export default function GettingStartedBanner({ items, onDismiss }: { items: CheckItem[]; onDismiss?: () => void }) {
  const completed = items.filter(i => i.completed).length;
  const total = items.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (progress === 100) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Getting Started</h3>
            <p className="text-sm text-blue-100">Complete these steps to prepare your NAAC SSR submission.</p>
          </div>
          <div className="ml-auto text-right">
            <span className="text-2xl font-bold">{progress}%</span>
            <p className="text-[10px] text-blue-200 uppercase tracking-wide">Complete</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-white/20 rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition-colors text-left group"
            >
              {item.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-blue-300 shrink-0" />
              )}
              <span className={`text-sm font-medium ${item.completed ? 'text-blue-200 line-through' : 'text-white'}`}>
                {item.label}
              </span>
              {!item.completed && item.onClick && (
                <ArrowRight className="w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
