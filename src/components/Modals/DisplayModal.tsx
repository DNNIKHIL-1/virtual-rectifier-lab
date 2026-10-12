import React from 'react';
import { X, Sliders, Check } from 'lucide-react';

interface DisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  animateCurrentFlow: boolean;
  setAnimateCurrentFlow: (val: boolean) => void;
  activeTab: 'scope' | 'data' | 'harmonics';
  setActiveTab: (tab: 'scope' | 'data' | 'harmonics') => void;
}

export const DisplayModal: React.FC<DisplayModalProps> = ({
  isOpen,
  onClose,
  animateCurrentFlow,
  setAnimateCurrentFlow,
  activeTab,
  setActiveTab
}) => {
  if (!isOpen) return null;

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
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Display & Waveform Options</h3>
            <p className="text-xs text-slate-400">
              Customize animations and analysis views
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* Default view */}
          <div>
            <label className="block text-slate-400 mb-2 font-medium">Waveforms View Mode</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveTab('scope')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-colors ${
                  activeTab === 'scope'
                    ? 'bg-cyan-600 text-white border-cyan-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Oscilloscope
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-colors ${
                  activeTab === 'data'
                    ? 'bg-cyan-600 text-white border-cyan-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Data Table
              </button>
              <button
                onClick={() => setActiveTab('harmonics')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-colors ${
                  activeTab === 'harmonics'
                    ? 'bg-cyan-600 text-white border-cyan-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                FFT Harmonics
              </button>
            </div>
          </div>

          {/* Animate Current Flow Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
            <div>
              <div className="font-semibold text-slate-200">Animate Current Flow</div>
              <div className="text-[11px] text-slate-400">
                Glow conducting branches and flow directional arrows
              </div>
            </div>
            <input
              type="checkbox"
              checked={animateCurrentFlow}
              onChange={(e) => setAnimateCurrentFlow(e.target.checked)}
              className="w-4 h-4 text-cyan-600 rounded bg-slate-800 border-slate-700 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg"
          >
            <Check className="w-4 h-4" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
