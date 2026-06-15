import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Calculator, Save, ChevronDown, ChevronUp,
  GraduationCap, BarChart3, TrendingUp, Globe, Star,
  CheckCircle, AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NIRFDataEntryProps {
  year: string;
  onBack: () => void;
}

const sectionConfig = [
  { id: 'tlr', label: 'Teaching, Learning & Resources', icon: GraduationCap, weight: '30%', color: 'blue' },
  { id: 'rp', label: 'Research & Professional Practice', icon: BarChart3, weight: '30%', color: 'violet' },
  { id: 'go', label: 'Graduation Outcomes', icon: TrendingUp, weight: '20%', color: 'emerald' },
  { id: 'oi', label: 'Outreach & Inclusivity', icon: Globe, weight: '10%', color: 'amber' },
  { id: 'pr', label: 'Perception', icon: Star, weight: '10%', color: 'red' },
];

export default function NIRFDataEntry({ year, onBack }: NIRFDataEntryProps) {
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['tlr']));
  const [computedScores, setComputedScores] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    tlr: {}, rp: {}, go: {}, oi: {}, pr: {},
  });
  const [autoFlags, setAutoFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/nirf/data/${year}`);
      const data = await res.json();

      if (data.autoPopulated) {
        setFormData(data.autoPopulated);
        // Track which fields are auto-populated
        const flags: Record<string, boolean> = {};
        Object.keys(data.autoPopulated).forEach(section => {
          Object.entries(data.autoPopulated[section]).forEach(([key, value]) => {
            if (value !== 0 && value !== false && value !== '' && value !== null) {
              flags[`${section}.${key}`] = true;
            }
          });
        });
        setAutoFlags(flags);
      }
    } catch (err) {
      console.error('Failed to load NIRF data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (section: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleCompute = async () => {
    setComputing(true);
    try {
      const res = await fetch(`/api/nirf/scores/${year}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      setComputedScores(result.scores);
    } catch (err) {
      alert('Failed to compute scores');
    } finally {
      setComputing(false);
    }
  };

  const toggleSection = (id: string) => {
    const next = new Set(expandedSections);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedSections(next);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const InputField = ({
    section, field, label, type = 'number', suffix
  }: {
    section: string; field: string; label: string; type?: string; suffix?: string;
  }) => {
    const isAuto = autoFlags[`${section}.${field}`];
    return (
      <div>
        <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block flex items-center gap-2">
          {label}
          {isAuto && (
            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded border border-emerald-200 normal-case">
              Auto
            </span>
          )}
        </label>
        <div className="relative">
          <input
            type={type}
            value={formData[section]?.[field] ?? ''}
            onChange={e => updateField(section, field, type === 'number' ? Number(e.target.value) : e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-100 focus:border-violet-300 transition-all"
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>
          )}
        </div>
      </div>
    );
  };

  const CheckboxField = ({
    section, field, label
  }: {
    section: string; field: string; label: string;
  }) => (
    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
      <input
        type="checkbox"
        checked={formData[section]?.[field] ?? false}
        onChange={e => updateField(section, field, e.target.checked)}
        className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
      />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">NIRF Data — {year}</h1>
            <p className="text-sm text-slate-500">5-parameter data entry and score computation</p>
          </div>
        </div>
        <button
          onClick={handleCompute}
          disabled={computing}
          className="px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 shadow-lg shadow-violet-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {computing ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Calculator className="w-4 h-4" />
          )}
          {computing ? 'Computing...' : 'Compute NIRF Scores'}
        </button>
      </div>

      {/* Info banner */}
      <div className="p-4 bg-violet-50 border border-violet-200 rounded-2xl flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-violet-800">
          <span className="font-bold">Fields marked "Auto"</span> are pre-filled from your NAAC SSR data. You can override them with manual values if needed.
        </div>
      </div>

      {/* Computed Scores Card */}
      {computedScores && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Computed NIRF Score</h3>
            <span className="text-4xl font-bold">{computedScores.totalScore.toFixed(1)}</span>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {computedScores.breakdown?.map((b: any, i: number) => (
              <div key={i} className="p-3 bg-white/10 rounded-xl text-center">
                <p className="text-xs text-white/70">{b.parameter.split(' ')[0]}</p>
                <p className="text-lg font-bold">{b.rawScore.toFixed(1)}</p>
                <p className="text-[10px] text-white/50">Weight: {b.weight}%</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Data Entry Sections */}
      {sectionConfig.map(section => {
        const isExpanded = expandedSections.has(section.id);
        const Icon = section.icon;
        return (
          <div key={section.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-xl', `bg-${section.color}-50 text-${section.color}-600`)}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">{section.label}</h3>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                  {section.weight}
                </span>
              </div>
              {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="px-5 pb-5 border-t border-slate-100"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {section.id === 'tlr' && (
                    <>
                      <InputField section="tlr" field="totalStudents" label="Total Students" />
                      <InputField section="tlr" field="totalFaculty" label="Total Faculty" />
                      <InputField section="tlr" field="sanctionedPosts" label="Sanctioned Posts" />
                      <InputField section="tlr" field="phdFaculty" label="Faculty with PhD" />
                      <InputField section="tlr" field="avgExperienceYears" label="Avg Experience" suffix="years" />
                      <InputField section="tlr" field="totalExpenditure" label="Total Expenditure" suffix="INR" />
                      <InputField section="tlr" field="capitalExpenditure" label="Capital Expenditure" suffix="INR" />
                      <InputField section="tlr" field="femaleStudents" label="Female Students" />
                      <InputField section="tlr" field="economicallyBackwardStudents" label="Reserved Category Students" />
                    </>
                  )}
                  {section.id === 'rp' && (
                    <>
                      <InputField section="rp" field="publicationsCount" label="Total Publications" />
                      <InputField section="rp" field="citationsCount" label="Citations Count" />
                      <InputField section="rp" field="scopusPublications" label="Scopus/WoS Publications" />
                      <InputField section="rp" field="patentsPublished" label="Patents Filed" />
                      <InputField section="rp" field="patentsGranted" label="Patents Granted" />
                      <InputField section="rp" field="fundedProjects" label="Funded Projects" />
                      <InputField section="rp" field="fundingAmount" label="Funding Amount" suffix="INR" />
                      <InputField section="rp" field="fpppAmount" label="Prof. Practice Earnings" suffix="INR" />
                    </>
                  )}
                  {section.id === 'go' && (
                    <>
                      <InputField section="go" field="graduatesLastYear" label="Graduates Last Year" />
                      <InputField section="go" field="placedStudents" label="Students Placed" />
                      <InputField section="go" field="higherStudiesStudents" label="Higher Studies" />
                      <InputField section="go" field="medianSalary" label="Median Salary" suffix="LPA" />
                      <InputField section="go" field="phdGraduates" label="PhD Graduates" />
                      <InputField section="go" field="totalStudentsGO" label="Total Students (GO)" />
                    </>
                  )}
                  {section.id === 'oi' && (
                    <>
                      <InputField section="oi" field="femaleStudentsPercent" label="Female Students" suffix="%" />
                      <InputField section="oi" field="economicallyBackwardPercent" label="Reserved Category" suffix="%" />
                      <InputField section="oi" field="regionalDiversityScore" label="Regional Diversity Score" suffix="/ 100" />
                      <InputField section="oi" field="femaleStudentsPhd" label="Female PhD Students" />
                      <InputField section="oi" field="totalPhDStudents" label="Total PhD Students" />
                      <div className="col-span-full">
                        <CheckboxField section="oi" field="facilitiesForDifferentlyAbled" label="Facilities for Differently Abled (Ramp, Lift, Braille, etc.)" />
                      </div>
                    </>
                  )}
                  {section.id === 'pr' && (
                    <>
                      <InputField section="pr" field="peerScore" label="Peer Perception Score" suffix="/ 100" />
                      <InputField section="pr" field="employerScore" label="Employer Perception Score" suffix="/ 100" />
                      <div className="col-span-full">
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                          <p className="text-sm text-amber-800">
                            <strong>Manual Input Required:</strong> Perception scores are based on external surveys and cannot be auto-populated from institutional data.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        );
      })}

      {/* Bottom action */}
      <div className="flex justify-end gap-3 pt-4 pb-8">
        <button
          onClick={handleCompute}
          disabled={computing}
          className="px-8 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 shadow-lg shadow-violet-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Calculator className="w-5 h-5" />
          {computing ? 'Computing...' : 'Compute & Save NIRF Scores'}
        </button>
      </div>
    </motion.div>
  );
}
