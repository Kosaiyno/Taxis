import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  Download,
  LandPlot,
  Check,
  Trash2,
  RotateCcw,
  PlusCircle,
} from 'lucide-react';
import { useFloorPlanStore } from '../../store/floorplanStore';

interface TopNavbarProps {
  onOpenPlotModal: () => void;
  onOpenExportModal: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onOpenPlotModal,
  onOpenExportModal,
}) => {
  const {
    projectName,
    setProjectName,
    plot,
    setUnit,
    undo,
    redo,
    historyIndex,
    history,
    clearPlan,
    resetToDefault,
  } = useFloorPlanStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleClearAll = () => {
    clearPlan();
    setShowClearConfirm(false);
  };

  const handleResetDemo = () => {
    resetToDefault();
    setShowClearConfirm(false);
  };

  return (
    <>
      <header className="h-14 bg-[#0a0e17]/90 backdrop-blur-2xl border-b border-white/[0.08] px-4 flex items-center justify-between select-none z-30 text-xs text-slate-300">
        {/* Left: TAXIS Branding & Project Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 pr-3 border-r border-white/[0.08]">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-sm tracking-tighter">
              TX
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-100 tracking-wider text-xs font-mono uppercase">
                TAXIS
              </span>
              <span className="text-[9px] text-amber-400/90 font-sans font-medium -mt-0.5">
                Spatial Engine
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-slate-600">/</span>

            {isEditingTitle ? (
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                autoFocus
                className="bg-slate-950 text-slate-100 font-semibold px-2.5 py-1 rounded-xl border border-amber-400/70 focus:outline-none text-xs"
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="text-slate-200 hover:text-white font-medium px-2.5 py-1 rounded-xl hover:bg-white/[0.05] transition text-xs truncate max-w-[140px] md:max-w-[220px]"
              >
                <span>{projectName}</span>
              </button>
            )}

            <span className="bg-emerald-500/10 text-emerald-400 font-mono text-[9px] px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>WebMCP Active</span>
            </span>
          </div>
        </div>

        {/* Center: Undo/Redo, Clear, Units */}
        <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-1 shadow-sm">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-1.5 rounded-xl transition ${
              canUndo ? 'text-slate-300 hover:bg-white/[0.08] hover:text-white' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-1.5 rounded-xl transition ${
              canRedo ? 'text-slate-300 hover:bg-white/[0.08] hover:text-white' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-white/[0.08]" />

          {/* New / Clear Plan Button */}
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-2.5 py-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl font-medium transition flex items-center gap-1.5 text-[11px]"
            title="Clear canvas to start from scratch or reset"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden md:inline">Clear</span>
          </button>

          <div className="h-3.5 w-px bg-white/[0.08]" />

          {/* Unit Toggle */}
          <div className="flex bg-slate-950/60 rounded-xl p-0.5 text-[10px] font-bold font-mono">
            <button
              onClick={() => setUnit('m')}
              className={`px-2 py-0.5 rounded-lg transition ${
                plot.unit === 'm' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              M
            </button>
            <button
              onClick={() => setUnit('ft')}
              className={`px-2 py-0.5 rounded-lg transition ${
                plot.unit === 'ft' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              FT
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPlotModal}
            className="hidden sm:flex px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] text-slate-200 rounded-xl border border-white/[0.08] transition items-center gap-1.5 text-xs font-medium"
          >
            <LandPlot className="w-3.5 h-3.5 text-emerald-400" />
            <span>Plot</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="px-3.5 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] text-slate-200 font-medium rounded-xl border border-white/[0.08] transition flex items-center gap-1.5 text-xs shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-400/20 transition flex items-center gap-1.5 text-xs active:scale-95"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </header>

      {/* Clear / Start from Scratch Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1512] border border-[#3d302a] rounded-2xl w-full max-w-sm p-5 shadow-2xl text-xs space-y-4 text-[#e6ccb2]">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
              <Trash2 className="w-5 h-5" />
              <span>Clear Floor Plan?</span>
            </div>

            <p className="text-[#b08968] leading-relaxed">
              Do you want to wipe all rooms and furniture to start completely from scratch, or reset back to the starter demo?
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleClearAll}
                className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold rounded-xl border border-rose-500/40 flex items-center justify-center gap-2 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Start Blank Canvas (Wipe All)</span>
              </button>

              <button
                onClick={handleResetDemo}
                className="w-full py-2 bg-[#261e1b] hover:bg-[#322723] text-[#e6ccb2] font-semibold rounded-xl border border-[#3d302a] flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#c99a6e]" />
                <span>Reset to Example House</span>
              </button>

              <button
                onClick={() => setShowClearConfirm(false)}
                className="w-full py-1.5 text-[#8d7b68] hover:text-[#e6ccb2] text-center font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
