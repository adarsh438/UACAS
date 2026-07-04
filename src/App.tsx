import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  School, 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  Database, 
  FileText, 
  Settings, 
  BarChart3, 
  MessageSquare,
  Search,
  Bell,
  Menu,
  X,
  Plus,
  Microscope,
  GraduationCap,
  Award,
  TrendingUp,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import NBADashboard from './components/nba/NBADashboard';
import OBETracking from './components/OBETracking';
import ReportEngine from './components/ReportEngine';
import EvidenceVault from './components/EvidenceVault';
import Login from './components/Login';
import NAACDashboard from './components/naac/NAACDashboard';
import CriterionForm from './components/naac/CriterionForm';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AQARDashboard from './components/aqar/AQARDashboard';
import LandingPage from './components/LandingPage';
import NIRFDashboard from './components/nirf/NIRFDashboard';
import SuperAdminPanel from './components/admin/SuperAdminPanel';
import ErrorBoundary from './components/ErrorBoundary';
import ForceChangePassword from './components/ForceChangePassword';
import SetupWizard from './components/SetupWizard';
import GettingStartedBanner from './components/GettingStartedBanner';
import HelpGuide from './components/HelpGuide';
import { Routes, Route, Navigate } from 'react-router-dom';
// Authentication handled via Auth.js

// --- Types ---
interface StatData {
  totalFaculty: number;
  totalStudents: number;
  naacProgress: number;
  nbaProgress: number;
  complianceScore: number;
  pendingEvidences: number;
  totalPublications?: number;
  totalPatents?: number;
  totalGrantsINR?: number;
  totalPlaced?: number;
  totalMoUs?: number;
}

// --- Roles definition & access matrix metadata ---
const ROLES = [
  { id: 'SUPER_ADMIN', name: 'Super Admin', token: 'mock-jwt-superadmin' },
  { id: 'IQAC_COORDINATOR', name: 'IQAC Coordinator', token: 'mock-jwt-coordinator' },
  { id: 'DEPT_HEAD', name: 'Department Head', token: 'mock-jwt-depthead' },
  { id: 'FACULTY', name: 'Faculty Member', token: 'mock-jwt-faculty' },
  { id: 'REVIEWER', name: 'Peer Reviewer', token: 'mock-jwt-reviewer' }
];

// Global fetch interceptor: injects mock token (simulation) OR real JWT (logged-in user)
if (typeof window !== 'undefined' && !(window as any).__fetchIntercepted) {
  (window as any).__fetchIntercepted = true;
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    // Mock token takes precedence for simulation; fallback to real JWT
    const activeToken = (window as any).activeMockToken || (window as any).activeRealToken;
    if (activeToken) {
      init = init || {};
      let headers: any = init.headers || {};
      if (headers instanceof Headers) {
        if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${activeToken}`);
      } else if (Array.isArray(headers)) {
        const index = headers.findIndex((h: any) => h[0]?.toLowerCase() === 'authorization');
        if (index !== -1) {
          headers[index] = ['Authorization', `Bearer ${activeToken}`];
        } else {
          headers.push(['Authorization', `Bearer ${activeToken}`]);
        }
      } else {
        if (!headers['Authorization']) headers['Authorization'] = `Bearer ${activeToken}`;
      }
      init.headers = headers;
    }
    return originalFetch.call(this, input, init);
  };
}

// Helper to check view privileges based on roles
const hasTabAccess = (role: string, tab: string): boolean => {
  if (role === 'SUPER_ADMIN' || role === 'IQAC_COORDINATOR') return true;
  if (tab === 'system') return false;
  if (tab === 'ai' || tab === 'reports') return false;
  return true;
};

// Premium visual component for restricted page access
const AccessDeniedView = ({ tab, requiredRole, onSwitchRole }: { tab: string; requiredRole: string; onSwitchRole?: () => void; key?: string }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 font-sans">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 text-center space-y-6"
      >
        <div className="w-20 h-20 bg-red-50 rounded-full mx-auto flex items-center justify-center text-red-500 shadow-inner">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Access Restricted</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Your current role does not have authorization to access the <span className="font-semibold text-slate-700 capitalize">"{tab}"</span> module. This section requires elevated privileges.
          </p>
        </div>
        
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Minimum Role Required:</span>
            <span className="px-2 py-1 bg-red-100 text-red-700 font-bold rounded-md uppercase tracking-wide">{requiredRole}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Security policies enforce role separation to safeguard accreditation compliance data. Contact the system administrator to request access.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 text-sm"
          >
            Re-Authenticate Session
          </button>
          {onSwitchRole && (
            <button 
              onClick={onSwitchRole}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors text-sm"
            >
              Simulate Elevated Role
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <div 
    onClick={onClick}
    className={cn(
      "sidebar-nav-item",
      active && "active"
    )}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </div>
);

const StatCard = ({ label, value, trend, icon: Icon, suffix = "" }: any) => (
  <div className="p-6 glass-card rounded-2xl hover:bg-white/50 transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-blue-600/10 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <span className={cn(
          "text-xs font-bold px-2.5 py-1 rounded-full",
          trend > 0 ? "bg-emerald-500/20 text-emerald-700" : "bg-rose-500/20 text-rose-700"
        )}>
          {trend > 0 ? "+" : ""}{trend}%
        </span>
      )}
    </div>
    <div className="space-y-1 text-slate-800">
      <p className="text-sm font-semibold opacity-70">{label}</p>
      <h3 className="text-3xl font-extrabold tracking-tight">{value}{suffix}</h3>
    </div>
  </div>
);

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mockUser, setMockUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeMockRole, setActiveMockRole] = useState<string>('IQAC_COORDINATOR');
  const [stats, setStats] = useState<StatData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeCriterion, setActiveCriterion] = useState<number | null>(null);

  const [aiCriterion, setAiCriterion] = useState('3.1.1 - Research Facilities and Infrastructure');
  const [aiContext, setAiContext] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastBackedUp, setLastBackedUp] = useState<string | null>(null);

  const [university, setUniversity] = useState<any>(null);
  const [facultyList, setFacultyList] = useState<any[]>([]);

  const activeUser = session?.user || mockUser;

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          // Wrap to match the { user: ... } shape expected by the rest of the app
          setSession({ user: data.user });
          // Store the token for the fetch interceptor (cookie-based auth is the primary)
          if (data.user.role) {
            setActiveMockRole(data.user.role);
          }
        } else {
          setSession(null);
        }
      } else {
        setSession(null);
      }
    } catch (err) {
      console.error('Failed to fetch session:', err);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      // Clear in-memory tokens
      (window as any).activeRealToken = null;
      (window as any).activeMockToken = null;
      setSession(null);
      setMockUser(null);
    } catch (err) {
      console.error('Sign out failed', err);
      // Even if the server call fails, clear local state
      setSession(null);
      setMockUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // Synchronize mock token to the global window environment
  useEffect(() => {
    if (session?.user) {
      delete (window as any).activeMockToken;
      return;
    }
    const matchedRole = ROLES.find(r => r.id === activeMockRole);
    if (matchedRole) {
      (window as any).activeMockToken = matchedRole.token;
    } else {
      delete (window as any).activeMockToken;
    }
  }, [activeMockRole, session]);

  useEffect(() => {
    if (!activeUser) return; // Only fetch if logged in
    
    const matchedRole = ROLES.find(r => r.id === activeMockRole);
    const token = matchedRole ? matchedRole.token : 'mock-jwt-token';
    const headers = { 'Authorization': `Bearer ${token}` };

    fetch('/api/dashboard/stats', { headers })
      .then(res => res.json())
      .then(setStats)
      .catch(err => console.error(err));

    fetch('/api/university', { headers })
      .then(res => res.json())
      .then(setUniversity)
      .catch(err => console.error(err));

    fetch('/api/faculty', { headers })
      .then(res => res.json())
      .then(setFacultyList)
      .catch(err => console.error(err));
  }, [activeUser, activeMockRole]);

  const generateNarrative = async () => {
    if (!activeUser) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/narrative', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ criterion: aiCriterion, context: aiContext })
      });
      const data = await res.json();
      if (data.narrative) setAiResult(data.narrative);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async (format: 'pdf' | 'docx' | 'xlsx' | 'json' = 'pdf', year: string = '2024-25', inclusions?: any) => {
    if (!activeUser) return;
    try {
      const res = await fetch(`/api/reports/generate/${format}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ year, inclusions })
      });
      if (!res.ok) {
        throw new Error(`Server returned error: ${res.statusText}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `naac_ssr_report_${year}.${format === 'docx' ? 'docx' : format === 'xlsx' ? 'xlsx' : format === 'json' ? 'json' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!activeUser) {
    return (
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={
          <Login 
            onDemoLogin={(role) => {
              const matchedRole = ROLES.find(r => r.id === role);
              const matchedToken = matchedRole ? matchedRole.token : 'mock-jwt-token';
              setMockUser({
                uid: 'mock-user-id',
                email: `${role.toLowerCase()}@university.edu`,
                name: matchedRole?.name || 'Demo User',
                displayName: matchedRole?.name || 'Demo User',
                image: '',
                photoURL: ''
              });
              setActiveMockRole(role);
            }}
            onLoginSuccess={fetchSession}
          />
        } />
        <Route path="/" element={
          <LandingPage onLogin={() => window.location.href = '/login'} />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // ── Force Password Change Guard ──
  if (activeUser && session?.user?.mustChangePassword) {
    return (
      <ErrorBoundary>
        <ForceChangePassword onSuccess={fetchSession} />
      </ErrorBoundary>
    );
  }

  // ── First-Time Setup Wizard Guard ──
  if (activeUser && session?.user?.setupCompleted === false && (session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'IQAC_COORDINATOR')) {
    return (
      <ErrorBoundary>
        <SetupWizard onComplete={fetchSession} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen flex font-sans bg-mesh text-slate-100">
      {/* Sidebar */}
      <aside className={cn(
        "glass-sidebar transition-all duration-300 fixed h-full z-50 flex flex-col",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg">U</div>
          {isSidebarOpen && <span className="text-xl font-bold tracking-tight">UACAS</span>}
        </div>

        <nav className="px-3 mt-4 space-y-2 flex-1 overflow-y-auto overflow-x-hidden pb-4">
          <SidebarItem 
            icon={LayoutDashboard} 
            label={isSidebarOpen ? "Dashboard" : ""} 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={School} 
            label={isSidebarOpen ? "University Profile" : ""} 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
          />
          <SidebarItem 
            icon={Users} 
            label={isSidebarOpen ? "Faculty & Staff" : ""} 
            active={activeTab === 'faculty'} 
            onClick={() => setActiveTab('faculty')} 
          />
          <div className="pt-4 pb-2 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Accreditation</div>
          <SidebarItem 
            icon={ClipboardCheck} 
            label={isSidebarOpen ? "NAAC Module" : ""} 
            active={activeTab === 'naac'} 
            onClick={() => setActiveTab('naac')} 
          />
          <SidebarItem 
            icon={BarChart3} 
            label={isSidebarOpen ? "NBA Module" : ""} 
            active={activeTab === 'nba'} 
            onClick={() => setActiveTab('nba')} 
          />
          <SidebarItem 
            icon={FileText} 
            label={isSidebarOpen ? "AQAR Module" : ""} 
            active={activeTab === 'aqar'} 
            onClick={() => setActiveTab('aqar')} 
          />
          <SidebarItem 
            icon={BookOpen} 
            label={isSidebarOpen ? "OBE Tracking" : ""} 
            active={activeTab === 'obe'} 
            onClick={() => setActiveTab('obe')} 
          />
          <SidebarItem 
            icon={TrendingUp} 
            label={isSidebarOpen ? "NIRF Ranking" : ""} 
            active={activeTab === 'nirf'} 
            onClick={() => setActiveTab('nirf')} 
          />
          <div className="pt-4 pb-2 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Automation</div>
          <SidebarItem 
            icon={MessageSquare} 
            label={isSidebarOpen ? "AI Smart Hub" : ""} 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')} 
          />
          <SidebarItem 
            icon={FileText} 
            label={isSidebarOpen ? "Report Engine" : ""} 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')} 
          />
          <SidebarItem 
            icon={Database} 
            label={isSidebarOpen ? "Evidence Vault" : ""} 
            active={activeTab === 'evidence'} 
            onClick={() => setActiveTab('evidence')} 
          />
          <div className="pt-4 pb-2 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Maintenance</div>
          <SidebarItem 
            icon={Settings} 
            label={isSidebarOpen ? "System Management" : ""} 
            active={activeTab === 'system'} 
            onClick={() => setActiveTab('system')} 
          />
          <SidebarItem 
            icon={ShieldAlert} 
            label={isSidebarOpen ? "Super Admin" : ""} 
            active={activeTab === 'superadmin'} 
            onClick={() => setActiveTab('superadmin')} 
          />
        </nav>

        <div className="mt-auto p-3 shrink-0 border-t border-slate-800">
            <SidebarItem icon={FileText} label="Report Engine" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
            <SidebarItem icon={Settings} label="System Management" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            <div className="my-2 border-t border-slate-700"></div>
            <SidebarItem icon={HelpCircle} label="Help & FAQ" active={activeTab === 'help'} onClick={() => setActiveTab('help')} />
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        isSidebarOpen ? "ml-64" : "ml-20"
      )}>
        {/* Top Header */}
        <header className="h-16 glass-card border-b-0 border-white/10 flex items-center justify-between px-8 sticky top-0 z-40 text-slate-900">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search metrics, reports, faculty..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full w-80 text-sm focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Active Simulation Role Dropdown Selector */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all font-sans">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Simulated Role:</span>
              <select 
                value={activeMockRole} 
                onChange={(e) => {
                  const role = e.target.value;
                  setActiveMockRole(role);
                }}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer p-0 select-none pr-6 focus:outline-none"
              >
                {ROLES.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>

            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group" onClick={handleSignOut} title="Sign Out">
              <div className="text-right">
                <p className="text-sm font-semibold group-hover:text-red-500 transition-colors">{activeUser.name || activeUser.displayName || "Admin User"}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Sign Out</p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm group-hover:border-red-100 transition-colors">
                 <img src={activeUser.image || activeUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeUser.email}`} alt="Avatar" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Hub */}
        <div className="p-8 flex-1 relative">
          {activeMockRole === 'REVIEWER' && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-center gap-3 shadow-sm font-sans">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 animate-pulse" />
              <div className="text-sm font-medium">
                <span className="font-bold">Read-Only Review Mode:</span> As a Peer Reviewer, all write operations are disabled and metrics are presented in secure read-only mode.
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!hasTabAccess(activeMockRole, activeTab) ? (
              <AccessDeniedView 
                key="access-denied"
                tab={activeTab} 
                requiredRole={activeTab === 'system' ? 'SUPER_ADMIN' : 'IQAC_COORDINATOR'}
                onSwitchRole={() => {
                  if (activeTab === 'system') {
                    setActiveMockRole('SUPER_ADMIN');
                  } else {
                    setActiveMockRole('IQAC_COORDINATOR');
                  }
                }}
              />
            ) : (
              <React.Fragment key="tab-content">
                {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">Institutional Dashboard</h1>
                    <p className="text-slate-300">Live accreditation readiness and compliance metrics.</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={downloadReport}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                       <FileText className="w-4 h-4" /> Export SSR (PDF)
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
                       <Plus className="w-4 h-4" /> New Submission
                    </button>
                  </div>
                </div>

                {/* Getting Started Banner */}
                <GettingStartedBanner items={[
                  { label: 'Complete institution profile', completed: !!university?.name && !!university?.aisheCode, onClick: () => setActiveTab('profile') },
                  { label: 'Add departments & programs', completed: (stats?.totalFaculty || 0) > 0, onClick: () => setActiveTab('profile') },
                  { label: 'Enter Criterion I data', completed: (stats?.naacProgress || 0) > 5, onClick: () => { setActiveTab('naac'); } },
                  { label: 'Enter Criterion II data', completed: (stats?.naacProgress || 0) > 15, onClick: () => { setActiveTab('naac'); } },
                  { label: 'Enter Criterion III data', completed: (stats?.totalPublications || 0) > 0, onClick: () => { setActiveTab('naac'); } },
                  { label: 'Upload evidence documents', completed: (stats?.pendingEvidences || 0) > 0, onClick: () => setActiveTab('evidence') },
                  { label: 'Generate SSR report', completed: false, onClick: () => setActiveTab('reports') },
                ]} />

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  <StatCard icon={Users} label="Total Faculty" value={stats?.totalFaculty || 0} trend={12} />
                  <StatCard icon={School} label="Total Students" value={stats?.totalStudents?.toLocaleString('en-IN') || 0} trend={5} />
                  <StatCard icon={ClipboardCheck} label="NAAC Readiness" value={stats?.naacProgress || 0} trend={8} suffix="%" />
                  <StatCard icon={BarChart3} label="NBA Compliance" value={stats?.nbaProgress || 0} trend={15} suffix="%" />
                  <StatCard icon={Microscope} label="Publications" value={stats?.totalPublications || 0} trend={22} />
                  <StatCard icon={Award} label="Patents" value={stats?.totalPatents || 0} trend={10} />
                  <StatCard icon={TrendingUp} label="Research Grants" value={stats ? `₹${(stats.totalGrantsINR / 100000).toFixed(0)}L` : '—'} trend={18} />
                  <StatCard icon={GraduationCap} label="Students Placed" value={stats?.totalPlaced || 0} trend={14} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   {/* Main Analytics Chart Area */}
                   <div className="lg:col-span-2 space-y-6">
                      <div className="p-6 glass-card rounded-2xl min-h-[400px]">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800">Accreditation Growth (Criteria-wise)</h3>
                            <select className="text-xs bg-white/50 border-none rounded-lg font-medium p-2 text-slate-800 focus:outline-none">
                               <option>Academic Year 2024-25</option>
                               <option>Academic Year 2023-24</option>
                            </select>
                         </div>
                         <div className="h-[300px] flex items-center justify-center text-slate-400 italic">
                            [Interactive Recharts Visualization Placeholder]
                         </div>
                      </div>
                   </div>

                   {/* AI Insights & Assistant */}
                   <div className="space-y-6">
                     <div className="glass-card rounded-2xl p-6 h-full flex flex-col text-slate-800">
                       <div className="flex items-center gap-2 mb-4">
                         <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white">
                            <Sparkles className="w-4 h-4" />
                         </div>
                         <h3 className="font-bold text-lg">AI Readiness Insights</h3>
                       </div>
                       <p className="text-sm opacity-80 mb-4 leading-relaxed">
                          "Based on your current data, your institution is severely lagging in <strong className="font-bold">Criterion 3 (Research)</strong>. You have 0 registered patents this academic year, which may result in a sub-optimal grade. It is highly recommended to upload documentation for ongoing research grants."
                       </p>
                       <button className="mt-auto w-full py-2.5 border-2 border-blue-600/30 text-blue-700 font-bold rounded-xl hover:bg-blue-600/10 transition-colors">
                          Generate Action Plan
                       </button>
                     </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold">University Profile</h1>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Edit Profile</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                      Institutional Photo / Logo
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Institution Name</p>
                        <p className="font-semibold text-lg">{university?.name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Established</p>
                        <p className="font-semibold text-lg">{university?.established}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Location</p>
                        <p className="font-semibold text-lg">{university?.city}, {university?.state}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Category</p>
                        <p className="font-semibold text-lg">{university?.type}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-lg mb-6">Contact Information</h3>
                    <div className="space-y-4">
                       <input className="w-full p-4 bg-slate-50 rounded-xl border-none text-sm" placeholder="Website" defaultValue={university?.website || ""} />
                       <input className="w-full p-4 bg-slate-50 rounded-xl border-none text-sm" placeholder="Primary Address" defaultValue={university?.address || ""} />
                       <input className="w-full p-4 bg-slate-50 rounded-xl border-none text-sm" placeholder="Registrar Email" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'faculty' && (
              <motion.div 
                key="faculty"
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                   <h1 className="text-3xl font-bold">Faculty Management</h1>
                   <div className="flex gap-3">
                      <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold">Bulk Import</button>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Faculty
                      </button>
                   </div>
                </div>
                
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                   <table className="w-full text-left">
                     <thead className="bg-slate-50 border-b border-slate-100">
                       <tr>
                         <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Name</th>
                         <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Employee ID</th>
                         <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Department</th>
                         <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Designation</th>
                         <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {facultyList.map((f: any) => (
                         <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 font-medium">{f.name}</td>
                           <td className="px-6 py-4 text-sm font-mono text-slate-500">{f.employeeId}</td>
                           <td className="px-6 py-4 text-sm">{f.department?.name}</td>
                           <td className="px-6 py-4 text-sm">
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold uppercase">{f.designation}</span>
                           </td>
                           <td className="px-6 py-4 text-sm">
                              <button className="text-blue-600 font-bold hover:underline">Edit</button>
                           </td>
                         </tr>
                       ))}
                       {facultyList.length === 0 && (
                         <tr>
                           <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No faculty records found. Seeding initial data...</td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'naac' && (
              <motion.div 
                key="naac"
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {activeCriterion !== null ? (
                  <CriterionForm
                    criterion={activeCriterion}
                    onBack={() => setActiveCriterion(null)}
                    role={activeMockRole}
                  />
                ) : (
                  <NAACDashboard onCriterionSelect={(c) => setActiveCriterion(c)} />
                )}
              </motion.div>
            )}

            {activeTab === 'ai' && (
               <motion.div 
                key="ai"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto space-y-6 pt-12"
              >
                <div className="text-center space-y-2 mb-12">
                   <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl mb-4">
                      <MessageSquare className="w-8 h-8 text-white" />
                   </div>
                   <h1 className="text-3xl font-bold tracking-tight">AI Smart Narrative Hub</h1>
                   <p className="text-slate-500 text-lg">Generate professional SSR narratives using Gemini 1.5 Pro.</p>
                </div>

                <div className="glass-card p-8 rounded-3xl space-y-6 border-slate-200 shadow-2xl shadow-blue-100">
                   <div className="space-y-2">
                      <label className="text-sm font-bold uppercase tracking-wider text-slate-500">Select Accreditation Metric</label>
                      <select 
                        value={aiCriterion}
                        onChange={(e) => setAiCriterion(e.target.value)}
                        className="w-full p-4 bg-slate-50 border-slate-200 rounded-2xl font-medium focus:ring-2 focus:ring-blue-100 transition-all"
                      >
                        <option>Crit. 3.1.1 - Research Facilities</option>
                        <option>Crit. 1.2.1 - Academic Flexibility</option>
                        <option>Crit. 4.4.1 - Physical Facilities</option>
                        <option>NBA - PO/CO Attainment Analysis</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-bold uppercase tracking-wider text-slate-500">Data Points / Institutional Context</label>
                      <textarea 
                        value={aiContext}
                        onChange={(e) => setAiContext(e.target.value)}
                        className="w-full p-6 bg-slate-50 border-slate-200 rounded-2xl min-h-[150px] focus:ring-2 focus:ring-blue-100 transition-all font-medium" 
                        placeholder="E.g., Details about patents, funding, new buildings, or student success rates..."
                      />
                   </div>
                   <button 
                    onClick={generateNarrative}
                    disabled={isGenerating || !aiContext}
                    className={cn(
                      "w-full py-5 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-3",
                      isGenerating ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 text-white hover:bg-slate-800"
                    )}
                   >
                      {isGenerating ? "Gemini is Thinking..." : "Generate Narrative"} 
                      <AnimatePresence>
                        {isGenerating && <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>⏳</motion.span>}
                      </AnimatePresence>
                      {!isGenerating && <span>✨</span>}
                   </button>
                </div>

                {aiResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 bg-white border border-slate-100 rounded-3xl shadow-lg"
                  >
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                       <h3 className="font-bold text-lg text-blue-600">Generated Draft</h3>
                       <button 
                        onClick={() => { navigator.clipboard.writeText(aiResult); alert('Copied to clipboard!'); }}
                        className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200"
                       >
                         Copy Result
                       </button>
                    </div>
                    <div className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-700 leading-relaxed font-medium">
                      {aiResult}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
            
            {activeTab === 'system' && (
              <motion.div 
                key="system"
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold">System Management</h1>
                    <p className="text-slate-500">On-premise enterprise server control panel.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* License Info */}
                  <div className="p-8 bg-white rounded-3xl border border-blue-100 shadow-sm">
                    <div className="flex gap-4 items-center mb-6">
                      <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                         <ClipboardCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl">Perpetual License</h3>
                        <p className="text-sm text-green-600 font-bold uppercase tracking-widest">Status: Active</p>
                      </div>
                    </div>
                    <div className="space-y-4 font-medium text-slate-700">
                       <div className="flex justify-between py-2 border-b border-slate-50">
                          <span className="text-slate-500">Version</span>
                          <span>v1.2.0-Enterprise</span>
                       </div>
                       <div className="flex justify-between py-2 border-b border-slate-50">
                          <span className="text-slate-500">Licensed To</span>
                          <span>{university?.name || "Premium Client"}</span>
                       </div>
                       <div className="flex justify-between py-2">
                          <span className="text-slate-500">Instance ID</span>
                          <span className="font-mono text-xs">UACAS-SRV-8821-LOCAL</span>
                       </div>
                    </div>
                  </div>

                  {/* Backup Control */}
                  <div className="p-8 bg-slate-900 text-white rounded-3xl shadow-xl">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Database className="w-6 h-6" /> Local Database Backup
                    </h3>
                    <p className="text-slate-400 text-sm mb-6">Schedule backups of your local PostgreSQL instance and institutional records.</p>
                    
                    {lastBackedUp && (
                      <div className="mb-4 text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Last backed up: {lastBackedUp}
                      </div>
                    )}
                    
                    <div className="space-y-3">
                       <button 
                         onClick={() => {
                           setLastBackedUp(new Date().toLocaleString());
                           window.location.href = '/api/system/backup';
                         }}
                         className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold transition-all"
                       >
                          Create Instant Backup
                       </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'nba' && (
              <motion.div 
                key="nba"
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <NBADashboard />
              </motion.div>
            )}

            {activeTab === 'obe' && (
              <motion.div 
                key="obe"
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <OBETracking />
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <ReportEngine onDownload={downloadReport} />
              </motion.div>
            )}
            
            {activeTab === 'help' && (
              <motion.div
                key="help"
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <HelpGuide />
              </motion.div>
            )}

            {activeTab === 'evidence' && (
              <motion.div 
                key="evidence"
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <EvidenceVault />
              </motion.div>
            )}

            {activeTab === 'aqar' && (
              <motion.div 
                key="aqar"
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <AQARDashboard />
              </motion.div>
            )}

            {activeTab === 'nirf' && (
              <motion.div 
                key="nirf"
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <NIRFDashboard />
              </motion.div>
            )}

            {activeTab === 'superadmin' && (
              <motion.div 
                key="superadmin"
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <SuperAdminPanel />
              </motion.div>
            )}

            {!['dashboard', 'naac', 'ai', 'profile', 'faculty', 'system', 'nba', 'obe', 'reports', 'evidence', 'aqar', 'nirf', 'superadmin'].includes(activeTab) && (
              <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
                 <div className="p-8 bg-slate-100 rounded-full mb-6 text-slate-500">
                    <Settings className="w-12 h-12" />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-700">{activeTab.toUpperCase()} Module</h2>
                 <p className="max-w-md text-center mt-2">This dedicated enterprise module is currently under active build tracking. Stay tuned for automatic updates.</p>
              </div>
            )}
              </React.Fragment>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
    </ErrorBoundary>
  );
}
