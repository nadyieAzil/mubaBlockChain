import React from 'react';
import { STATUS_LABELS } from '@/config/sui';
import { Lock, FileCheck2, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: number;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const meta = STATUS_LABELS[status] || {
    label: 'Unknown',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  };

  const getIcon = () => {
    switch (status) {
      case 0:
        return <Lock className="h-3.5 w-3.5" />;
      case 1:
        return <FileCheck2 className="h-3.5 w-3.5" />;
      case 2:
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 3:
        return <RotateCcw className="h-3.5 w-3.5" />;
      case 4:
        return <AlertTriangle className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${meta.bg} ${meta.color} ${meta.border} ${className}`}
    >
      {getIcon()}
      <span>{meta.label}</span>
    </span>
  );
};
