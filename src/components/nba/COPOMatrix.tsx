import React from 'react';
import { cn } from '../../lib/utils';
import { Target } from 'lucide-react';

interface COPOMatrixProps {
  courseOutcomes: any[];
  programOutcomes: any[];
}

export default function COPOMatrix({ courseOutcomes, programOutcomes }: COPOMatrixProps) {
  if (!courseOutcomes || !programOutcomes || programOutcomes.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">CO-PO Mapping Matrix</h3>
            <p className="text-xs text-slate-500">Correlation levels (1=Low, 2=Medium, 3=High)</p>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-600 w-32">Course Outcomes</th>
              {programOutcomes.map(po => (
                <th key={po.id} className="px-4 py-3 font-semibold text-slate-600 text-center">
                  PO{po.poNumber}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courseOutcomes.length === 0 ? (
              <tr>
                <td colSpan={programOutcomes.length + 1} className="px-4 py-8 text-center text-slate-400 italic">
                  No course outcomes added yet.
                </td>
              </tr>
            ) : (
              courseOutcomes.map((co, idx) => (
                <tr key={co.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{co.code}</span>
                      <span className="text-xs text-slate-400 truncate w-32 block" title={co.description}>
                        {co.description}
                      </span>
                    </div>
                  </td>
                  {programOutcomes.map(po => {
                    const mapping = co.coPoMappings?.find((m: any) => m.poId === po.id);
                    const level = mapping?.correlationLevel;
                    return (
                      <td key={po.id} className="px-4 py-3 text-center">
                        {level ? (
                          <span className={cn(
                            "inline-flex w-8 h-8 items-center justify-center rounded-lg font-bold text-xs",
                            level === 3 ? "bg-blue-100 text-blue-700" :
                            level === 2 ? "bg-emerald-100 text-emerald-700" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {level}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
            
            {/* Average row */}
            {courseOutcomes.length > 0 && (
              <tr className="bg-slate-50/50 border-t border-slate-200">
                <td className="px-4 py-3 font-bold text-slate-700 text-right">Average</td>
                {programOutcomes.map(po => {
                  let sum = 0;
                  let count = 0;
                  courseOutcomes.forEach(co => {
                    const mapping = co.coPoMappings?.find((m: any) => m.poId === po.id);
                    if (mapping && mapping.correlationLevel > 0) {
                      sum += mapping.correlationLevel;
                      count++;
                    }
                  });
                  const avg = count > 0 ? (sum / count).toFixed(1) : '-';
                  return (
                    <td key={po.id} className="px-4 py-3 text-center font-bold text-slate-700">
                      {avg}
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
