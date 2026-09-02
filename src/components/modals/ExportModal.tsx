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
    return `=== FLOORCRAFT ARCHITECTURAL SUMMARY ===
Project: ${projectName}
Plot Dimensions: ${plot.width}m × ${plot.height}m (${totalPlotArea.toFixed(1)} m²)
Total Built Living Area: ${totalBuiltArea.toFixed(1)} m²
Plot Coverage Ratio: ${((totalBuiltArea / totalPlotArea) * 100).toFixed(1)}%

ROOMS BREAKDOWN (${rooms.length} Total):
${rooms
  .map(
    (r, i) =>
      `${i + 1}. ${r.name} (${r.type})
   - Dimensions: ${r.width.toFixed(2)}m × ${r.height.toFixed(2)}m
   - Area: ${(r.width * r.height).toFixed(2)} m²
   - Coordinates: (${r.x.toFixed(2)}m, ${r.y.toFixed(2)}m)
   - Openings: ${openings.filter((o) => o.roomId === r.id).length} doors/windows
   - Objects: ${fixtures.filter((f) => f.roomId === r.id).length} fixtures`
  )
  .join('\n\n')}

Exported via FloorCraft (WebMCP Architecture)`;
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(generateSummaryText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const data = {
      version: '1.0.0',
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
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_floorplan.json`;
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
    canvas.width = (plot.width * 60 + 100) * scale;
    canvas.height = (plot.height * 60 + 100) * scale;

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#fcfbf9';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_floorplan.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    };
    img.src = url;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1c1512] border border-[#3d302a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-xs text-[#e6ccb2]">
        {/* Header */}
        <div className="p-4 border-b border-[#3d302a] flex items-center justify-between bg-[#15100e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c99a6e]/15 border border-[#c99a6e]/30 text-[#c99a6e] flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#f5ebe0]">Export Floor Plan</h2>
              <p className="text-[#b08968]">Download CAD vector blueprints, images, or project files</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#b08968] hover:text-[#f5ebe0] p-1 rounded-lg hover:bg-[#261e1b] transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar">
          <div className="grid grid-cols-1 gap-2.5">
            {/* SVG */}
            <button
              onClick={handleDownloadSVG}
              className="p-3.5 rounded-xl bg-[#261e1b] hover:bg-[#322723] border border-[#3d302a] hover:border-[#c99a6e] flex items-center justify-between transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#c99a6e]/15 text-[#c99a6e] flex items-center justify-center border border-[#c99a6e]/30">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-[#f5ebe0] group-hover:text-[#c99a6e]">Vector Blueprint (SVG)</div>
                  <div className="text-[11px] text-[#b08968]">Clean scalable vector for architects and CAD tools</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-[#b08968] group-hover:text-[#c99a6e]" />
            </button>

            {/* PNG */}
            <button
              onClick={handleDownloadPNG}
              className="p-3.5 rounded-xl bg-[#261e1b] hover:bg-[#322723] border border-[#3d302a] hover:border-[#c99a6e] flex items-center justify-between transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#c99a6e]/15 text-[#c99a6e] flex items-center justify-center border border-[#c99a6e]/30">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-[#f5ebe0] group-hover:text-[#c99a6e]">High-Res Image (PNG)</div>
                  <div className="text-[11px] text-[#b08968]">Crisp image render for presentations or printing</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-[#b08968] group-hover:text-[#c99a6e]" />
            </button>

            {/* JSON */}
            <button
              onClick={handleDownloadJSON}
              className="p-3.5 rounded-xl bg-[#261e1b] hover:bg-[#322723] border border-[#3d302a] hover:border-[#c99a6e] flex items-center justify-between transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#c99a6e]/15 text-[#c99a6e] flex items-center justify-center border border-[#c99a6e]/30">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-[#f5ebe0] group-hover:text-[#c99a6e]">Project File (JSON)</div>
                  <div className="text-[11px] text-[#b08968]">Structured state file to reload or share your design</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-[#b08968] group-hover:text-[#c99a6e]" />
            </button>
          </div>

          {/* Copy Summary */}
          <div className="p-3.5 bg-[#15100e] rounded-xl border border-[#3d302a] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#f5ebe0]">Architect Specs Summary</span>
              <button
                onClick={handleCopySummary}
                className="px-2.5 py-1 bg-[#261e1b] hover:bg-[#322723] text-[#e6ccb2] rounded-md border border-[#3d302a] flex items-center gap-1.5 transition text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#c99a6e]" /> : <Copy className="w-3.5 h-3.5 text-[#c99a6e]" />}
                <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
              </button>
            </div>
            <pre className="p-2.5 bg-[#1c1512] rounded-lg text-[10px] font-mono text-[#b08968] overflow-x-auto max-h-32 border border-[#261e1b]">
              {generateSummaryText()}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#3d302a] flex items-center justify-end bg-[#15100e]">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#261e1b] hover:bg-[#322723] text-[#f5ebe0] font-bold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
