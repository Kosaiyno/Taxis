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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1c1512] border border-[#3d302a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-[#e6ccb2]">
        {/* Header */}
        <div className="p-4 border-b border-[#3d302a] flex items-center justify-between bg-[#15100e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c99a6e]/15 border border-[#c99a6e]/30 text-[#c99a6e] flex items-center justify-center">
              <LandPlot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#f5ebe0]">Set Land Plot Dimensions</h2>
              <p className="text-xs text-[#b08968]">Configure your property boundaries</p>
            </div>
          </div>

          <button onClick={onClose} className="text-[#b08968] hover:text-[#f5ebe0] p-1 rounded-lg hover:bg-[#261e1b] transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh] text-xs custom-scrollbar">
          {/* Presets */}
          <div>
            <label className="block text-[#b08968] font-semibold mb-2">Common Land Size Presets</label>
            <div className="grid grid-cols-2 gap-2">
              {PLOT_PRESETS.map((p) => {
                const isSelected = width === p.width && height === p.height;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-[#c99a6e]/20 border-[#c99a6e] text-[#f5ebe0]'
                        : 'bg-[#261e1b] border-[#3d302a] hover:bg-[#322723] text-[#e6ccb2]'
                    }`}
                  >
                    <div className="font-bold text-xs text-[#f5ebe0]">{p.name}</div>
                    <div className="text-[10px] text-[#b08968] font-mono mt-0.5">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimension Inputs */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-[#15100e] rounded-xl border border-[#3d302a]">
            <div>
              <label className="block text-[#b08968] font-medium mb-1">Plot Width ({unit})</label>
              <input
                type="number"
                step="0.5"
                min="5"
                max="100"
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value) || 5)}
                className="w-full bg-[#261e1b] border border-[#3d302a] rounded-lg px-3 py-2 text-[#f5ebe0] font-mono text-sm focus:outline-none focus:border-[#c99a6e]"
              />
            </div>

            <div>
              <label className="block text-[#b08968] font-medium mb-1">Plot Depth ({unit})</label>
              <input
                type="number"
                step="0.5"
                min="5"
                max="100"
                value={height}
                onChange={(e) => setHeight(parseFloat(e.target.value) || 5)}
                className="w-full bg-[#261e1b] border border-[#3d302a] rounded-lg px-3 py-2 text-[#f5ebe0] font-mono text-sm focus:outline-none focus:border-[#c99a6e]"
              />
            </div>

            <div className="col-span-2 flex items-center justify-between pt-2 border-t border-[#3d302a]">
              <span className="text-[#b08968] font-medium">Total Land Area:</span>
              <span className="text-sm font-mono font-bold text-[#c99a6e]">
                {formatArea(width * height, unit)}
              </span>
            </div>
          </div>

          {/* Unit Toggle */}
          <div>
            <label className="block text-[#b08968] font-medium mb-1.5">Measurement Unit</label>
            <div className="flex bg-[#15100e] p-1 rounded-xl border border-[#3d302a]">
              <button
                type="button"
                onClick={() => setLocalUnit('m')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  unit === 'm' ? 'bg-[#c99a6e] text-[#1c1512]' : 'text-[#b08968]'
                }`}
              >
                Meters (m / m²)
              </button>
              <button
                type="button"
                onClick={() => setLocalUnit('ft')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  unit === 'ft' ? 'bg-[#c99a6e] text-[#1c1512]' : 'text-[#b08968]'
                }`}
              >
                Feet (ft / sq ft)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#3d302a] flex items-center justify-end gap-2 bg-[#15100e]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[#b08968] hover:text-[#f5ebe0] text-xs font-medium rounded-lg hover:bg-[#261e1b] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 bg-[#c99a6e] hover:bg-[#b08968] text-[#1c1512] text-xs font-bold rounded-lg shadow transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply Dimensions</span>
          </button>
        </div>
      </div>
    </div>
  );
};
