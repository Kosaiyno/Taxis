import React, { useState } from 'react';
import { X, Download, FileCode, Image as ImageIcon, Copy, Check } from 'lucide-react';
import { useFloorPlanStore } from '../../store/floorplanStore';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { projectName, plot, rooms, openings, fixtures } = useFloorPlanStore();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const totalPlotArea = plot.width * plot.height;
  const totalBuiltArea = rooms.reduce((acc, r) => acc + r.width * r.height, 0);

  const generateSummaryText = () => {
    return `=== TAXIS SPATIAL ARCHITECTURAL BLUEPRINT ===
Project: ${projectName}
Plot Dimensions: ${plot.width}m × ${plot.height}m (${totalPlotArea.toFixed(1)} m²)
Total Built Living Area: ${totalBuiltArea.toFixed(1)} m²
Plot Coverage Ratio: ${((totalBuiltArea / totalPlotArea) * 100).toFixed(1)}%

ROOMS & ZONES BREAKDOWN (${rooms.length} Total):
${rooms
  .map(
    (r, i) =>
      `${i + 1}. ${r.name} (${r.type})
   - Dimensions: ${r.width.toFixed(2)}m × ${r.height.toFixed(2)}m ${r.wallRadius ? `(Curved: ${r.wallRadius}m radius)` : ''}
   - Area: ${(r.width * r.height).toFixed(2)} m²
   - Coordinates: (${r.x.toFixed(2)}m, ${r.y.toFixed(2)}m)
   - Openings: ${openings.filter((o) => o.roomId === r.id).length} doors/windows
   - Objects: ${fixtures.filter((f) => f.roomId === r.id).length} fixtures`
  )
  .join('\n\n')}

Generated via TAXIS (WebMCP Spatial Planning Engine)`;
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(generateSummaryText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const data = {
      version: '2.0.0',
      system: 'TAXIS Spatial Engine',
      exportedAt: new Date().toISOString(),
      projectName,
      plot,
      rooms,
      openings,
      fixtures,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_taxis_plan.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSVG = () => {
    const svgElem = document.querySelector('svg');
    if (!svgElem) return;

    const svgData = new XMLSerializer().serializeToString(svgElem);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_blueprint.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = () => {
    const svgElem = document.querySelector('svg');
    if (!svgElem) return;

    const svgData = new XMLSerializer().serializeToString(svgElem);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const scale = 2;
    const width = svgElem.clientWidth * scale || 1920;
    const height = svgElem.clientHeight * scale || 1080;

    canvas.width = width;
    canvas.height = height;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_blueprint.png`;
        a.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0d121d] border border-white/[0.12] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-300">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Export Vector Floor Plan</h2>
              <p className="text-xs text-slate-400">Download CAD blueprints, high-res renders, or project state</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 p-2 rounded-xl hover:bg-white/[0.06] transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar">
          <div className="grid grid-cols-1 gap-2.5">
            {/* SVG */}
            <button
              onClick={handleDownloadSVG}
              className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-amber-400/40 flex items-center justify-between transition text-left group shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors">Vector Blueprint (SVG)</div>
                  <div className="text-[11px] text-slate-400">Clean scalable vector for architects and CAD software</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-300 transition-colors" />
            </button>

            {/* PNG */}
            <button
              onClick={handleDownloadPNG}
              className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-amber-400/40 flex items-center justify-between transition text-left group shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors">High-Res Image (PNG)</div>
                  <div className="text-[11px] text-slate-400">Crisp image render for client presentations and print</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-300 transition-colors" />
            </button>

            {/* JSON */}
            <button
              onClick={handleDownloadJSON}
              className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-amber-400/40 flex items-center justify-between transition text-left group shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors">Project State (JSON)</div>
                  <div className="text-[11px] text-slate-400">Structured data to share or reload with WebMCP agents</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-300 transition-colors" />
            </button>
          </div>

          {/* Copy Summary */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-xs">Architect Specs Summary</span>
              <button
                onClick={handleCopySummary}
                className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] text-slate-200 rounded-xl border border-white/[0.08] flex items-center gap-1.5 transition text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 rounded-xl text-[10px] font-mono text-slate-300 overflow-x-auto max-h-32 border border-white/[0.06] custom-scrollbar">
              {generateSummaryText()}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] flex items-center justify-end bg-white/[0.02]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold rounded-xl border border-white/10 transition text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
