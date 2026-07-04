// src/components/naac/NAACDashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend, CartesianGrid,
} from 'recharts';
import {
  Award, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight,
  BookOpen, Users, Microscope, Building2, GraduationCap, Settings, Leaf,
  Download, RefreshCw, Star
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────
interface MetricScore { code: string; label: string; score: number; maxScore: number; percentage: number; flag: string; value?: string; }
interface CriterionScore { criterion: number; title: string; totalScore: number; maxScore: number; percentage: number; weightage: number; weightedScore: number; metrics: MetricScore[]; }
interface InstitutionScore { academicYear: string; criteria: CriterionScore[]; totalWeightedScore: number; cgpa: number; predictedGrade: string; completionPercent: number; gapAnalysis: any[]; }

const CRITERION_ICONS = [BookOpen, Users, Microscope, Building2, GraduationCap, Settings, Leaf];
const CRITERION_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];
const GRADE_COLORS: Record<string, string> = {
  'A++': '#10b981', 'A+': '#22c55e', 'A': '#84cc16',
  'B++': '#f59e0b', 'B+': '#f97316', 'B': '#ef4444', 'C': '#dc2626',
};

const YEARS = ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25'];

// ── Sub-components ─────────────────────────────────────────
const GradeTag = ({ grade }: { grade: string }) => (
  <span style={{ background: GRADE_COLORS[grade] || '#94a3b8' }}
    className="px-3 py-1 rounded-full text-white font-black text-sm tracking-widest shadow-lg">
    {grade}
  </span>
);

const FlagDot = ({ flag }: { flag: string }) => {
  const color = flag === 'GREEN' ? 'bg-emerald-500' : flag === 'AMBER' ? 'bg-amber-400' : 'bg-red-500';
  return <span className={`w-2 h-2 rounded-full ${color} inline-block flex-shrink-0 mt-1.5`} />;
};

const CriterionCard = ({ cs, onClick, active }: { cs: CriterionScore; onClick: () => void; active: boolean; key?: React.Key }) => {
  const Icon = CRITERION_ICONS[cs.criterion - 1];
  const color = CRITERION_COLORS[cs.criterion - 1];
  const redMetrics = cs.metrics.filter(m => m.flag === 'RED').length;
  const amberMetrics = cs.metrics.filter(m => m.flag === 'AMBER').length;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      onClick={onClick}
      className={`p-5 rounded-2xl cursor-pointer border transition-all ${active ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/20' : 'glass-card hover:border-white/50'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>Criterion {cs.criterion}</p>
            <p className="text-sm font-bold text-slate-800 leading-tight">{cs.title}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-slate-900">{cs.totalScore.toFixed(0)}</p>
          <p className="text-xs text-slate-400">/{cs.maxScore}</p>
        </div>
      </div>

      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${cs.percentage}%` }}
          transition={{ duration: 1, delay: cs.criterion * 0.1 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-slate-600">{cs.percentage.toFixed(1)}% achieved</span>
        <div className="flex gap-2">
          {redMetrics > 0 && <span className="text-red-600 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" />{redMetrics} RED</span>}
          {amberMetrics > 0 && <span className="text-amber-600 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block" />{amberMetrics} AMBER</span>}
          {redMetrics === 0 && amberMetrics === 0 && <span className="text-emerald-600 font-bold">✓ All Green</span>}
        </div>
      </div>
    </motion.div>
  );
};

// ── Main Component ─────────────────────────────────────────
export default function NAACDashboard({ onCriterionSelect }: { onCriterionSelect: (c: number) => void }) {
  const [scoreData, setScoreData] = useState<InstitutionScore | null>(null);
  const [selectedYear, setSelectedYear] = useState('2024-25');
  const [selectedCriterion, setSelectedCriterion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'metrics' | 'gap'>('overview');

  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [selectedImportCriterion, setSelectedImportCriterion] = useState(1);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadErrors, setUploadErrors] = useState<any>(null);
  const [importedCount, setImportedCount] = useState(0);

  const fetchScores = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/naac/scores/${selectedYear}`);
      const data = await res.json();
      setScoreData(data);
    } catch (e) {
      console.error('Failed to fetch scores:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScores(); }, [selectedYear]);

  const radarData = scoreData?.criteria.map(c => ({
    subject: `C${c.criterion}`,
    score: c.percentage,
    fullMark: 100,
  })) || [];

  const barData = scoreData?.criteria.map(c => ({
    name: `C${c.criterion}`,
    score: c.totalScore,
    max: c.maxScore,
    percentage: c.percentage,
  })) || [];

  const selectedCriterionData = selectedCriterion !== null
    ? scoreData?.criteria.find(c => c.criterion === selectedCriterion)
    : null;

  const highPriorityGaps = scoreData?.gapAnalysis.filter(g => g.priority === 'HIGH') || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">NAAC Accreditation Hub</h1>
          <p className="text-slate-500 mt-1">Real-time criterion-wise scores & SSR readiness</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="px-4 py-2 glass-card rounded-xl text-sm font-bold text-slate-800 outline-none"
            id="naac-year-selector"
          >
            {YEARS.map(y => <option key={y}>{y}</option>)}
          </select>

          <button
            onClick={() => setIsBulkOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Bulk Data Hub
          </button>

          <button
            onClick={fetchScores}
            className="p-2 glass-card rounded-xl text-slate-600 hover:text-blue-600 transition-colors"
            title="Refresh scores"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Computing NAAC scores...</p>
          </div>
        </div>
      ) : scoreData ? (
        <>
          {/* Score Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="col-span-2 lg:col-span-1 p-6 rounded-2xl text-white shadow-xl"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">Predicted CGPA</p>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-black">{scoreData.cgpa.toFixed(2)}</span>
                <span className="text-indigo-300 text-sm mb-1">/4.00</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <GradeTag grade={scoreData.predictedGrade} />
                <span className="text-indigo-200 text-xs">Expected Grade</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="p-6 glass-card rounded-2xl shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Weighted Score</p>
              <p className="text-3xl font-black text-slate-900">{scoreData.totalWeightedScore.toFixed(0)}</p>
              <p className="text-slate-400 text-sm mt-1">/1000 total marks</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="p-6 glass-card rounded-2xl shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Data Completion</p>
              <p className="text-3xl font-black text-emerald-600">{scoreData.completionPercent}%</p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${scoreData.completionPercent}%` }} />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className={`p-6 rounded-2xl border shadow-sm ${highPriorityGaps.length > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${highPriorityGaps.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {highPriorityGaps.length > 0 ? 'High Priority Gaps' : 'All Metrics Green'}
              </p>
              <p className={`text-3xl font-black ${highPriorityGaps.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {highPriorityGaps.length > 0 ? highPriorityGaps.length : '✓'}
              </p>
              <p className="text-xs text-slate-400 mt-1">{highPriorityGaps.length > 0 ? 'metrics need attention' : 'No critical gaps'}</p>
            </motion.div>
          </div>

          {/* View Toggle */}
          <div className="glass-card rounded-2xl p-1.5 inline-flex mb-8">
            <button onClick={() => setActiveView('overview')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeView === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}>
              Overview
            </button>
            <button onClick={() => setActiveView('metrics')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeView === 'metrics' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}>
              Metric Detail
            </button>
            <button onClick={() => setActiveView('gap')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeView === 'gap' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:text-amber-600'}`}>
              Gap Analysis <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md text-[10px]">{scoreData.gapAnalysis.length}</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeView === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                  {/* Criterion Cards */}
                  <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scoreData.criteria.map(cs => (
                      <CriterionCard key={cs.criterion} cs={cs} active={selectedCriterion === cs.criterion}
                        onClick={() => setSelectedCriterion(selectedCriterion === cs.criterion ? null : cs.criterion)} />
                    ))}
                  </div>

                  {/* Radar Chart */}
                  <div className="xl:col-span-2 glass-card rounded-2xl p-6">
                    <h3 className="font-bold text-lg mb-1">Criteria Performance</h3>
                    <p className="text-slate-400 text-sm mb-6">Spider chart across all 7 NAAC criteria</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 700, fill: '#475569' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-7 gap-1">
                      {scoreData.criteria.map(c => (
                        <div key={c.criterion} className="text-center">
                          <div className="w-full h-1 rounded" style={{ background: CRITERION_COLORS[c.criterion - 1] }} />
                          <p className="text-xs font-bold mt-1 text-slate-600">C{c.criterion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="glass-card rounded-2xl p-6 mt-8">
                  <h3 className="font-bold text-lg mb-6">Score Distribution by Criterion</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', fontSize: 12 }}
                        formatter={(val: any, name: string) => [name === 'score' ? `${val} pts` : `${val} pts`, name === 'score' ? 'Scored' : 'Max Score']}
                      />
                      <Bar dataKey="max" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                        {barData.map((entry, i) => (
                          <Cell key={i} fill={CRITERION_COLORS[i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {activeView === 'metrics' && selectedCriterionData && (
              <motion.div key="metrics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="glass-card rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/20 flex justify-between items-center"
                  style={{ background: CRITERION_COLORS[selectedCriterionData.criterion - 1] + '10' }}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: CRITERION_COLORS[selectedCriterionData.criterion - 1] }}>
                      Criterion {selectedCriterionData.criterion}
                    </p>
                    <h3 className="text-xl font-black text-slate-900">{selectedCriterionData.title}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900">{selectedCriterionData.totalScore.toFixed(1)}</p>
                    <p className="text-slate-400 text-sm">/{selectedCriterionData.maxScore}</p>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {selectedCriterionData.metrics.map(m => (
                    <div key={m.code} className="p-4 flex items-start gap-4 hover:bg-white/50 transition-colors">
                      <FlagDot flag={m.flag} />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="text-xs font-mono font-bold text-slate-400 mr-2">{m.code}</span>
                            <span className="text-sm font-semibold text-slate-800">{m.label}</span>
                          </div>
                          <div className="text-right ml-4 flex-shrink-0">
                            <span className="text-sm font-black text-slate-900">{m.score.toFixed(1)}</span>
                            <span className="text-xs text-slate-400">/{m.maxScore}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${m.percentage}%` }}
                              className="h-full rounded-full"
                              style={{ background: m.flag === 'GREEN' ? '#10b981' : m.flag === 'AMBER' ? '#f59e0b' : '#ef4444' }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-500 w-12 text-right">{m.percentage.toFixed(1)}%</span>
                          {m.value && <span className="text-xs text-slate-400 italic">{m.value}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeView === 'metrics' && !selectedCriterionData && (
              <motion.div key="metrics-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-20 text-slate-400">
                <Star className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="font-semibold">Select a criterion card above to view detailed metric scores</p>
              </motion.div>
            )}

            {activeView === 'gap' && (
              <motion.div key="gap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">Gap Analysis Report</h3>
                    <p className="text-slate-400 text-sm">{scoreData.gapAnalysis.length} metrics below green threshold</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-100">
                      {scoreData.gapAnalysis.filter(g => g.priority === 'HIGH').length} HIGH
                    </span>
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full border border-amber-100">
                      {scoreData.gapAnalysis.filter(g => g.priority === 'MEDIUM').length} MEDIUM
                    </span>
                  </div>
                </div>

                {scoreData.gapAnalysis.length === 0 ? (
                  <div className="text-center py-20 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <p className="font-bold text-emerald-700 text-lg">Excellent! All metrics are above threshold.</p>
                    <p className="text-emerald-500 text-sm">No gaps requiring immediate attention.</p>
                  </div>
                ) : (
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-white/50 border-b border-white/20">
                        <tr>
                          {['Priority', 'Criterion', 'Metric', 'Score', 'Gap', 'Action'].map(h => (
                            <th key={h} className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {scoreData.gapAnalysis.map((g, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${g.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {g.priority}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm font-medium text-slate-700">C{g.criterion}</td>
                            <td className="px-5 py-4">
                              <p className="text-xs font-mono text-slate-400">{g.metric.code}</p>
                              <p className="text-sm font-semibold text-slate-800">{g.metric.label}</p>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-red-400" style={{ width: `${g.metric.percentage}%` }} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">{g.metric.percentage.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm font-bold text-red-600">+{g.gap.toFixed(1)} pts</td>
                            <td className="px-5 py-4">
                              <button
                                onClick={() => { setSelectedCriterion(g.criterion); setActiveView('metrics'); }}
                                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                View <ChevronRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Criterion Quick Access */}
          <div className="grid grid-cols-7 gap-3">
            {scoreData.criteria.map(cs => {
              const Icon = CRITERION_ICONS[cs.criterion - 1];
              return (
                <button key={cs.criterion}
                  onClick={() => onCriterionSelect(cs.criterion)}
                  className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group text-center"
                >
                  <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ background: CRITERION_COLORS[cs.criterion - 1] + '20' }}>
                    <Icon className="w-5 h-5" style={{ color: CRITERION_COLORS[cs.criterion - 1] }} />
                  </div>
                  <p className="text-xs font-black text-slate-700">C{cs.criterion}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{cs.percentage.toFixed(0)}%</p>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-slate-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <p>Failed to load NAAC scores. Please try again.</p>
        </div>
      )}

      {/* Premium Bulk Data Import/Export Hub Overlay Modal */}
      <AnimatePresence>
        {isBulkOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end font-sans">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkOpen(false)}
              className="absolute inset-0 bg-slate-900"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col p-8 overflow-y-auto space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    📥 Bulk Data Import & Backup
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">Manage NAAC Criteria records using Excel templates</p>
                </div>
                <button 
                  onClick={() => { setIsBulkOpen(false); setUploadStatus('idle'); setUploadErrors(null); }}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Consolidated Full backup exporter card */}
              <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 shadow-xl">
                <h3 className="text-lg font-bold flex items-center gap-2">💾 Full System Backup</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Export all NAAC tables across all 7 criteria into a multi-tab consolidated backup spreadsheet. Ideal for local archives and audits.
                </p>
                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/imports/export/backup');
                      if (!res.ok) throw new Error('Backup forbidden or failed');
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `naac_ssr_full_backup_${Date.now()}.xlsx`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                    } catch (e) {
                      alert('Export backup failed: Requires IQAC Coordinator or Super Admin privileges.');
                    }
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download Full backup (.xlsx)
                </button>
              </div>

              {/* Criterion Template Downloader Grid */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">1. Download Blank Import Templates</h3>
                <p className="text-xs text-slate-500">Includes headers matching database schemas and cell list dropdown validations.</p>
                
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(cNum => (
                    <button 
                      key={cNum}
                      onClick={async () => {
                        const res = await fetch(`/api/imports/templates/${cNum}`);
                        const blob = await res.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `naac_template_criterion_${cNum}.xlsx`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                      }}
                      className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 text-left rounded-xl transition-all flex items-center justify-between group"
                    >
                      <span className="text-xs font-bold text-slate-700">Criterion {cNum} Template</span>
                      <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Import Parser */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">2. Upload Filled Template</h3>
                <p className="text-xs text-slate-500">Ensure data is entered from Row 3 onwards and drop-down constraints are intact.</p>

                <div className="grid grid-cols-3 gap-3 items-center">
                  <span className="text-xs font-bold text-slate-600">Target Criterion:</span>
                  <select 
                    value={selectedImportCriterion}
                    onChange={e => setSelectedImportCriterion(parseInt(e.target.value))}
                    className="col-span-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(cNum => (
                      <option key={cNum} value={cNum}>Criterion {cNum}</option>
                    ))}
                  </select>
                </div>

                {/* Drag and drop zone */}
                <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/10 rounded-2xl p-8 text-center transition-all cursor-pointer">
                  <input 
                    type="file"
                    accept=".xlsx"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      setUploadStatus('uploading');
                      setUploadErrors(null);

                      const reader = new FileReader();
                      reader.onload = async (evt) => {
                        try {
                          const buffer = evt.target?.result;

                          const res = await fetch(`/api/imports/upload/${selectedImportCriterion}`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                            },
                            body: buffer as ArrayBuffer
                          });

                          const data = await res.json();
                          if (res.ok) {
                            setUploadStatus('success');
                            setImportedCount(data.importedCount);
                            fetchScores(); // re-load scores automatically!
                          } else {
                            setUploadStatus('error');
                            setUploadErrors(data.errors || { "Global": [{ error: data.error || "Upload failed" }] });
                          }
                        } catch (err) {
                          setUploadStatus('error');
                          setUploadErrors({ "System": [{ error: String(err) }] });
                        }
                      };
                      reader.readAsArrayBuffer(file);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">Drag & Drop completed .xlsx template here</p>
                    <p className="text-[10px] text-slate-400">or click to browse local folders</p>
                  </div>
                </div>

                {/* Import Status Alert Boxes */}
                {uploadStatus === 'uploading' && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center gap-3 text-xs font-bold">
                    <span className="animate-spin">⏳</span> Uploading and validating sheet records...
                  </div>
                )}

                {uploadStatus === 'success' && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl space-y-1 font-sans text-xs">
                    <p className="font-bold flex items-center gap-2 text-emerald-600">✓ Import Completed Successfully!</p>
                    <p className="text-[11px] text-slate-500">Transaction completed. Saved {importedCount} new rows across database sheets.</p>
                  </div>
                )}

                {uploadStatus === 'error' && uploadErrors && (
                  <div className="p-5 bg-red-50 border border-red-100 text-red-800 rounded-2xl space-y-3 font-sans text-xs max-h-[300px] overflow-y-auto">
                    <p className="font-bold text-red-600 flex items-center gap-2">⚠️ Import Rejected: Row-Level Failures Found</p>
                    <p className="text-[11px] text-slate-500">Database changes were rolled back to preserve integrity. Correct the sheets and retry:</p>
                    
                    <div className="space-y-2">
                      {Object.keys(uploadErrors).map(sheetName => (
                        <div key={sheetName} className="space-y-1">
                          <p className="font-bold text-slate-700 uppercase tracking-wide text-[10px]">{sheetName}</p>
                          <ul className="list-disc pl-4 space-y-1 text-slate-600">
                            {uploadErrors[sheetName].map((err: any, idx: number) => (
                              <li key={idx} className="text-[11px]">
                                <span className="font-semibold text-slate-700">Row {err.row || '—'}</span>: {err.error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
