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
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import NBAModule from './components/NBAModule';
import OBETracking from './components/OBETracking';
import ReportEngine from './components/ReportEngine';
import EvidenceVault from './components/EvidenceVault';
import Login from './components/Login';
import NAACDashboard from './components/naac/NAACDashboard';
import CriterionForm from './components/naac/CriterionForm';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
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

// Global fetch interceptor to inject simulated JWT header dynamically
if (typeof window !== 'undefined' && !(window as any).__fetchIntercepted) {
  (window as any).__fetchIntercepted = true;
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const activeToken = (window as any).activeMockToken;
    if (activeToken) {
      init = init || {};
      let headers: any = init.headers || {};
      if (headers instanceof Headers) {
        headers.set('Authorization', `Bearer ${activeToken}`);
      } else if (Array.isArray(headers)) {
        const index = headers.findIndex(h => h[0].toLowerCase() === 'authorization');
        if (index !== -1) {
          headers[index] = ['Authorization', `Bearer ${activeToken}`];
        } else {
          headers.push(['Authorization', `Bearer ${activeToken}`]);
        }
      } else {
        headers['Authorization'] = `Bearer ${activeToken}`;
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
  <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <span className={cn(
          "text-xs font-semibold px-2 py-1 rounded-full",
          trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          {trend > 0 ? "+" : ""}{trend}%
        </span>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}{suffix}</h3>
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

  const [university, setUniversity] = useState<any>(null);
  const [facultyList, setFacultyList] = useState<any[]>([]);

  const activeUser = session?.user || mockUser;

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setSession(data);
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
      console.error('Failed to fetch Auth.js session:', err);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const csrfToken = await fetch('/api/auth/csrf').then(res => res.json()).then(data => data.csrfToken);
      const params = new URLSearchParams();
      params.append('csrfToken', csrfToken);
      
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      
      setSession(null);
      setMockUser(null);
    } catch (err) {
      console.error('Sign out failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // Synchronize mock token to the global window environment
  useEffect(() => {
    const matchedRole = ROLES.find(r => r.id === activeMockRole);
    if (matchedRole) {
      (window as any).activeMockToken = matchedRole.token;
    } else {
      delete (window as any).activeMockToken;
    }
  }, [activeMockRole]);

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

  const downloadReport = async (format: 'pdf' | 'docx' | 'xlsx' | 'json' = 'pdf', year: string = '2024-25') => {
    if (!activeUser) return;
    try {
      const res = await fetch(`/api/reports/generate/${format}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ year })
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
        <Route path="/" element={
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className={cn(
        "bg-[#1e293b] text-white transition-all duration-300 fixed h-full z-50",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg">U</div>
          {isSidebarOpen && <span className="text-xl font-bold tracking-tight">UACAS</span>}
        </div>

        <nav className="px-3 mt-4 space-y-2">
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
            icon={BookOpen} 
            label={isSidebarOpen ? "OBE Tracking" : ""} 
            active={activeTab === 'obe'} 
            onClick={() => setActiveTab('obe')} 
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
        </nav>

        <div className="absolute bottom-6 left-0 w-full px-3">
          <SidebarItem 
            icon={Settings} 
            label={isSidebarOpen ? "Settings" : ""} 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        isSidebarOpen ? "ml-64" : "ml-20"
      )}>
        {/* Top Header */}
        <header className="h-16 bg-white border-bottom border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
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
        <div className="p-8 max-w-7xl mx-auto">
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Institutional Dashboard</h1>
                    <p className="text-slate-500">Live accreditation readiness and compliance metrics.</p>
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
                      <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[400px]">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">Accreditation Growth (Criteria-wise)</h3>
                            <select className="text-xs bg-slate-50 border-none rounded-lg font-medium p-2">
                               <option>Academic Year 2024-25</option>
                               <option>Academic Year 2023-24</option>
                            </select>
                         </div>
                         <div className="h-[300px] flex items-center justify-center text-slate-400 italic">
                            [Interactive Recharts Visualization Placeholder]
                         </div>
                      </div>
                   </div>

                   {/* Quick Tasks / Recent Evidence */}
                   <div className="space-y-6">
                     <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-lg mb-4">Pending Approvals</h3>
                        <div className="space-y-4">
                           {[1, 2, 3].map(i => (
                             <div key={i} className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border-l-4 border-blue-500">
                                <div className="flex-1">
                                   <p className="text-sm font-semibold">Faculty Research Paper - C3.2</p>
                                   <p className="text-xs text-slate-500">Submitted by Dr. Sharma • 2h ago</p>
                                </div>
                                <div className="p-1 bg-blue-50 rounded-full">
                                   <ClipboardCheck className="w-4 h-4 text-blue-600" />
                                </div>
                             </div>
                           ))}
                        </div>
                        <button className="w-full mt-6 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                           View All Tasks
                        </button>
                     </div>

                     <div className="p-6 bg-[#0c4a6e] text-white rounded-2xl shadow-xl shadow-blue-900/20">
                        <h3 className="font-bold text-lg mb-2">AI Compliance Officer</h3>
                        <p className="text-xs text-slate-300 mb-4 line-height-relaxed">Based on current evidence, your NAAC Grade prediction has improved to <b>A+ (3.54 CGPA)</b>.</p>
                        <button className="px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100">
                           Get Suggestions
                        </button>
                     </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
                key={activeCriterion !== null ? `c${activeCriterion}` : 'naac-hub'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
                    <div className="space-y-3">
                       <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold transition-all">
                          Create Instant Backup
                       </button>
                       <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all">
                          Restore from Last Snapshot
                       </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'nba' && (
              <motion.div 
                key="nba"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <NBAModule />
              </motion.div>
            )}

            {activeTab === 'obe' && (
              <motion.div 
                key="obe"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <OBETracking />
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <ReportEngine onDownload={downloadReport} />
              </motion.div>
            )}

            {activeTab === 'evidence' && (
              <motion.div 
                key="evidence"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <EvidenceVault />
              </motion.div>
            )}

            {/* Fallback for other tabs */}
            {!['dashboard', 'naac', 'ai', 'profile', 'faculty', 'system', 'nba', 'obe', 'reports', 'evidence'].includes(activeTab) && (
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
  );
}
