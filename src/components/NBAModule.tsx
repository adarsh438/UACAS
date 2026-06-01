import React from 'react';
import { Layers, Award, CheckSquare, BarChart } from 'lucide-react';

export default function NBAModule() {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">NBA Module</h1>
          <p className="text-slate-500">Program-level accreditation readiness for technical programs.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition">
           Generate SAR Draft
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            {/* Criteria List */}
            {[
               { id: 1, title: 'Vision, Mission and Program Educational Objectives', score: 45, max: 50 },
               { id: 2, title: 'Program Curriculum and Teaching-Learning Processes', score: 85, max: 100 },
               { id: 3, title: 'Course Outcomes and Program Outcomes', score: 100, max: 120 },
               { id: 4, title: 'Students\' Performance', score: 110, max: 150 },
            ].map(crit => (
               <div key={crit.id} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex-1 mr-6">
                     <span className="text-xs font-bold text-blue-600 px-2 py-1 bg-blue-50 rounded mb-2 inline-block">Criterion 0{crit.id}</span>
                     <h3 className="font-bold text-lg text-slate-800">{crit.title}</h3>
                     
                     <div className="mt-4 flex items-center gap-4">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                           <div className="bg-slate-900 h-full" style={{ width: `${(crit.score / crit.max) * 100}%`}}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-500">{Math.round((crit.score / crit.max) * 100)}%</span>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-3xl font-bold text-slate-900">{crit.score}</div>
                     <div className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">/ {crit.max} Marks</div>
                  </div>
               </div>
            ))}
         </div>

         <div className="space-y-6">
            <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl">
               <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <Award className="w-6 h-6 text-yellow-400" /> Pre-Qualifier Status
               </h3>
               <p className="text-slate-300 text-sm mb-6">Your program meets all critical pre-qualifier requirements for NBA tier-1 accreditation.</p>
               <ul className="space-y-3 mb-8">
                  {['Admissions > 50%', 'Faculty-Student Ratio', 'Core PhD Faculty'].map(req => (
                     <li key={req} className="flex items-center gap-3 text-sm font-medium">
                        <CheckSquare className="w-5 h-5 text-emerald-400" /> {req}
                     </li>
                  ))}
               </ul>
               <button className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl text-sm hover:bg-slate-100 transition-colors">
                  View Gap Analysis
               </button>
            </div>
            
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
               <BarChart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <h4 className="font-bold text-lg mb-2">Program Readiness Score</h4>
               <div className="text-5xl font-bold text-blue-600 mb-2">765<span className="text-xl text-slate-400">/1000</span></div>
               <p className="text-sm text-slate-500 font-medium">Eligible for 3 Years Accreditation</p>
            </div>
         </div>
      </div>
    </>
  );
}
