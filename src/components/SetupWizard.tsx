import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2, Calendar, GraduationCap, Users, CheckCircle2,
  ArrowRight, ArrowLeft, Upload, Plus, Trash2, Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

const STEPS = [
  { id: 1, title: 'Institution', icon: Building2 },
  { id: 2, title: 'Academics', icon: Calendar },
  { id: 3, title: 'Departments', icon: GraduationCap },
  { id: 4, title: 'Team', icon: Users },
  { id: 5, title: 'Complete', icon: CheckCircle2 },
];

const INSTITUTION_TYPES = ['University', 'Autonomous College', 'Affiliated College', 'Deemed University', 'Central University', 'State University'];
const ACADEMIC_YEARS = ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25', '2025-26'];

export default function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Institution Info
  const [inst, setInst] = useState({
    name: '', naacId: '', aisheCode: '', type: '',
    address: '', city: '', state: '', zipCode: '',
    contactEmail: '', contactPhone: '', website: '',
  });

  // Step 2: Academic Config
  const [selectedYears, setSelectedYears] = useState<string[]>(['2024-25']);
  const [activeYear, setActiveYear] = useState('2024-25');

  // Step 3: Departments & Programs
  const [departments, setDepartments] = useState<{name: string; code: string; programs: {name: string; level: string; intake: number}[]}[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

  // Step 4: Team (optional)
  const [teamMembers, setTeamMembers] = useState<{name: string; email: string; role: string}[]>([]);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'DEPT_HEAD' });

  const addDepartment = () => {
    if (!newDeptName.trim()) return;
    setDepartments([...departments, {
      name: newDeptName.trim(),
      code: newDeptCode.trim() || newDeptName.trim().substring(0, 4).toUpperCase(),
      programs: []
    }]);
    setNewDeptName('');
    setNewDeptCode('');
  };

  const removeDepartment = (idx: number) => {
    setDepartments(departments.filter((_, i) => i !== idx));
  };

  const addProgram = (deptIdx: number) => {
    const updated = [...departments];
    updated[deptIdx].programs.push({ name: '', level: 'UG', intake: 60 });
    setDepartments(updated);
  };

  const updateProgram = (deptIdx: number, progIdx: number, field: string, value: any) => {
    const updated = [...departments];
    (updated[deptIdx].programs[progIdx] as any)[field] = value;
    setDepartments(updated);
  };

  const removeProgram = (deptIdx: number, progIdx: number) => {
    const updated = [...departments];
    updated[deptIdx].programs = updated[deptIdx].programs.filter((_, i) => i !== progIdx);
    setDepartments(updated);
  };

  const addTeamMember = () => {
    if (!newMember.name.trim() || !newMember.email.trim()) return;
    setTeamMembers([...teamMembers, { ...newMember }]);
    setNewMember({ name: '', email: '', role: 'DEPT_HEAD' });
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          institution: inst,
          academicYears: selectedYears,
          activeYear,
          departments,
          teamMembers,
        }),
      });
      if (res.ok) {
        onComplete();
      } else {
        const data = await res.json();
        alert(data.error || 'Setup failed. Please try again.');
      }
    } catch {
      alert('Network error. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return inst.name.trim().length > 0;
    if (step === 2) return selectedYears.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome to UACAS</h1>
          <p className="text-slate-500 mt-2">Let's set up your institution in a few simple steps.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
                step >= s.id ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"
              )}>
                <s.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.title}</span>
              </div>
              {i < STEPS.length - 1 && <div className={cn("w-8 h-0.5 rounded", step > s.id ? "bg-blue-600" : "bg-slate-200")} />}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              {/* Step 1: Institution Info */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Institution Details</h2>
                    <p className="text-sm text-slate-500 mt-1">Basic information about your institution for NAAC compliance.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Institution Name *</label>
                      <input value={inst.name} onChange={e => setInst({...inst, name: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                        placeholder="e.g. XYZ College of Engineering" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">NAAC ID</label>
                      <input value={inst.naacId} onChange={e => setInst({...inst, naacId: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="NAAC permanent ID" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">AISHE Code</label>
                      <input value={inst.aisheCode} onChange={e => setInst({...inst, aisheCode: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="e.g. C-12345" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Institution Type</label>
                      <select value={inst.type} onChange={e => setInst({...inst, type: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all">
                        <option value="">Select type</option>
                        {INSTITUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Website</label>
                      <input value={inst.website} onChange={e => setInst({...inst, website: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="https://www.example.edu" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Address</label>
                      <input value={inst.address} onChange={e => setInst({...inst, address: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="Full address" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">City</label>
                      <input value={inst.city} onChange={e => setInst({...inst, city: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">State</label>
                      <input value={inst.state} onChange={e => setInst({...inst, state: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Contact Email</label>
                      <input value={inst.contactEmail} onChange={e => setInst({...inst, contactEmail: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="iqac@institution.edu" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Contact Phone</label>
                      <input value={inst.contactPhone} onChange={e => setInst({...inst, contactPhone: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="+91-XXXXXXXXXX" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Academic Configuration */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Academic Configuration</h2>
                    <p className="text-sm text-slate-500 mt-1">Select which academic years you want to track for NAAC assessment (typically last 5 years).</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">Academic Years to Track</label>
                    <div className="flex flex-wrap gap-2">
                      {ACADEMIC_YEARS.map(yr => (
                        <button key={yr} onClick={() => {
                          setSelectedYears(prev => prev.includes(yr) ? prev.filter(y => y !== yr) : [...prev, yr]);
                        }} className={cn(
                          "px-4 py-2 rounded-xl text-sm font-bold border transition-all",
                          selectedYears.includes(yr) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                        )}>
                          {yr}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Current Active Year</label>
                    <select value={activeYear} onChange={e => setActiveYear(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all">
                      {selectedYears.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Departments & Programs */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Departments & Programs</h2>
                    <p className="text-sm text-slate-500 mt-1">Add your academic departments and the programs they offer. You can always add more later.</p>
                  </div>

                  {/* Add Department */}
                  <div className="flex gap-2">
                    <input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="Department name (e.g. Computer Science)"
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" onKeyDown={e => e.key === 'Enter' && addDepartment()} />
                    <input value={newDeptCode} onChange={e => setNewDeptCode(e.target.value)} placeholder="Code"
                      className="w-24 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" onKeyDown={e => e.key === 'Enter' && addDepartment()} />
                    <button onClick={addDepartment} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-1">
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>

                  {/* Department List */}
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {departments.length === 0 && (
                      <p className="text-center text-slate-400 py-8 text-sm">No departments added yet. Add your first department above.</p>
                    )}
                    {departments.map((dept, di) => (
                      <div key={di} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="font-bold text-slate-900 text-sm">{dept.name}</span>
                            <span className="text-xs text-slate-400 ml-2 font-mono">{dept.code}</span>
                          </div>
                          <button onClick={() => removeDepartment(di)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Programs */}
                        {dept.programs.map((prog, pi) => (
                          <div key={pi} className="flex gap-2 mb-2">
                            <input value={prog.name} onChange={e => updateProgram(di, pi, 'name', e.target.value)} placeholder="Program name"
                              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs" />
                            <select value={prog.level} onChange={e => updateProgram(di, pi, 'level', e.target.value)}
                              className="w-20 px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs">
                              <option value="UG">UG</option>
                              <option value="PG">PG</option>
                              <option value="PhD">PhD</option>
                              <option value="Diploma">Diploma</option>
                            </select>
                            <input type="number" value={prog.intake} onChange={e => updateProgram(di, pi, 'intake', parseInt(e.target.value) || 0)} placeholder="Intake"
                              className="w-20 px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs" />
                            <button onClick={() => removeProgram(di, pi)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                        <button onClick={() => addProgram(di)} className="text-xs text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1 mt-1">
                          <Plus className="w-3 h-3" /> Add Program
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Team Setup */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Team Setup</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Optionally add team members who will use UACAS. They'll receive login credentials via email.
                      You can skip this and add them later.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} placeholder="Full name"
                      className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                    <input value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} placeholder="Email"
                      className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                    <select value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})}
                      className="w-36 px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                      <option value="DEPT_HEAD">Dept Head</option>
                      <option value="FACULTY">Faculty</option>
                      <option value="REVIEWER">Reviewer</option>
                    </select>
                    <button onClick={addTeamMember} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {teamMembers.length === 0 ? (
                    <p className="text-center text-slate-400 py-8 text-sm">No team members added. You can add them later from Settings.</p>
                  ) : (
                    <div className="space-y-2">
                      {teamMembers.map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <div>
                            <span className="font-bold text-sm text-slate-900">{m.name}</span>
                            <span className="text-xs text-slate-400 ml-2">{m.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold">{m.role}</span>
                            <button onClick={() => setTeamMembers(teamMembers.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Complete */}
              {step === 5 && (
                <div className="text-center space-y-6 py-8">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Setup Complete!</h2>
                    <p className="text-sm text-slate-500 mt-2">
                      Your institution has been configured. You're ready to start entering NAAC data.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-6 text-left max-w-sm mx-auto space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-slate-700 font-medium">{inst.name || 'Institution'} configured</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-slate-700 font-medium">{selectedYears.length} academic year(s) tracked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-slate-700 font-medium">{departments.length} department(s) added</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-slate-700 font-medium">{teamMembers.length} team member(s) invited</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer Nav */}
          <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="px-5 py-2.5 text-slate-600 font-semibold text-sm hover:text-slate-900 flex items-center gap-2 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
              >
                {step === 4 ? 'Review' : 'Next'} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Sparkles className="w-4 h-4" />}
                Launch UACAS
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
