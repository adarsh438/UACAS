// src/components/naac/forms/Criterion1Form.tsx — Curricular Aspects
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Save, BookOpen, Upload, CheckSquare } from 'lucide-react';
async function apiCall(url: string, method = 'GET', body?: any) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

const InputField = ({ label, id, ...props }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <input id={id} {...props} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all" />
  </div>
);

const SelectField = ({ label, id, options, ...props }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <select id={id} {...props} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all">
      {options.map((o: any) => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  </div>
);

const SectionCard = ({ title, children, accent = '#6366f1' }: any) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100" style={{ borderLeft: `4px solid ${accent}` }}>
      <h3 className="font-bold text-slate-900">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Toast = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-white font-semibold text-sm ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
    {msg}
  </motion.div>
);

export default function Criterion1Form({ year }: { year: string }) {
  const [bosList, setBosList] = useState<any[]>([]);
  const [vacList, setVacList] = useState<any[]>([]);
  const [moocList, setMoocList] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  const [newBos, setNewBos] = useState({ programName: '', meetingDate: '', hasIndustryFeedback: false, minutesUrl: '', academicYear: year });
  const [newVac, setNewVac] = useState({ name: '', type: 'CERTIFICATE', duration: '', studentsEnrolled: '', academicYear: year });
  const [newMooc, setNewMooc] = useState({ platform: 'NPTEL', courseName: '', creditsEarned: '', studentsEnrolled: '', academicYear: year });
  const [newFeedback, setNewFeedback] = useState({ stakeholderType: 'STUDENT', collectionMethod: 'ONLINE', analysisReportUrl: '', actionTakenReport: false, academicYear: year });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      const [b, v, m, f] = await Promise.all([
        apiCall(`/api/naac/c1/bos?year=${year}`),
        apiCall(`/api/naac/c1/vac?year=${year}`),
        apiCall(`/api/naac/c1/mooc?year=${year}`),
        apiCall(`/api/naac/c1/feedback?year=${year}`),
      ]);
      setBosList(Array.isArray(b) ? b : []);
      setVacList(Array.isArray(v) ? v : []);
      setMoocList(Array.isArray(m) ? m : []);
      setFeedbackList(Array.isArray(f) ? f : []);
    };
    load();
  }, [year]);

  const addBos = async () => {
    setSaving(true);
    try {
      const rec = await apiCall('/api/naac/c1/bos', 'POST', { ...newBos, academicYear: year });
      setBosList(p => [...p, rec]);
      setNewBos({ programName: '', meetingDate: '', hasIndustryFeedback: false, minutesUrl: '', academicYear: year });
      showToast('BoS meeting added!');
    } catch { showToast('Failed to add BoS meeting', 'error'); }
    finally { setSaving(false); }
  };

  const deleteBos = async (id: string) => {
    await apiCall(`/api/naac/c1/bos/${id}`, 'DELETE');
    setBosList(p => p.filter(r => r.id !== id));
    showToast('Deleted successfully');
  };

  const addVac = async () => {
    setSaving(true);
    try {
      const rec = await apiCall('/api/naac/c1/vac', 'POST', { ...newVac, studentsEnrolled: parseInt(newVac.studentsEnrolled) || 0, academicYear: year });
      setVacList(p => [...p, rec]);
      setNewVac({ name: '', type: 'CERTIFICATE', duration: '', studentsEnrolled: '', academicYear: year });
      showToast('Course added!');
    } catch { showToast('Failed to add course', 'error'); }
    finally { setSaving(false); }
  };

  const deleteVac = async (id: string) => {
    await apiCall(`/api/naac/c1/vac/${id}`, 'DELETE');
    setVacList(p => p.filter(r => r.id !== id));
  };

  const addMooc = async () => {
    setSaving(true);
    try {
      const rec = await apiCall('/api/naac/c1/mooc', 'POST', {
        ...newMooc, creditsEarned: parseFloat(newMooc.creditsEarned) || 0,
        studentsEnrolled: parseInt(newMooc.studentsEnrolled) || 0, academicYear: year
      });
      setMoocList(p => [...p, rec]);
      setNewMooc({ platform: 'NPTEL', courseName: '', creditsEarned: '', studentsEnrolled: '', academicYear: year });
      showToast('MOOC enrollment added!');
    } catch { showToast('Failed to add MOOC', 'error'); }
    finally { setSaving(false); }
  };

  const saveFeedback = async (fb: any) => {
    setSaving(true);
    try {
      if (fb.id) {
        await apiCall(`/api/naac/c1/feedback/${fb.id}`, 'PUT', fb);
      } else {
        const rec = await apiCall('/api/naac/c1/feedback', 'POST', { ...fb, academicYear: year });
        setFeedbackList(p => [...p.filter(f => f.stakeholderType !== rec.stakeholderType), rec]);
      }
      showToast('Feedback record saved!');
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const stakeholders = ['STUDENT', 'TEACHER', 'EMPLOYER', 'ALUMNI'];

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* 1.1 — BoS Meetings */}
      <SectionCard title="1.1 — Board of Studies (BoS) Meetings" accent="#6366f1">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-indigo-50 rounded-xl">
          <InputField label="Program Name" id="bos-prog" value={newBos.programName}
            onChange={(e: any) => setNewBos(p => ({ ...p, programName: e.target.value }))} placeholder="e.g., BE-CSE" />
          <InputField label="Meeting Date" id="bos-date" type="date" value={newBos.meetingDate}
            onChange={(e: any) => setNewBos(p => ({ ...p, meetingDate: e.target.value }))} />
          <InputField label="Minutes URL (optional)" id="bos-url" value={newBos.minutesUrl}
            onChange={(e: any) => setNewBos(p => ({ ...p, minutesUrl: e.target.value }))} placeholder="/docs/minutes.pdf" />
          <div className="flex flex-col justify-end gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input type="checkbox" checked={newBos.hasIndustryFeedback}
                onChange={e => setNewBos(p => ({ ...p, hasIndustryFeedback: e.target.checked }))}
                className="w-4 h-4 accent-indigo-600" id="bos-industry" />
              Industry Feedback Incorporated
            </label>
            <button onClick={addBos} disabled={!newBos.programName || !newBos.meetingDate || saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 justify-center">
              <Plus className="w-4 h-4" /> Add Meeting
            </button>
          </div>
        </div>

        {bosList.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>{['Program', 'Meeting Date', 'Industry Feedback', 'Minutes', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-slate-400">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bosList.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold">{r.programName}</td>
                    <td className="px-4 py-3">{new Date(r.meetingDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.hasIndustryFeedback ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {r.hasIndustryFeedback ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{r.minutesUrl || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteBos(r.id)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-slate-400 py-8 italic">No BoS meetings recorded for {year}. Add above.</p>
        )}
        <div className="mt-3 p-3 bg-blue-50 rounded-xl">
          <p className="text-xs text-blue-600 font-medium">📊 Metric 1.1.1: {bosList.length > 0 ? `${new Set(bosList.map(b => b.programName)).size} programs with BoS meetings | ${bosList.filter(b => b.hasIndustryFeedback).length} with industry feedback` : 'No data entered'}</p>
        </div>
      </SectionCard>

      {/* 1.2 — Value Added Courses */}
      <SectionCard title="1.2 — Certificate / Value-Added / Add-On Courses" accent="#818cf8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 bg-indigo-50 rounded-xl">
          <InputField label="Course Name" id="vac-name" value={newVac.name}
            onChange={(e: any) => setNewVac(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Python for Data Science" />
          <SelectField label="Type" id="vac-type" value={newVac.type}
            onChange={(e: any) => setNewVac(p => ({ ...p, type: e.target.value }))}
            options={[{ value: 'CERTIFICATE', label: 'Certificate' }, { value: 'VALUE_ADDED', label: 'Value-Added' }, { value: 'ADDON', label: 'Add-On' }]} />
          <InputField label="Duration" id="vac-dur" value={newVac.duration}
            onChange={(e: any) => setNewVac(p => ({ ...p, duration: e.target.value }))} placeholder="e.g., 40 hours" />
          <InputField label="Students Enrolled" id="vac-enroll" type="number" value={newVac.studentsEnrolled}
            onChange={(e: any) => setNewVac(p => ({ ...p, studentsEnrolled: e.target.value }))} />
          <div className="flex items-end">
            <button onClick={addVac} disabled={!newVac.name || saving}
              className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 justify-center">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
        {vacList.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>{['Course Name', 'Type', 'Duration', 'Enrolled', 'Action'].map(h => <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-slate-400">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {vacList.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold">{r.name}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">{r.type}</span></td>
                    <td className="px-4 py-3">{r.duration}</td>
                    <td className="px-4 py-3 font-bold">{r.studentsEnrolled}</td>
                    <td className="px-4 py-3"><button onClick={() => deleteVac(r.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-center text-slate-400 py-6 italic">No value-added courses for {year}.</p>}
        <div className="mt-3 p-3 bg-blue-50 rounded-xl">
          <p className="text-xs text-blue-600 font-medium">📊 Metric 1.2.1: {vacList.length} courses | Total enrollment: {vacList.reduce((s, v) => s + v.studentsEnrolled, 0)} students</p>
        </div>
      </SectionCard>

      {/* 1.2.3 — MOOC Enrollments */}
      <SectionCard title="1.2.3 — MOOC / Online Course Enrollments" accent="#a5b4fc">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 bg-indigo-50 rounded-xl">
          <SelectField label="Platform" id="mooc-plat" value={newMooc.platform}
            onChange={(e: any) => setNewMooc(p => ({ ...p, platform: e.target.value }))}
            options={['NPTEL', 'SWAYAM', 'Coursera', 'edX', 'Udemy', 'Other']} />
          <InputField label="Course Name" id="mooc-name" value={newMooc.courseName}
            onChange={(e: any) => setNewMooc(p => ({ ...p, courseName: e.target.value }))} placeholder="e.g., Machine Learning" />
          <InputField label="Credits Earned" id="mooc-cred" type="number" value={newMooc.creditsEarned}
            onChange={(e: any) => setNewMooc(p => ({ ...p, creditsEarned: e.target.value }))} />
          <InputField label="Students Enrolled" id="mooc-stu" type="number" value={newMooc.studentsEnrolled}
            onChange={(e: any) => setNewMooc(p => ({ ...p, studentsEnrolled: e.target.value }))} />
          <div className="flex items-end">
            <button onClick={addMooc} disabled={!newMooc.courseName || saving}
              className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 justify-center">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
        {moocList.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>{['Platform', 'Course', 'Credits', 'Students'].map(h => <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-slate-400">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {moocList.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-bold">{r.platform}</span></td>
                    <td className="px-4 py-3 font-semibold">{r.courseName}</td>
                    <td className="px-4 py-3">{r.creditsEarned}</td>
                    <td className="px-4 py-3 font-bold">{r.studentsEnrolled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-center text-slate-400 py-6 italic">No MOOC enrollments for {year}.</p>}
      </SectionCard>

      {/* 1.4 — Feedback System */}
      <SectionCard title="1.4 — Stakeholder Feedback System" accent="#c7d2fe">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stakeholders.map(s => {
            const existing = feedbackList.find(f => f.stakeholderType === s);
            const state = existing || { stakeholderType: s, collectionMethod: 'ONLINE', analysisReportUrl: '', actionTakenReport: false, academicYear: year };
            return (
              <div key={s} className={`p-5 rounded-xl border-2 transition-all ${existing ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-800">{s} Feedback</h4>
                  {existing && <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">✓ Recorded</span>}
                </div>
                <div className="space-y-3">
                  <SelectField label="Collection Method" id={`fb-method-${s}`}
                    defaultValue={state.collectionMethod}
                    onChange={(e: any) => {
                      const updated = { ...state, collectionMethod: e.target.value };
                      setFeedbackList(p => [...p.filter(f => f.stakeholderType !== s), { ...updated, stakeholderType: s }]);
                    }}
                    options={[{ value: 'ONLINE', label: 'Online' }, { value: 'OFFLINE', label: 'Offline' }, { value: 'BOTH', label: 'Both' }]} />
                  <InputField label="Analysis Report URL" id={`fb-url-${s}`} defaultValue={state.analysisReportUrl}
                    onBlur={(e: any) => setFeedbackList(p => p.map(f => f.stakeholderType === s ? { ...f, analysisReportUrl: e.target.value } : f))}
                    placeholder="/docs/feedback-analysis.pdf" />
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input type="checkbox" defaultChecked={state.actionTakenReport} id={`fb-atr-${s}`}
                      onChange={e => setFeedbackList(p => p.map(f => f.stakeholderType === s ? { ...f, actionTakenReport: e.target.checked } : f))}
                      className="w-4 h-4 accent-emerald-600" />
                    Action Taken Report Available
                  </label>
                  <button
                    onClick={() => saveFeedback({ ...state, stakeholderType: s, academicYear: year })}
                    className="w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> Save {s} Feedback Record
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-xl">
          <p className="text-xs text-blue-600 font-medium">📊 Metric 1.4.1: {feedbackList.length}/4 stakeholder categories covered | ATR available: {feedbackList.filter(f => f.actionTakenReport).length}/4</p>
        </div>
      </SectionCard>
    </div>
  );
}
