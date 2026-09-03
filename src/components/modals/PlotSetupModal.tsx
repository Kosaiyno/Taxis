import React, { useState } from 'react';
import { X, LandPlot, Check } from 'lucide-react';
import { useFloorPlanStore } from '../../store/floorplanStore';
import { Unit } from '../../types/floorplan';
import { formatArea } from '../../utils/geometry';

interface PlotSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLOT_PRESETS = [
  { name: 'Standard Urban Lot', width: 15.0, height: 20.0, desc: '15m × 20m (300 m²)' },
  { name: 'Narrow Infill Lot', width: 10.0, height: 25.0, desc: '10m × 25m (250 m²)' },
  { name: 'Suburban Villa', width: 20.0, height: 25.0, desc: '20m × 25m (500 m²)' },
  { name: 'Compact Townhouse', width: 8.0, height: 16.0, desc: '8m × 16m (128 m²)' },
  { name: 'Large Estate Lot', width: 30.0, height: 40.0, desc: '30m × 40m (1,200 m²)' },
];

export const PlotSetupModal: React.FC<PlotSetupModalProps> = ({ isOpen, onClose }) => {
  const { plot, setPlot, setUnit } = useFloorPlanStore();

  const [width, setWidth] = useState<number>(plot.width);
  const [height, setHeight] = useState<number>(plot.height);
  const [unit, setLocalUnit] = useState<Unit>(plot.unit);
  const setbackFront = plot.setbackSouth || 2.0;
  const setbackRear = plot.setbackNorth || 2.0;
  const setbackSides = plot.setbackEast || 1.5;

  if (!isOpen) return null;

  const handleApply = () => {
    setPlot({
      width: Math.max(5, width),
      height: Math.max(5, height),
      unit,
      setbackSouth: setbackFront,
      setbackNorth: setbackRear,
      setbackEast: setbackSides,
      setbackWest: setbackSides,
    });
    setUnit(unit);
    onClose();
  };

  const handleSelectPreset = (p: typeof PLOT_PRESETS[0]) => {
    setWidth(p.width);
    setHeight(p.height);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0d121d] border border-white/[0.12] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-300">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center">
              <LandPlot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Set Land Plot Dimensions</h2>
              <p className="text-xs text-slate-400">Configure your spatial property boundaries</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 p-2 rounded-xl hover:bg-white/[0.06] transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh] text-xs custom-scrollbar">
          {/* Presets */}
          <div>
            <label className="block text-slate-400 font-semibold mb-2 text-xs uppercase tracking-wider">Common Land Size Presets</label>
            <div className="grid grid-cols-2 gap-2">
              {PLOT_PRESETS.map((p) => {
                const isSelected = width === p.width && height === p.height;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`p-3 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'bg-amber-400/15 border-amber-400 text-slate-100 shadow-md font-bold'
                        : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-100">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimension Inputs */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950/60 rounded-2xl border border-white/[0.08]">
            <div>
              <label className="block text-slate-400 font-medium mb-1 text-[11px]">Plot Width ({unit})</label>
              <input
                type="number"
                step="0.5"
                min="5"
                max="100"
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value) || 5)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-400/70"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1 text-[11px]">Plot Depth ({unit})</label>
              <input
                type="number"
                step="0.5"
                min="5"
                max="100"
                value={height}
                onChange={(e) => setHeight(parseFloat(e.target.value) || 5)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-400/70"
              />
            </div>

            <div className="col-span-2 flex items-center justify-between pt-2 border-t border-white/[0.08]">
              <span className="text-slate-400 font-medium">Total Land Area:</span>
              <span className="text-sm font-mono font-bold text-amber-400">
                {formatArea(width * height, unit)}
              </span>
            </div>
          </div>

          {/* Unit Toggle */}
          <div>
            <label className="block text-slate-400 font-medium mb-1.5 text-[11px]">Measurement Unit</label>
            <div className="flex bg-slate-950/60 p-1 rounded-2xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setLocalUnit('m')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  unit === 'm' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Meters (m / m²)
              </button>
              <button
                type="button"
                onClick={() => setLocalUnit('ft')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  unit === 'ft' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Feet (ft / sq ft)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] flex items-center justify-end gap-2 bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-slate-100 text-xs font-medium rounded-xl hover:bg-white/[0.06] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply Dimensions</span>
          </button>
        </div>
      </div>
    </div>
  );
};
