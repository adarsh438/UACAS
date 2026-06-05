// src/components/naac/forms/Criterion5Form.tsx — Student Support & Progression
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Users, TrendingUp, Award, Heart } from 'lucide-react';
const api = async (url: string, method = 'GET', body?: any) => {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};
const Input = ({ label, id, ...p }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <input id={id} {...p} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-300" />
  </div>
);
const Sel = ({ label, id, opts, ...p }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <select id={id} {...p} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-300">
      {opts.map((o: any) => <option key={o.v || o} value={o.v || o}>{o.l || o}</option>)}
    </select>
  </div>
);
const Card = ({ title, icon: Icon, accent = '#ef4444', children }: any) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3" style={{ borderLeft: `4px solid ${accent}` }}>
      {Icon && <Icon className="w-5 h-5" style={{ color: accent }} />}
      <h3 className="font-bold text-slate-900">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

export default function Criterion5Form({ year }: { year: string }) {
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [placements, setPlacements] = useState<any[]>([]);
  const [compExams, setCompExams] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [alumni, setAlumni] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [toast, setToast] = useState('');
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    Promise.all([
      api(`/api/naac/c5/scholarships?year=${year}`),
      api(`/api/naac/c5/placements?year=${year}`),
      api(`/api/naac/c5/competitive-exams?year=${year}`),
      api(`/api/naac/c5/alumni`),
      api('/api/naac/programs'),
    ]).then(([s, p, ce, al, prog]) => {
      setScholarships(Array.isArray(s) ? s : []);
      setPlacements(Array.isArray(p) ? p : []);
      setCompExams(Array.isArray(ce) ? ce : []);
      const alRec = Array.isArray(al) && al[0] ? al[0] : { associationRegistered: false, meetsPerYear: 0, contributionAmountINR: 0, contributionDescription: '', distinguishedAlumni: '[]', academicYear: year };
      setAlumni(alRec);
      setPrograms(Array.isArray(prog) ? prog : []);
    });
  }, [year]);

  const [ns, setNs] = useState({ name: '', type: 'GOVERNMENT', amountINR: '', recipients: '' });
  const [np, setNp] = useState({ companyName: '', sector: 'IT', studentsPlaced: '', packageLPA: '', programId: '' });
  const [nce, setNce] = useState({ examType: 'GATE', appearedCount: '', qualifiedCount: '' });

  const addScholarship = async () => {
    const r = await api('/api/naac/c5/scholarships', 'POST', { ...ns, academicYear: year, amountINR: +ns.amountINR, recipients: +ns.recipients });
    if (r.id) { setScholarships(p => [...p, r]); showToast('Scholarship added!'); setNs({ name: '', type: 'GOVERNMENT', amountINR: '', recipients: '' }); }
  };
  const addPlacement = async () => {
    const r = await api('/api/naac/c5/placements', 'POST', { ...np, academicYear: year, studentsPlaced: +np.studentsPlaced, packageLPA: +np.packageLPA || null });
    if (r.id) { setPlacements(p => [...p, r]); showToast('Placement added!'); setNp({ companyName: '', sector: 'IT', studentsPlaced: '', packageLPA: '', programId: '' }); }
  };
  const addCompExam = async () => {
    const r = await api('/api/naac/c5/competitive-exams', 'POST', { ...nce, academicYear: year, appearedCount: +nce.appearedCount, qualifiedCount: +nce.qualifiedCount });
    if (r.id) { setCompExams(p => [...p, r]); showToast('Added!'); setNce({ examType: 'GATE', appearedCount: '', qualifiedCount: '' }); }
  };
  const saveAlumni = async () => {
    const payload = { ...alumni, academicYear: year, contributionAmountINR: +alumni.contributionAmountINR, meetsPerYear: +alumni.meetsPerYear };
    if (alumni.id) await api(`/api/naac/c5/alumni/${alumni.id}`, 'PUT', payload);
    else { const r = await api('/api/naac/c5/alumni', 'POST', payload); setAlumni(r); }
    showToast('Alumni record saved!');
  };

  const totalPlaced = placements.reduce((s, p) => s + p.studentsPlaced, 0);
  const totalScholarAmount = scholarships.reduce((s, sc) => s + sc.amountINR, 0);
  const totalScholarRecipients = scholarships.reduce((s, sc) => s + sc.recipients, 0);
  const ceQualPct = compExams.length > 0 ? ((compExams.reduce((s, c) => s + c.qualifiedCount, 0) / compExams.reduce((s, c) => s + c.appearedCount, 0)) * 100).toFixed(1) : 'N/A';

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm shadow-xl">{toast}</div>}

      {/* 5.1 Scholarships */}
      <Card title="5.1 — Scholarships & Financial Support" icon={Heart} accent="#ef4444">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 p-4 bg-red-50 rounded-xl">
          <Input label="Scholarship Name" id="sc-name" value={ns.name} onChange={(e: any) => setNs(p => ({ ...p, name: e.target.value }))} placeholder="Scholarship name" />
          <Sel label="Type" id="sc-type" value={ns.type} onChange={(e: any) => setNs(p => ({ ...p, type: e.target.value }))} opts={[{ v: 'GOVERNMENT', l: 'Government' }, { v: 'INSTITUTIONAL', l: 'Institutional' }, { v: 'MERIT', l: 'Merit' }, { v: 'NEED_BASED', l: 'Need-Based' }]} />
          <Input label="Amount (₹)" id="sc-amt" type="number" value={ns.amountINR} onChange={(e: any) => setNs(p => ({ ...p, amountINR: e.target.value }))} />
          <Input label="Recipients" id="sc-rec" type="number" value={ns.recipients} onChange={(e: any) => setNs(p => ({ ...p, recipients: e.target.value }))} />
          <div className="flex items-end"><button onClick={addScholarship} disabled={!ns.name || !ns.amountINR} className="w-full px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add</button></div>
        </div>
        {scholarships.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm"><thead className="bg-slate-50 border-b"><tr>{['Name', 'Type', 'Amount (₹)', 'Recipients', ''].map(h => <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-slate-400">{h}</th>)}</tr></thead>
              <tbody className="divide-y">{scholarships.map(r => <tr key={r.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-semibold">{r.name}</td><td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${r.type === 'GOVERNMENT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{r.type}</span></td><td className="px-4 py-3 font-bold">₹{r.amountINR.toLocaleString('en-IN')}</td><td className="px-4 py-3 font-bold">{r.recipients}</td><td className="px-4 py-3"><button onClick={async () => { await api(`/api/naac/c5/scholarships/${r.id}`, 'DELETE'); setScholarships(p => p.filter(x => x.id !== r.id)); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="mt-3 p-3 bg-red-50 rounded-xl"><p className="text-xs text-red-700 font-medium">📊 Total: ₹{(totalScholarAmount / 100000).toFixed(2)}L | Recipients: {totalScholarRecipients}</p></div>
      </Card>

      {/* 5.2 Placements */}
      <Card title="5.2 — Student Placements & Career Progression" icon={TrendingUp} accent="#f87171">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 p-4 bg-red-50 rounded-xl">
          <Input label="Company Name" id="pl-co" value={np.companyName} onChange={(e: any) => setNp(p => ({ ...p, companyName: e.target.value }))} placeholder="Company name" />
          <Sel label="Sector" id="pl-sec" value={np.sector} onChange={(e: any) => setNp(p => ({ ...p, sector: e.target.value }))} opts={['IT', 'CORE', 'FINANCE', 'CONSULTING', 'GOVERNMENT', 'STARTUP', 'OTHER']} />
          <Input label="Students Placed" id="pl-stu" type="number" value={np.studentsPlaced} onChange={(e: any) => setNp(p => ({ ...p, studentsPlaced: e.target.value }))} />
          <Input label="Package (LPA)" id="pl-pkg" type="number" value={np.packageLPA} onChange={(e: any) => setNp(p => ({ ...p, packageLPA: e.target.value }))} placeholder="In Lakhs" />
          <div className="flex items-end"><button onClick={addPlacement} disabled={!np.companyName || !np.studentsPlaced} className="w-full px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add</button></div>
        </div>
        {placements.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm"><thead className="bg-slate-50 border-b"><tr>{['Company', 'Sector', 'Placed', 'Package (LPA)', ''].map(h => <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-slate-400">{h}</th>)}</tr></thead>
              <tbody className="divide-y">{placements.map(r => <tr key={r.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-semibold">{r.companyName}</td><td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-bold">{r.sector}</span></td><td className="px-4 py-3 font-bold">{r.studentsPlaced}</td><td className="px-4 py-3 font-bold text-emerald-700">{r.packageLPA ? `₹${r.packageLPA}L` : '—'}</td><td className="px-4 py-3"><button onClick={async () => { await api(`/api/naac/c5/placements/${r.id}`, 'DELETE'); setPlacements(p => p.filter(x => x.id !== r.id)); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="mt-3 p-3 bg-red-50 rounded-xl"><p className="text-xs text-red-700 font-medium">📊 Total Placed: {totalPlaced} students | Avg Package: ₹{placements.length > 0 ? (placements.reduce((s, p) => s + (p.packageLPA || 0), 0) / placements.length).toFixed(2) : '0'}L | Companies: {placements.length}</p></div>
      </Card>

      {/* 5.2.3 Competitive Exams */}
      <Card title="5.2.3 — Competitive Exam Results (GATE, NET, CAT, UPSC)" icon={Award} accent="#fca5a5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-red-50 rounded-xl">
          <Sel label="Exam Type" id="ce-type" value={nce.examType} onChange={(e: any) => setNce(p => ({ ...p, examType: e.target.value }))} opts={['GATE', 'NET', 'CAT', 'UPSC', 'GRE', 'GMAT', 'STATE_PSC', 'OTHER']} />
          <Input label="Appeared" id="ce-app" type="number" value={nce.appearedCount} onChange={(e: any) => setNce(p => ({ ...p, appearedCount: e.target.value }))} />
          <Input label="Qualified" id="ce-qual" type="number" value={nce.qualifiedCount} onChange={(e: any) => setNce(p => ({ ...p, qualifiedCount: e.target.value }))} />
          <div className="flex items-end"><button onClick={addCompExam} disabled={!nce.appearedCount} className="w-full px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add</button></div>
        </div>
        {compExams.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm"><thead className="bg-slate-50 border-b"><tr>{['Exam', 'Appeared', 'Qualified', 'Pass %', ''].map(h => <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-slate-400">{h}</th>)}</tr></thead>
              <tbody className="divide-y">{compExams.map(r => <tr key={r.id} className="hover:bg-slate-50"><td className="px-4 py-3"><span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-bold">{r.examType}</span></td><td className="px-4 py-3 font-bold">{r.appearedCount}</td><td className="px-4 py-3 font-bold text-emerald-700">{r.qualifiedCount}</td><td className="px-4 py-3 font-bold">{r.appearedCount > 0 ? ((r.qualifiedCount / r.appearedCount) * 100).toFixed(1) : 0}%</td><td className="px-4 py-3"><button onClick={async () => { await api(`/api/naac/c5/competitive-exams/${r.id}`, 'DELETE'); setCompExams(p => p.filter(x => x.id !== r.id)); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="mt-3 p-3 bg-red-50 rounded-xl"><p className="text-xs text-red-700 font-medium">📊 Overall Qualification Rate: {ceQualPct}%</p></div>
      </Card>

      {/* 5.4 Alumni */}
      <Card title="5.4 — Alumni Engagement" icon={Users} accent="#fecaca">
        {alumni && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-3 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 font-semibold text-sm cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-red-600" checked={alumni.associationRegistered} id="al-reg"
                  onChange={e => setAlumni((p: any) => ({ ...p, associationRegistered: e.target.checked }))} /> Alumni Association Registered
              </label>
            </div>
            <Input label="Meets Per Year" id="al-meets" type="number" value={alumni.meetsPerYear} onChange={(e: any) => setAlumni((p: any) => ({ ...p, meetsPerYear: +e.target.value }))} />
            <Input label="Contribution Amount (₹)" id="al-amt" type="number" value={alumni.contributionAmountINR} onChange={(e: any) => setAlumni((p: any) => ({ ...p, contributionAmountINR: +e.target.value }))} />
            <div className="col-span-2 md:col-span-1 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contribution Description</label>
              <textarea rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                value={alumni.contributionDescription || ''} onChange={e => setAlumni((p: any) => ({ ...p, contributionDescription: e.target.value }))} placeholder="Lab equipment, scholarships..." />
            </div>
            <div className="col-span-2 md:col-span-3 flex justify-between items-center">
              <div className="p-3 bg-red-50 rounded-xl"><p className="text-xs text-red-700 font-medium">📊 Association: {alumni.associationRegistered ? 'Active' : 'Inactive'} | Meets/Year: {alumni.meetsPerYear} | Contribution: ₹{(alumni.contributionAmountINR / 100000).toFixed(2)}L</p></div>
              <button onClick={saveAlumni} className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
