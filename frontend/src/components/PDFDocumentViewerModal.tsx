'use client';

import React, { useRef } from 'react';
import { FileText, Download, X, ExternalLink } from 'lucide-react';

interface PDFDocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl?: string;
  documentName?: string;
  title?: string;
}

export const PDFDocumentViewerModal: React.FC<PDFDocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documentUrl,
  documentName = 'Supporting Document.pdf',
  title = 'Deliverable Supporting Document / Report',
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!isOpen || !documentUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = documentUrl;
    a.download = documentName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-300 flex flex-col h-[92vh] overflow-hidden animate-fade-in-up">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold truncate">{title}</h3>
              <p className="text-[11px] text-slate-400 font-mono truncate">{documentName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              aria-label="Close Preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 bg-slate-800 relative overflow-hidden flex flex-col">
          <iframe
            ref={iframeRef}
            src={`${documentUrl}#toolbar=1&navpanes=0`}
            title={documentName}
            className="w-full h-full border-0 bg-white"
          />

          {/* Bottom helper toolbar */}
          <div className="px-4 py-2 bg-slate-950 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 shrink-0">
            <span>SuiPact In-App PDF Document Inspector</span>
            <div className="flex items-center gap-3">
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-bold inline-flex items-center gap-1"
              >
                Open in Browser Tab <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
