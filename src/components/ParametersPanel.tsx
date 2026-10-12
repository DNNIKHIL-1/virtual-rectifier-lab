import React from 'react';
import {
  CircuitParameters,
  LoadType,
  RectifierTopology
} from '../types/rectifier';
import { Play, Pause, RotateCcw, FastForward, Sliders } from 'lucide-react';

interface ParametersPanelProps {
  params: CircuitParameters;
  setParams: React.Dispatch<React.SetStateAction<CircuitParameters>>;
  topology: RectifierTopology;
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onStepForward: () => void;
  simSpeed: number;
  setSimSpeed: (speed: number) => void;
  animateCurrentFlow: boolean;
  setAnimateCurrentFlow: (val: boolean) => void;
}

export const ParametersPanel: React.FC<ParametersPanelProps> = ({
  params,
  setParams,
  topology,
  isRunning,
  onTogglePlay,
  onReset,
  onStepForward,
  simSpeed,
  setSimSpeed,
  animateCurrentFlow,
  setAnimateCurrentFlow
}) => {
  const isScr = topology.includes('scr');

  const updateParam = <K extends keyof CircuitParameters>(
    key: K,
    val: CircuitParameters[K]
  ) => {
    setParams((prev) => ({ ...prev, [key]: val }));
  };

  const alphaPresets = [0, 30, 45, 60, 90, 120];

  return (
    <div className="flex flex-col gap-4 bg-[#0b1329] border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Top Toggle: Animate Current Flow */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <span className="text-xs font-semibold text-slate-200">
          Animate Current Flow
        </span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={animateCurrentFlow}
            onChange={(e) => setAnimateCurrentFlow(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
        </label>
      </div>

      {/* ----------------- SOURCE PARAMETERS ----------------- */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Source Parameters
        </h4>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">RMS Voltage (V)</label>
            <input
              type="number"
              min={10}
              max={500}
              step={5}
              value={params.vRms}
              onChange={(e) => updateParam('vRms', Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">Frequency (Hz)</label>
            <input
              type="number"
              min={10}
              max={400}
              step={10}
              value={params.frequency}
              onChange={(e) => updateParam('frequency', Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Source Inductance Ls (Slides 34-37 Commutation Overlap) */}
        <div className="flex flex-col gap-1 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-slate-400">
              Source Inductance Ls (mH) <span className="text-[10px] text-slate-500">(Slide 34 overlap)</span>
            </label>
            <span className="font-mono text-[10px] text-cyan-400 font-bold">{params.sourceInductance || 0} mH</span>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={params.sourceInductance || 0}
              onChange={(e) => updateParam('sourceInductance', Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none w-20"
            />
            <div className="flex gap-1 flex-1">
              {[0, 1, 2, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => updateParam('sourceInductance', val)}
                  className={`flex-1 py-1 text-[10px] font-mono rounded border transition-colors ${
                    (params.sourceInductance || 0) === val
                      ? 'bg-cyan-700/80 text-white font-bold border-cyan-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {val}mH
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- LOAD PARAMETERS ----------------- */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Load Parameters
          </h4>
          {/* Quick Load Type Selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            {(['R', 'RL', 'RLE'] as LoadType[]).map((lt) => (
              <button
                key={lt}
                onClick={() => updateParam('loadType', lt)}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                  params.loadType === lt
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lt}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">Resistance R (Ω)</label>
            <input
              type="number"
              min={1}
              max={500}
              step={1}
              value={params.resistance}
              onChange={(e) => updateParam('resistance', Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">Inductance L (mH)</label>
            <input
              type="number"
              min={0}
              max={500}
              step={5}
              disabled={params.loadType === 'R'}
              value={params.loadType === 'R' ? 0 : params.inductance}
              onChange={(e) => updateParam('inductance', Number(e.target.value))}
              className={`bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none ${
                params.loadType === 'R' ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            />
          </div>
        </div>

        {/* Back-EMF E if RLE */}
        {params.loadType === 'RLE' && (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">DC Back-EMF E (V)</label>
            <input
              type="number"
              min={0}
              max={300}
              step={5}
              value={params.backEmf}
              onChange={(e) => updateParam('backEmf', Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>
        )}

        {/* Freewheeling Diode Switch */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/60">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-200">
                Freewheeling Diode (D_FW)
              </span>
              <span className="text-[9px] text-slate-400">
                {params.freewheelingDiode
                  ? 'Connected across load • Clamps negative Vo to 0V'
                  : 'Bypassed / Disconnected from circuit'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => updateParam('freewheelingDiode', !params.freewheelingDiode)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                params.freewheelingDiode ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  params.freewheelingDiode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- THYRISTOR FIRING ANGLE ALPHA (IF SCR) ----------------- */}
      {isScr && (
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              SCR Firing Angle (α)
            </h4>
            <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
              {params.firingAngle}°
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={180}
            step={1}
            value={params.firingAngle}
            onChange={(e) => updateParam('firingAngle', Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />

          <div className="flex items-center gap-1">
            {alphaPresets.map((a) => (
              <button
                key={a}
                onClick={() => updateParam('firingAngle', a)}
                className={`flex-1 py-1 text-[10px] font-mono rounded border transition-colors ${
                  params.firingAngle === a
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {a}°
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- DIODE / SCR FORWARD VOLTAGE ----------------- */}
      <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
        <label className="text-[11px] text-slate-400">
          Forward Voltage Vf (V) (Optional)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={3}
            step={0.1}
            value={params.forwardVoltage}
            onChange={(e) => updateParam('forwardVoltage', Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none w-28"
          />
          <button
            onClick={() => updateParam('forwardVoltage', params.forwardVoltage === 0 ? 0.7 : 0)}
            className="text-[11px] text-slate-400 hover:text-cyan-400 underline"
          >
            {params.forwardVoltage === 0 ? 'Set Ideal (0V)' : 'Set Real (0.7V)'}
          </button>
        </div>
      </div>

      {/* ----------------- SIMULATION PLAYBACK CONTROLS ----------------- */}
      <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-800">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onTogglePlay}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs shadow-lg transition-all ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>
        </div>

        {/* Speed & Step controls */}
        <div className="flex items-center justify-between gap-1 pt-1">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Speed:</span>
            {[0.1, 0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  simSpeed === s
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={onStepForward}
            title="Step +1 ms forward"
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 border border-slate-700"
          >
            <FastForward className="w-3 h-3" />
            <span>Step</span>
          </button>
        </div>
      </div>
    </div>
  );
};
