import React from 'react';
import { BookOpen, Target, CheckSquare } from 'lucide-react';

export default function OBETracking() {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">OBE Tracking</h1>
          <p className="text-slate-500">Outcome-Based Education automation mapping (CO-PO-PSO).</p>
        </div>
        <select className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold shadow-sm focus:ring-2 focus:ring-blue-100">
           <option>B.Tech Computer Science</option>
           <option>MBA (Master of Business Administration)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
         <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Target className="w-6 h-6" /></div>
            <div>
               <p className="text-sm text-slate-500 font-medium">Avg PO Attainment</p>
               <h3 className="text-2xl font-bold">2.4<span className="text-sm font-medium text-slate-400">/3.0</span></h3>
            </div>
         </div>
         <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><BookOpen className="w-6 h-6" /></div>
            <div>
               <p className="text-sm text-slate-500 font-medium">Mapped Courses</p>
               <h3 className="text-2xl font-bold">48<span className="text-sm font-medium text-slate-400">/52</span></h3>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-lg">Course Outcome Matrix (Current Semester)</h3>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800">
               Automate Calculation
            </button>
         </div>
         <div className="overflow-x-auto p-2">
            <table className="w-full text-left text-sm border-collapse">
               <thead>
                  <tr>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-wide border-b border-r border-slate-100">Course</th>
                     <th className="p-4 font-bold text-slate-500 uppercase tracking-wide border-b border-r border-slate-100 text-center">COs</th>
                     {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                        <th key={i} className="p-4 font-bold text-slate-500 uppercase border-b text-center border-r border-slate-100">PO{i}</th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                 {[
                   { code: "CS301", name: "Data Structures", cos: 5, mapped: [3, 2, 1, '-', 2, '-', '-', '-', '-', '-', '-', 1] },
                   { code: "CS302", name: "Algorithms",      cos: 4, mapped: [3, 3, 2, 1, 1, '-', '-', '-', '-', '-', '-', 2] },
                   { code: "CS303", name: "Databases",       cos: 6, mapped: [2, 2, 3, 2, 2, 1, '-', '-', '-', '-', '-', 1] },
                 ].map((course, idx) => (
                   <tr key={idx} className="hover:bg-slate-50 transition-colors">
                     <td className="p-4 border-b border-r border-slate-100 font-medium">
                        <span className="block text-slate-900 font-bold">{course.code}</span>
                        <span className="text-xs text-slate-500">{course.name}</span>
                     </td>
                     <td className="p-4 border-b border-r border-slate-100 text-center font-bold text-blue-600 bg-blue-50/20">{course.cos}</td>
                     {course.mapped.map((val, vIdx) => (
                        <td key={vIdx} className="p-4 border-b border-r border-slate-100 text-center font-medium">
                           {val === '-' ? <span className="text-slate-300">-</span> : val}
                        </td>
                     ))}
                   </tr>
                 ))}
               </tbody>
            </table>
         </div>
      </div>
    </>
  );
}
