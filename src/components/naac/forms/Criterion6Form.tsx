// src/components/naac/forms/Criterion6Form.tsx — Governance, Leadership & Management
import React, { useState, useEffect } from 'react';
import { Save, Settings, DollarSign, Building, Shield } from 'lucide-react';
import { auth } from '../../../firebase';

const api = async (url: string, method = 'GET', body?: any) => {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};
const Input = ({ label, id, ...p }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <input id={id} {...p} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-300" />
  </div>
);
const Textarea = ({ label, id, ...p }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <textarea id={id} {...p} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
  </div>
);
const Card = ({ title, icon: Icon, accent = '#8b5cf6', children }: any) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3" style={{ borderLeft: `4px solid ${accent}` }}>
      {Icon && <Icon className="w-5 h-5" style={{ color: accent }} />}
      <h3 className="font-bold text-slate-900">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const EGOV_AREAS = [
  { key: 'FINANCE', label: 'Finance & Accounts' },
  { key: 'HR', label: 'Human Resources' },
  { key: 'ADMISSION', label: 'Admission Process' },
  { key: 'EXAM', label: 'Examination Management' },
  { key: 'LIBRARY', label: 'Library Management' },
];

export default function Criterion6Form({ year }: { year: string }) {
  const [vm, setVm] = useState<any>(null);
  const [egov, setEgov] = useState<any[]>([]);
  const [financial, setFinancial] = useState<any>(null);
  const [iqac, setIqac] = useState<any>(null);
  const [toast, setToast] = useState('');
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    Promise.all([
      api('/api/naac/c6/vision'), api(`/api/naac/c6/egovernance?year=${year}`),
      api(`/api/naac/c6/financial?year=${year}`), api(`/api/naac/c6/iqac?year=${year}`),
    ]).then(([v, eg, fin, iq]) => {
      setVm(Array.isArray(v) && v[0] ? v[0] : { visionStatement: '', missionStatement: '', hasStrategicPlan: false, strategicPlanUrl: '', decentralizationDesc: '', academicYear: year });
      const egData = Array.isArray(eg) ? eg : [];
      const normalized = EGOV_AREAS.map(area => {
        const existing = egData.find((e: any) => e.area === area.key);
        return existing || { area: area.key, automationPercent: 0, softwareUsed: '', isImplemented: false, academicYear: year };
      });
      setEgov(normalized);
      setFinancial(Array.isArray(fin) && fin[0] ? fin[0] : { totalIncomeINR: '', grantIncomeINR: '', feeIncomeINR: '', otherIncomeINR: '', totalExpenditureINR: '', academicExpenditureINR: '', adminExpenditureINR: '', internalAuditDone: false, externalAuditDone: false, academicYear: year });
      setIqac(Array.isArray(iq) && iq[0] ? iq[0] : { constitutionDate: '', meetingsPerYear: '', meetingDatesJson: '[]', qualityInitiatives: '', initiativesDesc: '', nabaCertified: false, isoCertified: false, certificationDetails: '', nirfParticipated: false, nirfRank: '', aqarSubmittedYears: '[]', academicYear: year });
    });
  }, [year]);

  const saveVm = async () => {
    const payload = { ...vm, academicYear: year };
    const r = await api('/api/naac/c6/vision', 'POST', payload);
    if (r.id) setVm(r);
    showToast('Vision & Mission saved!');
  };

  const saveEgov = async (area: any) => {
    const r = await api(area.id ? `/api/naac/c6/egovernance/${area.id}` : '/api/naac/c6/egovernance', area.id ? 'PUT' : 'POST', { ...area, academicYear: year });
    setEgov(p => p.map(e => e.area === area.area ? r : e));
    showToast(`${area.area} e-governance saved!`);
  };

  const saveFinancial = async () => {
    const payload = { ...financial, academicYear: year, totalIncomeINR: +financial.totalIncomeINR, grantIncomeINR: +financial.grantIncomeINR, feeIncomeINR: +financial.feeIncomeINR, otherIncomeINR: +financial.otherIncomeINR, totalExpenditureINR: +financial.totalExpenditureINR, academicExpenditureINR: +financial.academicExpenditureINR, adminExpenditureINR: +financial.adminExpenditureINR };
    if (financial.id) await api(`/api/naac/c6/financial/${financial.id}`, 'PUT', payload);
    else { const r = await api('/api/naac/c6/financial', 'POST', payload); setFinancial(r); }
    showToast('Financial record saved!');
  };

  const saveIqac = async () => {
    const r = await api('/api/naac/c6/iqac', 'POST', { ...iqac, academicYear: year, constitutionDate: iqac.constitutionDate || null, meetingsPerYear: +iqac.meetingsPerYear, qualityInitiatives: +iqac.qualityInitiatives, nirfRank: iqac.nirfRank ? +iqac.nirfRank : null });
    if (r.id) setIqac(r);
    showToast('IQAC record saved!');
  };

  const avgEgov = egov.length > 0 ? (egov.reduce((s, e) => s + e.automationPercent, 0) / egov.length).toFixed(1) : '0';
  const academicBudgetPct = financial && +financial.totalExpenditureINR > 0 ? ((+financial.academicExpenditureINR / +financial.totalExpenditureINR) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-purple-600 text-white font-semibold text-sm shadow-xl">{toast}</div>}

      {/* 6.1 Vision & Mission */}
      <Card title="6.1 — Institutional Vision, Mission & Strategic Plan" icon={Shield} accent="#8b5cf6">
        {vm && (
          <div className="space-y-4">
            <Textarea label="Vision Statement" id="vm-vis" rows={3} value={vm.visionStatement} onChange={(e: any) => setVm((p: any) => ({ ...p, visionStatement: e.target.value }))} placeholder="To be a globally recognized institution..." />
            <Textarea label="Mission Statement" id="vm-mis" rows={3} value={vm.missionStatement} onChange={(e: any) => setVm((p: any) => ({ ...p, missionStatement: e.target.value }))} placeholder="To provide quality education..." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Strategic Plan Document URL" id="vm-sp" value={vm.strategicPlanUrl} onChange={(e: any) => setVm((p: any) => ({ ...p, strategicPlanUrl: e.target.value }))} placeholder="/docs/strategic-plan.pdf" />
              <label className="flex items-center gap-2 font-semibold text-sm cursor-pointer mt-6">
                <input type="checkbox" className="w-4 h-4 accent-purple-600" checked={vm.hasStrategicPlan} id="vm-has-sp" onChange={e => setVm((p: any) => ({ ...p, hasStrategicPlan: e.target.checked }))} /> Strategic Plan Available
              </label>
            </div>
            <Textarea label="Decentralization Practices" id="vm-dec" rows={2} value={vm.decentralizationDesc} onChange={(e: any) => setVm((p: any) => ({ ...p, decentralizationDesc: e.target.value }))} placeholder="Decision-making delegated to..." />
            <div className="flex justify-end">
              <button onClick={saveVm} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save Vision & Mission</button>
            </div>
          </div>
        )}
      </Card>

      {/* 6.2 e-Governance */}
      <Card title="6.2 — e-Governance Implementation" icon={Settings} accent="#7c3aed">
        <div className="space-y-4">
          {EGOV_AREAS.map((area, i) => {
            const rec = egov[i] || { area: area.key, automationPercent: 0, softwareUsed: '', isImplemented: false };
            return (
              <div key={area.key} className="p-4 bg-slate-50 rounded-xl grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                <div className="col-span-2 md:col-span-1">
                  <p className="text-sm font-bold text-slate-800">{area.label}</p>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-500 cursor-pointer mt-1">
                    <input type="checkbox" className="w-3 h-3 accent-purple-600" checked={rec.isImplemented} id={`eg-impl-${area.key}`}
                      onChange={e => setEgov(p => p.map(eg => eg.area === area.key ? { ...eg, isImplemented: e.target.checked } : eg))} /> Implemented
                  </label>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-1">AUTOMATION %</p>
                  <input type="range" min={0} max={100} value={rec.automationPercent} id={`eg-pct-${area.key}`}
                    onChange={e => setEgov(p => p.map(eg => eg.area === area.key ? { ...eg, automationPercent: +e.target.value } : eg))}
                    className="w-full accent-purple-600" />
                  <p className="text-xs font-bold text-purple-700 text-center mt-1">{rec.automationPercent}%</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-400 mb-1">SOFTWARE USED</p>
                  <input type="text" value={rec.softwareUsed} id={`eg-sw-${area.key}`}
                    onChange={e => setEgov(p => p.map(eg => eg.area === area.key ? { ...eg, softwareUsed: e.target.value } : eg))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="Software name" />
                </div>
                <button onClick={() => saveEgov(rec)} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 flex items-center gap-2 justify-center">
                  <Save className="w-3 h-3" /> Save
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-3 p-3 bg-purple-50 rounded-xl"><p className="text-xs text-purple-700 font-medium">📊 Average e-Governance: {avgEgov}% across 5 areas</p></div>
      </Card>

      {/* 6.4 Financial */}
      <Card title="6.4 — Financial Management & Resource Mobilization" icon={DollarSign} accent="#a78bfa">
        {financial && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input label="Total Income (₹)" id="fin-inc" type="number" value={financial.totalIncomeINR} onChange={(e: any) => setFinancial((p: any) => ({ ...p, totalIncomeINR: e.target.value }))} />
            <Input label="Grant Income (₹)" id="fin-grnt" type="number" value={financial.grantIncomeINR} onChange={(e: any) => setFinancial((p: any) => ({ ...p, grantIncomeINR: e.target.value }))} />
            <Input label="Fee Income (₹)" id="fin-fee" type="number" value={financial.feeIncomeINR} onChange={(e: any) => setFinancial((p: any) => ({ ...p, feeIncomeINR: e.target.value }))} />
            <Input label="Total Expenditure (₹)" id="fin-exp" type="number" value={financial.totalExpenditureINR} onChange={(e: any) => setFinancial((p: any) => ({ ...p, totalExpenditureINR: e.target.value }))} />
            <Input label="Academic Expenditure (₹)" id="fin-ac" type="number" value={financial.academicExpenditureINR} onChange={(e: any) => setFinancial((p: any) => ({ ...p, academicExpenditureINR: e.target.value }))} />
            <Input label="Admin Expenditure (₹)" id="fin-adm" type="number" value={financial.adminExpenditureINR} onChange={(e: any) => setFinancial((p: any) => ({ ...p, adminExpenditureINR: e.target.value }))} />
            <div className="col-span-2 md:col-span-3 flex items-center gap-6">
              {[['Internal Audit Done', 'internalAuditDone'], ['External Audit Done', 'externalAuditDone']].map(([l, k]) => (
                <label key={k} className="flex items-center gap-2 font-semibold text-sm cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-purple-600" checked={financial[k]} id={`fin-${k}`} onChange={e => setFinancial((p: any) => ({ ...p, [k]: e.target.checked }))} /> {l}
                </label>
              ))}
            </div>
            <div className="col-span-2 md:col-span-3 flex justify-between items-center">
              <div className="p-3 bg-purple-50 rounded-xl"><p className="text-xs text-purple-700 font-medium">📊 Academic budget %: {academicBudgetPct}% | Total Income: ₹{(+financial.totalIncomeINR / 10000000).toFixed(2)}Cr</p></div>
              <button onClick={saveFinancial} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            </div>
          </div>
        )}
      </Card>

      {/* 6.5 IQAC */}
      <Card title="6.5 — Internal Quality Assurance System (IQAC)" icon={Building} accent="#c4b5fd">
        {iqac && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input label="Constitution Date" id="iq-date" type="date" value={iqac.constitutionDate?.split('T')[0] || ''} onChange={(e: any) => setIqac((p: any) => ({ ...p, constitutionDate: e.target.value }))} />
            <Input label="Meetings Per Year" id="iq-meet" type="number" value={iqac.meetingsPerYear} onChange={(e: any) => setIqac((p: any) => ({ ...p, meetingsPerYear: e.target.value }))} />
            <Input label="Quality Initiatives Count" id="iq-init" type="number" value={iqac.qualityInitiatives} onChange={(e: any) => setIqac((p: any) => ({ ...p, qualityInitiatives: e.target.value }))} />
            <Input label="NIRF Rank (if applicable)" id="iq-nirf" type="number" value={iqac.nirfRank || ''} onChange={(e: any) => setIqac((p: any) => ({ ...p, nirfRank: e.target.value }))} />
            <Input label="Certification Details" id="iq-cert" value={iqac.certificationDetails || ''} onChange={(e: any) => setIqac((p: any) => ({ ...p, certificationDetails: e.target.value }))} placeholder="ISO 9001:2015, etc." />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">AQAR Submitted Years</p>
              <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
                defaultValue={JSON.parse(iqac.aqarSubmittedYears || '[]').join(', ')} id="iq-aqar"
                onBlur={(e: any) => setIqac((p: any) => ({ ...p, aqarSubmittedYears: JSON.stringify(e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)) }))}
                placeholder="2020-21, 2021-22, 2022-23..." />
            </div>
            <div className="col-span-2 md:col-span-3 flex flex-wrap gap-4">
              {[['NBA Certified', 'nabaCertified'], ['ISO Certified', 'isoCertified'], ['NIRF Participated', 'nirfParticipated']].map(([l, k]) => (
                <label key={k} className="flex items-center gap-2 font-semibold text-sm cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-purple-600" checked={iqac[k]} id={`iq-${k}`} onChange={e => setIqac((p: any) => ({ ...p, [k]: e.target.checked }))} /> {l}
                </label>
              ))}
            </div>
            <div className="col-span-2 md:col-span-3 flex justify-between items-center">
              <div className="p-3 bg-purple-50 rounded-xl">
                <p className="text-xs text-purple-700 font-medium">
                  📊 Meetings: {iqac.meetingsPerYear}/year {+iqac.meetingsPerYear >= 4 ? '✅' : '⚠️ (Min 4 required)'} | AQAR: {JSON.parse(iqac.aqarSubmittedYears || '[]').length} years | Initiatives: {iqac.qualityInitiatives}
                </p>
              </div>
              <button onClick={saveIqac} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
