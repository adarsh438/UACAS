import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp, Download, Calculator, ChevronRight, BarChart3,
  GraduationCap, Users, Globe, Star, AlertCircle, RefreshCw
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, BarChart, Bar, Cell
} from 'recharts';
import NIRFDataEntry from './NIRFDataEntry';

interface NirfRecord {
  id: string;
  year: string;
  tlrScore: number;
  rpScore: number;
  goScore: number;
  oiScore: number;
  prScore: number;
  totalScore: number;
  rank: number | null;
}

const parameterConfig = [
  { key: 'tlrScore', label: 'TLR', fullName: 'Teaching, Learning & Resources', weight: 30, color: '#3b82f6', icon: GraduationCap },
  { key: 'rpScore', label: 'RP', fullName: 'Research & Professional Practice', weight: 30, color: '#8b5cf6', icon: BarChart3 },
  { key: 'goScore', label: 'GO', fullName: 'Graduation Outcomes', weight: 20, color: '#10b981', icon: TrendingUp },
  { key: 'oiScore', label: 'OI', fullName: 'Outreach & Inclusivity', weight: 10, color: '#f59e0b', icon: Globe },
  { key: 'prScore', label: 'PR', fullName: 'Perception', weight: 10, color: '#ef4444', icon: Star },
];

export default function NIRFDashboard() {
  const [records, setRecords] = useState<NirfRecord[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/nirf/dashboard');
      const data = await res.json();
      setRecords(data.records || []);
      setAvailableYears(data.availableYears || []);
    } catch (err) {
      console.error('Failed to fetch NIRF dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleDownload = async (year: string) => {
    setDownloading(true);
    try {
      const res = await fetch('/api/nirf/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NIRF_Report_${year}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert('Failed to generate NIRF report');
    } finally {
      setDownloading(false);
    }
  };

  if (selectedYear) {
    return (
      <NIRFDataEntry
        year={selectedYear}
        onBack={() => { setSelectedYear(null); fetchDashboard(); }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const latestRecord = records[0];
  const radarData = latestRecord
    ? parameterConfig.map(p => ({
        parameter: p.label,
        score: (latestRecord as any)[p.key],
        fullMark: 100,
      }))
    : [];

  const trendData = [...records].reverse().map(r => ({
    year: r.year,
    Total: r.totalScore,
    TLR: r.tlrScore,
    RP: r.rpScore,
    GO: r.goScore,
    OI: r.oiScore,
    PR: r.prScore,
  }));

  // Years that have SSR data but no NIRF scores yet
  const scoredYears = records.map(r => r.year);
  const newYears = availableYears.filter(y => !scoredYears.includes(y));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">NIRF Ranking Module</h1>
          <p className="text-slate-500 mt-1">National Institutional Ranking Framework — 5-parameter score computation</p>
        </div>
      </div>

      {/* Top Stats */}
      {latestRecord && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl text-white shadow-xl shadow-violet-600/20">
            <p className="text-sm font-medium text-violet-200 uppercase tracking-wider">NIRF Score</p>
            <h2 className="text-4xl font-bold mt-2">{latestRecord.totalScore.toFixed(1)}</h2>
            <p className="text-sm text-violet-200 mt-1">out of 100 • {latestRecord.year}</p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Strongest Parameter</p>
            {(() => {
              const best = parameterConfig.reduce((best, p) =>
                (latestRecord as any)[p.key] > (latestRecord as any)[best.key] ? p : best
              , parameterConfig[0]);
              return (
                <div className="flex items-center gap-3 mt-2">
                  <div className="p-2.5 rounded-xl" style={{ backgroundColor: best.color + '15', color: best.color }}>
                    <best.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{best.fullName}</h3>
                    <p className="text-sm text-slate-500">{(latestRecord as any)[best.key].toFixed(1)} / 100</p>
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Weakest Parameter</p>
            {(() => {
              const worst = parameterConfig.reduce((worst, p) =>
                (latestRecord as any)[p.key] < (latestRecord as any)[worst.key] ? p : worst
              , parameterConfig[0]);
              return (
                <div className="flex items-center gap-3 mt-2">
                  <div className="p-2.5 rounded-xl bg-red-50 text-red-500">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{worst.fullName}</h3>
                    <p className="text-sm text-red-500">{(latestRecord as any)[worst.key].toFixed(1)} / 100 — Focus area</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      {latestRecord && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">NIRF Performance Radar</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="parameter" tick={{ fontSize: 12, fill: '#64748b' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#7c3aed"
                  fill="#7c3aed"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Parameter Scores</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={parameterConfig.map(p => ({
                name: p.label,
                score: (latestRecord as any)[p.key],
                weight: p.weight,
                color: p.color,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {parameterConfig.map((p, i) => (
                    <Cell key={i} fill={p.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {trendData.length > 1 && (
        <div className="glass-card p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Year-over-Year Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Total" stroke="#0f172a" strokeWidth={3} dot={{ r: 5 }} />
              {parameterConfig.map(p => (
                <Line key={p.key} type="monotone" dataKey={p.label} stroke={p.color} strokeWidth={1.5} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {records.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-700">Score Records</h2>
          <div className="space-y-3">
            {records.map((record, idx) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/20">
                      <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">NIRF {record.year}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm font-semibold text-violet-600">{record.totalScore.toFixed(1)} / 100</span>
                        {record.rank && (
                          <span className="text-xs bg-amber-50/50 text-amber-700 px-2 py-0.5 rounded-md font-bold border border-amber-200">
                            Rank #{record.rank}
                          </span>
                        )}
                        <div className="flex gap-2">
                          {parameterConfig.map(p => (
                            <span key={p.key} className="text-[10px] font-bold text-slate-400">
                              {p.label}: {(record as any)[p.key].toFixed(0)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(record.year)}
                      disabled={downloading}
                      className="px-4 py-2.5 glass-card border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      Report
                    </button>
                    <button
                      onClick={() => setSelectedYear(record.year)}
                      className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 shadow-lg shadow-violet-600/20 transition-all flex items-center gap-2"
                    >
                      <Calculator className="w-4 h-4" />
                      Recalculate
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {newYears.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-700">Compute New NIRF Scores</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {newYears.map(year => (
              <motion.button
                key={year}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedYear(year)}
                className="p-5 glass-card rounded-2xl border-2 border-dashed border-slate-200 hover:border-violet-400 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 group-hover:bg-violet-100 rounded-xl transition-colors">
                    <Calculator className="w-5 h-5 text-slate-400 group-hover:text-violet-600 transition-colors" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{year}</p>
                    <p className="text-xs text-slate-400">Compute NIRF scores</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {records.length === 0 && newYears.length === 0 && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-8">
          <div className="p-6 bg-violet-50 rounded-full mb-6">
            <TrendingUp className="w-12 h-12 text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700">No NIRF Data Available</h2>
          <p className="text-slate-500 mt-2 max-w-md">
            Enter SSR data for at least one academic year to auto-populate NIRF parameters and compute ranking scores.
          </p>
        </div>
      )}
    </motion.div>
  );
}
