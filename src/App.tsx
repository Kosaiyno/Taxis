import React, { useState, useEffect } from 'react';
import { TopNavbar } from './components/layout/TopNavbar';
import { LeftToolPalette } from './components/layout/LeftToolPalette';
import { RightPropertiesPanel } from './components/layout/RightPropertiesPanel';
import { BottomStatusBar } from './components/layout/BottomStatusBar';
import { FloorPlanCanvas } from './components/canvas/FloorPlanCanvas';
import { PlotSetupModal } from './components/modals/PlotSetupModal';
import { ExportModal } from './components/modals/ExportModal';
import { registerFloorplanTools } from './webmcp/registerFloorplanTools';
import { Layers, Sliders, Download, X } from 'lucide-react';
import { useFloorPlanStore } from './store/floorplanStore';

export const App: React.FC = () => {
  const [isPlotModalOpen, setIsPlotModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState<'tools' | 'inspector' | null>(null);
  const { selectedId } = useFloorPlanStore();

  // Initialize WebMCP tools upon loading for external agents and browser document.modelContext
  useEffect(() => {
    registerFloorplanTools()
      .then((tools) => {
        console.log(`[TAXIS] WebMCP registered ${tools.length} spatial tools on document.modelContext.`);
      })
      .catch((err) => {
        console.warn('[TAXIS] WebMCP registration note:', err);
      });
  }, []);

  // Auto open inspector on mobile if user selects an item
  useEffect(() => {
    if (selectedId && window.innerWidth < 768) {
      setMobileDrawer('inspector');
    }
  }, [selectedId]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0e17] text-slate-100 overflow-hidden select-none font-sans">
      {/* Top Navbar */}
      <TopNavbar
        onOpenPlotModal={() => setIsPlotModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Desktop Left Palette */}
        <div className="hidden md:flex h-full">
          <LeftToolPalette />
        </div>

        {/* Center Canvas */}
        <FloorPlanCanvas />

        {/* Desktop Right Inspector */}
        <div className="hidden md:flex h-full">
          <RightPropertiesPanel />
        </div>

        {/* Mobile Floating Bottom Dock */}
        <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#0f1420]/90 backdrop-blur-2xl border border-white/[0.12] shadow-2xl p-1.5 rounded-2xl">
          <button
            onClick={() => setMobileDrawer(mobileDrawer === 'tools' ? null : 'tools')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              mobileDrawer === 'tools'
                ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tools</span>
          </button>

          <button
            onClick={() => setMobileDrawer(mobileDrawer === 'inspector' ? null : 'inspector')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              mobileDrawer === 'inspector'
                ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Inspector</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export</span>
          </button>
        </div>

        {/* Mobile Slide-Up Drawer Sheet */}
        {mobileDrawer && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
            <div className="bg-[#0d121d] border-t border-white/[0.12] rounded-t-3xl max-h-[82vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
              {/* Drawer Drag Bar & Close Button */}
              <div className="p-3 border-b border-white/[0.08] flex items-center justify-between">
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto" />
                <button
                  onClick={() => setMobileDrawer(null)}
                  className="p-1.5 rounded-xl bg-white/[0.06] text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto">
                {mobileDrawer === 'tools' ? (
                  <div className="w-full">
                    <LeftToolPalette />
                  </div>
                ) : (
                  <div className="w-full">
                    <RightPropertiesPanel />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Status Bar */}
      <BottomStatusBar />

      {/* Modals */}
      <PlotSetupModal isOpen={isPlotModalOpen} onClose={() => setIsPlotModalOpen(false)} />
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </div>
  );
};

export default App;
