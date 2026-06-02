import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { School, ShieldAlert, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';


export default function Login({ onDemoLogin }: { onDemoLogin: (role: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoRole, setDemoRole] = useState('IQAC_COORDINATOR');

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100 space-y-6"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <School className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">UACAS Enterprise</h1>
          <p className="text-slate-500 text-sm">Sign in to access your accreditation portal</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-xs rounded-xl font-medium border border-red-100 flex flex-col gap-1">
            <span className="font-bold flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Firebase Auth Error</span>
            <span className="opacity-90">{error}</span>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm tracking-wide hover:bg-slate-800 transition-colors flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer shadow-md"
        >
          {isLoading ? (
            <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        {/* Premium simulated/demo bypass options */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Or Use Demo Mode</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Demo Role Privilege</label>
            <select
              value={demoRole}
              onChange={(e) => setDemoRole(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="IQAC_COORDINATOR">IQAC Coordinator</option>
              <option value="DEPT_HEAD">Department Head</option>
              <option value="FACULTY">Faculty Member</option>
              <option value="REVIEWER">Peer Reviewer</option>
            </select>
          </div>

          <button
            onClick={() => onDemoLogin(demoRole)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Simulate & Sign In as Demo
          </button>
        </div>
      </motion.div>
    </div>
  );
}
