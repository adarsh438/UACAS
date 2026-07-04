import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText, Filter, MoreVertical, CheckCircle2, Search, Trash2, Download } from 'lucide-react';

export default function EvidenceVault() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEvidence = async () => {
    try {
      const res = await fetch('/api/evidence');
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (err) {
      console.error('Failed to fetch evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('File size exceeds 50MB limit.');
      return;
    }
    setUploading(true);
    try {
      const res = await fetch('/api/evidence/upload', {
        method: 'POST',
        headers: {
          'x-file-name': file.name,
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: file
      });
      
      if (res.ok) {
        fetchEvidence();
      } else {
        const err = await res.json();
        alert(err.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this evidence?')) return;
    try {
      const res = await fetch(`/api/evidence/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles(f => f.filter(x => x.id !== id));
      } else {
        alert('Failed to delete file');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Evidence Vault</h1>
          <p className="text-slate-500">Centralized Digital Verification Vault (DVV) for audit readiness.</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <UploadCloud className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Evidence'}
        </button>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileChange} 
        className="hidden" 
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Zone */}
        <div className="lg:col-span-1">
          <div 
            onDrop={onDrop}
            onDragOver={onDragOver}
            className="p-8 bg-white rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center space-y-4 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer min-h-[400px]"
            onClick={() => fileInputRef.current?.click()}
          >
             <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
               <UploadCloud className="w-8 h-8" />
             </div>
             <div>
               <h3 className="font-bold text-lg text-slate-900">{uploading ? 'Uploading...' : 'Drag & Drop Files Here'}</h3>
               <p className="text-sm text-slate-500 mt-1">Supports PDF, DOCX, XLSX, JPG</p>
             </div>
             <button 
               type="button"
               disabled={uploading}
               className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold mt-4 hover:bg-slate-800 transition-colors disabled:opacity-50"
             >
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
                      value={search}
                      onChange={e => setSearch(e.target.value)}
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
                       <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                       <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {filteredFiles.length === 0 ? (
                       <tr>
                         <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                           {loading ? 'Loading...' : 'No files found in vault.'}
                         </td>
                       </tr>
                     ) : (
                       filteredFiles.map(file => (
                         <tr key={file.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-slate-400" />
                                <div>
                                  <a href={file.fileUrl || `/api/evidence/file/${file.id}`} target="_blank" rel="noreferrer" className="font-semibold text-sm text-slate-900 hover:text-blue-600 hover:underline transition-colors block max-w-[200px] truncate" title={file.name}>
                                    {file.name}
                                  </a>
                                  <p className="text-xs text-slate-500 uppercase">{file.fileType}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">{file.criterion || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                               {new Date(file.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex items-center justify-end gap-2">
                                 <a href={file.fileUrl || `/api/evidence/file/${file.id}`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                                   <Download className="w-4 h-4" />
                                 </a>
                                 <button onClick={() => handleDelete(file.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               </div>
                            </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>
    </>
  );
}
