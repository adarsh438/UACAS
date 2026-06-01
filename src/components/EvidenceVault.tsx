import React from 'react';
import { UploadCloud, FileText, Filter, MoreVertical, CheckCircle2, Search } from 'lucide-react';

const mockFiles = [
  { id: 1, name: 'Faculty_Publications_2023-24.xlsx', category: 'Criterion 3', size: '2.4 MB', status: 'Verified', date: '2 days ago' },
  { id: 2, name: 'Library_Infrastructure_Photos.pdf', category: 'Criterion 4', size: '15 MB', status: 'Pending', date: '1 week ago' },
  { id: 3, name: 'Student_Feedback_Analysis.pdf', category: 'Criterion 1', size: '1.1 MB', status: 'Verified', date: '3 weeks ago' },
  { id: 4, name: 'Alumni_Association_Registration.pdf', category: 'Criterion 5', size: '850 KB', status: 'Verified', date: '1 month ago' },
];

export default function EvidenceVault() {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Evidence Vault</h1>
          <p className="text-slate-500">Centralized Digital Verification Vault (DVV) for audit readiness.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
          <UploadCloud className="w-4 h-4" /> Upload Evidence
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Zone */}
        <div className="lg:col-span-1">
          <div className="p-8 bg-white rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center space-y-4 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer min-h-[400px]">
             <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
               <UploadCloud className="w-8 h-8" />
             </div>
             <div>
               <h3 className="font-bold text-lg text-slate-900">Drag & Drop Files Here</h3>
               <p className="text-sm text-slate-500 mt-1">Supports PDF, DOCX, XLSX, JPG</p>
             </div>
             <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold mt-4 hover:bg-slate-800 transition-colors">
               Browse Local Files
             </button>
             <p className="text-xs text-slate-400 mt-4">Max file size: 50MB</p>
          </div>
        </div>

        {/* File Repository */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm h-full flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search evidence..." 
                      className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all w-64"
                    />
                 </div>
                 <button className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium">
                    <Filter className="w-4 h-4" /> Filter
                 </button>
              </div>
              <div className="flex-1 overflow-auto">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 sticky top-0">
                     <tr>
                       <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Document Name</th>
                       <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Category</th>
                       <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                       <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {mockFiles.map(file => (
                       <tr key={file.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-slate-400" />
                              <div>
                                <p className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{file.name}</p>
                                <p className="text-xs text-slate-500">{file.size} • Uploaded {file.date}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">{file.category}</span>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`flex items-center gap-1.5 text-xs font-bold ${file.status === 'Verified' ? 'text-green-600' : 'text-amber-500'}`}>
                                {file.status === 'Verified' ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-2 h-2 rounded-full bg-amber-500" />}
                                {file.status}
                             </span>
                          </td>
                          <td className="px-6 py-4">
                             <button className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors">
                               <MoreVertical className="w-4 h-4" />
                             </button>
                          </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>
    </>
  );
}
