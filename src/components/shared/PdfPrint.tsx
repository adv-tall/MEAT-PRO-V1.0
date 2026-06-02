import React from 'react';
import { Printer } from 'lucide-react';

interface PdfPrintProps {
  contentId: string;
  title?: string;
  className?: string;
}

export function PdfPrint({
  contentId,
  title = "Print Report",
  className
}: PdfPrintProps) {
  const handlePrint = () => {
    const printContent = document.getElementById(contentId);
    if (!printContent) return;

    const windowPrint = window.open('', '', 'width=900,height=650');
    if (!windowPrint) return;

    windowPrint.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Noto+Sans+Thai:wght@400;700&display=swap');
            body { font-family: 'JetBrains Mono', 'Noto Sans Thai', sans-serif; padding: 40px; color: #111f42; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111f42; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-weight: 900; font-size: 24px; color: #E3624A; }
            .title { font-weight: 900; font-size: 18px; text-transform: uppercase; letter-spacing: 2px; }
            .date { font-size: 12px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8fafc; text-align: left; padding: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
            td { padding: 12px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">WMS MASTER</div>
            <div>
              <div class="title">${title}</div>
              <div class="date">Printed on: ${new Date().toLocaleString()}</div>
            </div>
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 500);
  };

  return (
    <button
      onClick={handlePrint}
      className={`flex items-center gap-2 px-4 py-2 bg-slate-100 text-[#111f42] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all ${className}`}
    >
      <Printer size={14} />
      Print PDF
    </button>
  );
}
