import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  entityName: string;
}

export default function DestructiveActionConfirm({ isOpen, onClose, onConfirm, title, description, entityName }: Props) {
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const isMatched = confirmText === entityName;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-red-50 p-6 pb-5 flex items-start gap-4 border-b border-red-100">
            <div className="p-3 bg-red-100 rounded-2xl shrink-0">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-900 tracking-tight">{title}</h3>
              <p className="text-sm text-red-700 mt-1 leading-relaxed">
                {description}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6">
              <p className="text-sm text-slate-600">
                To confirm deletion, please type <strong className="text-slate-900 font-mono select-none">{entityName}</strong> below.
              </p>
            </div>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={entityName}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:ring-2 focus:ring-red-200 focus:border-red-500 transition-all"
              autoFocus
            />

            <div className="mt-8 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (isMatched) {
                    onConfirm();
                    onClose();
                  }
                }}
                disabled={!isMatched}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Permanently
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
