import React from 'react';
import { CircuitParameters, RectifierTopology } from '../../types/rectifier';
import { X, Sliders, Check, Zap } from 'lucide-react';

interface ComponentEditModalProps {
  selectedComponent: 'source' | 'resistor' | 'inductor' | 'thyristor' | 'load' | null;
  onClose: () => void;
  params: CircuitParameters;
  setParams: React.Dispatch<React.SetStateAction<CircuitParameters>>;
  topology: RectifierTopology;
}

export const ComponentEditModal: React.FC<ComponentEditModalProps> = ({
  selectedComponent,
  onClose,
  params,
  setParams,
  topology
}) => {
  if (!selectedComponent) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1329] border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {selectedComponent === 'source' && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-cyan-400 font-bold text-sm">
              <Zap className="w-4 h-4" />
              <span>Edit AC Source (Vs)</span>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">RMS Voltage (V)</label>
                <input
                  type="number"
                  value={params.vRms}
                  onChange={(e) =>
                    setParams((p) => ({ ...p, vRms: Number(e.target.value) }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Frequency (Hz)</label>
                <input
                  type="number"
                  value={params.frequency}
                  onChange={(e) =>
                    setParams((p) => ({ ...p, frequency: Number(e.target.value) }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {selectedComponent === 'resistor' && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-yellow-400 font-bold text-sm">
              <Sliders className="w-4 h-4" />
              <span>Edit Load Resistance (R)</span>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Resistance (Ω)</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={params.resistance}
                  onChange={(e) =>
                    setParams((p) => ({ ...p, resistance: Number(e.target.value) }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <input
                type="range"
                min={1}
                max={200}
                value={params.resistance}
                onChange={(e) =>
                  setParams((p) => ({ ...p, resistance: Number(e.target.value) }))
                }
                className="w-full accent-yellow-400"
              />
            </div>
          </div>
        )}

        {selectedComponent === 'inductor' && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-cyan-400 font-bold text-sm">
              <Sliders className="w-4 h-4" />
              <span>Edit Load Inductance (L)</span>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Inductance (mH)</label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={params.inductance}
                  onChange={(e) =>
                    setParams((p) => ({
                      ...p,
                      inductance: Number(e.target.value),
                      loadType: p.loadType === 'R' ? 'RL' : p.loadType
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={params.inductance}
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    inductance: Number(e.target.value),
                    loadType: p.loadType === 'R' ? 'RL' : p.loadType
                  }))
                }
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        )}

        {selectedComponent === 'thyristor' && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold text-sm">
              <Sliders className="w-4 h-4" />
              <span>SCR Firing Angle (α)</span>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Firing Angle (°)</label>
                <input
                  type="number"
                  min={0}
                  max={180}
                  value={params.firingAngle}
                  onChange={(e) =>
                    setParams((p) => ({ ...p, firingAngle: Number(e.target.value) }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <input
                type="range"
                min={0}
                max={180}
                value={params.firingAngle}
                onChange={(e) =>
                  setParams((p) => ({ ...p, firingAngle: Number(e.target.value) }))
                }
                className="w-full accent-amber-400"
              />
            </div>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md"
          >
            <Check className="w-3.5 h-3.5" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
