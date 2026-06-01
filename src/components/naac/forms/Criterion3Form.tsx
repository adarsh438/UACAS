// src/components/naac/forms/Criterion3Form.tsx — Research, Innovations & Extension
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ExternalLink } from 'lucide-react';
import { auth } from '../../../firebase';

const api = async (url: string, method = 'GET', body?: any) => {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};

const Input = ({ label, id, ...p }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <input id={id} {...p} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-300" />
  </div>
);
const Sel = ({ label, id, opts, ...p }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <select id={id} {...p} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-300">
      {opts.map((o: any) => <option key={o.v || o} value={o.v || o}>{o.l || o}</option>)}
    </select>
  </div>
);
const Card = ({ title, accent = '#10b981', children }: any) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100" style={{ borderLeft: `4px solid ${accent}` }}>
      <h3 className="font-bold text-slate-900">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

export default function Criterion3Form({ year }: { year: string }) {
  const [grants, setGrants] = useState<any[]>([]);
  const [patents, setPatents] = useState<any[]>([]);
  const [pubs, setPubs] = useState<any[]>([]);
  const [mous, setMous] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    Promise.all([api(`/api/naac/c3/grants?year=${year}`), api('/api/naac/c3/patents'), api('/api/naac/c3/publications'), api('/api/naac/c3/mous'), api(`/api/naac/c3/extension?year=${year}`)]).then(([g, p, pub, m, e]) => {
      setGrants(Array.isArray(g) ? g : []);
      setPatents(Array.isArray(p) ? p : []);
      setPubs(Array.isArray(pub) ? pub : []);
      setMous(Array.isArray(m) ? m : []);
      setExtensions(Array.isArray(e) ? e : []);
    });
  }, [year]);

  const [ng, setNg] = useState({ agencyName: '', projectTitle: '', amount: '', status: 'ONGOING', sanctionYear: new Date().getFullYear().toString() });
  const [np, setNp] = useState({ patentNumber: '', title: '', inventors: '', year: new Date().getFullYear().toString(), status: 'FILED', country: 'India' });
  const [npub, setNpub] = useState({ type: 'JOURNAL', title: '', authors: '', journalName: '', year: new Date().getFullYear().toString(), indexedIn: 'SCOPUS', isbnIssn: '', doiUrl: '' });
  const [nm, setNm] = useState({ partnerName: '', partnerType: 'INDUSTRY', scope: '', isInternational: false, signedDate: '', expiryDate: '' });
  const [ne, setNe] = useState({ name: '', type: 'NSS', description: '', studentsParticipated: '', partnerOrganization: '' });

  const addGrant = async () => { const r = await api('/api/naac/c3/grants', 'POST', { ...ng, academicYear: year, amount: +ng.amount, sanctionYear: +ng.sanctionYear }); if (r.id) { setGrants(p => [...p, r]); showToast('Grant added!'); setNg({ agencyName: '', projectTitle: '', amount: '', status: 'ONGOING', sanctionYear: new Date().getFullYear().toString() }); } };
  const addPatent = async () => { const r = await api('/api/naac/c3/patents', 'POST', { ...np, year: +np.year }); if (r.id) { setPatents(p => [...p, r]); showToast('Patent added!'); setNp({ patentNumber: '', title: '', inventors: '', year: new Date().getFullYear().toString(), status: 'FILED', country: 'India' }); } };
  const addPub = async () => { const r = await api('/api/naac/c3/publications', 'POST', { ...npub, year: +npub.year }); if (r.id) { setPubs(p => [...p, r]); showToast('Publication added!'); setNpub({ type: 'JOURNAL', title: '', authors: '', journalName: '', year: new Date().getFullYear().toString(), indexedIn: 'SCOPUS', isbnIssn: '', doiUrl: '' }); } };
  const addMou = async () => { const r = await api('/api/naac/c3/mous', 'POST', nm); if (r.id) { setMous(p => [...p, r]); showToast('MoU added!'); setNm({ partnerName: '', partnerType: 'INDUSTRY', scope: '', isInternational: false, signedDate: '', expiryDate: '' }); } };
  const addExtension = async () => { const r = await api('/api/naac/c3/extension', 'POST', { ...ne, studentsParticipated: +ne.studentsParticipated, academicYear: year }); if (r.id) { setExtensions(p => [...p, r]); showToast('Activity added!'); setNe({ name: '', type: 'NSS', description: '', studentsParticipated: '', partnerOrganization: '' }); } };

  const totalGrants = grants.reduce((s, g) => s + g.amount, 0);
  const scopusPubs = pubs.filter(p => p.indexedIn === 'SCOPUS' || p.indexedIn === 'WOS').length;

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow-xl">{toast}</div>}

      {/* Research Grants */}
      <Card title="3.1 — Research Grants & Funding" accent="#10b981">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 p-4 bg-emerald-50 rounded-xl">
          <Input label="Funding Agency" id="g-agency" value={ng.agencyName} onChange={(e: any) => setNg(p => ({ ...p, agencyName: e.target.value }))} placeholder="e.g., DST-SERB" />
          <Input label="Project Title" id="g-title" value={ng.projectTitle} onChange={(e: any) => setNg(p => ({ ...p, projectTitle: e.target.value }))} placeholder="Project title" />
          <Input label="Amount (₹)" id="g-amt" type="number" value={ng.amount} onChange={(e: any) => setNg(p => ({ ...p, amount: e.target.value }))} />
          <Sel label="Status" id="g-stat" value={ng.status} onChange={(e: any) => setNg(p => ({ ...p, status: e.target.value }))} opts={[{ v: 'ONGOING', l: 'Ongoing' }, { v: 'COMPLETED', l: 'Completed' }]} />
          <div className="flex items-end"><button onClick={addGrant} disabled={!ng.agencyName || !ng.amount} className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add</button></div>
        </div>
        {grants.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm"><thead className="bg-slate-50 border-b"><tr>{['Agency', 'Project', 'Amount (₹)', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-slate-400">{h}</th>)}</tr></thead>
              <tbody className="divide-y">{grants.map(r => <tr key={r.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-semibold">{r.agencyName}</td><td className="px-4 py-3 text-slate-600">{r.projectTitle}</td><td className="px-4 py-3 font-bold">₹{r.amount.toLocaleString('en-IN')}</td><td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${r.status === 'ONGOING' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{r.status}</span></td><td className="px-4 py-3"><button onClick={async () => { await api(`/api/naac/c3/grants/${r.id}`, 'DELETE'); setGrants(p => p.filter(x => x.id !== r.id)); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="mt-3 p-3 bg-emerald-50 rounded-xl flex gap-6">
          <p className="text-xs text-emerald-700 font-medium">📊 Total Grants: ₹{(totalGrants / 100000).toFixed(2)}L | Ongoing: {grants.filter(g => g.status === 'ONGOING').length}</p>
        </div>
      </Card>

      {/* Patents */}
      <Card title="3.2 — Patents Filed & Granted" accent="#34d399">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4 p-4 bg-emerald-50 rounded-xl">
          <Input label="Patent Title" id="p-title" value={np.title} onChange={(e: any) => setNp(p => ({ ...p, title: e.target.value }))} placeholder="Patent title" />
          <Input label="Patent Number" id="p-num" value={np.patentNumber} onChange={(e: any) => setNp(p => ({ ...p, patentNumber: e.target.value }))} placeholder="IN20231234" />
          <Input label="Inventors" id="p-inv" value={np.inventors} onChange={(e: any) => setNp(p => ({ ...p, inventors: e.target.value }))} placeholder="Inventor names" />
          <Input label="Year" id="p-yr" type="number" value={np.year} onChange={(e: any) => setNp(p => ({ ...p, year: e.target.value }))} />
          <Sel label="Status" id="p-stat" value={np.status} onChange={(e: any) => setNp(p => ({ ...p, status: e.target.value }))} opts={['FILED', 'GRANTED', 'PUBLISHED']} />
          <div className="flex items-end"><button onClick={addPatent} disabled={!np.title} className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add</button></div>
        </div>
        {patents.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm"><thead className="bg-slate-50 border-b"><tr>{['Title', 'Patent No.', 'Inventors', 'Year', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-slate-400">{h}</th>)}</tr></thead>
              <tbody className="divide-y">{patents.map(r => <tr key={r.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-semibold max-w-xs">{r.title}</td><td className="px-4 py-3 text-xs font-mono">{r.patentNumber || '—'}</td><td className="px-4 py-3 text-slate-600">{r.inventors}</td><td className="px-4 py-3">{r.year}</td><td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${r.status === 'GRANTED' ? 'bg-emerald-100 text-emerald-700' : r.status === 'FILED' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{r.status}</span></td><td className="px-4 py-3"><button onClick={async () => { await api(`/api/naac/c3/patents/${r.id}`, 'DELETE'); setPatents(p => p.filter(x => x.id !== r.id)); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="mt-3 p-3 bg-emerald-50 rounded-xl"><p className="text-xs text-emerald-700 font-medium">📊 Granted: {patents.filter(p => p.status === 'GRANTED').length} | Filed: {patents.filter(p => p.status === 'FILED').length}</p></div>
      </Card>

      {/* Publications */}
      <Card title="3.3 — Research Publications" accent="#6ee7b7">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-emerald-50 rounded-xl">
          <Sel label="Type" id="pub-type" value={npub.type} onChange={(e: any) => setNpub(p => ({ ...p, type: e.target.value }))} opts={[{ v: 'JOURNAL', l: 'Journal Paper' }, { v: 'CONFERENCE', l: 'Conference Paper' }, { v: 'BOOK', l: 'Book' }, { v: 'CHAPTER', l: 'Book Chapter' }]} />
          <div className="col-span-2">
            <Input label="Title" id="pub-title" value={npub.title} onChange={(e: any) => setNpub(p => ({ ...p, title: e.target.value }))} placeholder="Paper/book title" />
          </div>
          <Input label="Authors" id="pub-auth" value={npub.authors} onChange={(e: any) => setNpub(p => ({ ...p, authors: e.target.value }))} placeholder="Comma-separated" />
          <Input label="Journal/Publisher" id="pub-jour" value={npub.journalName} onChange={(e: any) => setNpub(p => ({ ...p, journalName: e.target.value }))} placeholder="Journal name" />
          <Input label="Year" id="pub-yr" type="number" value={npub.year} onChange={(e: any) => setNpub(p => ({ ...p, year: e.target.value }))} />
          <Sel label="Indexed In" id="pub-idx" value={npub.indexedIn} onChange={(e: any) => setNpub(p => ({ ...p, indexedIn: e.target.value }))} opts={['SCOPUS', 'WOS', 'UGC_CARE', 'NONE']} />
          <Input label="DOI / URL" id="pub-doi" value={npub.doiUrl} onChange={(e: any) => setNpub(p => ({ ...p, doiUrl: e.target.value }))} placeholder="https://doi.org/..." />
          <div className="flex items-end"><button onClick={addPub} disabled={!npub.title} className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add</button></div>
        </div>
        {pubs.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm"><thead className="bg-slate-50 border-b"><tr>{['Title', 'Authors', 'Journal', 'Year', 'Indexed', ''].map(h => <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-slate-400">{h}</th>)}</tr></thead>
              <tbody className="divide-y">{pubs.map(r => <tr key={r.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-semibold max-w-xs truncate">{r.title}</td><td className="px-4 py-3 text-slate-500 text-xs">{r.authors}</td><td className="px-4 py-3 text-slate-600 text-xs">{r.journalName}</td><td className="px-4 py-3">{r.year}</td><td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${r.indexedIn === 'SCOPUS' ? 'bg-blue-100 text-blue-700' : r.indexedIn === 'WOS' ? 'bg-purple-100 text-purple-700' : r.indexedIn === 'UGC_CARE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{r.indexedIn}</span></td><td className="px-4 py-3"><button onClick={async () => { await api(`/api/naac/c3/publications/${r.id}`, 'DELETE'); setPubs(p => p.filter(x => x.id !== r.id)); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="mt-3 p-3 bg-emerald-50 rounded-xl"><p className="text-xs text-emerald-700 font-medium">📊 Scopus/WoS: {scopusPubs} | UGC Care: {pubs.filter(p => p.indexedIn === 'UGC_CARE').length} | Books/Chapters: {pubs.filter(p => p.type === 'BOOK' || p.type === 'CHAPTER').length}</p></div>
      </Card>

      {/* MoUs */}
      <Card title="3.5 — MoUs & Collaborations" accent="#a7f3d0">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 p-4 bg-emerald-50 rounded-xl">
          <Input label="Partner Name" id="m-name" value={nm.partnerName} onChange={(e: any) => setNm(p => ({ ...p, partnerName: e.target.value }))} placeholder="Institution/Industry name" />
          <Sel label="Partner Type" id="m-type" value={nm.partnerType} onChange={(e: any) => setNm(p => ({ ...p, partnerType: e.target.value }))} opts={['INSTITUTION', 'INDUSTRY', 'NGO', 'GOVERNMENT']} />
          <Input label="Scope" id="m-scope" value={nm.scope} onChange={(e: any) => setNm(p => ({ ...p, scope: e.target.value }))} placeholder="Research, Internship..." />
          <Input label="Expiry Date" id="m-exp" type="date" value={nm.expiryDate} onChange={(e: any) => setNm(p => ({ ...p, expiryDate: e.target.value }))} />
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer mt-5">
              <input type="checkbox" className="w-4 h-4 accent-emerald-600" checked={nm.isInternational} id="m-intl" onChange={e => setNm(p => ({ ...p, isInternational: e.target.checked }))} /> International
            </label>
            <button onClick={addMou} disabled={!nm.partnerName} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add</button>
          </div>
        </div>
        {mous.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm"><thead className="bg-slate-50 border-b"><tr>{['Partner', 'Type', 'Scope', 'Intl?', 'Expires', ''].map(h => <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-slate-400">{h}</th>)}</tr></thead>
              <tbody className="divide-y">{mous.map(r => <tr key={r.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-semibold">{r.partnerName}</td><td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-bold">{r.partnerType}</span></td><td className="px-4 py-3 text-slate-600 text-xs">{r.scope}</td><td className="px-4 py-3">{r.isInternational ? '🌍 Yes' : 'No'}</td><td className="px-4 py-3 text-slate-500 text-xs">{r.expiryDate ? new Date(r.expiryDate).toLocaleDateString('en-IN') : '—'}</td><td className="px-4 py-3"><button onClick={async () => { await api(`/api/naac/c3/mous/${r.id}`, 'DELETE'); setMous(p => p.filter(x => x.id !== r.id)); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="mt-3 p-3 bg-emerald-50 rounded-xl"><p className="text-xs text-emerald-700 font-medium">📊 Total MoUs: {mous.length} | International: {mous.filter(m => m.isInternational).length} | Industry: {mous.filter(m => m.partnerType === 'INDUSTRY').length}</p></div>
      </Card>

      {/* Extension Activities */}
      <Card title="3.4 — Extension & Outreach Activities" accent="#d1fae5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 p-4 bg-emerald-50 rounded-xl">
          <Input label="Activity Name" id="ext-name" value={ne.name} onChange={(e: any) => setNe(p => ({ ...p, name: e.target.value }))} placeholder="Activity name" />
          <Sel label="Type" id="ext-type" value={ne.type} onChange={(e: any) => setNe(p => ({ ...p, type: e.target.value }))} opts={['NSS', 'NCC', 'OUTREACH', 'COMMUNITY_SERVICE', 'NGO_COLLAB']} />
          <Input label="Students Participated" id="ext-stu" type="number" value={ne.studentsParticipated} onChange={(e: any) => setNe(p => ({ ...p, studentsParticipated: e.target.value }))} />
          <Input label="Partner Organization" id="ext-org" value={ne.partnerOrganization} onChange={(e: any) => setNe(p => ({ ...p, partnerOrganization: e.target.value }))} placeholder="Org. name (optional)" />
          <div className="flex items-end"><button onClick={addExtension} disabled={!ne.name} className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add</button></div>
        </div>
        {extensions.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm"><thead className="bg-slate-50 border-b"><tr>{['Activity', 'Type', 'Students', 'Partner', ''].map(h => <th key={h} className="px-4 py-3 text-xs font-bold uppercase text-slate-400">{h}</th>)}</tr></thead>
              <tbody className="divide-y">{extensions.map(r => <tr key={r.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-semibold">{r.name}</td><td className="px-4 py-3"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-bold">{r.type}</span></td><td className="px-4 py-3 font-bold">{r.studentsParticipated}</td><td className="px-4 py-3 text-slate-500">{r.partnerOrganization || '—'}</td><td className="px-4 py-3"><button onClick={async () => { await api(`/api/naac/c3/extension/${r.id}`, 'DELETE'); setExtensions(p => p.filter(x => x.id !== r.id)); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="mt-3 p-3 bg-emerald-50 rounded-xl"><p className="text-xs text-emerald-700 font-medium">📊 Activities: {extensions.length} | Total participants: {extensions.reduce((s, e) => s + e.studentsParticipated, 0)}</p></div>
      </Card>
    </div>
  );
}
