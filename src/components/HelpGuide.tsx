import React, { useState } from 'react';
import { Search, BookOpen, Upload, FileText, Users, ClipboardCheck, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

const FAQ_ITEMS = [
  {
    category: 'Getting Started',
    items: [
      { q: 'How do I log in to UACAS?', a: 'Visit the login page at your institution\'s UACAS URL. Enter the email and password provided by your IQAC Coordinator. On first login, you will be asked to set a new password for security.' },
      { q: 'How do I navigate the dashboard?', a: 'The left sidebar contains all modules. Click on any module name (e.g., "NAAC Module", "Evidence Vault") to navigate. The main dashboard shows your overall accreditation readiness at a glance.' },
      { q: 'What is the "Getting Started" checklist?', a: 'This checklist appears when your institution has incomplete data. It guides you through the essential steps: setting up your profile, entering data for each criterion, uploading evidence, and generating reports. Complete each item to reach 100% readiness.' },
    ]
  },
  {
    category: 'NAAC Data Entry',
    items: [
      { q: 'How do I enter data for each NAAC criterion?', a: 'Navigate to the NAAC Module from the sidebar. You will see 7 criteria tabs (C1 through C7). Click on any criterion to open its data entry form. Fill in the required fields and click "Save" to persist your data.' },
      { q: 'What does each criterion cover?', a: 'Criterion I: Curricular Aspects (BoS meetings, courses, MOOCs)\nCriterion II: Teaching-Learning (enrollment, mentoring, FDPs)\nCriterion III: Research & Innovation (grants, publications, patents)\nCriterion IV: Infrastructure (facilities, library, IT)\nCriterion V: Student Support (scholarships, placements, activities)\nCriterion VI: Governance (vision/mission, IQAC, finance)\nCriterion VII: Institutional Values (gender, green initiatives, best practices)' },
      { q: 'Can I save partial data and come back later?', a: 'Yes! UACAS auto-saves your data when you click the "Save" button. You can return to any criterion at any time to update or add more information.' },
      { q: 'How do I know which fields are mandatory?', a: 'Look for the asterisk (*) next to field labels — those are required. The help tooltip (?) icon next to each section explains what data is needed and which NAAC metric it maps to.' },
    ]
  },
  {
    category: 'Evidence Management',
    items: [
      { q: 'How do I upload evidence documents?', a: 'Go to "Evidence Vault" from the sidebar. Click "Upload Evidence" or drag-and-drop files into the upload area. Select the criterion and metric code the document belongs to, then upload. Supported formats: PDF, Word, Excel, images.' },
      { q: 'Is there a file size limit?', a: 'Yes, individual files are limited to 50MB. For larger documents, consider splitting them into multiple files or compressing PDFs before upload.' },
      { q: 'Can I organize evidence by criterion?', a: 'Yes! When uploading, you assign each file to a specific criterion (C1-C7) and metric code. You can filter and search the evidence vault by criterion, file type, or name.' },
    ]
  },
  {
    category: 'Report Generation',
    items: [
      { q: 'How do I generate the final SSR report?', a: 'Go to "Report Engine" from the sidebar. Select the academic year, choose your report format (PDF, Word, Excel, or JSON), and optionally toggle inclusions like AI narratives and DVV links. Click "Compile & Download" to generate your report.' },
      { q: 'What formats are available?', a: 'PDF: Best for final submission and printing.\nWord (.docx): Editable format for review and modifications.\nExcel (.xlsx): Tabular data export for analysis.\nJSON: Raw data export for technical integration.' },
      { q: 'Does the report include all my data?', a: 'Yes! The report engine pulls the latest data from all 7 criteria and compiles it into the NAAC SSR format. It includes scores, narratives, and references to uploaded evidence.' },
    ]
  },
  {
    category: 'User Management',
    items: [
      { q: 'How do I add team members?', a: 'Only IQAC Coordinators and Super Admins can manage users. Go to "System Management" from the sidebar and use the user management section to add, edit, or remove team members.' },
      { q: 'What are the different roles?', a: 'Super Admin: Full system access including user management.\nIQAC Coordinator: Full data access, report generation, and team management.\nDepartment Head: Data entry for assigned department.\nFaculty: Limited data entry capabilities.\nReviewer: Read-only access for peer review.' },
      { q: 'Who do I contact for support?', a: 'Contact your institution\'s IQAC Coordinator for data-related questions. For technical issues, reach out to the system administrator or UACAS support.' },
    ]
  },
];

export default function HelpGuide() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Getting Started');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const filteredFAQ = FAQ_ITEMS.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Help & FAQ</h1>
          <p className="text-slate-500">Frequently asked questions and guidance for using UACAS.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search help topics..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredFAQ.map(cat => (
          <div key={cat.category} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-900">{cat.category}</span>
                <span className="text-xs text-slate-400 font-medium">{cat.items.length} questions</span>
              </div>
              {expandedCategory === cat.category ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
            </button>
            {expandedCategory === cat.category && (
              <div className="border-t border-slate-100 divide-y divide-slate-50">
                {cat.items.map(item => (
                  <div key={item.q}>
                    <button
                      onClick={() => setExpandedQuestion(expandedQuestion === item.q ? null : item.q)}
                      className="w-full flex items-center justify-between p-4 pl-14 hover:bg-slate-50/50 transition-colors text-left"
                    >
                      <span className="text-sm font-medium text-slate-700">{item.q}</span>
                      {expandedQuestion === item.q ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />}
                    </button>
                    {expandedQuestion === item.q && (
                      <div className="px-14 pb-4">
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredFAQ.length === 0 && (
        <div className="text-center py-16">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No matching help topics found. Try different search terms.</p>
        </div>
      )}
    </>
  );
}
