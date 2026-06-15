import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers, Award, CheckSquare, BarChart, Download, Settings,
  Calculator, ChevronRight, CheckCircle, AlertCircle, RefreshCw,
  Plus, ArrowRight, Target, Database
} from 'lucide-react';
import { cn } from '../../lib/utils';
import COPOMatrix from './COPOMatrix';
import AttainmentChart from './AttainmentChart';

interface NBAProgram {
  id: string;
  programId: string;
  accreditationYear: string;
  tier: number;
  peos: any;
  courseOutcomes: any[];
  programOutcomes: any[];
}

export default function NBADashboard() {
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<any[]>([]);
  const [instPrograms, setInstPrograms] = useState<any[]>([]);
  const [activeProgram, setActiveProgram] = useState<NBAProgram | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProgramForm, setNewProgramForm] = useState({
    programId: '',
    accreditationYear: new Date().getFullYear().toString(),
    tier: 1,
  });

  const [calculating, setCalculating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/nba/programs');
      if (res.ok) {
        const data = await res.json();
        setPrograms(data.nbaPrograms);
        setInstPrograms(data.institutionPrograms);
        
        if (data.nbaPrograms.length > 0 && !activeProgram) {
          fetchProgramDetails(data.nbaPrograms[0].id);
        } else if (activeProgram) {
          fetchProgramDetails(activeProgram.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch NBA programs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/nba/dashboard/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveProgram(data);
      }
    } catch (err) {
      console.error('Failed to fetch program details', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramForm.programId) return;
    
    try {
      const res = await fetch('/api/nba/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProgramForm),
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchDashboard();
      } else {
        alert('Failed to create NBA program tracking');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleCalculateAttainment = async () => {
    if (!activeProgram) return;
    setCalculating(true);
    try {
      const res = await fetch(`/api/nba/attainment/calculate/${activeProgram.id}/${activeProgram.accreditationYear}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Using default scores for demo
      });
      if (res.ok) {
        await fetchProgramDetails(activeProgram.id);
      }
    } catch (err) {
      alert('Failed to calculate attainment');
    } finally {
      setCalculating(false);
    }
  };

  const handleDownloadSAR = async () => {
    if (!activeProgram) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/nba/reports/generate/${activeProgram.id}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Generation failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NBA_SAR_Report.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to generate SAR document');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const overallAttainment = activeProgram?.programOutcomes[0]?.attainments?.length > 0
    ? activeProgram.programOutcomes.reduce((s, po) => s + (po.attainments[0]?.attainmentLevel || 0), 0) / activeProgram.programOutcomes.length
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">NBA Module</h1>
          <p className="text-slate-500 mt-1">Program-level accreditation readiness for technical programs.</p>
        </div>
        <div className="flex items-center gap-3">
          {programs.length > 0 && (
            <select
              value={activeProgram?.id || ''}
              onChange={e => fetchProgramDetails(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-100"
            >
              {programs.map(p => (
                <option key={p.id} value={p.id}>
                  {instPrograms.find(ip => ip.id === p.programId)?.name || 'Program'} ({p.accreditationYear})
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Program
          </button>
        </div>
      </div>

      {!activeProgram && programs.length === 0 ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-slate-100">
          <div className="p-6 bg-blue-50 rounded-full mb-6">
            <Award className="w-12 h-12 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700">No NBA Programs Configured</h2>
          <p className="text-slate-500 mt-2 max-w-md">
            Start by adding a program to track its Course Outcomes (CO), Program Outcomes (PO), and attainment matrices.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-5 h-5" /> Setup NBA Tracking
          </button>
        </div>
      ) : activeProgram ? (
        <>
          {/* Main Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Attainment Chart */}
              <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">PO Attainment Levels</h3>
                    <p className="text-sm text-slate-500">Based on CO-PO mapping and direct/indirect assessments.</p>
                  </div>
                  <button
                    onClick={handleCalculateAttainment}
                    disabled={calculating}
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {calculating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Calculator className="w-4 h-4" />
                    )}
                    {calculating ? 'Computing...' : 'Compute Attainments'}
                  </button>
                </div>
                
                {activeProgram.programOutcomes[0]?.attainments?.length > 0 ? (
                  <AttainmentChart poAttainments={activeProgram.programOutcomes} />
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <BarChart className="w-10 h-10 mb-3 text-slate-300" />
                    <p className="text-sm font-medium">Attainments not yet calculated.</p>
                    <p className="text-xs mt-1">Click compute to run the attainment engine.</p>
                  </div>
                )}
              </div>

              {/* CO-PO Matrix */}
              <COPOMatrix 
                courseOutcomes={activeProgram.courseOutcomes} 
                programOutcomes={activeProgram.programOutcomes} 
              />
            </div>

            <div className="space-y-6">
              {/* Readiness Score Card */}
              <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <Award className="w-6 h-6 text-yellow-400" /> Overall Attainment
                </h3>
                
                <div className="my-6">
                  <div className="text-5xl font-bold text-white mb-2">
                    {overallAttainment > 0 ? overallAttainment.toFixed(2) : '-.--'}
                    <span className="text-xl text-slate-400 font-normal"> / 3.0</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn(
                      "px-2.5 py-1 text-xs font-bold rounded-full",
                      overallAttainment >= 2.0 ? "bg-emerald-500/20 text-emerald-400" :
                      overallAttainment > 0 ? "bg-amber-500/20 text-amber-400" :
                      "bg-slate-800 text-slate-400"
                    )}>
                      {overallAttainment >= 2.0 ? 'Level 3 Achieved' : 
                       overallAttainment >= 1.5 ? 'Level 2 Achieved' : 
                       overallAttainment > 0 ? 'Level 1 Achieved' : 'Not Calculated'}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6 pt-4 border-t border-slate-800">
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                    <CheckSquare className="w-4 h-4 text-emerald-400" /> COs Mapped: {activeProgram.courseOutcomes.length}
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                    <CheckSquare className="w-4 h-4 text-emerald-400" /> POs Defined: {activeProgram.programOutcomes.length}
                  </li>
                </ul>

                <button
                  onClick={handleDownloadSAR}
                  disabled={downloading}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {downloading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {downloading ? 'Generating SAR...' : 'Download SAR Report'}
                </button>
              </div>
              
              {/* Pre-qualifier status */}
              <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" /> Pre-Qualifier Status
                </h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                    <div>
                      <p className="text-sm font-bold text-slate-700">Student Admissions</p>
                      <p className="text-xs text-slate-500">{"\u003E"} 50% average over 3 years</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                    <div>
                      <p className="text-sm font-bold text-slate-700">Faculty-Student Ratio</p>
                      <p className="text-xs text-slate-500">Maintained below 1:20</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                    <div>
                      <p className="text-sm font-bold text-slate-700">PhD Faculty (Core)</p>
                      <p className="text-xs text-slate-500">Action required: Need 2 more PhDs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Add Program Modal */}
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
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">Track New NBA Program</h2>
              
              <form onSubmit={handleCreateProgram} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Institution Program *</label>
                  <select
                    required
                    value={newProgramForm.programId}
                    onChange={e => setNewProgramForm({ ...newProgramForm, programId: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="">Select a program...</option>
                    {instPrograms.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.department.name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Accreditation Target Year *</label>
                  <input
                    type="text"
                    required
                    value={newProgramForm.accreditationYear}
                    onChange={e => setNewProgramForm({ ...newProgramForm, accreditationYear: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">NBA Tier *</label>
                  <select
                    required
                    value={newProgramForm.tier}
                    onChange={e => setNewProgramForm({ ...newProgramForm, tier: Number(e.target.value) })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value={1}>Tier 1 (Washington Accord)</option>
                    <option value={2}>Tier 2</option>
                  </select>
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
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2"
                  >
                    Save
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
