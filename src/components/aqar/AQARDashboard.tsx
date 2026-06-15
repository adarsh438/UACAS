import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, Calendar, CheckCircle, Clock, AlertCircle,
  Download, Plus, ChevronRight, BarChart3, Eye
} from 'lucide-react';
import { cn } from '../../lib/utils';
import AQARForm from './AQARForm';

interface AqarStatusRecord {
  id: string;
  year: string;
  status: string;
  submittedDate: string | null;
  updatedAt: string;
  _count: { iqacActivities: number };
}

const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  DRAFT: { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Clock, label: 'Draft' },
  SUBMITTED: { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle, label: 'Submitted' },
  PENDING: { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: AlertCircle, label: 'Pending Review' },
};

export default function AQARDashboard() {
  const [records, setRecords] = useState<AqarStatusRecord[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/aqar/status');
      const data = await res.json();
      setRecords(data.records || []);
      setAvailableYears(data.availableYears || []);
    } catch (err) {
      console.error('Failed to fetch AQAR status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleDownload = async (year: string) => {
    setDownloading(year);
    try {
      const res = await fetch(`/api/aqar/generate/${year}`, { method: 'POST' });
      if (!res.ok) throw new Error('Generation failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AQAR_${year}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to generate AQAR document');
    } finally {
      setDownloading(null);
    }
  };

  const handleCreateNew = async (year: string) => {
    setSelectedYear(year);
  };

  if (selectedYear) {
    return (
      <AQARForm
        year={selectedYear}
        onBack={() => { setSelectedYear(null); fetchStatus(); }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const submittedCount = records.filter(r => r.status === 'SUBMITTED').length;
  const draftCount = records.filter(r => r.status === 'DRAFT').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AQAR Management</h1>
          <p className="text-slate-500 mt-1">Annual Quality Assurance Reports — auto-populated from SSR data</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-slate-500">Submitted</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{submittedCount}</h3>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-slate-500">In Draft</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{draftCount}</h3>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-slate-500">Available Years</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{availableYears.length + records.length}</h3>
        </div>
      </div>

      {/* Existing AQARs */}
      {records.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-700">AQAR Records</h2>
          <div className="grid gap-4">
            <AnimatePresence>
              {records.map((record, idx) => {
                const config = statusConfig[record.status] || statusConfig.DRAFT;
                const StatusIcon = config.icon;
                return (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                          <FileText className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">AQAR {record.year}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold', config.bg, config.color)}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {config.label}
                            </span>
                            <span className="text-xs text-slate-400">
                              {record._count.iqacActivities} IQAC activities logged
                            </span>
                            {record.submittedDate && (
                              <span className="text-xs text-slate-400">
                                • Submitted {new Date(record.submittedDate).toLocaleDateString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(record.year)}
                          disabled={downloading === record.year}
                          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          {downloading === record.year ? (
                            <span className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          Download .docx
                        </button>
                        <button
                          onClick={() => setSelectedYear(record.year)}
                          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Open
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Available years (no AQAR yet) */}
      {availableYears.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-700">Start New AQAR</h2>
          <p className="text-sm text-slate-500">These academic years have SSR data available but no AQAR created yet.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableYears.map(year => (
              <motion.button
                key={year}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCreateNew(year)}
                className="p-5 bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 group-hover:bg-blue-100 rounded-xl transition-colors">
                    <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{year}</p>
                    <p className="text-xs text-slate-400">Create AQAR from SSR data</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {records.length === 0 && availableYears.length === 0 && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-8">
          <div className="p-6 bg-slate-100 rounded-full mb-6">
            <FileText className="w-12 h-12 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700">No AQAR Data Available</h2>
          <p className="text-slate-500 mt-2 max-w-md">
            Enter SSR data for at least one academic year in the NAAC Module to auto-generate AQAR reports.
          </p>
        </div>
      )}
    </motion.div>
  );
}
