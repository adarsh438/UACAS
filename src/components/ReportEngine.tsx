import React, { useState } from 'react';
import { FileText, Download, Target, BarChart2, BookOpen, Database, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ReportEngine({ onDownload }: { onDownload: (format: 'pdf' | 'docx' | 'xlsx' | 'json', year: string) => void }) {
  const [selectedYear, setSelectedYear] = useState('2024-25');
  const [inclusions, setInclusions] = useState({
    aiNarrative: true,
    watermark: false,
    dvvLinks: true,
    programData: true
  });

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Report Engine</h1>
          <p className="text-slate-500">Generate compliance format files and audit documentation instantly.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 border border-slate-200 rounded-2xl shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assessment Year:</span>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-sm font-bold text-slate-700 bg-transparent border-none cursor-pointer focus:ring-0"
          >
            <option value="2024-25">Academic Year 2024-25</option>
            <option value="2023-24">Academic Year 2023-24</option>
            <option value="2022-23">Academic Year 2022-23</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <FileText className="w-24 h-24 text-slate-900" />
            </div>
            <h3 className="text-xl font-bold mb-2 relative z-10 text-slate-900">NAAC SSR</h3>
            <p className="text-sm text-slate-500 mb-4 relative z-10 h-10">Self Study Report with automated C1-C7 data.</p>
            
            <div className="grid grid-cols-2 gap-2 relative z-10">
               <button 
                  onClick={() => onDownload('pdf', selectedYear)} 
                  className="py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Export PDF Report"
               >
                  <Download className="w-3.5 h-3.5" /> PDF
               </button>
               <button 
                  onClick={() => onDownload('docx', selectedYear)} 
                  className="py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Export Word Document (.docx)"
               >
                  <FileText className="w-3.5 h-3.5 text-blue-100" /> Word
               </button>
               <button 
                  onClick={() => onDownload('xlsx', selectedYear)} 
                  className="py-2.5 bg-green-700 text-white rounded-xl font-bold text-xs hover:bg-green-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Export Excel Spreadsheet (.xlsx)"
               >
                  <Download className="w-3.5 h-3.5 text-green-100" /> Excel
               </button>
               <button 
                  onClick={() => onDownload('json', selectedYear)} 
                  className="py-2.5 bg-amber-600 text-white rounded-xl font-bold text-xs hover:bg-amber-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Export Raw JSON Data"
               >
                  <Database className="w-3.5 h-3.5 text-amber-100" /> JSON
               </button>
            </div>
         </div>

         <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Target className="w-24 h-24" />
            </div>
            <h3 className="text-xl font-bold mb-2 relative z-10">NBA SAR</h3>
            <p className="text-sm text-slate-500 mb-6 relative z-10 h-10">Self Assessment Report for technical programs.</p>
            <button className="w-full py-3 bg-slate-100 text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors relative z-10 flex items-center justify-center gap-2 cursor-pointer">
               Configure Program
            </button>
         </div>

         <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <BarChart2 className="w-24 h-24" />
            </div>
            <h3 className="text-xl font-bold mb-2 relative z-10">NIRF Data</h3>
            <p className="text-sm text-slate-500 mb-6 relative z-10 h-10">Ranking framework CSV & statistical extracts.</p>
            <button className="w-full py-3 bg-slate-100 text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors relative z-10 flex items-center justify-center gap-2">
               Download CSVs
            </button>
         </div>

         <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <BookOpen className="w-24 h-24" />
            </div>
            <h3 className="text-xl font-bold mb-2 relative z-10">AISHE DCF</h3>
            <p className="text-sm text-slate-500 mb-6 relative z-10 h-10">Data Capture Format for MHRD submission.</p>
            <button className="w-full py-3 bg-slate-100 text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors relative z-10 flex items-center justify-center gap-2">
               Export XML
            </button>
         </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
         <h3 className="text-lg font-bold mb-6">Advanced Template Builder</h3>
         <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
               <div className="space-y-3">
                  <label className="text-sm font-bold uppercase tracking-wider text-slate-500">Report Template</label>
                  <select className="w-full p-4 bg-slate-50 border-slate-200 rounded-2xl font-medium focus:ring-2 focus:ring-blue-100 transition-all">
                    <option>NAAC Cycle 3 - Autonomous College</option>
                    <option>NAAC Cycle 1 - Affiliated College</option>
                    <option>University Standard Internal Audit</option>
                  </select>
               </div>
               
               <div className="space-y-3">
                  <label className="text-sm font-bold uppercase tracking-wider text-slate-500">Inclusions</label>
                  <div className="space-y-2">
                     <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                        <input 
                           type="checkbox" 
                           className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" 
                           checked={inclusions.aiNarrative}
                           onChange={(e) => setInclusions({ ...inclusions, aiNarrative: e.target.checked })} 
                        />
                        <span className="text-sm font-medium text-slate-700">Include AI Narratives</span>
                     </label>
                     <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                        <input 
                           type="checkbox" 
                           className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" 
                           checked={inclusions.watermark}
                           onChange={(e) => setInclusions({ ...inclusions, watermark: e.target.checked })} 
                        />
                        <span className="text-sm font-medium text-slate-700">Include Security Watermark</span>
                     </label>
                     <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                        <input 
                           type="checkbox" 
                           className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" 
                           checked={inclusions.dvvLinks}
                           onChange={(e) => setInclusions({ ...inclusions, dvvLinks: e.target.checked })} 
                        />
                        <span className="text-sm font-medium text-slate-700">Embed DVV Evidence Hyperlinks</span>
                     </label>
                     <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                        <input 
                           type="checkbox" 
                           className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" 
                           checked={inclusions.programData}
                           onChange={(e) => setInclusions({ ...inclusions, programData: e.target.checked })} 
                        />
                        <span className="text-sm font-medium text-slate-700">Include Detailed Program-wise Data Sheets</span>
                     </label>
                  </div>
               </div>
            </div>
            
            <div className="flex-1 bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-between">
               <div>
                  <h4 className="text-xl font-bold mb-2">Ready to Compile</h4>
                  <p className="text-slate-400 text-sm">The engine will collect the latest data points from the central repository and synthesize an audit-ready document.</p>
               </div>
               <div className="space-y-3 mt-8">
                  <button onClick={() => onDownload('pdf', selectedYear)} className="w-full py-4 bg-blue-600 font-bold rounded-2xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30 text-sm flex items-center justify-center gap-2">
                     <Download className="w-4 h-4" /> Compile & Download PDF
                  </button>
                  <button onClick={() => onDownload('docx', selectedYear)} className="w-full py-4 bg-slate-800 text-slate-300 font-bold rounded-2xl hover:bg-slate-700 transition-colors text-sm flex items-center justify-center gap-2">
                     <FileText className="w-4 h-4" /> Compile & Download Word (.docx)
                  </button>
               </div>
            </div>
         </div>
      </div>
    </>
  );
}
