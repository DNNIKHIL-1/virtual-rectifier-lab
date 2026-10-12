import React from 'react';
import {
  RectifierTopology,
  CircuitParameters,
  LoadType
} from '../types/rectifier';
import {
  Zap,
  Activity,
  Layers,
  Info,
  Sliders,
  Settings2,
  BatteryCharging
} from 'lucide-react';

interface SidebarProps {
  currentTopology: RectifierTopology;
  onSelectTopology: (t: RectifierTopology) => void;
  params: CircuitParameters;
  setParams: React.Dispatch<React.SetStateAction<CircuitParameters>>;
  onOpenSourceModal: () => void;
  onOpenDisplayModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTopology,
  onSelectTopology,
  params,
  setParams,
  onOpenSourceModal,
  onOpenDisplayModal
}) => {
  const singlePhaseTopologies: {
    id: RectifierTopology;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'half-wave-diode',
      title: 'Half-Wave Rectifier',
      subtitle: 'Diode (Slides 2-12)',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12h5" />
          <polygon points="9,6 16,12 9,18" fill="currentColor" opacity="0.3" stroke="currentColor" />
          <line x1="16" y1="6" x2="16" y2="18" />
          <path d="M16 12h4" />
        </svg>
      )
    },
    {
      id: 'full-bridge-diode',
      title: 'Full-Bridge Rectifier',
      subtitle: 'Diode Bridge (Slides 13-17)',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="5" width="14" height="14" rx="2" strokeDasharray="3 3" />
          <polygon points="9,10 12,8 15,10" fill="currentColor" opacity="0.4" stroke="currentColor" />
          <polygon points="9,14 12,16 15,14" fill="currentColor" opacity="0.4" stroke="currentColor" />
        </svg>
      )
    },
    {
      id: 'half-wave-scr',
      title: 'Half-Wave Controlled',
      subtitle: 'SCR / Thyristor (Slides 22-24)',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12h5" />
          <polygon points="9,6 16,12 9,18" fill="currentColor" opacity="0.3" stroke="currentColor" />
          <line x1="16" y1="6" x2="16" y2="18" />
          <path d="M12 15l-3 3" />
          <path d="M16 12h4" />
        </svg>
      )
    },
    {
      id: 'full-bridge-scr',
      title: 'Full-Bridge Controlled',
      subtitle: 'Fully Controlled (Slides 25-28)',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <line x1="8" y1="12" x2="16" y2="12" strokeDasharray="2 2" />
          <path d="M10 8l4 4-4 4" />
        </svg>
      )
    },
    {
      id: 'semi-converter',
      title: 'Semi-Controlled Rectifier',
      subtitle: '2 SCR + 2 Diode (Slide 29)',
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="2 2" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      )
    }
  ];

  const threePhaseTopologies: {
    id: RectifierTopology;
    title: string;
    subtitle: string;
  }[] = [
    {
      id: 'three-phase-diode',
      title: '3-Phase Diode Bridge',
      subtitle: '6-Diode (Slides 18-21)'
    },
    {
      id: 'three-phase-scr',
      title: '3-Phase Fully Controlled',
      subtitle: '6-Thyristor (Slides 30-33)'
    }
  ];

  const handleSetLoadType = (type: LoadType, defaultEmf = 0) => {
    setParams((prev) => ({
      ...prev,
      loadType: type,
      backEmf: defaultEmf,
      inductance: type === 'R' ? 0 : prev.inductance || 45
    }));
  };

  const toggleFwd = () => {
    setParams((prev) => ({
      ...prev,
      freewheelingDiode: !prev.freewheelingDiode
    }));
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col justify-between bg-[#070d1d] border-r border-slate-800 p-3 h-full select-none overflow-y-auto">
      <div className="flex flex-col gap-4">
        {/* 1. Single-Phase Rectifiers */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Single-Phase Converters</span>
          </div>

          <div className="flex flex-col gap-1">
            {singlePhaseTopologies.map((t) => {
              const isActive = currentTopology === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTopology(t.id)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/40 border border-blue-400/40'
                      : 'text-slate-300 hover:bg-slate-900/90 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <div className={isActive ? 'text-white' : 'text-slate-400'}>
                    {t.icon}
                  </div>
                  <div className="flex flex-col leading-tight truncate">
                    <span className="truncate">{t.title}</span>
                    <span className={`text-[10px] ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                      {t.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Three-Phase Rectifiers */}
        <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Three-Phase Converters</span>
          </div>

          <div className="flex flex-col gap-1">
            {threePhaseTopologies.map((t) => {
              const isActive = currentTopology === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTopology(t.id)}
                  className={`flex flex-col px-2.5 py-1.5 rounded-lg text-left text-xs transition-all ${
                    isActive
                      ? 'bg-amber-600/90 text-white font-semibold shadow-md border border-amber-400/40'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <span>{t.title}</span>
                  <span className={`text-[10px] ${isActive ? 'text-amber-100' : 'text-slate-500'}`}>
                    {t.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Advanced / Load Presets (Slides 7, 10, 12) */}
        <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
          <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Load Configuration
          </div>

          <div className="flex flex-col gap-1 text-xs">
            {/* R Load */}
            <button
              onClick={() => handleSetLoadType('R')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                params.loadType === 'R'
                  ? 'bg-slate-800 text-cyan-300 font-semibold border border-cyan-700/40'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <span className="font-mono text-xs">R</span>
              <span>Pure Resistive Load</span>
            </button>

            {/* RL Load */}
            <button
              onClick={() => handleSetLoadType('RL')}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                params.loadType === 'RL' && !params.backEmf
                  ? 'bg-slate-800 text-cyan-300 font-semibold border border-cyan-700/40'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <span className="font-mono text-xs">RL</span>
              <span>Inductive (RL) Load</span>
            </button>

            {/* RE Load Presets (Slide 12: 100V, 250V, 300V) */}
            <div className="flex flex-col gap-1 px-1 py-1 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>R-E Load (Slide 12)</span>
                <BatteryCharging className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[100, 250, 300].map((emf) => (
                  <button
                    key={emf}
                    onClick={() => handleSetLoadType('RLE', emf)}
                    className={`py-0.5 text-[10px] font-mono rounded text-center transition-colors ${
                      params.loadType === 'RLE' && params.backEmf === emf
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {emf}V
                  </button>
                ))}
              </div>
            </div>

            {/* Freewheeling Diode (FWD) */}
            <button
              onClick={toggleFwd}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                params.freewheelingDiode
                  ? 'bg-emerald-950/50 text-emerald-300 font-semibold border border-emerald-700/40'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <span>Freewheeling Diode</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                  params.freewheelingDiode
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {params.freewheelingDiode ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Change Source Modal */}
            <button
              onClick={onOpenSourceModal}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Change Source</span>
            </button>

            {/* Display Options */}
            <button
              onClick={onOpenDisplayModal}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Display Options</span>
            </button>
          </div>
        </div>
      </div>

      {/* Helpful Hint Card at Bottom (Matches Image 1) */}
      <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 text-xs flex items-start gap-2 shadow-md">
        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-[10px] leading-relaxed text-slate-400">
          Click on components to edit values. Current path and directional arrows are highlighted in real-time.
        </p>
      </div>
    </aside>
  );
};
