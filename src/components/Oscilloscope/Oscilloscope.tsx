import React, { useRef, useState } from 'react';
import { WaveformDataPoint, RectifierTopology } from '../../types/rectifier';

interface OscilloscopeProps {
  waveforms: WaveformDataPoint[];
  currentTimeMs: number;
  frequency: number;
  vPeak: number;
  iPeak: number;
  topology: RectifierTopology;
  onSeekTime?: (timeMs: number) => void;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  waveforms,
  currentTimeMs,
  frequency,
  vPeak,
  iPeak,
  topology,
  onSeekTime
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<WaveformDataPoint | null>(null);

  const isThreePhase = topology.includes('three-phase');
  const isScr = topology.includes('scr') || topology === 'semi-converter';

  // Toggle modes
  const [viewMode, setViewMode] = useState<'standard' | 'firing-sequence'>('standard');
  const [threePhaseMode, setThreePhaseMode] = useState<'phase' | 'line'>('phase');

  if (!waveforms || waveforms.length === 0) {
    return <div className="p-4 text-slate-400">Loading oscilloscope waveforms...</div>;
  }

  const maxTimeMs = waveforms[waveforms.length - 1].timeMs || 40;

  // Scales
  const vScaleMax = Math.max(250, Math.ceil((vPeak * 1.15) / 100) * 100);
  const iScaleMax = Math.max(5, Math.ceil((iPeak * 1.3) / 5) * 5);

  const width = 580;
  const graphHeight = 78;

  const getX = (tMs: number) => (tMs / maxTimeMs) * width;
  const getYBipolar = (v: number, maxV: number) => {
    const mid = graphHeight / 2;
    return mid - (v / maxV) * (mid - 8);
  };
  const getYUnipolar = (val: number, maxVal: number) => {
    const zeroY = graphHeight - 8;
    return zeroY - (Math.max(0, val) / maxVal) * (graphHeight - 16);
  };

  // 1-Phase paths
  const pathVs = waveforms
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.timeMs).toFixed(1)} ${getYBipolar(p.vs, vScaleMax).toFixed(1)}`)
    .join(' ');

  const pathIs = waveforms
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.timeMs).toFixed(1)} ${getYBipolar(p.is, iScaleMax).toFixed(1)}`)
    .join(' ');

  const pathVo = waveforms
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.timeMs).toFixed(1)} ${getYBipolar(p.vo, vScaleMax).toFixed(1)}`)
    .join(' ');

  const pathIo = waveforms
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.timeMs).toFixed(1)} ${getYUnipolar(p.io, iScaleMax).toFixed(1)}`)
    .join(' ');

  const pathIFwd = waveforms
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.timeMs).toFixed(1)} ${getYUnipolar(p.iFwd || 0, iScaleMax).toFixed(1)}`)
    .join(' ');

  // 3-Phase Phase Voltages (van, vbn, vcn)
  const pathVan = waveforms
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.timeMs).toFixed(1)} ${getYBipolar(p.van || 0, vScaleMax).toFixed(1)}`)
    .join(' ');

  const pathVbn = waveforms
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.timeMs).toFixed(1)} ${getYBipolar(p.vbn || 0, vScaleMax).toFixed(1)}`)
    .join(' ');

  const pathVcn = waveforms
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.timeMs).toFixed(1)} ${getYBipolar(p.vcn || 0, vScaleMax).toFixed(1)}`)
    .join(' ');

  // 3-Phase Line-to-Line Voltages (vab, vbc, vca)
  const pathVab = waveforms
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.timeMs).toFixed(1)} ${getYBipolar(p.vab || 0, vScaleMax).toFixed(1)}`)
    .join(' ');

  const pathVbc = waveforms
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.timeMs).toFixed(1)} ${getYBipolar(p.vbc || 0, vScaleMax).toFixed(1)}`)
    .join(' ');

  const pathVca = waveforms
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.timeMs).toFixed(1)} ${getYBipolar(p.vca || 0, vScaleMax).toFixed(1)}`)
    .join(' ');

  // Thyristor firing pulses (T1 to T6)
  const getPulsePath = (key: string) => {
    return waveforms
      .map((p, i) => {
        const val = p.gatePulses?.[key] || 0;
        const y = val > 0 ? 12 : graphHeight - 12;
        return `${i === 0 ? 'M' : 'L'} ${getX(p.timeMs).toFixed(1)} ${y}`;
      })
      .join(' ');
  };

  const pathT1 = getPulsePath('T1');
  const pathT2 = getPulsePath('T2');
  const pathT3 = getPulsePath('T3');
  const pathT4 = getPulsePath('T4');
  const pathT5 = getPulsePath('T5');
  const pathT6 = getPulsePath('T6');

  // Thyristor conduction currents
  const getDeviceCurrentPath = (idx: 1 | 2 | 3 | 4 | 5 | 6) => {
    return waveforms
      .map((p, i) => {
        let val = 0;
        if (idx === 1) val = p.iDevice1;
        if (idx === 2) val = p.iDevice2;
        if (idx === 3) val = p.iDevice3;
        if (idx === 4) val = p.iDevice4;
        if (idx === 5) val = p.iDevice5;
        if (idx === 6) val = p.iDevice6;
        return `${i === 0 ? 'M' : 'L'} ${getX(p.timeMs).toFixed(1)} ${getYUnipolar(val, iScaleMax).toFixed(1)}`;
      })
      .join(' ');
  };

  const pathIT1 = getDeviceCurrentPath(1);
  const pathIT2 = getDeviceCurrentPath(2);
  const pathIT3 = getDeviceCurrentPath(3);
  const pathIT4 = getDeviceCurrentPath(4);
  const pathIT5 = getDeviceCurrentPath(5);
  const pathIT6 = getDeviceCurrentPath(6);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const targetTimeMs = ratio * maxTimeMs;

    let closest = waveforms[0];
    let minD = Infinity;
    for (let i = 0; i < waveforms.length; i++) {
      const d = Math.abs(waveforms[i].timeMs - targetTimeMs);
      if (d < minD) {
        minD = d;
        closest = waveforms[i];
      }
    }
    setHoveredPoint(closest);
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onSeekTime) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    onSeekTime(ratio * maxTimeMs);
  };

  const currentPt =
    waveforms.find((p) => Math.abs(p.timeMs - (currentTimeMs % maxTimeMs)) < 0.1) || waveforms[0];

  return (
    <div className="flex flex-col gap-2 w-full select-none" ref={containerRef}>
      {/* Top Controls & Live Value Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('standard')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
              viewMode === 'standard'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isThreePhase ? '3-Phase AC & DC Waveforms' : 'AC & DC Waveforms'}
          </button>

          {isScr && (
            <button
              onClick={() => setViewMode('firing-sequence')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                viewMode === 'firing-sequence'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isThreePhase
                ? 'Firing Sequence (T1 → T2 → T3 → T4 → T5 → T6)'
                : topology === 'semi-converter'
                ? 'Firing Pulses (T1 @ α, T3 @ 180°+α)'
                : topology === 'half-wave-scr'
                ? 'Firing Pulse (T1 @ α)'
                : 'Firing Sequence (T1,T2 → T3,T4)'}
            </button>
          )}

          {isThreePhase && viewMode === 'standard' && (
            <div className="flex items-center gap-1 border-l border-slate-700 pl-1.5 ml-1">
              <button
                onClick={() => setThreePhaseMode('phase')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  threePhaseMode === 'phase'
                    ? 'bg-slate-700 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Phase (Van, Vbn, Vcn)
              </button>
              <button
                onClick={() => setThreePhaseMode('line')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  threePhaseMode === 'line'
                    ? 'bg-slate-700 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Line (Vab, Vbc, Vca)
              </button>
            </div>
          )}
        </div>

        {/* Live Coordinate readout */}
        <div className="text-[10px] font-mono text-cyan-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
          t: {(hoveredPoint ? hoveredPoint.timeMs : currentTimeMs % maxTimeMs).toFixed(1)} ms
          {' | '}
          {isThreePhase ? (
            threePhaseMode === 'phase' ? (
              <>
                van: {(hoveredPoint ? hoveredPoint.van : currentPt.van).toFixed(0)}V |{' '}
                vbn: {(hoveredPoint ? hoveredPoint.vbn : currentPt.vbn).toFixed(0)}V |{' '}
                vcn: {(hoveredPoint ? hoveredPoint.vcn : currentPt.vcn).toFixed(0)}V |{' '}
              </>
            ) : (
              <>
                vab: {(hoveredPoint ? hoveredPoint.vab : currentPt.vab).toFixed(0)}V |{' '}
                vbc: {(hoveredPoint ? hoveredPoint.vbc : currentPt.vbc).toFixed(0)}V |{' '}
                vca: {(hoveredPoint ? hoveredPoint.vca : currentPt.vca).toFixed(0)}V |{' '}
              </>
            )
          ) : (
            <>vs: {(hoveredPoint ? hoveredPoint.vs : currentPt.vs).toFixed(1)}V | </>
          )}
          vo: {(hoveredPoint ? hoveredPoint.vo : currentPt.vo).toFixed(1)}V |{' '}
          io: {(hoveredPoint ? hoveredPoint.io : currentPt.io).toFixed(2)}A
        </div>
      </div>

      {/* ================= CHANNEL 1: INPUT VOLTAGES ================= */}
      {isThreePhase ? (
        /* Three-Phase Phase Voltages or Line Voltages */
        <div className="relative bg-[#070d1d] border border-slate-800 rounded-lg p-1.5 overflow-hidden shadow-inner">
          <div className="flex items-center justify-between text-[10px] text-slate-300 mb-0.5 px-1">
            <span className="font-bold text-slate-100">
              {threePhaseMode === 'phase' ? 'AC side Phase Voltages (Star Neutral)' : 'AC side Line-to-Line Voltages (Delta)'}
            </span>
            <div className="flex items-center gap-3 font-mono font-bold text-[9px]">
              {threePhaseMode === 'phase' ? (
                <>
                  <span className="text-emerald-400">— van (Ph A)</span>
                  <span className="text-red-400">— vbn (Ph B)</span>
                  <span className="text-blue-400">— vcn (Ph C)</span>
                </>
              ) : (
                <>
                  <span className="text-yellow-400">— vab (Line AB)</span>
                  <span className="text-orange-400">— vbc (Line BC)</span>
                  <span className="text-purple-400">— vca (Line CA)</span>
                </>
              )}
            </div>
            <span className="font-mono text-slate-500">±{vScaleMax} V</span>
          </div>

          <div className="relative w-full h-[76px]">
            <svg
              viewBox={`0 0 ${width} ${graphHeight}`}
              className="w-full h-full cursor-crosshair"
              preserveAspectRatio="none"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={handleClick}
            >
              <OscilloscopeGrid width={width} height={graphHeight} />
              <line x1="0" y1={graphHeight / 2} x2={width} y2={graphHeight / 2} stroke="#334155" strokeWidth="1" strokeDasharray="2 3" />
              {threePhaseMode === 'phase' ? (
                <>
                  {/* van (Green) */}
                  <path d={pathVan} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
                  {/* vbn (Red) */}
                  <path d={pathVbn} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                  {/* vcn (Blue) */}
                  <path d={pathVcn} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                </>
              ) : (
                <>
                  {/* vab (Yellow) */}
                  <path d={pathVab} fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
                  {/* vbc (Orange) */}
                  <path d={pathVbc} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                  {/* vca (Purple) */}
                  <path d={pathVca} fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
                </>
              )}
              {/* Live Cursor */}
              <line
                x1={getX(currentTimeMs % maxTimeMs)}
                y1="0"
                x2={getX(currentTimeMs % maxTimeMs)}
                y2={graphHeight}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                className="drop-shadow-[0_0_6px_#38bdf8]"
              />
            </svg>
          </div>
        </div>
      ) : (
        /* Single-Phase Source Voltage */
        <div className="relative bg-[#070d1d] border border-slate-800 rounded-lg p-1.5 overflow-hidden shadow-inner">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5 px-1">
            <span className="font-bold text-emerald-400">AC side Voltage vs(t)</span>
            <span className="font-mono text-slate-500">±{vScaleMax} V</span>
          </div>

          <div className="relative w-full h-[76px]">
            <svg
              viewBox={`0 0 ${width} ${graphHeight}`}
              className="w-full h-full cursor-crosshair"
              preserveAspectRatio="none"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={handleClick}
            >
              <OscilloscopeGrid width={width} height={graphHeight} />
              <line x1="0" y1={graphHeight / 2} x2={width} y2={graphHeight / 2} stroke="#334155" strokeWidth="1" strokeDasharray="2 3" />
              <path d={pathVs} fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" />
              <line
                x1={getX(currentTimeMs % maxTimeMs)}
                y1="0"
                x2={getX(currentTimeMs % maxTimeMs)}
                y2={graphHeight}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                className="drop-shadow-[0_0_6px_#38bdf8]"
              />
            </svg>
          </div>
        </div>
      )}

      {/* ================= CHANNEL 2: FIRING PULSES OR AC CURRENT ================= */}
      {viewMode === 'firing-sequence' && isScr ? (
        /* Detailed Firing Pulses (T1 -> T2 -> T3 -> T4 -> T5 -> T6 sequence!) */
        <div className="relative bg-[#070d1d] border border-amber-900/40 rounded-lg p-1.5 overflow-hidden shadow-inner">
          <div className="flex items-center justify-between text-[10px] text-amber-300 mb-0.5 px-1">
            <span className="font-bold">
              Thyristor Firing Pulses (
              {isThreePhase
                ? 'Sequence: T1 → T2 → T3 → T4 → T5 → T6'
                : topology === 'semi-converter'
                ? 'Sequence: T1 (SCR), T3 (SCR)'
                : topology === 'half-wave-scr'
                ? 'Pulse: T1 (SCR)'
                : 'Sequence: (T1, T2) → (T3, T4)'}
              )
            </span>
            <span className="font-mono text-amber-400 text-[9px]">Gate Trigger Pulses (Ig)</span>
          </div>

          <div className="relative w-full h-[76px]">
            <svg
              viewBox={`0 0 ${width} ${graphHeight}`}
              className="w-full h-full cursor-crosshair"
              preserveAspectRatio="none"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={handleClick}
            >
              <OscilloscopeGrid width={width} height={graphHeight} />

              {/* Baseline */}
              <line x1="0" y1={graphHeight - 12} x2={width} y2={graphHeight - 12} stroke="#334155" strokeWidth="1" />

              {/* Pulses */}
              <path d={pathT1} fill="none" stroke="#22c55e" strokeWidth="2.5" />
              {topology !== 'semi-converter' && topology !== 'half-wave-scr' && (
                <path d={pathT2} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
              )}
              {topology !== 'half-wave-scr' && (
                <path d={pathT3} fill="none" stroke="#eab308" strokeWidth="2.5" />
              )}
              {topology !== 'semi-converter' && topology !== 'half-wave-scr' && (
                <path d={pathT4} fill="none" stroke="#f97316" strokeWidth="2.5" />
              )}
              {isThreePhase && (
                <>
                  <path d={pathT5} fill="none" stroke="#a855f7" strokeWidth="2.5" />
                  <path d={pathT6} fill="none" stroke="#ec4899" strokeWidth="2.5" />
                </>
              )}

              {/* Firing labels */}
              <g fontSize="8" fontWeight="bold" fontFamily="monospace">
                {isThreePhase ? (
                  <>
                    <text x="10" y="22" fill="#22c55e">T1 (30°+α)</text>
                    <text x="80" y="22" fill="#38bdf8">T2 (90°+α)</text>
                    <text x="150" y="22" fill="#eab308">T3 (150°+α)</text>
                    <text x="220" y="22" fill="#f97316">T4 (210°+α)</text>
                    <text x="290" y="22" fill="#a855f7">T5 (270°+α)</text>
                    <text x="360" y="22" fill="#ec4899">T6 (330°+α)</text>
                  </>
                ) : topology === 'semi-converter' ? (
                  <>
                    <text x="20" y="22" fill="#22c55e">T1 Gate Pulse (α)</text>
                    <text x="200" y="22" fill="#eab308">T3 Gate Pulse (180°+α)</text>
                    <text x="380" y="22" fill="#94a3b8">(D2 &amp; D4 are un-gated uncontrolled diodes)</text>
                  </>
                ) : topology === 'half-wave-scr' ? (
                  <text x="20" y="22" fill="#22c55e">T1 Gate Pulse (α)</text>
                ) : (
                  <>
                    <text x="20" y="22" fill="#22c55e">T1, T2 Gate Pulse (α)</text>
                    <text x="220" y="22" fill="#eab308">T3, T4 Gate Pulse (180°+α)</text>
                  </>
                )}
              </g>

              {/* Live Cursor */}
              <line
                x1={getX(currentTimeMs % maxTimeMs)}
                y1="0"
                x2={getX(currentTimeMs % maxTimeMs)}
                y2={graphHeight}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
            </svg>
          </div>
        </div>
      ) : isThreePhase ? (
        /* 3-Phase Thyristor Conduction Currents (120 deg each) */
        <div className="relative bg-[#070d1d] border border-slate-800 rounded-lg p-1.5 overflow-hidden shadow-inner">
          <div className="flex items-center justify-between text-[10px] text-slate-300 mb-0.5 px-1">
            <span className="font-bold text-slate-100">Individual Device Currents (120° Conduction)</span>
            <div className="flex items-center gap-2 font-mono font-bold text-[8px]">
              <span className="text-emerald-400">T1</span>
              <span className="text-cyan-400">T2</span>
              <span className="text-yellow-400">T3</span>
              <span className="text-orange-400">T4</span>
              <span className="text-purple-400">T5</span>
              <span className="text-pink-400">T6</span>
            </div>
            <span className="font-mono text-slate-500">0 to {iScaleMax} A</span>
          </div>

          <div className="relative w-full h-[76px]">
            <svg
              viewBox={`0 0 ${width} ${graphHeight}`}
              className="w-full h-full cursor-crosshair"
              preserveAspectRatio="none"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={handleClick}
            >
              <OscilloscopeGrid width={width} height={graphHeight} />
              <path d={pathIT1} fill="none" stroke="#22c55e" strokeWidth="1.8" />
              <path d={pathIT2} fill="none" stroke="#06b6d4" strokeWidth="1.8" />
              <path d={pathIT3} fill="none" stroke="#eab308" strokeWidth="1.8" />
              <path d={pathIT4} fill="none" stroke="#f97316" strokeWidth="1.8" />
              <path d={pathIT5} fill="none" stroke="#a855f7" strokeWidth="1.8" />
              <path d={pathIT6} fill="none" stroke="#ec4899" strokeWidth="1.8" />

              <line
                x1={getX(currentTimeMs % maxTimeMs)}
                y1="0"
                x2={getX(currentTimeMs % maxTimeMs)}
                y2={graphHeight}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
            </svg>
          </div>
        </div>
      ) : (
        /* AC Side Current is(t) */
        <div className="relative bg-[#070d1d] border border-slate-800 rounded-lg p-1.5 overflow-hidden shadow-inner">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5 px-1">
            <span className="font-bold text-blue-400">AC side Current is(t)</span>
            <span className="font-mono text-slate-500">±{iScaleMax} A</span>
          </div>

          <div className="relative w-full h-[76px]">
            <svg
              viewBox={`0 0 ${width} ${graphHeight}`}
              className="w-full h-full cursor-crosshair"
              preserveAspectRatio="none"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={handleClick}
            >
              <OscilloscopeGrid width={width} height={graphHeight} />
              <line x1="0" y1={graphHeight / 2} x2={width} y2={graphHeight / 2} stroke="#334155" strokeWidth="1" strokeDasharray="2 3" />
              <path d={pathIs} fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" />
              <line
                x1={getX(currentTimeMs % maxTimeMs)}
                y1="0"
                x2={getX(currentTimeMs % maxTimeMs)}
                y2={graphHeight}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
            </svg>
          </div>
        </div>
      )}

      {/* ================= CHANNEL 3: DC-SIDE OUTPUT VOLTAGE vo(t) ================= */}
      <div className="relative bg-[#070d1d] border border-slate-800 rounded-lg p-1.5 overflow-hidden shadow-inner">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5 px-1">
          <span className="font-bold text-emerald-400">
            DC-side Voltage vo(t) {isThreePhase ? '(6-Pulse Rectified)' : ''}
          </span>
          <span className="font-mono text-slate-500">±{vScaleMax} V</span>
        </div>

        <div className="relative w-full h-[76px]">
          <svg
            viewBox={`0 0 ${width} ${graphHeight}`}
            className="w-full h-full cursor-crosshair"
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredPoint(null)}
            onClick={handleClick}
          >
            <OscilloscopeGrid width={width} height={graphHeight} />
            <line x1="0" y1={graphHeight / 2} x2={width} y2={graphHeight / 2} stroke="#334155" strokeWidth="1" strokeDasharray="2 3" />
            <path d={pathVo} fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" />
            <line
              x1={getX(currentTimeMs % maxTimeMs)}
              y1="0"
              x2={getX(currentTimeMs % maxTimeMs)}
              y2={graphHeight}
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="3 2"
              className="drop-shadow-[0_0_6px_#38bdf8]"
            />
          </svg>
        </div>
      </div>

      {/* ================= CHANNEL 4: DC-SIDE LOAD CURRENT io(t) & i_FWD(t) ================= */}
      <div className="relative bg-[#070d1d] border border-slate-800 rounded-lg p-1.5 overflow-hidden shadow-inner">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5 px-1">
          <div className="flex items-center gap-3">
            <span className="font-bold text-blue-400">DC-side Current io(t)</span>
            {waveforms.some((p) => (p.iFwd || 0) > 0.05) && (
              <span className="font-bold text-amber-400 flex items-center gap-1 font-mono text-[9px]">
                <span className="inline-block w-2.5 h-0.5 bg-amber-400"></span>
                i_FWD(t) (Freewheel)
              </span>
            )}
          </div>
          <span className="font-mono text-slate-500">0 to {iScaleMax} A</span>
        </div>

        <div className="relative w-full h-[76px]">
          <svg
            viewBox={`0 0 ${width} ${graphHeight}`}
            className="w-full h-full cursor-crosshair"
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredPoint(null)}
            onClick={handleClick}
          >
            <OscilloscopeGrid width={width} height={graphHeight} />
            <path d={pathIo} fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" />
            {waveforms.some((p) => (p.iFwd || 0) > 0.05) && (
              <path d={pathIFwd} fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="3 2" />
            )}
            <line
              x1={getX(currentTimeMs % maxTimeMs)}
              y1="0"
              x2={getX(currentTimeMs % maxTimeMs)}
              y2={graphHeight}
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="3 2"
              className="drop-shadow-[0_0_6px_#38bdf8]"
            />
          </svg>
        </div>
      </div>

      {/* Time axis */}
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 px-1">
        <span>0.00 s</span>
        <span>0.01 s</span>
        <span>0.02 s (T)</span>
        <span>0.03 s</span>
        <span>0.04 s (2T)</span>
      </div>
    </div>
  );
};

const OscilloscopeGrid: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const vLines = [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9];
  return (
    <g opacity="0.3">
      {vLines.map((ratio, idx) => (
        <line
          key={`v-${idx}`}
          x1={width * ratio}
          y1="0"
          x2={width * ratio}
          y2={height}
          stroke="#1e293b"
          strokeWidth="1"
          strokeDasharray={ratio === 0.5 ? 'none' : '2 2'}
        />
      ))}
      <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />
    </g>
  );
};
