import React, { useState, useEffect } from 'react';
import { BookOpen, Target, CheckSquare, RefreshCw } from 'lucide-react';

export default function OBETracking() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetch('/api/nba/programs')
      .then(res => res.json())
      .then(data => {
        if (data.nbaPrograms) {
          setPrograms(data.nbaPrograms);
          if (data.nbaPrograms.length > 0) {
            setSelectedProgramId(data.nbaPrograms[0].id);
          }
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedProgramId) return;
    fetchDashboard();
  }, [selectedProgramId]);

  const fetchDashboard = () => {
    setLoading(true);
    fetch(`/api/nba/dashboard/${selectedProgramId}`)
      .then(res => res.json())
      .then(setDashboardData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleCalculate = async () => {
    if (!selectedProgramId || !dashboardData) return;
    setCalculating(true);
    try {
      const year = dashboardData.accreditationYear || '2024-25';
      const res = await fetch(`/api/nba/attainment/calculate/${selectedProgramId}/${year}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        fetchDashboard();
        alert('Attainment recalculated successfully!');
      } else {
        alert('Failed to calculate attainment');
      }
    } catch (err) {
      console.error(err);
      alert('Error calculating attainment');
    } finally {
      setCalculating(false);
    }
  };

  const programOutcomes = dashboardData?.programOutcomes || [];
  const courseOutcomes = dashboardData?.courseOutcomes || [];
  
  // Calculate average attainment from POs
  let avgAttainment = 0;
  if (programOutcomes.length > 0) {
    const sum = programOutcomes.reduce((acc: number, po: any) => {
      const att = po.attainments?.[0]?.attainmentLevel || 0;
      return acc + att;
    }, 0);
    avgAttainment = sum / programOutcomes.length;
  }

  // Get distinct course codes
  const uniqueCourses = Array.from(new Set(courseOutcomes.map((co: any) => co.code.split('-')[0].trim())));

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">OBE Tracking</h1>
          <p className="text-slate-500">Outcome-Based Education automation mapping (CO-PO-PSO).</p>
        </div>
        <select 
          value={selectedProgramId}
          onChange={e => setSelectedProgramId(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold shadow-sm focus:ring-2 focus:ring-blue-100"
        >
          {programs.length === 0 ? <option value="">No programs available</option> : null}
          {programs.map(p => (
            <option key={p.id} value={p.id}>{p.programId} (Tier {p.tier}) - {p.accreditationYear}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
         <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Target className="w-6 h-6" /></div>
            <div>
               <p className="text-sm text-slate-500 font-medium">Avg PO Attainment</p>
               <h3 className="text-2xl font-bold">{avgAttainment.toFixed(1)}<span className="text-sm font-medium text-slate-400">/3.0</span></h3>
            </div>
         </div>
         <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><BookOpen className="w-6 h-6" /></div>
            <div>
               <p className="text-sm text-slate-500 font-medium">Mapped Courses</p>
               <h3 className="text-2xl font-bold">{uniqueCourses.length}</h3>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-lg">Course Outcome Matrix (Current Semester)</h3>
            <button 
              onClick={handleCalculate}
              disabled={calculating || !selectedProgramId}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 flex items-center gap-2 disabled:opacity-50"
            >
               {calculating ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
               Automate Calculation
            </button>
         </div>
         <div className="overflow-x-auto p-2">
            <table className="w-full text-left text-sm border-collapse">
               <thead>
                  <tr>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-wide border-b border-r border-slate-100">Course / CO</th>
                     {programOutcomes.length === 0 ? (
                       <th className="p-4 font-bold text-slate-500 uppercase border-b text-center border-r border-slate-100">POs</th>
                     ) : programOutcomes.map((po: any) => (
                        <th key={po.id} className="p-4 font-bold text-slate-500 uppercase border-b text-center border-r border-slate-100">PO{po.poNumber}</th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                 {loading ? (
                   <tr><td colSpan={programOutcomes.length + 1 || 2} className="p-8 text-center text-slate-500">Loading...</td></tr>
                 ) : courseOutcomes.length === 0 ? (
                   <tr><td colSpan={programOutcomes.length + 1 || 2} className="p-8 text-center text-slate-500">No Course Outcomes defined for this program.</td></tr>
                 ) : (
                   courseOutcomes.map((co: any) => (
                     <tr key={co.id} className="hover:bg-slate-50 transition-colors">
                       <td className="p-4 border-b border-r border-slate-100 font-medium">
                          <span className="block text-slate-900 font-bold">{co.code}</span>
                          <span className="text-xs text-slate-500 truncate block w-48" title={co.description}>{co.description}</span>
                       </td>
                       {programOutcomes.length === 0 ? (
                         <td className="p-4 border-b border-r border-slate-100 text-center font-medium">-</td>
                       ) : programOutcomes.map((po: any) => {
                          const mapping = co.coPoMappings?.find((m: any) => m.poId === po.id);
                          const val = mapping?.correlationLevel || '-';
                          return (
                            <td key={po.id} className="p-4 border-b border-r border-slate-100 text-center font-medium">
                               {val === '-' ? <span className="text-slate-300">-</span> : val}
                            </td>
                          );
                       })}
                     </tr>
                   ))
                 )}
               </tbody>
            </table>
         </div>
      </div>
    </>
  );
}
