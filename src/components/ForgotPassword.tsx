import React, { useState } from 'react';
import { School, Mail, ArrowRight, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }

    try {
      setStatus('loading');
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'If this email exists, a reset link has been sent.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to process request');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage('Server connection error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-950/30 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-900/70 border border-slate-800/80 rounded-3xl shadow-2xl p-8 backdrop-blur-xl relative z-10 space-y-6"
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <School className="w-8 h-8 text-white" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-200 bg-clip-text text-transparent tracking-tight">Password Reset</h1>
            <p className="text-slate-400 text-sm">Enter your email to receive a recovery link</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {status === 'error' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-red-950/40 border border-red-800/50 text-red-300 text-xs rounded-xl flex items-start gap-2.5 font-medium text-left"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Error</span>
                <span>{message}</span>
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs rounded-xl flex items-start gap-2.5 font-medium text-left"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Check Your Email</span>
                <span>{message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                disabled={status === 'success' || status === 'loading'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/15 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                Send Reset Link <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800/80 text-center">
          <Link to="/" className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
