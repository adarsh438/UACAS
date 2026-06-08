// src/components/naac/forms/Criterion7Form.tsx — Institutional Values & Best Practices
import React, { useState, useEffect } from 'react';
import { Save, Leaf, Users, Star, Lightbulb, CheckCircle2 } from 'lucide-react';
const api = async (url: string, method = 'GET', body?: any) => {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return res.json();
};
const Input = ({ label, id, required, ...p }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label} {required && <span className="text-red-500">*</span>}</label>
    <input id={id} {...p} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-300" />
  </div>
);
const Textarea = ({ label, id, rows = 3, required, ...p }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label} {required && <span className="text-red-500">*</span>}</label>
    <textarea id={id} rows={rows} {...p} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none" />
  </div>
);
const Card = ({ title, icon: Icon, accent = '#14b8a6', children }: any) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3" style={{ borderLeft: `4px solid ${accent}` }}>
      {Icon && <Icon className="w-5 h-5" style={{ color: accent }} />}
      <h3 className="font-bold text-slate-900">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const GREEN_ITEMS = [
  { key: 'solarPanels', label: '☀️ Solar Energy Panels' },
  { key: 'rainwaterHarvesting', label: '💧 Rainwater Harvesting' },
  { key: 'composting', label: '🌱 Composting / Vermicomposting' },
  { key: 'paperlessOffice', label: '📄 Paperless Office Initiatives' },
  { key: 'eWasteManagement', label: '♻️ e-Waste Management' },
  { key: 'ledLighting', label: '💡 LED Lighting Throughout' },
  { key: 'treeCount', label: 'Number of Trees', isInput: true },
];

const BP_FIELDS = [
  { key: 'title', label: 'Title of the Best Practice', type: 'input' },
  { key: 'objectives', label: 'Objectives of the Practice', type: 'textarea' },
  { key: 'context', label: 'The Context (Why this practice?)', type: 'textarea' },
  { key: 'practiceDesc', label: 'The Practice (How is it done?)', type: 'textarea' },
  { key: 'evidenceSuccess', label: 'Evidence of Success', type: 'textarea' },
  { key: 'problemsNotes', label: 'Problems Encountered and Resources Required', type: 'textarea' },
  { key: 'additionalNotes', label: 'Notes / Contact Details', type: 'textarea' },
];

export default function Criterion7Form({ year, setHasUnsavedChanges }: { year: string, setHasUnsavedChanges?: (v: boolean) => void }) {
  const [gender, setGender] = useState<any>(null);
  const [green, setGreen] = useState<any>(null);
  const [bp1, setBp1] = useState<any>(null);
  const [bp2, setBp2] = useState<any>(null);
  const [distinctiveness, setDistinctiveness] = useState<any>(null);
  const [toast, setToast] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    if (setHasUnsavedChanges) setHasUnsavedChanges(isDirty);
  }, [isDirty, setHasUnsavedChanges]);

  useEffect(() => {
    Promise.all([
      api(`/api/naac/c7/gender?year=${year}`), api(`/api/naac/c7/green?year=${year}`),
      api('/api/naac/c7/best-practices'), api('/api/naac/c7/distinctiveness'),
    ]).then(([g, gr, bps, dist]) => {
      setGender(Array.isArray(g) && g[0] ? g[0] : { sensitizationCount: 0, grievanceCellExists: false, antiHarassmentCommittee: false, femaleSafetyMeasures: '', genderNeutralToilets: false, internalComplaintsCommittee: false, academicYear: year });
      setGreen(Array.isArray(gr) && gr[0] ? gr[0] : { solarPanels: false, rainwaterHarvesting: false, composting: false, paperlessOffice: false, eWasteManagement: false, ledLighting: false, treeCount: 0, carbonNeutralPlan: false, energyAuditDone: false, academicYear: year });
      const bpsArr = Array.isArray(bps) ? bps : [];
      const b1 = bpsArr.find((b: any) => b.practiceNumber === 1) || { practiceNumber: 1, title: '', objectives: '', context: '', practiceDesc: '', evidenceSuccess: '', problemsNotes: '', additionalNotes: '' };
      const b2 = bpsArr.find((b: any) => b.practiceNumber === 2) || { practiceNumber: 2, title: '', objectives: '', context: '', practiceDesc: '', evidenceSuccess: '', problemsNotes: '', additionalNotes: '' };
      setBp1(b1);
      setBp2(b2);
      setDistinctiveness(Array.isArray(dist) && dist[0] ? dist[0] : { title: '', description: '', achievements: '', rankingsAwards: '' });
      setIsDirty(false);
    });
  }, [year]);

  const saveGender = async (silent = false) => {
    const r = await api('/api/naac/c7/gender', 'POST', { ...gender, academicYear: year, sensitizationCount: +gender.sensitizationCount });
    if (r.id) setGender(r);
    setIsDirty(false);
    if (!silent) showToast('Gender equity data saved!');
  };

  const saveGreen = async (silent = false) => {
    const r = await api('/api/naac/c7/green', 'POST', { ...green, academicYear: year, treeCount: +green.treeCount });
    if (r.id) setGreen(r);
    setIsDirty(false);
    if (!silent) showToast('Green campus data saved!');
  };

  const saveBP = async (bp: any, setter: any) => {
    const requiredFields = ['title', 'objectives', 'context', 'practiceDesc', 'evidenceSuccess', 'problemsNotes', 'additionalNotes'];
    const isComplete = requiredFields.every(k => bp[k] && bp[k].trim() !== '');
    if (!isComplete) {
      showToast('Error: All 7 fields are mandatory to save the Best Practice.');
      return;
    }
    const r = await api('/api/naac/c7/best-practices', 'POST', bp);
    if (r.id) setter(r);
    showToast(`Best Practice ${bp.practiceNumber} saved!`);
  };

  const saveDistinctiveness = async (silent = false) => {
    const r = await api('/api/naac/c7/distinctiveness', 'POST', distinctiveness);
    if (r.id) setDistinctiveness(r);
    setIsDirty(false);
    if (!silent) showToast('Institutional distinctiveness saved!');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) {
        if (gender) saveGender(true);
        if (green) saveGreen(true);
        if (distinctiveness) saveDistinctiveness(true);
        showToast('Auto-saved changes');
      }
    }, 60000); // 60 seconds auto-save
    return () => clearInterval(interval);
  }, [isDirty, gender, green, distinctiveness, year]);

  const greenChecked = green ? Object.entries(green).filter(([k, v]) => GREEN_ITEMS.filter(i => !i.isInput).map(i => i.key).includes(k) && v === true).length : 0;

  return (
    <div className="space-y-6" onChange={() => setIsDirty(true)} onInput={() => setIsDirty(true)}>
      {toast && <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-teal-600 text-white font-semibold text-sm shadow-xl">{toast}</div>}

      {/* 7.1.1 Gender Equity */}
      <Card title="7.1.1 — Gender Equity Programs & Facilities" icon={Users} accent="#14b8a6">
        {gender && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input label="No. of Sensitization Programs" id="gen-count" type="number" value={gender.sensitizationCount} onChange={(e: any) => setGender((p: any) => ({ ...p, sensitizationCount: e.target.value }))} />
            <div className="col-span-2 space-y-1">
              <label htmlFor="gen-safety" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Female Safety Measures</label>
              <input type="text" id="gen-safety" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-300"
                value={gender.femaleSafetyMeasures || ''} onChange={(e: any) => setGender((p: any) => ({ ...p, femaleSafetyMeasures: e.target.value }))} placeholder="CCTV, Security guards, Safe transport..." />
            </div>
            <div className="col-span-2 md:col-span-3 flex flex-wrap gap-5">
              {[
                ['Grievance Cell Exists', 'grievanceCellExists'],
                ['Anti-Harassment Committee', 'antiHarassmentCommittee'],
                ['Gender Neutral Toilets', 'genderNeutralToilets'],
                ['Internal Complaints Committee', 'internalComplaintsCommittee'],
              ].map(([l, k]) => (
                <label key={k} className="flex items-center gap-2 font-semibold text-sm cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-teal-600" checked={gender[k]} id={`gen-${k}`} onChange={e => setGender((p: any) => ({ ...p, [k]: e.target.checked }))} /> {l}
                </label>
              ))}
            </div>
            <div className="col-span-2 md:col-span-3 flex justify-between items-center">
              <div className="p-3 bg-teal-50 rounded-xl"><p className="text-xs text-teal-700 font-medium">📊 Programs: {gender.sensitizationCount} | Grievance Cell: {gender.grievanceCellExists ? '✅' : '❌'} | Anti-Harassment: {gender.antiHarassmentCommittee ? '✅' : '❌'}</p></div>
              <button onClick={saveGender} className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            </div>
          </div>
        )}
      </Card>

      {/* 7.1.2 Green Campus */}
      <Card title="7.1.2 — Green Campus & Environmental Consciousness" icon={Leaf} accent="#0d9488">
        {green && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {GREEN_ITEMS.map(item => (
                item.isInput ? (
                  <div key={item.key} className="space-y-1">
                    <label htmlFor={`gr-${item.key}`} className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</label>
                    <input id={`gr-${item.key}`} type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-300"
                      value={green[item.key] || 0} onChange={(e: any) => setGreen((p: any) => ({ ...p, [item.key]: e.target.value }))} />
                  </div>
                ) : (
                  <label key={item.key} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 transition-all ${green[item.key] ? 'border-teal-400 bg-teal-50' : 'border-slate-100 bg-slate-50'}`}>
                    <input type="checkbox" className="w-5 h-5 accent-teal-600" checked={green[item.key]} id={`gr-${item.key}`}
                      onChange={e => setGreen((p: any) => ({ ...p, [item.key]: e.target.checked }))} />
                    <span className={`text-sm font-semibold ${green[item.key] ? 'text-teal-800' : 'text-slate-600'}`}>{item.label}</span>
                    {green[item.key] && <CheckCircle2 className="w-4 h-4 text-teal-500 ml-auto" />}
                  </label>
                )
              ))}
              <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 transition-all border-slate-100 bg-slate-50">
                <input type="checkbox" className="w-5 h-5 accent-teal-600" checked={green.energyAuditDone} id="gr-energy"
                  onChange={e => setGreen((p: any) => ({ ...p, energyAuditDone: e.target.checked }))} />
                <span className="text-sm font-semibold text-slate-600">🔍 Energy Audit Done</span>
              </label>
              <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 transition-all border-slate-100 bg-slate-50">
                <input type="checkbox" className="w-5 h-5 accent-teal-600" checked={green.carbonNeutralPlan} id="gr-carbon"
                  onChange={e => setGreen((p: any) => ({ ...p, carbonNeutralPlan: e.target.checked }))} />
                <span className="text-sm font-semibold text-slate-600">🌍 Carbon Neutral Plan</span>
              </label>
            </div>

            {/* Progress indicator */}
            <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-teal-800">Green Campus Score</p>
                <p className="text-lg font-black text-teal-700">{greenChecked}/6 initiatives</p>
              </div>
              <div className="w-full h-3 bg-white rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${(greenChecked / 6) * 100}%` }} />
              </div>
              <p className="text-xs text-teal-600 mt-2">📊 Metric 7.1.2: {((greenChecked / 6) * 15).toFixed(1)}/15 marks scored</p>
            </div>

            <div className="flex justify-end">
              <button onClick={saveGreen} className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            </div>
          </div>
        )}
      </Card>

      {/* 7.2 Best Practices */}
      {[{ bp: bp1, setter: setBp1, n: 1 }, { bp: bp2, setter: setBp2, n: 2 }].map(({ bp, setter, n }) => (
        <Card key={n} title={`7.2 — Best Practice ${n} (All 7 NAAC fields required)`} icon={Lightbulb} accent="#2dd4bf">
          {bp && (
            <div className="space-y-4">
              <div className={`p-3 rounded-xl flex items-center gap-3 ${['title', 'objectives', 'context', 'practiceDesc', 'evidenceSuccess', 'problemsNotes', 'additionalNotes'].every(k => bp[k]) ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                {['title', 'objectives', 'context', 'practiceDesc', 'evidenceSuccess', 'problemsNotes', 'additionalNotes'].every(k => bp[k]) ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Star className="w-5 h-5 text-amber-500" />}
                <p className={`text-sm font-semibold ${['title', 'objectives', 'context', 'practiceDesc', 'evidenceSuccess', 'problemsNotes', 'additionalNotes'].every(k => bp[k]) ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {['title', 'objectives', 'context', 'practiceDesc', 'evidenceSuccess', 'problemsNotes', 'additionalNotes'].every(k => bp[k]) ? 'All required fields completed ✓' : 'Fill all 7 required fields to earn full marks'}
                </p>
              </div>
              {BP_FIELDS.map(f => (
                f.type === 'input' ? (
                  <Input key={f.key} required label={f.label} id={`bp${n}-${f.key}`} value={bp[f.key] || ''}
                    onChange={(e: any) => setter((p: any) => ({ ...p, [f.key]: e.target.value }))} placeholder={`Best Practice ${n} ${f.label.toLowerCase()}...`} />
                ) : (
                  <Textarea key={f.key} required label={f.label} id={`bp${n}-${f.key}`} rows={3} value={bp[f.key] || ''}
                    onChange={(e: any) => setter((p: any) => ({ ...p, [f.key]: e.target.value }))} placeholder={`Describe ${f.label.toLowerCase()}...`} />
                )
              ))}
              <div className="flex justify-end">
                <button onClick={() => saveBP({ ...bp, practiceNumber: n }, setter)}
                  className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save Best Practice {n}</button>
              </div>
            </div>
          )}
        </Card>
      ))}

      {/* 7.3 Distinctiveness */}
      <Card title="7.3 — Institutional Distinctiveness" icon={Star} accent="#5eead4">
        {distinctiveness && (
          <div className="space-y-4">
            <Input label="Title of Distinctive Feature" id="dist-title" value={distinctiveness.title} onChange={(e: any) => setDistinctiveness((p: any) => ({ ...p, title: e.target.value }))} placeholder="What makes this institution unique?" />
            <Textarea label="Description" id="dist-desc" rows={4} value={distinctiveness.description} onChange={(e: any) => setDistinctiveness((p: any) => ({ ...p, description: e.target.value }))} placeholder="Elaborate on the distinctive quality/feature..." />
            <Textarea label="Achievements & Recognition" id="dist-ach" rows={3} value={distinctiveness.achievements} onChange={(e: any) => setDistinctiveness((p: any) => ({ ...p, achievements: e.target.value }))} placeholder="National/international recognition, rankings..." />
            <Textarea label="Rankings & Awards" id="dist-rank" rows={2} value={distinctiveness.rankingsAwards} onChange={(e: any) => setDistinctiveness((p: any) => ({ ...p, rankingsAwards: e.target.value }))} placeholder="NIRF rank, accreditations, state awards..." />
            <div className="flex justify-between items-center">
              <div className="p-3 bg-teal-50 rounded-xl"><p className="text-xs text-teal-700 font-medium">📊 Metric 7.3.1: {distinctiveness.title && distinctiveness.description ? '10/10 ✅' : '0/10 — Please complete the form'}</p></div>
              <button onClick={saveDistinctiveness} className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
