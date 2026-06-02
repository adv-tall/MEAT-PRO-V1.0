import React, { useState } from 'react';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

interface CsvExportProps {
  data: any[];
  filename?: string;
  label?: string;
  className?: string;
}

export function CsvExport({
  data,
  filename = "export.csv",
  label = "Export CSV",
  className
}: CsvExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleExport = () => {
    if (data.length === 0) return;
    
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        const headers = Object.keys(data[0]);
        const csvContent = [
          headers.join(','),
          ...data.map(row => 
            headers.map(header => {
              const cell = row[header] === null || row[header] === undefined ? '' : row[header];
              // Handle commas in content by wrapping in quotes
              return `"${String(cell).replace(/"/g, '""')}"`;
            }).join(',')
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setIsDone(true);
        setTimeout(() => setIsDone(false), 2000);
      } catch (error) {
        console.error('Export failed:', error);
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || data.length === 0}
      className={clsx(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
        isDone 
          ? "bg-emerald-500 text-white" 
          : "bg-[#111f42] text-white hover:bg-[#111f42]/90",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {isExporting ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isDone ? (
        <CheckCircle2 size={14} />
      ) : (
        <Download size={14} />
      )}
      {isDone ? "Exported!" : label}
    </button>
  );
}
