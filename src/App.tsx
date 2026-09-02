import React, { useState, useEffect } from 'react';
import { TopNavbar } from './components/layout/TopNavbar';
import { LeftToolPalette } from './components/layout/LeftToolPalette';
import { RightPropertiesPanel } from './components/layout/RightPropertiesPanel';
import { BottomStatusBar } from './components/layout/BottomStatusBar';
import { FloorPlanCanvas } from './components/canvas/FloorPlanCanvas';
import { PlotSetupModal } from './components/modals/PlotSetupModal';
import { ExportModal } from './components/modals/ExportModal';
import { registerFloorplanTools } from './webmcp/registerFloorplanTools';

export const App: React.FC = () => {
  const [isPlotModalOpen, setIsPlotModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Initialize WebMCP tools upon loading for external agents and browser document.modelContext
  useEffect(() => {
    registerFloorplanTools()
      .then((tools) => {
        console.log(`[FloorCraft] WebMCP registered ${tools.length} spatial tools on document.modelContext.`);
      })
      .catch((err) => {
        console.warn('[FloorCraft] WebMCP registration note:', err);
      });
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#15100e] text-[#e6ccb2] overflow-hidden select-none font-sans">
      {/* Top Navbar */}
      <TopNavbar
        onOpenPlotModal={() => setIsPlotModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Main Workspace (Left Palette + Center Canvas + Right Inspector) */}
      <main className="flex-1 flex overflow-hidden relative">
        <LeftToolPalette />
        <FloorPlanCanvas />
        <RightPropertiesPanel />
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
