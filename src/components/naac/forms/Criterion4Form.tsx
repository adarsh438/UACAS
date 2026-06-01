// src/components/naac/forms/Criterion4Form.tsx — Infrastructure
import React, { useState, useEffect } from 'react';
import { Save, Building2, BookOpen, Wifi, Wrench } from 'lucide-react';
import { auth } from '../../../firebase';

const api = async (url: string, method = 'GET', body?: any) => {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};

const Input = ({ label, id, ...p }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <input id={id} {...p} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-300" />
  </div>
);
const Toggle = ({ label, id, checked, onChange }: any) => (
  <label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
    <input type="checkbox" id={id} checked={checked} onChange={onChange} className="w-4 h-4 accent-amber-600" />
    <span className="text-sm font-medium text-slate-700">{label}</span>
  </label>
);
const Card = ({ title, icon: Icon, accent = '#f59e0b', children }: any) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3" style={{ borderLeft: `4px solid ${accent}` }}>
      {Icon && <Icon className="w-5 h-5" style={{ color: accent }} />}
      <h3 className="font-bold text-slate-900">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const DATABASES = ['Scopus', 'EBSCO', 'JSTOR', 'Springer Link', 'IEEE Xplore', 'ProQuest', 'ScienceDirect', 'PubMed'];
const SOFTWARES = ['MATLAB', 'AutoCAD', 'ANSYS', 'MS Office 365', 'Tally ERP', 'Adobe CC', 'Python/Anaconda', 'SPSS', 'R Studio'];

export default function Criterion4Form({ year }: { year: string }) {
  const [facility, setFacility] = useState<any>(null);
  const [library, setLibrary] = useState<any>(null);
  const [it, setIt] = useState<any>(null);
  const [maintenance, setMaintenance] = useState<any>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const def = (obj: any, fields: any) => Object.assign(fields, obj || {});

  useEffect(() => {
    Promise.all([
      api(`/api/naac/c4/facility?year=${year}`),
      api(`/api/naac/c4/library?year=${year}`),
      api(`/api/naac/c4/it?year=${year}`),
      api(`/api/naac/c4/maintenance?year=${year}`),
    ]).then(([f, l, i, m]) => {
      setFacility(Array.isArray(f) && f[0] ? f[0] : { campusAreaAcres: '', builtUpAreaSqM: '', sportsGround: false, indoorSports: false, gym: false, auditorium: false, totalClassrooms: '', ictClassrooms: '', seminarHalls: '', labs: '', rampAvailability: false, liftAvailability: false, disabledFriendlyToilets: false, brailleSignage: false, academicYear: year });
      setLibrary(Array.isArray(l) && l[0] ? l[0] : { volumes: '', titles: '', printJournals: '', eJournals: '', eBooks: '', databases: '[]', automationSoftware: '', userProgramsCount: '', footfallPerDay: '', nDelNet: false, inflibnet: false, academicYear: year });
      setIt(Array.isArray(i) && i[0] ? i[0] : { computersForStudents: '', totalStudents: '', internetBandwidthMbps: '', wifiAvailable: false, wifiCoveragePercent: '', licensedSoftwareCount: '', licensedSoftwareList: '[]', cybersecurityMeasures: '', erp: false, erpName: '', academicYear: year });
      setMaintenance(Array.isArray(m) && m[0] ? m[0] : { annualBudgetINR: '', amountUtilizedINR: '', policyDocumentUrl: '', academicYear: year });
    });
  }, [year]);

  const saveFacility = async () => {
    const payload = { ...facility, academicYear: year, campusAreaAcres: +facility.campusAreaAcres, builtUpAreaSqM: +facility.builtUpAreaSqM, totalClassrooms: +facility.totalClassrooms, ictClassrooms: +facility.ictClassrooms, seminarHalls: +facility.seminarHalls, labs: +facility.labs };
    if (facility.id) await api(`/api/naac/c4/facility/${facility.id}`, 'PUT', payload);
    else { const r = await api('/api/naac/c4/facility', 'POST', payload); setFacility(r); }
    showToast('Physical facility saved!');
  };

  const saveLibrary = async () => {
    const payload = { ...library, academicYear: year, volumes: +library.volumes, printJournals: +library.printJournals, eJournals: +library.eJournals, eBooks: +library.eBooks, titles: +library.titles, userProgramsCount: +library.userProgramsCount, footfallPerDay: +library.footfallPerDay };
    if (library.id) await api(`/api/naac/c4/library/${library.id}`, 'PUT', payload);
    else { const r = await api('/api/naac/c4/library', 'POST', payload); setLibrary(r); }
    showToast('Library record saved!');
  };

  const saveIT = async () => {
    const payload = { ...it, academicYear: year, computersForStudents: +it.computersForStudents, totalStudents: +it.totalStudents, internetBandwidthMbps: +it.internetBandwidthMbps, wifiCoveragePercent: +it.wifiCoveragePercent, licensedSoftwareCount: +it.licensedSoftwareCount };
    if (it.id) await api(`/api/naac/c4/it/${it.id}`, 'PUT', payload);
    else { const r = await api('/api/naac/c4/it', 'POST', payload); setIt(r); }
    showToast('IT infrastructure saved!');
  };

  const saveMaintenance = async () => {
    const payload = { ...maintenance, academicYear: year, annualBudgetINR: +maintenance.annualBudgetINR, amountUtilizedINR: +maintenance.amountUtilizedINR };
    if (maintenance.id) await api(`/api/naac/c4/maintenance/${maintenance.id}`, 'PUT', payload);
    else { const r = await api('/api/naac/c4/maintenance', 'POST', payload); setMaintenance(r); }
    showToast('Maintenance budget saved!');
  };

  if (!facility || !library || !it || !maintenance) return <div className="text-center py-12 text-slate-400">Loading infrastructure data...</div>;

  const ictPct = facility.totalClassrooms > 0 ? ((facility.ictClassrooms || 0) / facility.totalClassrooms * 100).toFixed(1) : '0';
  const studentCompRatio = it.computersForStudents > 0 ? (it.totalStudents / it.computersForStudents).toFixed(1) : '∞';
  const libDbs = JSON.parse(library.databases || '[]') as string[];
  const swList = JSON.parse(it.licensedSoftwareList || '[]') as string[];
  const budgetUtil = maintenance.annualBudgetINR > 0 ? ((maintenance.amountUtilizedINR / maintenance.annualBudgetINR) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-amber-600 text-white font-semibold text-sm shadow-xl">{toast}</div>}

      {/* 4.1 Physical Facilities */}
      <Card title="4.1 — Physical Facilities & Campus Infrastructure" icon={Building2} accent="#f59e0b">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Input label="Campus Area (Acres)" id="f-area" type="number" value={facility.campusAreaAcres} onChange={(e: any) => setFacility((p: any) => ({ ...p, campusAreaAcres: e.target.value }))} />
          <Input label="Built-Up Area (sq.m)" id="f-built" type="number" value={facility.builtUpAreaSqM} onChange={(e: any) => setFacility((p: any) => ({ ...p, builtUpAreaSqM: e.target.value }))} />
          <Input label="Total Classrooms" id="f-cls" type="number" value={facility.totalClassrooms} onChange={(e: any) => setFacility((p: any) => ({ ...p, totalClassrooms: e.target.value }))} />
          <Input label="ICT-Enabled Classrooms" id="f-ict" type="number" value={facility.ictClassrooms} onChange={(e: any) => setFacility((p: any) => ({ ...p, ictClassrooms: e.target.value }))} />
          <Input label="Seminar Halls" id="f-sem" type="number" value={facility.seminarHalls} onChange={(e: any) => setFacility((p: any) => ({ ...p, seminarHalls: e.target.value }))} />
          <Input label="Labs / Workshops" id="f-labs" type="number" value={facility.labs} onChange={(e: any) => setFacility((p: any) => ({ ...p, labs: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <p className="col-span-2 md:col-span-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sports & Recreation</p>
          {[['Sports Ground', 'sportsGround'], ['Indoor Sports', 'indoorSports'], ['Gymnasium', 'gym'], ['Auditorium', 'auditorium']].map(([l, k]) => (
            <Toggle key={k} label={l} id={`f-${k}`} checked={facility[k]} onChange={(e: any) => setFacility((p: any) => ({ ...p, [k]: e.target.checked }))} />
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <p className="col-span-2 md:col-span-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Differently-Abled Friendly Infrastructure</p>
          {[['Ramps Available', 'rampAvailability'], ['Lifts Available', 'liftAvailability'], ['Accessible Toilets', 'disabledFriendlyToilets'], ['Braille Signage', 'brailleSignage']].map(([l, k]) => (
            <Toggle key={k} label={l} id={`f-dis-${k}`} checked={facility[k]} onChange={(e: any) => setFacility((p: any) => ({ ...p, [k]: e.target.checked }))} />
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div className="p-3 bg-amber-50 rounded-xl"><p className="text-xs text-amber-700 font-medium">📊 ICT Classrooms: {ictPct}% | Campus: {facility.campusAreaAcres} acres | Labs: {facility.labs}</p></div>
          <button onClick={saveFacility} className="px-6 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
        </div>
      </Card>

      {/* 4.2 Library */}
      <Card title="4.2 — Library as a Learning Resource" icon={BookOpen} accent="#fbbf24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Input label="Book Volumes" id="lib-vol" type="number" value={library.volumes} onChange={(e: any) => setLibrary((p: any) => ({ ...p, volumes: e.target.value }))} />
          <Input label="Print Journals" id="lib-pj" type="number" value={library.printJournals} onChange={(e: any) => setLibrary((p: any) => ({ ...p, printJournals: e.target.value }))} />
          <Input label="e-Journals" id="lib-ej" type="number" value={library.eJournals} onChange={(e: any) => setLibrary((p: any) => ({ ...p, eJournals: e.target.value }))} />
          <Input label="e-Books" id="lib-eb" type="number" value={library.eBooks} onChange={(e: any) => setLibrary((p: any) => ({ ...p, eBooks: e.target.value }))} />
          <Input label="Automation Software" id="lib-sw" value={library.automationSoftware} onChange={(e: any) => setLibrary((p: any) => ({ ...p, automationSoftware: e.target.value }))} placeholder="e.g., KOHA" />
          <Input label="User Programs/Year" id="lib-up" type="number" value={library.userProgramsCount} onChange={(e: any) => setLibrary((p: any) => ({ ...p, userProgramsCount: e.target.value }))} />
          <Input label="Footfall/Day" id="lib-fd" type="number" value={library.footfallPerDay} onChange={(e: any) => setLibrary((p: any) => ({ ...p, footfallPerDay: e.target.value }))} />
        </div>

        <div className="mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Database Subscriptions</p>
          <div className="flex flex-wrap gap-3">
            {DATABASES.map(db => (
              <label key={db} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-amber-600" checked={libDbs.includes(db)} id={`lib-db-${db}`}
                  onChange={e => {
                    const curr = JSON.parse(library.databases || '[]');
                    const updated = e.target.checked ? [...curr, db] : curr.filter((x: string) => x !== db);
                    setLibrary((p: any) => ({ ...p, databases: JSON.stringify(updated) }));
                  }} /> {db}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="p-3 bg-amber-50 rounded-xl"><p className="text-xs text-amber-700 font-medium">📊 Volumes: {(+library.volumes).toLocaleString('en-IN')} | e-Journals: {(+library.eJournals).toLocaleString()} | Databases: {libDbs.length}</p></div>
          <button onClick={saveLibrary} className="px-6 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
        </div>
      </Card>

      {/* 4.3 IT */}
      <Card title="4.3 — IT Infrastructure" icon={Wifi} accent="#fcd34d">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Input label="Computers (Students)" id="it-comp" type="number" value={it.computersForStudents} onChange={(e: any) => setIt((p: any) => ({ ...p, computersForStudents: e.target.value }))} />
          <Input label="Total Students" id="it-stu" type="number" value={it.totalStudents} onChange={(e: any) => setIt((p: any) => ({ ...p, totalStudents: e.target.value }))} />
          <Input label="Bandwidth (Mbps)" id="it-bw" type="number" value={it.internetBandwidthMbps} onChange={(e: any) => setIt((p: any) => ({ ...p, internetBandwidthMbps: e.target.value }))} />
          <Input label="Wi-Fi Coverage %" id="it-wifi" type="number" value={it.wifiCoveragePercent} onChange={(e: any) => setIt((p: any) => ({ ...p, wifiCoveragePercent: e.target.value }))} />
          <Input label="ERP Name" id="it-erp" value={it.erpName} onChange={(e: any) => setIt((p: any) => ({ ...p, erpName: e.target.value }))} placeholder="e.g., EduManager" />
          <Input label="Licensed SW Count" id="it-swc" type="number" value={it.licensedSoftwareCount} onChange={(e: any) => setIt((p: any) => ({ ...p, licensedSoftwareCount: e.target.value }))} />
          <div className="flex items-end gap-3">
            {[['Wi-Fi Available', 'wifiAvailable'], ['ERP Implemented', 'erp']].map(([l, k]) => (
              <Toggle key={k} label={l} id={`it-${k}`} checked={it[k]} onChange={(e: any) => setIt((p: any) => ({ ...p, [k]: e.target.checked }))} />
            ))}
          </div>
        </div>
        <div className="mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Licensed Software Packages</p>
          <div className="flex flex-wrap gap-3">
            {SOFTWARES.map(sw => (
              <label key={sw} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-amber-600" checked={swList.includes(sw)} id={`it-sw-${sw}`}
                  onChange={e => {
                    const curr = JSON.parse(it.licensedSoftwareList || '[]');
                    const updated = e.target.checked ? [...curr, sw] : curr.filter((x: string) => x !== sw);
                    setIt((p: any) => ({ ...p, licensedSoftwareList: JSON.stringify(updated) }));
                  }} /> {sw}
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="p-3 bg-amber-50 rounded-xl"><p className="text-xs text-amber-700 font-medium">📊 Student:Computer = 1:{studentCompRatio} | Bandwidth: {it.internetBandwidthMbps} Mbps | Wi-Fi: {it.wifiCoveragePercent}%</p></div>
          <button onClick={saveIT} className="px-6 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
        </div>
      </Card>

      {/* 4.4 Maintenance */}
      <Card title="4.4 — Maintenance of Campus Infrastructure" icon={Wrench} accent="#fde68a">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input label="Annual Budget (₹)" id="m-bud" type="number" value={maintenance.annualBudgetINR} onChange={(e: any) => setMaintenance((p: any) => ({ ...p, annualBudgetINR: e.target.value }))} />
          <Input label="Amount Utilized (₹)" id="m-util" type="number" value={maintenance.amountUtilizedINR} onChange={(e: any) => setMaintenance((p: any) => ({ ...p, amountUtilizedINR: e.target.value }))} />
          <Input label="Policy Document URL" id="m-doc" value={maintenance.policyDocumentUrl} onChange={(e: any) => setMaintenance((p: any) => ({ ...p, policyDocumentUrl: e.target.value }))} placeholder="/docs/maintenance-policy.pdf" />
        </div>
        <div className="flex justify-between items-center">
          <div className="p-3 bg-amber-50 rounded-xl"><p className="text-xs text-amber-700 font-medium">📊 Budget Utilization: {budgetUtil}% | ₹{(+maintenance.annualBudgetINR / 100000).toFixed(2)}L allocated</p></div>
          <button onClick={saveMaintenance} className="px-6 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
        </div>
      </Card>
    </div>
  );
}
