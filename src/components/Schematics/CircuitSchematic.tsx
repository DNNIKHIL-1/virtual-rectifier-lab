import React, { useEffect, useState } from 'react';
import {
  RectifierTopology,
  CircuitParameters,
  InstantaneousValues
} from '../../types/rectifier';
import { Zap, Clock, Info } from 'lucide-react';

interface CircuitSchematicProps {
  topology: RectifierTopology;
  params: CircuitParameters;
  instantState: InstantaneousValues;
  animateCurrentFlow: boolean;
  onSelectComponent?: (comp: 'source' | 'resistor' | 'inductor' | 'thyristor' | 'load') => void;
}

export const CircuitSchematic: React.FC<CircuitSchematicProps> = ({
  topology,
  params,
  instantState,
  animateCurrentFlow,
  onSelectComponent
}) => {
  const { conductionCycle, conductingDevices, activePathText, vs, vo, io, is } = instantState;

  // Animation phase for flowing particle dots
  const [particleOffset, setParticleOffset] = useState(0);

  useEffect(() => {
    if (!animateCurrentFlow) return;
    let animId: number;
    const animate = () => {
      setParticleOffset((prev) => (prev + 1.2) % 30);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [animateCurrentFlow]);

  return (
    <div className="relative w-full bg-[#070c1a] border border-slate-800 rounded-xl p-4 flex flex-col justify-between overflow-hidden shadow-2xl">
      {/* Background grid dots (matches Image 1) */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#38bdf8 1.2px, transparent 1.2px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* SVG Canvas for schematic */}
      <div className="relative w-full h-[380px] flex items-center justify-center">
        <svg
          viewBox="0 0 720 380"
          className="w-full h-full select-none"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Arrow marker for wire direction */}
            <marker
              id="arrow-yellow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#facc15" />
            </marker>

            {/* Glowing filter */}
            <filter id="cyan-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="green-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {topology.includes('three-phase') ? (
            <ThreePhaseBridgeSchematic
              topology={topology}
              params={params}
              instantState={instantState}
              particleOffset={particleOffset}
              animate={animateCurrentFlow}
              onSelectComponent={onSelectComponent}
            />
          ) : topology.includes('half-wave') ? (
            <HalfWaveBridgeSchematic
              topology={topology}
              params={params}
              instantState={instantState}
              particleOffset={particleOffset}
              animate={animateCurrentFlow}
              onSelectComponent={onSelectComponent}
            />
          ) : (
            <FullBridgeSchematic
              topology={topology}
              params={params}
              instantState={instantState}
              particleOffset={particleOffset}
              animate={animateCurrentFlow}
              onSelectComponent={onSelectComponent}
            />
          )}
        </svg>
      </div>

      {/* Bottom Conduction Banner */}
      <div className="mt-3 relative z-10 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs shadow-inner">
        <Clock className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
        <div className="truncate">
          <span className="font-semibold text-emerald-200">Current Conduction Path: </span>
          <span className="text-emerald-300">{activePathText}</span>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
 * Full-Bridge Schematic (Matches Image 1 & Image 2 Precisely)
 * ========================================================================= */
interface BridgeProps {
  topology: RectifierTopology;
  params: CircuitParameters;
  instantState: InstantaneousValues;
  particleOffset: number;
  animate: boolean;
  onSelectComponent?: (comp: 'source' | 'resistor' | 'inductor' | 'thyristor' | 'load') => void;
}

const FullBridgeSchematic: React.FC<BridgeProps> = ({
  topology,
  params,
  instantState,
  particleOffset,
  animate,
  onSelectComponent
}) => {
  const isSemi = topology === 'semi-converter';
  const isFullScr = topology === 'full-bridge-scr';

  const { conductionCycle, vs, vo, io } = instantState;

  const isPair1 = conductionCycle === 'positive';
  const isPair2 = conductionCycle === 'negative';
  const isFwd = conductionCycle === 'freewheeling';

  const hasCurrent = io > 0.05;

  // Strict physical conduction state per device (must carry current to be active)
  const isT1On = hasCurrent && (isSemi
    ? instantState.conductingDevices.includes('T1')
    : instantState.conductingDevices.includes(isFullScr ? 'T1' : 'D1') || (isPair1 && !isFwd));
  const isT2On = hasCurrent && (isSemi
    ? instantState.conductingDevices.includes('D2')
    : instantState.conductingDevices.includes(isFullScr ? 'T2' : 'D2') || (isPair1 && !isFwd));
  const isT3On = hasCurrent && (isSemi
    ? instantState.conductingDevices.includes('T3')
    : instantState.conductingDevices.includes(isFullScr ? 'T3' : 'D3') || (isPair2 && !isFwd));
  const isT4On = hasCurrent && (isSemi
    ? instantState.conductingDevices.includes('D4')
    : instantState.conductingDevices.includes(isFullScr ? 'T4' : 'D4') || (isPair2 && !isFwd));
  const isFwdOn = hasCurrent && isFwd;

  const activeWireColor = '#22c55e';
  const inactiveWireColor = '#1e293b';

  return (
    <g>
      {/* ===================== AC SOURCE (LEFT) ===================== */}
      <g className="cursor-pointer group" onClick={() => onSelectComponent?.('source')}>
        <circle
          cx="80"
          cy="190"
          r="26"
          fill="#0c172d"
          stroke="#0284c7"
          strokeWidth="2.5"
          className="group-hover:stroke-cyan-400 transition-colors"
        />
        {/* Sine wave */}
        <path
          d="M 66 190 Q 73 178 80 190 T 94 190"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
        />
        <text
          x="80"
          y="232"
          textAnchor="middle"
          fill="#f8fafc"
          fontSize="11"
          fontWeight="bold"
          fontFamily="system-ui"
        >
          AC Source
        </text>
        <text
          x="80"
          y="246"
          textAnchor="middle"
          fill="#38bdf8"
          fontSize="10"
          fontFamily="monospace"
        >
          vs = {vs.toFixed(1)} V
        </text>
      </g>

      {/* Wire Label: Phase A */}
      <text
        x="120"
        y="155"
        fill={(isT1On || isT4On) && hasCurrent ? '#22c55e' : '#64748b'}
        fontSize="10"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        Phase A
      </text>

      {/* Wire Label: Neutral (N) */}
      <text
        x="120"
        y="235"
        fill={(isT3On || isT2On) && hasCurrent ? '#22c55e' : '#64748b'}
        fontSize="10"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        Neutral (N)
      </text>

      {/* ===================== AC SOURCE WIRES ===================== */}
      {/* Phase A Line: from source (80,165) drops to y=190 at x=140, then enters Leg 1 junction (195,190) horizontally */}
      {/* This ensures it NEVER runs on top of the vertical leads to T1 or T4! */}
      <path
        d="M 80 165 L 140 165 L 140 190 L 195 190"
        fill="none"
        stroke={(isT1On || isT4On) && hasCurrent ? activeWireColor : inactiveWireColor}
        strokeWidth={(isT1On || isT4On) && hasCurrent ? 3 : 2}
        className={(isT1On || isT4On) && hasCurrent ? 'drop-shadow-[0_0_6px_#22c55e]' : ''}
      />
      {/* Neutral Line: from source (80,215) runs under Leg 1 at y=215, steps up to y=190 at x=260, enters Leg 2 junction (315,190) horizontally */}
      <path
        d="M 80 215 L 260 215 L 260 190 L 315 190"
        fill="none"
        stroke={(isT3On || isT2On) && hasCurrent ? activeWireColor : inactiveWireColor}
        strokeWidth={(isT3On || isT2On) && hasCurrent ? 3 : 2}
        className={(isT3On || isT2On) && hasCurrent ? 'drop-shadow-[0_0_6px_#22c55e]' : ''}
      />

      {/* ===================== DC RAILS (SEGMENTAL) ===================== */}
      {/* Top Positive Rail (+) Segment 1: from T1 (195, 90) to T3 (315, 90) - ONLY active if T1 carries current! */}
      <line
        x1="195"
        y1="90"
        x2="315"
        y2="90"
        stroke={isT1On ? activeWireColor : inactiveWireColor}
        strokeWidth={isT1On ? 3 : 2}
        className={isT1On ? 'drop-shadow-[0_0_6px_#22c55e]' : ''}
      />
      {/* Top Positive Rail (+) Segment 2: from T3 (315, 90) to FWD (435, 90) - active if T1 or T3 conducts */}
      <line
        x1="315"
        y1="90"
        x2="435"
        y2="90"
        stroke={(isT1On || isT3On) ? activeWireColor : inactiveWireColor}
        strokeWidth={(isT1On || isT3On) ? 3 : 2}
        className={(isT1On || isT3On) ? 'drop-shadow-[0_0_6px_#22c55e]' : ''}
      />
      {/* Top Positive Rail (+) Segment 3: from FWD (435, 90) to Load (560, 90) - active if any top device or FWD conducts */}
      <line
        x1="435"
        y1="90"
        x2="560"
        y2="90"
        stroke={(isT1On || isT3On || isFwdOn) ? activeWireColor : inactiveWireColor}
        strokeWidth={(isT1On || isT3On || isFwdOn) ? 3 : 2}
        className={(isT1On || isT3On || isFwdOn) ? 'drop-shadow-[0_0_6px_#22c55e]' : ''}
      />
      {/* + Vo Readout on Top Right */}
      <text
        x="575"
        y="95"
        fill="#ef4444"
        fontSize="11"
        fontWeight="bold"
        fontFamily="monospace"
      >
        + Vo ({vo >= 0 ? `+${vo.toFixed(1)}` : vo.toFixed(1)} V)
      </text>

      {/* Bottom Negative Rail (-) Segment 1: from Load (560, 290) to FWD (435, 290) */}
      <line
        x1="560"
        y1="290"
        x2="435"
        y2="290"
        stroke={(isT4On || isT2On || isFwdOn) ? activeWireColor : inactiveWireColor}
        strokeWidth={(isT4On || isT2On || isFwdOn) ? 3 : 2}
        className={(isT4On || isT2On || isFwdOn) ? 'drop-shadow-[0_0_6px_#22c55e]' : ''}
      />
      {/* Bottom Negative Rail (-) Segment 2: from FWD (435, 290) to T2/D2 (315, 290) */}
      <line
        x1="435"
        y1="290"
        x2="315"
        y2="290"
        stroke={(isT4On || isT2On) ? activeWireColor : inactiveWireColor}
        strokeWidth={(isT4On || isT2On) ? 3 : 2}
        className={(isT4On || isT2On) ? 'drop-shadow-[0_0_6px_#22c55e]' : ''}
      />
      {/* Bottom Negative Rail (-) Segment 3: from T2/D2 (315, 290) to T4/D4 (195, 290) - ONLY active if T4 conducts! */}
      <line
        x1="315"
        y1="290"
        x2="195"
        y2="290"
        stroke={isT4On ? activeWireColor : inactiveWireColor}
        strokeWidth={isT4On ? 3 : 2}
        className={isT4On ? 'drop-shadow-[0_0_6px_#22c55e]' : ''}
      />
      {/* - Vo (GND) Readout on Bottom Right */}
      <text
        x="575"
        y="295"
        fill="#38bdf8"
        fontSize="11"
        fontWeight="bold"
        fontFamily="monospace"
      >
        − Vo (GND)
      </text>

      {/* ===================== LEFT LEG (PHASE A, x=195) ===================== */}
      {/* Midpoint Junction lead at (195,190) */}
      <circle cx="195" cy="190" r="3.5" fill={(isT1On || isT4On) ? '#38bdf8' : '#334155'} />

      {/* Lead UP from (195,190) to T1 (195,155) - ONLY active if T1 is conducting! */}
      <line
        x1="195"
        y1="190"
        x2="195"
        y2="155"
        stroke={isT1On ? activeWireColor : inactiveWireColor}
        strokeWidth={isT1On ? 3 : 2}
      />
      {/* T1 Card (Top Left) */}
      <DeviceCard
        cx={195}
        cy={120}
        name={isSemi ? 'T1' : isFullScr ? 'T1' : 'D1'}
        sub={isSemi ? 'Ph A (SCR)' : isFullScr ? 'Ph A (SCR)' : 'Ph A (Top)'}
        isScr={isSemi || isFullScr}
        isOn={isT1On}
        onClick={() => onSelectComponent?.('thyristor')}
      />
      {/* Lead from T1 UP to Top Rail (y=90) */}
      <line
        x1="195"
        y1="90"
        x2="195"
        y2="100"
        stroke={isT1On ? activeWireColor : inactiveWireColor}
        strokeWidth={isT1On ? 3 : 2}
      />

      {/* Lead DOWN from (195,190) to T4/D4 (195,225) - ONLY active if T4 is conducting! */}
      <line
        x1="195"
        y1="190"
        x2="195"
        y2="225"
        stroke={isT4On ? activeWireColor : inactiveWireColor}
        strokeWidth={isT4On ? 3 : 2}
      />
      {/* T4 / D4 Card (Bottom Left: Ph A Bot) */}
      <DeviceCard
        cx={195}
        cy={260}
        name={isSemi ? 'D4' : isFullScr ? 'T4' : 'D4'}
        sub={isSemi ? 'Ph A (Diode)' : isFullScr ? 'Ph A (SCR)' : 'Ph A (Bot)'}
        isScr={isFullScr}
        isOn={isT4On}
        onClick={() => onSelectComponent?.(isSemi ? 'load' : 'thyristor')}
      />
      {/* Lead from T4/D4 DOWN to Bottom Rail (y=290) */}
      <line
        x1="195"
        y1="280"
        x2="195"
        y2="290"
        stroke={isT4On ? activeWireColor : inactiveWireColor}
        strokeWidth={isT4On ? 3 : 2}
      />

      {/* ===================== RIGHT LEG (NEUTRAL, x=315) ===================== */}
      {/* Midpoint Junction lead at (315,190) */}
      <circle cx="315" cy="190" r="3.5" fill={(isT3On || isT2On) ? '#38bdf8' : '#334155'} />

      {/* Lead UP from (315,190) to T3 (315,155) - ONLY active if T3 is conducting! */}
      <line
        x1="315"
        y1="190"
        x2="315"
        y2="155"
        stroke={isT3On ? activeWireColor : inactiveWireColor}
        strokeWidth={isT3On ? 3 : 2}
      />
      {/* T3 Card (Top Right: Neu Top) */}
      <DeviceCard
        cx={315}
        cy={120}
        name={isSemi ? 'T3' : isFullScr ? 'T3' : 'D3'}
        sub={isSemi ? 'Neu (SCR)' : isFullScr ? 'Neu (SCR)' : 'Neu (Top)'}
        isScr={isSemi || isFullScr}
        isOn={isT3On}
        onClick={() => onSelectComponent?.('thyristor')}
      />
      {/* Lead from T3 UP to Top Rail */}
      <line
        x1="315"
        y1="90"
        x2="315"
        y2="100"
        stroke={isT3On ? activeWireColor : inactiveWireColor}
        strokeWidth={isT3On ? 3 : 2}
      />

      {/* Lead DOWN from (315,190) to T2/D2 (315,225) - ONLY active if T2 is conducting! */}
      <line
        x1="315"
        y1="190"
        x2="315"
        y2="225"
        stroke={isT2On ? activeWireColor : inactiveWireColor}
        strokeWidth={isT2On ? 3 : 2}
      />
      {/* T2 / D2 Card (Bottom Right: Neu Bot) */}
      <DeviceCard
        cx={315}
        cy={260}
        name={isSemi ? 'D2' : isFullScr ? 'T2' : 'D2'}
        sub={isSemi ? 'Neu (Diode)' : isFullScr ? 'Neu (SCR)' : 'Neu (Bot)'}
        isScr={isFullScr}
        isOn={isT2On}
        onClick={() => onSelectComponent?.(isSemi ? 'load' : 'thyristor')}
      />
      {/* Lead from T2 DOWN to Bottom Rail */}
      <line
        x1="315"
        y1="280"
        x2="315"
        y2="290"
        stroke={isT2On ? activeWireColor : inactiveWireColor}
        strokeWidth={isT2On ? 3 : 2}
      />

      {/* Junction dots on rails */}
      <circle cx="195" cy="90" r="3.5" fill={isT1On ? '#38bdf8' : '#334155'} />
      <circle cx="315" cy="90" r="3.5" fill={(isT1On || isT3On) ? '#38bdf8' : '#334155'} />
      <circle cx="195" cy="290" r="3.5" fill={isT4On ? '#38bdf8' : '#334155'} />
      <circle cx="315" cy="290" r="3.5" fill={(isT4On || isT2On) ? '#38bdf8' : '#334155'} />

      {/* ===================== FREEWHEELING DIODE (MIDDLE, x=435) ===================== */}
      {params.freewheelingDiode ? (
        <g>
          <line
            x1="435"
            y1="90"
            x2="435"
            y2="160"
            stroke={isFwdOn ? activeWireColor : inactiveWireColor}
            strokeWidth={isFwdOn ? 3 : 2}
          />
          <DeviceCard
            cx={435}
            cy={190}
            name="D_FW"
            sub="Freewheel"
            isScr={false}
            isOn={isFwdOn}
          />
          <line
            x1="435"
            y1="220"
            x2="435"
            y2="290"
            stroke={isFwdOn ? activeWireColor : inactiveWireColor}
            strokeWidth={isFwdOn ? 3 : 2}
          />
          <circle cx="435" cy="90" r="3" fill={(isT1On || isT3On || isFwdOn) ? '#38bdf8' : '#334155'} />
          <circle cx="435" cy="290" r="3" fill={(isT4On || isT2On || isFwdOn) ? '#38bdf8' : '#334155'} />
        </g>
      ) : (
        /* Disconnected FWD indicator */
        <g opacity="0.35">
          <line
            x1="435"
            y1="90"
            x2="435"
            y2="170"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <polygon points="435,175 425,195 445,195" fill="none" stroke="#64748b" strokeWidth="1.5" />
          <line x1="423" y1="175" x2="447" y2="175" stroke="#64748b" strokeWidth="2" />
          <text x="455" y="190" fill="#64748b" fontSize="9" fontFamily="monospace">
            D_FW
          </text>
          <text x="435" y="215" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="sans-serif">
            DISCONNECTED
          </text>
          <line
            x1="435"
            y1="220"
            x2="435"
            y2="290"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </g>
      )}

      {/* ===================== LOAD CARD (RIGHT, x=560) ===================== */}
      {/* Wire from Top Rail into Load */}
      <line
        x1="560"
        y1="90"
        x2="560"
        y2="125"
        stroke={hasCurrent ? activeWireColor : inactiveWireColor}
        strokeWidth={hasCurrent ? 3 : 2}
      />
      {/* Wire from Load into Bottom Rail */}
      <line
        x1="560"
        y1="265"
        x2="560"
        y2="290"
        stroke={hasCurrent ? activeWireColor : inactiveWireColor}
        strokeWidth={hasCurrent ? 3 : 2}
      />
      <circle cx="560" cy="90" r="3.5" fill={hasCurrent ? '#38bdf8' : '#334155'} />
      <circle cx="560" cy="290" r="3.5" fill={hasCurrent ? '#38bdf8' : '#334155'} />

      {/* Load Container Card */}
      <g
        className="cursor-pointer group"
        onClick={() => onSelectComponent?.('load')}
      >
        <rect
          x="525"
          y="125"
          width="70"
          height="140"
          rx="12"
          fill="#0c172d"
          stroke={io > 0.05 ? '#0284c7' : '#1e293b'}
          strokeWidth="2"
          className="group-hover:stroke-cyan-400 transition-colors drop-shadow-[0_0_10px_rgba(2,132,199,0.3)]"
        />

        {/* Load Header */}
        <text
          x="560"
          y="142"
          textAnchor="middle"
          fill="#38bdf8"
          fontSize="10"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          {params.loadType} Load
        </text>

        {/* Resistor Graphic Symbol */}
        <path
          d="M 560 148 L 565 152 L 555 158 L 565 164 L 555 170 L 560 174"
          fill="none"
          stroke={io > 0.05 ? '#facc15' : '#94a3b8'}
          strokeWidth="2.5"
        />
        <text
          x="560"
          y="185"
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize="9"
          fontFamily="monospace"
        >
          R = {params.resistance} Ω
        </text>

        {/* Inductor Graphic Symbol (if RL / RLE) */}
        {params.loadType !== 'R' ? (
          <>
            <path
              d="M 560 190 
                 C 568 190, 568 198, 560 200
                 C 568 200, 568 208, 560 210
                 C 568 210, 568 218, 560 220"
              fill="none"
              stroke={io > 0.05 ? '#38bdf8' : '#94a3b8'}
              strokeWidth="2.5"
            />
            <text
              x="560"
              y="232"
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="9"
              fontFamily="monospace"
            >
              L = {params.inductance} mH
            </text>
          </>
        ) : null}

        {/* Battery EMF (if RLE) */}
        {params.loadType === 'RLE' && (
          <text
            x="560"
            y="245"
            textAnchor="middle"
            fill="#ef4444"
            fontSize="9"
            fontWeight="bold"
          >
            E = {params.backEmf}V
          </text>
        )}

        {/* Live Output Current Readout Pill */}
        <g transform="translate(515, 275)">
          <rect
            x="0"
            y="0"
            width="90"
            height="22"
            rx="11"
            fill="#081e3a"
            stroke="#0284c7"
            strokeWidth="1.5"
            className="drop-shadow-[0_0_8px_#0284c7]"
          />
          <text
            x="45"
            y="15"
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            i = +{io.toFixed(2)}A ▶
          </text>
        </g>
      </g>

      {/* ===================== GLOWING PARTICLES & DIRECTION ARROWS ===================== */}
      {/* 1. Mode 1: Positive Half Cycle (T1 and T2 conduct) */}
      {animate && isT1On && isT2On && (
        <g>
          {/* Phase A line: Out of source -> into Leg 1 junction */}
          <FlowingDots path="M 80 165 L 140 165 L 140 190 L 195 190" offset={particleOffset} />
          <polygon points="110,162 118,165 110,168" fill="#facc15" />

          {/* Up through T1 to top rail */}
          <FlowingDots path="M 195 190 L 195 90" offset={particleOffset} />
          <polygon points="191,150 195,142 199,150" fill="#facc15" />

          {/* Top rail: RIGHT from T1 to load */}
          <FlowingDots path="M 195 90 L 560 90 L 560 125" offset={particleOffset} />
          <polygon points="360,87 368,90 360,93" fill="#facc15" />
          <polygon points="490,87 498,90 490,93" fill="#facc15" />

          {/* Down through load */}
          <FlowingDots path="M 560 125 L 560 265" offset={particleOffset} />
          <polygon points="557,140 560,146 563,140" fill="#facc15" />
          <polygon points="557,250 560,256 563,250" fill="#facc15" />

          {/* Bottom rail: LEFT from load to T2 */}
          <FlowingDots path="M 560 290 L 315 290" offset={particleOffset} />
          <polygon points="490,293 482,290 490,287" fill="#facc15" />
          <polygon points="380,293 372,290 380,287" fill="#facc15" />

          {/* Up through T2 to Leg 2 junction */}
          <FlowingDots path="M 315 290 L 315 190" offset={particleOffset} />
          <polygon points="311,250 315,242 319,250" fill="#facc15" />

          {/* Neutral line: LEFT back into AC Source */}
          <FlowingDots path="M 315 190 L 260 190 L 260 215 L 80 215" offset={particleOffset} />
          <polygon points="160,218 152,215 160,212" fill="#facc15" />
        </g>
      )}

      {/* 2. Mode 2: Negative Half Cycle (T3 and T4 conduct) */}
      {animate && isT3On && isT4On && (
        <g>
          {/* Neutral line: Out of source -> into Leg 2 junction */}
          <FlowingDots path="M 80 215 L 260 215 L 260 190 L 315 190" offset={particleOffset} />
          <polygon points="150,212 158,215 150,218" fill="#facc15" />

          {/* Up through T3 to top rail */}
          <FlowingDots path="M 315 190 L 315 90" offset={particleOffset} />
          <polygon points="311,150 315,142 319,150" fill="#facc15" />

          {/* Top rail: RIGHT from T3 (315) to load */}
          <FlowingDots path="M 315 90 L 560 90 L 560 125" offset={particleOffset} />
          <polygon points="380,87 388,90 380,93" fill="#facc15" />
          <polygon points="490,87 498,90 490,93" fill="#facc15" />

          {/* Down through load */}
          <FlowingDots path="M 560 125 L 560 265" offset={particleOffset} />
          <polygon points="557,140 560,146 563,140" fill="#facc15" />
          <polygon points="557,250 560,256 563,250" fill="#facc15" />

          {/* Bottom rail: LEFT all the way to T4 (195) */}
          <FlowingDots path="M 560 290 L 195 290" offset={particleOffset} />
          <polygon points="490,293 482,290 490,287" fill="#facc15" />
          <polygon points="380,293 372,290 380,287" fill="#facc15" />
          <polygon points="260,293 252,290 260,287" fill="#facc15" />

          {/* Up through T4 to Leg 1 junction */}
          <FlowingDots path="M 195 290 L 195 190" offset={particleOffset} />
          <polygon points="191,250 195,242 199,250" fill="#facc15" />

          {/* Phase A line: LEFT back into AC Source */}
          <FlowingDots path="M 195 190 L 140 190 L 140 165 L 80 165" offset={particleOffset} />
          <polygon points="118,168 110,165 118,162" fill="#facc15" />
        </g>
      )}

      {/* 3. Freewheeling Mode */}
      {animate && isFwdOn && (
        <g>
          {isSemi ? (
            /* Semi-converter natural freewheeling through bridge leg */
            isT1On && isT4On ? (
              /* Phase A leg: D4 (bottom) -> T1 (top) -> Load */
              <>
                <FlowingDots path="M 560 125 L 560 265" offset={particleOffset} />
                <polygon points="557,170 560,176 563,170" fill="#facc15" />
                <FlowingDots path="M 560 290 L 195 290 L 195 90 L 560 90 L 560 125" offset={particleOffset} />
                <polygon points="380,293 372,290 380,287" fill="#facc15" />
                <polygon points="191,150 195,142 199,150" fill="#facc15" />
                <polygon points="380,87 388,90 380,93" fill="#facc15" />
              </>
            ) : (
              /* Neutral leg: D2 (bottom) -> T3 (top) -> Load */
              <>
                <FlowingDots path="M 560 125 L 560 265" offset={particleOffset} />
                <polygon points="557,170 560,176 563,170" fill="#facc15" />
                <FlowingDots path="M 560 290 L 315 290 L 315 90 L 560 90 L 560 125" offset={particleOffset} />
                <polygon points="440,293 432,290 440,287" fill="#facc15" />
                <polygon points="311,150 315,142 319,150" fill="#facc15" />
                <polygon points="440,87 448,90 440,93" fill="#facc15" />
              </>
            )
          ) : (
            /* External Freewheeling Diode branch */
            <>
              {/* Down through load */}
              <FlowingDots path="M 560 125 L 560 265" offset={particleOffset} />
              <polygon points="557,170 560,176 563,170" fill="#facc15" />

              {/* Bottom rail: LEFT from load to FWD */}
              <FlowingDots path="M 560 290 L 435 290" offset={particleOffset} />
              <polygon points="490,293 482,290 490,287" fill="#facc15" />

              {/* Up through FWD */}
              <FlowingDots path="M 435 290 L 435 90" offset={particleOffset} />
              <polygon points="431,160 435,152 439,160" fill="#facc15" />

              {/* Top rail: RIGHT from FWD to load */}
              <FlowingDots path="M 435 90 L 560 90 L 560 125" offset={particleOffset} />
              <polygon points="490,87 498,90 490,93" fill="#facc15" />
            </>
          )}
        </g>
      )}
    </g>
  );
};

/* =========================================================================
 * Flowing Dots (Cyan Beads Moving Along Wires, Matching Image 1)
 * ========================================================================= */
const FlowingDots: React.FC<{ path: string; offset: number }> = ({ path, offset }) => {
  return (
    <path
      d={path}
      fill="none"
      stroke="#38bdf8"
      strokeWidth="4"
      strokeLinecap="round"
      strokeDasharray="2 20"
      strokeDashoffset={-offset}
      filter="url(#cyan-glow)"
    />
  );
};

/* =========================================================================
 * Device Card (Matches the Rounded Card in Image 1)
 * ========================================================================= */
interface DeviceCardProps {
  cx: number;
  cy: number;
  name: string;
  sub: string;
  isScr: boolean;
  isOn: boolean;
  onClick?: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  cx,
  cy,
  name,
  sub,
  isScr,
  isOn,
  onClick
}) => {
  return (
    <g
      transform={`translate(${cx - 24}, ${cy - 28})`}
      className="cursor-pointer group"
      onClick={onClick}
    >
      {/* Outer Card Background */}
      <rect
        x="0"
        y="0"
        width="48"
        height="56"
        rx="10"
        fill={isOn ? '#06281e' : '#0c172d'}
        stroke={isOn ? '#10b981' : '#1e293b'}
        strokeWidth="2"
        className={
          isOn
            ? 'drop-shadow-[0_0_12px_rgba(16,185,129,0.6)] transition-all'
            : 'group-hover:stroke-slate-600 transition-colors'
        }
      />

      {/* Device Name (e.g. T1, T3) */}
      <text
        x="12"
        y="14"
        fill={isOn ? '#6ee7b7' : '#94a3b8'}
        fontSize="10"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {name}
      </text>

      {/* Subtitle (e.g. Ph A (Top)) */}
      <text
        x="24"
        y="23"
        textAnchor="middle"
        fill={isOn ? '#34d399' : '#64748b'}
        fontSize="7"
        fontFamily="sans-serif"
      >
        {sub}
      </text>

      {/* Diode/SCR Triangle Symbol (Pointing UP) */}
      <polygon
        points="24,28 15,41 33,41"
        fill={isOn ? '#10b981' : '#1e293b'}
        stroke={isOn ? '#34d399' : '#64748b'}
        strokeWidth="1.8"
      />
      {/* Cathode bar */}
      <line
        x1="13"
        y1="28"
        x2="35"
        y2="28"
        stroke={isOn ? '#34d399' : '#64748b'}
        strokeWidth="2"
      />

      {/* SCR Gate Terminal (if SCR) */}
      {isScr && (
        <path
          d="M 19 37 L 10 44"
          fill="none"
          stroke={isOn ? '#f59e0b' : '#64748b'}
          strokeWidth="1.8"
        />
      )}

      {/* State Badge: ON / OFF */}
      <text
        x="24"
        y="50"
        textAnchor="middle"
        fill={isOn ? '#10b981' : '#64748b'}
        fontSize="8"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {isOn ? 'ON' : 'OFF'}
      </text>
    </g>
  );
};

/* =========================================================================
 * Half-Wave Schematic
 * ========================================================================= */
const HalfWaveBridgeSchematic: React.FC<BridgeProps> = ({
  topology,
  params,
  instantState,
  particleOffset,
  animate,
  onSelectComponent
}) => {
  const isScr = topology === 'half-wave-scr';
  const label = isScr ? 'T1' : 'D1';
  const hasCurrent = instantState.io > 0.05;
  const isD1On = hasCurrent && instantState.conductionCycle === 'positive';
  const isFwdOn = hasCurrent && instantState.conductionCycle === 'freewheeling';

  const activeColor = '#22c55e';
  const inactiveColor = '#1e293b';

  return (
    <g>
      {/* Source */}
      <g className="cursor-pointer group" onClick={() => onSelectComponent?.('source')}>
        <circle cx="80" cy="190" r="26" fill="#0c172d" stroke="#0284c7" strokeWidth="2.5" />
        <path d="M 66 190 Q 73 178 80 190 T 94 190" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
        <text x="80" y="232" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="bold">
          AC Source
        </text>
        <text x="80" y="246" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">
          vs = {instantState.vs.toFixed(1)} V
        </text>
      </g>

      {/* Top wire from source (80,165) directly into D1/T1 anode at (260,155) */}
      <path
        d="M 80 165 L 260 165 L 260 155"
        fill="none"
        stroke={isD1On ? activeColor : inactiveColor}
        strokeWidth={isD1On ? 3 : 2}
      />
      <DeviceCard
        cx={260}
        cy={120}
        name={label}
        sub="Main Rectifier"
        isScr={isScr}
        isOn={isD1On}
        onClick={() => onSelectComponent?.('thyristor')}
      />
      {/* Lead from D1/T1 UP to top rail */}
      <line x1="260" y1="90" x2="260" y2="100" stroke={isD1On ? activeColor : inactiveColor} strokeWidth={isD1On ? 3 : 2} />

      {/* Top rail (Segmental): from D1 (260) to FWD (410) */}
      <line
        x1="260"
        y1="90"
        x2="410"
        y2="90"
        stroke={isD1On ? activeColor : inactiveColor}
        strokeWidth={isD1On ? 3 : 2}
      />
      {/* Top rail: from FWD (410) to Load (560) */}
      <line
        x1="410"
        y1="90"
        x2="560"
        y2="90"
        stroke={(isD1On || isFwdOn) ? activeColor : inactiveColor}
        strokeWidth={(isD1On || isFwdOn) ? 3 : 2}
      />

      {/* Bottom return wire: from Load (560) to FWD (410) */}
      <line
        x1="560"
        y1="290"
        x2="410"
        y2="290"
        stroke={(isD1On || isFwdOn) ? activeColor : inactiveColor}
        strokeWidth={(isD1On || isFwdOn) ? 3 : 2}
      />
      {/* Bottom return wire: from FWD (410) back into AC source */}
      <path
        d="M 410 290 L 80 290 L 80 215"
        fill="none"
        stroke={isD1On ? activeColor : inactiveColor}
        strokeWidth={isD1On ? 3 : 2}
      />

      {/* Load Card */}
      <line x1="560" y1="90" x2="560" y2="125" stroke={hasCurrent ? activeColor : inactiveColor} strokeWidth={hasCurrent ? 3 : 2} />
      <line x1="560" y1="265" x2="560" y2="290" stroke={hasCurrent ? activeColor : inactiveColor} strokeWidth={hasCurrent ? 3 : 2} />
      <circle cx="560" cy="90" r="3.5" fill={hasCurrent ? '#38bdf8' : '#334155'} />
      <circle cx="560" cy="290" r="3.5" fill={hasCurrent ? '#38bdf8' : '#334155'} />

      <g className="cursor-pointer group" onClick={() => onSelectComponent?.('load')}>
        <rect x="525" y="125" width="70" height="140" rx="12" fill="#0c172d" stroke="#0284c7" strokeWidth="2" />
        <text x="560" y="142" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">
          {params.loadType} Load
        </text>
        <path d="M 560 150 L 565 155 L 555 162 L 565 169 L 555 176 L 560 180" fill="none" stroke="#facc15" strokeWidth="2.5" />
        <text x="560" y="195" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontFamily="monospace">
          R = {params.resistance} Ω
        </text>
        {params.loadType !== 'R' && (
          <text x="560" y="225" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontFamily="monospace">
            L = {params.inductance} mH
          </text>
        )}
      </g>

      {/* Freewheeling Diode branch */}
      {params.freewheelingDiode ? (
        <g>
          <line x1="410" y1="90" x2="410" y2="160" stroke={isFwdOn ? activeColor : inactiveColor} strokeWidth={2} />
          <DeviceCard cx={410} cy={190} name="D_FW" sub="Freewheel" isScr={false} isOn={isFwdOn} />
          <line x1="410" y1="220" x2="410" y2="290" stroke={isFwdOn ? activeColor : inactiveColor} strokeWidth={2} />
          <circle cx="410" cy="90" r="3" fill={(isD1On || isFwdOn) ? '#38bdf8' : '#334155'} />
          <circle cx="410" cy="290" r="3" fill={(isD1On || isFwdOn) ? '#38bdf8' : '#334155'} />
        </g>
      ) : (
        /* Disconnected FWD indicator */
        <g opacity="0.35">
          <line x1="410" y1="90" x2="410" y2="170" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 4" />
          <polygon points="410,175 400,195 420,195" fill="none" stroke="#64748b" strokeWidth="1.5" />
          <line x1="398" y1="175" x2="422" y2="175" stroke="#64748b" strokeWidth="2" />
          <text x="430" y="190" fill="#64748b" fontSize="9" fontFamily="monospace">D_FW</text>
          <text x="410" y="215" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="sans-serif">DISCONNECTED</text>
          <line x1="410" y1="220" x2="410" y2="290" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 4" />
        </g>
      )}

      {/* Flowing Dots */}
      {animate && isD1On && (
        <g>
          <FlowingDots path="M 80 165 L 260 165 L 260 90 L 560 90 L 560 265 M 560 290 L 80 290 L 80 215" offset={particleOffset} />
          <polygon points="180,162 188,165 180,168" fill="#facc15" />
          <polygon points="400,87 408,90 400,93" fill="#facc15" />
          <polygon points="340,293 332,290 340,287" fill="#facc15" />
        </g>
      )}
      {animate && isFwdOn && (
        <g>
          <FlowingDots path="M 560 125 L 560 265 M 560 290 L 410 290 L 410 90 L 560 90 L 560 125" offset={particleOffset} />
          <polygon points="410,160 410,152 410,160" fill="#facc15" />
          <polygon points="490,87 498,90 490,93" fill="#facc15" />
          <polygon points="490,293 482,290 490,287" fill="#facc15" />
        </g>
      )}
    </g>
  );
};

/* =========================================================================
 * Three-Phase Schematic (Slides 18-21 & 30-33)
 * Sequence: T1 -> T2 -> T3 -> T4 -> T5 -> T6
 * ========================================================================= */
const ThreePhaseBridgeSchematic: React.FC<BridgeProps> = ({
  topology,
  params,
  instantState,
  particleOffset,
  animate,
  onSelectComponent
}) => {
  const isScr = topology === 'three-phase-scr';
  const prefix = isScr ? 'T' : 'D';

  const hasCurrent = instantState.io > 0.05;
  const isDevOn = (num: number) => hasCurrent && instantState.conductingDevices.includes(`${prefix}${num}`);
  const isFwdOn = hasCurrent && (instantState.conductionCycle === 'freewheeling' || instantState.conductingDevices.includes('FWD'));

  const activeColor = '#22c55e';
  const inactiveColor = '#1e293b';

  return (
    <g>
      {/* 3 AC Phase Sources (Neutral-referenced) */}
      <g transform="translate(45, 140)">
        <circle cx="20" cy="30" r="14" fill="#0c172d" stroke="#22c55e" strokeWidth="2" />
        <text x="20" y="34" textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="bold">
          Va
        </text>
        <circle cx="20" cy="50" r="14" fill="#0c172d" stroke="#ef4444" strokeWidth="2" />
        <text x="20" y="54" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold">
          Vb
        </text>
        <circle cx="20" cy="70" r="14" fill="#0c172d" stroke="#3b82f6" strokeWidth="2" />
        <text x="20" y="74" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="bold">
          Vc
        </text>
      </g>

      {/* Horizontal Phase Bus Lines directly into the leg midpoint nodes:
          Phase A: from Va terminal (79, 170) to Leg A junction (175, 170)
          Phase B: from Vb terminal (79, 190) to Leg B junction (275, 190)
          Phase C: from Vc terminal (79, 210) to Leg C junction (375, 210)
          This gives ZERO vertical overlap on device legs!
      */}
      <line
        x1="79"
        y1="170"
        x2="175"
        y2="170"
        stroke={(isDevOn(1) || isDevOn(4)) ? activeColor : inactiveColor}
        strokeWidth="2.5"
      />
      <line
        x1="79"
        y1="190"
        x2="275"
        y2="190"
        stroke={(isDevOn(3) || isDevOn(6)) ? activeColor : inactiveColor}
        strokeWidth="2.5"
      />
      <line
        x1="79"
        y1="210"
        x2="375"
        y2="210"
        stroke={(isDevOn(5) || isDevOn(2)) ? activeColor : inactiveColor}
        strokeWidth="2.5"
      />

      {/* 3 Bridge Legs:
          Leg A (x=175): T1 (top, y=90..170), T4 (bot, y=170..290)
          Leg B (x=275): T3 (top, y=90..190), T6 (bot, y=190..290)
          Leg C (x=375): T5 (top, y=90..210), T2 (bot, y=210..290)
      */}
      {[
        { x: 175, p: 'A', tTop: 1, tBot: 4, yMid: 170 },
        { x: 275, p: 'B', tTop: 3, tBot: 6, yMid: 190 },
        { x: 375, p: 'C', tTop: 5, tBot: 2, yMid: 210 }
      ].map((leg) => {
        const topOn = isDevOn(leg.tTop);
        const botOn = isDevOn(leg.tBot);

        return (
          <g key={leg.x}>
            {/* Top lead: from top rail (y=90) to T1/T3/T5 top terminal */}
            <line x1={leg.x} y1="90" x2={leg.x} y2="100" stroke={topOn ? activeColor : inactiveColor} strokeWidth="2.5" />

            {/* Top Device Card (cy=120) */}
            <DeviceCard
              cx={leg.x}
              cy={120}
              name={`${prefix}${leg.tTop}`}
              sub={`Ph ${leg.p}`}
              isScr={isScr}
              isOn={topOn}
              onClick={() => onSelectComponent?.('thyristor')}
            />

            {/* Lead from bottom of top device (y=155) to midpoint junction (leg.yMid) */}
            <line x1={leg.x} y1="155" x2={leg.x} y2={leg.yMid} stroke={topOn ? activeColor : inactiveColor} strokeWidth="2.5" />

            {/* Midpoint Junction node */}
            <circle cx={leg.x} cy={leg.yMid} r="3.5" fill={(topOn || botOn) ? '#38bdf8' : '#334155'} />

            {/* Lead from midpoint junction (leg.yMid) to top of bottom device (y=225) */}
            <line x1={leg.x} y1={leg.yMid} x2={leg.x} y2="225" stroke={botOn ? activeColor : inactiveColor} strokeWidth="2.5" />

            {/* Bottom Device Card (cy=260) */}
            <DeviceCard
              cx={leg.x}
              cy={260}
              name={`${prefix}${leg.tBot}`}
              sub={`Ph ${leg.p}`}
              isScr={isScr}
              isOn={botOn}
              onClick={() => onSelectComponent?.('thyristor')}
            />

            {/* Bottom lead: from bottom device terminal (y=280) to bottom rail (y=290) */}
            <line x1={leg.x} y1="280" x2={leg.x} y2="290" stroke={botOn ? activeColor : inactiveColor} strokeWidth="2.5" />
          </g>
        );
      })}

      {/* ===================== DC RAILS (SEGMENTAL) ===================== */}
      {/* Top DC Rail (y=90) */}
      {/* Segment 1: from Leg A (175, 90) to Leg B (275, 90) - ONLY active if T1 carries current! */}
      <line
        x1="175"
        y1="90"
        x2="275"
        y2="90"
        stroke={isDevOn(1) ? activeColor : inactiveColor}
        strokeWidth="3"
        className={isDevOn(1) ? 'drop-shadow-[0_0_6px_#22c55e]' : ''}
      />
      {/* Segment 2: from Leg B (275, 90) to Leg C (375, 90) - active if T1 or T3 conducts */}
      <line
        x1="275"
        y1="90"
        x2="375"
        y2="90"
        stroke={(isDevOn(1) || isDevOn(3)) ? activeColor : inactiveColor}
        strokeWidth="3"
        className={(isDevOn(1) || isDevOn(3)) ? 'drop-shadow-[0_0_6px_#22c55e]' : ''}
      />
      {/* Segment 3: from Leg C (375, 90) to FWD (455, 90) - active if T1, T3, or T5 conducts */}
      <line
        x1="375"
        y1="90"
        x2="455"
        y2="90"
        stroke={(isDevOn(1) || isDevOn(3) || isDevOn(5)) ? activeColor : inactiveColor}
        strokeWidth="3"
        className={(isDevOn(1) || isDevOn(3) || isDevOn(5)) ? 'drop-shadow-[0_0_6px_#22c55e]' : ''}
      />
      {/* Segment 4: from FWD (455, 90) to Load (560, 90) - active if bridge or FWD conducts */}
      <line
        x1="455"
        y1="90"
        x2="560"
        y2="90"
        stroke={(isDevOn(1) || isDevOn(3) || isDevOn(5) || isFwdOn) ? activeColor : inactiveColor}
        strokeWidth="3"
        className={(isDevOn(1) || isDevOn(3) || isDevOn(5) || isFwdOn) ? 'drop-shadow-[0_0_6px_#22c55e]' : ''}
      />

      <text x="575" y="95" fill="#ef4444" fontSize="11" fontWeight="bold" fontFamily="monospace">
        + Vo ({instantState.vo.toFixed(1)} V)
      </text>

      {/* Bottom DC Rail (y=290) */}
      {/* Segment 4: from Load (560, 290) to FWD (455, 290) */}
      <line
        x1="560"
        y1="290"
        x2="455"
        y2="290"
        stroke={(isDevOn(4) || isDevOn(6) || isDevOn(2) || isFwdOn) ? activeColor : inactiveColor}
        strokeWidth="3"
        className={(isDevOn(4) || isDevOn(6) || isDevOn(2) || isFwdOn) ? 'drop-shadow-[0_0_6px_#22c55e]' : ''}
      />
      {/* Segment 3: from FWD (455, 290) to Leg C (375, 290) */}
      <line
        x1="455"
        y1="290"
        x2="375"
        y2="290"
        stroke={(isDevOn(4) || isDevOn(6) || isDevOn(2)) ? activeColor : inactiveColor}
        strokeWidth="3"
        className={(isDevOn(4) || isDevOn(6) || isDevOn(2)) ? 'drop-shadow-[0_0_6px_#22c55e]' : ''}
      />
      {/* Segment 2: from Leg C (375, 290) to Leg B (275, 290) */}
      <line
        x1="375"
        y1="290"
        x2="275"
        y2="290"
        stroke={(isDevOn(4) || isDevOn(6)) ? activeColor : inactiveColor}
        strokeWidth="3"
        className={(isDevOn(4) || isDevOn(6)) ? 'drop-shadow-[0_0_6px_#22c55e]' : ''}
      />
      {/* Segment 1: from Leg B (275, 290) to Leg A (175, 290) - ONLY active if T4 carries current! */}
      <line
        x1="275"
        y1="290"
        x2="175"
        y2="290"
        stroke={isDevOn(4) ? activeColor : inactiveColor}
        strokeWidth="3"
        className={isDevOn(4) ? 'drop-shadow-[0_0_6px_#22c55e]' : ''}
      />

      <text x="575" y="295" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">
        − Vo (GND)
      </text>

      {/* Rail Junction Dots */}
      <circle cx="175" cy="90" r="3.5" fill={isDevOn(1) ? '#38bdf8' : '#334155'} />
      <circle cx="275" cy="90" r="3.5" fill={(isDevOn(1) || isDevOn(3)) ? '#38bdf8' : '#334155'} />
      <circle cx="375" cy="90" r="3.5" fill={(isDevOn(1) || isDevOn(3) || isDevOn(5)) ? '#38bdf8' : '#334155'} />

      <circle cx="175" cy="290" r="3.5" fill={isDevOn(4) ? '#38bdf8' : '#334155'} />
      <circle cx="275" cy="290" r="3.5" fill={(isDevOn(4) || isDevOn(6)) ? '#38bdf8' : '#334155'} />
      <circle cx="375" cy="290" r="3.5" fill={(isDevOn(4) || isDevOn(6) || isDevOn(2)) ? '#38bdf8' : '#334155'} />

      {/* ===================== FREEWHEELING DIODE (x=455) ===================== */}
      {params.freewheelingDiode ? (
        <g>
          <line
            x1="455"
            y1="90"
            x2="455"
            y2="160"
            stroke={isFwdOn ? activeColor : inactiveColor}
            strokeWidth={isFwdOn ? 3 : 2}
          />
          <DeviceCard
            cx={455}
            cy={190}
            name="D_FW"
            sub="Freewheel"
            isScr={false}
            isOn={isFwdOn}
          />
          <line
            x1="455"
            y1="220"
            x2="455"
            y2="290"
            stroke={isFwdOn ? activeColor : inactiveColor}
            strokeWidth={isFwdOn ? 3 : 2}
          />
          <circle cx="455" cy="90" r="3.5" fill={(isDevOn(1) || isDevOn(3) || isDevOn(5) || isFwdOn) ? '#38bdf8' : '#334155'} />
          <circle cx="455" cy="290" r="3.5" fill={(isDevOn(4) || isDevOn(6) || isDevOn(2) || isFwdOn) ? '#38bdf8' : '#334155'} />
        </g>
      ) : (
        /* Disconnected FWD indicator */
        <g opacity="0.35">
          <line
            x1="455"
            y1="90"
            x2="455"
            y2="170"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <polygon points="455,175 445,195 465,195" fill="none" stroke="#64748b" strokeWidth="1.5" />
          <line x1="443" y1="175" x2="467" y2="175" stroke="#64748b" strokeWidth="2" />
          <text x="475" y="190" fill="#64748b" fontSize="9" fontFamily="monospace">
            D_FW
          </text>
          <text x="455" y="215" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="sans-serif">
            DISCONNECTED
          </text>
          <line
            x1="455"
            y1="220"
            x2="455"
            y2="290"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </g>
      )}

      {/* Load Container */}
      <line x1="560" y1="90" x2="560" y2="125" stroke={hasCurrent ? activeColor : inactiveColor} strokeWidth="3" />
      <line x1="560" y1="265" x2="560" y2="290" stroke={hasCurrent ? activeColor : inactiveColor} strokeWidth="3" />
      <circle cx="560" cy="90" r="3.5" fill={hasCurrent ? '#38bdf8' : '#334155'} />
      <circle cx="560" cy="290" r="3.5" fill={hasCurrent ? '#38bdf8' : '#334155'} />

      <g className="cursor-pointer group" onClick={() => onSelectComponent?.('load')}>
        <rect x="525" y="125" width="70" height="140" rx="12" fill="#0c172d" stroke="#0284c7" strokeWidth="2" />
        <text x="560" y="142" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">
          3-Phase Load
        </text>
        <path d="M 560 150 L 565 155 L 555 162 L 565 169 L 555 176 L 560 180" fill="none" stroke="#facc15" strokeWidth="2.5" />
        <text x="560" y="195" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontFamily="monospace">
          R = {params.resistance} Ω
        </text>
        {params.loadType !== 'R' && (
          <text x="560" y="225" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontFamily="monospace">
            L = {params.inductance} mH
          </text>
        )}
        <g transform="translate(515, 275)">
          <rect x="0" y="0" width="90" height="22" rx="11" fill="#081e3a" stroke="#0284c7" strokeWidth="1.5" />
          <text x="45" y="15" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">
            i = +{instantState.io.toFixed(2)}A ▶
          </text>
        </g>
      </g>

      {/* Dynamic Flowing Particles on Rails & Load following exact phase loop */}
      {animate && hasCurrent && (
        <g>
          {/* Top outgoing phase path */}
          {isDevOn(1) && (
            <FlowingDots path="M 79 170 L 175 170 L 175 90 L 560 90 L 560 265" offset={particleOffset} />
          )}
          {isDevOn(3) && (
            <FlowingDots path="M 79 190 L 275 190 L 275 90 L 560 90 L 560 265" offset={particleOffset} />
          )}
          {isDevOn(5) && (
            <FlowingDots path="M 79 210 L 375 210 L 375 90 L 560 90 L 560 265" offset={particleOffset} />
          )}

          {/* Bottom return phase path */}
          {isDevOn(4) && (
            <FlowingDots path="M 560 290 L 175 290 L 175 170 L 79 170" offset={particleOffset} />
          )}
          {isDevOn(6) && (
            <FlowingDots path="M 560 290 L 275 290 L 275 190 L 79 190" offset={particleOffset} />
          )}
          {isDevOn(2) && (
            <FlowingDots path="M 560 290 L 375 290 L 375 210 L 79 210" offset={particleOffset} />
          )}

          {/* Freewheeling Loop Flow */}
          {isFwdOn && (
            <g>
              <FlowingDots path="M 560 125 L 560 265 M 560 290 L 455 290 L 455 90 L 560 90 L 560 125" offset={particleOffset} />
              <polygon points="455,160 455,152 455,160" fill="#facc15" />
              <polygon points="505,87 513,90 505,93" fill="#facc15" />
              <polygon points="513,293 505,290 513,287" fill="#facc15" />
            </g>
          )}

          {/* Flow Direction Arrow indicators - only on active rail segments */}
          {(isDevOn(1) || isDevOn(3) || isDevOn(5)) && (
            <polygon points="460,87 468,90 460,93" fill="#facc15" />
          )}
          <polygon points="557,200 560,206 563,200" fill="#facc15" />
          {(isDevOn(4) || isDevOn(6) || isDevOn(2)) && (
            <polygon points="460,293 452,290 460,287" fill="#facc15" />
          )}
          {(isDevOn(4) || isDevOn(6)) && (
            <polygon points="325,293 317,290 325,287" fill="#facc15" />
          )}
          {isDevOn(4) && (
            <polygon points="225,293 217,290 225,287" fill="#facc15" />
          )}
        </g>
      )}
    </g>
  );
};
