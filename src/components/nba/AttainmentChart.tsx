import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ReferenceLine } from 'recharts';

interface AttainmentChartProps {
  poAttainments: any[];
}

export default function AttainmentChart({ poAttainments }: AttainmentChartProps) {
  if (!poAttainments || poAttainments.length === 0) return null;

  const data = poAttainments.map((po: any) => ({
    name: `PO${po.poNumber}`,
    attainment: po.attainments[0]?.attainmentLevel || 0,
    target: po.attainments[0]?.target || 2.0,
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis domain={[0, 3]} tick={{ fontSize: 12, fill: '#64748b' }} />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend />
          <ReferenceLine y={2.0} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'Target (2.0)', fill: '#f59e0b', fontSize: 12 }} />
          <Bar dataKey="attainment" name="Attainment Level" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
