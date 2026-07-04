import React, { useState } from 'react';
import { School, ShieldAlert, Sparkles, ArrowRight, Mail, KeyRound, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface LoginProps {
  onDemoLogin: (role: string) => void;
  onLoginSuccess: () => void;
}

const DEMO_ROLES = [
  { id: 'SUPER_ADMIN', label: 'Super Admin' },
  { id: 'IQAC_COORDINATOR', label: 'IQAC Coordinator' },
  { id: 'DEPT_HEAD', label: 'Department Head' },
  { id: 'FACULTY', label: 'Faculty Member' },
  { id: 'REVIEWER', label: 'Peer Reviewer' },
];

export default function Login({ onDemoLogin, onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoRole, setDemoRole] = useState('IQAC_COORDINATOR');
  const [isSimulationEnabled, setIsSimulationEnabled] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send/receive cookies
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please check your credentials.');
        return;
      }

      // Store token in memory for Authorization header usage (mock system compatibility)
      if (data.token) {
        (window as any).activeMockToken = null; // Clear any stale mock token
        (window as any).activeRealToken = data.token;

        // Patch fetch to inject real JWT for API calls
        if (!(window as any).__realTokenInjected) {
          (window as any).__realTokenInjected = true;
          const originalFetch = window.fetch;
          window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
            const realToken = (window as any).activeRealToken;
            const mockToken = (window as any).activeMockToken;
            const token = mockToken || realToken;
            if (token) {
              init = init || {};
              let headers: any = init.headers || {};
              if (headers instanceof Headers) {
                if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
              } else if (Array.isArray(headers)) {
                const hasAuth = headers.some((h: any) => h[0]?.toLowerCase() === 'authorization');
                if (!hasAuth) headers.push(['Authorization', `Bearer ${token}`]);
              } else {
                if (!headers['Authorization']) headers['Authorization'] = `Bearer ${token}`;
              }
              init.headers = headers;
            }
            return originalFetch.call(this, input, init);
          };
        }
      }

      setSuccess('Access authorized! Loading your dashboard...');
      setTimeout(() => {
        onLoginSuccess();
      }, 800);
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to the authentication server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-950/30 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-950/10 blur-[200px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-lg bg-slate-900/70 border border-slate-800/80 rounded-3xl shadow-2xl p-8 backdrop-blur-xl relative z-10 space-y-6"
      >
        {/* Header Logo */}
        <div className="flex flex-col items-center space-y-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20"
          >
            <School className="w-8 h-8 text-white" />
          </motion.div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-200 bg-clip-text text-transparent tracking-tight">
              UACAS Enterprise
            </h1>
            <p className="text-slate-400 text-sm">Secure Portal for University Accreditation</p>
          </div>
        </div>

        {/* Feedback Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-red-950/40 border border-red-800/50 text-red-300 text-xs rounded-xl flex items-start gap-2.5 font-medium text-left"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Authorization Error</span>
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs rounded-xl flex items-start gap-2.5 font-medium text-left"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Operation Successful</span>
                <span>{success}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credentials Form */}
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onSubmit={handleCredentialsLogin}
          className="space-y-4 text-left"
        >
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="name@university.edu"
                autoComplete="email"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Seeded credentials hint */}
          <div className="px-3 py-2 bg-slate-800/40 border border-slate-700/40 rounded-lg">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              <span className="font-bold text-slate-300">Seeded accounts:</span>{' '}
              <span className="font-mono text-blue-400">admin@uacas.edu.in</span>{' '}
              or{' '}
              <span className="font-mono text-blue-400">iqac@uacas.edu.in</span>{' '}
              — password: <span className="font-mono text-slate-300">Demo@1234</span>
            </p>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/15 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                Sign In to UACAS <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </motion.form>



        {/* Footer */}
        <p className="text-center text-[10px] text-slate-600">
          UACAS Enterprise — On-Premise Edition · Secured with JWT
        </p>
      </motion.div>
    </div>
  );
}
