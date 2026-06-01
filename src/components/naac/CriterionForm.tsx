// src/components/naac/CriterionForm.tsx — Shared wrapper for all criterion forms
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Save, CheckCircle2, Loader2 } from 'lucide-react';
import Criterion1Form from './forms/Criterion1Form';
import Criterion2Form from './forms/Criterion2Form';
import Criterion3Form from './forms/Criterion3Form';
import Criterion4Form from './forms/Criterion4Form';
import Criterion5Form from './forms/Criterion5Form';
import Criterion6Form from './forms/Criterion6Form';
import Criterion7Form from './forms/Criterion7Form';

const CRITERION_META = [
  { id: 1, title: 'Curricular Aspects', color: '#6366f1', sections: ['BoS Meetings', 'Value-Added Courses', 'MOOC', 'Feedback'] },
  { id: 2, title: 'Teaching-Learning & Evaluation', color: '#0ea5e9', sections: ['Enrollment', 'Remedial Programs', 'ICT & Methods', 'FDPs', 'Exam Reforms', 'Learning Outcomes'] },
  { id: 3, title: 'Research, Innovations & Extension', color: '#10b981', sections: ['Research Grants', 'Patents & Startups', 'Publications', 'Extension Activities', 'MoUs'] },
  { id: 4, title: 'Infrastructure & Learning Resources', color: '#f59e0b', sections: ['Physical Facilities', 'Library', 'IT Infrastructure', 'Maintenance Budget'] },
  { id: 5, title: 'Student Support & Progression', color: '#ef4444', sections: ['Scholarships', 'Placements', 'Competitive Exams', 'Student Activities', 'Alumni'] },
  { id: 6, title: 'Governance, Leadership & Management', color: '#8b5cf6', sections: ['Vision & Mission', 'e-Governance', 'Admin Committees', 'Financial Records', 'IQAC'] },
  { id: 7, title: 'Institutional Values & Best Practices', color: '#14b8a6', sections: ['Gender Equity', 'Green Campus', 'Inclusion', 'Best Practices', 'Distinctiveness'] },
];

const YEARS = ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25'];

const CRITERION_FORMS: Record<number, React.FC<{ year: string }>> = {
  1: Criterion1Form, 2: Criterion2Form, 3: Criterion3Form, 4: Criterion4Form,
  5: Criterion5Form, 6: Criterion6Form, 7: Criterion7Form,
};

interface Props {
  criterion: number;
  onBack: () => void;
  role: string;
}

export default function CriterionForm({ criterion, onBack, role }: Props) {
  const [selectedYear, setSelectedYear] = useState('2024-25');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const meta = CRITERION_META.find(m => m.id === criterion)!;
  const FormComponent = CRITERION_FORMS[criterion];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1">
            ← NAAC Hub
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <span className="text-sm font-bold" style={{ color: meta.color }}>Criterion {criterion}</span>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300"
            id={`c${criterion}-year-select`}
          >
            {YEARS.map(y => <option key={y}>{y}</option>)}
          </select>

          {saveStatus === 'saved' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4" /> Saved!
            </motion.div>
          )}
        </div>
      </div>

      {/* Criterion Banner */}
      <div className="p-6 rounded-2xl text-white shadow-xl"
        style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)` }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">NAAC Criterion {criterion}</p>
            <h1 className="text-2xl font-black">{meta.title}</h1>
            <p className="text-white/80 text-sm mt-2">
              Sections: {meta.sections.join(' · ')}
            </p>
          </div>
          <div className="text-right bg-white/10 rounded-xl p-4">
            <p className="text-white/70 text-xs">Academic Year</p>
            <p className="text-xl font-black">{selectedYear}</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${criterion}-${selectedYear}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={role === 'REVIEWER' ? 'pointer-events-none opacity-80 select-none' : ''}
        >
          {FormComponent && <FormComponent year={selectedYear} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
