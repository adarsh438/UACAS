import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface HelpTooltipProps {
  metricCode?: string;
  title?: string;
  description: string;
}

export default function HelpTooltip({ metricCode, title, description }: HelpTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex ml-1">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShow(!show); }}
        className="text-slate-400 hover:text-blue-500 transition-colors focus:outline-none"
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {show && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShow(false)} />
          <div className="absolute left-6 top-0 z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-left">
            <div className="flex items-start justify-between mb-2">
              <div>
                {metricCode && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold uppercase tracking-wide mb-1 inline-block">
                    {metricCode}
                  </span>
                )}
                {title && <h4 className="text-sm font-bold text-slate-900 mt-1">{title}</h4>}
              </div>
              <button onClick={() => setShow(false)} className="text-slate-400 hover:text-slate-600 ml-2">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
          </div>
        </>
      )}
    </span>
  );
}
