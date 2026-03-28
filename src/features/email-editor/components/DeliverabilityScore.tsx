import React, { useMemo } from 'react';
import { analyzeDeliverability } from '../../../lib/deliverability';
import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Props {
  subject: string;
  body: string;
}

export function DeliverabilityScore({ subject, body }: Props) {
  const report = useMemo(() => analyzeDeliverability(subject, body), [subject, body]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'text-green-600';
      case 'Good': return 'text-blue-600';
      case 'Warning': return 'text-yellow-600';
      case 'Poor': return 'text-red-600';
      default: return 'text-zinc-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Excellent': return 'bg-green-100';
      case 'Good': return 'bg-blue-100';
      case 'Warning': return 'bg-yellow-100';
      case 'Poor': return 'bg-red-100';
      default: return 'bg-zinc-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Excellent': return <ShieldCheck className="w-5 h-5 text-green-600" />;
      case 'Good': return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
      case 'Warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'Poor': return <ShieldAlert className="w-5 h-5 text-red-600" />;
      default: return <Info className="w-5 h-5 text-zinc-600" />;
    }
  };

  return (
    <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon(report.status)}
          <h3 className="font-heading font-black uppercase text-black text-sm">Deliverability Score</h3>
        </div>
        <div className={`px-2 py-1 border-2 border-black font-mono font-bold text-xs uppercase ${getStatusBg(report.status)} ${getStatusColor(report.status)}`}>
          {report.score} / 100 ({report.status})
        </div>
      </div>
      
      <Progress value={report.score} className="h-2 border-2 border-black rounded-none bg-zinc-100" />
      
      {report.issues.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Detected Issues:</p>
          <ul className="space-y-1.5">
            {report.issues.map((issue, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs font-mono text-black">
                <AlertTriangle className="w-3 h-3 text-yellow-600 shrink-0 mt-0.5" />
                <span className="leading-tight">{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {report.issues.length === 0 && (
        <div className="flex items-center gap-2 text-xs font-mono text-green-700 bg-green-50 p-2 border-2 border-green-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Looks great! No major deliverability issues detected.
        </div>
      )}
    </div>
  );
}
