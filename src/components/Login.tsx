import React, { useState } from 'react';
import { School, ShieldAlert, Sparkles, ArrowRight, Github, Mail, KeyRound, Chrome, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface LoginProps {
  onDemoLogin: (role: string) => void;
  onLoginSuccess: () => void;
}

export default function Login({ onDemoLogin, onLoginSuccess }: LoginProps) {
  const [activeTab, setActiveTab] = useState<'credentials' | 'email'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoRole, setDemoRole] = useState('IQAC_COORDINATOR');
  const [isSimulationEnabled, setIsSimulationEnabled] = useState(false);

  const getCsrfToken = async () => {
    const res = await fetch('/api/auth/csrf');
    const data = await res.json();
    return data.csrfToken;
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      const csrfToken = await getCsrfToken();
      
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `/api/auth/signin/${provider}`;
      
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrfToken';
      csrfInput.value = csrfToken;
      form.appendChild(csrfInput);
      
      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to authentication provider');
      setIsLoading(false);
    }
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      const csrfToken = await getCsrfToken();

      const params = new URLSearchParams();
      params.append('csrfToken', csrfToken);
      params.append('email', email);
      params.append('password', password);
      params.append('redirect', 'false');

      const res = await fetch('/api/auth/signin/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (res.ok) {
        const urlParams = new URLSearchParams(window.location.search);
        // Check if there was an error passed back in the cookies or redirect url
        const resText = await res.text();
        if (resText.includes('error=')) {
          setError('Invalid credentials. Please verify your email and password.');
        } else {
          setSuccess('Access authorized! Redirecting...');
          setTimeout(() => {
            onLoginSuccess();
          }, 1000);
        }
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Authentication server error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      const csrfToken = await getCsrfToken();

      const params = new URLSearchParams();
      params.append('csrfToken', csrfToken);
      params.append('email', email);
      params.append('redirect', 'false');

      const res = await fetch('/api/auth/signin/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (res.ok) {
        setSuccess('Magic Link requested! Check your server console logs for the sign-in URL.');
      } else {
        setError('Failed to send magic link. Is database configured correctly?');
      }
    } catch (err: any) {
      console.error(err);
      setError('Verification service unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-950/30 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-900/70 border border-slate-800/80 rounded-3xl shadow-2xl p-8 backdrop-blur-xl relative z-10 space-y-6"
      >
        {/* Header Logo */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <School className="w-8 h-8 text-white" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-200 bg-clip-text text-transparent tracking-tight">UACAS Enterprise</h1>
            <p className="text-slate-400 text-sm">Secure Portal for University Accreditation</p>
          </div>
        </div>

        {/* Feedback Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
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

        {/* OAuth Buttons Section */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800/50 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700/50 cursor-pointer disabled:opacity-50"
          >
            <Chrome className="w-4 h-4 text-blue-400" />
            Google Login
          </button>
          <button
            onClick={() => handleSocialLogin('github')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800/50 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700/50 cursor-pointer disabled:opacity-50"
          >
            <Github className="w-4 h-4 text-slate-300" />
            GitHub Login
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-wider">Or Connect Via Email</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Form Tabs */}
        <div className="bg-slate-950/60 p-1.5 rounded-2xl flex gap-1 border border-slate-800/60">
          <button
            onClick={() => { setActiveTab('credentials'); setError(null); }}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === 'credentials' ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Password Auth
          </button>
          <button
            onClick={() => { setActiveTab('email'); setError(null); }}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeTab === 'email' ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Magic Link
          </button>
        </div>

        {/* Tab Forms */}
        <AnimatePresence mode="wait">
          {activeTab === 'credentials' ? (
            <motion.form 
              key="credentials-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleCredentialsLogin}
              className="space-y-4 text-left"
            >
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
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  <a href="#" className="text-[10px] font-bold text-blue-400 hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/15 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    Sign In with Password <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="email-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleEmailMagicLink}
              className="space-y-4 text-left"
            >
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
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  A verification link will be printed to the backend console logs. Copy and load it in your browser to sign in.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    Send Magic Link <Mail className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Demo Bypass / Simulation Control */}
        <div className="pt-2 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Offline Simulation Access
            </span>
            <button
              onClick={() => setIsSimulationEnabled(!isSimulationEnabled)}
              className={cn(
                "w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer focus:outline-none",
                isSimulationEnabled ? "bg-blue-600" : "bg-slate-800"
              )}
            >
              <motion.div
                layout
                className="w-4 h-4 bg-slate-100 rounded-full shadow-md"
                animate={{ x: isSimulationEnabled ? 16 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          <AnimatePresence>
            {isSimulationEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80"
              >
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Demo Role Privilege</label>
                  <select
                    value={demoRole}
                    onChange={(e) => setDemoRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500"
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
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Simulate & Enter
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
