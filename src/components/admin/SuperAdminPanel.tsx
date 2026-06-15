import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2, Users, Shield, Plus, Search, ChevronDown,
  MoreVertical, Key, Pause, Play, Eye, X, CheckCircle,
  AlertCircle, Crown, Mail, Database, TrendingUp, Clock
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface Institution {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  type: string | null;
  aisheCode: string | null;
  naacGrade: string | null;
  createdAt: string;
  stats: {
    users: number;
    departments: number;
    evidences: number;
    aqarRecords: number;
  };
  subscription: {
    plan: string;
    status: string;
    expiresAt: string;
  } | null;
  lastActivity: string | null;
  lastActiveUser: string | null;
  latestScore: { cgpa: number; grade: string; academicYear: string } | null;
}

const planColors: Record<string, string> = {
  BASIC: 'bg-slate-100 text-slate-700 border-slate-200',
  PRO: 'bg-blue-50 text-blue-700 border-blue-200',
  ENTERPRISE: 'bg-violet-50 text-violet-700 border-violet-200',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EXPIRED: 'bg-red-50 text-red-700 border-red-200',
  SUSPENDED: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function SuperAdminPanel() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInst, setSelectedInst] = useState<string | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Add form state
  const [addForm, setAddForm] = useState({
    name: '', city: '', state: '', type: '', aisheCode: '',
    adminName: '', adminEmail: '', adminPassword: '', plan: 'BASIC'
  });
  const [creating, setCreating] = useState(false);

  const fetchInstitutions = async () => {
    try {
      const res = await fetch('/api/admin/institutions');
      if (res.ok) {
        const data = await res.json();
        setInstitutions(data);
      }
    } catch (err) {
      console.error('Failed to fetch institutions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInstitutions(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/admin/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        setShowAddModal(false);
        setAddForm({ name: '', city: '', state: '', type: '', aisheCode: '', adminName: '', adminEmail: '', adminPassword: '', plan: 'BASIC' });
        fetchInstitutions();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create');
      }
    } catch {
      alert('Network error');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/institutions/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchInstitutions();
    } catch {
      alert('Failed to update status');
    }
    setActionMenuId(null);
  };

  const handleResetPassword = async (id: string) => {
    const newPassword = prompt('Enter new password (min 8 chars):');
    if (!newPassword || newPassword.length < 8) return;
    try {
      const res = await fetch(`/api/admin/institutions/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Password reset for ${data.userEmail}`);
      } else {
        alert(data.error);
      }
    } catch {
      alert('Failed to reset password');
    }
    setActionMenuId(null);
  };

  const filtered = institutions.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.city?.toLowerCase().includes(search.toLowerCase()) ||
    i.state?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Super Admin</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Institution Management</h1>
          <p className="text-slate-500 mt-1">Manage all registered institutions and subscriptions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Institution
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <Building2 className="w-4 h-4" /> Total Institutions
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{institutions.length}</h3>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 text-sm mb-2">
            <CheckCircle className="w-4 h-4" /> Active
          </div>
          <h3 className="text-3xl font-bold text-slate-900">
            {institutions.filter(i => i.subscription?.status === 'ACTIVE').length}
          </h3>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <Users className="w-4 h-4" /> Total Users
          </div>
          <h3 className="text-3xl font-bold text-slate-900">
            {institutions.reduce((s, i) => s + i.stats.users, 0)}
          </h3>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <Database className="w-4 h-4" /> Total Evidence Files
          </div>
          <h3 className="text-3xl font-bold text-slate-900">
            {institutions.reduce((s, i) => s + i.stats.evidences, 0)}
          </h3>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search institutions..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-100"
        />
      </div>

      {/* Institution List */}
      <div className="space-y-3">
        {filtered.map((inst, idx) => (
          <motion.div
            key={inst.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {inst.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-slate-900">{inst.name}</h3>
                    {inst.subscription && (
                      <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border', planColors[inst.subscription.plan] || planColors.BASIC)}>
                        {inst.subscription.plan}
                      </span>
                    )}
                    {inst.subscription && (
                      <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border', statusColors[inst.subscription.status] || statusColors.ACTIVE)}>
                        {inst.subscription.status}
                      </span>
                    )}
                    {inst.latestScore && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold border border-blue-200">
                        NAAC: {inst.latestScore.grade} ({inst.latestScore.cgpa.toFixed(2)})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                    {inst.city && <span>{inst.city}, {inst.state}</span>}
                    <span>{inst.stats.users} users</span>
                    <span>{inst.stats.departments} depts</span>
                    <span>{inst.stats.evidences} files</span>
                    {inst.lastActivity && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last: {new Date(inst.lastActivity).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setActionMenuId(actionMenuId === inst.id ? null : inst.id)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-slate-400" />
                </button>

                {actionMenuId === inst.id && (
                  <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    <button
                      onClick={() => handleResetPassword(inst.id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Key className="w-4 h-4 text-slate-500" /> Reset Password
                    </button>
                    {inst.subscription?.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleStatusChange(inst.id, 'SUSPENDED')}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-amber-600"
                      >
                        <Pause className="w-4 h-4" /> Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(inst.id, 'ACTIVE')}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-emerald-600"
                      >
                        <Play className="w-4 h-4" /> Activate
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="font-semibold text-slate-600">No institutions found</p>
        </div>
      )}

      {/* Add Institution Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Add New Institution</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Institution Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">City</label>
                    <input
                      type="text"
                      value={addForm.city}
                      onChange={e => setAddForm({ ...addForm, city: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">State</label>
                    <input
                      type="text"
                      value={addForm.state}
                      onChange={e => setAddForm({ ...addForm, state: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Admin Account</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Admin Name</label>
                      <input
                        type="text"
                        value={addForm.adminName}
                        onChange={e => setAddForm({ ...addForm, adminName: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Plan</label>
                      <select
                        value={addForm.plan}
                        onChange={e => setAddForm({ ...addForm, plan: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      >
                        <option value="BASIC">Basic</option>
                        <option value="PRO">Professional</option>
                        <option value="ENTERPRISE">Enterprise</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Admin Email *</label>
                    <input
                      type="email"
                      required
                      value={addForm.adminEmail}
                      onChange={e => setAddForm({ ...addForm, adminEmail: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Admin Password *</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={addForm.adminPassword}
                      onChange={e => setAddForm({ ...addForm, adminPassword: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 shadow-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {creating ? 'Creating...' : 'Create Institution'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
