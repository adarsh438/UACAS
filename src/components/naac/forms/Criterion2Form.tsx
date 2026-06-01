// src/components/naac/forms/Criterion2Form.tsx — Teaching-Learning & Evaluation
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { auth } from '../../../firebase';

async function api(url: string, method = 'GET', body?: any) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
}
const Input = ({ label, id, ...p }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <input id={id} {...p} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-300" />
  </div>
);
const Sel = ({ label, id, opts, ...p }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <select id={id} {...p} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-300">
      {opts.map((o: any) => <option key={o.v || o} value={o.v || o}>{o.l || o}</option>)}
    </select>
  </div>
);
const Card = ({ title, accent = '#0ea5e9', children }: any) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100" style={{ borderLeft: `4px solid ${accent}` }}>
      <h3 className="font-bold text-slate-900">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

export default function Criterion2Form({ year }: { year: string }) {
  const [enrollList, setEnrollList] = useState<any[]>([]);
  const [remedialList, setRemedialList] = useState<any[]>([]);
  const [fdpList, setFdpList] = useState<any[]>([]);
  const [ictRec, setIctRec] = useState<any>(null);
  const [examRec, setExamRec] = useState<any>(null);
  const [loList, setLoList] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    Promise.all([
      api(`/api/naac/c2/enrollment?year=${year}`), api(`/api/naac/c2/remedial?year=${year}`),
      api(`/api/naac/c2/fdp?year=${year}`), api(`/api/naac/c2/ict?year=${year}`),
      api(`/api/naac/c2/exam?year=${year}`), api(`/api/naac/c2/learning-outcomes?year=${year}`),
      api('/api/naac/programs'),
    ]).then(([e, r, f, ict, ex, lo, prog]) => {
      setEnrollList(Array.isArray(e) ? e : []);
      setRemedialList(Array.isArray(r) ? r : []);
      setFdpList(Array.isArray(f) ? f : []);
      setIctRec(Array.isArray(ict) && ict.length > 0 ? ict[0] : { totalTeachers: 48, ictUsersCount: 40, lmsUsed: true, lmsName: 'Moodle', recordedLectures: true, smartBoardCount: 22, studentCentricMethods: '[]', academicYear: year });
      setExamRec(Array.isArray(ex) && ex.length > 0 ? ex[0] : { totalCourses: 48, coursesWithCIA: 48, grievancesReceived: 0, grievancesResolved: 0, reEvaluationPolicy: true, automationStatus: false, automationDescription: '', transparencyMechanisms: '', academicYear: year });
      setLoList(Array.isArray(lo) ? lo : []);
      setPrograms(Array.isArray(prog) ? prog : []);
    });
  }, [year]);

  const [newEnroll, setNewEnroll] = useState({ programId: '', sanctionedIntake: '', enrolled: '', enrolledSC: '0', enrolledST: '0', enrolledOBC: '0', enrolledEWS: '0', enrolledGeneral: '0' });
  const [newRemedial, setNewRemedial] = useState({ type: 'REMEDIAL', description: '', beneficiaries: '' });
  const [newFdp, setNewFdp] = useState({ programName: '', type: 'FDP', facultyCount: '', duration: '', organizer: '' });

  const addEnroll = async () => {
    const rec = await api('/api/naac/c2/enrollment', 'POST', { ...newEnroll, academicYear: year, sanctionedIntake: +newEnroll.sanctionedIntake, enrolled: +newEnroll.enrolled, enrolledSC: +newEnroll.enrolledSC, enrolledST: +newEnroll.enrolledST, enrolledOBC: +newEnroll.enrolledOBC, enrolledEWS: +newEnroll.enrolledEWS, enrolledGeneral: +newEnroll.enrolledGeneral });
    if (rec.id) { setEnrollList(p => [...p, rec]); showToast('Enrollment record added!'); setNewEnroll({ programId: '', sanctionedIntake: '', enrolled: '', enrolledSC: '0', enrolledST: '0', enrolledOBC: '0', enrolledEWS: '0', enrolledGeneral: '0' }); }
  };

  const addRemedial = async () => {
    const rec = await api('/api/naac/c2/remedial', 'POST', { ...newRemedial, beneficiaries: +newRemedial.beneficiaries, academicYear: year });
    if (rec.id) { setRemedialList(p => [...p, rec]); showToast('Added!'); setNewRemedial({ type: 'REMEDIAL', description: '', beneficiaries: '' }); }
  };

  const addFdp = async () => {
    const rec = await api('/api/naac/c2/fdp', 'POST', { ...newFdp, facultyCount: +newFdp.facultyCount, academicYear: year });
    if (rec.id) { setFdpList(p => [...p, rec]); showToast('FDP added!'); setNewFdp({ programName: '', type: 'FDP', facultyCount: '', duration: '', organizer: '' }); }
  };

  const saveIct = async () => {
    if (ictRec?.id) await api(`/api/naac/c2/ict/${ictRec.id}`, 'PUT', ictRec);
    else { const rec = await api('/api/naac/c2/ict', 'POST', { ...ictRec, academicYear: year }); setIctRec(rec); }
    showToast('ICT record saved!');
  };

  const saveExam = async () => {
    if (examRec?.id) await api(`/api/naac/c2/exam/${examRec.id}`, 'PUT', examRec);
    else { const rec = await api('/api/naac/c2/exam', 'POST', { ...examRec, academicYear: year }); setExamRec(rec); }
    showToast('Exam record saved!');
  };

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow-xl">{toast}</div>}

      {/* 2.1 Enrollment */}
      <Card title="2.1 — Student Enrollment & Profile" accent="#0ea5e9">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-sky-50 rounded-xl">
          <Sel label="Program" id="enr-prog" value={newEnroll.programId} onChange={(e: any) => setNewEnroll(p => ({ ...p, programId: e.target.value }))}
            opts={[{ v: '', l: '-- Select --' }, ...programs.map(p => ({ v: p.id, l: p.name }))]} />
          <Input label="Sanctioned Intake" id="enr-sanc" type="number" value={newEnroll.sanctionedIntake} onChange={(e: any) => setNewEnroll(p => ({ ...p, sanctionedIntake: e.target.value }))} />
          <Input label="Actual Enrolled" id="enr-enr" type="number" value={newEnroll.enrolled} onChange={(e: any) => setNewEnroll(p => ({ ...p, enrolled: e.target.value }))} />
          <div className="flex items-end">
            <button onClick={addEnroll} disabled={!newEnroll.programId} className="w-full px-4 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-bold hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <Input label="SC" id="enr-sc" type="number" value={newEnroll.enrolledSC} onChange={(e: any) => setNewEnroll(p => ({ ...p, enrolledSC: e.target.value }))} />
          <Input label="ST" id="enr-st" type="number" value={newEnroll.enrolledST} onChange={(e: any) => setNewEnroll(p => ({ ...p, enrolledST: e.target.value }))} />
          <Input label="OBC" id="enr-obc" type="number" value={newEnroll.enrolledOBC} onChange={(e: any) => setNewEnroll(p => ({ ...p, enrolledOBC: e.target.value }))} />
          <Input label="EWS" id="enr-ews" type="number" value={newEnroll.enrolledEWS} onChange={(e: any) => setNewEnroll(p => ({ ...p, enrolledEWS: e.target.value }))} />
        </div>
        {enrollList.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b"><tr>{['Program', 'Sanctioned', 'Enrolled', '% Fill', 'SC', 'ST', 'OBC', 'EWS'].map(h => <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-slate-400">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-50">
                {enrollList.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold">{r.program?.name || '—'}</td>
                    <td className="px-4 py-3">{r.sanctionedIntake}</td>
                    <td className="px-4 py-3 font-bold">{r.enrolled}</td>
                    <td className="px-4 py-3"><span className={`font-bold ${(r.enrolled/r.sanctionedIntake*100) >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{(r.enrolled/r.sanctionedIntake*100).toFixed(1)}%</span></td>
                    <td className="px-4 py-3">{r.enrolledSC}</td>
                    <td className="px-4 py-3">{r.enrolledST}</td>
                    <td className="px-4 py-3">{r.enrolledOBC}</td>
                    <td className="px-4 py-3">{r.enrolledEWS}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 2.2 Remedial */}
      <Card title="2.2 — Bridge / Remedial / Advanced Learning Programs" accent="#38bdf8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-sky-50 rounded-xl">
          <Sel label="Type" id="rem-type" value={newRemedial.type} onChange={(e: any) => setNewRemedial(p => ({ ...p, type: e.target.value }))}
            opts={[{ v: 'BRIDGE', l: 'Bridge Course' }, { v: 'REMEDIAL', l: 'Remedial' }, { v: 'ADVANCED', l: 'Advanced' }]} />
          <Input label="Description" id="rem-desc" value={newRemedial.description} onChange={(e: any) => setNewRemedial(p => ({ ...p, description: e.target.value }))} placeholder="Course description" />
          <Input label="Beneficiaries" id="rem-ben" type="number" value={newRemedial.beneficiaries} onChange={(e: any) => setNewRemedial(p => ({ ...p, beneficiaries: e.target.value }))} />
          <div className="flex items-end"><button onClick={addRemedial} className="w-full px-4 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-bold hover:bg-sky-700 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add</button></div>
        </div>
        {remedialList.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm"><thead className="bg-slate-50 border-b"><tr>{['Type', 'Description', 'Beneficiaries', ''].map(h => <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-slate-400">{h}</th>)}</tr></thead>
              <tbody className="divide-y">{remedialList.map(r => <tr key={r.id} className="hover:bg-slate-50"><td className="px-4 py-3"><span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded text-xs font-bold">{r.type}</span></td><td className="px-4 py-3">{r.description}</td><td className="px-4 py-3 font-bold">{r.beneficiaries}</td><td className="px-4 py-3"><button onClick={async () => { await api(`/api/naac/c2/remedial/${r.id}`, 'DELETE'); setRemedialList(p => p.filter(x => x.id !== r.id)); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 2.3 ICT */}
      <Card title="2.3 — Teaching-Learning Process (ICT & Student-Centric Methods)" accent="#7dd3fc">
        {ictRec && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input label="Total Teachers" id="ict-tot" type="number" value={ictRec.totalTeachers} onChange={(e: any) => setIctRec((p: any) => ({ ...p, totalTeachers: +e.target.value }))} />
            <Input label="ICT Users" id="ict-usr" type="number" value={ictRec.ictUsersCount} onChange={(e: any) => setIctRec((p: any) => ({ ...p, ictUsersCount: +e.target.value }))} />
            <Input label="Smart Boards" id="ict-sb" type="number" value={ictRec.smartBoardCount} onChange={(e: any) => setIctRec((p: any) => ({ ...p, smartBoardCount: +e.target.value }))} />
            <Input label="LMS Name" id="ict-lms" value={ictRec.lmsName || ''} onChange={(e: any) => setIctRec((p: any) => ({ ...p, lmsName: e.target.value }))} placeholder="e.g., Moodle" />
            <div className="col-span-2 md:col-span-4 flex flex-wrap gap-4">
              {[['LMS Used', 'lmsUsed'], ['Recorded Lectures', 'recordedLectures']].map(([l, k]) => (
                <label key={k} className="flex items-center gap-2 font-semibold text-sm cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-sky-600" checked={ictRec[k]} onChange={e => setIctRec((p: any) => ({ ...p, [k]: e.target.checked }))} id={`ict-${k}`} /> {l}
                </label>
              ))}
            </div>
            <div className="col-span-2 md:col-span-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Student-Centric Methods Used</p>
              <div className="flex flex-wrap gap-3">
                {['FLIPPED_CLASS', 'COLLABORATIVE', 'PBL', 'EXPERIENTIAL', 'CASE_STUDY', 'ROLE_PLAY'].map(m => {
                  const methods = JSON.parse(ictRec.studentCentricMethods || '[]');
                  const checked = methods.includes(m);
                  return (
                    <label key={m} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-sky-600" checked={checked} id={`ict-method-${m}`}
                        onChange={e => {
                          const curr = JSON.parse(ictRec.studentCentricMethods || '[]');
                          const updated = e.target.checked ? [...curr, m] : curr.filter((x: string) => x !== m);
                          setIctRec((p: any) => ({ ...p, studentCentricMethods: JSON.stringify(updated) }));
                        }} />
                      {m.replace('_', ' ')}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="col-span-2 md:col-span-4">
              <div className="flex justify-between items-center p-3 bg-sky-50 rounded-xl mb-3">
                <p className="text-xs text-sky-700 font-medium">📊 Metric 2.3.1: {ictRec.totalTeachers > 0 ? ((ictRec.ictUsersCount / ictRec.totalTeachers) * 100).toFixed(1) : 0}% teachers using ICT tools</p>
              </div>
              <button onClick={saveIct} className="px-6 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-bold hover:bg-sky-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save ICT Record</button>
            </div>
          </div>
        )}
      </Card>

      {/* 2.3.2 FDPs */}
      <Card title="2.3.2 — Faculty Development Programs (FDPs)" accent="#bae6fd">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 bg-sky-50 rounded-xl">
          <Input label="Program Name" id="fdp-name" value={newFdp.programName} onChange={(e: any) => setNewFdp(p => ({ ...p, programName: e.target.value }))} placeholder="FDP/Workshop name" />
          <Sel label="Type" id="fdp-type" value={newFdp.type} onChange={(e: any) => setNewFdp(p => ({ ...p, type: e.target.value }))} opts={['FDP', 'WORKSHOP', 'SEMINAR', 'CONFERENCE', 'TRAINING']} />
          <Input label="Faculty Count" id="fdp-fc" type="number" value={newFdp.facultyCount} onChange={(e: any) => setNewFdp(p => ({ ...p, facultyCount: e.target.value }))} />
          <Input label="Duration" id="fdp-dur" value={newFdp.duration} onChange={(e: any) => setNewFdp(p => ({ ...p, duration: e.target.value }))} placeholder="e.g., 5 days" />
          <div className="flex items-end"><button onClick={addFdp} className="w-full px-4 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-bold hover:bg-sky-700 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add FDP</button></div>
        </div>
        {fdpList.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm"><thead className="bg-slate-50 border-b"><tr>{['Program', 'Type', 'Faculty', 'Duration'].map(h => <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-slate-400">{h}</th>)}</tr></thead>
              <tbody className="divide-y">{fdpList.map(r => <tr key={r.id}><td className="px-4 py-3 font-semibold">{r.programName}</td><td className="px-4 py-3"><span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded text-xs font-bold">{r.type}</span></td><td className="px-4 py-3 font-bold">{r.facultyCount}</td><td className="px-4 py-3">{r.duration}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 2.5 Exam */}
      <Card title="2.5 — Evaluation Process & Reforms" accent="#e0f2fe">
        {examRec && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input label="Total Courses" id="ex-tot" type="number" value={examRec.totalCourses} onChange={(e: any) => setExamRec((p: any) => ({ ...p, totalCourses: +e.target.value }))} />
            <Input label="Courses with CIA" id="ex-cia" type="number" value={examRec.coursesWithCIA} onChange={(e: any) => setExamRec((p: any) => ({ ...p, coursesWithCIA: +e.target.value }))} />
            <Input label="Grievances Received" id="ex-gr" type="number" value={examRec.grievancesReceived} onChange={(e: any) => setExamRec((p: any) => ({ ...p, grievancesReceived: +e.target.value }))} />
            <Input label="Grievances Resolved" id="ex-grs" type="number" value={examRec.grievancesResolved} onChange={(e: any) => setExamRec((p: any) => ({ ...p, grievancesResolved: +e.target.value }))} />
            <div className="col-span-2 md:col-span-3 flex flex-wrap gap-4">
              {[['Re-Evaluation Policy Available', 'reEvaluationPolicy'], ['Exam Automation Implemented', 'automationStatus']].map(([l, k]) => (
                <label key={k} className="flex items-center gap-2 font-semibold text-sm cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-sky-600" checked={examRec[k]} onChange={e => setExamRec((p: any) => ({ ...p, [k]: e.target.checked }))} id={`ex-${k}`} /> {l}
                </label>
              ))}
            </div>
            <div className="col-span-2 md:col-span-3 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Automation Description</label>
              <textarea rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none" value={examRec.automationDescription || ''} onChange={e => setExamRec((p: any) => ({ ...p, automationDescription: e.target.value }))} placeholder="Describe automation tools and processes..." />
            </div>
            <div className="col-span-2 md:col-span-3 flex justify-between items-center">
              <p className="text-xs text-sky-700 font-medium bg-sky-50 px-3 py-2 rounded-xl">
                📊 CIA Coverage: {examRec.totalCourses > 0 ? ((examRec.coursesWithCIA / examRec.totalCourses) * 100).toFixed(1) : 0}% | Grievance Resolution: {examRec.grievancesReceived > 0 ? ((examRec.grievancesResolved / examRec.grievancesReceived) * 100).toFixed(1) : 100}%
              </p>
              <button onClick={saveExam} className="px-6 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-bold hover:bg-sky-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            </div>
          </div>
        )}
      </Card>

      {/* 2.6 Learning Outcomes */}
      <Card title="2.6 — Student Performance & Learning Outcomes" accent="#f0f9ff">
        {programs.length > 0 ? (
          <div className="space-y-4">
            {programs.map(prog => {
              const lo = loList.find(l => l.programId === prog.id) || { programId: prog.id, posCosDefined: false, attainmentMethod: 'Both', passPercentage: '', placementPercentage: '', higherStudiesPercentage: '', academicYear: year };
              return (
                <div key={prog.id} className="p-4 border border-slate-100 rounded-xl">
                  <p className="font-bold text-slate-900 mb-3">{prog.name}</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer col-span-2 md:col-span-1">
                      <input type="checkbox" className="w-4 h-4 accent-sky-600" defaultChecked={lo.posCosDefined} id={`lo-pos-${prog.id}`}
                        onChange={e => { const updated = { ...lo, posCosDefined: e.target.checked }; setLoList(p => [...p.filter(x => x.programId !== prog.id), updated]); }} /> POs/COs Defined
                    </label>
                    <Input label="Pass %" id={`lo-pass-${prog.id}`} type="number" defaultValue={lo.passPercentage}
                      onBlur={(e: any) => setLoList(p => [...p.filter(x => x.programId !== prog.id), { ...lo, passPercentage: +e.target.value }])} />
                    <Input label="Placement %" id={`lo-plac-${prog.id}`} type="number" defaultValue={lo.placementPercentage}
                      onBlur={(e: any) => setLoList(p => [...p.filter(x => x.programId !== prog.id), { ...lo, placementPercentage: +e.target.value }])} />
                    <Input label="Higher Studies %" id={`lo-hs-${prog.id}`} type="number" defaultValue={lo.higherStudiesPercentage}
                      onBlur={(e: any) => setLoList(p => [...p.filter(x => x.programId !== prog.id), { ...lo, higherStudiesPercentage: +e.target.value }])} />
                    <button onClick={async () => {
                      const current = loList.find(x => x.programId === prog.id) || lo;
                      if (current.id) await api(`/api/naac/c2/learning-outcomes/${current.id}`, 'PUT', { ...current, academicYear: year });
                      else { const rec = await api('/api/naac/c2/learning-outcomes', 'POST', { ...current, academicYear: year }); setLoList(p => [...p.filter(x => x.programId !== prog.id), rec]); }
                      showToast('Saved!');
                    }} className="px-4 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-bold hover:bg-sky-700 flex items-center gap-2"><Save className="w-3 h-3" /> Save</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-slate-400 text-center py-8">No programs found. Add programs first.</p>}
      </Card>
    </div>
  );
}
