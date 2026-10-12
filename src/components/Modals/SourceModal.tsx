import React from 'react';
import { CircuitParameters } from '../../types/rectifier';
import { X, Zap, Check } from 'lucide-react';

interface SourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: CircuitParameters;
  setParams: React.Dispatch<React.SetStateAction<CircuitParameters>>;
}

export const SourceModal: React.FC<SourceModalProps> = ({
  isOpen,
  onClose,
  params,
  setParams
}) => {
  if (!isOpen) return null;

  const presets = [
    { label: 'India/EU Mains (230V, 50Hz)', v: 230, f: 50 },
    { label: 'US Mains (120V, 60Hz)', v: 120, f: 60 },
    { label: 'Industrial 3-Phase Phase-to-Neutral (240V, 50Hz)', v: 240, f: 50 },
    { label: 'Aerospace / Avionics (115V, 400Hz)', v: 115, f: 400 },
    { label: 'Low Voltage Lab Supply (24V, 50Hz)', v: 24, f: 50 }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1329] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Change AC Source</h3>
            <p className="text-xs text-slate-400">
              Configure supply RMS voltage and system frequency
            </p>
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-col gap-1.5 mb-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Quick Standards</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() =>
                setParams((prev) => ({ ...prev, vRms: p.v, frequency: p.f }))
              }
              className={`text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                params.vRms === p.v && params.frequency === p.f
                  ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <span>{p.label}</span>
              <span className="font-mono text-[11px] text-slate-400">
                {p.v}V / {p.f}Hz
              </span>
            </button>
          ))}
        </div>

        {/* Custom manual inputs */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">RMS Voltage (V)</label>
            <input
              type="number"
              min={10}
              max={600}
              value={params.vRms}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, vRms: Number(e.target.value) }))
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Frequency (Hz)</label>
            <input
              type="number"
              min={10}
              max={500}
              value={params.frequency}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, frequency: Number(e.target.value) }))
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg"
          >
            <Check className="w-4 h-4" />
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
