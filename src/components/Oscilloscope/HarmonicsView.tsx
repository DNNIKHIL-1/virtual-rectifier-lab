import React, { useState } from 'react';
import { HarmonicPoint } from '../../types/rectifier';

interface HarmonicsViewProps {
  harmonics: HarmonicPoint[];
  isHarmonics: HarmonicPoint[];
  thdPercent: number;
  thdCurrentPercent: number;
}

export const HarmonicsView: React.FC<HarmonicsViewProps> = ({
  harmonics,
  isHarmonics,
  thdPercent,
  thdCurrentPercent
}) => {
  const [selectedSignal, setSelectedSignal] = useState<'vo' | 'is'>('vo');

  const activeHarmonics = selectedSignal === 'vo' ? harmonics : isHarmonics;
  const activeThd = selectedSignal === 'vo' ? thdPercent : thdCurrentPercent;
  const unit = selectedSignal === 'vo' ? 'V' : 'A';

  if (!activeHarmonics || activeHarmonics.length === 0) {
    return <div className="p-4 text-slate-400">No harmonic data available.</div>;
  }

  const maxAmp = Math.max(...activeHarmonics.map((h) => h.amplitude), 0.1);

  return (
    <div className="flex flex-col gap-3 h-[420px] bg-[#070d1d] border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          {/* Signal Selector Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 font-sans">
            <button
              onClick={() => setSelectedSignal('vo')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                selectedSignal === 'vo'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Output Voltage Vo(h)
            </button>
            <button
              onClick={() => setSelectedSignal('is')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                selectedSignal === 'is'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Input Line Current Is(h)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
          <span className="text-slate-400 text-[11px] font-sans">THD:</span>
          <span className="text-amber-400 font-bold font-mono text-xs">{activeThd.toFixed(1)}%</span>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 font-sans -mt-1">
        {selectedSignal === 'vo'
          ? 'Fourier decomposition of DC output voltage ripple harmonics'
          : 'Fourier spectrum of AC supply current harmonics (Slide 6 & Slide 37)'}
      </div>

      {/* Bar Chart of Harmonics */}
      <div className="flex-1 flex items-end justify-between gap-2 pt-6 pb-2 px-3 bg-slate-950/60 rounded border border-slate-900">
        {activeHarmonics.slice(0, 10).map((h) => {
          const heightPercent = Math.min(100, Math.max(3, (h.amplitude / maxAmp) * 100));

          return (
            <div key={h.harmonicNumber} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              <span className="text-[9px] text-cyan-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                {h.amplitude.toFixed(1)}{unit}
              </span>
              
              <div className="w-full max-w-[28px] bg-slate-800/80 rounded-t relative flex items-end justify-center overflow-hidden h-[180px]">
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    selectedSignal === 'vo'
                      ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 group-hover:from-cyan-500 group-hover:to-cyan-300'
                      : 'bg-gradient-to-t from-blue-600 to-blue-400 group-hover:from-blue-500 group-hover:to-blue-300'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              <div className="flex flex-col items-center">
                <span className="font-bold text-slate-200 text-[10px]">h={h.harmonicNumber}</span>
                <span className="text-[9px] text-slate-500">{h.frequencyHz}Hz</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Harmonic breakdown table */}
      <div className="grid grid-cols-5 gap-2 text-[10px]">
        {activeHarmonics.slice(0, 5).map((h) => (
          <div key={h.harmonicNumber} className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
            <div className="text-slate-400 font-sans">Harmonic #{h.harmonicNumber}</div>
            <div className="text-slate-100 font-bold text-xs">{h.amplitude.toFixed(2)} {unit}</div>
            <div className="text-slate-500 text-[9px]">{h.percentageOfFund.toFixed(1)}% of fund</div>
          </div>
        ))}
      </div>
    </div>
  );
};
