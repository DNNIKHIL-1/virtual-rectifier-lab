import React from 'react';
import {
  CalculatedResults,
  InstantaneousValues,
  RectifierTopology
} from '../types/rectifier';

interface ResultsPanelProps {
  instantState: InstantaneousValues;
  results: CalculatedResults;
  topology: RectifierTopology;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  instantState,
  results,
  topology
}) => {
  const isScr = topology.includes('scr');
  const prefix = isScr ? 'T' : 'D';

  let devices: string[] = [];
  if (topology === 'half-wave-diode' || topology === 'half-wave-scr') {
    devices = [`${prefix}1`];
  } else if (topology === 'semi-converter') {
    devices = ['T1', 'T3', 'D2', 'D4'];
  } else if (topology === 'three-phase-diode') {
    devices = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'];
  } else if (topology === 'three-phase-scr') {
    devices = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
  } else {
    devices = [`${prefix}1`, `${prefix}2`, `${prefix}3`, `${prefix}4`];
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 w-full">
      {/* 1. Instantaneous Values Card */}
      <div className="lg:col-span-3 bg-[#0b1329] border border-slate-800 rounded-xl p-3.5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Instantaneous Values
          </div>
          <div className="text-[10px] font-mono text-slate-400 mb-2.5">
            t = {instantState.timeMs.toFixed(1)} ms (θ = {instantState.phaseDeg.toFixed(0)}°)
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono">
            {/* Vs (AC) */}
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-emerald-400 font-bold text-[10px] block font-sans">Vs (AC)</span>
              <span className="text-emerald-300 text-xs font-bold">
                {instantState.vs.toFixed(1)} V
              </span>
            </div>

            {/* Is (AC) */}
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-blue-400 font-bold text-[10px] block font-sans">is (AC)</span>
              <span className="text-blue-300 text-xs font-bold">
                {instantState.is.toFixed(2)} A
              </span>
            </div>

            {/* Vo (DC) */}
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-cyan-400 font-bold text-[10px] block font-sans">Vo (DC)</span>
              <span className="text-cyan-300 text-xs font-bold">
                {instantState.vo.toFixed(1)} V
              </span>
            </div>

            {/* Io (DC) */}
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-amber-400 font-bold text-[10px] block font-sans">io (DC)</span>
              <span className="text-amber-300 text-xs font-bold">
                {instantState.io.toFixed(2)} A
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
          <span>Gate Pulse:</span>
          <span
            className={`font-mono font-bold ${
              instantState.gateTriggered ? 'text-amber-400 animate-pulse' : 'text-slate-600'
            }`}
          >
            {instantState.gateTriggered ? 'ACTIVE (FIRED)' : 'INACTIVE'}
          </span>
        </div>
      </div>

      {/* 2. Calculated Results Card (Formulas from Prof. Arpan Hota's slides) */}
      <div className="lg:col-span-5 bg-[#0b1329] border border-slate-800 rounded-xl p-3.5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Calculated Results
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
              {results.conductionMode}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono">
            {/* Vavg */}
            <div className="p-2 bg-slate-900/70 border border-slate-800 rounded-lg">
              <div className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
                <span>Vavg (Vo)</span>
                <span className="text-[9px] text-emerald-400 font-mono">
                  Th: {results.vAvgTheory.toFixed(1)}V
                </span>
              </div>
              <div className="text-slate-100 font-bold text-xs mt-0.5">
                {results.vAvg.toFixed(1)} V
              </div>
              <div className="text-[8px] text-slate-400 font-sans mt-0.5">
                Diff: {Math.abs(results.vAvg - results.vAvgTheory) < 1 ? '<1%' : `${Math.abs(((results.vAvg - results.vAvgTheory) / (results.vAvgTheory || 1)) * 100).toFixed(1)}%`}
              </div>
            </div>

            {/* Vrms */}
            <div className="p-2 bg-slate-900/70 border border-slate-800 rounded-lg">
              <div className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
                <span>Vrms (Vo)</span>
                <span className="text-[9px] text-slate-400 font-mono">
                  Th: {results.vRmsTheory.toFixed(1)}V
                </span>
              </div>
              <div className="text-slate-100 font-bold text-xs mt-0.5">
                {results.vRms.toFixed(1)} V
              </div>
              <div className="text-[8px] text-slate-400 font-sans mt-0.5">
                FF: {results.formFactor.toFixed(3)}
              </div>
            </div>

            {/* Iavg */}
            <div className="p-2 bg-slate-900/70 border border-slate-800 rounded-lg">
              <div className="text-[10px] text-slate-400 font-sans">Iavg (Io)</div>
              <div className="text-slate-100 font-bold text-xs mt-0.5">
                {results.iAvg.toFixed(2)} A
              </div>
              <div className="text-[8px] text-slate-400 font-sans mt-0.5">
                Is,rms: {results.isRms.toFixed(2)} A
              </div>
            </div>

            {/* Irms */}
            <div className="p-2 bg-slate-900/70 border border-slate-800 rounded-lg">
              <div className="text-[10px] text-slate-400 font-sans">Irms (Io)</div>
              <div className="text-slate-100 font-bold text-xs mt-0.5">
                {results.iRms.toFixed(2)} A
              </div>
              <div className="text-[8px] text-slate-400 font-sans mt-0.5">
                Is1,rms: {results.isFundRms.toFixed(2)} A
              </div>
            </div>

            {/* Ripple Factor */}
            <div className="p-2 bg-slate-900/70 border border-slate-800 rounded-lg">
              <div className="text-[10px] text-slate-400 font-sans">Ripple (γ)</div>
              <div className="text-amber-400 font-bold text-xs mt-0.5">
                {results.rippleFactor.toFixed(3)}
              </div>
              <div className="text-[8px] text-slate-400 font-sans mt-0.5">
                η: {results.efficiency.toFixed(1)}%
              </div>
            </div>

            {/* Special Mode / Commutation Overlap Angle & Power Flow */}
            <div className="p-2 bg-slate-900/70 border border-slate-800 rounded-lg">
              <div className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
                <span>{results.overlapAngleDeg > 0 ? 'Overlap (μ)' : 'Pload (Avg)'}</span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {results.pIn >= 1000 ? `${(results.pIn / 1000).toFixed(2)}kW in` : `${results.pIn.toFixed(0)}W in`}
                </span>
              </div>
              <div className="text-slate-100 font-bold text-xs mt-0.5">
                {results.overlapAngleDeg > 0
                  ? `${results.overlapAngleDeg.toFixed(1)}°`
                  : results.pLoad >= 1000
                  ? `${(results.pLoad / 1000).toFixed(2)} kW`
                  : `${results.pLoad.toFixed(1)} W`}
              </div>
              <div className="text-[8px] text-cyan-400 font-sans mt-0.5 flex justify-between">
                <span>
                  {results.conductionMode === 'Discontinuous (DCM)'
                    ? `β = ${results.extinctionAngleDeg.toFixed(0)}°`
                    : results.overlapAngleDeg > 0
                    ? 'Ls commutation'
                    : `Pdc: ${results.pDc >= 1000 ? `${(results.pDc / 1000).toFixed(1)}kW` : `${results.pDc.toFixed(0)}W`}`}
                </span>
                <span className="text-emerald-400 font-mono font-semibold">
                  η: {results.efficiency.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* True Power Factor Breakdown (Slide 6 & IEEE Literature) */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono gap-1">
          <span>
            TPF: <strong className="text-cyan-300">{results.powerFactor.toFixed(3)}</strong>
          </span>
          <span>
            DPF (cosφ₁): <strong className="text-slate-200">{results.displacementFactor.toFixed(3)}</strong>
          </span>
          <span>
            DF: <strong className="text-emerald-300">{results.distortionFactor.toFixed(3)}</strong>
          </span>
          <span>
            THD(i): <strong className="text-amber-300">{results.thdCurrentPercent.toFixed(1)}%</strong>
          </span>
        </div>
      </div>

      {/* 3. Conduction Status Table Card */}
      <div className="lg:col-span-4 bg-[#0b1329] border border-slate-800 rounded-xl p-3.5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Device Conduction Status
          </div>

          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-sans">
                <th className="pb-1 font-semibold">Device</th>
                <th className="pb-1 font-semibold">State</th>
                <th className="pb-1 text-right font-semibold">Current (A)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
              {devices.map((dev) => {
                const isOn = instantState.conductingDevices.includes(dev);
                const curr = instantState.deviceCurrents[dev] || 0;

                return (
                  <tr key={dev}>
                    <td className="py-1 font-bold text-slate-200">{dev}</td>
                    <td className="py-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOn
                              ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                              : 'bg-slate-700'
                          }`}
                        />
                        <span className={isOn ? 'text-emerald-300 font-bold' : 'text-slate-500'}>
                          {isOn ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </td>
                    <td className="py-1 text-right font-semibold">
                      {curr.toFixed(2)}
                    </td>
                  </tr>
                );
              })}

              {/* FWD Diode Row if active */}
              {instantState.conductingDevices.includes('FWD') && (
                <tr>
                  <td className="py-1 font-bold text-cyan-300">D_FW</td>
                  <td className="py-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                      <span className="text-cyan-300 font-bold">ON</span>
                    </div>
                  </td>
                  <td className="py-1 text-right font-semibold">
                    {instantState.fwdCurrent.toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="text-[10px] text-slate-500 italic pt-1.5 border-t border-slate-800">
          * Dynamic update matching active circuit conduction path
        </div>
      </div>
    </div>
  );
};
